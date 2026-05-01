import jwt from 'jsonwebtoken';
import type { UserRole } from './types';

const COOKIE_NAME = 'ena_session';

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export interface SessionClaims {
  sub: string; // userId
  role: UserRole;
}

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

export function signSession(claims: SessionClaims) {
  const expiresInRaw = process.env.JWT_EXPIRES_IN || '21600'; // seconds
  const expiresIn = Number.isFinite(Number(expiresInRaw)) ? Number(expiresInRaw) : 21600;
  return jwt.sign(claims, getSecret(), { expiresIn });
}

export function verifySession(token: string): SessionClaims {
  return jwt.verify(token, getSecret()) as SessionClaims;
}

