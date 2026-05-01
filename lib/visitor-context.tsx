'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import type { Appointment, VisitorCheckIn } from './types';

interface VisitorContextType {
  appointments: Appointment[];
  checkins: VisitorCheckIn[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [checkins, setCheckins] = useState<VisitorCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setAppointments([]);
      setCheckins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [aRes, cRes] = await Promise.all([
        fetch('/api/appointments', { cache: 'no-store' }),
        fetch('/api/checkins', { cache: 'no-store' }),
      ]);
      const aJson = await aRes.json();
      const cJson = await cRes.json();
      if (!aRes.ok) throw new Error(aJson.error || 'Failed to load appointments');
      if (!cRes.ok) throw new Error(cJson.error || 'Failed to load check-ins');
      setAppointments(aJson.data ?? []);
      setCheckins(cJson.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
      setAppointments([]);
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <VisitorContext.Provider value={{ appointments, checkins, loading, error, refetch }}>
      {children}
    </VisitorContext.Provider>
  );
}

export function useVisitors() {
  const ctx = useContext(VisitorContext);
  if (!ctx) {
    throw new Error('useVisitors must be used within VisitorProvider');
  }
  return ctx;
}
