import { NextResponse } from 'next/server';
import { getSessionCookieName } from '@/lib/jwt';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
  return res;
}

