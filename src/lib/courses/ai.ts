import 'server-only';
import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { normalizeFlowchart } from './mermaid-source';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import type { GapFocus, GapModule, GapPlan } from './plan';

/**
 * The model calls behind a gap-closing course: one outline, one call per lesson,
 * one quiz per module. All use structured output, and the code, not the model,
 * decides how many modules and lessons there are (plan.ts); the outline is
 * clamped to that shape afterwards.
 *
 * Prompts and writing rules are ported from iStartup's gap-course generator
 * (itself from ScienceWerx's course generator), reframed for an SME leader and
 * their company's AI readiness.
 *
 * Calls go straight to the Gemini API with the ScienceWerx Google AI Studio key
 * (the same key MoreWerx uses), read from GOOGLE_GENERATIVE_AI_API_KEY.
 */
export const MODEL = process.env.AI_MODEL || 'gemini-3.5-flash';

/** Prose is read at roughly this rate, which is how a lesson's length is derived. */
export const WORDS_PER_MINUTE = 160;
const MIN_LESSON_MIN = 6;
const MAX_LESSON_MIN = 14;
export const targetWordsFor = (durationMin: number) => Math.max(600, Math.round(durationMin * WORDS_PER_MINUTE));

/** How many questions a module quiz has. */
export const QUIZ_QUESTIONS = 6;

async function generate<S extends z.ZodType>(
  kind: 'outline' | 'lesson' | 'quiz',
  schema: S,
  temperature: number,
  prompt: string,
  courseId: string,
): Promise<z.infer<S>> {
  let usage: { inputTokens?: number; outputTokens?: number } | undefined;
  let ok = false;
  try {
    const res = await generateText({ model: google(MODEL), temperature, prompt, output: Output.object({ schema }) });
    usage = res.usage;
    if (!res.output) throw new Error(`The model returned no ${kind}.`);
    ok = true;
    return res.output as z.infer<S>;
  } finally {
    // Cost tracking must never fail the generation itself.
    await prisma.aiUsage
      .create({
        data: {
          courseId,
          kind,
          model: MODEL,
          inputTokens: usage?.inputTokens ?? 0,
          outputTokens: usage?.outputTokens ?? 0,
          ok,
        },
      })
      .catch(() => {});
  }
}

/** Strips the markdown the prompt forbids but models still sometimes produce. */
export function toPlainParagraphs(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) =>
      p
        .split('\n')
        .map((line) => line.replace(/^\s*(#{1,6}\s+|[-*•]\s+)/, '').replace(/\*\*|__|`/g, '').trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
    .join('\n\n');
}

/* ───────────────────────────────── context ───────────────────────────────── */

const audience = (plan: GapPlan) =>
  plan.kind === 'COMPANY' ? 'the leader responsible for AI at a small or medium-sized company' : `a ${plan.learner.role} at a small or medium-sized company`;

const describeLearner = (plan: GapPlan) =>
  [
    `Company: ${plan.company.name}`,
    `Industry: ${plan.company.industry}`,
    `Size: ${plan.company.sizeBand}`,
    `Country: ${plan.company.country}`,
    `Learner: ${plan.learner.name}, ${plan.learner.role}`,
    `Where they stand: ${plan.standing}`,
    plan.concerns.length ? `Concerns they raised about AI: ${plan.concerns.join('; ')}` : null,
    plan.companyFocus?.length
      ? `The company's weakest areas (from its company assessment): ${plan.companyFocus.join('; ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

const describeFocus = (f: GapFocus) =>
  [
    `  - [${f.questionId}] ${f.scenario ? `Situation: "${f.scenario}" ` : ''}Question: "${f.prompt}"`,
    `    They answered (${f.standing}): "${f.current}"`,
    f.better.length ? `    What better looks like: ${f.better.map((b) => `"${b}"`).join(' → ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

const describeModule = (m: GapModule) =>
  [
    `Module key: ${m.key} — ${m.title} (they are at ${m.percent}%). Exactly ${m.lessonCount} lessons.`,
    `Area: ${m.summary}`,
    'Gaps to close:',
    ...m.focus.map(describeFocus),
  ].join('\n');

/* ───────────────────────────────── outline ───────────────────────────────── */

const OutlineSchema = z.object({
  title: z.string().describe('Course title naming the company and the outcome, max 80 chars'),
  subtitle: z.string().describe('One sentence, max 140 chars'),
  description: z.string().describe('2–3 sentences: what the learner will be able to do afterwards'),
  modules: z.array(
    z.object({
      key: z.string().describe('The module key exactly as given'),
      title: z.string().describe('Module title phrased as the outcome, max 60 chars'),
      lessons: z.array(
        z.object({
          title: z.string().describe('A claim or a task, max 70 chars, never a bare topic'),
          brief: z
            .string()
            .describe(
              'Two to four sentences stating exactly what this lesson teaches, in what order, and the one thing ' +
                'leaders commonly get wrong about it. This is the ONLY instruction the writer of the lesson receives.',
            ),
          focusQuestionIds: z.array(z.string()).describe("Which of the module's gap ids this lesson closes"),
          durationMin: z.number().int().describe(`Minutes the learner spends on it, ${MIN_LESSON_MIN} to ${MAX_LESSON_MIN}`),
        }),
      ),
    }),
  ),
});

export type CourseOutline = z.infer<typeof OutlineSchema>;

export async function generateOutline(plan: GapPlan, courseId: string): Promise<CourseOutline> {
  const output = await generate('outline', OutlineSchema, 0.6, `You are designing the structure of a practical, personalised course for ${audience(plan)}. They just took the PrismScore AI-readiness assessment; this course closes the specific gaps it found. They will work through it lesson by lesson and be assessed against it, so it has to hold up as a plan rather than read well as a pitch.

THE LEARNER
${describeLearner(plan)}

THE MODULES — produce exactly these ${plan.modules.length} modules, in this order, with exactly the lesson count stated for each:
${plan.modules.map(describeModule).join('\n\n')}

HOW TO BUILD THE OUTLINE
- Order by dependency, not by importance. A lesson may only assume what earlier lessons have taught; the course reads as one path, module after module.
- Every lesson brief must name one thing leaders get wrong. "Explains AI governance" is not a brief. "Shows that an acceptable-use policy only works when it names the approved tools and the data that must never be pasted into them; leaders usually publish principles and assume staff will infer the rest, and this corrects that" is a brief. The writer of the lesson sees nothing else, so anything you leave vague will be written vaguely.
- Titles are claims or tasks: "Fund pilots against a payback date, not a hunch", "Write your one-page AI acceptable-use policy" — never "Introduction", "Overview" or a bare topic.
- Every lesson closes at least one listed gap id, and every gap id is covered by some lesson in its module. Start from where the learner is (their answer) and move them to the levels above it.
- The LAST lesson of every module is a hands-on workshop: the learner produces something real for their company (a policy, a pilot plan, a vendor checklist, a training plan). Its title is the task.
- Lessons are about THIS company's situation (industry, size, country, the learner's role), not generic AI advice.
- When the company's weakest areas are listed, this leader's course is part of fixing them: wherever it fits, tie a lesson's point or workshop to how someone in THIS role moves one of those company areas forward. Never invent company facts beyond what is listed.
- durationMin is how long the learner spends, between ${MIN_LESSON_MIN} and ${MAX_LESSON_MIN} minutes. Reading runs about ${WORDS_PER_MINUTE} words a minute; a workshop includes the time to do the task.

HARD RULES
- Plain text everywhere. No markdown, no asterisks, no headings inside any field.
- Invent no statistics, studies, dates or quotations. If a claim would need a citation, teach the idea without the number.
- Do not produce quiz, test or recap lessons; those are handled separately.`, courseId);
  return clampOutline(output, plan);
}

/** Forces the outline into the plan's shape: plan order, plan lesson counts, known gap ids. */
export function clampOutline(outline: CourseOutline, plan: GapPlan): CourseOutline {
  const byKey = new Map(outline.modules.map((m) => [m.key, m]));
  const modules = plan.modules.map((pm, i) => {
    const m = byKey.get(pm.key) ?? outline.modules[i];
    if (!m || m.lessons.length < 1) throw new Error(`Outline is missing module ${pm.key}.`);
    const ids = new Set(pm.focus.map((f) => f.questionId));
    const lessons = m.lessons.slice(0, pm.lessonCount).map((l, j) => {
      const focus = l.focusQuestionIds.filter((id) => ids.has(id));
      return {
        ...l,
        focusQuestionIds: focus.length || pm.focus.length === 0 ? focus : [pm.focus[j % pm.focus.length].questionId],
        durationMin: Math.min(MAX_LESSON_MIN, Math.max(MIN_LESSON_MIN, Math.round(l.durationMin || MIN_LESSON_MIN))),
      };
    });
    return { key: pm.key, title: m.title || pm.title, lessons };
  });
  return { ...outline, modules };
}

/* ───────────────────────────────── lessons ───────────────────────────────── */

const LessonSchema = z.object({
  body: z
    .string()
    .describe('The lesson, plain-text paragraphs separated by a blank line. No markdown, no headings, no bullet lists.'),
  keyPoints: z.array(z.string()).describe('3 to 5 things the learner should still remember a week later'),
  mermaid: z
    .string()
    .optional()
    .describe('Mermaid `graph LR` or `graph TD` source for a small diagram, ONLY when the lesson describes a process, a flow or a structure. Omit otherwise.'),
  callout: z.object({
    kind: z.enum(['warning', 'note']),
    text: z.string().describe('One short aside, usually the mistake this lesson exists to prevent'),
  }),
  exercise: z
    .string()
    .describe('A concrete task the learner does for their own company this week, with a clear deliverable. 2–4 sentences.'),
  checkpoint: z.object({
    stem: z.string().describe('A scenario question about a company like theirs that tests whether the IDEA landed, not recall'),
    options: z.array(z.object({ id: z.string(), label: z.string() })).describe('Exactly four options, ids "a" to "d"'),
    correctOptionId: z.string(),
    explanation: z
      .string()
      .describe('Addressed to the learner as "you": why the right answer is right and the most tempting wrong one is wrong'),
  }),
});

export interface LessonContent {
  body: string;
  keyPoints: string[];
  /** A small flowchart, only when the lesson describes a process or structure. */
  mermaid?: string;
  callout: { kind: 'warning' | 'note'; text: string };
  exercise: string;
  checkpoint: { stem: string; options: { id: string; label: string }[]; correctOptionId: string; explanation: string };
}

export async function generateLesson(
  input: {
    plan: GapPlan;
    module: GapModule;
    moduleTitle: string;
    lesson: { title: string; brief: string; focusQuestionIds: string[]; durationMin: number };
    previousTitles: string[];
    nextTitle?: string;
    isWorkshop: boolean;
  },
  courseId: string,
): Promise<LessonContent> {
  const focus = input.module.focus.filter((f) => input.lesson.focusQuestionIds.includes(f.questionId));
  const targetWords = targetWordsFor(input.lesson.durationMin);

  const output = await generate('lesson', LessonSchema, 0.7, `You are writing one lesson of a personalised course for ${audience(input.plan)}, built from their PrismScore AI-readiness assessment.

THE LEARNER
${describeLearner(input.plan)}

MODULE: ${input.moduleTitle} (they are at ${input.module.percent}% on ${input.module.title})
THIS LESSON: ${input.lesson.title}

WHAT IT MUST TEACH
${input.lesson.brief}

THE GAPS THIS LESSON CLOSES
${(focus.length ? focus : input.module.focus).map(describeFocus).join('\n')}

${
  input.previousTitles.length
    ? `ALREADY TAUGHT, in order — assume all of it, and do not explain any of it again:\n${input.previousTitles.map((t) => `- ${t}`).join('\n')}`
    : 'This is the first lesson of the course. Assume nothing beyond what a business leader in this role already knows.'
}
${
  input.nextTitle
    ? `COMING NEXT: ${input.nextTitle}. Do not cover it; you may point at it in a closing sentence.`
    : 'This is the last lesson of the course; end with momentum and the next step for their company.'
}

Write about ${targetWords} words of body.
${
  input.isWorkshop
    ? `
This is a WORKSHOP, the module's hands-on lesson. The learner is going to produce something for their company, not read about it. Set up the task in steps, give them whatever they need to work from (a structure, the questions to answer, a worked example from a different company), and say plainly what a good result looks like and the most common way it goes wrong. Do not do the task for them.
`
    : ''
}
HOW TO WRITE IT
- Open with the thing itself. No throat-clearing, no "in this lesson we will". The first sentence should already be teaching.
- One idea per paragraph, three to five sentences. Separate paragraphs with a blank line (two newline characters); never run the lesson together as one block.
- Be concrete. A worked example beats a definition: show it with THIS company's industry, size and the learner's role. If you find yourself writing "it is important to", you have skipped the part that would have shown why.
- Start from where they are (what they answered) and show the concrete steps to the next level up.
- Correct the misconception the brief names, explicitly: say what leaders usually assume, then what is actually the case.
- Say what is NOT true, or what does not apply. A lesson that only lists benefits teaches someone to misuse the thing.
${input.plan.concerns.length ? '- Take their stated concerns seriously; address them where relevant instead of dismissing them.\n' : ''}- Plain text only. No markdown, no headings, no bullet characters, no bold. Blank lines are the only structure you have.
- Invent no statistics, studies, dates, quotations or named sources. Teach the idea without the number.

THE DIAGRAM: include \`mermaid\` ONLY if this lesson genuinely describes a process, a flow or a structure (an approval chain, a data flow, a rollout sequence, who decides what). Use \`graph LR\` or \`graph TD\`, at most 8 nodes, short plain labels, one statement per line. A diagram of two boxes restating the title is worse than none; if in doubt, leave it out.

THE EXERCISE: a concrete task the learner does for their own company this week, with a clear deliverable.

THE CHECKPOINT: one question about a situation like theirs, four options with ids "a", "b", "c", "d", exactly one right. It must test whether they understood the IDEA — a question answerable by recognising a phrase from the text tests nothing. Wrong options are things a leader who half-followed would actually pick, not obvious throwaways.`, courseId);

  const options = output.checkpoint.options.slice(0, 4);
  return {
    body: toPlainParagraphs(output.body),
    keyPoints: output.keyPoints.slice(0, 5).map((k) => toPlainParagraphs(k)),
    ...safeDiagram(output.mermaid),
    callout: { kind: output.callout.kind, text: toPlainParagraphs(output.callout.text) },
    exercise: toPlainParagraphs(output.exercise),
    checkpoint: {
      stem: output.checkpoint.stem,
      options,
      correctOptionId: options.some((o) => o.id === output.checkpoint.correctOptionId)
        ? output.checkpoint.correctOptionId
        : options[0]?.id ?? 'a',
      explanation: output.checkpoint.explanation,
    },
  };
}

/* ───────────────────────────────── quizzes ───────────────────────────────── */

const QuizQuestionSchema = z.object({
  type: z.enum(['mcq_single', 'mcq_multi', 'true_false']),
  stem: z.string().describe('The question. Plain text, no markdown.'),
  options: z
    .array(z.object({ id: z.string(), label: z.string() }))
    .describe('For true_false, exactly two options with ids "true" and "false".'),
  correctOptionIds: z.array(z.string()).describe('One id for mcq_single and true_false; two or more for mcq_multi.'),
  points: z.number().int().describe('1 to 5'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  explanation: z.string().describe('Why the right answer is right, addressed to the learner as "you". Always required.'),
});

export type QuizQuestionDraft = z.infer<typeof QuizQuestionSchema>;

/** Keeps only questions with an unambiguous, gradeable key. */
export function gradeableQuestions(questions: QuizQuestionDraft[]): QuizQuestionDraft[] {
  return questions
    .filter((q) => {
      if (!q.stem.trim() || !q.explanation.trim() || q.correctOptionIds.length === 0) return false;
      if (q.type === 'true_false') {
        return q.correctOptionIds.length === 1 && ['true', 'false'].includes(q.correctOptionIds[0]);
      }
      const ids = new Set(q.options.map((o) => o.id));
      if (q.options.length < 2 || ids.size !== q.options.length || !q.correctOptionIds.every((id) => ids.has(id))) {
        return false;
      }
      return q.type === 'mcq_single' ? q.correctOptionIds.length === 1 : q.correctOptionIds.length >= 2;
    })
    .map((q) => ({
      ...q,
      options:
        q.type === 'true_false'
          ? [
              { id: 'true', label: 'True' },
              { id: 'false', label: 'False' },
            ]
          : q.options,
      points: Math.min(5, Math.max(1, Math.round(q.points || 1))),
    }));
}

export async function generateModuleQuiz(
  input: { plan: GapPlan; moduleTitle: string; lessons: Array<{ title: string; brief: string; keyPoints: string[] }> },
  courseId: string,
): Promise<QuizQuestionDraft[]> {
  const output = await generate('quiz', z.object({ questions: z.array(QuizQuestionSchema) }), 0.5, `You are writing ${QUIZ_QUESTIONS} questions for the graded quiz that closes the module "${input.moduleTitle}" of a personalised course for ${audience(input.plan)}.

THE LEARNER
${describeLearner(input.plan)}

This is a GRADED QUIZ. It exists to measure whether the learner understood the material well enough to act on it. They need 70% to pass, have three attempts, and see feedback only after they pass or use their last attempt.

It may only draw on these lessons:
${input.lessons.map((l) => `- ${l.title}: ${l.brief}\n${l.keyPoints.map((k) => `  · ${k}`).join('\n')}`).join('\n')}

HOW TO WRITE THE QUESTIONS
- Test understanding, not recall of wording. If a question can be answered by spotting a phrase that also appears in the lesson, it tests reading, not learning. Ask what follows from the idea, or what the learner should do in a situation the lesson did not state outright — ideally one like their own company's.
- Wrong options must be tempting: what a leader who half-understood would genuinely pick — a common misconception, a plausible overgeneralisation, the right idea applied to the wrong situation. An obviously silly option just narrows the guess.
- One unambiguous right answer. If a careful person could argue for two, rewrite the question. Check each one before moving on.
- Vary the difficulty across the set, and vary the type; do not make them all mcq_single.
- Keep stems short. A paragraph of setup followed by "which of the following" is a reading test with a question attached.
- Never ask about the course itself (its structure, its modules, what a lesson covered). Ask about the subject.
- Plain text. No markdown anywhere. Invent no statistics or named sources.

FORMATS
- mcq_single: four options, exactly one id in correctOptionIds.
- mcq_multi: four or five options, two or three correct. Use it when the point genuinely has several parts.
- true_false: exactly two options, ids "true" and "false", one correct id. Use it for a claim worth confronting directly.

The explanation is required on every question, written to the learner as "you": why the answer is right and, where a wrong option was tempting, why that one is not. Do not restate the question.`, courseId);

  const questions = gradeableQuestions(output?.questions ?? []);
  if (questions.length < 3) throw new Error('The model returned too few gradeable questions.');
  return questions.slice(0, QUIZ_QUESTIONS);
}

/**
 * Keeps a model-written diagram only when it is a small, plain flowchart.
 * Directives, styling, click handlers and other diagram types are dropped; the
 * browser also renders it with Mermaid's strict security level.
 */
export function safeDiagram(source: string | undefined): { mermaid?: string } {
  if (!source) return {};
  const diagram = normalizeFlowchart(source).trim();
  if (!/^(graph|flowchart)\s+(LR|RL|TD|TB|BT)\b/i.test(diagram)) return {};
  if (diagram.length > 1500 || diagram.split('\n').length > 24) return {};
  if (/%%\{|<script|javascript:|href/i.test(diagram)) return {};
  if (/^\s*(click|style|classDef|class|linkStyle)\b/im.test(diagram)) return {};
  return { mermaid: diagram };
}
