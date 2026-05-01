import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireSession } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    
    if (!s.user.departmentId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { rows } = await query(
      'SELECT * FROM notifications WHERE department_id = $1 AND read_at IS NULL ORDER BY created_at DESC',
      [s.user.departmentId]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[API] Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    
    if (!s.user.departmentId) {
      return NextResponse.json({ success: true });
    }

    // Mark all notifications for this department as read
    await query(
      'UPDATE notifications SET read_at = now() WHERE department_id = $1 AND read_at IS NULL',
      [s.user.departmentId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Mark notifications read error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 });
  }
}
