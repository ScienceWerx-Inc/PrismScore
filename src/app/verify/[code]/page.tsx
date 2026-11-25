import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import CertificateCard from '@/components/learn/CertificateCard';
import { verifyCertificate } from '@/lib/courses/progress';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Verify a certificate | PrismScore', robots: { index: false } };

export default async function VerifyCertificatePage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code).trim().toUpperCase();
  const cert = await verifyCertificate(code);
  const host = headers().get('host') ?? 'prismscore.us';

  return (
    <div className="flex-1 bg-paper py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {cert ? (
          <>
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold ${
                cert.status === 'VALID' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {cert.status === 'VALID' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              {cert.status === 'VALID'
                ? 'This certificate is genuine and currently valid.'
                : cert.status === 'EXPIRED'
                  ? 'This certificate is genuine but has expired.'
                  : 'This certificate was issued but has since been revoked.'}
            </div>
            <CertificateCard
              cert={{ ...cert, issuedAt: cert.issuedAt.toISOString(), expiresAt: cert.expiresAt.toISOString() }}
              verifyUrl={`${host}/verify/${cert.code}`}
            />
          </>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center">
            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900 mt-3">No certificate with number {code}</h1>
            <p className="text-sm text-slate-600 mt-2">Check the number printed on the certificate. It looks like PS-1A2B3C4D5E.</p>
            <Link href="/verify" className="inline-block mt-4 text-sm text-brand-700 font-semibold">Try another number</Link>
          </div>
        )}
      </div>
    </div>
  );
}
