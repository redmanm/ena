// page.tsx - Updated Dashboard
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/lib/use-permissions';
import { useVisitors } from '@/lib/visitor-context';
import { Button } from '@/components/ui/button';
import { ProtectedPage } from '@/components/protected-page';
import {
  getVisitorDurationDetails,
  getAverageDuration,
  getMostFrequentVisitors,
  formatDuration,
} from '@/lib/visitor-utils';

function DashboardContent() {
  const { user } = useAuth();
  const { can, role } = usePermissions();
  const { appointments, checkins, loading } = useVisitors();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [departmentNamesById, setDepartmentNamesById] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setTotalUsers(data.total || 0))
      .catch(() => { });
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        const departments = Array.isArray(data.data) ? data.data : [];
        setTotalDepartments(data.total || departments.length || 0);
        const map = departments.reduce((acc: Record<string, string>, dept: any) => {
          if (dept?.id && dept?.name) acc[dept.id] = dept.name;
          return acc;
        }, {});
        setDepartmentNamesById(map);
      })
      .catch(() => { });
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const visitorAnalytics = useMemo(() => {
    const durationDetails = getVisitorDurationDetails(checkins, appointments);
    const avg = getAverageDuration(checkins, appointments);
    const mostFrequent = getMostFrequentVisitors(checkins, appointments, 5);
    const insideCount = durationDetails.filter((v) => v.isCurrentlyInside).length;
    return { durationDetails, avgDuration: avg, mostFrequent, insideCount };
  }, [checkins, appointments]);

  const todayAppointments = useMemo(
    () => appointments.filter((apt) => apt.appointmentDate === todayStr),
    [appointments, todayStr]
  );

  const thisWeekAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate + 'T12:00:00');
      const daysAway = Math.floor((aptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysAway >= 0 && daysAway < 7;
    });
  }, [appointments]);

  const thisMonthByLoc = useMemo(() => {
    const today = new Date();
    const enaCount = appointments.filter(
      (apt) =>
        new Date(apt.appointmentDate + 'T12:00:00').getMonth() === today.getMonth() &&
        new Date(apt.appointmentDate + 'T12:00:00').getFullYear() === today.getFullYear() &&
        apt.location === 'ENA'
    ).length;
    const poaCount = appointments.filter(
      (apt) =>
        new Date(apt.appointmentDate + 'T12:00:00').getMonth() === today.getMonth() &&
        new Date(apt.appointmentDate + 'T12:00:00').getFullYear() === today.getFullYear() &&
        apt.location === 'POA'
    ).length;
    const bothCount = appointments.filter(
      (apt) =>
        new Date(apt.appointmentDate + 'T12:00:00').getMonth() === today.getMonth() &&
        new Date(apt.appointmentDate + 'T12:00:00').getFullYear() === today.getFullYear() &&
        apt.location === 'Both'
    ).length;
    const total = enaCount + poaCount + bothCount;
    return {
      ena: enaCount,
      poa: poaCount,
      both: bothCount,
      enaPercent: total ? (enaCount / total) * 100 : 0,
      poaPercent: total ? (poaCount / total) * 100 : 0,
      bothPercent: total ? (bothCount / total) * 100 : 0
    };
  }, [appointments]);

  const checkinsToday = useMemo(() => {
    const t = new Date().toDateString();
    return checkins.filter((c) => new Date(c.checkInTime).toDateString() === t).length;
  }, [checkins]);

  const completionRate = useMemo(() => {
    if (todayAppointments.length === 0) return 0;
    return Math.round((checkinsToday / todayAppointments.length) * 100);
  }, [checkinsToday, todayAppointments]);

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    return days.map((day, idx) => {
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + idx);
      const dateStr = targetDate.toISOString().slice(0, 10);
      const count = appointments.filter(apt => apt.appointmentDate === dateStr).length;
      return { day, count };
    });
  }, [appointments]);

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

  const recentVisitors = useMemo(() => {
    return checkins.slice(0, 5).map(checkin => {
      const appointment = appointments.find(a => a.id === checkin.appointmentId);
      return {
        name: appointment?.visitorName || 'Unknown',
        department: appointment?.departmentId ? (departmentNamesById[appointment.departmentId] || 'N/A') : 'N/A',
        checkInTime: checkin.checkInTime,
        status: checkin.checkOutTime ? 'Completed' : 'Inside',
      };
    });
  }, [checkins, appointments, departmentNamesById]);

  const kpis = useMemo(() => {
    switch (role) {
      case 'Admin':
        return [
          { label: 'Total Users', value: totalUsers, icon: 'users', color: 'teal', sub: 'Active users' },
          { label: 'Departments', value: totalDepartments, icon: 'dept', color: 'purple', sub: 'Active departments' },
          { label: 'Total Appointments', value: appointments.length, icon: 'apt', color: 'blue', sub: 'Total scheduled' },
          { label: "Today's Appointments", value: todayAppointments.length, icon: 'today', color: 'orange', sub: 'Scheduled for today' },
          { label: 'Check-ins Today', value: checkinsToday, icon: 'check', color: 'green', sub: 'Actual check-ins' },
        ];
      case 'Security':
        return [
          { label: "Today's Appointments", value: todayAppointments.length, icon: 'apt', color: 'blue', sub: 'Expected today' },
          { label: 'Today Checked In', value: checkinsToday, icon: 'check', color: 'green', sub: 'Currently inside' },
          { label: 'Today Checked Out', value: checkins.filter(c => c.checkOutTime && new Date(c.checkOutTime).toDateString() === new Date().toDateString()).length, icon: 'check', color: 'orange', sub: 'Completed visits' },
        ];
      case 'Reception':
        return [
          { label: 'Departments', value: totalDepartments, icon: 'dept', color: 'purple', sub: 'Total departments' },
          { label: "Today's Appointments", value: todayAppointments.length, icon: 'apt', color: 'blue', sub: 'Expected today' },
          { label: 'Checked In', value: checkinsToday, icon: 'check', color: 'green', sub: 'Active visits' },
          { label: 'Checked Out', value: checkins.filter(c => c.checkOutTime && new Date(c.checkOutTime).toDateString() === new Date().toDateString()).length, icon: 'check', color: 'orange', sub: 'Completed today' },
        ];
      case 'Manager':
        const deptApts = appointments.filter(a => a.departmentId === user?.departmentId);
        const deptCheckins = checkins.filter(c => {
          const apt = appointments.find(a => a.id === c.appointmentId);
          return apt?.departmentId === user?.departmentId;
        });
        return [
          { label: 'Dept Appointments', value: deptApts.length, icon: 'apt', color: 'blue', sub: 'Your department' },
          { label: 'Dept Checked In', value: deptCheckins.filter(c => !c.checkOutTime).length, icon: 'check', color: 'green', sub: 'Currently visiting' },
          { label: 'Dept Checked Out', value: deptCheckins.filter(c => c.checkOutTime).length, icon: 'check', color: 'orange', sub: 'Completed' },
          { label: 'Total Appointments', value: appointments.length, icon: 'apt', color: 'purple', sub: 'System wide' },
        ];
      case 'Viewer':
        return [
          { label: 'Total Users', value: totalUsers, icon: 'users', color: 'teal', sub: 'System users' },
          { label: 'Departments', value: totalDepartments, icon: 'dept', color: 'purple', sub: 'Active units' },
          { label: 'Total Appointments', value: appointments.length, icon: 'apt', color: 'blue', sub: 'Total records' },
          { label: "Today's Appointments", value: todayAppointments.length, icon: 'today', color: 'orange', sub: 'Today\'s activity' },
        ];
      default:
        return [];
    }
  }, [role, totalUsers, totalDepartments, appointments, todayAppointments, checkinsToday, checkins, user?.departmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#17A2B8]/20 rounded-full animate-spin border-t-[#17A2B8]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#17A2B8] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const getIcon = (type: string, color: string) => {
    switch (type) {
      case 'users':
        return <svg className={`w-5 h-5 text-${color}-600 group-hover:text-white transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
      case 'dept':
        return <svg className={`w-5 h-5 text-${color}-600 group-hover:text-white transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
      case 'apt':
        return <svg className={`w-5 h-5 text-${color}-600 group-hover:text-white transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      case 'today':
        return <svg className={`w-5 h-5 text-${color}-600 group-hover:text-white transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'check':
        return <svg className={`w-5 h-5 text-${color}-600 group-hover:text-white transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-8 overflow-x-hidden">

      {/* KPI Cards Row - Dynamic based on role */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="group relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br from-${kpi.color}-500/0 to-${kpi.color}-500/0 group-hover:from-${kpi.color}-500/5 group-hover:to-${kpi.color}-600/5 transition-all duration-500`} />
            <div className={`absolute -top-10 -right-10 w-24 h-24 bg-${kpi.color}-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold text-${kpi.color}-600 uppercase tracking-wider`}>{kpi.label}</span>
                <div className={`w-10 h-10 rounded-xl bg-${kpi.color}-500/10 flex items-center justify-center group-hover:bg-${kpi.color}-600 group-hover:scale-110 transition-all duration-300`}>
                  {getIcon(kpi.icon, kpi.color)}
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                {kpi.color === 'green' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                {kpi.sub}
              </p>
            </div>
          </div>
        ))}
      </div>


      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart - Takes 2 columns on desktop */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Appointment Trends</h3>
              <p className="text-sm text-gray-500 mt-1">Appointments scheduled by day</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-[#17A2B8] rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">Current week</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-64">
            {weeklyData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full">
                  <div
                    className="w-full bg-gradient-to-t from-[#17A2B8] to-[#0f7a8a] rounded-lg transition-all duration-500 group-hover:opacity-80 cursor-pointer"
                    style={{ height: `${(item.count / maxCount) * 180}px`, minHeight: '4px' }}
                  />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {item.count} appointments
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">{item.day}</span>
                <span className="text-xs font-semibold text-gray-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {can('create_appointment') && (
              <Link href="/appointments/create" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-[#17A2B8]/5 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#17A2B8]/10 flex items-center justify-center group-hover:bg-[#17A2B8] transition-all duration-300">
                    <svg className="w-4 h-4 text-[#17A2B8] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#17A2B8]">Create Appointment</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#17A2B8] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            <Link href="/appointments" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-[#17A2B8]/5 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center group-hover:bg-[#17A2B8] transition-all duration-300">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#17A2B8]">View All Appointments</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#17A2B8] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/reports" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-[#17A2B8]/5 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center group-hover:bg-[#17A2B8] transition-all duration-300">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#17A2B8]">Generate Reports</span>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#17A2B8] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visitors */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Recent Visitors</h3>
              <p className="text-sm text-gray-500 mt-1">Latest check-ins and their status</p>
            </div>
          </div>
          <div className="space-y-3">
            {recentVisitors.length > 0 ? recentVisitors.map((visitor, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#17A2B8] to-[#0f7a8a] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {visitor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{visitor.name}</p>
                    <p className="text-xs text-gray-500 truncate">{visitor.department}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${visitor.status === 'Inside' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {visitor.status}
                </span>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">No recent visitors</div>
            )}
          </div>
        </div>

        {/* Location Distribution - Updated with ENA, POA, and BOTH */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="mb-5">
            <h3 className="font-semibold text-gray-900">Location Distribution</h3>
            <p className="text-sm text-gray-500 mt-1">This month by location (ENA, POA, Both)</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                {/* ENA Segment */}
                <circle
                  cx="60" cy="60" r="48" fill="none"
                  stroke="url(#gradientEna)"
                  strokeWidth="12"
                  strokeDasharray={`${thisMonthByLoc.enaPercent * 3.0159289474462} ${(100 - thisMonthByLoc.enaPercent) * 3.0159289474462}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                {/* POA Segment */}
                <circle
                  cx="60" cy="60" r="48" fill="none"
                  stroke="url(#gradientPoa)"
                  strokeWidth="12"
                  strokeDasharray={`${thisMonthByLoc.poaPercent * 3.0159289474462} ${(100 - thisMonthByLoc.poaPercent) * 3.0159289474462}`}
                  strokeLinecap="round"
                  strokeDashoffset={`-${thisMonthByLoc.enaPercent * 3.0159289474462}`}
                  className="transition-all duration-700"
                />
                {/* Both Segment */}
                <circle
                  cx="60" cy="60" r="48" fill="none"
                  stroke="url(#gradientBoth)"
                  strokeWidth="12"
                  strokeDasharray={`${thisMonthByLoc.bothPercent * 3.0159289474462} ${(100 - thisMonthByLoc.bothPercent) * 3.0159289474462}`}
                  strokeLinecap="round"
                  strokeDashoffset={`-${(thisMonthByLoc.enaPercent + thisMonthByLoc.poaPercent) * 3.0159289474462}`}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="gradientEna" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00a2ad" />
                    <stop offset="100%" stopColor="#013c4c" />
                  </linearGradient>
                  <linearGradient id="gradientPoa" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="gradientBoth" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-gray-900">{thisMonthByLoc.ena + thisMonthByLoc.poa + thisMonthByLoc.both}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-3">
              {/* ENA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00a2ad] to-[#013c4c]" />
                    <span className="text-sm font-medium text-gray-700">ENA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{thisMonthByLoc.ena}</span>
                    <span className="text-xs text-gray-500">({Math.round(thisMonthByLoc.enaPercent)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${thisMonthByLoc.enaPercent}%`, background: COLORS.primaryGradient || 'linear-gradient(90deg, #00a2ad, #013c4c)' }} />
                </div>
              </div>

              {/* POA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600" />
                    <span className="text-sm font-medium text-gray-700">POA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{thisMonthByLoc.poa}</span>
                    <span className="text-xs text-gray-500">({Math.round(thisMonthByLoc.poaPercent)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-700 bg-gradient-to-r from-orange-500 to-orange-600" style={{ width: `${thisMonthByLoc.poaPercent}%` }} />
                </div>
              </div>

              {/* BOTH */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Both Locations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{thisMonthByLoc.both}</span>
                    <span className="text-xs text-gray-500">({Math.round(thisMonthByLoc.bothPercent)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-700 bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: `${thisMonthByLoc.bothPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Most Frequent Visitors */}
      {visitorAnalytics.mostFrequent.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Most Frequent Visitors</h3>
              <p className="text-sm text-gray-500 mt-1">Top visitors by appointment count</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {visitorAnalytics.mostFrequent.map((v, idx) => (
              <div key={v.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#17A2B8] to-[#0f7a8a] flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.count} {v.count === 1 ? 'visit' : 'visits'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add COLORS object for gradient
const COLORS = {
  primaryGradient: 'linear-gradient(90deg, #00a2ad, #013c4c)',
};

export default function DashboardPage() {
  return (
    <ProtectedPage requiredRoles={['Admin', 'Manager', 'Reception', 'Security', 'Viewer']}>
      <DashboardContent />
    </ProtectedPage>
  );
}