import { describe, expect, it } from 'vitest';
import { EMAIL_VERIFY_TTL_MS, issueEmailVerifyToken, issueToken, readEmailVerifyToken, readToken } from '../auth/token';
import { hashPassword, passwordProblem, verifyPassword, DUMMY_HASH } from '../auth/password';
import { inviteIsUsable } from '../auth/invites';
import { safeNext } from '../clientAuth';

const SECRET = 'x'.repeat(40);

describe('session tokens', () => {
  const claims = { userId: 'u1', sessionVersion: 2, expiresAt: Date.now() + 60_000 };

  it('round-trips', () => {
    expect(readToken(issueToken(claims, SECRET), SECRET)).toEqual(claims);
  });

  it('rejects a token signed with another secret', () => {
    expect(readToken(issueToken(claims, SECRET), 'y'.repeat(40))).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const [, sig] = issueToken(claims, SECRET).split('.');
    const forged = Buffer.from('admin.2.' + claims.expiresAt).toString('base64url');
    expect(readToken(`${forged}.${sig}`, SECRET)).toBeNull();
  });

  it('rejects expired and malformed tokens', () => {
    expect(readToken(issueToken({ ...claims, expiresAt: Date.now() - 1 }, SECRET), SECRET)).toBeNull();
    expect(readToken('', SECRET)).toBeNull();
    expect(readToken('abc', SECRET)).toBeNull();
    expect(readToken('abc.def', SECRET)).toBeNull();
  });
});

describe('passwords', () => {
  it('verifies the right password only', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong password!!', hash)).toBe(false);
    expect(await verifyPassword('anything', null)).toBe(false);
    expect(await verifyPassword('anything', DUMMY_HASH)).toBe(false);
  });

  it('enforces a minimum length', () => {
    expect(passwordProblem('short')).not.toBeNull();
    expect(passwordProblem(undefined)).not.toBeNull();
    expect(passwordProblem('long enough pw')).toBeNull();
  });
});

describe('invitations', () => {
  const now = new Date('2026-11-25T00:00:00Z');
  it('is usable only while open and unexpired', () => {
    expect(inviteIsUsable({ status: 'SENT', expiresAt: new Date('2026-12-01') }, now)).toBe(true);
    expect(inviteIsUsable({ status: 'PENDING', expiresAt: null }, now)).toBe(true);
    expect(inviteIsUsable({ status: 'SENT', expiresAt: new Date('2026-11-01') }, now)).toBe(false);
    expect(inviteIsUsable({ status: 'ACCEPTED', expiresAt: null }, now)).toBe(false);
    expect(inviteIsUsable({ status: 'EXPIRED', expiresAt: null }, now)).toBe(false);
  });
});

describe('post-sign-in redirect', () => {
  it('only allows same-site paths', () => {
    expect(safeNext('/dashboard/curriculum')).toBe('/dashboard/curriculum');
    expect(safeNext('https://evil.example')).toBe('/dashboard');
    expect(safeNext('//evil.example')).toBe('/dashboard');
    expect(safeNext('/\\evil.example')).toBe('/dashboard');
    expect(safeNext(null)).toBe('/dashboard');
  });
});

describe('email verification tokens', () => {
  const claims = { userId: 'u1', email: 'me@example.com', expiresAt: Date.now() + 60_000 };

  it('round-trips', () => {
    expect(readEmailVerifyToken(issueEmailVerifyToken(claims, SECRET), SECRET)).toEqual(claims);
  });

  it('expires', () => {
    const token = issueEmailVerifyToken(claims, SECRET);
    expect(readEmailVerifyToken(token, SECRET, claims.expiresAt + 1)).toBeNull();
    expect(readEmailVerifyToken(issueEmailVerifyToken({ ...claims, expiresAt: Date.now() - 1 }, SECRET), SECRET)).toBeNull();
    expect(EMAIL_VERIFY_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('is never interchangeable with a session token', () => {
    const session = issueToken({ userId: 'u1', sessionVersion: 0, expiresAt: Date.now() + 60_000 }, SECRET);
    const verify = issueEmailVerifyToken(claims, SECRET);
    expect(readEmailVerifyToken(session, SECRET)).toBeNull();
    expect(readToken(verify, SECRET)).toBeNull();
  });

  it('rejects tampering and other secrets', () => {
    const token = issueEmailVerifyToken(claims, SECRET);
    const [, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ p: 'email-verify', u: 'u2', e: 'me@example.com', x: claims.expiresAt })).toString('base64url');
    expect(readEmailVerifyToken(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(readEmailVerifyToken(token, 'y'.repeat(40))).toBeNull();
    expect(readEmailVerifyToken('', SECRET)).toBeNull();
    expect(readEmailVerifyToken('a.b', SECRET)).toBeNull();
  });
});
