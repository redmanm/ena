import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName } from '@/lib/jwt';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/me', '/_next', '/favicon.ico'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Protect app + API routes
  if (pathname.startsWith('/api/')) {
    // let API routes decide authorization if needed, but ensure a session exists for non-public
    const token = req.cookies.get(getSessionCookieName())?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.next();
  }

  // App routes (everything under /(app) maps to normal paths like /dashboard)
  const token = req.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico)).*)'],
};

