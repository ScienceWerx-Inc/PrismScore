import {
  CARD_LIMITS,
  PEER_TIMEOUT_MS,
  type CertificateStatus,
  type ConnectCard,
  type ConnectCertificate,
  type ConnectScope,
} from './types';

/**
 * Calling one peer. Whatever comes back is treated as untrusted: only the
 * documented fields survive, strings are trimmed to the spec's limits, and links
 * must be http(s). Any failure (timeout, non-200, bad JSON, wrong shape) is null.
 */

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const MAX_BODY_BYTES = 64 * 1024;
const MAX_CERTIFICATES = 50;

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const s = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return s ? s.slice(0, max) : null;
}

function httpUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function isoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function sanitizeCard(raw: unknown): ConnectCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const title = str(c.title, CARD_LIMITS.title);
  const headline = str(c.headline, CARD_LIMITS.headline);
  const url = httpUrl(c.url);
  if (!title || !headline || !url) return null;
  const lines = (Array.isArray(c.lines) ? c.lines : [])
    .map((l) => {
      if (!l || typeof l !== 'object') return null;
      const label = str((l as Record<string, unknown>).label, CARD_LIMITS.label);
      const value = str((l as Record<string, unknown>).value, CARD_LIMITS.value);
      return label && value ? { label, value } : null;
    })
    .filter((l): l is { label: string; value: string } => l !== null)
    .slice(0, CARD_LIMITS.lines);
  return { title, headline, lines, url, updatedAt: isoDate(c.updatedAt) ?? new Date().toISOString() };
}

const STATUSES: CertificateStatus[] = ['VALID', 'EXPIRED', 'REVOKED'];

export function sanitizeCertificate(raw: unknown): ConnectCertificate | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const code = str(c.code, 64);
  const title = str(c.title, CARD_LIMITS.title);
  const issuer = str(c.issuer, CARD_LIMITS.label);
  const issuedAt = isoDate(c.issuedAt);
  const verifyUrl = httpUrl(c.verifyUrl);
  const status = STATUSES.find((s) => s === c.status);
  if (!code || !title || !issuer || !issuedAt || !verifyUrl || !status) return null;
  return { code, title, issuer, issuedAt, expiresAt: isoDate(c.expiresAt), status, verifyUrl };
}

export type PeerResult =
  | { ok: true; found: false }
  | { ok: true; found: true; card: ConnectCard }
  | { ok: true; found: true; certificates: ConnectCertificate[] }
  | { ok: false; reason: 'timeout' | 'http' | 'network' | 'shape' };

export async function callPeer(opts: {
  base: string;
  scope: ConnectScope;
  key: string;
  subject: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}): Promise<PeerResult> {
  const doFetch = opts.fetchImpl ?? (fetch as FetchLike);
  let res: Response;
  try {
    res = await doFetch(`${opts.base}/api/connect/v1/${opts.scope}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${opts.key}`,
        'X-Connect-Subject': opts.subject,
        Accept: 'application/json',
      },
      // Never follow a redirect with our key attached.
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(opts.timeoutMs ?? PEER_TIMEOUT_MS),
    });
  } catch (error) {
    const name = (error as Error)?.name;
    return { ok: false, reason: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network' };
  }
  if (res.status !== 200) return { ok: false, reason: 'http' };

  let body: Record<string, unknown>;
  try {
    const text = await res.text();
    if (text.length > MAX_BODY_BYTES) return { ok: false, reason: 'shape' };
    body = JSON.parse(text);
  } catch (error) {
    const name = (error as Error)?.name;
    return { ok: false, reason: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'shape' };
  }
  if (!body || typeof body !== 'object') return { ok: false, reason: 'shape' };
  if (body.found === false) return { ok: true, found: false };
  if (body.found !== true) return { ok: false, reason: 'shape' };

  if (opts.scope === 'summary') {
    const card = sanitizeCard(body.card);
    return card ? { ok: true, found: true, card } : { ok: false, reason: 'shape' };
  }
  if (!Array.isArray(body.certificates)) return { ok: false, reason: 'shape' };
  const certificates = body.certificates
    .slice(0, MAX_CERTIFICATES)
    .map(sanitizeCertificate)
    .filter((c): c is ConnectCertificate => c !== null);
  return { ok: true, found: true, certificates };
}
