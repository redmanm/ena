import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/lib/types';
import { query, mapUserRow } from '@/lib/db';
import { requireSession } from '@/lib/auth-server';
import { logAuditTrail } from '@/lib/audit';

const ROLES: UserRole[] = ['Admin', 'Manager', 'Reception', 'Security', 'Viewer'];
const DEFAULT_PASSWORD = 'Ena@321#';

export async function GET(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') as UserRole | null;
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const clauses: string[] = [];
    const params: any[] = [];
    if (role && ROLES.includes(role)) {
      params.push(role);
      clauses.push(`role = $${params.length}`);
    }
    if (departmentId) {
      params.push(departmentId);
      clauses.push(`department_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${String(search).toLowerCase()}%`);
      clauses.push(`(lower(full_name) like $${params.length} or lower(email) like $${params.length})`);
    }
    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
    const { rows } = await query(`select * from users ${where} order by created_at desc`, params);

    return NextResponse.json({
      success: true,
      data: rows.map(mapUserRow),
      total: rows.length,
    });
  } catch (error) {
    console.error('[API] Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (s.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const { fullName, email, phoneNumber, role, departmentId } = body as {
      fullName: string;
      email: string;
      phoneNumber?: string;
      role: UserRole;
      departmentId?: string;
    };

    if (!fullName || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (role === 'Manager' && !departmentId) {
      return NextResponse.json({ error: 'Managers must have a department' }, { status: 400 });
    }

    const exists = await query('select 1 from users where email = $1', [String(email).toLowerCase()]);
    if (exists.rows.length) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const { rows } = await query(
      'insert into users (full_name, email, phone_number, password_hash, role, department_id, status, must_change_password) values ($1,$2,$3,$4,$5,$6,$7,true) returning *',
      [fullName, String(email).toLowerCase(), phoneNumber ?? null, passwordHash, role, departmentId ?? null, 'Active']
    );

    // If this is a department manager, attach to department and mark department Active.
    if (role === 'Manager' && departmentId) {
      await query(
        "update departments set manager_id = $2, status = 'Active', updated_at = now() where id = $1",
        [departmentId, rows[0].id]
      );
    }

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Create User',
      'User',
      rows[0].id,
      null,
      { fullName, email, role, departmentId }
    );

    return NextResponse.json({ success: true, data: mapUserRow(rows[0]) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (s.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const { id, fullName, email, phoneNumber, role, departmentId, status } = body as any;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const current = await query('select * from users where id = $1', [id]);
    if (!current.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const oldValues = current.rows[0];
    const prevRole = oldValues.role as UserRole;
    const prevDept = oldValues.department_id as string | null;
    const nextRole = (role ?? prevRole) as UserRole;
    const nextDept =
      departmentId === null || departmentId === '' ? null : departmentId ?? oldValues.department_id;

    if (nextRole === 'Manager' && !nextDept) {
      return NextResponse.json({ error: 'Managers must have a department' }, { status: 400 });
    }

    if (email && String(email).toLowerCase() !== oldValues.email) {
      const dup = await query('select 1 from users where email = $1 and id <> $2', [String(email).toLowerCase(), id]);
      if (dup.rows.length) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const { rows } = await query(
      'update users set full_name = coalesce($2, full_name), email = coalesce($3, email), phone_number = coalesce($4, phone_number), role = coalesce($5, role), department_id = $6, status = coalesce($7, status), updated_at = now() where id = $1 returning *',
      [id, fullName ?? null, email ? String(email).toLowerCase() : null, phoneNumber ?? null, role ?? null, nextDept, status ?? null]
    );

    // Keep department.manager_id in sync with manager assignment.
    if (prevRole === 'Manager' && prevDept && (nextRole !== 'Manager' || nextDept !== prevDept)) {
      await query(
        "update departments set manager_id = null, status = 'Inactive', updated_at = now() where id = $1 and manager_id = $2",
        [prevDept, id]
      );
    }
    if (nextRole === 'Manager' && nextDept) {
      await query(
        "update departments set manager_id = $2, status = 'Active', updated_at = now() where id = $1",
        [nextDept, id]
      );
    }

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Update User',
      'User',
      id,
      oldValues,
      rows[0]
    );

    return NextResponse.json({ success: true, data: mapUserRow(rows[0]) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (s.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const id = request.nextUrl.searchParams.get('id');
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    if (id === s.user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

    const current = await query('select * from users where id = $1', [id]);
    if (!current.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const oldValues = current.rows[0];

    // If deleting a manager, clear the department manager pointer.
    await query(
      "update departments set manager_id = null, status = 'Inactive', updated_at = now() where manager_id = $1",
      [id]
    );

    await query('delete from users where id = $1', [id]);

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Delete User',
      'User',
      id,
      oldValues,
      null
    );

    return NextResponse.json({ success: true, data: mapUserRow(oldValues) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

