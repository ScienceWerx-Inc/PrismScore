'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Award, Loader2, Sparkles } from 'lucide-react';
import { redirectIfSignedOut } from '@/lib/clientAuth';
import ConnectedApps from '@/components/connect/ConnectedApps';

interface CourseCard {
  id: string;
  kind: 'COMPANY' | 'EXECUTIVE';
  status: string;
  title: string | null;
  subtitle: string | null;
  lessons: number;
  written: number;
  completed: number;
  certificateCode: string | null;
}

const KIND_LABEL = { COMPANY: 'From your company assessment', EXECUTIVE: 'From your C-level diagnostic' };

export default function LearnPage() {
  const router = useRouter();
  const [data, setData] = useState<{ courses: CourseCard[]; canStart: Record<'COMPANY' | 'EXECUTIVE', boolean> } | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/courses').then(async (res) => {
      if (redirectIfSignedOut(res)) return;
      setData(await res.json());
    });
  }, []);

  const start = async (kind: 'COMPANY' | 'EXECUTIVE') => {
    setStarting(kind);
    setError(null);
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind }),
    });
    if (redirectIfSignedOut(res)) return;
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'Could not start the course.');
      setStarting(null);
      return;
    }
    router.push(`/learn/${body.courseId}`);
  };

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      </div>
    );
  }

  const startable = (['COMPANY', 'EXECUTIVE'] as const).filter((k) => data.canStart[k]);

  return (
    <div className="flex-1 bg-paper py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your learning plan</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Each course is written for you from the gaps your assessment found: one module per weak area, a hands-on
            workshop to close each module, and a graded quiz. Finish every lesson and pass every quiz to earn a
            certificate anyone can verify.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}

        {startable.map((kind) => (
          <div key={kind} className="p-6 rounded-2xl bg-white border border-brand-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <div className="flex items-center gap-2 text-brand-700 font-bold text-sm">
                <Sparkles className="w-4 h-4" /> New course available
              </div>
              <p className="text-sm text-slate-600 mt-1">{KIND_LABEL[kind]}. Writing it takes a few minutes; you can start reading as soon as it is ready.</p>
            </div>
            <button
              type="button"
              onClick={() => start(kind)}
              disabled={starting !== null}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 disabled:opacity-50 shrink-0"
            >
              {starting === kind ? 'Starting…' : 'Build my course'}
            </button>
          </div>
        ))}

        {data.courses.length === 0 && startable.length === 0 && (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-600">
            Your course appears here once you have completed your assessment.
          </div>
        )}

        <div className="grid gap-4">
          {data.courses.map((c) => {
            const pct = c.lessons ? Math.round((c.completed / c.lessons) * 100) : 0;
            return (
              <Link
                key={c.id}
                href={`/learn/${c.id}`}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-brand-300 shadow-sm transition-colors block"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{KIND_LABEL[c.kind]}</div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-brand-600 shrink-0" />
                      <span className="truncate">{c.title || 'Your course is being designed'}</span>
                    </h2>
                    {c.subtitle && <p className="text-sm text-slate-600 mt-1">{c.subtitle}</p>}
                  </div>
                  {c.certificateCode && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 shrink-0">
                      <Award className="w-3.5 h-3.5" /> Certified
                    </span>
                  )}
                </div>
                <div className="mt-4 text-xs text-slate-600">
                  {c.status === 'READY'
                    ? `${c.completed} of ${c.lessons} done · ${pct}%`
                    : c.status === 'ERROR'
                      ? 'Writing stopped. Open the course to see what happened.'
                      : `Being written: ${c.written} of ${c.lessons || '…'} lessons`}
                </div>
                {c.status === 'READY' && (
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <ConnectedApps />
      </div>
    </div>
  );
}
