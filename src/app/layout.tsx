import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Newsreader, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { PrismBrandMark } from '@/components/PrismHero';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PrismScore | Enterprise AI Literacy & Leadership Alignment by ScienceWerx',
  description:
    'Prism AI refracts company AI literacy, C-level alignment, and hidden resistance into a transparent 500-point benchmark and tailored learning tracks.',
};

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#scoring-formula', label: 'Scoring Formula' },
  { href: '/#executive-report', label: 'Executive Report' },
  { href: '/dashboard/curriculum', label: 'Resources' },
  { href: '/#faq', label: 'FAQ' },
];

const FOOTER_COLUMNS = [
  {
    title: 'Platform',
    links: [
      { href: '/#how-it-works', label: 'How It Works' },
      { href: '/#scoring-formula', label: 'Scoring Formula' },
      { href: '/#executive-report', label: 'Executive Report' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/dashboard/curriculum', label: 'Articles & Insights' },
      { href: '/dashboard/three-sixty', label: 'Frameworks & Guides' },
      { href: '/dashboard', label: 'Sample Report' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/#how-it-works', label: 'About ScienceWerx' },
      { href: '/#faq', label: 'Privacy Policy' },
      { href: '/#faq', label: 'Terms of Use' },
    ],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.className} ${newsreader.variable} ${plexMono.variable}`}
    >
      <body className={`${plusJakartaSans.className} min-h-screen flex flex-col text-white antialiased selection:bg-prism-600 selection:text-white`}>
        <header className="relative z-50 bg-ink border-b border-white/[0.06] no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-prism-300">
              <PrismBrandMark className="w-9 h-7" />
              <span className="flex flex-col">
                <span className="text-xl font-extrabold tracking-[-0.03em] text-white leading-none">
                  PrismScore
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 mt-1">
                  by ScienceWerx
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-6 lg:gap-8">
              <nav aria-label="Main" className="hidden md:flex items-center gap-6 text-sm font-medium text-white/65">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-4 shrink-0">
                <Link
                  href="/dashboard"
                  className="hidden sm:inline text-sm font-semibold text-white/80 hover:text-white transition-colors"
                >
                  View Demo
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center whitespace-nowrap px-3.5 sm:px-4 py-2.5 rounded-lg text-sm font-semibold text-ink bg-white hover:bg-prism-50 shadow-[0_8px_30px_-8px_rgba(139,116,250,0.6)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prism-300"
                >
                  <span className="sm:hidden">Start Assessment</span>
                  <span className="hidden sm:inline">Start Free Assessment</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="bg-ink text-stone-400 border-t border-white/[0.06] no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-8 items-start">
              <div className="col-span-2 md:col-span-5">
                <div className="flex items-center gap-3">
                  <PrismBrandMark className="w-8 h-7 shrink-0" />
                  <div className="text-white font-extrabold text-lg leading-none tracking-[-0.02em]">
                    PrismScore
                  </div>
                </div>
                <p className="mt-4 max-w-xs text-sm text-stone-400 leading-relaxed">
                  A company assessment that reveals AI readiness, leadership alignment, and adoption risks.
                </p>
              </div>

              {FOOTER_COLUMNS.map((col) => (
                <div key={col.title} className="md:col-span-2">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone-500 mb-4">
                    {col.title}
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-stone-300 hover:text-white transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-stone-500">
              <span>© {new Date().getFullYear()} ScienceWerx</span>
              <span>PrismScore · 500-point readiness benchmark</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
