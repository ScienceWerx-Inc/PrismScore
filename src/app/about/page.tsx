import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ASSESSMENT, CTA, ROUTES } from '@/lib/product';

export const metadata: Metadata = {
  title: 'About | PrismScore by ScienceWerx',
  description: 'PrismScore is an AI readiness assessment built by ScienceWerx.',
};

export default function AboutPage() {
  return (
    <div className="flex-1 bg-paper py-14 sm:py-20 px-4 sm:px-6">
      <article className="max-w-3xl mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/70">About</p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-[-0.035em] text-ink">
          PrismScore, by ScienceWerx
        </h1>

        <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-ink/80">
          <p>
            PrismScore is a company assessment that reveals AI readiness, leadership alignment, and
            adoption risks. A {ASSESSMENT.questions}-question assessment, written in plain language, scores
            your organization out of {ASSESSMENT.maxScore} across {ASSESSMENT.dimensions} weighted dimensions.
          </p>
          <p>
            Executives then take a confidential assessment of their own, so you can see where leadership
            agrees, where it doesn’t, and where adoption is quietly resisted. The scoring formula is
            published, so nothing about how you are scored is hidden.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3.5">
          <Link
            href={ROUTES.start}
            className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3.5 text-[15px] font-semibold text-white hover:brightness-110"
          >
            {CTA.start}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/#scoring-formula"
            className="inline-flex items-center justify-center rounded-xl border border-ink/20 px-6 py-3.5 text-[15px] font-semibold text-ink hover:border-ink/40 hover:bg-white"
          >
            How scoring works
          </Link>
        </div>
      </article>
    </div>
  );
}
