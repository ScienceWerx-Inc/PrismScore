'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function VerifyLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  return (
    <div className="flex-1 bg-paper py-16 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
        <ShieldCheck className="w-8 h-8 text-brand-600" />
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">Verify a certificate</h1>
        <p className="text-sm text-slate-600 mt-1 mb-6">Enter the number printed on a PrismScore certificate.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) router.push(`/verify/${encodeURIComponent(code.trim().toUpperCase())}`);
          }}
          className="space-y-3"
        >
          <label htmlFor="verify-code" className="sr-only">Certificate number</label>
          <input
            id="verify-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="PS-1A2B3C4D5E"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono uppercase"
          />
          <button type="submit" className="w-full py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white text-sm">
            Check certificate
          </button>
        </form>
      </div>
    </div>
  );
}
