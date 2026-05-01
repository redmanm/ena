'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useVisitors } from '@/lib/visitor-context';
import { ProtectedPage } from '@/components/protected-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationBadge } from '@/components/location-badge';
import { StatusBadge } from '@/components/status-badge';
import type { Department, User } from '@/lib/types';
import {
  Search,
  Download,
  Calendar,
  Clock,
  User as UserIcon,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  Clock as ClockIcon,
  AlertCircle,
  Loader2,
  Filter,
  X,
  Eye,
  Car,
  Package,
  UserPlus,
  Badge,
  Info,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  FileBarChart,
  Table as TableIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#013c4c',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #013c4c 100%)',
  gradientHover: 'linear-gradient(135deg, #0198a2 0%, #023a48 100%)',
};

interface CheckinDetails {
  id: string;
  appointmentId: string;
  hasCar: boolean;
  plateNumber: string | null;
  hasMaterial: boolean;
  materialsName: string | null;
  additionalVisitors: any[];
  badgeNumber: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  checkedInBy: string | null;
  checkedOutBy: string | null;
}

function VisitHistoryContent() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialStatus = searchParams?.get('status') || 'all';
  
  const { appointments, checkins } = useVisitors();
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hostsById, setHostsById] = useState<Record<string, string>>({});
  const [usersById, setUsersById] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [showFilters, setShowFilters] = useState(initialStatus !== 'all');
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinDetails | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    (async () => {
      try {
        const [dRes, uRes, allUsersRes] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/users?role=Manager'),
          fetch('/api/users')
        ]);
        const dj = await dRes.json();
        const uj = await uRes.json();
        const allUsers = await allUsersRes.json();

        setDepartments(dj.data ?? []);

        const hostMap: Record<string, string> = {};
        (uj.data as User[] | undefined)?.forEach((u) => (hostMap[u.id] = u.fullName));
        setHostsById(hostMap);

        const userMap: Record<string, string> = {};
        (allUsers.data as User[] | undefined)?.forEach((u) => (userMap[u.id] = u.fullName));
        setUsersById(userMap);
      } catch {
        // ignore
      }
    })();
  }, []);

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? '—';

  const rows = useMemo(() => {
    return checkins
      .map((c) => {
        const apt = appointments.find((a) => a.id === c.appointmentId);
        if (!apt) return null;
        return { c, apt };
      })
      .filter(Boolean) as { c: (typeof checkins)[0]; apt: (typeof appointments)[0] }[];
  }, [checkins, appointments]);

  const filtered = useMemo(() => {
    let filteredRows = rows;

    // Search filter
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      filteredRows = filteredRows.filter(({ apt }) =>
        apt.visitorName.toLowerCase().includes(s) ||
        hostsById[apt.hostUserId]?.toLowerCase().includes(s) ||
        deptName(apt.departmentId).toLowerCase().includes(s)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().slice(0, 10);
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisWeekStr = thisWeek.toISOString().slice(0, 10);
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      const thisMonthStr = thisMonth.toISOString().slice(0, 10);

      filteredRows = filteredRows.filter(({ c }) => {
        const checkinDate = c.checkInTime.slice(0, 10);
        if (dateFilter === 'today') return checkinDate === today;
        if (dateFilter === 'week') return checkinDate >= thisWeekStr;
        if (dateFilter === 'month') return checkinDate >= thisMonthStr;
        return true;
      });
    }

    // Location filter
    if (locationFilter !== 'all') {
      filteredRows = filteredRows.filter(({ apt }) => apt.location === locationFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filteredRows = filteredRows.filter(({ apt }) => apt.status === statusFilter);
    }

    return filteredRows;
  }, [rows, searchQuery, dateFilter, locationFilter, statusFilter, hostsById]);

  // Statistics
  const stats = {
    total: filtered.length,
    today: filtered.filter(({ c }) => c.checkInTime.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    withCar: filtered.filter(({ c }) => c.hasCar).length,
    withMaterial: filtered.filter(({ c }) => c.hasMaterial).length,
  };

  const getExportData = () => {
    return filtered.map(({ c, apt }) => {
      const checkinTime = new Date(c.checkInTime);
      const checkoutTime = c.checkOutTime ? new Date(c.checkOutTime) : null;
      const duration = checkoutTime
        ? Math.round((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60))
        : '—';

      return {
        Visitor: apt.visitorName,
        Department: deptName(apt.departmentId),
        Host: hostsById[apt.hostUserId] ?? '—',
        Location: apt.location,
        'Appointment Date': apt.appointmentDate,
        'Check-in Time': checkinTime.toLocaleString(),
        'Check-out Time': checkoutTime ? checkoutTime.toLocaleString() : '—',
        'Duration (min)': duration,
        'Badge Number': c.badgeNumber ?? '—',
        'Has Car': c.hasCar ? 'Yes' : 'No',
        'Plate Number': c.plateNumber ?? '—',
        'Has Material': c.hasMaterial ? 'Yes' : 'No',
        'Material Name': c.materialsName ?? '—',
        Status: apt.status,
      };
    });
  };

  const downloadCsv = () => {
    const data = getExportData();
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ENA_VisitHistory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visit History');
    XLSX.writeFile(wb, `ENA_VisitHistory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadPdf = () => {
    const data = getExportData();
    const doc = new jsPDF('landscape');
    doc.text('ENA Visitor Management System - Visit History', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableHeaders = ['Visitor', 'Dept', 'Host', 'Loc', 'Check-in', 'Check-out', 'Badge', 'Status'];
    const tableRows = data.map(d => [
      d.Visitor,
      d.Department,
      d.Host,
      d.Location,
      d['Check-in Time'],
      d['Check-out Time'],
      d['Badge Number'],
      d.Status
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: '#00a2ad' },
      styles: { fontSize: 8 },
    });

    doc.save(`ENA_VisitHistory_${new Date().toISOString().slice(0, 10)}.pdf`);
  };



  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || dateFilter !== 'all' || locationFilter !== 'all' || statusFilter !== 'all';

  const openDetailsModal = (checkin: any, appointment: any) => {
    setSelectedCheckin({
      id: checkin.id,
      appointmentId: checkin.appointmentId,
      hasCar: checkin.hasCar,
      plateNumber: checkin.plateNumber,
      hasMaterial: checkin.hasMaterial,
      materialsName: checkin.materialsName,
      additionalVisitors: checkin.additionalVisitors || [],
      badgeNumber: checkin.badgeNumber,
      checkInTime: checkin.checkInTime,
      checkOutTime: checkin.checkOutTime,
      checkedInBy: checkin.checkedInBy,
      checkedOutBy: checkin.checkedOutBy,
    });
  };

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedRows = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 pb-12">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: COLORS.gradient }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 tracking-tight">Visit History & Audit</h1>
              <p className="text-white/80">Track and manage all visitor check-ins and check-outs</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg rounded-xl gap-2 backdrop-blur-sm">
                  <Download className="w-4 h-4" />
                  Export History
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadCsv} className="gap-2 cursor-pointer">
                  <FileBarChart className="w-4 h-4 text-orange-500" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadExcel} className="gap-2 cursor-pointer">
                  <TableIcon className="w-4 h-4 text-green-600" />
                  Download Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPdf} className="gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-red-500" />
                  Download PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Visits</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Today's Visits</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <Calendar className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">With Vehicle</p>
                  <p className="text-2xl font-bold">{stats.withCar}</p>
                </div>
                <Car className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">With Materials</p>
                  <p className="text-2xl font-bold">{stats.withMaterial}</p>
                </div>
                <Package className="w-8 h-8 text-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
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
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#00a2ad]" />
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date Range</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#00a2ad] focus:outline-none focus:ring-1 focus:ring-[#00a2ad]"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#00a2ad] focus:outline-none focus:ring-1 focus:ring-[#00a2ad]"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Locations</option>
                <option value="ENA">ENA</option>
                <option value="POA">POA</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#00a2ad] focus:outline-none focus:ring-1 focus:ring-[#00a2ad]"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="CheckedIn">Checked In</option>
                <option value="CheckedOut">Checked Out</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00a2ad]/10 text-[#00a2ad] rounded-full text-xs">
                Search: {searchQuery}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#013c4c]"
                  onClick={() => setSearchQuery('')}
                />
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00a2ad]/10 text-[#00a2ad] rounded-full text-xs">
                Date: {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#013c4c]"
                  onClick={() => setDateFilter('all')}
                />
              </span>
            )}
            {locationFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00a2ad]/10 text-[#00a2ad] rounded-full text-xs">
                Location: {locationFilter}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#013c4c]"
                  onClick={() => setLocationFilter('all')}
                />
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00a2ad]/10 text-[#00a2ad] rounded-full text-xs">
                Status: {statusFilter}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#013c4c]"
                  onClick={() => setStatusFilter('all')}
                />
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-red-500"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Visit History Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: COLORS.gradient }}>
              <tr>
                <th className="text-left p-4 text-white font-semibold">#</th>
                <th className="text-left p-4 text-white font-semibold">Visitor</th>
                <th className="text-left p-4 text-white font-semibold">Department / Host</th>
                <th className="text-left p-4 text-white font-semibold">Location</th>
                <th className="text-left p-4 text-white font-semibold">Check-in Time</th>
                <th className="text-left p-4 text-white font-semibold">Check-out Time</th>
                <th className="text-left p-4 text-white font-semibold">Duration</th>
                <th className="text-left p-4 text-white font-semibold">Badge</th>
                <th className="text-left p-4 text-white font-semibold">Status</th>
                <th className="text-center p-4 text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? paginatedRows.map(({ c, apt }, idx) => {
                const checkinTime = new Date(c.checkInTime);
                const checkoutTime = c.checkOutTime ? new Date(c.checkOutTime) : null;
                const duration = checkoutTime
                  ? Math.round((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60))
                  : null;

                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-all duration-200">
                    <td className="p-4 text-gray-500 font-medium">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: COLORS.gradient }}>
                          {apt.visitorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{apt.visitorName}</p>
                          {apt.visitorCompany && (
                            <p className="text-xs text-gray-500 mt-0.5">{apt.visitorCompany}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{deptName(apt.departmentId)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-gray-600">
                          <UserIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">{hostsById[apt.hostUserId] ?? '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <LocationBadge location={apt.location} />
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{checkinTime.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{checkinTime.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {checkoutTime ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{checkoutTime.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{checkoutTime.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {duration !== null ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                          <ClockIcon className="w-3 h-3 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">{duration} min</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {c.badgeNumber ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg">
                          <Badge className="w-3 h-3 text-purple-600" />
                          <span className="text-sm font-mono text-purple-700">{c.badgeNumber}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openDetailsModal(c, apt)}
                        className="p-2 text-gray-400 hover:text-[#00a2ad] transition-colors rounded-lg hover:bg-[#00a2ad]/10"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">No visit history found</h3>
                      <p className="text-gray-500 text-sm">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'No check-ins have been recorded yet'}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="mt-2"
                        >
                          Clear all filters
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} records
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

      {/* Details Modal */}
      {selectedCheckin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            {/* Modal Header */}
            <div className="sticky top-0 px-6 py-4 border-b flex items-center justify-between" style={{ background: COLORS.gradient }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Visit Details</h3>
              </div>
              <button
                onClick={() => setSelectedCheckin(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Check-in/out Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Check-in Information</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-600">Time:</span>{' '}
                      <span className="font-medium">{new Date(selectedCheckin.checkInTime).toLocaleString()}</span>
                    </p>
                    {selectedCheckin.checkedInBy && (
                      <p className="text-sm">
                        <span className="text-gray-600">Checked in by:</span>{' '}
                        <span className="font-medium">{usersById[selectedCheckin.checkedInBy] || 'Unknown'}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Check-out Information</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedCheckin.checkOutTime ? (
                      <>
                        <p className="text-sm">
                          <span className="text-gray-600">Time:</span>{' '}
                          <span className="font-medium">{new Date(selectedCheckin.checkOutTime).toLocaleString()}</span>
                        </p>
                        {selectedCheckin.checkedOutBy && (
                          <p className="text-sm">
                            <span className="text-gray-600">Checked out by:</span>{' '}
                            <span className="font-medium">{usersById[selectedCheckin.checkedOutBy] || 'Unknown'}</span>
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Not checked out yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-5 h-5 text-[#00a2ad]" />
                  <h4 className="font-semibold text-gray-900">Vehicle Information</h4>
                </div>
                {selectedCheckin.hasCar ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Has Vehicle</p>
                      <p className="text-sm font-medium text-green-600">Yes</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Plate Number</p>
                      <p className="text-sm font-mono font-medium">{selectedCheckin.plateNumber || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No vehicle registered</p>
                )}
              </div>

              {/* Material Information */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-[#00a2ad]" />
                  <h4 className="font-semibold text-gray-900">Material Information</h4>
                </div>
                {selectedCheckin.hasMaterial ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Has Materials</p>
                    <p className="text-sm font-medium text-green-600 mb-2">Yes</p>
                    {selectedCheckin.materialsName && (
                      <div>
                        <p className="text-xs text-gray-500">Material Details</p>
                        <p className="text-sm font-medium">{selectedCheckin.materialsName}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No materials registered</p>
                )}
              </div>

              {/* Additional Visitors */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="w-5 h-5 text-[#00a2ad]" />
                  <h4 className="font-semibold text-gray-900">Additional Visitors</h4>
                </div>
                {selectedCheckin.additionalVisitors && selectedCheckin.additionalVisitors.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCheckin.additionalVisitors.map((visitor: any, idx: number) => {
                      const name = typeof visitor === 'string' ? visitor : (visitor?.name || 'Unknown');
                      return (
                        <div key={idx} className="flex items-center gap-2 py-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00a2ad]" />
                          <span className="text-sm font-medium text-gray-700">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No additional visitors</p>
                )}
              </div>

              {/* Badge Information */}
              {selectedCheckin.badgeNumber && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Badge className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-purple-600">Badge Number</p>
                      <p className="text-lg font-mono font-bold text-purple-700">{selectedCheckin.badgeNumber}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t bg-gray-50 flex justify-end">
              <Button
                onClick={() => setSelectedCheckin(null)}
                className="rounded-lg"
                style={{ background: COLORS.gradient }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
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
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function VisitHistoryPage() {
  return (
    <ProtectedPage requiredRoles={['Admin', 'Manager', 'Reception', 'Security', 'Viewer']}>
      <VisitHistoryContent />
    </ProtectedPage>
  );
}