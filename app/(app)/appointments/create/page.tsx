// create/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useVisitors } from '@/lib/visitor-context';
import { AppointmentForm, type AppointmentFormPayload } from '@/components/appointment-form';
import { ProtectedPage } from '@/components/protected-page';
import { useToast } from '@/hooks/use-toast';

function CreateAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { refetch, appointments } = useVisitors();
  const [isLoading, setIsLoading] = useState(false);

  const editId = searchParams.get('edit');
  const appointmentToEdit = useMemo(
    () => (editId ? appointments.find((apt) => apt.id === editId) ?? null : null),
    [editId, appointments]
  );

  const { toast } = useToast();

  const handleSubmit = async (data: AppointmentFormPayload) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (appointmentToEdit) {
        const res = await fetch('/api/appointments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: appointmentToEdit.id, ...data }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Update failed');
        toast({ title: 'Success', description: 'Appointment updated successfully.' });
      } else {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Create failed');
        toast({ title: 'Success', description: 'Appointment scheduled successfully.' });
      }
      
      // Explicitly wait for refetch to complete the state update
      await refetch();
      
      // Small delay to let the toast be seen and ensure state propagation
      setTimeout(() => {
        router.push('/appointments');
      }, 1000);
    } catch (e: any) {
      console.error(e);
      toast({ 
        title: 'Error', 
        description: e.message || 'Something went wrong. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#17A2B8] to-[#0f7a8a] rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{appointmentToEdit ? 'Edit Appointment' : 'Create New Appointment'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {appointmentToEdit ? 'Update existing visit details' : 'Schedule a new visitor appointment'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <AppointmentForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
          initialData={appointmentToEdit}
        />
      </div>
    </div>
  );
}

export default function CreateAppointmentPage() {
  return (
    <ProtectedPage requiredRoles={['Admin', 'Manager', 'Reception', 'Security']}>
      <CreateAppointmentContent />
    </ProtectedPage>
  );
}