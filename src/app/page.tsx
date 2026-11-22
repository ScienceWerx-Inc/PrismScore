'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Minus, Plus, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrismHero, { PrismBrandMark } from '@/components/PrismHero';
import { Reveal, CountUp, AnimatedBar } from '@/components/motion';

const HERO_FACTS = [
  { figure: '25', label: 'Questions, plain language' },
  { figure: '8–10', label: 'Minutes to complete' },
  { figure: '/500', label: 'Instant score & band' },
  { figure: '3+', label: 'Execs before team views' },
];

const HOW_IT_WORKS_STEPS = [
  {
    num: '01',
    title: 'Company Assessment',
    description:
      'A focused 25-question diagnostic to assess your organization’s AI readiness.',
    tier: 'Free',
  },
  {
    num: '02',
    title: 'Free Score & Band',
    description:
      'Get your readiness score out of 500 and a clear readiness band.',
    tier: 'Free',
  },
  {
    num: '03',
    title: 'C-Level Onboarding',
    description: 'Align leadership on priorities, risks, and opportunities.',
    tier: 'Full report',
  },
  {
    num: '04',
    title: 'Tailored Action & 360',
    description:
      'A customized action plan and a 360° executive report to drive measurable progress.',
    tier: 'Full report',
  },
];

// weight × 500 = the most points a dimension can contribute (src/lib/scoring.ts)
const WEIGHTED_DIMENSIONS = [
  { name: 'Strategy & Leadership', symbol: 'S', weight: 0.25 },
  { name: 'Use of AI / Use of AI Value', symbol: 'U', weight: 0.2 },
  { name: 'Data & Technology', symbol: 'D', weight: 0.2 },
  { name: 'Governance and Risk', symbol: 'G', weight: 0.2 },
  { name: 'People and Skills', symbol: 'P', weight: 0.15 },
];

const READINESS_BANDS = [
  {
    name: 'Unaware',
    range: '0 – 200',
    description: 'Minimal AI awareness and limited organizational readiness.',
    swatch: 'bg-rose-400',
    glow: 'shadow-[0_0_18px_rgba(251,113,133,0.55)]',
  },
  {
    name: 'Exploring',
    range: '201 – 300',
    description: 'Early exploration with initial initiatives and growing interest.',
    swatch: 'bg-amber-400',
    glow: 'shadow-[0_0_18px_rgba(251,191,36,0.55)]',
  },
  {
    name: 'Established',
    range: '301 – 400',
    description: 'Clear progress with defined initiatives and partial alignment.',
    swatch: 'bg-sky-400',
    glow: 'shadow-[0_0_18px_rgba(56,189,248,0.55)]',
  },
  {
    name: 'AI-Led',
    range: '401 – 500',
    description: 'Strong, organization-wide readiness and leadership alignment.',
    swatch: 'bg-emerald-400',
    glow: 'shadow-[0_0_18px_rgba(52,211,153,0.55)]',
  },
];

const SCALE_TICKS = [
  { value: 0, left: '0%' },
  { value: 200, left: '40%' },
  { value: 300, left: '60%' },
  { value: 400, left: '80%' },
  { value: 500, left: '100%' },
];

const COMPARISON_ROWS = [
  { feature: 'Total score out of 500', free: true },
  { feature: 'Readiness band', free: true },
  { feature: 'Alignment / resistance analysis', free: false },
  { feature: 'Key strengths & critical blindspots', free: false },
  { feature: 'Prioritized action plan', free: false },
  { feature: 'Complete response audit log', free: false },
  { feature: 'Downloadable PDF report', free: false },
  { feature: 'C-level team onboarding & heatmaps', free: false },
];

const MOCKUP_CATEGORIES = [
  { label: 'Strategy & Leadership', pct: 72 },
  { label: 'Use of AI / AI Value', pct: 66 },
  { label: 'Data & Technology', pct: 58 },
  { label: 'Governance & Risk', pct: 63 },
  { label: 'People & Skills', pct: 55 },
];

const REPORT_HIGHLIGHTS = [
  'Readiness overview',
  'Category insights',
  'Priority actions',
  'Leadership alignment',
];

const FAQS = [
  {
    q: 'How long does the company assessment take?',
    a: 'The company assessment takes approximately 8 to 10 minutes. It contains 25 straightforward situation questions (5 per dimension) written in plain language for founders and business leaders.',
  },
  {
    q: 'How does the C-level executive assessment differ?',
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
];

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prism-300';

const PRIMARY_CTA = `group inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-ink shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_12px_40px_-8px_rgba(139,116,250,0.55)] transition-all hover:bg-prism-50 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_16px_48px_-8px_rgba(139,116,250,0.75)] ${FOCUS_RING}`;

const SECONDARY_CTA = `glass inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 ${FOCUS_RING}`;

const MONO_LABEL = 'font-mono text-[11px] uppercase tracking-[0.14em]';

/** Mono index + label, then the section heading. Used by every section on this page. */
function SectionHead({
  index,
  kicker,
  title,
  lede,
  className = '',
}: {
  index: string;
  kicker: string;
  title: React.ReactNode;
  lede?: string;
  className?: string;
}) {
  return (
    <Reveal y={16} className={className}>
      <div className={`${MONO_LABEL} flex items-center gap-3 text-white/50`}>
        <span className="text-prism-300">{index}</span>
        <span className="spectrum h-px w-6 opacity-80" aria-hidden="true" />
        {kicker}
      </div>
      <h2 className="mt-5 text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.035em] text-white">
        {title}
      </h2>
      {lede && (
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">{lede}</p>
      )}
    </Reveal>
  );
}

/** Soft coloured light behind a section. Decorative only. */
function Glow({ className }: { className: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`}
      aria-hidden="true"
    />
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // Circular score gauge geometry for 328 / 500
  const gaugeRadius = 42;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - 328 / 500);

  return (
    <div className="relative flex flex-col min-h-screen bg-ink text-white overflow-hidden">
      {/* 1. HERO */}
      <section className="relative border-b border-white/[0.06]">
        <Glow className="-top-48 left-[8%] h-[520px] w-[520px] bg-prism-600/25" />
        <Glow className="top-1/3 right-[-10%] h-[480px] w-[640px] bg-sky-500/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
          {/* Canvas spans the viewport width but only the height of the copy, so the prism centres on it */}
          <div
            className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 hidden md:block pointer-events-none"
            aria-hidden="true"
          >
            <PrismHero />
          </div>
          <div className="relative pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-20 lg:pb-20 md:w-[62%] lg:w-[56%]">
            <p
              className="rise flex items-center gap-3 font-mono text-sm sm:text-base uppercase tracking-[0.16em] text-white/75"
              style={{ '--rise-delay': '0ms' } as React.CSSProperties}
            >
              <span className="spectrum h-px w-10" aria-hidden="true" />
              AI readiness assessment
            </p>

            <h1
              className="rise mt-7 text-[44px] sm:text-6xl lg:text-[72px] font-semibold leading-[1.0] tracking-[-0.04em] text-white"
              style={{ '--rise-delay': '80ms' } as React.CSSProperties}
            >
              Refract your company’s AI readiness &amp; leadership{' '}
              <span className="font-display italic font-normal tracking-[-0.02em] text-prism-300">
                alignment.
              </span>
            </h1>

            <p
              className="rise mt-7 max-w-xl text-lg leading-relaxed text-white/65"
              style={{ '--rise-delay': '160ms' } as React.CSSProperties}
            >
              Reveal real knowledge gaps, leadership alignment, and hidden adoption
              resistance with a research-backed assessment that turns insights into a
              clear, actionable score.
            </p>

            <div
              className="rise mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5"
              style={{ '--rise-delay': '240ms' } as React.CSSProperties}
            >
              <Link href="/onboarding" className={PRIMARY_CTA}>
                Start Free Company Assessment
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/dashboard" className={SECONDARY_CTA}>
                <Play className="w-3.5 h-3.5 fill-current" />
                View Live Demo
              </Link>
            </div>
          </div>
          </div>

          <dl
            className="rise glass relative mb-12 sm:mb-16 grid grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden"
            style={{ '--rise-delay': '320ms' } as React.CSSProperties}
          >
            {HERO_FACTS.map((fact, idx) => (
              <div
                key={fact.label}
                className={`px-5 py-5 sm:px-6 ${idx % 2 === 1 ? 'border-l border-white/10' : ''} ${
                  idx >= 2 ? 'border-t border-white/10 lg:border-t-0' : ''
                } ${idx === 2 ? 'lg:border-l' : ''}`}
              >
                <dt className={`${MONO_LABEL} text-[10px] text-white/45`}>{fact.label}</dt>
                <dd className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white tabular-nums">
                  {fact.figure}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section id="how-it-works" className="relative scroll-mt-4 py-24 sm:py-32">
        <Glow className="top-20 right-[15%] h-[360px] w-[360px] bg-prism-600/15" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
            <SectionHead
              index="01"
              kicker="How it works"
              title="From assessment to action"
              className="lg:col-span-7"
            />
            <Reveal y={16} delay={0.05} className="lg:col-span-5">
              <p className="text-base leading-relaxed text-white/60 max-w-md lg:ml-auto">
                A simple, proven process from company assessment to a tailored action
                plan. The first two steps are free.
              </p>
            </Reveal>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS_STEPS.map((step, idx) => (
              <li key={step.num} className="flex">
                <Reveal y={16} delay={idx * 0.06} className="flex w-full">
                  <div
                    className={`glass relative w-full rounded-2xl p-6 flex flex-col ${
                      idx === HOW_IT_WORKS_STEPS.length - 1 ? 'ring-1 ring-prism-400/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-white/45">{step.num}</span>
                      <span
                        className={`${MONO_LABEL} text-[10px] rounded-md px-2 py-1 ${
                          step.tier === 'Free'
                            ? 'bg-white/[0.06] text-white/60'
                            : 'bg-prism-500/15 text-prism-200'
                        }`}
                      >
                        {step.tier}
                      </span>
                    </div>

                    {/* pipeline position */}
                    <div className="mt-6 flex gap-1" aria-hidden="true">
                      {HOW_IT_WORKS_STEPS.map((s, i) => (
                        <span
                          key={s.num}
                          className={`h-1 flex-1 rounded-full ${
                            i <= idx ? 'bg-gradient-to-r from-prism-500 to-prism-300' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>

                    <h3 className="mt-8 text-lg font-semibold tracking-[-0.015em] text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-white/55">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. METHODOLOGY — THE PUBLISHED SCORING FORMULA */}
      <section id="scoring-formula" className="relative scroll-mt-4 pb-24 sm:pb-32">
        <Glow className="top-1/4 left-[-10%] h-[520px] w-[520px] bg-prism-600/20" />
        <Glow className="bottom-0 right-0 h-[400px] w-[600px] bg-emerald-500/[0.07]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal y={20}>
            <div className="glass rounded-3xl p-6 sm:p-10 lg:p-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                <div className="lg:col-span-5">
                  <SectionHead
                    index="02"
                    kicker="Our methodology"
                    title="The published scoring formula"
                    lede="A transparent, research-based model with weighted dimensions and clear readiness bands. Nothing about how you are scored is hidden."
                  />

                  <figure className="mt-10 rounded-xl border border-white/10 bg-ink/70 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10">
                      <span className="h-2 w-2 rounded-full bg-white/15" />
                      <span className="h-2 w-2 rounded-full bg-white/15" />
                      <span className="h-2 w-2 rounded-full bg-white/15" />
                      <span className={`${MONO_LABEL} text-[10px] text-white/35 ml-2`}>formula</span>
                    </div>
                    <div className="px-4 py-4 font-mono text-[13px] sm:text-sm leading-relaxed text-white/90 break-words">
                      <span className="text-sky-300">score</span>
                      <span className="text-white/40"> = </span>5
                      <span className="text-white/40"> × (</span>
                      {WEIGHTED_DIMENSIONS.map((dim, i) => (
                        <React.Fragment key={dim.symbol}>
                          <span className="text-prism-300">{dim.weight.toFixed(2)}</span>
                          <span className="text-white/40">·</span>
                          <span className="text-emerald-300">{dim.symbol}</span>
                          {i < WEIGHTED_DIMENSIONS.length - 1 && (
                            <span className="text-white/40"> + </span>
                          )}
                        </React.Fragment>
                      ))}
                      <span className="text-white/40">)</span>
                    </div>
                    <figcaption className="px-4 pb-4 text-sm leading-relaxed text-white/45">
                      Each letter is the percentage earned in that dimension, from its 5
                      questions.
                    </figcaption>
                  </figure>
                </div>

                <div className="lg:col-span-7">
                  <h3 className={`${MONO_LABEL} text-white/45`}>Weighted dimensions</h3>
                  <table className="mt-4 w-full text-left border-collapse">
                    <thead className="sr-only">
                      <tr>
                        <th>Dimension</th>
                        <th>Weight</th>
                        <th>Maximum points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WEIGHTED_DIMENSIONS.map((dim, idx) => {
                        const maxPoints = dim.weight * 500;
                        return (
                          <tr key={dim.name} className="border-t border-white/[0.08] last:border-b">
                            <td className="py-4 pr-4 align-middle">
                              <div className="flex items-baseline gap-3">
                                <span className="font-mono text-xs text-emerald-300 w-3">
                                  {dim.symbol}
                                </span>
                                <span className="text-[15px] font-medium text-white">
                                  {dim.name}
                                </span>
                              </div>
                              <div className="mt-3 ml-6 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                                <AnimatedBar
                                  value={(maxPoints / 125) * 100}
                                  delay={0.08 * idx}
                                  className="h-full rounded-full bg-gradient-to-r from-prism-500 to-sky-400 shadow-[0_0_12px_rgba(139,116,250,0.6)]"
                                />
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right font-mono text-sm text-white/55 tabular-nums align-top w-16">
                              {Math.round(dim.weight * 100)}%
                            </td>
                            <td className="py-4 pl-2 text-right align-top w-20">
                              <span className="text-2xl font-semibold leading-none tracking-[-0.03em] text-white tabular-nums">
                                {maxPoints}
                              </span>
                              <span className={`${MONO_LABEL} block text-[9px] text-white/35 mt-1.5`}>
                                max pts
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Readiness scale */}
              <div className="mt-16 pt-10 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className={`${MONO_LABEL} text-white/45`}>Readiness bands</h3>
                  <span className={`${MONO_LABEL} text-white/35`}>Total score out of 500</span>
                </div>

                <div className="mt-5 hidden md:block" aria-hidden="true">
                  <div className="flex h-2 gap-[3px]">
                    {READINESS_BANDS.map((band, i) => (
                      <div
                        key={band.name}
                        className={`${band.swatch} ${band.glow} ${i === 0 ? 'basis-[40%] rounded-l-full' : 'basis-[20%]'} ${
                          i === READINESS_BANDS.length - 1 ? 'rounded-r-full' : ''
                        }`}
                      />
                    ))}
                  </div>
                  <div className="relative h-6 mt-2.5 font-mono text-[11px] text-white/40 tabular-nums">
                    {SCALE_TICKS.map((tick) => (
                      <span
                        key={tick.value}
                        className={`absolute top-0 ${
                          tick.value === 0
                            ? ''
                            : tick.value === 500
                            ? '-translate-x-full'
                            : '-translate-x-1/2'
                        }`}
                        style={{ left: tick.left }}
                      >
                        {tick.value}
                      </span>
                    ))}
                  </div>
                </div>

                <ul className="mt-6 md:mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-x-6 gap-y-8">
                  {READINESS_BANDS.map((band) => (
                    <li key={band.name}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${band.swatch} ${band.glow}`} aria-hidden="true" />
                        <span className="text-[15px] font-semibold text-white">{band.name}</span>
                        <span className="font-mono text-xs text-white/45 tabular-nums">{band.range}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-white/50 max-w-[18rem]">
                        {band.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. FREE PRISMSCORE VS. FULL EXECUTIVE REPORT */}
      <section className="relative pb-24 sm:pb-32">
        <Glow className="top-1/3 right-[10%] h-[420px] w-[420px] bg-prism-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <SectionHead
              index="03"
              kicker="Free vs. full"
              title="Free PrismScore vs. Full Executive Report"
              lede="Choose the option that fits your needs and level of detail."
              className="lg:col-span-4"
            />

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Free Assessment', price: '$0', full: false },
                { name: 'Full Report', price: '$149', full: true },
              ].map((plan, pIdx) => (
                <Reveal key={plan.name} y={16} delay={0.06 * pIdx} className="flex">
                  <div
                    className={`glass relative w-full rounded-2xl p-6 sm:p-7 flex flex-col ${
                      plan.full ? 'ring-1 ring-prism-400/50' : ''
                    }`}
                  >
                    {plan.full && (
                      <div className="spectrum absolute inset-x-6 top-0 h-px opacity-80" aria-hidden="true" />
                    )}
                    <h3 className="text-sm font-semibold text-white/80">{plan.name}</h3>
                    <div className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-white tabular-nums">
                      {plan.price}
                    </div>
                    <ul className="mt-7 space-y-3 flex-1">
                      {COMPARISON_ROWS.map((row) => {
                        const included = plan.full || row.free;
                        return (
                          <li
                            key={row.feature}
                            className={`flex items-start gap-3 text-[15px] ${
                              included ? 'text-white/85' : 'text-white/35'
                            }`}
                          >
                            {included ? (
                              <Check
                                className={`w-4 h-4 mt-0.5 shrink-0 ${plan.full ? 'text-prism-300' : 'text-white/80'}`}
                                aria-hidden="true"
                              />
                            ) : (
                              <Minus className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                            )}
                            <span>
                              {row.feature}
                              <span className="sr-only">{included ? ' — included' : ' — not included'}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <Link
                      href={plan.full ? '/dashboard' : '/onboarding'}
                      className={`mt-8 ${plan.full ? PRIMARY_CTA : SECONDARY_CTA}`}
                    >
                      {plan.full ? 'View Sample Report' : 'Start Free Assessment'}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. EXECUTIVE REPORT SAMPLE */}
      <section id="executive-report" className="relative scroll-mt-4 py-24 sm:py-32 border-y border-white/[0.06] bg-ink-800">
        <Glow className="top-1/4 left-[15%] h-[460px] w-[460px] bg-prism-600/25" />
        <Glow className="bottom-10 left-[35%] h-[300px] w-[420px] bg-sky-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center">
            {/* Report window */}
            <Reveal y={20} className="lg:col-span-7 order-2 lg:order-1">
              <div className="relative max-w-2xl">
                <div className="glass relative rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    </div>
                    <div className="flex items-center gap-2">
                      <PrismBrandMark className="w-5 h-4" />
                      <span className={`${MONO_LABEL} text-[10px] text-white/55`}>
                        Executive Report · Sample
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <div className="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-white leading-tight">
                      Acme Precision Logistics
                    </div>
                    <div className={`${MONO_LABEL} text-[10px] mt-1.5 text-white/40`}>
                      Company assessment
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
                      <div className="sm:col-span-5 flex sm:flex-col items-center gap-5 sm:gap-4">
                        <div className="relative w-36 h-36 shrink-0">
                          <div className="absolute inset-4 rounded-full bg-prism-500/20 blur-2xl" aria-hidden="true" />
                          <svg viewBox="0 0 100 100" className="relative w-full h-full -rotate-90" aria-hidden="true">
                            <defs>
                              <linearGradient id="reportGauge" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8b74fa" />
                                <stop offset="100%" stopColor="#38bdf8" />
                              </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r={gaugeRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                            <motion.circle
                              cx="50"
                              cy="50"
                              r={gaugeRadius}
                              fill="none"
                              stroke="url(#reportGauge)"
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={gaugeCircumference}
                              initial={{ strokeDashoffset: gaugeCircumference }}
                              whileInView={{ strokeDashoffset: gaugeOffset }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-semibold leading-none tracking-[-0.04em] text-white tabular-nums">
                              <CountUp to={328} />
                            </span>
                            <span className="font-mono text-[10px] text-white/45 mt-1.5">/ 500</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" aria-hidden="true" />
                          Established
                        </span>
                      </div>

                      <div className="sm:col-span-7">
                        <div className={`${MONO_LABEL} text-[10px] text-white/40 mb-4`}>
                          Category progress
                        </div>
                        <div className="space-y-3.5">
                          {MOCKUP_CATEGORIES.map((cat, idx) => (
                            <div key={cat.label}>
                              <div className="flex items-baseline justify-between text-[13px] mb-1.5">
                                <span className="text-white/70 truncate pr-2">{cat.label}</span>
                                <span className="font-mono text-xs text-white tabular-nums shrink-0">
                                  {cat.pct}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                                <AnimatedBar
                                  value={cat.pct}
                                  delay={0.1 * idx}
                                  className="h-full rounded-full bg-gradient-to-r from-prism-500 to-sky-400"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating insight chip */}
                <div className="glass absolute -bottom-6 right-4 sm:-right-6 rounded-xl px-4 py-3 hidden sm:block">
                  <div className={`${MONO_LABEL} text-[9px] text-white/45`}>Lowest dimension</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">People &amp; Skills</span>
                    <span className="font-mono text-xs text-amber-300">55%</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Copy */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <SectionHead
                index="04"
                kicker="Executive report sample"
                title="Preview the executive company report"
                lede="Clear visual benchmarks, actionable insights, and a leadership heatmap for organization-wide alignment."
              />

              <Reveal y={16} delay={0.08}>
                <ol className="mt-8 grid grid-cols-2 gap-3">
                  {REPORT_HIGHLIGHTS.map((label, idx) => (
                    <li key={label} className="glass rounded-xl px-4 py-3.5 flex items-baseline gap-3">
                      <span className="font-mono text-xs text-prism-300">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium text-white/90">{label}</span>
                    </li>
                  ))}
                </ol>

                <Link href="/dashboard" className={`${SECONDARY_CTA} group mt-8`}>
                  View Sample Report
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="relative scroll-mt-4 py-24 sm:py-32">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <SectionHead
              index="05"
              kicker="FAQ"
              title="Common questions"
              lede="Quick answers to common questions about PrismScore."
              className="lg:col-span-4"
            />

            <Reveal y={16} delay={0.08} className="lg:col-span-8">
              <div className="glass rounded-2xl px-2 sm:px-3">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  const panelId = `faq-panel-${idx}`;
                  return (
                    <div key={faq.q} className={idx > 0 ? 'border-t border-white/[0.08]' : ''}>
                      <h3>
                        <button
                          type="button"
                          onClick={() => toggleFaq(idx)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          className={`w-full text-left px-4 py-5 flex items-start justify-between gap-6 rounded-xl text-base sm:text-[17px] font-medium transition-colors ${
                            isOpen ? 'text-white' : 'text-white/80 hover:text-white'
                          } ${FOCUS_RING}`}
                        >
                          <span>{faq.q}</span>
                          <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              isOpen ? 'border-prism-400/60 bg-prism-500/20 text-prism-200' : 'border-white/15 text-white/50'
                            }`}
                            aria-hidden="true"
                          >
                            {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </span>
                        </button>
                      </h3>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={panelId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="px-4 pb-6 pr-14 max-w-2xl text-[15px] leading-relaxed text-white/55">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. CLOSING CTA */}
      <section className="relative pb-24 sm:pb-28">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal y={16}>
            <div className="glass relative overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-16">
              <div className="spectrum absolute inset-x-10 top-0 h-px opacity-90" aria-hidden="true" />
              <Glow className="-top-32 left-1/2 -translate-x-1/2 h-[320px] w-[640px] bg-prism-600/35" />
              <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                <div className="lg:col-span-8">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.02] tracking-[-0.04em] text-white">
                    Benchmark your organization’s AI readiness in about{' '}
                    <span className="font-display italic font-normal tracking-[-0.02em] text-prism-300">
                      ten minutes.
                    </span>
                  </h2>
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/60">
                    Take the 25-question company assessment now and get your score out of
                    500 and your readiness band straight away.
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3.5">
                  <Link href="/onboarding" className={PRIMARY_CTA}>
                    Start Free Assessment
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link href="/dashboard" className={SECONDARY_CTA}>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    View Live Demo
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
