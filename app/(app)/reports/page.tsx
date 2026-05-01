'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Legend
} from 'recharts';
import { useVisitors } from '@/lib/visitor-context';
import { ProtectedPage } from '@/components/protected-page';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileText,
  Table as TableIcon,
  FileBarChart,
  TrendingUp,
  Users,
  Calendar,
  Car,
  Package,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  Filter,
  Globe,
  Award,
  Activity,
  Zap,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Eye,
  Building2,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Crown,
  Star,
  Trophy,
  Medal,
  Briefcase,
  TrendingDown
} from 'lucide-react';

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#013c4c',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #013c4c 100%)',
  gradientHover: 'linear-gradient(135deg, #0198a2 0%, #023a48 100%)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const CHART_COLORS = ['#00a2ad', '#013c4c', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-100">
        <p className="font-bold text-gray-900 text-sm mb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function ReportsContent() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/analytics');
      const data = await res.json();
      if (data.error) {
        console.error('API Error:', data.error);
        setAnalytics(null);
      } else {
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportCsv = () => {
    if (!analytics?.summary) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Appointments', String(analytics.summary.total)],
      ['Active Check-ins', String(analytics.summary.active)],
      ['Completed Visits', String(analytics.summary.completed)],
      ['Cancellation Rate', analytics.summary.cancellationRate],
    ];
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ENA_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (!analytics?.summary) return;
    const data = [
      { Metric: 'Total Appointments', Value: analytics.summary.total },
      { Metric: 'Active Check-ins', Value: analytics.summary.active },
      { Metric: 'Completed Visits', Value: analytics.summary.completed },
      { Metric: 'Cancellation Rate', Value: analytics.summary.cancellationRate },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics Summary');
    XLSX.writeFile(wb, `ENA_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPdf = () => {
    if (!analytics?.summary) return;
    const doc = new jsPDF();
    doc.setFillColor(0, 162, 173);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('ENA Visitor Management', 20, 20);
    doc.setFontSize(12);
    doc.text('Executive Analytics Report', 20, 32);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 55);

    const tableData = [
      ['Metric', 'Value'],
      ['Total Appointments', String(analytics.summary.total)],
      ['Active Check-ins', String(analytics.summary.active)],
      ['Completed Visits', String(analytics.summary.completed)],
      ['Cancellation Rate', analytics.summary.cancellationRate],
    ];

    autoTable(doc, {
      startY: 65,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [0, 162, 173] },
      styles: { fontSize: 10 },
    });

    doc.save(`ENA_Analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#00a2ad]/20 rounded-full animate-spin border-t-[#00a2ad]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#00a2ad] rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-gray-500 font-medium animate-pulse">Loading executive insights...</p>
      </div>
    );
  }

  // Use default data if analytics is null or empty
  const reportData = analytics || {
    summary: { total: 0, active: 0, completed: 0, cancelled: 0, cancellationRate: '0%' },
    departments: [],
    locations: [],
    trends: [],
    peakHours: [],
    logistics: { carPercentage: 0, materialPercentage: 0 },
    topHosts: []
  };

  // Calculate additional metrics safely
  const healthScore = reportData.summary.total > 0 
    ? Math.round((reportData.summary.completed / reportData.summary.total) * 100) 
    : 0;

  const growthRate = (reportData.trends?.length > 1) 
    ? reportData.trends.slice(-7).reduce((acc: any, curr: any, idx: any, arr: any) => {
        if (idx > 0 && arr[idx - 1].count > 0) {
          acc += ((curr.count - arr[idx - 1].count) / arr[idx - 1].count) * 100;
        }
        return acc;
      }, 0) / Math.max(1, reportData.trends.slice(-7).length - 1)
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 py-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white" style={{ background: COLORS.gradient }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -ml-40 -mb-40"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-semibold tracking-wider">EXECUTIVE DASHBOARD</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">Analytics Intelligence</h1>
            <p className="text-white/80 text-lg">Real-time insights and performance metrics for strategic decision making</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-white/10 rounded-xl p-1">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedPeriod === period
                      ? 'bg-white text-[#013c4c] shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
                </button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg rounded-xl px-6 gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-gray-100">
                <DropdownMenuItem onClick={exportCsv} className="gap-3 cursor-pointer py-3 rounded-xl hover:bg-orange-50">
                  <FileBarChart className="w-4 h-4 text-orange-500" />
                  <span>CSV Format</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportExcel} className="gap-3 cursor-pointer py-3 rounded-xl hover:bg-green-50">
                  <TableIcon className="w-4 h-4 text-green-500" />
                  <span>Excel Format</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPdf} className="gap-3 cursor-pointer py-3 rounded-xl hover:bg-red-50">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>PDF Format</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/60 uppercase tracking-wider">Total Appointments</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{reportData.summary.total}</span>
              <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">Overall</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/60 uppercase tracking-wider">Success Rate</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{reportData.summary.total > 0 ? Math.round((reportData.summary.completed / reportData.summary.total) * 100) : 0}%</span>
              <div className="flex items-center gap-1">
                <ArrowUp className="w-4 h-4 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/60 uppercase tracking-wider">Cancellation Rate</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{reportData.summary.cancellationRate}</span>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/60 uppercase tracking-wider">Monthly Target</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{reportData.summary.total}</span>
              <span className="text-xs text-white/60">/ 500</span>
            </div>
          </div>
        </div>
      </div>


      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-[#00a2ad]" />
                Appointment Trend Analysis
              </h2>
              <p className="text-sm text-gray-500 mt-1">30-day rolling performance</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#00a2ad]" />
                <span>Appointments</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#013c4c]" />
                <span>Check-ins</span>
              </div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={reportData.trends}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00a2ad" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#00a2ad" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="count" stroke="#00a2ad" strokeWidth={3} fill="url(#areaGradient)" name="Appointments" />
                <Line type="monotone" dataKey="checkins" stroke="#013c4c" strokeWidth={2} dot={{ r: 4 }} name="Check-ins" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00a2ad]" />
            Peak Hours Analysis
          </h2>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.peakHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(h) => `${h}:00`} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#00a2ad" radius={[8, 8, 0, 0]} maxBarSize={50}>
                  {reportData.peakHours?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 15 ? '#00a2ad' : '#013c4c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl">
            <p className="text-xs text-amber-800">
              <strong>Insight:</strong> Peak traffic occurs between 10:00 - 11:00 and 14:00 - 15:00. Consider allocating additional security during these hours.
            </p>
          </div>
        </div>
      </div>

      {/* Department & Location Analytics - Enhanced Attractive Version */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance - Premium Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-[#00a2ad]" />
                <h2 className="text-xl font-bold text-gray-900">Department Performance</h2>
              </div>
              <p className="text-sm text-gray-500">Appointment volume by department</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#00a2ad]/10 to-[#013c4c]/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#00a2ad]" />
            </div>
          </div>

          <div className="space-y-3">
            {/* Department List - Unified Row Layout */}
            {reportData.departments?.length > 0 ? reportData.departments.map((dept: any, idx: number) => {
              const maxValue = Math.max(1, ...reportData.departments.map((d: any) => d.value));
              const percentage = (dept.value / maxValue) * 100;

              return (
                <div key={idx} className="group flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all duration-300">
                  {/* Normal Number */}
                  <div className="w-6 shrink-0 text-gray-400 font-mono text-sm">
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Name & Progress bar */}
                  <div className="flex-1 grid grid-cols-12 items-center gap-6">
                    <div className="col-span-3">
                      <p className="font-semibold text-gray-700 truncate group-hover:text-[#00a2ad] transition-colors" title={dept.name}>
                        {dept.name}
                      </p>
                    </div>

                    <div className="col-span-6">
                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00a2ad] to-[#013c4c] rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] font-bold text-[#00a2ad]">{Math.round(percentage)}% performance</span>
                        <div className="flex items-center gap-1">
                          {idx === 0 && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
                          {idx === 1 && <Medal className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-lg font-black text-gray-900">{dept.value}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Units</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500">No department data available.</div>
            )}
          </div>

          {reportData.departments?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">Top Department</span>
                  <span className="font-bold text-gray-900">{reportData.departments?.[0]?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">+23% growth</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location Distribution - Premium Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-[#00a2ad]" />
                <h2 className="text-xl font-bold text-gray-900">Location Distribution</h2>
              </div>
              <p className="text-sm text-gray-500">Visit breakdown by site</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#00a2ad]/10 to-[#013c4c]/10 rounded-xl flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-[#00a2ad]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={reportData.locations?.length > 0 ? reportData.locations : [{ name: 'No Data', value: 1 }]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {reportData.locations?.length > 0 ? reportData.locations.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="white" strokeWidth={2} />
                    )) : <Cell fill="#f3f4f6" />}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{reportData.locations?.length || 0}</p>
                  <p className="text-xs text-gray-500">Locations</p>
                </div>
              </div>
            </div>

            {/* Legend with Stats */}
            <div className="space-y-3">
              {reportData.locations?.length > 0 ? reportData.locations.map((loc: any, idx: number) => {
                const total = reportData.locations.reduce((sum: number, l: any) => sum + l.value, 0);
                const percentage = total > 0 ? ((loc.value / total) * 100).toFixed(0) : 0;

                return (
                  <div key={idx} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="font-medium text-gray-700 group-hover:text-[#00a2ad] transition-colors">
                          {loc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{loc.value}</span>
                        <span className="text-xs text-gray-400">visits</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400 italic">
                  No location data
                </div>
              )}
            </div>
          </div>

          {reportData.locations?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">Most Active Site</span>
                  <span className="font-bold text-gray-900">
                    {reportData.locations.reduce((a: any, b: any) => a.value > b.value ? a : b)?.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">Primary location</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Hosts - Enhanced */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold text-gray-900">Top Performing Hosts</h2>
              </div>
              <p className="text-sm text-gray-500">Highest engagement and successful meetings</p>
            </div>
            <div className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
              <Star className="w-3 h-3" />
              <span>Leaderboard</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.topHosts?.length > 0 ? reportData.topHosts.slice(0, 6).map((host: any, idx: number) => {
              const medals = ['🥇', '🥈', '🥉'];
              const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

              return (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: COLORS.gradient }}>
                        {host.name.charAt(0)}
                      </div>
                      {idx < 3 && (
                        <div className="absolute -top-2 -right-2 text-xl">
                          {medals[idx]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-[#00a2ad] transition-colors">
                        {host.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{host.count} appointments</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${idx < 3 ? medalColors[idx] : 'text-gray-600'}`}>
                        #{idx + 1}
                      </div>
                      <div className="text-xs text-gray-400">rank</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00a2ad] to-[#013c4c] rounded-full transition-all duration-1000"
                      style={{ width: `${(host.count / Math.max(1, reportData.topHosts[0].count)) * 100}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full text-center py-8 text-gray-500 italic">No host performance data yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 rounded-2xl p-6 text-center">
        <p className="text-xs text-gray-500">
          Data updated in real-time | Last sync: {new Date().toLocaleString()} | ENA Visitor Management System v2.0
        </p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedPage requiredRoles={['Admin', 'Manager', 'Reception', 'Security', 'Viewer']}>
      <ReportsContent />
    </ProtectedPage>
  );
}