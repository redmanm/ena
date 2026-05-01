import { Pool, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
  var __dbPoolUrl: string | undefined;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

export function getPool(): Pool {
  const dbUrl = getDatabaseUrl();
  
  // If URL changed or pool doesn't exist, recreate it
  if (!global.__dbPool || global.__dbPoolUrl !== dbUrl) {
    if (global.__dbPool) {
      global.__dbPool.end().catch(() => {});
    }
    global.__dbPool = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
    global.__dbPoolUrl = dbUrl;
  }
  return global.__dbPool;
}

export async function query<T extends QueryResultRow = any>(text: string, params: any[] = []) {
  const pool = getPool();
  return pool.query<T>(text, params);
}

export function mapUserRow(row: any) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phoneNumber: row.phone_number ?? undefined,
    role: row.role,
    departmentId: row.department_id ?? undefined,
    status: row.status,
    mustChangePassword: row.must_change_password,
    lastLogin: row.last_login ? new Date(row.last_login).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function mapDepartmentRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    managerId: row.manager_id ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function mapAppointmentRow(row: any) {
  return {
    id: row.id,
    visitorName: row.visitor_name,
    visitorEmail: row.visitor_email ?? undefined,
    visitorPhone: row.visitor_phone ?? undefined,
    visitorCompany: row.visitor_company ?? undefined,
    location: row.location,
    appointmentDate: row.appointment_date instanceof Date
      ? `${row.appointment_date.getFullYear()}-${String(row.appointment_date.getMonth() + 1).padStart(2, '0')}-${String(row.appointment_date.getDate()).padStart(2, '0')}`
      : row.appointment_date,
    appointmentTime: String(row.appointment_time).slice(0, 5),
    purpose: row.purpose ?? undefined,
    otherVisitorNames: Array.isArray(row.other_visitor_names) ? row.other_visitor_names : (row.other_visitor_names ?? []),
    hostUserId: row.host_user_id,
    departmentId: row.department_id,
    status: row.status,
    createdBy: row.created_by ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function mapCheckinRow(row: any) {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    hasCar: row.has_car,
    plateNumber: row.plate_number ?? undefined,
    hasMaterial: row.has_material,
    materialsName: row.materials_name ?? undefined,
    additionalVisitors: Array.isArray(row.additional_visitors) ? row.additional_visitors : (row.additional_visitors ?? []),
    badgeNumber: row.badge_number ?? undefined,
    checkInTime: new Date(row.check_in_time).toISOString(),
    checkOutTime: row.check_out_time ? new Date(row.check_out_time).toISOString() : undefined,
    checkedInBy: row.checked_in_by ?? undefined,
    checkedOutBy: row.checked_out_by ?? undefined,
  };
}

