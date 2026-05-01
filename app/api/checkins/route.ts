import { NextRequest, NextResponse } from 'next/server';
import type { VisitorCheckIn } from '@/lib/types';
import { query, mapCheckinRow } from '@/lib/db';
import { requireSession } from '@/lib/auth-server';
import { logAuditTrail } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    const appointmentId = request.nextUrl.searchParams.get('appointmentId');
    const openOnly = request.nextUrl.searchParams.get('openOnly') === 'true';

    const clauses: string[] = [];
    const params: any[] = [];
    if (appointmentId) {
      params.push(appointmentId);
      clauses.push(`appointment_id = $${params.length}`);
    }
    if (openOnly) clauses.push(`check_out_time is null`);
    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
    const { rows } = await query(`select * from visitor_checkins ${where} order by check_in_time desc`, params);

    return NextResponse.json({ success: true, data: rows.map(mapCheckinRow), total: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    if (s.user.role === 'Viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!(s.user.role === 'Admin' || s.user.role === 'Reception' || s.user.role === 'Security' || s.user.role === 'Manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const {
      appointmentId,
      hasCar,
      plateNumber,
      hasOtherMaterial,
      materialDetails,
      additionalVisitors,
      badgeNumber,
    } = body as {
      appointmentId: string;
      hasCar: boolean;
      plateNumber?: string;
      hasOtherMaterial: boolean;
      materialDetails?: string;
      additionalVisitors?: string[];
      badgeNumber?: string;
    };

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId required' }, { status: 400 });
    }

    const aptRes = await query('select * from appointments where id = $1', [appointmentId]);
    if (!aptRes.rows[0]) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const open = await query(
      'select 1 from visitor_checkins where appointment_id = $1 and check_out_time is null limit 1',
      [appointmentId]
    );
    if (open.rows.length) {
      return NextResponse.json({ error: 'Visitor already checked in for this appointment' }, { status: 409 });
    }

    if (hasCar && !plateNumber?.trim()) {
      return NextResponse.json({ error: 'Plate number required when has car' }, { status: 400 });
    }
    if (hasOtherMaterial && !materialDetails?.trim()) {
      return NextResponse.json({ error: 'Materials description required' }, { status: 400 });
    }

    const { rows } = await query(
      'insert into visitor_checkins (appointment_id, has_car, plate_number, has_material, materials_name, additional_visitors, badge_number, checked_in_by) values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8) returning *',
      [
        appointmentId,
        Boolean(hasCar),
        hasCar ? plateNumber?.trim() ?? null : null,
        Boolean(hasOtherMaterial),
        hasOtherMaterial ? materialDetails?.trim() ?? null : null,
        JSON.stringify(Array.isArray(additionalVisitors) ? additionalVisitors : []),
        badgeNumber?.trim() ?? null,
        s.user.id,
      ]
    );
    await query(
      'update appointments set status = $2, other_visitor_names = $3::jsonb, updated_at = now() where id = $1',
      [appointmentId, 'CheckedIn', JSON.stringify(Array.isArray(additionalVisitors) ? additionalVisitors : [])]
    );

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Visitor Check-in',
      'Check-in',
      rows[0].id,
      null,
      rows[0]
    );

    return NextResponse.json({ success: true, data: mapCheckinRow(rows[0]) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const s = await requireSession();
    if ('response' in s) return s.response;
    if (s.user.role === 'Viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    
    let id = request.nextUrl.searchParams.get('id');
    if (!id) {
      try {
        const b = (await request.json()) as { id?: string };
        id = b.id ?? null;
      } catch {
        id = null;
      }
    }
    if (!id) {
      return NextResponse.json({ error: 'checkin id required' }, { status: 400 });
    }

    const current = await query('select * from visitor_checkins where id = $1', [id]);
    if (!current.rows[0]) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }
    const oldValues = current.rows[0];
    if (oldValues.check_out_time) {
      return NextResponse.json({ error: 'Already checked out' }, { status: 409 });
    }

    const { rows } = await query(
      'update visitor_checkins set check_out_time = now(), checked_out_by = $2 where id = $1 returning *',
      [id, s.user.id]
    );
    await query('update appointments set status = $2, updated_at = now() where id = $1', [
      rows[0].appointment_id,
      'CheckedOut',
    ]);

    // Log audit trail
    await logAuditTrail(
      { userId: s.user.id, userAgent, ipAddress },
      'Visitor Check-out',
      'Check-in',
      id,
      oldValues,
      rows[0]
    );

    return NextResponse.json({ success: true, data: mapCheckinRow(rows[0]) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Check-out failed' }, { status: 500 });
  }
}

