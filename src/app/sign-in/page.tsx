'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { CTA, ROUTES } from '@/lib/product';
import { safeNext } from '@/lib/clientAuth';

const LABEL = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5';
const FIELD =
  'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white';

function SignInForm() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in: go straight on.
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => d.user && window.location.replace(next))
      .catch(() => {});
  }, [next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-in failed.');
      window.location.assign(next);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="si-email" className={LABEL}>Work email</label>
        <input
          id="si-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="si-password" className={LABEL}>Password</label>
        <input
          id="si-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIELD}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !email || !password}
        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <LogIn className="w-4 h-4" />
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="flex-1 bg-paper py-16 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to PrismScore</h1>
        <p className="text-sm text-slate-600 mt-1 mb-6">See your company&apos;s results, team dashboard and learning plan.</p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
        <p className="text-xs text-slate-500 mt-6 text-center">
          New here? <Link href={ROUTES.start} className="text-brand-700 underline">{CTA.start}</Link>
          {' · '}
          <Link href={ROUTES.sampleReport} className="text-brand-700 underline">{CTA.sample}</Link>
        </p>
      </div>
    </div>
  );
}
