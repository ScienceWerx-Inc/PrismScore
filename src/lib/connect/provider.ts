import { parseCallers } from './config';
import { parseSubject, subjectHash, verifyCaller } from './auth';
import { SELF_APP, type CertificatesResponse, type ConnectScope, type SummaryResponse } from './types';

/**
 * Provider side of a Connect endpoint: checks the caller, its scope and the
 * subject (in the spec's order), looks up only that one person, logs the call
 * without the raw email, and never lets a response be cached.
 */

type Lookup<T> = (email: string) => Promise<T>;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function handleProviderRequest<T extends SummaryResponse | CertificatesResponse>(
  request: Request,
  scope: ConnectScope,
  lookup: Lookup<T>,
  env: Record<string, string | undefined> = process.env,
): Promise<Response> {
  const log = (caller: string | null, status: number, subject: string | null, found: boolean | null) =>
    console.info(
      JSON.stringify({
        connect: 'provider',
        endpoint: scope,
        caller,
        subject: subject ? subjectHash(subject) : null,
        found,
        status,
      }),
    );

  const check = verifyCaller(request.headers.get('authorization'), parseCallers(env.CONNECT_CALLERS), scope);
  if (!check.ok) {
    log(check.caller, check.status, null, null);
    return json({ error: check.error }, check.status);
  }

  const subject = parseSubject(request.headers.get('x-connect-subject'));
  if (!subject) {
    log(check.caller, 400, null, null);
    return json({ error: 'bad_subject' }, 400);
  }

  try {
    const body = await lookup(subject);
    log(check.caller, 200, subject, body.found);
    return json(body, 200);
  } catch (error) {
    console.error('[connect] provider lookup failed:', (error as Error).name);
    log(check.caller, 500, subject, null);
    return json({ error: 'unavailable' }, 500);
  }
}

export const notFound = (): { app: string; found: false } => ({ app: SELF_APP, found: false });
