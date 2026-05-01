'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Lock, User, Mail, Phone, Save, AlertCircle, Loader2 } from 'lucide-react';
import { ProtectedPage } from '@/components/protected-page';

interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile Form
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phoneNumber: '',
  });

  // Password Form
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      setFetching(true);
      try {
        const response = await fetch('/api/users/profile');

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched profile data:', data);

          setProfileData({
            fullName: data.fullName || user?.fullName || '',
            email: data.email || user?.email || '',
            phoneNumber: data.phoneNumber || user?.phoneNumber || '',
          });
        } else {
          console.error('Failed to fetch profile:', await response.text());
          // Fallback to user data from auth context
          setProfileData({
            fullName: user?.fullName || '',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfileData({
          fullName: user?.fullName || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
        });
      } finally {
        setFetching(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!passwordData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileData.fullName,
          phoneNumber: profileData.phoneNumber
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local state with the response
      if (data.data) {
        setProfileData({
          fullName: data.data.fullName,
          email: data.data.email,
          phoneNumber: data.data.phoneNumber || '',
        });
      }

      // Refresh auth context to update user data globally
      await refresh();

      setSuccess('Profile updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to change password');

      await refresh();
      setSuccess('Password changed successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ProtectedPage requiredRoles={['Admin', 'Manager', 'Reception', 'Security', 'Viewer']}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
          </div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredRoles={['Admin', 'Manager', 'Reception', 'Security', 'Viewer']}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Profile</h1>
          <p className="text-gray-600">Manage your account settings and security</p>
        </div>

        {/* Alert Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'profile'
                ? 'text-cyan-600 border-cyan-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
          >
            <div className="flex items-center gap-2">
              <User size={18} />
              Profile Information
            </div>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'password'
                ? 'text-cyan-600 border-cyan-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
          >
            <div className="flex items-center gap-2">
              <Lock size={18} />
              Change Password
            </div>
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => handleProfileChange('fullName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2 max-w-md">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={profileData.phoneNumber}
                      onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter your phone number (optional)</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Password must:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Be at least 8 characters long</li>
                  <li>Be different from your current password</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Lock size={18} />
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}