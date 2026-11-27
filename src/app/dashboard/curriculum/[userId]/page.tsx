'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Award, CheckCircle2, Circle, ClipboardCheck, Hammer, Loader2 } from 'lucide-react';
import { redirectIfSignedOut } from '@/lib/clientAuth';

interface Lesson { id: string; kind: string; title: string; isWorkshop: boolean; status: string; completed: boolean; bestPercent?: number | null }
interface CourseSnap {
  id: string;
  title: string | null;
  status: string;
  shared: boolean;
  percent: number;
  grade: { percent: number; letter: string } | null;
  modules: { id: string; title: string; lessons: Lesson[] }[];
  certificate: { code: string; letter: string; grade: number; expiresAt: string; revoked: boolean } | null;
}

export default function LearnerOverviewPage() {
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<{ person: { name: string; role: string }; courses: CourseSnap[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/curriculum/learners/${userId}`).then(async (res) => {
      if (redirectIfSignedOut(res)) return;
      const body = await res.json();
      if (res.ok) setData(body);
      else setError(body.error || 'Not found.');
    });
  }, [userId]);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm text-slate-600">
        {error ?? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-paper py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/dashboard/curriculum" className="text-sm text-brand-700 font-semibold">← Learning plan</Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{data.person.name}</h1>
          <p className="text-sm text-slate-600 mt-1">{data.person.role} · progress only; answers stay private to them.</p>
        </div>
        {data.courses.length === 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600">No course yet.</div>
        )}
        {data.courses.map((c) => (
          <section key={c.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1">
              <h2 className="font-bold text-slate-900 flex-1 min-w-[12rem]">{c.title ?? 'Course being written'}{c.shared ? ' (shared company course)' : ''}</h2>
              <span className="text-sm text-slate-700">{c.percent}%{c.grade ? ` · grade ${c.grade.letter} (${c.grade.percent}%)` : ''}</span>
              {c.certificate && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                  <Award className="w-4 h-4" /> {c.certificate.code}{c.certificate.revoked ? ' (revoked)' : ''}
                </span>
              )}
            </div>
            <ol className="divide-y divide-slate-100">
              {c.modules.map((m) => (
                <li key={m.id} className="px-5 py-3">
                  <div className="text-sm font-semibold text-slate-900 mb-1">{m.title}</div>
                  <ul className="space-y-1">
                    {m.lessons.map((l) => {
                      const Icon = l.kind === 'QUIZ' ? ClipboardCheck : l.isWorkshop ? Hammer : l.completed ? CheckCircle2 : Circle;
                      return (
                        <li key={l.id} className="flex items-center gap-2 text-sm">
                          <Icon className={`w-4 h-4 shrink-0 ${l.completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="flex-1 text-slate-700">{l.title}</span>
                          <span className="text-xs text-slate-500">
                            {l.kind === 'QUIZ' ? (l.completed ? `Passed · ${l.bestPercent}%` : l.bestPercent != null ? `Best ${l.bestPercent}%` : 'Not taken') : l.completed ? 'Done' : ''}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
