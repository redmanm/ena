// appointments/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useVisitors } from '@/lib/visitor-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedPage } from '@/components/protected-page';
import { StatusBadge } from '@/components/status-badge';
import { LocationBadge } from '@/components/location-badge';
import { usePermissions } from '@/lib/use-permissions';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import type { AppointmentStatus, Appointment, UserRole } from '@/lib/types';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock as ClockIcon,
  AlertCircle,
  Loader2,
  TrendingUp,
  Users,
  CalendarDays,
  Building2,
  Mail
} from 'lucide-react';

const statuses: AppointmentStatus[] = ['Scheduled', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#013c4c',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #013c4c 100%)',
  gradientHover: 'linear-gradient(135deg, #0198a2 0%, #023a48 100%)',
};

function filterByRole(
  list: Appointment[],
  role: UserRole,
  departmentId?: string
): Appointment[] {
  const today = new Date().toISOString().slice(0, 10);
  if (role === 'Manager' && departmentId) {
    return list.filter((a) => a.departmentId === departmentId);
  }
  if (role === 'Security') {
    return list.filter((a) => a.appointmentDate === today);
  }
  return list;
}

function AppointmentsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { can, role } = usePermissions();
  const { appointments, checkins, loading, refetch } = useVisitors();
  const [hostsById, setHostsById] = useState<Record<string, string>>({});
  const [departmentsById, setDepartmentsById] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'All'>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const itemsPerPage = 10;

  const scoped = useMemo(
    () => filterByRole(appointments, role ?? 'Viewer', user?.departmentId),
    [appointments, role, user?.departmentId]
  );

  useEffect(() => {
    (async () => {
      try {
        refetch(); // Ensure data is fresh
        const [usersRes, deptRes] = await Promise.all([
          fetch(user?.role === 'Admin' ? '/api/users' : '/api/users?role=Manager'),
          fetch('/api/departments'),
        ]);
        const usersJson = await usersRes.json();
        const deptJson = await deptRes.json();

        if (usersJson.data) {
          const hostMap = usersJson.data.reduce((acc: any, u: any) => {
            acc[u.id] = u.fullName;
            return acc;
          }, {});
          setHostsById(hostMap);
        }

        if (deptJson.data) {
          const deptMap = deptJson.data.reduce((acc: any, d: any) => {
            acc[d.id] = d.name;
            return acc;
          }, {});
          setDepartmentsById(deptMap);
        }
      } catch (err) {
        console.error('Failed to fetch hosts or departments', err);
      }
    })();
  }, [user, refetch]);

  const filtered = useMemo(() => {
    return scoped.filter((apt) => {
      const host = hostsById[apt.hostUserId] ?? '—';
      const department = departmentsById[apt.departmentId] ?? '—';
      const matchesSearch =
        !searchQuery ||
        apt.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || apt.status === selectedStatus;
      const matchesLocation = selectedLocation === 'All' || apt.location === selectedLocation;
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [scoped, searchQuery, selectedStatus, selectedLocation, hostsById, departmentsById]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => {
    console.log(`[Appointments] Role: ${role}, Total: ${appointments.length}, Scoped: ${scoped.length}, Filtered: ${filtered.length}`);
  }, [role, appointments.length, scoped.length, filtered.length]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    if (!user) return;
    const res = await fetch('/api/appointments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) await refetch();
  };

  const removeAppointment = async (id: string) => {
    if (!user) return;
    const res = await fetch(`/api/appointments?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) await refetch();
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCreatorName = (userId?: string) => {
    if (!userId) return 'System';
    return hostsById[userId] || 'Unknown User';
  };

  const viewer = role === 'Viewer';

  // Get stats for header
  const totalCount = filtered.length;
  const scheduledCount = filtered.filter(a => a.status === 'Scheduled').length;
  const todayCount = filtered.filter(a => a.appointmentDate === new Date().toISOString().slice(0, 10)).length;

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#00a2ad]/20 rounded-full animate-spin border-t-[#00a2ad]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#00a2ad] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: COLORS.gradient }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Appointments</h1>
              <p className="text-white/80">
                {role === 'Security' ? "Today's scheduled visits" :
                  role === 'Manager' ? 'Your department appointments' :
                    'Manage all appointments'}
              </p>
            </div>
            {can('create_appointment') && !viewer && (
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg rounded-xl">
                <Link href="/appointments/create">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  New Appointment
                </Link>
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Appointments</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <Calendar className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Scheduled</p>
                  <p className="text-2xl font-bold">{scheduledCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Today's Visits</p>
                  <p className="text-2xl font-bold">{todayCount}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by visitor, host, or department..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 rounded-lg border-gray-200 focus:border-[#00a2ad] focus:ring-[#00a2ad]/20"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 rounded-lg"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(selectedLocation !== 'All' || selectedStatus !== 'All') && (
              <span className="w-2 h-2 rounded-full bg-[#00a2ad]" />
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#00a2ad] focus:outline-none focus:ring-1 focus:ring-[#00a2ad]"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Locations</option>
                <option value="ENA">ENA</option>
                <option value="POA">POA</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#00a2ad] focus:outline-none focus:ring-1 focus:ring-[#00a2ad]"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as AppointmentStatus | 'All');
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Status</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === 'CheckedIn' ? 'Checked In' : s === 'CheckedOut' ? 'Checked Out' : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(selectedLocation !== 'All' || selectedStatus !== 'All') && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedLocation !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00a2ad]/10 text-[#00a2ad] rounded-full text-xs">
                Location: {selectedLocation}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#013c4c]"
                  onClick={() => setSelectedLocation('All')}
                />
              </span>
            )}
            {selectedStatus !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00a2ad]/10 text-[#00a2ad] rounded-full text-xs">
                Status: {selectedStatus}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#013c4c]"
                  onClick={() => setSelectedStatus('All')}
                />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: COLORS.gradient }}>
              <tr>
                <th className="text-left p-4 text-white font-semibold">#</th>
                <th className="text-left p-4 text-white font-semibold">Visitor</th>
                <th className="text-left p-4 text-white font-semibold">Host / Department</th>
                <th className="text-left p-4 text-white font-semibold">Date & Time</th>
                <th className="text-left p-4 text-white font-semibold">Location</th>
                <th className="text-left p-4 text-white font-semibold">Status</th>
                {!viewer && <th className="text-right p-4 text-white font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((apt, idx) => (
                  <React.Fragment key={apt.id}>
                    <tr className={cn(
                      "border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 cursor-pointer",
                      expandedRows[apt.id] && "bg-teal-50/30"
                    )}
                      onClick={() => toggleRow(apt.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                          <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", expandedRows[apt.id] && "rotate-90")} />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: COLORS.gradient }}>
                            {apt.visitorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{apt.visitorName}</p>
                            {apt.visitorEmail && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {apt.visitorEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: COLORS.gradient }}>
                              {(hostsById[apt.hostUserId] ?? '?').charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{hostsById[apt.hostUserId] ?? '—'}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <Building2 className="w-3 h-3" />
                            {departmentsById[apt.departmentId] ?? '—'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{apt.appointmentDate}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{apt.appointmentTime}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <LocationBadge location={apt.location} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={apt.status} />
                      </td>
                      {!viewer && (
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => router.push(`/appointments/create?edit=${apt.id}`)}
                              className="p-2 text-gray-400 hover:text-[#00a2ad] transition-colors rounded-lg hover:bg-[#00a2ad]/10"
                              title="Edit Appointment"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {apt.status !== 'Cancelled' && apt.status !== 'CheckedOut' && (
                              <button
                                onClick={() => updateStatus(apt.id, 'Cancelled')}
                                className="p-2 text-gray-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-500/10"
                                title="Cancel Appointment"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            {can('view_all_appointments') && apt.status !== 'CheckedIn' && (
                              <button
                                onClick={() => setShowDeleteConfirm(apt.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                                title="Delete Appointment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedRows[apt.id] && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={!viewer ? 7 : 6} className="p-0 border-b border-gray-100">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                            {/* Visitor Details */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visitor Profile</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Phone:</span>
                                  <span className="font-medium text-gray-900">{apt.visitorPhone || '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Company:</span>
                                  <span className="font-medium text-gray-900">{apt.visitorCompany || '—'}</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-sm text-gray-500">Purpose:</span>
                                  <p className="text-sm text-gray-700 bg-white p-2 rounded-lg border border-gray-100">{apt.purpose || 'No purpose specified'}</p>
                                </div>
                                {apt.otherVisitorNames && apt.otherVisitorNames.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-sm text-gray-500">Other Visitors:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {apt.otherVisitorNames.map((name, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium">{name}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Check-in Details */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Check-in Info</h4>
                              {(() => {
                                const checkin = checkins.find(c => c.appointmentId === apt.id);
                                if (!checkin) return <p className="text-sm text-gray-400 italic">Not yet checked in</p>;
                                return (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Check-in:</span>
                                      <span className="font-medium text-gray-900">{new Date(checkin.checkInTime).toLocaleString()}</span>
                                    </div>
                                    {checkin.checkOutTime && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Check-out:</span>
                                        <span className="font-medium text-gray-900">{new Date(checkin.checkOutTime).toLocaleString()}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Badge:</span>
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{checkin.badgeNumber || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Car / Vehicle:</span>
                                      <span className="font-medium text-gray-900">{checkin.hasCar ? `Yes (${checkin.plateNumber || 'No Plate'})` : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Materials:</span>
                                      <span className="font-medium text-gray-900">{checkin.hasMaterial ? checkin.materialsName : 'None'}</span>
                                    </div>
                                    {checkin.additionalVisitors && checkin.additionalVisitors.length > 0 && (
                                      <div className="space-y-1 mt-2">
                                        <span className="text-sm text-gray-500">Additional Visitors (Check-in):</span>
                                        <div className="flex flex-col gap-1 mt-1 ml-4 border-l-2 border-blue-200 pl-3">
                                          {checkin.additionalVisitors.map((name, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                                              <div className="w-1 h-1 rounded-full bg-blue-400" />
                                              {name}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Forensic / Audit Metadata */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Audit Metadata</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Created By:</span>
                                  <span className="font-medium text-gray-900">{getCreatorName(apt.createdBy)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Created At:</span>
                                  <span className="font-medium text-gray-900">{new Date(apt.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Last Update:</span>
                                  <span className="font-medium text-gray-900">{new Date(apt.updatedAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Location Code:</span>
                                  <span className="font-mono text-xs font-bold text-teal-600">{apt.location}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
              )) : (
                <tr>
                  <td colSpan={!viewer ? 7 : 6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">No appointments found</h3>
                      <p className="text-gray-500 text-sm">No appointments match your current filters</p>
                      {(selectedLocation !== 'All' || selectedStatus !== 'All' || searchQuery) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedLocation('All');
                            setSelectedStatus('All');
                          }}
                          className="mt-2"
                        >
                          Clear all filters
                        </Button>
                      )}
                      {can('create_appointment') && !viewer && (
                        <Button asChild className="mt-2" style={{ background: COLORS.gradient }}>
                          <Link href="/appointments/create">Create your first appointment</Link>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="rounded-lg"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-lg w-9 ${currentPage === pageNum ? 'text-white' : ''}`}
                      style={currentPage === pageNum ? { background: COLORS.gradient } : {}}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="rounded-lg"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Appointment</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this appointment? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="rounded-lg">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await removeAppointment(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="rounded-lg bg-red-600 hover:bg-red-700"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <ProtectedPage requiredRoles={['Admin', 'Manager', 'Reception', 'Security', 'Viewer']}>
      <AppointmentsContent />
    </ProtectedPage>
  );
}