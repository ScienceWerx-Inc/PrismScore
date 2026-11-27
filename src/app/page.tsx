'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ClipboardList,
  Layers,
  LayoutDashboard,
  Minus,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  motion,
  animate,
  AnimatePresence,
  MotionConfig,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { calculateReadinessBand, DIMENSIONS } from '@/lib/scoring';
import { ASSESSMENT, CTA, ROUTES } from '@/lib/product';
import { PrismBrandMark } from '@/components/PrismHero';
import { Reveal, CountUp, AnimatedBar } from '@/components/motion';

const HERO_FEATURES = [
  { icon: Users, label: 'Organization & team assessments' },
  { icon: Layers, label: 'Multi-dimensional evaluation' },
  { icon: BarChart3, label: 'Actionable roadmaps' },
];

// Shown where a logo wall would sit: facts about the assessment itself
const HERO_FACTS = [
  { figure: `${ASSESSMENT.questions}`, label: 'Questions, plain language' },
  { figure: ASSESSMENT.minutes, label: 'Minutes to complete' },
  { figure: `/${ASSESSMENT.maxScore}`, label: 'Instant score & band' },
  { figure: `${ASSESSMENT.execsForTeamViews}+`, label: 'Execs before team views' },
];

const READINESS_BANDS = [
  {
    name: 'Unaware',
    range: '0 – 200',
    description: 'Minimal AI awareness and limited organizational readiness.',
    dot: 'bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.8)]',
    swatch: 'bg-rose-400',
    mid: 100,
  },
  {
    name: 'Exploring',
    range: '201 – 300',
    description: 'Early exploration with initial initiatives and growing interest.',
    dot: 'bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.8)]',
    swatch: 'bg-amber-400',
    mid: 250,
  },
  {
    name: 'Established',
    range: '301 – 400',
    description: 'Clear progress with defined initiatives and partial alignment.',
    dot: 'bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.8)]',
    swatch: 'bg-sky-400',
    mid: 350,
  },
  {
    name: 'AI-Led',
    range: '401 – 500',
    description: 'Strong, organization-wide readiness and leadership alignment.',
    dot: 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]',
    swatch: 'bg-emerald-400',
    mid: 450,
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    image: '/images/icon-assess.png',
    title: 'Company Assessment',
    description: `A focused ${ASSESSMENT.questions}-question diagnostic to assess your organization’s AI readiness.`,
    tier: 'Free',
  },
  {
    image: '/images/icon-understand.png',
    title: 'Free Score & Band',
    description: `Get your readiness score out of ${ASSESSMENT.maxScore} and a clear readiness band.`,
    tier: 'Free',
  },
  {
    image: '/images/icon-align.png',
    title: 'C-Level Onboarding',
    description: 'Align leadership on priorities, risks, and opportunities.',
    tier: 'Full report',
  },
  {
    image: '/images/icon-advance.png',
    title: 'Tailored Action & 360',
    description: 'A customized action plan and a 360° executive report to drive measurable progress.',
    tier: 'Full report',
  },
];

// What the assessment reveals (the live site's core message)
const WHY_POINTS = [
  {
    icon: Search,
    title: 'Real knowledge gaps',
    detail: '25 plain-language questions across five weighted dimensions.',
  },
  {
    icon: Users,
    title: 'Leadership alignment',
    detail: 'Confidential C-level assessments, with team heatmaps once 3+ executives respond.',
  },
  {
    icon: ShieldCheck,
    title: 'Hidden adoption resistance',
    detail: 'Concerns like liability, loss of control and ROI doubts, identified by type.',
  },
];

const REPORT_HIGHLIGHTS = ['Readiness overview', 'Category insights', 'Priority actions', 'Leadership alignment'];

const SCREEN_NAV = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: ClipboardList, label: 'Assessment' },
  { icon: BarChart3, label: 'Results' },
  { icon: Route, label: 'Roadmap' },
  { icon: Users, label: 'Team insights' },
];

// The sample report’s numbers (seeded demo company: 328.3, Established), rounded for the mock screen
const SCREEN_DIMENSIONS = [
  { label: DIMENSIONS.STRATEGY.name, pct: 80 },
  { label: DIMENSIONS.USE_VALUE.name, pct: 67 },
  { label: DIMENSIONS.DATA_TECH.name, pct: 53 },
  { label: DIMENSIONS.GOVERNANCE.name, pct: 73 },
  { label: DIMENSIONS.PEOPLE.name, pct: 47 },
];

// weight × 500 = the most points a dimension can contribute (src/lib/scoring.ts)
const WEIGHTED_DIMENSIONS = [
  { name: DIMENSIONS.STRATEGY.name, symbol: 'S', weight: DIMENSIONS.STRATEGY.weight },
  { name: DIMENSIONS.USE_VALUE.name, symbol: 'U', weight: DIMENSIONS.USE_VALUE.weight },
  { name: DIMENSIONS.DATA_TECH.name, symbol: 'D', weight: DIMENSIONS.DATA_TECH.weight },
  { name: DIMENSIONS.GOVERNANCE.name, symbol: 'G', weight: DIMENSIONS.GOVERNANCE.weight },
  { name: DIMENSIONS.PEOPLE.name, symbol: 'P', weight: DIMENSIONS.PEOPLE.weight },
];

/** The published formula: 5 × Σ(dimension % × weight), each % from 0 to 100. */
const scoreFrom = (pcts: number[]) =>
  5 * WEIGHTED_DIMENSIONS.reduce((sum, dim, i) => sum + pcts[i] * dim.weight, 0);

const BAND_ORDER = ['Unaware', 'Exploring', 'Established', 'AI-led'] as const;
const bandIndex = (score: number) => BAND_ORDER.indexOf(calculateReadinessBand(score));

// The sample dashboard shows the score its own bars produce
const SAMPLE_SCORE = Math.round(scoreFrom(SCREEN_DIMENSIONS.map((d) => d.pct)));
const SAMPLE_BAND = READINESS_BANDS[bandIndex(SAMPLE_SCORE)];

const COMPARISON_ROWS = [
  { feature: `Total score out of ${ASSESSMENT.maxScore}`, free: true },
  { feature: 'Readiness band', free: true },
  { feature: 'Alignment / resistance analysis', free: false },
  { feature: 'Key strengths & critical blindspots', free: false },
  { feature: 'Prioritized action plan', free: false },
  { feature: 'Complete response audit log', free: false },
  { feature: 'Downloadable PDF report', free: false },
  { feature: 'C-level team onboarding & heatmaps', free: false },
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
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prism-600';

const FOCUS_RING_DARK =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300';

const PRIMARY_CTA = `group inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(21,19,41,0.7)] transition-colors hover:bg-prism-700 ${FOCUS_RING}`;

const VIOLET_CTA = `group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_-12px_rgba(91,61,245,0.8)] transition-[filter,box-shadow] hover:brightness-110 ${FOCUS_RING_DARK}`;

const GHOST_CTA = `inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/30 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 ${FOCUS_RING_DARK}`;

const KICKER = 'font-mono text-[11px] uppercase tracking-[0.22em]';

/** Mono kicker with a trailing rule, as on the mockup. */
function Kicker({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`${KICKER} flex items-center gap-4 ${dark ? 'text-white/65' : 'text-ink/70'}`}>
      {children}
      <span className={`h-px w-14 ${dark ? 'bg-white/30' : 'bg-ink/30'}`} aria-hidden="true" />
    </div>
  );
}

/** Background photo that drifts with scroll. Still when motion is reduced. */
function ParallaxImage({
  src,
  priority = false,
  className = '',
  distance = 60,
}: {
  src: string;
  priority?: boolean;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-distance, distance]);
  return (
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-20">
        <Image src={src} alt="" fill priority={priority} sizes="100vw" className={`object-cover ${className}`} />
      </motion.div>
    </div>
  );
}

// Light specks around the hero figure (fixed positions, so server and client agree)
const MOTES = Array.from({ length: 16 }, (_, i) => ({
  left: `${48 + ((i * 37) % 50)}%`,
  top: `${8 + ((i * 53) % 80)}%`,
  size: 2 + (i % 3),
  delay: `${((i * 0.7) % 5).toFixed(1)}s`,
  duration: `${4 + (i % 4)}s`,
}));

/** A stat whose leading number counts up when it scrolls into view ("/500", "3+", "25"). */
function StatFigure({ figure }: { figure: string }) {
  const match = figure.match(/^(\D*)(\d+)(.*)$/);
  // Ranges like "8–10" read oddly mid-count, so they stay as written
  if (!match || match[3].startsWith('–')) return <>{figure}</>;
  const [, prefix, num, suffix] = match;
  return (
    <>
      {prefix}
      <CountUp to={Number(num)} duration={1.4} />
      {suffix}
    </>
  );
}

/** A number that rolls to its new value instead of jumping. */
function RollingNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 140, damping: 22 });
  const text = useTransform(spring, (v) => Math.round(v).toString());
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span>{text}</motion.span>;
}

/** Drag a score along the 0–500 spectrum and see which band it lands in. */
function SpectrumScrubber() {
  const [score, setScore] = useState(SAMPLE_SCORE);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const touched = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView || reduceMotion || touched.current) return;
    const controls = animate(0, SAMPLE_SCORE, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (!touched.current) setScore(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion]);

  const choose = (value: number) => {
    touched.current = true;
    setScore(value);
  };
  const active = bandIndex(score);
  const band = READINESS_BANDS[active];
  const pct = (score / 500) * 100;

  return (
    <div ref={ref} className="mt-9">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
            Drag to explore a score
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-5xl sm:text-6xl font-bold tracking-[-0.045em] tabular-nums">{score}</span>
            <span className="font-mono text-sm text-white/60">/ 500</span>
          </div>
        </div>
        <div className="sm:text-right" aria-live="polite">
          <div className="flex items-center sm:justify-end gap-2.5 text-xl font-semibold">
            <span className={`h-2.5 w-2.5 rounded-full ${band.dot}`} aria-hidden="true" />
            {band.name}
          </div>
          <p className="mt-1 max-w-[17rem] text-sm leading-relaxed text-white/65">{band.description}</p>
        </div>
      </div>

      <div className="relative mt-7 h-10">
        <div className="absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 gap-[3px]" aria-hidden="true">
          {READINESS_BANDS.map((b, i) => (
            <div
              key={b.name}
              className={`${b.swatch} transition-opacity duration-300 ${
                i === 0 ? 'basis-[40%] rounded-l-full' : 'basis-[20%]'
              } ${i === READINESS_BANDS.length - 1 ? 'rounded-r-full' : ''} ${
                i <= active ? 'opacity-100' : 'opacity-25'
              }`}
            />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={500}
          step={1}
          value={score}
          onChange={(e) => choose(Number(e.target.value))}
          aria-label="Explore a readiness score"
          aria-valuetext={`${score} out of 500, ${band.name}`}
          className="peer absolute inset-0 z-10 h-full w-full cursor-grab opacity-0 active:cursor-grabbing"
        />
        <div
          className="pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-4 ring-white/25 shadow-[0_0_28px_rgba(255,255,255,0.75)] peer-focus-visible:ring-brand-300"
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="relative h-5 font-mono text-[11px] text-white/55 tabular-nums" aria-hidden="true">
        {[0, 200, 300, 400, 500].map((tick) => (
          <span
            key={tick}
            className={`absolute top-0 ${tick === 0 ? '' : tick === 500 ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: `${(tick / 500) * 100}%` }}
          >
            {tick}
          </span>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr] gap-2">
        {READINESS_BANDS.map((b, i) => (
          <button
            key={b.name}
            type="button"
            onClick={() => choose(b.mid)}
            aria-pressed={i === active}
            className={`rounded-xl px-3 py-2.5 text-left transition-colors ${FOCUS_RING_DARK} ${
              i === active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className={`h-2 w-2 rounded-full ${b.swatch}`} aria-hidden="true" />
              {b.name}
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-white/55 tabular-nums">{b.range}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The published formula, live: drag each dimension and watch the score and band move. */
function FormulaPlayground() {
  const samplePcts = SCREEN_DIMENSIONS.map((d) => d.pct);
  const [pcts, setPcts] = useState<number[]>(samplePcts);
  const score = scoreFrom(pcts);
  const band = READINESS_BANDS[bandIndex(score)];
  const isSample = pcts.every((p, i) => p === samplePcts[i]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      <div className="lg:col-span-5">
        <Kicker>Our methodology</Kicker>
        <h2 className="mt-5 text-4xl sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
          The published scoring formula.
        </h2>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70">
          A transparent, research-based model with weighted dimensions and clear
          readiness bands. Nothing about how you are scored is hidden.
        </p>
        <p className="mt-3 text-sm font-semibold text-brand-700">Move the sliders to run it yourself.</p>

        <figure className="mt-9 overflow-hidden rounded-2xl bg-ink text-white">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">formula · live</span>
          </div>
          <div className="px-4 py-4 font-mono text-[13px] sm:text-sm leading-relaxed break-words">
            <span className="text-sky-300">score</span>
            <span className="text-white/55"> = </span>5
            <span className="text-white/55"> × (</span>
            {WEIGHTED_DIMENSIONS.map((dim, i) => (
              <React.Fragment key={dim.symbol}>
                <span className="text-brand-300">{dim.weight.toFixed(2)}</span>
                <span className="text-white/55">·</span>
                <span className="text-emerald-300 tabular-nums">{pcts[i]}</span>
                {i < WEIGHTED_DIMENSIONS.length - 1 && <span className="text-white/55"> + </span>}
              </React.Fragment>
            ))}
            <span className="text-white/55">)</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-white/55">=</span>
              <span className="text-4xl font-bold tracking-[-0.04em] tabular-nums"><RollingNumber value={score} /></span>
              <span className="font-mono text-sm text-white/55">/ 500</span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-semibold" aria-live="polite">
              <span className={`h-2 w-2 rounded-full ${band.dot}`} aria-hidden="true" />
              {band.name}
            </span>
          </div>
        </figure>
      </div>

      <div className="lg:col-span-7">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className={`${KICKER} text-ink/65`}>Weighted dimensions</h3>
          {!isSample && (
            <button
              type="button"
              onClick={() => setPcts(samplePcts)}
              className={`text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-600 ${FOCUS_RING}`}
            >
              Reset to sample
            </button>
          )}
        </div>
        <ul className="mt-4">
          {WEIGHTED_DIMENSIONS.map((dim, i) => {
            const maxPoints = dim.weight * 500;
            const earned = Math.round(pcts[i] * dim.weight * 5);
            const id = `dimension-${dim.symbol}`;
            return (
              <li key={dim.name} className="border-t border-ink/10 py-4 last:border-b">
                <div className="flex items-baseline justify-between gap-4">
                  <label htmlFor={id} className="flex items-baseline gap-3">
                    <span className="w-3 font-mono text-xs text-brand-600">{dim.symbol}</span>
                    <span className="text-[15px] font-semibold text-ink">{dim.name}</span>
                    <span className="font-mono text-xs text-ink/60">{Math.round(dim.weight * 100)}%</span>
                  </label>
                  <span className="shrink-0 tabular-nums">
                    <span className="text-xl font-bold tracking-[-0.03em] text-ink">{earned}</span>
                    <span className="text-sm text-ink/65"> / {maxPoints} pts</span>
                  </span>
                </div>
                <div className="mt-3 ml-6 flex items-center gap-4">
                  <input
                    id={id}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={pcts[i]}
                    onChange={(e) => {
                      const next = [...pcts];
                      next[i] = Number(e.target.value);
                      setPcts(next);
                    }}
                    aria-valuetext={`${pcts[i]} percent, ${earned} of ${maxPoints} points`}
                    className="prism-range flex-1"
                    style={{ '--val': `${pcts[i]}%` } as React.CSSProperties}
                  />
                  <span className="w-11 text-right font-mono text-sm text-ink/70 tabular-nums">{pcts[i]}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Tilts its children in 3D toward the pointer. Still when motion is reduced. */
function TiltLaptop({ className, children }: { className: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 140, damping: 16 });
  const rotateY = useSpring(0, { stiffness: 140, damping: 16 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    rotateY.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    rotateX.set(-((e.clientY - r.top) / r.height - 0.5) * 9);
  };

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      onMouseMove={onMove}
      onMouseLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
      aria-hidden="true"
    >
      {children}
    </motion.div>
  );
}

/** Thin spectrum bar at the top of the window showing how far down the page you are. */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="spectrum fixed inset-x-0 top-0 z-[60] h-[3px] origin-left"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // Gauge geometry for the sample score, 328 / 500
  const gaugeRadius = 42;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - SAMPLE_SCORE / 500);

  return (
    <MotionConfig reducedMotion="user">
    <ScrollProgress />
    {/* -mt-20 slides the page up under the 5rem header, so the hero photo starts at the very top */}
    <div className="relative -mt-20 flex flex-col bg-paper text-ink overflow-hidden">
      {/* 1. HERO */}
      {/* pt-20 keeps the hero copy clear of the header that floats over it */}
      <section className="relative isolate overflow-hidden bg-ink text-white pt-20">
        <ParallaxImage src="/images/hero-leader.png" priority distance={50} className="object-[68%_center] animate-kenburns" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-ink/70 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block" aria-hidden="true">
          {MOTES.map((m, i) => (
            <span
              key={i}
              className="animate-twinkle absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              style={{ left: m.left, top: m.top, width: m.size, height: m.size, animationDelay: m.delay, animationDuration: m.duration }}
            />
          ))}
        </div>
        <div
          className="absolute inset-0 -z-10 bg-ink/75 lg:bg-transparent lg:bg-gradient-to-r lg:from-ink lg:via-ink/85 lg:to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-16 pb-14 sm:pt-20 lg:pt-24 lg:pb-20 lg:w-[52%]">
            <div className="rise" style={{ '--rise-delay': '0ms' } as React.CSSProperties}>
              <Kicker dark>AI readiness assessment</Kicker>
            </div>

            <h1
              className="rise mt-7 text-[44px] sm:text-6xl lg:text-[64px] font-extrabold leading-[1.04] tracking-[-0.035em]"
              style={{ '--rise-delay': '80ms' } as React.CSSProperties}
            >
              Refract your company’s AI readiness &amp; leadership{' '}
              <span className="animate-sheen bg-gradient-to-r from-brand-300 via-sky-200 to-brand-400 bg-clip-text text-transparent">
                alignment.
              </span>
            </h1>

            <p
              className="rise mt-6 max-w-lg text-[17px] leading-relaxed text-white/75"
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
              <Link href={ROUTES.start} className={VIOLET_CTA}>
                {CTA.start}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href={ROUTES.sampleReport} className={GHOST_CTA}>
                {CTA.sample}
              </Link>
            </div>
            <p
              className="rise mt-4 text-sm text-white/65"
              style={{ '--rise-delay': '280ms' } as React.CSSProperties}
            >
              Free · {ASSESSMENT.minutes} minutes · No credit card
            </p>

            <ul
              className="rise mt-12 flex flex-wrap gap-y-4"
              style={{ '--rise-delay': '320ms' } as React.CSSProperties}
            >
              {HERO_FEATURES.map(({ icon: Icon, label }, idx) => (
                <li
                  key={label}
                  className={`flex items-center gap-2.5 w-full sm:w-auto sm:pr-5 sm:mr-5 text-[13px] font-medium leading-snug text-white/80 ${
                    idx < HERO_FEATURES.length - 1 ? 'sm:border-r sm:border-white/15' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0 text-brand-300" aria-hidden="true" />
                  <span className="sm:max-w-[8rem]">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What's inside: real facts in the slot a logo wall would take */}
          <div className="border-t border-white/10 pt-8 pb-12 sm:pb-14">
            <div className={`${KICKER} text-center text-white/65`}>The assessment at a glance</div>
            <dl className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-y-7">
              {HERO_FACTS.map((fact) => (
                <div key={fact.label} className="flex flex-col-reverse items-center text-center">
                  <dt className="mt-1 text-[13px] text-white/65">{fact.label}</dt>
                  <dd className="text-3xl font-extrabold tracking-[-0.03em] text-white tabular-nums">
                    <StatFigure figure={fact.figure} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 2. THE AI READINESS SPECTRUM — continues the hero, then fades into the page */}
      <section className="relative isolate bg-gradient-to-b from-ink from-[72%] to-paper px-4 sm:px-6 lg:px-8 pb-24 sm:pb-28">
        <div
          className="pointer-events-none absolute left-1/2 top-10 -z-10 h-72 w-[70%] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[120px]"
          aria-hidden="true"
        />
        <Reveal y={20} className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-ink-800/80 text-white grid grid-cols-1 lg:grid-cols-12 backdrop-blur-xl shadow-[0_50px_100px_-45px_rgba(91,61,245,0.8)]">
            <div className="spectrum-flow absolute inset-x-10 top-0 h-px opacity-80" aria-hidden="true" />
            <div className="relative lg:col-span-5 min-h-[240px] sm:min-h-[300px]">
              <Image
                src="/images/prism-spectrum.png"
                alt="A glass prism splitting white light into a spectrum"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-[30%_center]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-transparent via-transparent to-ink-800"
                aria-hidden="true"
              />
            </div>

            <div className="relative lg:col-span-7 px-6 py-10 sm:px-10 lg:py-12 lg:pl-4 lg:pr-12">
              <Kicker dark>The AI readiness spectrum</Kicker>
              <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold leading-[1.1] tracking-[-0.035em]">
                A clear path from awareness to AI-led.
              </h2>
              <SpectrumScrubber />
            </div>
          </div>
        </Reveal>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-4 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
            <Reveal y={16} className="lg:col-span-7">
              <Kicker>How it works</Kicker>
              <h2 className="mt-5 text-4xl sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
                From assessment to action.
              </h2>
            </Reveal>
            <Reveal y={16} delay={0.05} className="lg:col-span-5">
              <p className="max-w-md text-base leading-relaxed text-ink/70">
                A simple, proven process from company assessment to a tailored action
                plan. The first two steps are free.
              </p>
            </Reveal>
          </div>

          <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-4">
            {HOW_IT_WORKS_STEPS.map((step, idx) => (
              <React.Fragment key={step.title}>
                <li className="flex">
                  <Reveal y={16} delay={idx * 0.08} className="flex w-full">
                    <div className="group relative w-full overflow-hidden rounded-3xl border border-ink/10 bg-white p-6 sm:p-7 shadow-[0_24px_50px_-34px_rgba(21,19,41,0.45)] transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(91,61,245,0.45)]">
                      <span className="spectrum absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
                      <div className="flex items-start justify-between">
                        <span className="animate-floaty inline-block" style={{ animationDelay: `${idx * 0.6}s` }}>
                          <Image
                            src={step.image}
                            alt=""
                            width={112}
                            height={112}
                            className="h-20 w-20 -ml-2 mix-blend-multiply transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3"
                          />
                        </span>
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.14em] rounded-md px-2 py-1 ${
                            step.tier === 'Free' ? 'bg-paper-deep text-ink/70' : 'bg-brand-50 text-brand-700'
                          }`}
                        >
                          {step.tier}
                        </span>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2.5">
                        <span className="font-mono text-sm text-ink/60">0{idx + 1}</span>
                        <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{step.title}</h3>
                      </div>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{step.description}</p>
                    </div>
                  </Reveal>
                </li>
                {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                  <li className="hidden lg:flex items-center text-ink/40" aria-hidden="true">
                    <ArrowRight className="animate-nudge w-5 h-5" />
                  </li>
                )}
              </React.Fragment>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. THE PRODUCT */}
      <section
        id="executive-report"
        className="scroll-mt-4 relative py-16 sm:py-24 bg-gradient-to-b from-paper via-brand-50/60 to-paper"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Laptop on the plinth */}
          <Reveal y={24} className="lg:col-span-7">
            <figure className="relative aspect-[3/2] w-full" role="img" aria-label="Sample PrismScore executive dashboard">
              <Image
                src="/images/product-plinth.png"
                alt=""
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover rounded-[28px] [mask-image:radial-gradient(ellipse_at_center,black_62%,transparent_100%)]"
              />

              <TiltLaptop className="absolute left-[11%] right-[11%] bottom-[31%]">
                {/* Screen */}
                <div className="rounded-t-[14px] border-[5px] border-b-0 border-[#1a1a22] bg-[#1a1a22] shadow-[0_30px_60px_-25px_rgba(21,19,41,0.6)]">
                  <div className="aspect-[16/10] overflow-hidden rounded-t-[9px] bg-white flex text-ink">
                    {/* Sidebar */}
                    <div className="w-[24%] bg-ink text-white px-[3%] py-[4%] flex flex-col gap-[6%]">
                      <div className="flex items-center gap-1.5">
                        <PrismBrandMark className="w-4 h-3.5 sm:w-5 sm:h-4" />
                        <span className="text-[7px] sm:text-[10px] font-extrabold tracking-tight">PrismScore</span>
                      </div>
                      <ul className="flex flex-col gap-1 sm:gap-1.5">
                        {SCREEN_NAV.map(({ icon: Icon, label, active }) => (
                          <li
                            key={label}
                            className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[6px] sm:text-[9px] ${
                              active ? 'bg-brand-600 text-white' : 'text-white/60'
                            }`}
                          >
                            <Icon className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Main */}
                    <div className="flex-1 bg-paper px-[4%] py-[4%] flex flex-col gap-[4%] min-w-0">
                      <div className="rounded-lg bg-white border border-ink/10 p-[3%] flex items-center gap-[5%]">
                        <div className="relative w-[26%] aspect-square shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <defs>
                              <linearGradient id="screenGauge" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#5b3df5" />
                                <stop offset="100%" stopColor="#38bdf8" />
                              </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r={gaugeRadius} fill="none" stroke="#ece9f6" strokeWidth="9" />
                            <motion.circle
                              cx="50"
                              cy="50"
                              r={gaugeRadius}
                              fill="none"
                              stroke="url(#screenGauge)"
                              strokeWidth="9"
                              strokeLinecap="round"
                              strokeDasharray={gaugeCircumference}
                              initial={{ strokeDashoffset: gaugeCircumference }}
                              whileInView={{ strokeDashoffset: gaugeOffset }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[11px] sm:text-xl font-bold leading-none tabular-nums">
                              <CountUp to={SAMPLE_SCORE} />
                            </span>
                            <span className="text-[5px] sm:text-[8px] text-ink/50">/ 500</span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[6px] sm:text-[9px] text-ink/60">Your AI readiness score</div>
                          <div className="mt-0.5 text-[10px] sm:text-base font-bold text-ink">{SAMPLE_BAND.name}</div>
                          <div className="mt-0.5 text-[5px] sm:text-[8px] leading-snug text-ink/60">
                            {SAMPLE_BAND.description}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-white border border-ink/10 p-[3%] flex-1 min-h-0">
                        <div className="text-[6px] sm:text-[9px] font-semibold text-ink mb-[3%]">
                          Readiness by dimension
                        </div>
                        <div className="flex flex-col gap-[5%] sm:gap-1.5">
                          {SCREEN_DIMENSIONS.map((dim, idx) => (
                            <div key={dim.label} className="flex items-center gap-[4%]">
                              <span className="w-[38%] truncate text-[5px] sm:text-[8px] text-ink/70">{dim.label}</span>
                              <span className="flex-1 h-[3px] sm:h-1.5 rounded-full bg-brand-50 overflow-hidden">
                                <AnimatedBar
                                  value={dim.pct}
                                  delay={0.08 * idx}
                                  className="block h-full rounded-full bg-gradient-to-r from-brand-600 to-sky-400"
                                />
                              </span>
                              <span className="w-[10%] text-right text-[5px] sm:text-[8px] font-semibold tabular-nums">
                                {dim.pct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Base */}
                <div className="relative -mx-[5%] h-2.5 sm:h-3.5 rounded-b-xl bg-gradient-to-b from-[#d9d8de] to-[#a9a8b2] shadow-[0_10px_20px_-8px_rgba(21,19,41,0.5)]">
                  <span className="absolute left-1/2 top-0 h-1 w-[14%] -translate-x-1/2 rounded-b-md bg-black/15" />
                </div>
              </TiltLaptop>
            </figure>
          </Reveal>

          <Reveal y={16} delay={0.08} className="lg:col-span-5">
            <Kicker>Executive report sample</Kicker>
            <h2 className="mt-5 text-4xl sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
              Preview the executive company report.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70">
              Clear visual benchmarks, actionable insights, and a leadership heatmap for
              organization-wide alignment.
            </p>
            <ul className="mt-8 space-y-3.5">
              {REPORT_HIGHLIGHTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink/80">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <Link href={ROUTES.sampleReport} className={`${PRIMARY_CTA} mt-9`}>
              {CTA.sample}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 4a. LEARNING: the course written from your results, and the certificate */}
      <section id="learning" className="scroll-mt-4 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <Reveal y={16} className="lg:col-span-5">
              <Kicker>PrismScore courses</Kicker>
              <h2 className="mt-5 text-4xl sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
                Then close the gaps it found.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70">
                Your score becomes a course. PrismScore writes it from your own answers: one module per weak
                area, in your industry and role, ready minutes after you finish.
              </p>
              <Link href={ROUTES.start} className={`${PRIMARY_CTA} mt-8`}>
                {CTA.start}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <Reveal y={16} delay={0.05} className="lg:col-span-7">
              <ul className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Written from your results', 'Modules target your weakest dimensions; executives get a course from their own C-level gaps.'],
                  ['Read it or present it', 'Every lesson as text or slides, with diagrams where a process needs one.'],
                  ['Workshops and graded quizzes', 'Each module ends with something real for your company and a quiz: 70% to pass, three attempts.'],
                  ['A certificate anyone can check', 'Finish every lesson and quiz to earn a certificate with a number that can be verified online.'],
                ].map(([title, body]) => (
                  <li key={title} className="rounded-2xl border border-ink/10 bg-white p-6">
                    <div className="font-bold text-ink">{title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{body}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-ink/60">
                Share your company course with your whole team, and{' '}
                <Link href="/verify" className="font-semibold text-ink underline underline-offset-2">verify a certificate</Link> any time.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4b. WHY PRISMSCORE */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <ParallaxImage src="/images/why-staircase.png" className="object-[75%_center]" />
        <div
          className="absolute inset-0 -z-10 bg-ink/70 md:bg-transparent md:bg-gradient-to-r md:from-ink md:via-ink/80 md:to-transparent"
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <Reveal y={16} className="max-w-xl">
            <Kicker dark>Why PrismScore</Kicker>
            <h2 className="mt-5 text-4xl sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em]">
              More than a score.
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/75">
              A company assessment that reveals AI readiness, leadership alignment, and
              adoption risks.
            </p>
            <ul className="mt-9 space-y-7">
              {WHY_POINTS.map(({ icon: Icon, title, detail }, i) => (
                <motion.li
                  key={title}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-brand-300 backdrop-blur-sm">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-base font-bold">{title}</span>
                    <span className="mt-0.5 block text-[15px] text-white/70">{detail}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 5. METHODOLOGY — THE PUBLISHED SCORING FORMULA */}
      <section id="scoring-formula" className="scroll-mt-4 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal y={20}>
            <div className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-10 lg:p-14 shadow-[0_24px_60px_-40px_rgba(21,19,41,0.4)]">
              <FormulaPlayground />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. FREE PRISMSCORE VS. FULL EXECUTIVE REPORT */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <Reveal y={16} className="lg:col-span-4">
            <Kicker>Free vs. full</Kicker>
            <h2 className="mt-5 text-4xl sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
              Free PrismScore vs. Full Executive Report.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/70">
              Choose the option that fits your needs and level of detail.
            </p>
          </Reveal>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Free Assessment', price: '$0', full: false },
              { name: 'Full Report', price: `$${ASSESSMENT.fullReportPrice}`, full: true },
            ].map((plan, pIdx) => (
              <Reveal key={plan.name} y={16} delay={0.06 * pIdx} className="flex">
                <div
                  className={`relative w-full overflow-hidden rounded-2xl p-6 sm:p-7 flex flex-col ${
                    plan.full
                      ? 'bg-ink text-white shadow-[0_30px_60px_-30px_rgba(76,53,222,0.7)]'
                      : 'bg-white border border-ink/10 text-ink'
                  }`}
                >
                  {plan.full && (
                    <>
                      <div className="spectrum-flow absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" />
                      <div
                        className="animate-glow pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-600/30 blur-3xl"
                        aria-hidden="true"
                      />
                    </>
                  )}
                  <h3 className={`relative text-sm font-semibold ${plan.full ? 'text-white/80' : 'text-ink/70'}`}>
                    {plan.name}
                  </h3>
                  <div className="relative mt-3 text-5xl font-bold tracking-[-0.04em] tabular-nums">{plan.price}</div>
                  {plan.full && (
                    <p className="relative mt-2 text-sm text-white/70">One-time, per company. Unlock after your free score.</p>
                  )}
                  <ul className="relative mt-7 space-y-3 flex-1">
                    {COMPARISON_ROWS.map((row) => {
                      const included = plan.full || row.free;
                      return (
                        <li
                          key={row.feature}
                          className={`flex items-start gap-3 text-[15px] ${
                            included ? (plan.full ? 'text-white/90' : 'text-ink/85') : 'text-ink/65'
                          }`}
                        >
                          {included ? (
                            <Check
                              className={`w-4 h-4 mt-0.5 shrink-0 ${plan.full ? 'text-brand-300' : 'text-brand-600'}`}
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
                    href={ROUTES.start}
                    className={
                      plan.full
                        ? `group relative mt-8 inline-flex items-center justify-center gap-2.5 rounded-xl bg-brand-200 px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-white ${FOCUS_RING_DARK}`
                        : `${PRIMARY_CTA} mt-8`
                    }
                  >
                    {plan.full ? 'Start free, upgrade after your score' : CTA.start}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="scroll-mt-4 pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <Reveal y={16} className="lg:col-span-4">
            <Kicker>FAQ</Kicker>
            <h2 className="mt-5 text-4xl sm:text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">
              Common questions.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/70">
              Quick answers to common questions about PrismScore.
            </p>
          </Reveal>

          <Reveal y={16} delay={0.08} className="lg:col-span-8">
            <div className="rounded-2xl border border-ink/10 bg-white px-2 sm:px-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                const panelId = `faq-panel-${idx}`;
                return (
                  <div key={faq.q} className={idx > 0 ? 'border-t border-ink/10' : ''}>
                    <h3>
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? panelId : undefined}
                        className={`w-full text-left px-4 py-5 flex items-start justify-between gap-6 rounded-xl text-base sm:text-[17px] font-semibold text-ink transition-colors hover:text-brand-700 ${FOCUS_RING}`}
                      >
                        <span>{faq.q}</span>
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isOpen ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink/20 text-ink/60'
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
                          <p className="px-4 pb-6 pr-14 max-w-2xl text-[15px] leading-relaxed text-ink/70">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8. CLOSING BAND */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <ParallaxImage src="/images/cta-monolith.png" className="object-[70%_center]" />
        <div
          className="absolute inset-0 -z-10 bg-ink/60 md:bg-transparent md:bg-gradient-to-r md:from-ink md:via-ink/75 md:to-transparent"
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <Reveal y={16} className="max-w-xl">
            <h2 className="text-4xl sm:text-5xl font-extrabold leading-[1.04] tracking-[-0.04em]">
              Benchmark your organization’s AI readiness in {ASSESSMENT.minutes} minutes.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">
              Take the {ASSESSMENT.questions}-question company assessment now and get your score out of {ASSESSMENT.maxScore}
              and your readiness band straight away.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3.5">
              <Link href={ROUTES.start} className={VIOLET_CTA}>
                {CTA.start}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href={ROUTES.sampleReport} className={GHOST_CTA}>
                {CTA.sample}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
    </MotionConfig>
  );
}
