import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName, verifySession } from './jwt';
import { query, mapUserRow } from './db';

export async function getSessionFromCookies(): Promise<{ userId: string; role: string } | null> {
  const c = await cookies();
  const token = c.get(getSessionCookieName())?.value;
  if (!token) return null;
  try {
    const claims = verifySession(token);
    return { userId: claims.sub, role: claims.role };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<{ user: any } | { response: NextResponse }> {
  const s = await getSessionFromCookies();
  if (!s) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const { rows } = await query('select * from users where id = $1', [s.userId]);
  if (!rows[0]) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user: mapUserRow(rows[0]) };
}

export function hasRole(userRole: string, allowed: string[]) {
  return allowed.includes(userRole);
}

