import {
  CLEVEL_DIMENSIONS,
  CLEVEL_QUESTIONS,
  COMPANY_DIMENSIONS,
  COMPANY_QUESTIONS,
  type SeedQuestion,
} from '@/lib/seed-data';
import { DEFAULT_TARGET_LEVELS_BY_ROLE, LEVEL_NUMERICS, type CompetencyLevel } from '@/lib/scoring';

/**
 * Which gaps a learner's course closes. Pure: the same answers always give the
 * same plan, and nothing here calls the model; the AI writes lessons, it never
 * decides what to teach. Ported from iStartup's gap-course planner.
 *
 * - Company course (admin): one module per company dimension below 60%, weakest first.
 * - Executive course: one module per C-level competency below the target level for
 *   their role, largest gap first.
 * Either way 2 to 4 modules: someone strong everywhere still gets their two weakest
 * areas, so the course always has something to push on.
 */

export const MAX_MODULES = 4;
const MIN_MODULES = 2;
const WEAK_BELOW = 60;
const MAX_FOCUS_PER_MODULE = 3;

export interface GapFocus {
  questionId: string;
  /** The situation the question described, if any. */
  scenario?: string;
  prompt: string;
  /** What they picked. */
  current: string;
  /** How far along that answer is, in words ("1 of 3 points", "Aware, target Proficient"). */
  standing: string;
  /** The answers above theirs, lowest first: what "better" concretely looks like. */
  better: string[];
}

export interface GapModule {
  key: string;
  title: string;
  summary: string;
  /** 0–100: how far along this area is. */
  percent: number;
  focus: GapFocus[];
  /** A teaching lesson per gap in focus (at least two), then the module's hands-on workshop. */
  lessonCount: number;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  sizeBand: string;
  country: string;
}

export interface GapPlan {
  kind: 'COMPANY' | 'EXECUTIVE';
  company: CompanyProfile;
  learner: { name: string; role: string };
  /** One line on where they stand overall, e.g. "PrismScore 240/500 (Exploring)". */
  standing: string;
  /** Concerns the executive raised (resistance layer), used to set the tone. */
  concerns: string[];
  /**
   * For an executive: the company's weakest areas from its company assessment,
   * weakest first, e.g. "Governance and Risk (27%)". Lessons connect the leader's
   * own gaps to closing these. Empty for the company course itself.
   */
  companyFocus?: string[];
  modules: GapModule[];
}

/** Answers as { questionId: optionId }. */
export type Answers = Record<string, string>;

const lessonCountFor = (focus: number) => Math.max(2, focus) + 1;

function pick<T>(ranked: T[], isWeak: (t: T) => boolean): T[] {
  const weak = ranked.filter(isWeak);
  return (weak.length >= MIN_MODULES ? weak : ranked.slice(0, MIN_MODULES)).slice(0, MAX_MODULES);
}

/* ───────────────────────────── company assessment ───────────────────────────── */

export function planForCompany(input: {
  company: CompanyProfile;
  learner: { name: string; role: string };
  totalScore: number;
  band: string;
  answers: Answers;
}): GapPlan {
  const dims = COMPANY_DIMENSIONS.map((d) => {
    const questions = COMPANY_QUESTIONS.filter((q) => q.dimensionId === d.id);
    const max = questions.reduce((s, q) => s + Math.max(...q.options.map((o) => o.points ?? 0)), 0);
    const scored = questions.map((q) => {
      const chosen = q.options.find((o) => o.id === input.answers[q.id]);
      const top = Math.max(...q.options.map((o) => o.points ?? 0));
      return { q, chosen, points: chosen?.points ?? 0, top };
    });
    const earned = scored.reduce((s, x) => s + x.points, 0);
    return { d, scored, percent: max ? Math.round((earned / max) * 100) : 0 };
  });

  const ranked = [...dims].sort((a, b) => a.percent - b.percent || b.d.weight - a.d.weight);
  const chosen = pick(ranked, (x) => x.percent < WEAK_BELOW);

  const modules = chosen.map(({ d, scored, percent }): GapModule => {
    // Most points left on the table first; unanswered questions count as zero.
    const focus = [...scored]
      .filter((x) => x.points < x.top)
      .sort((a, b) => b.top - b.points - (a.top - a.points) || a.q.order - b.q.order)
      .slice(0, MAX_FOCUS_PER_MODULE)
      .map(({ q, chosen: opt, points, top }) => ({
        questionId: q.id,
        scenario: q.scenarioContext,
        prompt: q.text,
        current: opt?.text ?? 'No answer given.',
        standing: `${points} of ${top} points`,
        better: q.options
          .filter((o) => (o.points ?? 0) > points)
          .sort((a, b) => (a.points ?? 0) - (b.points ?? 0))
          .map((o) => o.text),
      }));
    return {
      key: d.id,
      title: d.name,
      summary: d.description,
      percent,
      focus,
      lessonCount: lessonCountFor(focus.length),
    };
  });

  return {
    kind: 'COMPANY',
    company: input.company,
    learner: input.learner,
    standing: `PrismScore ${Math.round(input.totalScore)}/500 (${input.band})`,
    concerns: [],
    modules,
  };
}

/* ───────────────────────────── C-level diagnostic ───────────────────────────── */

const LEVEL_WORD: Record<CompetencyLevel, string> = {
  UNAWARE: 'Unaware',
  AWARE: 'Aware',
  PRACTICING: 'Practicing',
  PROFICIENT: 'Proficient',
  LEADING: 'Leading',
};

const levelOf = (q: SeedQuestion, optionId: string | undefined): CompetencyLevel =>
  (q.options.find((o) => o.id === optionId)?.mappedLevel as CompetencyLevel | undefined) ?? 'UNAWARE';

export function planForExecutive(input: {
  company: CompanyProfile;
  learner: { name: string; role: string };
  answers: Answers;
  concerns: string[];
  companyFocus?: string[];
}): GapPlan {
  const role = input.learner.role in DEFAULT_TARGET_LEVELS_BY_ROLE ? input.learner.role : 'OTHER';
  const targets = DEFAULT_TARGET_LEVELS_BY_ROLE[role];

  const knowledge = CLEVEL_QUESTIONS.filter(
    (q) => q.layer === 'KNOWLEDGE' && (!q.roleFilter || q.roleFilter === 'ALL' || q.roleFilter === role),
  );

  const comps = CLEVEL_DIMENSIONS.map((d) => {
    const questions = knowledge.filter((q) => q.dimensionId === d.id);
    const target = targets[d.name] ?? 'PRACTICING';
    // Weakest answer in the competency decides where they stand.
    const levels = questions.map((q) => LEVEL_NUMERICS[levelOf(q, input.answers[q.id])]);
    const current = levels.length ? Math.min(...levels) : LEVEL_NUMERICS.UNAWARE;
    const gap = Math.max(0, LEVEL_NUMERICS[target] - current);
    return { d, questions, target, current, gap, percent: Math.round((current / 5) * 100) };
  }).filter((c) => c.questions.length > 0);

  const ranked = [...comps].sort((a, b) => b.gap - a.gap || a.current - b.current || b.d.weight - a.d.weight);
  const chosen = pick(ranked, (c) => c.gap > 0);

  const modules = chosen.map(({ d, questions, target }): GapModule => {
    const focus = questions
      .map((q) => ({ q, level: levelOf(q, input.answers[q.id]) }))
      .sort((a, b) => LEVEL_NUMERICS[a.level] - LEVEL_NUMERICS[b.level])
      .slice(0, MAX_FOCUS_PER_MODULE)
      .map(({ q, level }) => ({
        questionId: q.id,
        scenario: q.scenarioContext,
        prompt: q.text,
        current: q.options.find((o) => o.id === input.answers[q.id])?.text ?? 'No answer given.',
        standing: `${LEVEL_WORD[level]}, target for a ${role}: ${LEVEL_WORD[target as CompetencyLevel]}`,
        better: q.options
          .filter((o) => o.mappedLevel && LEVEL_NUMERICS[o.mappedLevel as CompetencyLevel] > LEVEL_NUMERICS[level])
          .sort((a, b) => LEVEL_NUMERICS[a.mappedLevel as CompetencyLevel] - LEVEL_NUMERICS[b.mappedLevel as CompetencyLevel])
          .map((o) => o.text),
      }));
    return {
      key: d.id,
      title: d.name,
      summary: d.description,
      percent: comps.find((c) => c.d.id === d.id)!.percent,
      focus,
      lessonCount: lessonCountFor(focus.length),
    };
  });

  return {
    kind: 'EXECUTIVE',
    company: input.company,
    learner: { ...input.learner, role },
    standing: `${role} C-level diagnostic: ${comps.filter((c) => c.gap > 0).length} of ${comps.length} competencies below the ${role} target`,
    concerns: input.concerns,
    companyFocus: input.companyFocus ?? [],
    modules,
  };
}
