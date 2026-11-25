import { Award } from 'lucide-react';

export interface CertificateFacts {
  code: string;
  learnerName: string;
  courseTitle: string;
  companyName: string;
  grade: number;
  issuedAt: string;
  expiresAt: string;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
}

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

/** The certificate itself; shared by the learner's printable page and the public verify page. */
export default function CertificateCard({ cert, verifyUrl }: { cert: CertificateFacts; verifyUrl: string }) {
  return (
    <div className="relative bg-white border-[10px] border-double border-brand-200 rounded-3xl px-8 sm:px-14 py-12 text-center shadow-lg aspect-auto sm:aspect-[1.414/1] flex flex-col justify-center print:shadow-none">
      {cert.status !== 'VALID' && (
        <div className="absolute top-6 right-6 rotate-6 border-2 border-red-500 text-red-600 font-extrabold uppercase tracking-widest px-3 py-1 rounded">
          {cert.status === 'REVOKED' ? 'Revoked' : 'Expired'}
        </div>
      )}
      <Award className="w-12 h-12 text-brand-600 mx-auto" />
      <div className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-slate-500">PrismScore · Certificate of completion</div>
      <div className="mt-8 text-sm text-slate-600">This certifies that</div>
      <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{cert.learnerName}</div>
      <div className="mt-2 text-sm text-slate-600">of {cert.companyName}</div>
      <div className="mt-6 text-sm text-slate-600">completed every lesson and passed every graded quiz of</div>
      <div className="mt-2 text-xl font-bold text-brand-800">{cert.courseTitle}</div>
      <div className="mt-2 text-sm text-slate-600">with an average quiz grade of {cert.grade}%</div>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
        <div><div className="font-bold text-slate-800">Issued</div>{fmt(cert.issuedAt)}</div>
        <div><div className="font-bold text-slate-800">Certificate no.</div><span className="font-mono">{cert.code}</span></div>
        <div><div className="font-bold text-slate-800">Valid until</div>{fmt(cert.expiresAt)}</div>
      </div>
      <div className="mt-6 text-[11px] text-slate-500">Verify at <span className="font-mono">{verifyUrl}</span></div>
      <div className="mt-1 text-[11px] text-slate-400">Issued by ScienceWerx. A course certificate, not an assessment of job performance.</div>
    </div>
  );
}
