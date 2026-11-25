import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Session tokens: base64url("<userId>.<sessionVersion>.<expiresAtMs>") + "." + HMAC-SHA256.
 * Pure functions so they can be unit-tested without Next.js.
 *
 * Temporary sign-in until PrismScore moves to Firebase Auth: everything that
 * depends on the session goes through src/lib/auth/server.ts, so swapping the
 * provider later only changes how a token is turned into a user id.
 */

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionClaims {
  userId: string;
  sessionVersion: number;
  expiresAt: number;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function issueToken(claims: SessionClaims, secret: string): string {
  const payload = Buffer.from(`${claims.userId}.${claims.sessionVersion}.${claims.expiresAt}`).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function readToken(token: string | undefined | null, secret: string, now = Date.now()): SessionClaims | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1), 'base64url');
  const expected = Buffer.from(sign(payload, secret), 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const parts = Buffer.from(payload, 'base64url').toString('utf8').split('.');
  if (parts.length !== 3) return null;
  const [userId, version, exp] = parts;
  const sessionVersion = Number(version);
  const expiresAt = Number(exp);
  if (!userId || !Number.isInteger(sessionVersion) || !Number.isFinite(expiresAt)) return null;
  if (expiresAt <= now) return null;
  return { userId, sessionVersion, expiresAt };
}
