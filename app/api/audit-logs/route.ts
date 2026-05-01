import { NextRequest, NextResponse } from 'next/server';
import type { AuditLog } from '@/lib/types';
import { query } from '@/lib/db';
import { requireSession } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    const searchParams = request.nextUrl.searchParams;

    if (searchParams.get('stats') === 'true') {
      const totalRes = await query<{ count: string }>('select count(*)::text as count from audit_logs');
      const byAction = await query<{ action: string; count: string }>(
        'select action, count(*)::text as count from audit_logs group by action'
      );
      const byEntity = await query<{ entity_type: string; count: string }>(
        'select entity_type, count(*)::text as count from audit_logs group by entity_type'
      );
      const usersRes = await query<{ count: string }>('select count(distinct user_id)::text as count from audit_logs');
      const todayRes = await query<{ count: string }>(
        "select count(*)::text as count from audit_logs where created_at::date = current_date"
      );
      return NextResponse.json({
        success: true,
        data: {
          totalLogs: parseInt(totalRes.rows[0]?.count ?? '0', 10),
          actionBreakdown: Object.fromEntries(byAction.rows.map((r) => [r.action, parseInt(r.count, 10)])),
          entityTypeBreakdown: Object.fromEntries(byEntity.rows.map((r) => [r.entity_type, parseInt(r.count, 10)])),
          activeUsers: parseInt(usersRes.rows[0]?.count ?? '0', 10),
          logsToday: parseInt(todayRes.rows[0]?.count ?? '0', 10),
        },
      });
    }

    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');
    const entityId = searchParams.get('entityId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const clauses: string[] = [];
    const params: any[] = [];
    if (action) {
      params.push(action);
      clauses.push(`action = $${params.length}`);
    }
    if (entityType) {
      params.push(entityType);
      clauses.push(`entity_type = $${params.length}`);
    }
    if (userId) {
      params.push(userId);
      clauses.push(`user_id = $${params.length}`);
    }
    if (entityId) {
      params.push(entityId);
      clauses.push(`entity_id::text = $${params.length}`);
    }
    if (fromDate) {
      params.push(fromDate);
      clauses.push(`created_at >= $${params.length}::timestamptz`);
    }
    if (toDate) {
      params.push(toDate);
      clauses.push(`created_at <= $${params.length}::timestamptz`);
    }
    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
    const { rows } = await query(
      `SELECT al.*, u.full_name as executor_name 
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id 
       ${where} 
       ORDER BY al.created_at DESC 
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const countRes = await query<{ count: string }>(
      `select count(*)::text as count from audit_logs ${where}`,
      params
    );
    const paginated = rows.map((r: any) => ({
      id: r.id,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id ?? undefined,
      userId: r.user_id ?? undefined,
      userName: r.executor_name ?? 'System',
      oldValues: r.old_values ?? undefined,
      newValues: r.new_values ?? undefined,
      ipAddress: r.ip_address ?? undefined,
      userAgent: r.user_agent ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
    })) as any[];

    return NextResponse.json({
      success: true,
      data: paginated,
      total: parseInt(countRes.rows[0]?.count ?? '0', 10),
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] Get audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (s.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { action, entityType, entityId, oldValues, newValues } = body;

    if (!action || !entityType) {
      return NextResponse.json({ error: 'Missing action or entityType' }, { status: 400 });
    }

    const { rows } = await query(
      'insert into audit_logs (action, entity_type, entity_id, user_id, old_values, new_values) values ($1,$2,$3,$4,$5::jsonb,$6::jsonb) returning *',
      [action, entityType, entityId ?? null, s.user.id, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null]
    );
    const r = rows[0];
    return NextResponse.json(
      {
        success: true,
        data: {
          id: r.id,
          action: r.action,
          entityType: r.entity_type,
          entityId: r.entity_id ?? undefined,
          userId: r.user_id ?? undefined,
          oldValues: r.old_values ?? undefined,
          newValues: r.new_values ?? undefined,
          createdAt: new Date(r.created_at).toISOString(),
        } as AuditLog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Create audit log error:', error);
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}
