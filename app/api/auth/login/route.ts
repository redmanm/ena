import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, mapUserRow } from '@/lib/db';
import { getSessionCookieName, signSession } from '@/lib/jwt';
import { logAuditTrail } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase();
    const { rows } = await query('select * from users where email = $1', [normalizedEmail]);
    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { error: 'No user found with that email', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    if (row.status !== 'Active') {
      return NextResponse.json(
        { error: 'Your account is inactive. Contact an administrator.', code: 'USER_INACTIVE' },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect password', code: 'WRONG_PASSWORD' }, { status: 401 });
    }

    // Update last_login
    await query('update users set last_login = now(), updated_at = now() where id = $1', [row.id]);

    // Log audit trail
    await logAuditTrail(
      { userId: row.id, userAgent, ipAddress },
      'Login',
      'User',
      row.id,
      null,
      { lastLogin: new Date().toISOString() }
    );

    const safeUser = mapUserRow({ ...row, last_login: new Date() });
    const token = signSession({ sub: safeUser.id, role: safeUser.role });
    
    const res = NextResponse.json({ success: true, user: safeUser });
    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('[API] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

