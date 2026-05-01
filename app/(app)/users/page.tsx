'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedPage } from '@/components/protected-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RoleBadge } from '@/components/role-badge';
import { StatusBadge } from '@/components/status-badge';
import {
  Trash2, Pencil, KeyRound, User as UserIcon, Mail, Building2, Shield,
  Copy, Check, Eye, EyeOff, Phone, Search, Filter, X,
  ChevronLeft, ChevronRight, Users, Calendar, Activity,
  Award, Star, TrendingUp, MoreVertical, AlertCircle,
  CheckCircle, Clock, Loader2
} from 'lucide-react';
import type { User, UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['Admin', 'Manager', 'Reception', 'Security', 'Viewer'];
const DEFAULT_PASSWORD = 'Ena@321#';

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#013c4c',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #013c4c 100%)',
  gradientHover: 'linear-gradient(135deg, #0198a2 0%, #023a48 100%)',
};

function UserManagementContent() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; managerId?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Reception' as UserRole,
    departmentId: '',
  });
  const [pwd, setPwd] = useState({ newPassword: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/departments'),
      ]);
      const uj = await uRes.json();
      const dj = await dRes.json();
      if (uj.data) {
        setUsers(uj.data);
        setFilteredUsers(uj.data);
      }
      if (dj.data)
        setDepartments(
          dj.data.map((d: { id: string; name: string; managerId?: string }) => ({
            id: d.id,
            name: d.name,
            managerId: d.managerId,
          }))
        );
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Filter users
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(searchTerm))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, users]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitAdd = async () => {
    if (!user) return;
    if (!form.fullName || !form.email) {
      alert('Full name and email are required');
      return;
    }
    if (form.role === 'Manager' && !form.departmentId) {
      alert('Managers must have a department');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          role: form.role,
          departmentId: form.departmentId || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || 'Failed to create user');
        return;
      }
      setShowAdd(false);
      setForm({ fullName: '', email: '', phoneNumber: '', role: 'Reception', departmentId: '' });
      load();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const submitEdit = async () => {
    if (!user || !editUser) return;
    if (editUser.role === 'Manager' && !editUser.departmentId) {
      alert('Managers must have a department');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editUser.id,
          fullName: editUser.fullName,
          email: editUser.email,
          phoneNumber: editUser.phoneNumber || '',
          role: editUser.role,
          status: editUser.status,
          ...(editUser.departmentId ? { departmentId: editUser.departmentId } : { departmentId: null }),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || 'Failed to update user');
        return;
      }
      setEditUser(null);
      load();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const submitPwd = async () => {
    if (!user || !pwdUser) return;

    if (!pwd.newPassword) {
      setPwdError('New password is required');
      return;
    }
    if (pwd.newPassword.length < 8) {
      setPwdError('Password must be at least 8 characters');
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      setPwdError('Passwords do not match');
      return;
    }

    setPwdError('');
    setPwdSuccess('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pwdUser.id,
          newPassword: pwd.newPassword
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setPwdSuccess('Password reset successfully!');
      setTimeout(() => {
        setPwdUser(null);
        setPwd({ newPassword: '', confirm: '' });
        setPwdSuccess('');
      }, 2000);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const setStatus = async (u: User, nextStatus: 'Active' | 'Inactive') => {
    if (!user) return;
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: u.id,
          status: nextStatus,
        }),
      });
      load();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const remove = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || 'Failed to delete user');
        return;
      }
      load();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    admins: users.filter(u => u.role === 'Admin').length,
    managers: users.filter(u => u.role === 'Manager').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: COLORS.primary }} />
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white mb-8" style={{ background: COLORS.gradient }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">User Management</h1>
              <p className="text-white/80">Manage system users, roles, and permissions</p>
            </div>
            <Button
              onClick={() => setShowAdd(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Active Users</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <Activity className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Administrators</p>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                </div>
                <Shield className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Department Managers</p>
                  <p className="text-2xl font-bold">{stats.managers}</p>
                </div>
                <Award className="w-8 h-8 text-white/40" />
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
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: COLORS.gradient }}>
              <tr>
                <th className="text-left p-4 text-white font-semibold">#</th>
                <th className="text-left p-4 text-white font-semibold">User</th>
                <th className="text-left p-4 text-white font-semibold">Contact</th>
                <th className="text-left p-4 text-white font-semibold">Role</th>
                <th className="text-left p-4 text-white font-semibold">Department</th>
                <th className="text-left p-4 text-white font-semibold">Status</th>
                <th className="text-left p-4 text-white font-semibold">Joined</th>
                <th className="text-right p-4 text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u, index) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500 font-medium">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: COLORS.gradient }}>
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.fullName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {u.phoneNumber ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{u.phoneNumber}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'Reception' ? 'bg-green-100 text-green-800' :
                            u.role === 'Security' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {departments.find((d) => d.id === u.departmentId)?.name || '—'}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setStatus(u, u.status === 'Active' ? 'Inactive' : 'Active')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${u.status === 'Active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                      {u.status === 'Active' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {u.status}
                    </button>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditUser({ ...u })}
                      title="Edit User"
                      className="hover:border-teal-400 hover:text-teal-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPwdUser(u)}
                      title="Reset Password"
                      className="hover:border-amber-400 hover:text-amber-600"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(u.id)}
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-4 py-3 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4" style={{ background: COLORS.gradient }}>
              <h2 className="text-white font-bold text-xl">Add New User</h2>
              <p className="text-white/80 text-sm mt-1">Create a new system user account</p>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-10 h-11 border-gray-200 focus:border-teal-400 rounded-lg"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-10 h-11 border-gray-200 focus:border-teal-400 rounded-lg"
                    type="email"
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-10 h-11 border-gray-200 focus:border-teal-400 rounded-lg"
                    type="tel"
                    placeholder="0912345678"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all bg-white"
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as UserRole,
                      departmentId: e.target.value === 'Manager' ? form.departmentId : '',
                    })
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {form.role === 'Manager' && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all bg-white"
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  >
                    <option value="">Select department</option>
                    {departments
                      .filter((d) => !d.managerId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Default Password
                </label>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-amber-700 mb-1">User must change on first login</div>
                      <code className="text-sm font-mono font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded">
                        {showPassword ? DEFAULT_PASSWORD : '••••••••'}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        className="h-8 w-8 p-0"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(DEFAULT_PASSWORD)}
                        className="h-8 w-8 p-0"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button
                onClick={submitAdd}
                className="rounded-lg text-white"
                style={{ background: COLORS.gradient }}
              >
                Create User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full overflow-hidden">
            <div className="px-6 py-4" style={{ background: COLORS.gradient }}>
              <h2 className="text-white font-bold text-xl">Edit User</h2>
              <p className="text-white/80 text-sm mt-1">Update user information</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-10 h-11 border-gray-200 rounded-lg"
                    value={editUser.fullName}
                    onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-10 h-11 border-gray-200 rounded-lg"
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-10 h-11 border-gray-200 rounded-lg"
                    type="tel"
                    value={editUser.phoneNumber || ''}
                    onChange={(e) => setEditUser({ ...editUser, phoneNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Role</label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all bg-white"
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as UserRole })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {editUser.role === 'Manager' && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Department</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all bg-white"
                    value={editUser.departmentId ?? ''}
                    onChange={(e) => setEditUser({ ...editUser, departmentId: e.target.value || undefined })}
                  >
                    <option value="">Select department</option>
                    {departments
                      .filter((d) => !d.managerId || d.id === editUser.departmentId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-lg">
                Cancel
              </Button>
              <Button onClick={submitEdit} className="rounded-lg text-white" style={{ background: COLORS.gradient }}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {pwdUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full overflow-hidden">
            <div className="px-6 py-4" style={{ background: COLORS.gradient }}>
              <h2 className="text-white font-bold text-xl">Reset Password</h2>
              <p className="text-white/80 text-sm mt-1">Reset password for: <strong>{pwdUser.fullName}</strong></p>
            </div>

            <div className="p-6 space-y-5">
              {pwdError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {pwdSuccess}
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-10 h-11 border-gray-200 rounded-lg"
                    type="password"
                    placeholder="At least 8 characters"
                    value={pwd.newPassword}
                    onChange={(e) => {
                      setPwd({ ...pwd, newPassword: e.target.value });
                      setPwdError('');
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-10 h-11 border-gray-200 rounded-lg"
                    type="password"
                    placeholder="Confirm new password"
                    value={pwd.confirm}
                    onChange={(e) => {
                      setPwd({ ...pwd, confirm: e.target.value });
                      setPwdError('');
                    }}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Password must be at least 8 characters long
              </div>
            </div>

            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setPwdUser(null);
                setPwd({ newPassword: '', confirm: '' });
                setPwdError('');
                setPwdSuccess('');
              }} className="rounded-lg">
                Cancel
              </Button>
              <Button onClick={submitPwd} className="rounded-lg text-white" style={{ background: COLORS.gradient }}>
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedPage requiredRoles={['Admin']}>
      <UserManagementContent />
    </ProtectedPage>
  );
}