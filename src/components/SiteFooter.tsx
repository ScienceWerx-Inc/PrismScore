'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PrismBrandMark } from '@/components/PrismHero';
import { isFlowRoute } from '@/components/SiteHeader';
import { ASSESSMENT, ROUTES } from '@/lib/product';

const FOOTER_COLUMNS = [
  {
    title: 'Platform',
    links: [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#scoring-formula', label: 'Scoring formula' },
      { href: ROUTES.start, label: 'Get your free score' },
    ],
  },
  {
    title: 'See it',
    links: [
      { href: ROUTES.sampleReport, label: 'Sample report' },
      { href: ROUTES.demoDashboard, label: 'Demo dashboard' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About ScienceWerx' },
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of use' },
    ],
  },
];

/** Hidden while someone is taking an assessment, so they aren't pulled away mid-flow. */
export default function SiteFooter() {
  const pathname = usePathname();
  if (isFlowRoute(pathname)) return null;

  return (
    <footer className="bg-ink text-white/65 border-t border-white/[0.06] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 items-start">
          <div className="col-span-2 md:col-span-5">
            <div className="flex items-center gap-3">
              <PrismBrandMark className="w-8 h-7 shrink-0" />
              <div className="text-white font-extrabold text-lg leading-none tracking-[-0.02em]">PrismScore</div>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/65 leading-relaxed">
              A company assessment that reveals AI readiness, leadership alignment, and adoption risks.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60 mb-4">{col.title}</div>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="rounded text-white/75 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">
          <span>© {new Date().getFullYear()} ScienceWerx</span>
          <span>PrismScore · {ASSESSMENT.maxScore}-point readiness benchmark</span>
        </div>
      </div>
    </footer>
  );
}
