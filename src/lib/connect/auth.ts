import { createHash, timingSafeEqual } from 'crypto';
import { KEY_PATTERN, type CallerEntry } from './config';
import type { ConnectScope } from './types';

/** Provider-side checks on an incoming Connect request, in the order the spec fixes. */

export type CallerCheck =
  | { ok: true; caller: string }
  | { ok: false; status: 401; error: 'unauthorized'; caller: null }
  | { ok: false; status: 403; error: 'forbidden'; caller: string };

export function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function verifyCaller(authorization: string | null | undefined, callers: CallerEntry[], scope: ConnectScope): CallerCheck {
  const match = /^Bearer (\S+)$/.exec(authorization?.trim() ?? '');
  const token = match?.[1] ?? '';
  // 1. Shape.
  if (!KEY_PATTERN.test(token)) return { ok: false, status: 401, error: 'unauthorized', caller: null };

  // 2. Known key. Compare against every entry so timing does not depend on which one matched.
  const digest = sha256(token);
  let found: CallerEntry | null = null;
  for (const entry of callers) {
    if (entry.hash.length === digest.length && timingSafeEqual(entry.hash, digest) && !found) found = entry;
  }
  if (!found) return { ok: false, status: 401, error: 'unauthorized', caller: null };

  // 3. Scope.
  if (!found.scopes.has(scope)) return { ok: false, status: 403, error: 'forbidden', caller: found.name };
  return { ok: true, caller: found.name };
}

/** The X-Connect-Subject email, lowercased, or null when it is not a plausible address. */
export function parseSubject(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  return /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/.test(email) ? email : null;
}

/** Logged instead of the address: enough to correlate calls, not to read the email back. */
export function subjectHash(email: string): string {
  return sha256(`connect-subject:${email}`).toString('hex').slice(0, 16);
}
