'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Loader2 } from 'lucide-react';

interface Invite {
  email: string;
  invitedBy: string;
  company: string;
  courseTitle: string | null;
  hasAccount: boolean;
}

const LABEL = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5';
const FIELD =
  'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white';

export default function JoinCoursePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/join/${token}`).then(async (res) => {
      const body = await res.json();
      if (res.ok) setInvite(body);
      else setError(body.error || 'This invitation link is not valid.');
    });
  }, [token]);

  const join = async (e?: { preventDefault(): void }) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/join/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'Could not join.');
      setBusy(false);
      return;
    }
    if (body.needsSignIn) router.push(`/sign-in?next=${encodeURIComponent(`/learn/${body.courseId}`)}`);
    else router.push(`/learn/${body.courseId}`);
  };

  if (!invite) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm text-slate-700 text-center">
        {error ?? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-paper py-16 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
        <BookOpen className="w-8 h-8 text-brand-600" />
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">Join your team&apos;s course</h1>
        <p className="text-sm text-slate-600 mt-2">
          <strong className="text-slate-900">{invite.invitedBy}</strong> at <strong className="text-slate-900">{invite.company}</strong>{' '}
          shared <strong className="text-slate-900">{invite.courseTitle ?? 'a course'}</strong> with you. Finish every lesson and
          pass each module quiz to earn your own certificate.
        </p>

        {invite.hasAccount ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-slate-700">You already have a Prism School account for {invite.email}.</p>
            <button
              type="button"
              onClick={() => join()}
              disabled={busy}
              className="w-full py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white text-sm disabled:opacity-50"
            >
              Add the course and sign in
            </button>
          </div>
        ) : (
          <form onSubmit={join} className="mt-6 space-y-4">
            <div>
              <span className={LABEL}>Email</span>
              <p className="text-sm text-slate-900">{invite.email}</p>
            </div>
            <div>
              <label htmlFor="join-name" className={LABEL}>Your name</label>
              <input id="join-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={FIELD} />
            </div>
            <div>
              <label htmlFor="join-password" className={LABEL}>Choose a password</label>
              <input
                id="join-password"
                type="password"
                minLength={10}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={FIELD}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">At least 10 characters.</span>
            </div>
            <button
              type="submit"
              disabled={busy || password.length < 10}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 text-white text-sm disabled:opacity-50"
            >
              {busy ? 'Joining…' : 'Create my account and start'}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}
        <p className="text-xs text-slate-500 mt-6 text-center">
          Already joined? <Link href="/sign-in" className="text-brand-700 underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
