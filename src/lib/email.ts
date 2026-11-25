import 'server-only';

/**
 * Transactional email through MoreWerx's partner email API: MoreWerx delivers
 * from its verified domain under the name "Prism School", so PrismScore holds
 * no mail account of its own. Same pattern as InKeep's sender.
 *
 * Returns 'sent', 'failed' (MoreWerx refused or was unreachable) or 'off'
 * (MoreWerx is not configured, or email is switched off for this partner).
 * Never throws, and never logs the address or the body (which may hold a link).
 */

const FROM_NAME = 'Prism School';

export type EmailOutcome = 'sent' | 'failed' | 'off';

export async function sendEmail(to: string, subject: string, text: string): Promise<EmailOutcome> {
  const url = process.env.MOREWERX_API_URL;
  const key = process.env.MOREWERX_PARTNER_KEY;
  if (!url || !key) {
    console.info(`[email] MoreWerx not configured; not sent: subject="${subject}"`);
    return 'off';
  }
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/partner/v1/email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text, fromName: FROM_NAME }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return 'sent';
    const body = (await res.json().catch(() => ({}))) as { code?: string };
    if (body.code === 'EMAIL_OFF' || res.status === 403) {
      console.info(`[email] MoreWerx email is off for this partner; not sent: subject="${subject}"`);
      return 'off';
    }
    console.error(`[email] MoreWerx refused (${res.status} ${body.code ?? ''}) subject="${subject}"`);
    return 'failed';
  } catch (err) {
    console.error('[email] MoreWerx unreachable:', (err as Error).name);
    return 'failed';
  }
}
