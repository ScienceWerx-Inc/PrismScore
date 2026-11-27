import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ prisma: {} }));

import { courseGrade, letterGrade } from '../courses/rules';
import { deckFromLesson, sentences } from '../courses/slides';
import { safeDiagram } from '../courses/ai';

describe('grades', () => {
  it('maps percents to iStartup letters', () => {
    expect([95, 90, 89, 80, 79, 70, 69, 60, 59, 0].map(letterGrade)).toEqual(['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'F', 'F']);
  });
  it('averages best quiz scores, null before any quiz', () => {
    expect(courseGrade([])).toBeNull();
    expect(courseGrade([100, 70, 81])).toEqual({ percent: 84, letter: 'B' });
  });
});

const lesson = (paragraphs: number, extra: Partial<{ mermaid: string }> = {}) => ({
  title: 'Draft an enforceable AI acceptable use policy',
  moduleTitle: 'Governance',
  durationMin: 10,
  isWorkshop: false,
  content: {
    body: Array.from({ length: paragraphs }, (_, i) => `Idea ${i} is the heading. It has a detail. And another one.`).join('\n\n'),
    keyPoints: ['k1', 'k2', 'k3'],
    callout: { kind: 'warning' as const, text: 'Do not ban tools without offering a sanctioned one.' },
    exercise: 'Write the one-page policy this week.',
    ...extra,
  },
});

describe('slides', () => {
  it('splits sentences', () => {
    expect(sentences('One thing. Two things! Three?')).toEqual(['One thing.', 'Two things!', 'Three?']);
  });
  it('builds title, concepts, callout, key points and exercise', () => {
    const deck = deckFromLesson(lesson(3));
    expect(deck[0].kind).toBe('title');
    expect(deck.filter((s) => s.kind === 'concept')).toHaveLength(3);
    expect(deck.some((s) => s.kind === 'highlight')).toBe(true);
    expect(deck.at(-2)?.kind).toBe('list');
    expect(deck.at(-1)?.kind).toBe('task');
    const c = deck.find((s) => s.kind === 'concept');
    expect(c && c.kind === 'concept' && c.title).toBe('Idea 0 is the heading.');
  });
  it('includes the diagram only when there is one, and caps long lessons', () => {
    expect(deckFromLesson(lesson(2)).some((s) => s.kind === 'diagram')).toBe(false);
    expect(deckFromLesson(lesson(2, { mermaid: 'graph LR\nA-->B' })).some((s) => s.kind === 'diagram')).toBe(true);
    const long = deckFromLesson(lesson(30, { mermaid: 'graph LR\nA-->B' }));
    expect(long.length).toBeLessThanOrEqual(16);
    expect(long.at(-1)?.kind).toBe('task');
    expect(long.some((s) => s.kind === 'diagram')).toBe(true);
  });
});

describe('safeDiagram', () => {
  it('keeps small plain flowcharts', () => {
    expect(safeDiagram('graph LR\nA[Draft] --> B[Review]\nB --> C[Leadership style check]').mermaid).toContain('graph LR');
  });
  it('drops other diagram types, directives, styling, clicks and huge sources', () => {
    expect(safeDiagram('sequenceDiagram\nA->>B: hi')).toEqual({});
    expect(safeDiagram('%%{init: {"securityLevel":"loose"}}%%\ngraph LR\nA-->B')).toEqual({});
    expect(safeDiagram('graph LR\nA-->B\nclick A "javascript:alert(1)"')).toEqual({});
    expect(safeDiagram('graph LR\nA-->B\nstyle A fill:#f00')).toEqual({});
    expect(safeDiagram(`graph LR\n${Array.from({ length: 40 }, (_, i) => `N${i}-->N${i + 1}`).join('\n')}`)).toEqual({});
    expect(safeDiagram(undefined)).toEqual({});
  });
});

import { companyFocusFrom } from '../courses/service';
import { planForExecutive } from '../courses/plan';

describe('company focus for executive courses', () => {
  it('lists weak company dimensions, weakest first', () => {
    expect(companyFocusFrom(JSON.stringify({ STRATEGY: 80, GOVERNANCE: 27, PEOPLE: 40, DATA_TECH: 59.6, USE_VALUE: 60 }))).toEqual([
      'Governance and Risk (27%)',
      'People and Skills (40%)',
      'Data and Technology (60%)',
    ]);
    expect(companyFocusFrom(null)).toEqual([]);
    expect(companyFocusFrom('not json')).toEqual([]);
    expect(companyFocusFrom(JSON.stringify({ STRATEGY: 90, UNKNOWN: 10 }))).toEqual([]);
  });
  it('travels with the executive plan', () => {
    const plan = planForExecutive({
      company: { name: 'Acme', industry: 'Logistics', sizeBand: '51-200', country: 'Egypt' },
      learner: { name: 'Cy', role: 'CTO' },
      answers: {},
      concerns: [],
      companyFocus: ['Governance and Risk (27%)'],
    });
    expect(plan.companyFocus).toEqual(['Governance and Risk (27%)']);
  });
});
