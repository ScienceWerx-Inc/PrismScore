import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Sparkles, BarChart3, Users, BookOpen, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Literacy Assessment Platform | ScienceWerx',
  description: 'Measure corporate AI literacy, align C-level leadership, uncover resistance, and generate tailored training paths.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight tracking-tight flex items-center gap-1.5">
                  AI Literacy Score
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    ScienceWerx
                  </span>
                </span>
                <span className="text-xs text-slate-400 font-normal">Executive & Enterprise Diagnostic</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4 text-brand-600" />
                Executive Dashboard
              </Link>
              <Link
                href="/dashboard/three-sixty"
                className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Users className="w-4 h-4 text-purple-600" />
                360 Staff View
              </Link>
              <Link
                href="/dashboard/curriculum"
                className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Tailored Courses
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-600/30 transition-all hover:shadow"
              >
                Start Assessment
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="bg-slate-900 text-slate-400 text-sm py-12 border-t border-slate-800 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <Sparkles className="w-4 h-4 text-brand-400" />
                ScienceWerx AI Literacy
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empowering small & medium enterprises with rigorous AI literacy benchmarking, leadership alignment heatmaps, and structured upskilling gap profiles.
              </p>
              <div className="text-xs text-slate-500">
                Modeled after the transparent scoring standards of iStartup Score.
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Diagnostic Tools</div>
              <ul className="space-y-2 text-xs">
                <li><Link href="/onboarding" className="hover:text-white transition-colors">Company Assessment (25 Qs)</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">C-Level Alignment Heatmap</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Executive Resistance Radar</Link></li>
                <li><Link href="/dashboard/three-sixty" className="hover:text-white transition-colors">360 Staff Diagnostic</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Transparency & Ethics</div>
              <ul className="space-y-2 text-xs">
                <li><span className="text-slate-300">Published Scoring Formula:</span> 500-pt Weighted</li>
                <li><span className="text-slate-300">Privacy Safeguards:</span> Individual C-level confidential</li>
                <li><span className="text-slate-300">360 Anonymity Threshold:</span> Minimum 5 respondents</li>
                <li><span className="text-slate-300">Self-Reported Limit:</span> Non-verifying audit</li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">ScienceWerx Ecosystem</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Seamlessly connects diagnostic gap profiles with customized AI curriculum generation and enterprise solution integration.
              </p>
              <div className="text-[11px] text-slate-500">
                © {new Date().getFullYear()} ScienceWerx. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

