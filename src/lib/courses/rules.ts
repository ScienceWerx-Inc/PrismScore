/**
 * Course rules, matching iStartup's LMS: 70% to pass a module quiz, best of
 * three attempts, and certificates valid for six months from issue. Pure so the
 * grading can be unit-tested.
 */
export const QUIZ_POLICY = { maxAttempts: 3, passPercent: 70 } as const;
export const CERTIFICATE_VALID_MONTHS = 6;

export interface QuizKeyItem {
  id: string;
  points: number;
  correctOptionIds: string[];
}

/** A question scores only when the chosen set equals the key exactly. */
export function gradeAttempt(key: QuizKeyItem[], answers: Record<string, string[]>) {
  let score = 0;
  let maxScore = 0;
  const correctIds: string[] = [];
  for (const q of key) {
    maxScore += q.points;
    const chosen = new Set(Array.isArray(answers?.[q.id]) ? answers[q.id] : []);
    const right = new Set(q.correctOptionIds);
    const exact = chosen.size === right.size && q.correctOptionIds.every((id) => chosen.has(id));
    if (exact) {
      score += q.points;
      correctIds.push(q.id);
    }
  }
  const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
  return { score, maxScore, percent, passed: percent >= QUIZ_POLICY.passPercent, correctIds };
}

export function certificateExpiry(issuedAt: Date): Date {
  const d = new Date(issuedAt);
  d.setUTCMonth(d.getUTCMonth() + CERTIFICATE_VALID_MONTHS);
  return d;
}

/** iStartup's letter scale over the average best quiz percent. */
export function letterGrade(percent: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}

/**
 * The course grade: the average of the best attempt on each quiz taken so far.
 * Null until at least one quiz has been attempted.
 */
export function courseGrade(bestByQuiz: number[]): { percent: number; letter: ReturnType<typeof letterGrade> } | null {
  if (bestByQuiz.length === 0) return null;
  const percent = Math.round(bestByQuiz.reduce((s, p) => s + p, 0) / bestByQuiz.length);
  return { percent, letter: letterGrade(percent) };
}
