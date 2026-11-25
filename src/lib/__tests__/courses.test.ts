import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ prisma: {} }));

import { planForCompany, planForExecutive, MAX_MODULES } from '../courses/plan';
import { clampOutline, gradeableQuestions, toPlainParagraphs, type CourseOutline } from '../courses/ai';
import { gradeAttempt, certificateExpiry } from '../courses/rules';
import { newCertificateCode } from '../courses/progress';
import { CLEVEL_QUESTIONS, COMPANY_QUESTIONS } from '../seed-data';

const company = { name: 'Acme', industry: 'Logistics', sizeBand: '51-200 employees', country: 'Egypt' };

/** Picks, for every company question, the option worth `points` (or the nearest below). */
function companyAnswers(pointsByDim: Record<string, number>) {
  return Object.fromEntries(
    COMPANY_QUESTIONS.map((q) => {
      const want = pointsByDim[q.dimensionId] ?? 3;
      const opt = [...q.options].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).find((o) => (o.points ?? 0) <= want)!;
      return [q.id, opt.id];
    }),
  );
}

describe('planForCompany', () => {
  it('builds one module per weak dimension, weakest first, capped at four', () => {
    const plan = planForCompany({
      company,
      learner: { name: 'A', role: 'CEO' },
      totalScore: 150,
      band: 'Unaware',
      answers: companyAnswers({ STRATEGY: 0, USE_VALUE: 1, DATA_TECH: 0, GOVERNANCE: 1, PEOPLE: 0 }),
    });
    expect(plan.modules.length).toBe(MAX_MODULES);
    const pcts = plan.modules.map((m) => m.percent);
    expect([...pcts].sort((a, b) => a - b)).toEqual(pcts);
    for (const m of plan.modules) {
      expect(m.focus.length).toBeGreaterThan(0);
      expect(m.focus.length).toBeLessThanOrEqual(3);
      expect(m.lessonCount).toBe(Math.max(2, m.focus.length) + 1);
      for (const f of m.focus) expect(f.better.length).toBeGreaterThan(0);
    }
  });

  it('still gives a strong company its two weakest areas', () => {
    const plan = planForCompany({
      company,
      learner: { name: 'A', role: 'CEO' },
      totalScore: 480,
      band: 'AI-led',
      answers: companyAnswers({ STRATEGY: 3, USE_VALUE: 3, DATA_TECH: 2, GOVERNANCE: 3, PEOPLE: 2 }),
    });
    expect(plan.modules.map((m) => m.key).sort()).toEqual(['DATA_TECH', 'PEOPLE']);
  });

  it('is deterministic', () => {
    const input = { company, learner: { name: 'A', role: 'CEO' }, totalScore: 200, band: 'Unaware', answers: companyAnswers({ STRATEGY: 1 }) };
    expect(planForCompany(input)).toEqual(planForCompany(input));
  });
});

describe('planForExecutive', () => {
  it('targets competencies below the role target, largest gap first', () => {
    const answers = Object.fromEntries(
      CLEVEL_QUESTIONS.filter((q) => q.layer === 'KNOWLEDGE').map((q) => [q.id, q.options[0].id]), // all UNAWARE
    );
    const plan = planForExecutive({ company, learner: { name: 'Cy', role: 'CTO' }, answers, concerns: ['Data & Security'] });
    expect(plan.modules.length).toBeGreaterThanOrEqual(2);
    expect(plan.modules.length).toBeLessThanOrEqual(MAX_MODULES);
    // A CTO's targets are LEADING for AI Fundamentals: an UNAWARE answer there is a top gap.
    expect(plan.modules.map((m) => m.key)).toContain('AI_FUNDAMENTALS');
    expect(plan.concerns).toEqual(['Data & Security']);
  });

  it('falls back to OTHER targets for unknown roles', () => {
    const plan = planForExecutive({ company, learner: { name: 'Z', role: 'CDO' }, answers: {}, concerns: [] });
    expect(plan.learner.role).toBe('OTHER');
    expect(plan.modules.length).toBeGreaterThanOrEqual(2);
  });
});

describe('clampOutline', () => {
  const plan = planForCompany({ company, learner: { name: 'A', role: 'CEO' }, totalScore: 150, band: 'Unaware', answers: companyAnswers({ STRATEGY: 0, PEOPLE: 0 }) });
  it('forces plan order, lesson counts, known ids and duration bounds', () => {
    const reversed: CourseOutline = {
      title: 't',
      subtitle: 's',
      description: 'd',
      modules: [...plan.modules].reverse().map((m) => ({
        key: m.key,
        title: `T ${m.key}`,
        lessons: Array.from({ length: m.lessonCount + 2 }, (_, i) => ({
          title: `L${i}`,
          brief: 'b',
          focusQuestionIds: ['made-up'],
          durationMin: i === 0 ? 1 : 99,
        })),
      })),
    };
    const out = clampOutline(reversed, plan);
    expect(out.modules.map((m) => m.key)).toEqual(plan.modules.map((m) => m.key));
    out.modules.forEach((m, i) => {
      expect(m.lessons.length).toBe(plan.modules[i].lessonCount);
      const ids = new Set(plan.modules[i].focus.map((f) => f.questionId));
      for (const l of m.lessons) {
        expect(l.focusQuestionIds.every((id) => ids.has(id))).toBe(true);
        expect(l.durationMin).toBeGreaterThanOrEqual(6);
        expect(l.durationMin).toBeLessThanOrEqual(14);
      }
    });
  });
});

describe('quiz rules', () => {
  const key = [
    { id: 'q1', points: 2, correctOptionIds: ['a'] },
    { id: 'q2', points: 3, correctOptionIds: ['b', 'c'] },
    { id: 'q3', points: 5, correctOptionIds: ['true'] },
  ];
  it('scores only exact matches', () => {
    expect(gradeAttempt(key, { q1: ['a'], q2: ['b', 'c'], q3: ['true'] })).toMatchObject({ percent: 100, passed: true });
    expect(gradeAttempt(key, { q1: ['a'], q2: ['b'], q3: ['true'] })).toMatchObject({ score: 7, percent: 70, passed: true });
    expect(gradeAttempt(key, { q1: ['a', 'b'], q2: ['b', 'c'], q3: [] })).toMatchObject({ score: 3, passed: false });
    expect(gradeAttempt(key, {})).toMatchObject({ score: 0, passed: false });
  });

  it('drops ungradeable questions and normalises true/false', () => {
    const base = { stem: 's', points: 9, difficulty: 'easy' as const, explanation: 'e' };
    const kept = gradeableQuestions([
      { ...base, type: 'mcq_single', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], correctOptionIds: ['a'] },
      { ...base, type: 'mcq_single', options: [{ id: 'a', label: 'A' }], correctOptionIds: ['a', 'b'] },
      { ...base, type: 'mcq_multi', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], correctOptionIds: ['a'] },
      { ...base, type: 'true_false', options: [], correctOptionIds: ['false'] },
      { ...base, type: 'mcq_single', options: [{ id: 'a', label: 'A' }, { id: 'a', label: 'dup' }], correctOptionIds: ['a'] },
    ]);
    expect(kept).toHaveLength(2);
    expect(kept[0].points).toBe(5);
    expect(kept[1].options.map((o) => o.id)).toEqual(['true', 'false']);
  });
});

describe('certificates and text', () => {
  it('issues well-formed codes and six-month validity', () => {
    expect(newCertificateCode()).toMatch(/^PS-[0-9A-F]{10}$/);
    expect(certificateExpiry(new Date('2026-01-15T00:00:00Z')).toISOString().slice(0, 7)).toBe('2026-07');
  });

  it('strips markdown into plain paragraphs', () => {
    expect(toPlainParagraphs('## Title\n**Bold** text\n\n- item one\n- item two')).toBe('Title Bold text\n\nitem one item two');
  });
});
