import type { Metadata } from 'next';
import Link from 'next/link';
import { ASSESSMENT } from '@/lib/product';

export const metadata: Metadata = {
  title: 'Terms of Use | PrismScore by ScienceWerx',
  description: 'The terms that apply when you use PrismScore.',
};

// DRAFT: product facts only. Must be replaced or reviewed by counsel before launch.
export default function TermsPage() {
  return (
    <div className="flex-1 bg-paper py-14 sm:py-20 px-4 sm:px-6">
      <article className="max-w-3xl mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/70">Legal</p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-[-0.035em] text-ink">Terms of use</h1>

        <div role="note" className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Draft pending legal review.</strong> These are not yet final terms.
        </div>

        <div className="mt-10 space-y-9 text-[15px] leading-relaxed text-ink/80">
          <section>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">The service</h2>
            <p className="mt-3">
              PrismScore is an AI readiness assessment by ScienceWerx. The free company assessment gives a
              score out of {ASSESSMENT.maxScore} and a readiness band. The Full Executive Report is a one-time
              purchase of ${ASSESSMENT.fullReportPrice} per company.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">What the score is, and isn’t</h2>
            <p className="mt-3">
              Scores are based on your own answers. PrismScore is a diagnostic to guide upskilling and
              investment priorities. It is not an audit, a certification or a compliance attestation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">Payments, liability and governing law</h2>
            <p className="mt-3">
              Payment, refund, liability and governing-law terms will be set out here once these terms are
              finalised.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-ink/65">
          See also our <Link href="/privacy" className="font-semibold text-brand-700 underline underline-offset-4">privacy policy</Link>.
        </p>
      </article>
    </div>
  );
}
