'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, ClipboardList, Info, ListChecks } from 'lucide-react';
import { deckFromLesson, type Slide, type SlideSource } from '@/lib/courses/slides';
import MermaidView from './MermaidView';

/** The lesson as slides. Arrow keys and buttons move between them; nothing here affects progress. */
export default function LessonSlides({ lesson }: { lesson: SlideSource }) {
  const slides = useMemo(() => deckFromLesson(lesson), [lesson]);
  const [i, setI] = useState(0);
  const go = useCallback((d: number) => setI((n) => Math.min(slides.length - 1, Math.max(0, n + d))), [slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, button')) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const s = slides[i];
  return (
    <div className="space-y-3">
      <div
        className="relative rounded-3xl bg-white border border-slate-200 shadow-sm min-h-[340px] sm:aspect-[16/9] p-6 sm:p-10 flex flex-col justify-center"
        aria-live="polite"
        aria-roledescription="slide"
        aria-label={`Slide ${i + 1} of ${slides.length}`}
      >
        <SlideBody slide={s} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={i === 0}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border border-slate-300 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-1.5" aria-hidden="true">
          {slides.map((_, n) => (
            <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-brand-600' : 'w-1.5 bg-slate-300'}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={i === slides.length - 1}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white disabled:opacity-40"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SlideBody({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case 'title':
      return (
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-700">{slide.subtitle}</div>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{slide.title}</h2>
        </div>
      );
    case 'concept':
      return (
        <div>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug">{slide.title}</h3>
          {slide.points.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm sm:text-base text-slate-700 list-disc pl-5">
              {slide.points.map((p, n) => <li key={n}>{p}</li>)}
            </ul>
          )}
        </div>
      );
    case 'highlight':
      return (
        <div className={`flex gap-4 items-start text-base sm:text-xl ${slide.tone === 'warning' ? 'text-amber-900' : 'text-brand-900'}`}>
          {slide.tone === 'warning' ? <AlertTriangle className="w-8 h-8 shrink-0" /> : <Info className="w-8 h-8 shrink-0" />}
          <p className="font-semibold leading-relaxed">{slide.text}</p>
        </div>
      );
    case 'diagram':
      return <MermaidView source={slide.source} title="Lesson diagram" />;
    case 'list':
      return (
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-brand-600" /> {slide.title}
          </h3>
          <ul className="mt-4 space-y-2 text-sm sm:text-base text-slate-700 list-disc pl-5">
            {slide.points.map((p, n) => <li key={n}>{p}</li>)}
          </ul>
        </div>
      );
    case 'task':
      return (
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-600" /> {slide.title}
          </h3>
          <p className="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed">{slide.text}</p>
        </div>
      );
  }
}
