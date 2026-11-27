'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { redirectIfSignedOut } from '@/lib/clientAuth';

const FIELD =
  'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white';

export default function DeleteCompanyPage() {
  const [company, setCompany] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(async (res) => {
      if (redirectIfSignedOut(res)) return;
      const d = await res.json();
      if (!d.user) return redirectIfSignedOut(new Response(null, { status: 401 }));
      setCompany(d.company?.name ?? null);
      setRole(d.user.role);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Permanently delete ${company} and everyone's data in it? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch('/api/account/delete-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, companyName: name }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'Could not delete the company.');
      setBusy(false);
      return;
    }
    window.location.assign('/');
  };

  if (!company) return <div className="flex-1" />;
  if (role !== 'ADMIN') {
    return <div className="flex-1 flex items-center justify-center p-12 text-sm text-slate-700">Only the company admin can delete the company.</div>;
  }

  return (
    <div className="flex-1 bg-paper py-16 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-red-200 shadow-md space-y-5">
        <Link href="/dashboard" className="text-sm text-brand-700 font-semibold">← Dashboard</Link>
        <div className="flex gap-3 items-start">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Delete {company}</h1>
            <p className="text-sm text-slate-600 mt-1">
              This permanently deletes the company and everything in it: every member&apos;s account, assessments, reports,
              courses, progress and certificates. Certificates will stop verifying. It cannot be undone.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="del-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Type <span className="normal-case font-mono">{company}</span> to confirm
            </label>
            <input id="del-name" value={name} onChange={(e) => setName(e.target.value)} className={FIELD} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="del-pw" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Your password</label>
            <input id="del-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={FIELD} autoComplete="current-password" />
          </div>
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={busy || name.trim() !== company || !password}
            className="w-full py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-40"
          >
            {busy ? 'Deleting…' : 'Delete the company permanently'}
          </button>
        </form>
      </div>
    </div>
  );
}
