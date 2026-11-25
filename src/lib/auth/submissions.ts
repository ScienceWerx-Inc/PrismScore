import 'server-only';
import { prisma } from '@/lib/db';
import { AuthError } from './server';

/**
 * Loads a submission only if it belongs to `companyId` (and has the given type).
 * Unknown and foreign ids both answer 404, so ids cannot be probed.
 */
export async function ownedSubmission(submissionId: unknown, companyId: string, assessmentTypeId?: string) {
  if (typeof submissionId !== 'string' || !submissionId) throw new AuthError(404, 'Assessment not found.');
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (
    !submission ||
    submission.companyId !== companyId ||
    (assessmentTypeId && submission.assessmentTypeId !== assessmentTypeId)
  ) {
    throw new AuthError(404, 'Assessment not found.');
  }
  return submission;
}
