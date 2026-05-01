import { NextRequest, NextResponse } from 'next/server';
import type { Department } from '@/lib/types';
import { query, mapDepartmentRow } from '@/lib/db';
import { requireSession } from '@/lib/auth-server';
import { logAuditTrail } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    const { rows } = await query('select * from departments order by name asc');
    const countRes = await query<{ count: string }>('select count(*)::text as count from departments');
    return NextResponse.json({
      success: true,
      data: rows.map(mapDepartmentRow),
      total: parseInt(countRes.rows[0]?.count ?? '0', 10),
    });
  } catch (error) {
    console.error('[API] Get departments error:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (s.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const exists = await query('select 1 from departments where name = $1', [name]);
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 409 });
    }

    const { rows } = await query(
      'insert into departments (name, description, status) values ($1, $2, $3) returning *',
      [name, description ?? null, 'Inactive']
    );

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Create Department',
      'Department',
      rows[0].id,
      null,
      { name, description }
    );

    return NextResponse.json({ success: true, data: mapDepartmentRow(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error('[API] Create department error:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (s.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const { id, ...updates } = body as { id: string } & Partial<Department>;

    const current = await query('select * from departments where id = $1', [id]);
    if (!current.rows[0]) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    const oldValues = current.rows[0];

    if (updates.name && updates.name !== oldValues.name) {
      const dup = await query('select 1 from departments where name = $1 and id <> $2', [updates.name, id]);
      if (dup.rows.length > 0) {
        return NextResponse.json({ error: 'Department name already exists' }, { status: 409 });
      }
    }

    const { rows } = await query(
      'update departments set name = coalesce($2, name), description = coalesce($3, description), updated_at = now() where id = $1 returning *',
      [id, updates.name ?? null, updates.description ?? null]
    );

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Update Department',
      'Department',
      id,
      oldValues,
      rows[0]
    );

    return NextResponse.json({ success: true, data: mapDepartmentRow(rows[0]) });
  } catch (error) {
    console.error('[API] Update department error:', error);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (s.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const id = request.nextUrl.searchParams.get('id');
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const current = await query('select * from departments where id = $1', [id]);
    if (!current.rows[0]) return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    const oldValues = current.rows[0];

    const usersInDept = await query('select 1 from users where department_id = $1 limit 1', [id]);
    if (usersInDept.rows.length > 0) {
      return NextResponse.json({ error: 'Cannot delete department with assigned users' }, { status: 409 });
    }

    await query('delete from departments where id = $1', [id]);

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Delete Department',
      'Department',
      id,
      oldValues,
      null
    );

    return NextResponse.json({ success: true, data: mapDepartmentRow(oldValues) });
  } catch (error) {
    console.error('[API] Delete department error:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}

