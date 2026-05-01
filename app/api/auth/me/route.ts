import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';

export async function GET() {
  const s = await requireSession();
  if ('response' in s) return s.response;
  return NextResponse.json({ success: true, user: s.user });
}

