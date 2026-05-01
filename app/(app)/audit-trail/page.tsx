'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedPage } from '@/components/protected-page';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ShieldAlert,
  Search,
  User as UserIcon,
  Filter,
  History,
  Calendar as CalendarIcon,
  Info,
  Clock,
  Layout,
  ChevronRight,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Database,
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  LogIn,
  LogOut,
  Settings,
  Building2,
  CalendarDays,
  FileText,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#013c4c',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #013c4c 100%)',
};

function AuditTrailContent() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [entityType, setEntityType] = useState<string>('All');
  const [actionType, setActionType] = useState<string>('All');
  const [userId, setUserId] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const load = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType !== 'All') params.set('entityType', entityType);
      if (actionType !== 'All') params.set('action', actionType);
      if (userId) params.set('userId', userId);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      const res = await fetch(`/api/audit-logs?${params.toString()}&limit=200`);
      const j = await res.json();
      if (j.data) {
        setLogs(j.data);
        setFilteredLogs(j.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...logs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        (log.userName?.toLowerCase() || '').includes(q) ||
        (log.entityType?.toLowerCase() || '').includes(q) ||
        (log.action?.toLowerCase() || '').includes(q) ||
        (log.entityId?.toLowerCase() || '').includes(q)
      );
    }

    if (actionType && actionType !== 'All') {
      filtered = filtered.filter(log => log.action === actionType);
    }

    if (entityType && entityType !== 'All') {
      filtered = filtered.filter(log => log.entityType === entityType);
    }

    if (userId) {
      filtered = filtered.filter(log => log.userId === userId);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [searchQuery, actionType, entityType, userId, logs]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users');
        const j = await res.json();
        setUsers((j.data ?? []).map((u: any) => ({ id: u.id, fullName: u.fullName })));
      } catch {
        // ignore
      }
    })();
  }, []);

  const entityTypes = useMemo(() => {
    const s = new Set(logs.map((l) => l.entityType));
    return ['All', ...Array.from(s).filter(Boolean)];
  }, [logs]);

  const actionTypes = useMemo(() => {
    const s = new Set(logs.map((l) => l.action));
    return ['All', ...Array.from(s).filter(Boolean)];
  }, [logs]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getActionIcon = (action: string) => {
    const act = action?.toUpperCase() || '';
    if (act.includes('CREATE')) return <UserPlus className="w-4 h-4" />;
    if (act.includes('UPDATE')) return <Edit className="w-4 h-4" />;
    if (act.includes('DELETE')) return <Trash2 className="w-4 h-4" />;
    if (act.includes('LOGIN')) return <LogIn className="w-4 h-4" />;
    if (act.includes('LOGOUT')) return <LogOut className="w-4 h-4" />;
    if (act.includes('PASSWORD')) return <RefreshCw className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    const act = action?.toUpperCase() || '';
    if (act.includes('CREATE')) return 'bg-green-100 text-green-700';
    if (act.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
    if (act.includes('DELETE')) return 'bg-red-100 text-red-700';
    if (act.includes('LOGIN')) return 'bg-purple-100 text-purple-700';
    if (act.includes('LOGOUT')) return 'bg-orange-100 text-orange-700';
    if (act.includes('PASSWORD')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  // Statistics
  const stats = {
    total: filteredLogs.length,
    creates: filteredLogs.filter(l => l.action === 'CREATE').length,
    updates: filteredLogs.filter(l => l.action === 'UPDATE').length,
    deletes: filteredLogs.filter(l => l.action === 'DELETE').length,
    today: filteredLogs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: COLORS.gradient }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -ml-40 -mb-40"></div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-6 h-6" />
                <span className="text-sm font-semibold tracking-wider">SYSTEM AUDIT TRAIL</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Activity Monitoring</h1>
              <p className="text-white/80">Complete history of all system actions and changes</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={load} variant="outline" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-white/60 text-xs">Total Events</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-white/60 text-xs">Today</p>
              <p className="text-2xl font-bold">{stats.today}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-white/60 text-xs">Creates</p>
              <p className="text-2xl font-bold text-green-400">{stats.creates}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-white/60 text-xs">Updates</p>
              <p className="text-2xl font-bold text-blue-400">{stats.updates}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-white/60 text-xs">Deletes</p>
              <p className="text-2xl font-bold text-red-400">{stats.deletes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by user, action, entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg border-gray-200 focus:border-[#00a2ad]"
              />
            </div>
          </div>
          <div>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#00a2ad]"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              {entityTypes.map((t) => (
                <option key={t} value={t}>{t === 'All' ? 'All Entities' : t}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#00a2ad]"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            >
              {actionTypes.map((a) => (
                <option key={a} value={a}>{a === 'All' ? 'All Actions' : a}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#00a2ad]"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            type="date"
            placeholder="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border-gray-200"
          />
          <Input
            type="date"
            placeholder="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border-gray-200"
          />
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <Button
            onClick={() => {
              setSearchQuery('');
              setEntityType('All');
              setActionType('All');
              setUserId('');
              setFromDate('');
              setToDate('');
            }}
            variant="outline"
            className="gap-2"
          >
            Clear Filters
          </Button>
          <Button onClick={load} style={{ background: COLORS.gradient }} className="text-white">
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00a2ad]" />
                    <p className="text-gray-500">Loading activity logs...</p>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <History className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">No activity found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, idx) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-gray-50 transition-colors group cursor-pointer ${expandedRow === log.id ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <td className="p-4 text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="p-4">
                        <div className="text-sm text-gray-700">{formatDate(log.createdAt)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00a2ad] to-[#013c4c] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {log.userName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{log.userName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600 font-medium">{log.entityType}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`p-2 rounded-lg transition-all ${expandedRow === log.id ? 'bg-[#00a2ad] text-white shadow-md' : 'text-gray-400 group-hover:text-[#00a2ad] group-hover:bg-gray-100'}`}>
                          {expandedRow === log.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={6} className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Info className="w-4 h-4 text-[#00a2ad]" />
                              <span className="text-sm font-semibold text-gray-700">Change Details</span>
                            </div>

                            {log.oldValues || log.newValues ? (
                              <div className="bg-white rounded-lg border p-4">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-semibold text-gray-600">Field</th>
                                        <th className="text-left py-2 font-semibold text-red-600">Old Value</th>
                                        <th className="text-left py-2 font-semibold text-green-600">New Value</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.keys(log.newValues || {})
                                        .filter(k =>
                                          !k.includes('id') &&
                                          !k.includes('created_at') &&
                                          !k.includes('updated_at') &&
                                          k !== 'password_hash' &&
                                          k !== 'password'
                                        )
                                        .map((key) => {
                                          const oldVal = log.oldValues?.[key];
                                          const newVal = log.newValues?.[key];
                                          const isChanged = String(oldVal) !== String(newVal);

                                          return (
                                            <tr key={key} className={`border-b border-gray-100 transition-colors ${isChanged ? 'bg-amber-50/30' : ''}`}>
                                              <td className="py-3 px-2 font-medium text-gray-700 w-1/4">
                                                <div className="flex items-center gap-2">
                                                  {isChanged && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                                  {key.replace(/_/g, ' ')}
                                                </div>
                                              </td>
                                              <td className={`py-3 px-4 w-3/8 ${isChanged ? 'bg-red-50/50 font-bold text-red-700' : 'text-gray-500'}`}>
                                                <div className="line-clamp-2" title={String(oldVal || '—')}>
                                                  {String(oldVal || '—')}
                                                </div>
                                              </td>
                                              <td className={`py-3 px-4 w-3/8 ${isChanged ? 'bg-green-50/50 font-bold text-green-700' : 'text-gray-500'}`}>
                                                <div className="line-clamp-2" title={String(newVal || '—')}>
                                                  {String(newVal || '—')}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No detailed change information available</p>
                            )}

                            {log.userAgent && (
                              <div className="text-xs text-gray-400 flex items-center gap-4 pt-2 border-t">
                                <span className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3" />
                                  IP Address: {log.ipAddress || 'Internal'}
                                </span>
                                <span className="flex items-center gap-2">
                                  <Database className="w-3 h-3" />
                                  Reference ID: {log.entityId}
                                </span>
                                <span className="flex items-center gap-2">
                                  <Layout className="w-3 h-3" />
                                  Browser: {log.userAgent.split(') ')[0].split(' (')[1] || 'Unknown'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="border-t px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="rounded-lg gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
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
                className="rounded-lg gap-1"
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
          <ShieldAlert className="w-3 h-3" />
          All actions are logged and immutable for security compliance
        </p>
      </div>
    </div>
  );
}

export default function AuditTrailPage() {
  return (
    <ProtectedPage requiredRoles={['Admin', 'Manager']}>
      <AuditTrailContent />
    </ProtectedPage>
  );
}