import crypto from 'crypto';

/** Invitation links stop working after this long. */
export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function newInviteToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function inviteExpiry(from = Date.now()): Date {
  return new Date(from + INVITE_TTL_MS);
}

/** An invitation can be used while it is pending or sent and not past its expiry. */
export function inviteIsUsable(inv: { status: string; expiresAt: Date | null }, now = new Date()): boolean {
  if (inv.status !== 'PENDING' && inv.status !== 'SENT') return false;
  return !inv.expiresAt || inv.expiresAt > now;
}
