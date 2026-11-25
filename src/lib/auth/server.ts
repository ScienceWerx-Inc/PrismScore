import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User as DbUser } from '@prisma/client';
import { prisma } from '@/lib/db';
import { DEMO_COMPANY_ID } from '@/lib/product';
import { issueToken, readToken, SESSION_TTL_MS } from './token';

export const SESSION_COOKIE = 'prism_session';

/** A signed-in user, without credential fields. */
export type User = Omit<DbUser, 'passwordHash' | 'sessionVersion'>;

export type Role = 'ADMIN' | 'EXECUTIVE' | 'STAFF' | 'PLATFORM_ADMIN';

/** Thrown by the guards below; `handleAuthError` turns it into a JSON response. */
export class AuthError extends Error {
  constructor(public status: 401 | 403 | 404, message: string) {
    super(message);
  }
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    // Fail closed: never sign sessions with a guessable key in production.
    throw new Error('AUTH_SECRET is missing or shorter than 32 characters.');
  }
  return 'dev-only-prismscore-session-secret-not-for-production';
}

/** The signed-in user, re-read from the database on every call (so revocation is immediate). */
export async function currentUser(): Promise<User | null> {
  const claims = readToken(cookies().get(SESSION_COOKIE)?.value, sessionSecret());
  if (!claims) return null;
  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    omit: { passwordHash: false, sessionVersion: false },
  });
  if (!user || !user.passwordHash || user.sessionVersion !== claims.sessionVersion) return null;
  const { passwordHash: _h, sessionVersion: _v, ...safe } = user;
  return safe;
}

export async function requireUser(roles?: Role[]): Promise<User> {
  const user = await currentUser();
  if (!user) throw new AuthError(401, 'Please sign in.');
  if (roles && !roles.includes(user.role as Role)) {
    throw new AuthError(403, 'Your role does not have access to this.');
  }
  return user;
}

/**
 * Which company a request may act on.
 * - Signed in: always the user's own company. A different `requested` id is refused,
 *   except read-only access to the public demo company when `allowDemo` is set.
 * - Signed out: only the demo company, and only when `allowDemo` is set.
 */
export async function companyAccess(
  requested: string | null | undefined,
  opts: { allowDemo?: boolean; roles?: Role[] } = {},
): Promise<{ companyId: string; user: User | null; isDemo: boolean }> {
  const wantsDemo = !requested || requested === DEMO_COMPANY_ID;
  const user = await currentUser();

  if (!user) {
    if (opts.allowDemo && wantsDemo) return { companyId: DEMO_COMPANY_ID, user: null, isDemo: true };
    throw new AuthError(401, 'Please sign in.');
  }

  if (requested && requested !== user.companyId) {
    if (opts.allowDemo && requested === DEMO_COMPANY_ID) {
      return { companyId: DEMO_COMPANY_ID, user, isDemo: true };
    }
    throw new AuthError(403, 'You do not have access to that company.');
  }

  if (opts.roles && !opts.roles.includes(user.role as Role) && user.role !== 'PLATFORM_ADMIN') {
    throw new AuthError(403, 'Your role does not have access to this.');
  }
  return { companyId: user.companyId, user, isDemo: false };
}

/** Starts a session for `user` on the given response. */
export function attachSession(res: NextResponse, user: { id: string; sessionVersion: number }): NextResponse {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  res.cookies.set(SESSION_COOKIE, issueToken({ userId: user.id, sessionVersion: user.sessionVersion, expiresAt }, sessionSecret()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
  return res;
}

export function clearSession(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}

/** Use in route catch blocks: auth failures keep their status, anything else is a 500 without internals. */
export function handleAuthError(error: unknown, context: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(`${context}:`, error);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}

/** Lowercased, trimmed email, or null when it does not look like one. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}
