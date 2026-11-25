import { createHash, randomBytes } from 'crypto';
import http from 'http';
import type { AddressInfo } from 'net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { parseCallers, parseOwnKey, parsePeers } from '../connect/config';
import { parseSubject, verifyCaller } from '../connect/auth';
import { handleProviderRequest } from '../connect/provider';
import { callPeer, sanitizeCard } from '../connect/client';
import { collectPeers } from '../connect/consumer';

const newKey = () => `swc_${randomBytes(32).toString('base64url')}`;
const hashOf = (key: string) => createHash('sha256').update(key).digest('hex');

const KEY_ISTARTUP = newKey();
const KEY_FOUNDERFIT = newKey();
const CALLERS = `istartup:${hashOf(KEY_ISTARTUP)}:summary|certificates,founderfit:${hashOf(KEY_FOUNDERFIT)}:summary`;

vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('env parsing', () => {
  it('keys are swc_ + 43 base64url chars', () => {
    expect(newKey()).toMatch(/^swc_[A-Za-z0-9_-]{43}$/);
    expect(parseOwnKey(KEY_ISTARTUP)).toBe(KEY_ISTARTUP);
    expect(parseOwnKey(` ${KEY_ISTARTUP} `)).toBe(KEY_ISTARTUP);
    expect(parseOwnKey(undefined)).toBeNull();
    expect(parseOwnKey('swc_short')).toBeNull();
    expect(parseOwnKey(KEY_ISTARTUP.replace('swc_', 'sk_'))).toBeNull();
  });

  it('parses CONNECT_CALLERS and skips malformed entries', () => {
    const callers = parseCallers(`${CALLERS}, bad-entry ,x:nothex:summary,ok:${'A'.repeat(64)}:summary|bogus`);
    expect(callers.map((c) => c.name)).toEqual(['istartup', 'founderfit', 'ok']);
    expect(Array.from(callers[0].scopes)).toEqual(['summary', 'certificates']);
    expect(Array.from(callers[1].scopes)).toEqual(['summary']);
    expect(Array.from(callers[2].scopes)).toEqual(['summary']);
    expect(callers[0].hash.toString('hex')).toBe(hashOf(KEY_ISTARTUP));
    expect(parseCallers(undefined)).toEqual([]);
    expect(parseCallers('')).toEqual([]);
  });

  it('parses CONNECT_PEERS: https, or http only to loopback', () => {
    const peers = parsePeers(
      'istartup=https://istartupscore.com/, founderfit=https://ff.example.com/base/,local=http://localhost:4100,evil=http://evil.example.com,junk,=https://x.com,creds=https://u:p@x.com',
    );
    expect(Object.fromEntries(peers)).toEqual({
      istartup: 'https://istartupscore.com',
      founderfit: 'https://ff.example.com/base',
      local: 'http://localhost:4100',
    });
    expect(parsePeers(undefined).size).toBe(0);
  });
});

describe('caller verification', () => {
  const callers = parseCallers(CALLERS);

  it('rejects a missing or badly shaped token with 401', () => {
    expect(verifyCaller(null, callers, 'summary')).toMatchObject({ ok: false, status: 401, error: 'unauthorized' });
    expect(verifyCaller('Bearer nope', callers, 'summary')).toMatchObject({ ok: false, status: 401 });
    expect(verifyCaller(KEY_ISTARTUP, callers, 'summary')).toMatchObject({ ok: false, status: 401 }); // no "Bearer"
    expect(verifyCaller(`Bearer ${KEY_ISTARTUP}x`, callers, 'summary')).toMatchObject({ ok: false, status: 401 });
  });

  it('rejects a well-formed but unknown key with 401', () => {
    expect(verifyCaller(`Bearer ${newKey()}`, callers, 'summary')).toMatchObject({ ok: false, status: 401, caller: null });
  });

  it('rejects a known caller without the scope with 403', () => {
    expect(verifyCaller(`Bearer ${KEY_FOUNDERFIT}`, callers, 'certificates')).toEqual({
      ok: false,
      status: 403,
      error: 'forbidden',
      caller: 'founderfit',
    });
  });

  it('accepts a known caller with the scope', () => {
    expect(verifyCaller(`Bearer ${KEY_ISTARTUP}`, callers, 'certificates')).toEqual({ ok: true, caller: 'istartup' });
    expect(verifyCaller(`Bearer ${KEY_FOUNDERFIT}`, callers, 'summary')).toEqual({ ok: true, caller: 'founderfit' });
  });

  it('validates the subject', () => {
    expect(parseSubject(' Person@Example.COM ')).toBe('person@example.com');
    expect(parseSubject('not-an-email')).toBeNull();
    expect(parseSubject('a@b')).toBeNull();
    expect(parseSubject(`${'a'.repeat(250)}@b.co`)).toBeNull();
    expect(parseSubject('a@b.co,c@d.co')).toBeNull();
    expect(parseSubject(null)).toBeNull();
  });
});

describe('provider responses', () => {
  const env = { CONNECT_CALLERS: CALLERS };
  const req = (headers: Record<string, string>) => new Request('https://prism.test/api/connect/v1/summary', { headers });
  const card = { title: 'T', headline: 'H', lines: [], url: 'https://prism.test/learn', updatedAt: new Date(0).toISOString() };
  const lookup = vi.fn(async (email: string) =>
    email === 'known@example.com' ? { app: 'prismscore', found: true as const, card } : { app: 'prismscore', found: false as const },
  );

  it('checks in order: shape, key, scope, subject', async () => {
    let res = await handleProviderRequest(req({ 'X-Connect-Subject': 'known@example.com' }), 'summary', lookup, env);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });

    res = await handleProviderRequest(req({ Authorization: `Bearer ${newKey()}` }), 'summary', lookup, env);
    expect(res.status).toBe(401);

    res = await handleProviderRequest(req({ Authorization: `Bearer ${KEY_FOUNDERFIT}`, 'X-Connect-Subject': 'bad' }), 'certificates', lookup, env);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });

    res = await handleProviderRequest(req({ Authorization: `Bearer ${KEY_FOUNDERFIT}`, 'X-Connect-Subject': 'bad' }), 'summary', lookup, env);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_subject' });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('answers 200 found:false for an unknown person, found:true with the card for a known one', async () => {
    let res = await handleProviderRequest(req({ Authorization: `Bearer ${KEY_ISTARTUP}`, 'X-Connect-Subject': 'nobody@example.com' }), 'summary', lookup, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ app: 'prismscore', found: false });

    res = await handleProviderRequest(req({ Authorization: `Bearer ${KEY_ISTARTUP}`, 'X-Connect-Subject': 'KNOWN@example.com' }), 'summary', lookup, env);
    expect(await res.json()).toEqual({ app: 'prismscore', found: true, card });
    expect(lookup).toHaveBeenLastCalledWith('known@example.com');
  });

  it('never logs the raw email', async () => {
    const info = vi.mocked(console.info);
    info.mockClear();
    await handleProviderRequest(req({ Authorization: `Bearer ${KEY_ISTARTUP}`, 'X-Connect-Subject': 'known@example.com' }), 'summary', lookup, env);
    const logged = info.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(logged).toContain('"caller":"istartup"');
    expect(logged).not.toContain('known@example.com');
  });

  it('returns 500 unavailable when the lookup throws', async () => {
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await handleProviderRequest(
      req({ Authorization: `Bearer ${KEY_ISTARTUP}`, 'X-Connect-Subject': 'known@example.com' }),
      'summary',
      async () => {
        throw new Error('db down');
      },
      env,
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'unavailable' });
  });
});

describe('client sanitizing', () => {
  it('keeps at most 5 lines, trims values to 120 chars, needs an http(s) url', () => {
    const c = sanitizeCard({
      title: 'iStartup readiness',
      headline: '312 / 500',
      lines: Array.from({ length: 8 }, (_, i) => ({ label: `L${i}`, value: 'v'.repeat(200) })),
      url: 'https://istartupscore.com/x',
      updatedAt: '2026-11-20T10:00:00.000Z',
      extra: 'dropped',
    });
    expect(c?.lines).toHaveLength(5);
    expect(c?.lines[0].value).toHaveLength(120);
    expect(c).not.toHaveProperty('extra');
    expect(sanitizeCard({ title: 't', headline: 'h', lines: [], url: 'javascript:alert(1)' })).toBeNull();
  });
});

describe('consumer', () => {
  const SELF_KEY = newKey();
  let server: http.Server;
  let base = '';
  let mode: 'ok' | 'slow' | 'error' | 'notfound' | 'garbage' = 'ok';
  const seen: { path?: string; auth?: string; subject?: string }[] = [];

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      seen.push({ path: req.url, auth: req.headers.authorization, subject: req.headers['x-connect-subject'] as string });
      const send = (status: number, body: unknown) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(typeof body === 'string' ? body : JSON.stringify(body));
      };
      if (mode === 'slow') return void setTimeout(() => send(200, { app: 'istartup', found: false }), 1000);
      if (mode === 'error') return send(500, { error: 'boom', stack: 'secret internals' });
      if (mode === 'notfound') return send(200, { app: 'istartup', found: false });
      if (mode === 'garbage') return send(200, '<html>');
      if (req.url === '/api/connect/v1/summary') {
        return send(200, {
          app: 'istartup',
          found: true,
          card: { title: 'iStartup readiness', headline: '312 / 500', lines: [{ label: 'Weakest area', value: 'Traction' }], url: 'https://istartupscore.com/r', updatedAt: '2026-11-20T10:00:00.000Z' },
        });
      }
      return send(200, {
        app: 'istartup',
        found: true,
        certificates: [
          { code: 'IS-1', title: 'Investor readiness', issuer: 'iStartup', issuedAt: '2026-01-01T00:00:00.000Z', expiresAt: null, status: 'VALID', verifyUrl: 'https://istartupscore.com/verify/IS-1' },
          { code: 'IS-2', title: 'Bad', issuer: 'iStartup', issuedAt: '2026-01-01T00:00:00.000Z', status: 'MAYBE', verifyUrl: 'https://x' },
        ],
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    server.closeAllConnections?.();
    server.close();
  });

  const env = () => ({ CONNECT_KEY: SELF_KEY, CONNECT_PEERS: `istartup=${base},founderfit=${base}` });

  it('calls istartup summary and certificates with the key and subject, and merges them', async () => {
    mode = 'ok';
    seen.length = 0;
    const out = await collectPeers('me@example.com', { env: env() });
    expect(seen.map((s) => s.path).sort()).toEqual(['/api/connect/v1/certificates', '/api/connect/v1/summary']);
    expect(seen.every((s) => s.auth === `Bearer ${SELF_KEY}` && s.subject === 'me@example.com')).toBe(true);
    expect(out.cards).toHaveLength(1);
    expect(out.cards[0]).toMatchObject({ app: 'istartup', appName: 'iStartup Score', headline: '312 / 500' });
    // The certificate with an unknown status is dropped.
    expect(out.certificates.map((c) => c.code)).toEqual(['IS-1']);
    expect(out.unavailable).toBeUndefined();
  });

  it('shows nothing for found:false', async () => {
    mode = 'notfound';
    expect(await collectPeers('me@example.com', { env: env() })).toEqual({ cards: [], certificates: [] });
  });

  it('fails soft on a 500 without forwarding the error', async () => {
    mode = 'error';
    const out = await collectPeers('me@example.com', { env: env() });
    expect(out).toEqual({ cards: [], certificates: [], unavailable: ['istartup'] });
    expect(JSON.stringify(out)).not.toContain('secret internals');
  });

  it('fails soft on a timeout', async () => {
    mode = 'slow';
    const started = Date.now();
    const out = await collectPeers('me@example.com', { env: env(), timeoutMs: 150 });
    expect(Date.now() - started).toBeLessThan(900);
    expect(out).toEqual({ cards: [], certificates: [], unavailable: ['istartup'] });
  });

  it('fails soft on a non-JSON answer and on an unreachable peer', async () => {
    mode = 'garbage';
    expect((await collectPeers('me@example.com', { env: env() })).unavailable).toEqual(['istartup']);
    const down = await collectPeers('me@example.com', { env: { CONNECT_KEY: SELF_KEY, CONNECT_PEERS: 'istartup=http://127.0.0.1:1' } });
    expect(down).toEqual({ cards: [], certificates: [], unavailable: ['istartup'] });
  });

  it('calls nobody without a valid own key or without the peer configured', async () => {
    const fetchImpl = vi.fn();
    expect(await collectPeers('me@example.com', { env: { CONNECT_PEERS: `istartup=${base}` }, fetchImpl })).toEqual({ cards: [], certificates: [] });
    expect(await collectPeers('me@example.com', { env: { CONNECT_KEY: SELF_KEY, CONNECT_PEERS: `founderfit=${base}` }, fetchImpl })).toEqual({ cards: [], certificates: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not follow redirects with the key attached', async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.redirect).toBe('manual');
      return new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example' } });
    });
    const r = await callPeer({ base: 'https://istartupscore.com', scope: 'summary', key: SELF_KEY, subject: 'me@example.com', fetchImpl });
    expect(r).toEqual({ ok: false, reason: 'http' });
  });
});
