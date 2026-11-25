import { CONNECT_SCOPES, type ConnectScope } from './types';

/**
 * Env parsing for Connect. All three variables are read on each request (cheap),
 * so a changed env takes effect without code changes.
 *
 *   CONNECT_KEY      swc_ + 43 base64url chars. This app's secret caller key.
 *   CONNECT_CALLERS  name:sha256hex:scope|scope,…  Who may call this app (hashes, not secret).
 *   CONNECT_PEERS    name=https://base-url,…       Where peers live (not secret).
 *
 * Malformed entries are skipped (and reported once per process), never fatal:
 * a typo in one entry must not take every other peer down with it.
 */

export const KEY_PATTERN = /^swc_[A-Za-z0-9_-]{43}$/;
const NAME_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

export interface CallerEntry {
  name: string;
  /** sha256 of the caller's key, 32 bytes. */
  hash: Buffer;
  scopes: Set<ConnectScope>;
}

const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[connect] ${message}`);
}

function entries(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseCallers(raw: string | undefined): CallerEntry[] {
  const out: CallerEntry[] = [];
  entries(raw).forEach((entry, i) => {
    const parts = entry.split(':');
    if (parts.length !== 3) return warnOnce(`CONNECT_CALLERS entry ${i + 1} is not name:sha256hex:scopes; skipped`);
    const [name, hashHex, scopeList] = parts.map((p) => p.trim());
    const hash = hashHex.toLowerCase();
    if (!NAME_PATTERN.test(name) || !HASH_PATTERN.test(hash)) {
      return warnOnce(`CONNECT_CALLERS entry ${i + 1} has a bad name or hash; skipped`);
    }
    const scopes = new Set<ConnectScope>();
    for (const s of scopeList.split('|').map((x) => x.trim())) {
      if ((CONNECT_SCOPES as readonly string[]).includes(s)) scopes.add(s as ConnectScope);
      else if (s) warnOnce(`CONNECT_CALLERS entry ${name} has unknown scope "${s}"; ignored`);
    }
    out.push({ name, hash: Buffer.from(hash, 'hex'), scopes });
  });
  return out;
}

function isLoopback(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/** name → base URL (no trailing slash). https only, except plain http to loopback for local testing. */
export function parsePeers(raw: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const entry of entries(raw)) {
    const eq = entry.indexOf('=');
    const name = eq > 0 ? entry.slice(0, eq).trim() : '';
    const base = eq > 0 ? entry.slice(eq + 1).trim() : '';
    if (!NAME_PATTERN.test(name)) {
      warnOnce('CONNECT_PEERS has an entry without a valid name; skipped');
      continue;
    }
    let url: URL;
    try {
      url = new URL(base);
    } catch {
      warnOnce(`CONNECT_PEERS entry ${name} has an invalid URL; skipped`);
      continue;
    }
    const okProtocol = url.protocol === 'https:' || (url.protocol === 'http:' && isLoopback(url.hostname));
    if (!okProtocol || url.username || url.password || url.search || url.hash) {
      warnOnce(`CONNECT_PEERS entry ${name} must be a plain https URL; skipped`);
      continue;
    }
    out.set(name, `${url.origin}${url.pathname}`.replace(/\/+$/, ''));
  }
  return out;
}

/** This app's caller key, or null when unset or malformed (then no peer is called). */
export function parseOwnKey(raw: string | undefined): string | null {
  const key = raw?.trim();
  if (!key) return null;
  if (!KEY_PATTERN.test(key)) {
    warnOnce('CONNECT_KEY is not swc_ + 43 base64url characters; peers will not be called');
    return null;
  }
  return key;
}
