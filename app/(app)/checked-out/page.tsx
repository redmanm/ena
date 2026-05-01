'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useVisitors } from '@/lib/visitor-context';
import { ProtectedPage } from '@/components/protected-page';
import { usePermissions } from '@/lib/use-permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User } from '@/lib/types';
import {
  Users,
  Clock,
  UserCheck,
  Search,
  Building2,
  Badge,
  LogOut,
  MapPin,
  Mail,
  Phone,
  Car,
  Package
} from 'lucide-react';

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#013c4c',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #013c4c 100%)',
};

function CheckedOutContent() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { appointments, checkins, refetch } = useVisitors();
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

  const openInside = useMemo(() => checkins.filter((c) => !c.checkOutTime), [checkins]);

  const insideRows = useMemo(() => {
    return openInside.map((c) => {
      const apt = appointments.find((a) => a.id === c.appointmentId);
      return { c, apt };
    });
  }, [openInside, appointments]);

  const filteredInside = useMemo(() => {
    if (!searchQuery) return insideRows;
    const query = searchQuery.toLowerCase();
    return insideRows.filter(({ apt }) =>
      apt?.visitorName.toLowerCase().includes(query) ||
      (apt?.hostUserId && hostsById[apt.hostUserId]?.toLowerCase().includes(query))
    );
  }, [insideRows, searchQuery, hostsById]);

  const canAct = can('checkin_checkout');

  const checkout = async (checkinId: string) => {
    const res = await fetch(`/api/checkins?id=${checkinId}`, { method: 'PATCH' });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || 'Check-out failed');
      return;
    }
    await refetch();
  };

  const getVisitDuration = (checkinTime: string) => {
    const start = new Date(checkinTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffMinutes = diffMins % 60;

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMins} min`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: COLORS.gradient }}>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2">Visitors On Site</h1>
          <p className="text-white/80">Manage visitors currently inside the building and process their check-outs</p>

          <div className="flex gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm min-w-[150px]">
              <p className="text-white/60 text-sm">Active Visitors</p>
              <p className="text-2xl font-bold">{insideRows.length}</p>
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

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#00a2ad]" />
            Currently Inside
          </h2>
        </div>

        {filteredInside.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No visitors on site</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredInside.map(({ c, apt }) => (
              <div key={c.id} className="p-5 hover:bg-gray-50 transition-all duration-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: COLORS.gradient }}>
                        {apt?.visitorName?.charAt(0).toUpperCase() || 'V'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {apt?.visitorName || '—'}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Building2 className="w-3 h-3" />
                            Host: {apt ? (hostsById[apt.hostUserId] || '—') : '—'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Badge className="w-3 h-3" />
                            Badge: {c.badgeNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 ml-14">
                      {apt?.visitorEmail && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {apt.visitorEmail}
                        </div>
                      )}
                      {apt?.visitorPhone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {apt.visitorPhone}
                        </div>
                      )}
                      {apt?.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {apt.location}
                        </div>
                      )}
                      {c.hasCar && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Car className="w-3 h-3" />
                          Vehicle: {c.plateNumber || 'Yes'}
                        </div>
                      )}
                      {c.hasMaterial && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Package className="w-3 h-3" />
                          Materials: {c.materialsName || 'Yes'}
                        </div>
                      )}
                      {c.additionalVisitors && c.additionalVisitors.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 col-span-full mt-1">
                          <Users className="w-3 h-3 text-[#00a2ad]" />
                          <span className="font-medium text-[#00a2ad]">Extra Visitors:</span>
                          <div className="flex flex-col gap-1 mt-1 ml-4 border-l-2 border-[#00a2ad]/20 pl-3">
                            {c.additionalVisitors.map((v: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                                <div className="w-1 h-1 rounded-full bg-[#00a2ad]" />
                                {typeof v === 'string' ? v : (v?.name || 'Unknown')}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{getVisitDuration(c.checkInTime)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Since {new Date(c.checkInTime).toLocaleTimeString()}
                      </p>
                    </div>
                    {canAct && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkout(c.id)}
                        className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Check Out
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckedOutPage() {
  return (
    <ProtectedPage requiredRoles={['Admin', 'Security', 'Reception']}>
      <CheckedOutContent />
    </ProtectedPage>
  );
}
