import { query } from './db';

export async function hostNameForAppointment(hostUserId: string): Promise<string> {
  const { rows } = await query('select full_name from users where id = $1', [hostUserId]);
  return rows[0]?.full_name ?? '—';
}

export async function departmentNameForAppointment(departmentId: string): Promise<string> {
  const { rows } = await query('select name from departments where id = $1', [departmentId]);
  return rows[0]?.name ?? '—';
}

