'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, BookOpen, Compass, Loader2, Users } from 'lucide-react';
import { getActiveCompanyId, withCompany } from '@/lib/activeCompany';
import { redirectIfSignedOut } from '@/lib/clientAuth';

interface Learner {
  name: string;
  role: string;
  isAdmin: boolean;
  assessmentDone: boolean;
  course: { title: string | null; kind: string; status: string; percent: number; certificateCode: string | null } | null;
}

interface CurriculumData {
  company: { id: string; name: string };
  learners: Learner[];
  interventions: { concern: string; leaders: number; title: string; description: string }[];
  error?: string;
}

function statusOf(l: Learner): { label: string; tone: string } {
  if (!l.assessmentDone) return { label: l.isAdmin ? 'Company assessment not finished' : 'Diagnostic not taken yet', tone: 'text-slate-500' };
  if (!l.course) return { label: 'Course not started', tone: 'text-amber-700' };
  if (l.course.certificateCode) return { label: `Certified · ${l.course.certificateCode}`, tone: 'text-emerald-700' };
  if (l.course.status === 'READY') return { label: `${l.course.percent}% complete`, tone: 'text-brand-700' };
  if (l.course.status === 'ERROR') return { label: 'Course could not be written', tone: 'text-red-700' };
  return { label: 'Course being written', tone: 'text-slate-600' };
}

export default function CurriculumPage() {
  const [data, setData] = useState<CurriculumData | null>(null);

  useEffect(() => {
    fetch(withCompany('/api/curriculum/generate', getActiveCompanyId())).then(async (res) => {
      if (redirectIfSignedOut(res)) return;
      setData(await res.json());
    });
  }, []);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }
  if (data.error || !data.company) {
    return <div className="flex-1 flex items-center justify-center p-12 text-sm text-slate-700">{data.error || 'Not found.'}</div>;
  }

  return (
    <div className="flex-1 bg-paper py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="text-sm text-brand-700 font-semibold">← Dashboard</Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Learning plan for {data.company.name}</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Each leader gets a course written from their own results: you from the company assessment, each executive from
            their C-level diagnostic. Individual answers stay private; you see progress and certificates.
          </p>
        </div>

        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600" /> Leaders and their courses</h2>
            <Link href="/learn" className="text-sm font-bold text-brand-700 inline-flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> My course
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.learners.map((l, i) => {
              const s = statusOf(l);
              return (
                <li key={i} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                  <span className="font-semibold text-slate-900 sm:w-48">{l.name}</span>
                  <span className="text-slate-500 sm:w-24">{l.role}</span>
                  <span className="flex-1 text-slate-700 truncate">{l.course?.title ?? '—'}</span>
                  <span className={`font-semibold ${s.tone} inline-flex items-center gap-1`}>
                    {l.course?.certificateCode && <Award className="w-4 h-4" />}
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 flex items-center gap-2"><Compass className="w-5 h-5 text-brand-600" /> Beyond courses: addressing concerns</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">Some resistance is not a knowledge gap. These match the concerns your leaders reported in the diagnostic.</p>
          {data.interventions.length === 0 ? (
            <p className="text-sm text-slate-600">No concerns reported yet. They appear once executives complete the diagnostic.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.interventions.map((iv) => (
                <li key={iv.concern} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {iv.concern} · {iv.leaders} leader{iv.leaders === 1 ? '' : 's'}
                  </div>
                  <div className="font-semibold text-slate-900 mt-1">{iv.title}</div>
                  <p className="text-sm text-slate-600 mt-1">{iv.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
