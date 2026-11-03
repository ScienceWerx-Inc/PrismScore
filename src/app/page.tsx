'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu,
  Lock,
  ChevronDown,
  Award,
  Sparkles,
  Layers,
  Users2,
  FileText,
  Compass,
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Modeled on iStartup Score — Transparent & Published Formula
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Measure how well your company <span className="bg-gradient-to-r from-blue-400 via-brand-400 to-indigo-300 bg-clip-text text-transparent">understands and uses AI</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Find the real knowledge gaps, leadership misalignment, and hidden adoption resistance across your C-level team. 
            Get an instant free score out of 500 in 10 minutes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              Start Free Company Assessment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              View Live Demo Workspace
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>25 Situation Questions (~10 min)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant Score & Readiness Band</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Confidential C-Level Alignment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero-Jargon Real Scenarios</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-STEP HOW IT WORKS */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">How It Works</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From Self-Serve Benchmark to Tailored Executive Action
            </p>
            <p className="mt-4 text-base text-slate-600">
              A transparent, phased diagnostic designed specifically for small and medium leadership teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative flex flex-col hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-base mb-5 shadow-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Company Assessment</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                The initiator or operations lead answers 25 realistic scenario questions across 5 core dimensions.
              </p>
              <div className="mt-auto text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 inline-block self-start">
                10 mins • Self-serve
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative flex flex-col hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base mb-5 shadow-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Free Score & Band</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Immediately receive your company score out of 500 and readiness band with dimensional highlights.
              </p>
              <div className="mt-auto text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 inline-block self-start">
                Instant • 100% Free
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative flex flex-col hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-base mb-5 shadow-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">C-Level Onboarding</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Invite C-suite leaders to complete a confidential 3-layer diagnostic: Knowledge, Awareness, and Resistance.
              </p>
              <div className="mt-auto text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 inline-block self-start">
                Heatmaps at ≥3 Execs
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 relative flex flex-col hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-base mb-5 shadow-sm">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tailored Action & 360</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Feed gap profiles into custom executive learning paths, targeted concern interventions, and launch staff 360s.
              </p>
              <div className="mt-auto text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block self-start">
                Phase 4 Course Engine
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PUBLISHED SCORING FORMULA & READINESS BANDS */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <Award className="w-3.5 h-3.5" />
              100% Transparent Methodology
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The Published Scoring Formula
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Unlike black-box consultants, our scoring rules and dimension weightings are publicly documented.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Formula Breakdown */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-600" />
                Score Calculation Formula
              </h3>
              
              <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-sm leading-relaxed mb-6 overflow-x-auto shadow-inner border border-slate-800">
                <div className="text-slate-400 text-xs mb-1">// 5 Dimensions evaluated on a 0 to 100 percentage scale:</div>
                <div className="text-brand-300 font-bold">
                  Score = 5 × (Strategy × 0.25 + Use × 0.20 + Data × 0.20 + Governance × 0.20 + People × 0.15)
                </div>
                <div className="text-slate-400 text-xs mt-1">// Maximum achievable score: 500</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                  <div>
                    <span className="font-bold text-slate-900">Strategy and Leadership</span>
                    <p className="text-xs text-slate-500 mt-0.5">Direction, executive ownership, budget intent, leadership alignment</p>
                  </div>
                  <span className="font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-200">
                    25% Weight
                  </span>
                </div>

                <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                  <div>
                    <span className="font-bold text-slate-900">Use and Value</span>
                    <p className="text-xs text-slate-500 mt-0.5">Current workflow deployment, ROI tracked, pilots vs live production</p>
                  </div>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                    20% Weight
                  </span>
                </div>

                <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                  <div>
                    <span className="font-bold text-slate-900">Data and Technology</span>
                    <p className="text-xs text-slate-500 mt-0.5">Data organization, tooling infrastructure, APIs, shadow AI governance</p>
                  </div>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                    20% Weight
                  </span>
                </div>

                <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                  <div>
                    <span className="font-bold text-slate-900">Governance and Risk</span>
                    <p className="text-xs text-slate-500 mt-0.5">Policies, data handling rules, vendor vetting, IP & legal exposure</p>
                  </div>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                    20% Weight
                  </span>
                </div>

                <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                  <div>
                    <span className="font-bold text-slate-900">People and Skills</span>
                    <p className="text-xs text-slate-500 mt-0.5">Training programs, prompt skills, adoption habits, culture</p>
                  </div>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                    15% Weight
                  </span>
                </div>
              </div>
            </div>

            {/* Readiness Bands */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Readiness Bands
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Your total score maps directly to one of four transparent readiness bands:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                  <div className="flex items-center justify-between font-bold text-rose-900">
                    <span>Unaware</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-200/60 text-rose-800">0 – 200 pts</span>
                  </div>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    AI is not on the executive agenda. Unmonitored shadow AI is common, and lack of policies creates significant liability risk.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>Exploring</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-200/60 text-amber-800">201 – 300 pts</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Individual pilots and curiosity exist, but lack structured ROI measurement, company-wide alignment, and formal governance.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>Established</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-200/60 text-blue-800">301 – 400 pts</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Clear executive ownership, approved enterprise tools, documented policies, and recurring workflow productivity gains.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span>AI-Led</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800">401 – 500 pts</span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    Deeply integrated multi-agent workflows, continuous model evaluations, proactive competitive moats, and high-performance culture.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREE VS FULL REPORT COMPARISON TABLE */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Transparent Deliverables</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Free Score vs. Comprehensive Company Report
            </p>
            <p className="mt-3 text-base text-slate-600">
              Start with a 100% free score. Upgrade only when you want the complete executive action plan and PDF.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-900">
                  <th className="py-4 px-6 font-bold w-1/2">Assessment Feature</th>
                  <th className="py-4 px-6 font-bold text-center w-1/4">Free Assessment</th>
                  <th className="py-4 px-6 font-bold text-center w-1/4 bg-brand-50/80 text-brand-900 border-l border-brand-200">
                    Paid Full Report ($149)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Total Score out of 500</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold bg-brand-50/30 border-l border-brand-100">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Readiness Band (Unaware to AI-led)</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold bg-brand-50/30 border-l border-brand-100">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">5-Dimension Percentage Breakdown</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">✓ High-level</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold bg-brand-50/30 border-l border-brand-100">✓ In-depth Analysis</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Key Strengths & Critical Blindspots</td>
                  <td className="py-3.5 px-6 text-center text-slate-400">—</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold bg-brand-50/30 border-l border-brand-100">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Prioritized Action Plan with Score Impact</td>
                  <td className="py-3.5 px-6 text-center text-slate-400">—</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold bg-brand-50/30 border-l border-brand-100">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Complete Response Audit Log</td>
                  <td className="py-3.5 px-6 text-center text-slate-400">—</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold bg-brand-50/30 border-l border-brand-100">✓ All 25 Questions</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">Downloadable Executive PDF Report</td>
                  <td className="py-3.5 px-6 text-center text-slate-400">—</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold bg-brand-50/30 border-l border-brand-100">✓ Instant Download</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-slate-800">C-Level Team Onboarding & Heatmaps</td>
                  <td className="py-3.5 px-6 text-center text-slate-400">—</td>
                  <td className="py-3.5 px-6 text-center text-emerald-600 font-bold bg-brand-50/30 border-l border-brand-100">✓ Unlimited Execs</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/30 transition-all"
            >
              Take Free Assessment Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SAMPLE REPORT TEASER */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Illustrative Sample</span>
            <h2 className="text-3xl font-bold tracking-tight mt-2 sm:text-4xl">
              Preview the Executive Company Report
            </h2>
            <p className="mt-3 text-base text-slate-400">
              Clear visual benchmarks, actionable steps, and leadership heatmaps generated upon completion.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-800/80 rounded-2xl border border-slate-700 p-6 sm:p-10 shadow-2xl backdrop-blur">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-700 gap-4">
              <div>
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Example Company</span>
                <h3 className="text-2xl font-bold text-white">Acme Precision Logistics</h3>
                <p className="text-xs text-slate-400 mt-1">Supply Chain & Freight • 120 employees • United States</p>
              </div>
              <div className="text-right flex items-center gap-4">
                <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-700">
                  <div className="text-[11px] uppercase text-slate-400 font-medium">Composite Score</div>
                  <div className="text-3xl font-extrabold text-blue-400">328 <span className="text-sm font-normal text-slate-400">/ 500</span></div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 px-3.5 py-2.5 rounded-xl text-blue-300 font-semibold text-sm">
                  Band: Established
                </div>
              </div>
            </div>

            {/* Dimensional Bars */}
            <div className="py-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-700">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Strategy & Leadership (25%)</span>
                  <span className="text-brand-300 font-bold">80%</span>
                </div>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Use & Value (20%)</span>
                  <span className="text-brand-300 font-bold">66%</span>
                </div>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: '66%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Data & Technology (20%)</span>
                  <span className="text-amber-300 font-bold">53%</span>
                </div>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '53%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Governance & Risk (20%)</span>
                  <span className="text-brand-300 font-bold">73%</span>
                </div>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: '73%' }} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">People & Skills (15%)</span>
                  <span className="text-rose-300 font-bold">46% (Critical Gap)</span>
                </div>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '46%' }} />
                </div>
              </div>
            </div>

            {/* Action Item Example */}
            <div className="pt-6">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Priority Action #1</span>
              <div className="mt-2 p-4 rounded-xl bg-slate-900/60 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Launch role-based prompt engineering and practical literacy training</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    +25 pts impact
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  <strong className="text-slate-300">Why it matters:</strong> Low frontline skill is currently capping return on your enterprise AI licenses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADVISOR & SCIENCEWERX SECTION */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-200 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Created by ScienceWerx
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ScienceWerx develops mission-critical diagnostics and workforce enablement platforms for emerging technologies. 
            Our assessments are independent, transparent, and built without vendor kickbacks.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span>• Self-reported accuracy standards</span>
            <span>• Role-based confidentiality</span>
            <span>• Direct feed to custom course generators</span>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">Questions & Answers</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How long does the company assessment take?',
                a: 'The company assessment takes approximately 8 to 10 minutes. It contains 25 straightforward situation questions (5 per dimension) written in plain language for founders and business leaders.',
              },
              {
                q: 'How does the C-Level executive assessment differ?',
                a: 'The C-level assessment is taken confidentially by each executive. It consists of 3 layers: Layer 1 measures Knowledge across 6 domains with role-specific blocks (CTO, CFO, CHRO, etc.); Layer 2 tests Awareness accuracy (perception vs operational truth); and Layer 3 identifies Resistance concern types (e.g. liability, loss of control, ROI doubts).',
              },
              {
                q: 'Who can see individual executive answers?',
                a: 'By default, individual executive answers and specific gap profiles are confidential to that executive and the company admin. Aggregated team heatmaps and resistance distributions unlock once at least 3 executives complete the assessment.',
              },
              {
                q: 'Is this assessment an official certification?',
                a: 'No. The score is self-reported, modeled after iStartup Score. It is an honest diagnostic mirror designed to guide practical upskilling and investment priorities, not an audited compliance certification.',
              },
              {
                q: 'What is the 360 assessment threshold for staff?',
                a: 'To guarantee total anonymity and psychological safety for employees, staff and manager responses are only reported in aggregates for groups or departments of 5 or more respondents.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-slate-900 hover:text-brand-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-brand-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-16 bg-brand-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to benchmark your organization's AI readiness?
          </h2>
          <p className="mt-3 text-base text-brand-100 max-w-xl mx-auto">
            Take the 25-question company assessment now and get your score out of 500 immediately.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-white text-brand-700 hover:bg-brand-50 shadow-lg shadow-black/10 transition-all"
            >
              Start Free Assessment
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-brand-700 hover:bg-brand-800 text-white border border-brand-500 transition-all"
            >
              Explore Sample Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

