/**
 * Product facts and shared copy. Pages read these instead of restating them,
 * so the landing page, onboarding and app never disagree.
 * Dimension names and weights live in ./scoring (DIMENSIONS).
 */

export const ASSESSMENT = {
  questions: 25,
  questionsPerDimension: 5,
  dimensions: 5,
  minutes: '8–10',
  maxScore: 500,
  execsForTeamViews: 3,
  staffGroupMinimum: 5,
  fullReportPrice: 149,
} as const;

/** The seeded demo company. Anonymous visitors only ever see this one. */
export const DEMO_COMPANY_ID = 'demo-company-vanguard';
export const DEMO_SUBMISSION_ID = 'demo-sub-company-1';

export const ROUTES = {
  start: '/onboarding',
  sampleReport: `/report/company/${DEMO_SUBMISSION_ID}`,
  demoDashboard: `/dashboard?companyId=${DEMO_COMPANY_ID}`,
} as const;

/** The two calls to action used everywhere. */
export const CTA = {
  start: 'Get your free score',
  sample: 'See a sample report',
} as const;
