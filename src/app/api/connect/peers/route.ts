import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { collectPeers } from '@/lib/connect/consumer';
import type { PeersResponse } from '@/lib/connect/types';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * The signed-in user's results from other ScienceWerx apps, fetched server-side
 * with their verified email. Unverified accounts get nothing: the address was
 * never proven to be theirs.
 */
export async function GET() {
  try {
    const user = await requireUser();
    if (!user.emailVerifiedAt) {
      const body: PeersResponse = { cards: [], certificates: [], needsVerification: true };
      return NextResponse.json(body, { headers: NO_STORE });
    }
    const body = await collectPeers(user.email.toLowerCase());
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (error) {
    return handleAuthError(error, 'Connect peers error');
  }
}
