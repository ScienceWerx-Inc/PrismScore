'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Award, CheckCircle2, Circle, ClipboardCheck, Hammer, Loader2, AlertTriangle } from 'lucide-react';
import { redirectIfSignedOut } from '@/lib/clientAuth';

interface LessonRow {
  id: string;
  kind: 'LESSON' | 'QUIZ';
  title: string;
  durationMin: number;
  isWorkshop: boolean;
  status: string;
  completed: boolean;
  bestPercent?: number | null;
  attemptsLeft?: number;
}

interface CourseData {
  id: string;
  status: 'OUTLINING' | 'WRITING' | 'READY' | 'ERROR';
  error: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  percent: number;
  modules: { id: string; title: string; lessons: LessonRow[] }[];
  certificate: { code: string; issuedAt: string; expiresAt: string; grade: number; revoked: boolean } | null;
}

/** Parallel build requests; each does at most one model call on the server. */
const BUILD_CONCURRENCY = 3;

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const building = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}`);
    if (redirectIfSignedOut(res)) return null;
    const data = await res.json();
    if (!res.ok) {
      setBuildError(data.error || 'Course not found.');
      return null;
    }
    setCourse(data);
    return data as CourseData;
  }, [courseId]);

  // Drive the build until the server says the course is ready.
  const build = useCallback(async () => {
    if (building.current) return;
    building.current = true;
    let failures = 0;
    try {
      for (;;) {
        const results = await Promise.all(
          Array.from({ length: BUILD_CONCURRENCY }, () =>
            fetch(`/api/courses/${courseId}/build`, { method: 'POST' })
              .then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
              .catch(() => ({ ok: false, body: {} as any })),
          ),
        );
        const latest = await load();
        if (!latest || latest.status === 'READY' || latest.status === 'ERROR') break;

        if (results.every((r) => !r.ok)) {
          failures += 1;
          setBuildError(results[0].body?.error || 'A step failed; retrying…');
          if (failures >= 4) break;
          await new Promise((r) => setTimeout(r, 4000 * failures));
        } else {
          failures = 0;
          setBuildError(null);
          // Others are mid-flight elsewhere (another tab): wait before asking again.
          if (results.every((r) => r.body?.waiting)) await new Promise((r) => setTimeout(r, 3000));
        }
      }
    } finally {
      building.current = false;
    }
  }, [courseId, load]);

  useEffect(() => {
    load().then((c) => {
      if (c && (c.status === 'OUTLINING' || c.status === 'WRITING')) build();
    });
  }, [load, build]);

  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm text-slate-600">
        {buildError ?? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />}
      </div>
    );
  }

  const all = course.modules.flatMap((m) => m.lessons);
  const written = all.filter((l) => l.status === 'DONE').length;
  const ready = course.status === 'READY';

  return (
    <div className="flex-1 bg-paper py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/learn" className="text-sm text-brand-700 font-semibold">← All courses</Link>

        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {course.title || 'Designing your course…'}
          </h1>
          {course.subtitle && <p className="text-base text-slate-700 mt-2">{course.subtitle}</p>}
          {course.description && <p className="text-sm text-slate-600 mt-3 max-w-2xl">{course.description}</p>}
        </div>

        {!ready && course.status !== 'ERROR' && (
          <div className="p-5 rounded-2xl bg-white border border-brand-200 flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-brand-600 animate-spin shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700">
              {course.status === 'OUTLINING'
                ? 'Planning your modules from your assessment results…'
                : `Writing your lessons: ${written} of ${all.length} done.`}
              <span className="block text-xs text-slate-500 mt-1">Keep this page open while it writes. If you leave, it picks up where it stopped when you come back.</span>
              {buildError && <span className="block text-xs text-amber-700 mt-1">{buildError}</span>}
            </div>
          </div>
        )}

        {course.status === 'ERROR' && (
          <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800 flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{course.error || 'This course could not be finished.'} Please contact support.</span>
          </div>
        )}

        {ready && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
              <span>Your progress</span>
              <span>{course.percent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${course.percent}%` }} />
            </div>
          </div>
        )}

        {course.certificate && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-emerald-900">
              <Award className="w-6 h-6" />
              <div>
                <div className="font-bold">Certificate earned · grade {course.certificate.grade}%</div>
                <div className="text-xs">No. {course.certificate.code}, valid until {new Date(course.certificate.expiresAt).toLocaleDateString()}</div>
              </div>
            </div>
            <Link
              href={`/learn/${course.id}/certificate`}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 text-center"
            >
              View certificate
            </Link>
          </div>
        )}

        <ol className="space-y-6">
          {course.modules.map((m, mi) => (
            <li key={m.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Module {mi + 1}</div>
                <h2 className="text-lg font-bold text-slate-900">{m.title}</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {m.lessons.map((l) => {
                  const openable = ready && l.status === 'DONE';
                  const Icon = l.kind === 'QUIZ' ? ClipboardCheck : l.isWorkshop ? Hammer : l.completed ? CheckCircle2 : Circle;
                  const row = (
                    <div className="px-5 py-3 flex items-center gap-3 text-sm">
                      <Icon className={`w-5 h-5 shrink-0 ${l.completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={`flex-1 ${openable ? 'text-slate-900' : 'text-slate-400'}`}>{l.title}</span>
                      <span className="text-xs text-slate-500 shrink-0">
                        {l.kind === 'QUIZ'
                          ? l.completed
                            ? `Passed · ${l.bestPercent}%`
                            : l.bestPercent != null
                              ? `Best ${l.bestPercent}% · ${l.attemptsLeft} left`
                              : 'Quiz'
                          : l.status === 'DONE'
                            ? `${l.durationMin} min`
                            : 'Writing…'}
                      </span>
                    </div>
                  );
                  return (
                    <li key={l.id}>
                      {openable ? (
                        <Link href={`/learn/${course.id}/${l.id}`} className="block hover:bg-slate-50">{row}</Link>
                      ) : (
                        row
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
