import { NextRequest, NextResponse } from 'next/server';
import type { Appointment, LocationCode, UserRole } from '@/lib/types';
import { query, mapAppointmentRow } from '@/lib/db';
import { requireSession } from '@/lib/auth-server';
import { logAuditTrail } from '@/lib/audit';

function canSee(role: UserRole, deptId: string | null, aptDept: string, aptDate: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (role === 'Admin' || role === 'Reception' || role === 'Viewer') return true;
  if (role === 'Manager') return deptId === aptDept;
  if (role === 'Security') return aptDate === today;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const hostUserId = searchParams.get('hostUserId');
    const todayOnly = searchParams.get('todayOnly') === 'true';

    const clauses: string[] = [];
    const params: any[] = [];
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    if (departmentId) {
      params.push(departmentId);
      clauses.push(`department_id = $${params.length}`);
    }
    if (hostUserId) {
      params.push(hostUserId);
      clauses.push(`host_user_id = $${params.length}`);
    }
    if (fromDate) {
      params.push(fromDate);
      clauses.push(`appointment_date >= $${params.length}::date`);
    }
    if (toDate) {
      params.push(toDate);
      clauses.push(`appointment_date <= $${params.length}::date`);
    }
    if (todayOnly) {
      clauses.push(`appointment_date = current_date`);
    }
    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
    const { rows } = await query(
      `select * from appointments ${where} order by appointment_date desc, appointment_time desc`,
      params
    );
    const mapped = rows.map(mapAppointmentRow);
    const scoped = mapped.filter((a) =>
      canSee(s.user.role, s.user.departmentId ?? null, a.departmentId, a.appointmentDate)
    );

    return NextResponse.json({
      success: true,
      data: scoped,
      total: scoped.length,
    });
  } catch (error) {
    console.error('[API] Get appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    if (s.user.role === 'Viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const {
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorCompany,
      location,
      appointmentDate,
      appointmentTime,
      purpose,
      otherVisitorNames,
      hostUserId,
      departmentId,
    } = body;

    // Validate required fields
    if (!visitorName || !location || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!hostUserId || !departmentId) {
      return NextResponse.json({ error: 'hostUserId and departmentId are required' }, { status: 400 });
    }

    // Check manager permissions
    if (s.user.role === 'Manager' && s.user.departmentId !== departmentId) {
      return NextResponse.json({ error: 'Managers can only create for their department' }, { status: 403 });
    }

    const { rows } = await query(
      `INSERT INTO appointments (
        visitor_name, visitor_email, visitor_phone, visitor_company, 
        location, appointment_date, appointment_time, purpose, 
        other_visitor_names, host_user_id, department_id, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        visitorName,
        visitorEmail || null,
        visitorPhone || null,
        visitorCompany || null,
        location,
        appointmentDate,
        appointmentTime,
        purpose || null,
        JSON.stringify(Array.isArray(otherVisitorNames) ? otherVisitorNames : []),
        hostUserId,
        departmentId,
        'Scheduled',
        s.user.id,
      ]
    );

    const apt = rows[0];

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Create Appointment',
      'Appointment',
      apt.id,
      null,
      body
    );

    // Insert a notification for the department
    await query(
      `INSERT INTO notifications (department_id, appointment_id, message) 
       VALUES ($1, $2, $3)`,
      [departmentId, apt.id, `New appointment created for visitor ${visitorName} on ${appointmentDate}`]
    );

    return NextResponse.json({ success: true, data: mapAppointmentRow(apt) }, { status: 201 });
  } catch (error) {
    console.error('[API] Create appointment error:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (s.user.role === 'Viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const { id, ...updates } = body as { id: string } & Partial<Appointment>;

    const current = await query('select * from appointments where id = $1', [id]);
    if (!current.rows[0]) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    const oldValues = current.rows[0];
    const mapped = mapAppointmentRow(oldValues);
    if (!canSee(s.user.role, s.user.departmentId ?? null, mapped.departmentId, mapped.appointmentDate)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { rows } = await query(
      'UPDATE appointments SET status = COALESCE($2, status), purpose = COALESCE($3, purpose), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, (updates as any).status ?? null, updates.purpose ?? null]
    );

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Update Appointment',
      'Appointment',
      id,
      oldValues,
      rows[0]
    );

    return NextResponse.json({ success: true, data: mapAppointmentRow(rows[0]) });
  } catch (error) {
    console.error('[API] Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const s = await requireSession();
  if ('response' in s) return s.response;
  if (!(s.user.role === 'Admin' || s.user.role === 'Reception')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const id = request.nextUrl.searchParams.get('id');
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const current = await query('select * from appointments where id = $1', [id]);
    if (!current.rows[0]) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    const oldValues = current.rows[0];

    await query('DELETE FROM appointments WHERE id = $1', [id]);

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Delete Appointment',
      'Appointment',
      id,
      oldValues,
      null
    );

    return NextResponse.json({ success: true, data: mapAppointmentRow(oldValues) });
  } catch (error) {
    console.error('[API] Delete appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}