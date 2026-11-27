/**
 * A lesson as slides, built from its text with no model call (the idea of
 * iStartup's derived decks): a title slide, the reading split into concept
 * slides, the callout, the diagram, key points, the exercise and a recap.
 * Slides are presentation only; the lesson text stays the source, and nothing
 * here touches progress. Pure and client-safe.
 */

export type Slide =
  | { kind: 'title'; title: string; subtitle: string }
  | { kind: 'concept'; title: string; points: string[] }
  | { kind: 'highlight'; text: string; tone: 'warning' | 'note' }
  | { kind: 'diagram'; source: string }
  | { kind: 'list'; title: string; points: string[] }
  | { kind: 'task'; title: string; text: string };

export interface SlideSource {
  title: string;
  moduleTitle: string;
  durationMin: number;
  isWorkshop: boolean;
  content: {
    body: string;
    keyPoints: string[];
    callout: { kind: 'warning' | 'note'; text: string };
    exercise: string;
    mermaid?: string;
  };
}

const MAX_SLIDES = 16;
const TITLE_MAX = 90;
const POINT_MAX = 200;

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

/** Sentences, keeping abbreviations like "e.g." from splitting mid-thought where possible. */
export function sentences(paragraph: string): string[] {
  return (paragraph.replace(/\s+/g, ' ').trim().match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

export function deckFromLesson(lesson: SlideSource): Slide[] {
  const c = lesson.content;
  const slides: Slide[] = [
    {
      kind: 'title',
      title: clip(lesson.title, TITLE_MAX),
      subtitle: `${lesson.moduleTitle} · ${lesson.isWorkshop ? 'Workshop · ' : ''}${lesson.durationMin} min`,
    },
  ];

  // One concept slide per paragraph: its first sentence is the heading, the rest the points.
  for (const para of c.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)) {
    const [first, ...rest] = sentences(para);
    if (!first) continue;
    slides.push({
      kind: 'concept',
      title: clip(first, TITLE_MAX * 2),
      points: rest.slice(0, 4).map((s) => clip(s, POINT_MAX)),
    });
  }

  // The callout belongs early: it is usually the mistake the lesson exists to prevent.
  const calloutAt = Math.min(slides.length, 3);
  slides.splice(calloutAt, 0, { kind: 'highlight', text: clip(c.callout.text, 320), tone: c.callout.kind });
  if (c.mermaid) slides.push({ kind: 'diagram', source: c.mermaid });
  slides.push({ kind: 'list', title: 'Key points', points: c.keyPoints.slice(0, 5).map((k) => clip(k, POINT_MAX)) });
  slides.push({ kind: 'task', title: lesson.isWorkshop ? 'Your workshop deliverable' : 'Your exercise this week', text: clip(c.exercise, 600) });

  if (slides.length <= MAX_SLIDES) return slides;
  // Too long: keep the title, the first concepts, and every closing slide.
  const isClosing = (s: Slide) => s.kind === 'diagram' || s.kind === 'list' || s.kind === 'task';
  const closing = slides.filter(isClosing);
  const opening = slides.filter((s) => !isClosing(s)).slice(0, MAX_SLIDES - closing.length);
  return [...opening, ...closing];
}
