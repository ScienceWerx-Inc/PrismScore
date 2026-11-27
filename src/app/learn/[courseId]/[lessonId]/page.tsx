'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, Award, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { redirectIfSignedOut } from '@/lib/clientAuth';
import LessonSlides from '@/components/learn/LessonSlides';
import MermaidView from '@/components/learn/MermaidView';

interface LessonContent {
  body: string;
  keyPoints: string[];
  callout: { kind: 'warning' | 'note'; text: string };
  exercise: string;
  mermaid?: string;
  checkpoint: { stem: string; options: { id: string; label: string }[]; correctOptionId: string; explanation: string };
}

interface LessonData {
  id: string;
  kind: 'LESSON' | 'QUIZ';
  title: string;
  moduleTitle: string;
  durationMin: number;
  isWorkshop: boolean;
  content: LessonContent | null;
  completed: boolean;
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="leading-relaxed">{p}</p>
      ))}
    </>
  );
}

function CertificateNotice({ courseId, code }: { courseId: string; code: string | null }) {
  if (!code) return null;
  return (
    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 font-bold"><Award className="w-5 h-5" /> Course complete: certificate {code}</span>
      <Link href={`/learn/${courseId}/certificate`} className="text-sm font-bold underline">View</Link>
    </div>
  );
}

function Lesson({ courseId, lesson, onDone }: { courseId: string; lesson: LessonData; onDone: (cert: string | null) => void }) {
  const c = lesson.content!;
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Read or Slides; remembered per browser as a convenience.
  const [mode, setModeState] = useState<'read' | 'slides'>('read');
  useEffect(() => {
    try {
      if (localStorage.getItem('prism_lesson_mode') === 'slides') setModeState('slides');
    } catch {}
  }, []);
  const setMode = (m: 'read' | 'slides') => {
    setModeState(m);
    try {
      localStorage.setItem('prism_lesson_mode', m);
    } catch {}
  };

  const complete = async () => {
    setSaving(true);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lesson.id}/complete`, { method: 'POST' });
    if (redirectIfSignedOut(res)) return;
    const body = await res.json();
    setSaving(false);
    if (res.ok) onDone(body.certificate ?? null);
  };

  return (
    <article className="space-y-6">
      <div role="tablist" aria-label="Lesson view" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm font-semibold">
        {(['read', 'slides'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg ${mode === m ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {m === 'read' ? 'Read' : 'Slides'}
          </button>
        ))}
      </div>

      {mode === 'slides' ? (
        <LessonSlides
          lesson={{ title: lesson.title, moduleTitle: lesson.moduleTitle, durationMin: lesson.durationMin, isWorkshop: lesson.isWorkshop, content: c }}
        />
      ) : (
      <>
      <div className="space-y-4 text-[15px] text-slate-800">
        <Paragraphs text={c.body} />
      </div>

      {c.mermaid && <MermaidView source={c.mermaid} title={`Diagram: ${lesson.title}`} />}

      <div className={`p-4 rounded-2xl border flex gap-3 text-sm ${c.callout.kind === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-brand-50 border-brand-200 text-brand-900'}`}>
        {c.callout.kind === 'warning' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
        <span>{c.callout.text}</span>
      </div>

      <section className="p-5 rounded-2xl bg-white border border-slate-200">
        <h2 className="font-bold text-slate-900 mb-2">Key points</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
          {c.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
        </ul>
      </section>

      <section className="p-5 rounded-2xl bg-white border border-slate-200">
        <h2 className="font-bold text-slate-900 mb-2">{lesson.isWorkshop ? 'Your workshop deliverable' : 'Your exercise this week'}</h2>
        <p className="text-sm text-slate-700 leading-relaxed">{c.exercise}</p>
      </section>

      </>
      )}

      <section className="p-5 rounded-2xl bg-white border border-slate-200">
        <h2 className="font-bold text-slate-900 mb-1">Check yourself</h2>
        <p className="text-xs text-slate-500 mb-3">Not graded. It shows whether the idea landed before you move on.</p>
        <p className="text-sm text-slate-800 mb-3">{c.checkpoint.stem}</p>
        <div className="space-y-2">
          {c.checkpoint.options.map((o) => {
            const chosen = picked === o.id;
            const right = o.id === c.checkpoint.correctOptionId;
            return (
              <button
                key={o.id}
                type="button"
                disabled={picked !== null}
                onClick={() => setPicked(o.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  picked === null
                    ? 'border-slate-200 hover:border-brand-300'
                    : right
                      ? 'border-emerald-300 bg-emerald-50'
                      : chosen
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200 opacity-60'
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {picked && <p className="text-sm text-slate-700 mt-3">{c.checkpoint.explanation}</p>}
      </section>

      <div className="flex justify-end">
        {lesson.completed ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="w-5 h-5" /> Completed</span>
        ) : (
          <button
            type="button"
            onClick={complete}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Mark lesson complete'}
          </button>
        )}
      </div>
    </article>
  );
}

interface QuizQuestion {
  id: string;
  type: 'mcq_single' | 'mcq_multi' | 'true_false';
  stem: string;
  options: { id: string; label: string }[];
  points: number;
  correctOptionIds?: string[];
  explanation?: string;
}

interface QuizData {
  policy: { maxAttempts: number; passPercent: number };
  attempts: { percent: number; passed: boolean }[];
  passed: boolean;
  attemptsLeft: number;
  questions: QuizQuestion[];
}

function Quiz({ courseId, lessonId, onCertificate }: { courseId: string; lessonId: string; onCertificate: (c: string | null) => void }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<{ percent: number; passed: boolean; attemptsLeft: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/quiz/${lessonId}`);
    if (redirectIfSignedOut(res)) return;
    setQuiz(await res.json());
  }, [courseId, lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!quiz) return <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />;
  const over = quiz.passed || quiz.attemptsLeft === 0;

  const toggle = (q: QuizQuestion, optionId: string) => {
    if (over) return;
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      if (q.type === 'mcq_multi') {
        return { ...prev, [q.id]: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId] };
      }
      return { ...prev, [q.id]: [optionId] };
    });
  };

  const submit = async () => {
    const unanswered = quiz.questions.filter((q) => !(answers[q.id]?.length)).length;
    if (unanswered && !confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return;
    setSubmitting(true);
    const res = await fetch(`/api/courses/${courseId}/quiz/${lessonId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    if (redirectIfSignedOut(res)) return;
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      alert(body.error || 'Could not submit the quiz.');
      return;
    }
    setResult(body);
    onCertificate(body.certificate ?? null);
    setAnswers({});
    load();
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-700">
        You need {quiz.policy.passPercent}% to pass. {quiz.passed
          ? 'You passed this quiz.'
          : `${quiz.attemptsLeft} of ${quiz.policy.maxAttempts} attempts left.`}{' '}
        {!over && 'Answers and explanations appear once you pass or use your last attempt.'}
        {quiz.attempts.length > 0 && (
          <span className="block text-xs text-slate-500 mt-1">
            Attempts so far: {quiz.attempts.map((a) => `${a.percent}%`).join(', ')}
          </span>
        )}
      </div>

      {result && !result.passed && !over && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          You scored {result.percent}%. Review the module&apos;s lessons and try again.
        </div>
      )}

      {quiz.questions.map((q, i) => (
        <section key={q.id} className="p-5 rounded-2xl bg-white border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">
            Question {i + 1} · {q.points} pt{q.points === 1 ? '' : 's'}{q.type === 'mcq_multi' ? ' · choose all that apply' : ''}
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-3">{q.stem}</p>
          <div className="space-y-2">
            {q.options.map((o) => {
              const chosen = (answers[q.id] ?? []).includes(o.id);
              const right = q.correctOptionIds?.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(q, o.id)}
                  disabled={over}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2 ${
                    over
                      ? right
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-200 opacity-70'
                      : chosen
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-300'
                  }`}
                >
                  {over && (right ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-slate-300" />)}
                  {o.label}
                </button>
              );
            })}
          </div>
          {over && q.explanation && <p className="text-sm text-slate-700 mt-3">{q.explanation}</p>}
        </section>
      ))}

      {!over && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? 'Grading…' : 'Submit answers'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/lessons/${lessonId}`).then(async (res) => {
      if (redirectIfSignedOut(res)) return;
      const body = await res.json();
      if (!res.ok) setError(body.error || 'Lesson not found.');
      else setLesson(body);
    });
  }, [courseId, lessonId]);

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm text-slate-600">
        {error ?? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-paper py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href={`/learn/${courseId}`} className="text-sm text-brand-700 font-semibold">← Course outline</Link>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {lesson.moduleTitle} · {lesson.kind === 'QUIZ' ? 'Graded quiz' : lesson.isWorkshop ? `Workshop · ${lesson.durationMin} min` : `${lesson.durationMin} min`}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{lesson.title}</h1>
        </div>

        <CertificateNotice courseId={courseId} code={certificate} />

        {lesson.kind === 'QUIZ' ? (
          <Quiz courseId={courseId} lessonId={lesson.id} onCertificate={setCertificate} />
        ) : (
          <Lesson
            courseId={courseId}
            lesson={lesson}
            onDone={(cert) => {
              setLesson({ ...lesson, completed: true });
              setCertificate(cert);
            }}
          />
        )}

        <nav className="flex justify-between gap-4 pt-4 border-t border-slate-200 text-sm">
          {lesson.prev ? (
            <Link href={`/learn/${courseId}/${lesson.prev.id}`} className="text-brand-700 font-semibold">← {lesson.prev.title}</Link>
          ) : <span />}
          {lesson.next && (
            <Link href={`/learn/${courseId}/${lesson.next.id}`} className="text-brand-700 font-semibold text-right">{lesson.next.title} →</Link>
          )}
        </nav>
      </div>
    </div>
  );
}
