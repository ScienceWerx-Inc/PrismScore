import { NextResponse } from 'next/server';
import { handleAuthError, requireUser } from '@/lib/auth/server';
import { sendVerificationEmail, VERIFY_SENDS_PER_HOUR } from '@/lib/auth/verifyEmail';

export const dynamic = 'force-dynamic';

/** Sends the signed-in user a fresh verification link (at most 3 per hour). */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const result = await sendVerificationEmail(user, request.url);
    switch (result.status) {
      case 'already_verified':
        return NextResponse.json({ success: true, alreadyVerified: true });
      case 'rate_limited':
        return NextResponse.json(
          { error: `You can request ${VERIFY_SENDS_PER_HOUR} verification emails per hour. Please check your inbox or try again later.` },
          { status: 429 },
        );
      case 'sent':
        return NextResponse.json({ success: true, sent: true });
      default:
        return NextResponse.json(
          { error: 'We could not send the email right now. Please try again later.' },
          { status: 503 },
        );
    }
  } catch (error) {
    return handleAuthError(error, 'Verification email error');
  }
}
