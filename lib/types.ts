export type UserRole = 'Admin' | 'Manager' | 'Reception' | 'Security' | 'Viewer';

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';

export type LocationCode = 'ENA' | 'POA' | 'Both';

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  /** Plain password for mock login only — never returned from API */
  password?: string;
  role: UserRole;
  departmentId?: string;
  status: 'Active' | 'Inactive';
  mustChangePassword?: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  visitorName: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorCompany?: string;
  location: LocationCode;
  appointmentDate: string;
  appointmentTime: string;
  purpose?: string;
  otherVisitorNames: string[];
  hostUserId: string;
  departmentId: string;
  status: AppointmentStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorCheckIn {
  id: string;
  appointmentId: string;
  hasCar: boolean;
  plateNumber?: string;
  hasMaterial: boolean;
  materialsName?: string;
  additionalVisitors: string[];
  badgeNumber?: string;
  checkInTime: string;
  checkOutTime?: string;
  checkedInBy?: string;
  checkedOutBy?: string;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'LOGIN';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalAppointments: number;
  checkedInToday: number;
  pendingApprovals: number;
  totalVisitors: number;
  averageWaitTime?: number;
}
