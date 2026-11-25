import { parseOwnKey, parsePeers } from './config';
import { callPeer, type FetchLike } from './client';
import { subjectHash } from './auth';
import { APP_DISPLAY_NAMES, type ConnectScope, type PeerCard, type PeerCertificate, type PeersResponse } from './types';

/**
 * Consumer side: which peers Prism School shows (spec v1 table) and the merge.
 * Every peer is called in parallel with its own timeout; one that is down, slow,
 * unconfigured or refusing is simply missing from the result.
 */
export const CONSUMES: Record<ConnectScope, readonly string[]> = {
  summary: ['istartup'],
  certificates: ['istartup'],
};

export async function collectPeers(
  subject: string,
  opts: { env?: Record<string, string | undefined>; fetchImpl?: FetchLike; timeoutMs?: number } = {},
): Promise<PeersResponse> {
  const env = opts.env ?? process.env;
  const key = parseOwnKey(env.CONNECT_KEY);
  const peers = parsePeers(env.CONNECT_PEERS);
  if (!key) return { cards: [], certificates: [] };

  const calls: { app: string; scope: ConnectScope; base: string }[] = [];
  for (const scope of ['summary', 'certificates'] as const) {
    for (const app of CONSUMES[scope]) {
      const base = peers.get(app);
      if (base) calls.push({ app, scope, base });
    }
  }

  const results = await Promise.all(
    calls.map(async (call) => {
      const started = Date.now();
      const result = await callPeer({ base: call.base, scope: call.scope, key, subject, timeoutMs: opts.timeoutMs, fetchImpl: opts.fetchImpl });
      console.info(
        JSON.stringify({
          connect: 'consumer',
          peer: call.app,
          endpoint: call.scope,
          subject: subjectHash(subject),
          ok: result.ok,
          found: result.ok ? result.found : null,
          reason: result.ok ? null : result.reason,
          ms: Date.now() - started,
        }),
      );
      return { call, result };
    }),
  );

  const cards: PeerCard[] = [];
  const certificates: PeerCertificate[] = [];
  const unavailable = new Set<string>();
  for (const { call, result } of results) {
    const appName = APP_DISPLAY_NAMES[call.app] ?? call.app;
    if (!result.ok) {
      unavailable.add(call.app);
      continue;
    }
    if (!result.found) continue;
    if ('card' in result) cards.push({ app: call.app, appName, ...result.card });
    if ('certificates' in result) certificates.push(...result.certificates.map((c) => ({ app: call.app, appName, ...c })));
  }
  return { cards, certificates, ...(unavailable.size ? { unavailable: Array.from(unavailable) } : {}) };
}
