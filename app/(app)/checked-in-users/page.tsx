'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useVisitors } from '@/lib/visitor-context';
import { ProtectedPage } from '@/components/protected-page';
import { usePermissions } from '@/lib/use-permissions';
import { SecurityCheckInForm } from '@/components/security-checkin-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Appointment } from '@/lib/types';
import type { User } from '@/lib/types';
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  Search,
  Calendar,
  Building2,
  Badge,
  LogOut,
  LogIn,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Eye,
  Phone,
  Mail,
  MapPin,
  Car,
  Package
} from 'lucide-react';

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#013c4c',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #013c4c 100%)',
  gradientHover: 'linear-gradient(135deg, #0198a2 0%, #023a48 100%)',
};

function CheckedInContent() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { appointments, checkins, refetch } = useVisitors();
  const [modal, setModal] = useState<Appointment | null>(null);
  const [hostsById, setHostsById] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users?role=Manager');
        const j = await res.json();
        const map: Record<string, string> = {};
        (j.data as User[] | undefined)?.forEach((u) => {
          map[u.id] = u.fullName;
        });
        setHostsById(map);
      } catch {
        // ignore
      }
    })();
  }, []);

  const today = new Date().toISOString().slice(0, 10);


  const pendingCheckIn = useMemo(() => {
    return appointments.filter((apt) => {
      if (apt.status !== 'Scheduled' && apt.status !== 'Confirmed') return false;
      const open = checkins.some((x) => x.appointmentId === apt.id && !x.checkOutTime);
      if (open) return false;
      return true;
    });
  }, [appointments, checkins]);


  // Filter pending check-ins based on search
  const filteredPending = useMemo(() => {
    if (!searchQuery) return pendingCheckIn;
    const query = searchQuery.toLowerCase();
    return pendingCheckIn.filter((apt) =>
      apt.visitorName.toLowerCase().includes(query) ||
      (apt.hostUserId && hostsById[apt.hostUserId]?.toLowerCase().includes(query))
    );
  }, [pendingCheckIn, searchQuery, hostsById]);

  const canAct = can('checkin_checkout');
  const canView = can('view_all_appointments');

  // Statistics
  const stats = {
    inside: checkins.filter(c => !c.checkOutTime).length,
    pending: pendingCheckIn.length,
    today: appointments.filter(a => a.appointmentDate === today).length,
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: COLORS.gradient }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Check-in Queue</h1>
              <p className="text-white/80">Manage scheduled appointments waiting for security check-in</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/10 rounded-lg px-3 py-1 text-sm">
                Queue: {stats.pending} visitors
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Waiting for Check-in</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-white/40" />
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Scheduled Today</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <Calendar className="w-8 h-8 text-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by visitor name or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-lg border-gray-200 focus:border-[#00a2ad] focus:ring-[#00a2ad]/20"
          />
        </div>
      </div>

      {/* Pending Check-in Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-orange-500" />
            Check-in Queue
          </h2>
        </div>

        {filteredPending.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No pending check-ins</p>
              <p className="text-gray-400 text-sm">All appointments for today are processed</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPending.map((apt) => (
              <div key={apt.id} className="p-5 hover:bg-gray-50 transition-all duration-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                        {apt.visitorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {apt.visitorName}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {apt.appointmentDate} at {apt.appointmentTime}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Building2 className="w-3 h-3" />
                            Host: {hostsById[apt.hostUserId] || '—'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {apt.location}
                          </div>
                          {apt.otherVisitorNames && apt.otherVisitorNames.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 col-span-full mt-1">
                              <Users className="w-3 h-3 text-orange-500" />
                              <span className="font-medium text-orange-600">Expected Extra:</span>
                              <div className="flex flex-col gap-1 mt-1 ml-4 border-l-2 border-orange-200 pl-3">
                                {apt.otherVisitorNames.map((v: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                                    <div className="w-1 h-1 rounded-full bg-orange-400" />
                                    {typeof v === 'string' ? v : (v?.name || 'Unknown')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setModal(apt)}
                    className="gap-2 shadow-md hover:shadow-lg transition-all"
                    style={{ background: COLORS.gradient }}
                  >
                    <UserCheck className="w-4 h-4" />
                    Security Check In
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      {modal && (
        <SecurityCheckInForm
          appointmentId={modal.id}
          visitorName={modal.visitorName}
          hostName={hostsById[modal.hostUserId] ?? '—'}
          initialAdditionalVisitors={modal.otherVisitorNames}
          onSubmit={async (data) => {
            if (!user || !modal) return;
            const res = await fetch('/api/checkins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appointmentId: modal.id,
                hasCar: data.hasCar,
                plateNumber: data.plateNumber,
                hasOtherMaterial: data.hasOtherMaterial,
                materialDetails: data.materialDetails,
                additionalVisitors: data.additionalVisitors,
                badgeNumber: data.badgeNumber,
              }),
            });
            if (!res.ok) {
              const j = await res.json();
              throw new Error(j.error || 'Check-in failed');
            }
            setModal(null);
            await refetch();
          }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default function CheckedInPage() {
  return (
    <ProtectedPage requiredRoles={['Admin', 'Security', 'Reception', 'Manager']}>
      <CheckedInContent />
    </ProtectedPage>
  );
}