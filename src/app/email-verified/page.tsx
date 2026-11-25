import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = { title: 'Email verification | PrismScore', robots: { index: false } };

export default function EmailVerifiedPage({ searchParams }: { searchParams: { status?: string } }) {
  const ok = searchParams.status === 'ok';
  return (
    <div className="flex-1 bg-paper py-16 px-4">
      <div className="max-w-lg mx-auto p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
        {ok ? (
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        ) : (
          <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        )}
        <h1 className="text-2xl font-extrabold text-slate-900">
          {ok ? 'Your email is verified' : 'This link did not work'}
        </h1>
        <p className="text-sm text-slate-600">
          {ok
            ? 'Thanks. Your results from other ScienceWerx apps can now appear alongside your PrismScore.'
            : 'Verification links work for 24 hours and only for the address they were sent to. Sign in and request a new one.'}
        </p>
        <Link
          href="/learn"
          className="inline-flex px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
