import { NextResponse } from 'next/server';
import { confirmEmailToken } from '@/lib/auth/verifyEmail';

export const dynamic = 'force-dynamic';

/** The link in the verification email. Marks the address verified, then shows the outcome. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  let ok = false;
  try {
    ok = await confirmEmailToken(url.searchParams.get('token'));
  } catch (error) {
    console.error('Email verification error:', (error as Error).name);
  }
  return NextResponse.redirect(new URL(`/email-verified?status=${ok ? 'ok' : 'invalid'}`, url.origin), 303);
}
