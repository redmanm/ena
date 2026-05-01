// page.tsx - Departments with Beautiful Centered Modals
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedPage } from '@/components/protected-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Department, User } from '@/lib/types';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  User as UserIcon,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  Briefcase,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserCheck,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Crown,
  Shield,
  Zap
} from 'lucide-react';

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#013c4c',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #013c4c 100%)',
  gradientHover: 'linear-gradient(135deg, #0198a2 0%, #023a48 100%)',
};

function DepartmentsContent() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [createSuccess, setCreateSuccess] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dRes, uRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/users')
      ]);
      const dj = await dRes.json();
      const uj = await uRes.json();
      if (!dRes.ok) throw new Error(dj.error || 'Failed to fetch departments');
      if (!uRes.ok) throw new Error(uj.error || 'Failed to fetch users');
      setDepartments(dj.data || []);
      setUsers(uj.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAndSortedDepartments = useMemo(() => {
    let filtered = departments;
    if (searchQuery) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dept.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sortBy === 'created') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'status') {
        const statusA = a.managerId ? 1 : 0;
        const statusB = b.managerId ? 1 : 0;
        return sortOrder === 'asc' ? statusA - statusB : statusB - statusA;
      }
      return 0;
    });

    return filtered;
  }, [departments, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredAndSortedDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isDeptActive = (dept: Department) => Boolean(dept.managerId);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Department name is required');
      return;
    }
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name.trim(), description: formData.description || null, status: 'Active' }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to create');
      setDepartments((prev) => [j.data, ...prev]);
      setFormData({ name: '', description: '' });
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 2000);
      setIsCreating(false);
      setCurrentPage(1);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create department');
    }
  };

  const handleUpdate = async () => {
    if (!editingDept || !formData.name.trim()) {
      alert('Department name is required');
      return;
    }
    try {
      const res = await fetch('/api/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingDept.id, name: formData.name.trim(), description: formData.description || null }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to update');
      setDepartments((prev) => prev.map((d) => (d.id === editingDept.id ? j.data : d)));
      setFormData({ name: '', description: '' });
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 2000);
      setEditingDept(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update department');
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      const res = await fetch(`/api/departments?id=${encodeURIComponent(deletingDept.id)}`, {
        method: 'DELETE',
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to delete');
      setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 2000);
      setDeletingDept(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete department');
    }
  };

  const openEditModal = (dept: Department) => {
    setFormData({ name: dept.name, description: dept.description || '' });
    setEditingDept(dept);
  };

  const stats = {
    total: departments.length,
    active: departments.filter(isDeptActive).length,
    inactive: departments.filter(d => !isDeptActive(d)).length,
    withManagers: departments.filter(d => d.managerId).length,
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-700 font-medium">{error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-2">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Success Toasts */}
      {createSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Department created successfully!</span>
          </div>
        </div>
      )}
      {editSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="bg-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Department updated successfully!</span>
          </div>
        </div>
      )}
      {deleteSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <Trash2 className="w-5 h-5" />
            <span className="font-semibold">Department deleted successfully!</span>
          </div>
        </div>
      )}

      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: COLORS.gradient }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-6 h-6" />
                <span className="text-sm font-semibold tracking-wider">ORGANIZATION STRUCTURE</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Department Management</h1>
              <p className="text-white/80">Manage organization departments, managers, and team assignments</p>
            </div>
            <Button
              onClick={() => { setFormData({ name: '', description: '' }); setIsCreating(true); }}
              className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg rounded-xl group transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Add Department
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div><p className="text-white/60 text-sm">Total Departments</p><p className="text-2xl font-bold">{stats.total}</p></div>
                <Building2 className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div><p className="text-white/60 text-sm">Active</p><p className="text-2xl font-bold">{stats.active}</p></div>
                <CheckCircle className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div><p className="text-white/60 text-sm">With Managers</p><p className="text-2xl font-bold">{stats.withManagers}</p></div>
                <UserCheck className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div><p className="text-white/60 text-sm">Inactive</p><p className="text-2xl font-bold">{stats.inactive}</p></div>
                <AlertCircle className="w-8 h-8 text-white/40" />
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
                placeholder="Search departments by name or description..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10 rounded-lg border-gray-200 focus:border-[#00a2ad] focus:ring-[#00a2ad]/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00a2ad]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name">Sort by Name</option>
              <option value="created">Sort by Created Date</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Departments Table */}
      {paginatedDepartments.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedDepartments.map((dept, idx) => {
                    const manager = users.find((u) => u.id === dept.managerId);
                    const isActive = isDeptActive(dept);
                    return (
                      <tr key={dept.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4"><span className="text-sm font-medium text-gray-400">{(currentPage - 1) * itemsPerPage + idx + 1}</span></td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: COLORS.gradient }}>
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{dept.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{dept.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {dept.description || <span className="text-gray-400 italic">No description</span>}
                          </p>
                        </td>
                        <td className="p-4">
                          {manager ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: COLORS.gradient }}>
                                {manager.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{manager.fullName}</p>
                                <p className="text-xs text-gray-400">{manager.email}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-orange-600">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs">Not Assigned</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isActive ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(dept.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(dept)}
                              className="p-2 text-gray-400 hover:text-[#00a2ad] transition-colors rounded-lg hover:bg-[#00a2ad]/10"
                              title="Edit Department"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingDept(dept)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                              title="Delete Department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 flex-wrap bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedDepartments.length)} of {filteredAndSortedDepartments.length} departments
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="rounded-lg gap-1">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)} className={`rounded-lg w-9 ${currentPage === pageNum ? 'text-white' : ''}`} style={currentPage === pageNum ? { background: COLORS.gradient } : {}}>
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="rounded-lg gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No departments found</p>
            <p className="text-gray-400 text-sm">
              {searchQuery ? 'Try a different search term' : 'Click "Add Department" to create your first department'}
            </p>
            {searchQuery && <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-2">Clear Search</Button>}
          </div>
        </div>
      )}

      {/* ========== CREATE MODAL - Beautiful Centered ========== */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="relative overflow-hidden p-6 text-white" style={{ background: COLORS.gradient }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Create Department</h3>
                  <p className="text-white/80 text-sm">Add a new department to the organization</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Human Resources, IT, Finance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:border-[#00a2ad] focus:ring-[#00a2ad]/20 text-base py-6"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  placeholder="Enter department description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#00a2ad] focus:outline-none focus:ring-2 focus:ring-[#00a2ad]/20 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button
                onClick={() => setIsCreating(false)}
                variant="outline"
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="rounded-xl px-6 text-white"
                style={{ background: COLORS.gradient }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Department
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT MODAL - Beautiful Centered ========== */}
      {editingDept && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="relative overflow-hidden p-6 text-white" style={{ background: COLORS.gradient }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Edit Department</h3>
                  <p className="text-white/80 text-sm">Update department information</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Human Resources, IT, Finance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:border-[#00a2ad] focus:ring-[#00a2ad]/20 text-base py-6"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  placeholder="Enter department description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#00a2ad] focus:outline-none focus:ring-2 focus:ring-[#00a2ad]/20 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button
                onClick={() => setEditingDept(null)}
                variant="outline"
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="rounded-xl px-6 text-white"
                style={{ background: COLORS.gradient }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE MODAL - Beautiful Centered ========== */}
      {deletingDept && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="relative overflow-hidden p-6 text-white" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Delete Department</h3>
                  <p className="text-white/80 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Are you absolutely sure?</h4>
              <p className="text-gray-500 text-sm mb-4">
                This will permanently delete the department <span className="font-bold text-gray-900">"{deletingDept.name}"</span> and all associated data.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    This action cannot be reversed. All appointments and users associated with this department will be affected.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button
                onClick={() => setDeletingDept(null)}
                variant="outline"
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="rounded-xl px-6 bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <ProtectedPage requiredRoles={['Admin']}>
      <DepartmentsContent />
    </ProtectedPage>
  );
}