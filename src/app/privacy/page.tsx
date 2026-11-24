import type { Metadata } from 'next';
import Link from 'next/link';
import { ASSESSMENT } from '@/lib/product';

export const metadata: Metadata = {
  title: 'Privacy Policy | PrismScore by ScienceWerx',
  description: 'How PrismScore collects, uses and protects assessment data.',
};

// DRAFT: written from how the product behaves today. Must be reviewed by
// counsel, and the contact details filled in, before launch.
export default function PrivacyPage() {
  return (
    <div className="flex-1 bg-paper py-14 sm:py-20 px-4 sm:px-6">
      <article className="max-w-3xl mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/70">Legal</p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-[-0.035em] text-ink">Privacy policy</h1>

        <div role="note" className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Draft pending legal review.</strong> This page describes how PrismScore handles data
          today. It is not yet a final legal policy, and contact details are still to be added.
        </div>

        <div className="mt-10 space-y-9 text-[15px] leading-relaxed text-ink/80">
          <section>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">What we collect</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Company profile: name, industry, headcount band and country.</li>
              <li>The assessment administrator’s name, work email and role.</li>
              <li>Names, work emails and roles of executives you choose to invite.</li>
              <li>Answers to the {ASSESSMENT.questions}-question company assessment and to C-level and staff assessments.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">How we use it</h2>
            <p className="mt-3">
              To calculate your readiness score and band, produce your reports, send the invitations you
              request, and show your team’s results on your dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">Who can see what</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Each executive’s individual answers and gap profile are visible only to that executive and the company admin.</li>
              <li>Team heatmaps and resistance distributions appear only once at least {ASSESSMENT.execsForTeamViews} executives have completed their assessment.</li>
              <li>Staff and manager 360 responses are reported only in aggregate, for groups of {ASSESSMENT.staffGroupMinimum} or more.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">Retention, your rights and contact</h2>
            <p className="mt-3">
              Retention periods, data-processing terms, how to request access or deletion, and how to contact
              us will be set out here once this policy is finalised.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-ink/65">
          See also our <Link href="/terms" className="font-semibold text-brand-700 underline underline-offset-4">terms of use</Link>.
        </p>
      </article>
    </div>
  );
}
