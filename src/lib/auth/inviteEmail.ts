import 'server-only';
import { sendEmail, type EmailOutcome } from '@/lib/email';

/**
 * The email that asks a leader to take their C-level diagnostic. Their answers
 * set their personal gaps, and PrismScore writes them a course from those gaps
 * and the company's weakest areas. The link is the credential (single use,
 * expires in 14 days), so it is only ever sent to the invited address.
 */
export function executiveInviteLink(token: string, origin?: string): string {
  const base = (process.env.APP_URL || origin || 'https://www.prismscore.us').replace(/\/$/, '');
  return `${base}/assessment/clevel/${token}`;
}

export async function sendExecutiveInvite(
  inv: { email: string; name: string | null; execRole: string | null; token: string },
  ctx: { companyName: string; invitedBy: string; origin?: string; reminder?: boolean },
): Promise<EmailOutcome> {
  const link = executiveInviteLink(inv.token, ctx.origin);
  const hello = inv.name?.trim() ? `Hi ${inv.name.trim().split(' ')[0]},` : 'Hi,';
  const role = inv.execRole && inv.execRole !== 'OTHER' ? ` as ${inv.execRole}` : '';
  const subject = ctx.reminder
    ? `Reminder: your PrismScore leadership diagnostic for ${ctx.companyName}`
    : `${ctx.invitedBy} invited you to the PrismScore leadership diagnostic for ${ctx.companyName}`;
  const text = [
    hello,
    '',
    `${ctx.invitedBy} is measuring ${ctx.companyName}'s AI readiness with PrismScore and invited you${role} to take the confidential C-level diagnostic.`,
    '',
    'It takes about 15 minutes: realistic decision scenarios for your role, not a self-rating. Your individual answers are visible only to you and your company admin; the team sees aggregates once enough leaders have finished.',
    '',
    'When you finish, PrismScore writes you a personal course from your own gaps and the company\'s weakest areas, with a certificate when you complete it.',
    '',
    `Start here: ${link}`,
    '',
    'The link is personal, works once and expires in 14 days.',
    '',
    '— PrismScore by ScienceWerx',
  ].join('\n');
  return sendEmail(inv.email, subject, text);
}
