'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PrismBrandMark } from '@/components/PrismHero';
import { CTA, ROUTES } from '@/lib/product';
import VerifyEmailBanner from '@/components/connect/VerifyEmailBanner';

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#scoring-formula', label: 'Scoring formula' },
  { href: '/#executive-report', label: 'Executive report' },
  { href: '/#faq', label: 'FAQ' },
];

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300';

/** While someone is taking an assessment, the header shows only the logo and a way out. */
export function isFlowRoute(pathname: string | null) {
  return !!pathname && (pathname.startsWith('/onboarding') || pathname.startsWith('/assessment'));
}

function Wordmark() {
  return (
    <Link href="/" className={`flex items-center gap-2.5 shrink-0 rounded-md ${FOCUS}`}>
      <PrismBrandMark className="w-9 h-7" />
      <span className="flex flex-col">
        <span className="text-xl font-extrabold tracking-[-0.03em] text-white leading-none">PrismScore</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/60 mt-1">by ScienceWerx</span>
      </span>
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const flow = isFlowRoute(pathname);

  // On the home page the header floats over the hero photo until you scroll
  const overHero = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overHero]);
  const transparent = overHero && !scrolled;

  // Who is signed in (null while loading or signed out). Re-checked on navigation.
  const [me, setMe] = useState<{ name: string; role: string; emailVerified?: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => !cancelled && setMe(d.user))
      .catch(() => !cancelled && setMe(null));
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const signOut = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST' }).catch(() => {});
    setMe(null);
    window.location.assign('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 no-print ${
        transparent
          ? 'bg-transparent border-transparent'
          : 'bg-ink/85 backdrop-blur-xl supports-[backdrop-filter]:bg-ink/75 border-white/[0.08]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Wordmark />

        {flow ? (
          <Link
            href="/"
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors ${FOCUS}`}
          >
            Exit
          </Link>
        ) : (
          <div className="flex items-center gap-6 lg:gap-8">
            <nav aria-label="Main" className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/75">
              {NAV_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className={`rounded hover:text-white transition-colors ${FOCUS}`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 shrink-0">
              {me ? (
                <>
                  {me.role === 'ADMIN' && (
                    <Link
                      href="/dashboard"
                      className={`hidden sm:inline rounded text-sm font-semibold text-white/85 hover:text-white transition-colors ${FOCUS}`}
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/learn"
                    className={`hidden sm:inline rounded text-sm font-semibold text-white/85 hover:text-white transition-colors ${FOCUS}`}
                  >
                    Learning
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className={`rounded text-sm font-semibold text-white/85 hover:text-white transition-colors ${FOCUS}`}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className={`rounded text-sm font-semibold text-white/85 hover:text-white transition-colors ${FOCUS}`}
                >
                  Sign in
                </Link>
              )}
              <Link
                href={ROUTES.sampleReport}
                className={`hidden sm:inline rounded text-sm font-semibold text-white/85 hover:text-white transition-colors ${FOCUS}`}
              >
                Sample report
              </Link>
              <Link
                href={ROUTES.start}
                className={`inline-flex items-center justify-center whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 shadow-[0_10px_30px_-10px_rgba(91,61,245,0.8)] transition-[filter] hover:brightness-110 ${FOCUS}`}
              >
                {CTA.start}
              </Link>
            </div>
          </div>
        )}
      </div>
      {me && me.emailVerified === false && !flow && <VerifyEmailBanner />}
    </header>
  );
}
