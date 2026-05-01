import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireSession } from '@/lib/auth-server';

export async function PUT(request: NextRequest) {
    try {
        const s = await requireSession();
        if ('response' in s) return s.response;

        const body = await request.json();
        const { fullName, phoneNumber } = body;

        if (!fullName) {
            return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
        }

        // Update the user's own profile
        const { rows } = await query(
            `UPDATE users 
       SET full_name = $1, 
           phone_number = $2, 
           updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
            [fullName, phoneNumber || null, s.user.id]
        );

        if (!rows[0]) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: rows[0].id,
                fullName: rows[0].full_name,
                email: rows[0].email,
                phoneNumber: rows[0].phone_number,
                role: rows[0].role,
                departmentId: rows[0].department_id,
                status: rows[0].status
            }
        });
    } catch (error) {
        console.error('[API] Update profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const s = await requireSession();
        if ('response' in s) return s.response;

        const { rows } = await query(
            `SELECT id, full_name, email, phone_number, role, department_id, status 
       FROM users 
       WHERE id = $1`,
            [s.user.id]
        );

        if (!rows[0]) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: rows[0].id,
            fullName: rows[0].full_name,
            email: rows[0].email,
            phoneNumber: rows[0].phone_number,
            role: rows[0].role,
            departmentId: rows[0].department_id,
            status: rows[0].status
        });
    } catch (error) {
        console.error('[API] Get profile error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}