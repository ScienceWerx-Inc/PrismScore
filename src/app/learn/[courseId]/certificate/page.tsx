'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, Printer } from 'lucide-react';
import CertificateCard, { type CertificateFacts } from '@/components/learn/CertificateCard';
import { redirectIfSignedOut } from '@/lib/clientAuth';

export default function CourseCertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [cert, setCert] = useState<CertificateFacts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/courses/${courseId}`);
      if (redirectIfSignedOut(res)) return;
      const course = await res.json();
      if (!res.ok || !course.certificate) {
        setError(course.error || 'Finish every lesson and pass every quiz to earn this certificate.');
        return;
      }
      const v = await fetch(`/api/verify/${course.certificate.code}`);
      setCert(await v.json());
    })();
  }, [courseId]);

  if (!cert) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm text-slate-600">
        {error ?? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />}
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/verify/${cert.code}`;
  return (
    <div className="flex-1 bg-paper py-10 px-4 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between no-print">
          <Link href={`/learn/${courseId}`} className="text-sm text-brand-700 font-semibold">← Course</Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700"
          >
            <Printer className="w-4 h-4" /> Print or save as PDF
          </button>
        </div>
        <CertificateCard cert={cert} verifyUrl={verifyUrl} />
      </div>
    </div>
  );
}
