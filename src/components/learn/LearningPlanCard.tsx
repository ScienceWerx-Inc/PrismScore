'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, BookOpen, Loader2, Sparkles } from 'lucide-react';

interface Card {
  id: string;
  status: string;
  title: string | null;
  lessons: number;
  written: number;
  completed: number;
  certificateCode: string | null;
}

/**
 * "Your learning plan" on the report and dashboard: where a signed-in leader
 * finds the course written from their results. Renders nothing for visitors
 * (the sample report) or when there's no course and nothing to start.
 */
export default function LearningPlanCard({ className = '' }: { className?: string }) {
  const [state, setState] = useState<{ course: Card | null; canStart: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/courses')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled || !d) return;
          const own = (d.courses as (Card & { shared: boolean })[]).filter((c) => !c.shared);
          setState({ course: own[0] ?? d.courses[0] ?? null, canStart: Boolean(d.canStart?.COMPANY || d.canStart?.EXECUTIVE) });
        })
        .catch(() => {});
    load();
    // While the course is being written in the background, refresh now and then.
    const t = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (!state || (!state.course && !state.canStart)) return null;
  const c = state.course;
  const writing = c && (c.status === 'OUTLINING' || c.status === 'WRITING');
  const pct = c && c.lessons ? Math.round((c.completed / c.lessons) * 100) : 0;

  return (
    <div className={`p-5 rounded-2xl bg-white border border-brand-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 justify-between no-print ${className}`}>
      <div className="flex items-start gap-3 min-w-0">
        {c?.certificateCode ? <Award className="w-6 h-6 text-emerald-600 shrink-0" /> : writing ? <Loader2 className="w-6 h-6 text-brand-600 animate-spin shrink-0" /> : c ? <BookOpen className="w-6 h-6 text-brand-600 shrink-0" /> : <Sparkles className="w-6 h-6 text-brand-600 shrink-0" />}
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-700">Your learning plan</div>
          <div className="font-bold text-slate-900 truncate">{c?.title ?? (c ? 'Your course is being designed' : 'A course written from your results')}</div>
          <div className="text-sm text-slate-600">
            {!c && 'Close your gaps with lessons, hands-on workshops and graded quizzes, then earn a verifiable certificate.'}
            {c && writing && `Being written from your results: ${c.written} of ${c.lessons || '…'} lessons ready.`}
            {c && c.status === 'READY' && !c.certificateCode && `${c.completed} of ${c.lessons} done · ${pct}%`}
            {c?.certificateCode && `Certified · ${c.certificateCode}`}
          </div>
        </div>
      </div>
      <Link
        href={c ? `/learn/${c.id}` : '/learn'}
        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 text-center shrink-0"
      >
        {!c ? 'Build my course' : c.certificateCode ? 'View course' : c.status === 'READY' && c.completed > 0 ? 'Continue' : 'Open course'}
      </Link>
    </div>
  );
}
