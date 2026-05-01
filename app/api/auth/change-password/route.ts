// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { requireSession } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;

    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    // If userId is provided, the admin is resetting another user's password
    if (userId && s.user.role === 'Admin') {
      // Admin resetting password for another user
      if (!newPassword) {
        return NextResponse.json({ error: 'New password is required' }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await query(
        'UPDATE users SET password_hash = $1, must_change_password = true, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );

      return NextResponse.json({ success: true, message: 'Password reset successfully' });
    }

    // Regular user changing their own password
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [s.user.id]);
    if (!userRes.rows[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = NOW() WHERE id = $2',
      [passwordHash, s.user.id]
    );

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[API] Change password error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}