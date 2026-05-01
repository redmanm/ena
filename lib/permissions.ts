import type { UserRole } from './types';

export type Permission =
  | 'view_dashboard'
  | 'create_appointment'
  | 'view_all_appointments'
  | 'view_dept_appointments'
  | 'view_today_appointments'
  | 'manage_users'
  | 'manage_departments'
  | 'view_checked_in'
  | 'checkin_checkout'
  | 'view_visit_history'
  | 'view_reports'
  | 'view_audit_trail';

const rolePermissions: Record<UserRole, Permission[]> = {
  Admin: [
    'view_dashboard',
    'view_all_appointments',
    'create_appointment',
    'manage_users',
    'manage_departments',
    'view_visit_history',
    'view_reports',
    'view_audit_trail',
  ],
  Security: [
    'view_dashboard',
    'view_today_appointments',
    'create_appointment', // Renamed to Walk-in in sidebar
    'view_checked_in',
    'checkin_checkout',
    'view_visit_history',
  ],
  Reception: [
    'view_dashboard',
    'view_all_appointments',
    'create_appointment',
    'view_visit_history',
    'view_reports',
  ],
  Manager: [
    'view_dashboard',
    'view_dept_appointments',
    'create_appointment',
    'view_visit_history',
    'view_reports',
  ],
  Viewer: [
    'view_dashboard',
    'view_today_appointments',
    'view_visit_history',
    'view_reports',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export interface MenuItemDef {
  label: string;
  href: string;
  permission: Permission;
}

/** Sidebar items: filtered by `hasPermission(role, permission)` */
export function getVisibleMenuItems(role: UserRole): MenuItemDef[] {
  const all: MenuItemDef[] = [
    { label: 'Dashboard', href: '/dashboard', permission: 'view_dashboard' },
    { label: 'All Appointments', href: '/appointments', permission: 'view_all_appointments' },
    { label: 'Department Appointments', href: '/appointments', permission: 'view_dept_appointments' },
    { label: "Today's Appointments", href: '/appointments', permission: 'view_today_appointments' },
    {
      label: role === 'Security' ? 'Walk-in Appointment' : 'Create Appointment',
      href: '/appointments/create',
      permission: 'create_appointment'
    },
    { label: 'User Management', href: '/users', permission: 'manage_users' },
    { label: 'Department Management', href: '/departments', permission: 'manage_departments' },
    { label: 'Check-in Queue', href: '/checked-in-users', permission: 'view_checked_in' },
    { label: 'Visitors Inside', href: '/checked-out', permission: 'checkin_checkout' },
    {
      label: role === 'Manager' ? 'View History' : (role === 'Security' ? 'History' : 'Visit History'),
      href: '/visit-history',
      permission: 'view_visit_history'
    },
    { label: 'Reports', href: '/reports', permission: 'view_reports' },
    { label: 'Audit Trail', href: '/audit-trail', permission: 'view_audit_trail' },
  ];

  // Specific filtering for roles that have specific view requirements
  const items = all.filter((item) => hasPermission(role, item.permission));

  // Security role specific: Checked In and Checked Out items
  if (role === 'Security') {
    // Ensure Checked In and Checked Out are present if permissions allow
    // (Already handled by filter if permissions are correct)
  }

  return items;
}

