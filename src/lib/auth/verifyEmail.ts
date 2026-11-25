import 'server-only';
import { prisma } from '@/lib/db';
import { sendEmail, type EmailOutcome } from '@/lib/email';
import { sessionSecret } from './server';
import { EMAIL_VERIFY_TTL_MS, issueEmailVerifyToken, readEmailVerifyToken } from './token';

/**
 * Email ownership. Sign-up and invitations never prove that the person typing an
 * address can read its mail, and ScienceWerx Connect shares data keyed on email,
 * so an account only counts as verified once a link sent to the address is opened.
 */

/** Verification emails a user may trigger per rolling hour (automatic sends count too). */
export const VERIFY_SENDS_PER_HOUR = 3;

/** Where links in emails point: APP_URL when set, else the origin the request came in on. */
export function appBaseUrl(requestUrl?: string): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (requestUrl) return new URL(requestUrl).origin;
  return 'http://localhost:3000';
}

export type VerificationSendResult =
  | { status: 'already_verified' }
  | { status: 'rate_limited' }
  | { status: EmailOutcome };

export async function sendVerificationEmail(
  user: { id: string; email: string; name: string; emailVerifiedAt: Date | null },
  requestUrl?: string,
): Promise<VerificationSendResult> {
  if (user.emailVerifiedAt) return { status: 'already_verified' };

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.emailVerificationSend.count({ where: { userId: user.id, createdAt: { gte: since } } });
  if (recent >= VERIFY_SENDS_PER_HOUR) return { status: 'rate_limited' };
  // Recorded before sending, so a failing mail API can't be hammered either.
  await prisma.emailVerificationSend.create({ data: { userId: user.id } });

  const token = issueEmailVerifyToken(
    { userId: user.id, email: user.email, expiresAt: Date.now() + EMAIL_VERIFY_TTL_MS },
    sessionSecret(),
  );
  const link = `${appBaseUrl(requestUrl)}/verify-email?token=${encodeURIComponent(token)}`;
  const text = [
    `Hi ${user.name},`,
    '',
    'Please confirm this is your email address for Prism School (PrismScore):',
    '',
    link,
    '',
    'The link works for 24 hours. If you did not create a PrismScore account, you can ignore this email.',
    '',
    '— Prism School by ScienceWerx',
  ].join('\n');

  const outcome = await sendEmail(user.email, 'Confirm your email for Prism School', text);
  if (outcome !== 'sent' && process.env.NODE_ENV !== 'production') {
    // Local testing without MoreWerx: the link is printed here and nowhere else.
    console.info(`[email] dev only, verification link: ${link}`);
  }
  return { status: outcome };
}

/** Sends after sign-up / password set. Never lets email trouble break the flow it follows. */
export async function sendVerificationEmailQuietly(
  user: { id: string; email: string; name: string; emailVerifiedAt: Date | null },
  requestUrl?: string,
): Promise<void> {
  try {
    await sendVerificationEmail(user, requestUrl);
  } catch (error) {
    console.error('[email] verification send failed:', (error as Error).name);
  }
}

/** Opens a verification link. Returns true when the account's current email is now verified. */
export async function confirmEmailToken(token: string | null | undefined): Promise<boolean> {
  const claims = readEmailVerifyToken(token, sessionSecret());
  if (!claims) return false;
  const user = await prisma.user.findUnique({ where: { id: claims.userId }, select: { id: true, email: true, emailVerifiedAt: true } });
  if (!user || user.email !== claims.email) return false;
  if (!user.emailVerifiedAt) {
    await prisma.user.updateMany({ where: { id: user.id, email: claims.email, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
    await prisma.auditLog.create({ data: { actor: user.email, action: 'EMAIL_VERIFIED', entity: `User:${user.id}` } });
  }
  return true;
}
