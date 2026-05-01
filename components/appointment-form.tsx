'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  CheckCircle2,
  ChevronRight,
  FileText,
  Briefcase,
  CalendarDays,
  Clock3,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import type { Appointment, Department, User as UserType, LocationCode, AppointmentStatus } from '@/lib/types';

export interface AppointmentFormPayload {
  visitorName: string;
  visitorEmail?: string; // Made optional
  visitorPhone: string;
  visitorCompany?: string;
  location: LocationCode;
  appointmentDate: string;
  appointmentTime: string;
  purpose?: string;
  departmentId: string;
  hostUserId: string;
  status: 'Scheduled' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Appointment | null;
}

export function AppointmentForm({ onSubmit, onCancel, isLoading, initialData }: AppointmentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    visitorName: initialData?.visitorName || '',
    visitorEmail: initialData?.visitorEmail || '',
    visitorPhone: initialData?.visitorPhone || '',
    visitorCompany: initialData?.visitorCompany || '',
    location: (initialData?.location || 'ENA') as LocationCode,
    appointmentDate: initialData?.appointmentDate?.slice(0, 10) || '',
    appointmentTime: initialData?.appointmentTime || '',
    purpose: initialData?.purpose || '',
    departmentId: initialData?.departmentId || '',
    hostUserId: initialData?.hostUserId || '',
  });

  // Company color
  const companyColor = '#1790A2';

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [dRes, uRes] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/users?role=Manager'),
        ]);
        const dJson = await dRes.json();
        const uJson = await uRes.json();

        let allDepartments = dJson.data || [];
        const allManagers = uJson.data || [];

        // Filter based on user role
        if (user.role === 'Manager') {
          allDepartments = allDepartments.filter(
            (dept: Department) => dept.id === user.departmentId
          );
        }

        const departmentsWithManagers = allDepartments.filter((dept: Department) =>
          dept.status === 'Active' &&
          allManagers.some((manager: UserType) => manager.departmentId === dept.id)
        );

        setDepartments(departmentsWithManagers);
        setManagers(allManagers);

        // Auto-select department and host for Managers
        if (user.role === 'Manager' && user.departmentId) {
          const managerRecord = allManagers.find(
            (m: UserType) => m.departmentId === user.departmentId && m.id === user.id
          );

          setFormData(prev => ({
            ...prev,
            departmentId: user.departmentId || '',
            hostUserId: managerRecord?.id || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (formData.departmentId && user?.role !== 'Manager') {
      const managersInDept = managers.filter(m => m.departmentId === formData.departmentId);
      if (managersInDept.length === 1) {
        setFormData(prev => ({ ...prev, hostUserId: managersInDept[0].id }));
      } else if (managersInDept.length > 1) {
        setFormData(prev => ({ ...prev, hostUserId: '' }));
      }
    }
  }, [formData.departmentId, managers, user]);

  const handleHostChange = (hostId: string) => {
    const selectedManager = managers.find(m => m.id === hostId);
    if (selectedManager) {
      setFormData({
        ...formData,
        hostUserId: hostId,
        departmentId: selectedManager.departmentId || ''
      });
    }
  };

  const activeDepartments = departments.filter((d) => d.status === 'Active');
  const managersInDept = managers.filter((m) => m.departmentId === formData.departmentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields (email is now optional)
    if (!formData.visitorName) {
      toast({ title: 'Missing Field', description: 'Please enter your full name.', variant: 'destructive' });
      return;
    }
    if (!formData.visitorPhone) {
      toast({ title: 'Missing Field', description: 'Please enter your phone number.', variant: 'destructive' });
      return;
    }
    if (!formData.departmentId) {
      toast({ title: 'Missing Field', description: 'Please select a department.', variant: 'destructive' });
      return;
    }
    if (!formData.hostUserId) {
      toast({ title: 'Missing Field', description: 'Please select a host executive.', variant: 'destructive' });
      return;
    }
    if (!formData.appointmentDate) {
      toast({ title: 'Missing Field', description: 'Please select an appointment date.', variant: 'destructive' });
      return;
    }
    if (!formData.appointmentTime) {
      toast({ title: 'Missing Field', description: 'Please select an appointment time.', variant: 'destructive' });
      return;
    }

    // Prepare the data - ensure date is properly formatted
    const appointmentData: AppointmentFormPayload = {
      visitorName: formData.visitorName,
      visitorEmail: formData.visitorEmail || undefined,
      visitorPhone: formData.visitorPhone,
      visitorCompany: formData.visitorCompany || undefined,
      location: formData.location,
      appointmentDate: formData.appointmentDate, // This is YYYY-MM-DD format
      appointmentTime: formData.appointmentTime, // This is HH:MM format
      purpose: formData.purpose || undefined,
      departmentId: formData.departmentId,
      hostUserId: formData.hostUserId,
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Submitting appointment data:', appointmentData);
    onSubmit(appointmentData);
  };

  const isManager = user?.role === 'Manager';
  const selectedDepartment = departments.find(d => d.id === formData.departmentId);
  const selectedHost = managers.find(m => m.id === formData.hostUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Premium Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">

            {/* Card Header with Gradient */}
            <div className="relative px-8 py-6 overflow-hidden" style={{ background: `linear-gradient(135deg, ${companyColor} 15%, #0f6b7a 100%)` }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xl">Appointment Details</h3>
                  <p className="text-white/80 text-sm">Please provide accurate information</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="group">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: companyColor }} />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative transition-all duration-300 ${focusedField === 'name' ? 'transform scale-[1.02]' : ''}`}>
                    <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${focusedField === 'name' ? 'text-teal-500' : 'text-slate-400'}`} />
                    <Input
                      className="pl-12 h-14 bg-white border-2 transition-all duration-300 rounded-2xl text-base shadow-sm hover:shadow-md focus:shadow-lg"
                      style={{ borderColor: focusedField === 'name' ? companyColor : '#e2e8f0' }}
                      value={formData.visitorName}
                      onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: companyColor }} />
                    Email Address <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'transform scale-[1.02]' : ''}`}>
                    <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${focusedField === 'email' ? 'text-teal-500' : 'text-slate-400'}`} />
                    <Input
                      className="pl-12 h-14 bg-white border-2 transition-all duration-300 rounded-2xl text-base shadow-sm hover:shadow-md focus:shadow-lg"
                      style={{ borderColor: focusedField === 'email' ? companyColor : '#e2e8f0' }}
                      type="email"
                      value={formData.visitorEmail}
                      onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your.email@company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Phone Number & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="group">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color: companyColor }} />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative transition-all duration-300 ${focusedField === 'phone' ? 'transform scale-[1.02]' : ''}`}>
                    <Phone className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${focusedField === 'phone' ? 'text-teal-500' : 'text-slate-400'}`} />
                    <Input
                      className="pl-12 h-14 bg-white border-2 transition-all duration-300 rounded-2xl text-base shadow-sm hover:shadow-md focus:shadow-lg"
                      style={{ borderColor: focusedField === 'phone' ? companyColor : '#e2e8f0' }}
                      type="tel"
                      value={formData.visitorPhone}
                      onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="0911121314"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Briefcase className="w-4 h-4" style={{ color: companyColor }} />
                    Company / Organization <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className={`relative transition-all duration-300 ${focusedField === 'company' ? 'transform scale-[1.02]' : ''}`}>
                    <Briefcase className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 z-10 ${focusedField === 'company' ? 'text-teal-500' : 'text-slate-400'}`} />
                    <Input
                      className="pl-12 h-14 bg-white border-2 transition-all duration-300 rounded-2xl text-base shadow-sm hover:shadow-md focus:shadow-lg"
                      style={{ borderColor: focusedField === 'company' ? companyColor : '#e2e8f0' }}
                      value={formData.visitorCompany}
                      onChange={(e) => setFormData({ ...formData, visitorCompany: e.target.value })}
                      onFocus={() => setFocusedField('company')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Organization Name"
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: companyColor }} />
                  Select Location <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['ENA', 'POA', 'Both'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setFormData({ ...formData, location: loc as LocationCode })}
                      className={`relative group px-5 py-4 rounded-2xl border-2 transition-all duration-300 ${formData.location === loc
                        ? 'border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-md'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${formData.location === loc ? 'bg-teal-100 scale-110' : 'bg-slate-100 group-hover:bg-teal-50'
                            }`}>
                            <Building2 className={`w-5 h-5 ${formData.location === loc ? 'text-teal-600' : 'text-slate-500 group-hover:text-teal-500'
                              }`} />
                          </div>
                          <span className={`font-bold text-lg ${formData.location === loc ? 'text-teal-700' : 'text-slate-700'
                            }`}>{loc}</span>
                        </div>
                        {formData.location === loc && (
                          <CheckCircle2 className="w-5 h-5 text-teal-600 animate-bounce" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Department & Host Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Department */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: companyColor }} />
                    Department <span className="text-red-500">*</span>
                  </label>
                  {isManager ? (
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                      <Input
                        className="pl-12 h-14 bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl text-base text-slate-700 cursor-not-allowed font-medium"
                        value={selectedDepartment?.name || 'Loading...'}
                        disabled
                      />
                    </div>
                  ) : (
                    <Select
                      value={formData.departmentId}
                      onValueChange={(v) => setFormData({ ...formData, departmentId: v, hostUserId: "" })}
                    >
                      <SelectTrigger className="h-14 bg-white border-2 border-slate-200 hover:border-teal-300 focus:border-teal-400 rounded-2xl text-base transition-all duration-300 shadow-sm hover:shadow-md">
                        <SelectValue placeholder="🏢 Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeDepartments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-teal-500" />
                              {d.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Host Executive */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: companyColor }} />
                    Host Executive <span className="text-red-500">*</span>
                  </label>
                  {isManager ? (
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                      <Input
                        className="pl-12 h-14 bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl text-base text-slate-700 cursor-not-allowed font-medium"
                        value={selectedHost?.fullName || 'Loading...'}
                        disabled
                      />
                    </div>
                  ) : (
                    <Select
                      value={formData.hostUserId}
                      onValueChange={handleHostChange}
                      disabled={!formData.departmentId}
                    >
                      <SelectTrigger className="h-14 bg-white border-2 border-slate-200 hover:border-teal-300 focus:border-teal-400 rounded-2xl text-base transition-all duration-300 shadow-sm hover:shadow-md">
                        <SelectValue placeholder={!formData.departmentId ? "⚠️ Select department first" : "👤 Select host executive"} />
                      </SelectTrigger>
                      <SelectContent>
                        {managersInDept.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-teal-600" />
                              </div>
                              <span className="font-medium">{m.fullName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Date & Time Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="group">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: companyColor }} />
                    Appointment Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-all duration-300 z-10" />
                    <Input
                      type="date"
                      min={today}
                      className="pl-12 h-14 bg-white border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 rounded-2xl text-base transition-all duration-300 shadow-sm hover:shadow-md w-full cursor-pointer"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Clock3 className="w-4 h-4" style={{ color: companyColor }} />
                    Appointment Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-all duration-300 z-10" />
                    <Input
                      type="time"
                      className="pl-12 h-14 bg-white border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 rounded-2xl text-base transition-all duration-300 shadow-sm hover:shadow-md w-full cursor-pointer"
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Purpose Section */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: companyColor }} />
                  Purpose of Meeting <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-5 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-all duration-300 z-10" />
                  <textarea
                    className="w-full min-h-[120px] pl-12 p-4 bg-white border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 rounded-2xl text-base transition-all duration-300 outline-none resize-none shadow-sm hover:shadow-md"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Please briefly describe the purpose of your visit..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-14 px-8 rounded-2xl border-2 border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 hover:border-teal-300 hover:text-teal-600 transition-all duration-300"
            >
              Cancel Registration
            </Button>
            <Button
              type="submit"
              disabled={isLoading || loading}
              className="group h-14 px-10 rounded-2xl text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 gap-3 text-lg relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${companyColor} 0%, #0f6b7a 100%)` }}
            >
              <span className="relative z-10 flex items-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Schedule Appointment
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}