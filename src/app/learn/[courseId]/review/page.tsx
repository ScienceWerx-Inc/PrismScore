'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { redirectIfSignedOut } from '@/lib/clientAuth';

interface Missed {
  id: string;
  stem: string;
  options: { id: string; label: string }[];
  chosen: string[];
  correctOptionIds: string[];
  explanation: string;
}
interface Review {
  courseTitle: string | null;
  sections: { quizId: string; moduleTitle: string; bestPercent: number; missed: Missed[] }[];
  pendingQuizzes: number;
}

export default function CourseReviewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [data, setData] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/review`).then(async (res) => {
      if (redirectIfSignedOut(res)) return;
      const body = await res.json();
      if (res.ok) setData(body);
      else setError(body.error || 'Could not load your review.');
    });
  }, [courseId]);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm text-slate-600">
        {error ?? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />}
      </div>
    );
  }

  const total = data.sections.reduce((s, x) => s + x.missed.length, 0);
  return (
    <div className="flex-1 bg-paper py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href={`/learn/${courseId}`} className="text-sm text-brand-700 font-semibold">← Course outline</Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Review what you missed</h1>
          <p className="text-sm text-slate-600 mt-2">
            Questions you got wrong in your best attempt at each finished quiz, with the right answer and why.
            {data.pendingQuizzes > 0 && ` ${data.pendingQuizzes} quiz${data.pendingQuizzes === 1 ? ' is' : 'zes are'} still in progress; their answers appear once you pass or use your last attempt.`}
          </p>
        </div>

        {data.sections.length === 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600">
            Nothing to review yet. Finish a module quiz and your missed questions will appear here.
          </div>
        )}
        {data.sections.length > 0 && total === 0 && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
            You answered every question correctly in your best attempts. Nothing to review.
          </div>
        )}

        {data.sections.filter((s) => s.missed.length).map((s) => (
          <section key={s.quizId} className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">{s.moduleTitle} <span className="text-sm font-semibold text-slate-500">· best {s.bestPercent}%</span></h2>
            {s.missed.map((q) => (
              <div key={q.id} className="p-5 rounded-2xl bg-white border border-slate-200">
                <p className="text-sm font-semibold text-slate-900 mb-3">{q.stem}</p>
                <ul className="space-y-1.5 text-sm">
                  {q.options.map((o) => {
                    const right = q.correctOptionIds.includes(o.id);
                    const picked = q.chosen.includes(o.id);
                    return (
                      <li
                        key={o.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${right ? 'border-emerald-300 bg-emerald-50' : picked ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                      >
                        {right ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : picked ? <XCircle className="w-4 h-4 text-red-500 shrink-0" /> : <span className="w-4 shrink-0" />}
                        <span>{o.label}</span>
                        {picked && <span className="ml-auto text-[11px] font-bold uppercase text-slate-500">your answer</span>}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-sm text-slate-700 mt-3">{q.explanation}</p>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
