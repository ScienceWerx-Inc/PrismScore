'use client';

import { useState } from 'react';

/** Shown under the header to signed-in people whose email is not verified yet. */
export default function VerifyEmailBanner() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const send = async () => {
    setState('sending');
    setMessage(null);
    try {
      const res = await fetch('/api/auth/verify-email/send', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setState('sent');
        setMessage(body.alreadyVerified ? 'Your email is already verified.' : 'Sent. Check your inbox for the link.');
      } else {
        setState('error');
        setMessage(body.error || 'Could not send the email.');
      }
    } catch {
      setState('error');
      setMessage('Could not send the email.');
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">Verify your email.</span>
        <span>Open the link we email you to confirm the address is yours.</span>
        {state !== 'sent' && (
          <button
            type="button"
            onClick={send}
            disabled={state === 'sending'}
            className="font-bold underline hover:text-amber-950 disabled:opacity-50"
          >
            {state === 'sending' ? 'Sending…' : 'Send a new link'}
          </button>
        )}
        {message && <span role="status">{message}</span>}
      </div>
    </div>
  );
}
