'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Award,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  Users,
  Building2,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface ResultData {
  totalScore: number;
  band: string;
  perDimensionPercentages: Record<string, number>;
  strengths: string[];
  moderateGaps?: string[];
  criticalGaps?: string[];
  gaps: string[];
  priorityActions: Array<{
    dimension: string;
    action: string;
    whyItMatters: string;
    nextStep: string;
    scoreImpact: string;
  }>;
}

export default function CompanyReportPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<any>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    // 1. Instant synchronous hydration from client storage (resilient to serverless container switches)
    try {
      const cachedRaw =
        localStorage.getItem(`prism_report_${submissionId}`) ||
        sessionStorage.getItem(`prism_report_${submissionId}`) ||
        localStorage.getItem('prism_latest_report');

      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        const sub = parsed.submission || { id: submissionId, completedAt: new Date() };
        const comp = parsed.company || parsed.submission?.company || { name: 'Your Company', planStatus: 'FREE' };
        const res = parsed.scoringResult || parsed.result;

        if (res && res.totalScore !== undefined) {
          setSubmission(sub);
          setCompany(comp);
          setResult(res);
          setQuestions(sub.responses || []);
          setLoading(false);
        }
      }
    } catch (cacheErr) {
      console.warn('Local cache read notice:', cacheErr);
    }

    // 2. Fetch from server to sync DB records
    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/company/${submissionId}`);
        const data = await res.json();
        if (data.submission && data.result) {
          setSubmission(data.submission);
          setCompany(data.submission.company || { name: 'Your Company', planStatus: 'FREE' });
          setResult(data.result);
          setQuestions(data.questions || data.submission.responses || []);
          setLoading(false);

          // Update cache with confirmed server payload
          try {
            localStorage.setItem(
              `prism_report_${submissionId}`,
              JSON.stringify({
                submission: data.submission,
                scoringResult: data.result,
                company: data.submission.company,
              })
            );
          } catch {}
        }
      } catch (e) {
        console.error('Report server sync note:', e);
      } finally {
        setLoading(false);
      }
    }

    if (submissionId) {
      fetchReport();
    }
  }, [submissionId]);

  const handleUnlockPaid = async () => {
    if (!company) return;
    setUnlocking(true);
    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, amount: 149 }),
      });
      const data = await res.json();
      if (data.success) {
        setCompany((prev: any) => ({ ...prev, planStatus: 'PAID', paymentStatus: 'PAID' }));
        setCheckoutModal(false);
        // Re-fetch report from server to load full unlocked data
        try {
          const reportRes = await fetch(`/api/report/company/${submissionId}`);
          const reportData = await reportRes.json();
          if (reportData.submission && reportData.result) {
            setSubmission(reportData.submission);
            setResult(reportData.result);
            setQuestions(reportData.submission.responses || []);
          }
        } catch {}
      }
    } catch (e) {
      alert('Checkout error');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-300 animate-spin mb-4" />
        <p className="text-white/65 text-sm">Generating your PrismScore Report...</p>
      </div>
    );
  }

  if (!submission || !result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <p className="text-white/75 font-semibold mb-4">Report not found or not yet scored.</p>
        <Link href="/" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  const isPaid = (company?.planStatus || 'FREE').toUpperCase() === 'PAID';

  const bandColors: Record<string, { bg: string; text: string; border: string }> = {
    Unaware: { bg: 'bg-rose-400/10', text: 'text-rose-300', border: 'border-rose-400/25' },
    Exploring: { bg: 'bg-amber-400/10', text: 'text-amber-300', border: 'border-amber-400/25' },
    Established: { bg: 'bg-blue-400/10', text: 'text-blue-300', border: 'border-blue-400/25' },
    'AI-led': { bg: 'bg-emerald-400/10', text: 'text-emerald-300', border: 'border-emerald-400/25' },
  };

  const currentBandStyle = bandColors[result.band] || bandColors.Exploring;

  // Defensive parsing to guarantee safe rendering across client transitions
  const dimPercentages: Record<string, number> =
    typeof result?.perDimensionPercentages === 'string'
      ? JSON.parse(result.perDimensionPercentages)
      : (result?.perDimensionPercentages || {});

  return (
    <div className="flex-1 bg-white/[0.03] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Print / Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300 bg-brand-400/10 px-2 py-0.5 rounded border border-brand-400/25">
                Official PrismScore™ Result
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/50">
                Generated {new Date(submission.completedAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl mt-1">
              {company?.name || 'Company'} PrismScore™ Executive Report
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/75 bg-white/[0.04] border border-white/15 hover:bg-white/[0.06] transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-white/50" />
              Print / Save PDF
            </button>

            <Link
              href={`/dashboard?companyId=${company?.id || ''}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-sm"
            >
              Go to Leadership Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* FREE SCORE CARD (Always Visible) */}
        <div className="bg-white/[0.04] rounded-3xl p-6 sm:p-10 border border-white/10 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Score circle */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-ink-700 text-white text-center shadow-inner">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                Official PrismScore™
              </span>
              <div className="text-6xl font-black tracking-tighter text-blue-400">
                {result.totalScore}
              </div>
              <div className="text-sm font-medium text-white/40 mt-1">out of 500 maximum points</div>

              <div
                className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${currentBandStyle.bg} ${currentBandStyle.text} border ${currentBandStyle.border}`}
              >
                Readiness Band: {result.band}
              </div>

              <p className="text-xs text-white/40 mt-4 max-w-xs leading-relaxed">
                Self-reported assessment based on 25 operational questions across 5 dimensions.
              </p>
            </div>

            {/* Dimensional Bars */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">
                Dimension Performance Breakdown
              </h3>

              {Object.entries(dimPercentages).map(([dimKey, pct]) => {
                const names: Record<string, string> = {
                  STRATEGY: 'Strategy and Leadership (25%)',
                  USE_VALUE: 'Use and Value (20%)',
                  DATA_TECH: 'Data and Technology (20%)',
                  GOVERNANCE: 'Governance and Risk (20%)',
                  PEOPLE: 'People and Skills (15%)',
                };
                return (
                  <div key={dimKey} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white/75">{names[dimKey] || dimKey}</span>
                      <span className={pct >= 60 ? 'text-brand-300' : 'text-amber-300'}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 70
                            ? 'bg-emerald-500'
                            : pct >= 50
                            ? 'bg-brand-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Dimension Weight Defensibility Rationale */}
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <details className="text-xs text-white/50 group">
                  <summary className="font-semibold text-brand-300 hover:text-brand-300 cursor-pointer flex items-center gap-1 select-none">
                    <span>Why are dimensions weighted this way?</span>
                  </summary>
                  <div className="mt-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-[11px] text-white/65 leading-relaxed">
                    <p><strong className="text-white/90">Strategy & Leadership (25%):</strong> Executive mandate, capital allocation, and strategic prioritization dictate the success or failure of all enterprise AI initiatives.</p>
                    <p><strong className="text-white/90">Use & Value (20%):</strong> Measures tangible workflow deployment and commercial productivity, preventing AI from stalling as an unmeasured experiment.</p>
                    <p><strong className="text-white/90">Data & Technology (20%):</strong> Assesses internal data structuring, model vetting, and integration architecture required for reliable performance.</p>
                    <p><strong className="text-white/90">Governance & Risk (20%):</strong> Ensures acceptable use, trade secret protection, and copyright compliance before autonomous scaling.</p>
                    <p><strong className="text-white/90">People & Skills (15%):</strong> Measures prompt literacy and adoption; while critical, workforce execution depends upstream on executive permission, sanctioned tooling, and clear governance.</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* C-LEVEL TEAM DIAGNOSTIC NEXT STEP (Reciprocity Hook) */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-ink-800 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/60 shadow-lg no-print">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Next Step: Executive 360 Heatmap
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">Compare with Your C-Level Leadership Team</h3>
              <p className="text-xs sm:text-sm text-white/60 max-w-xl leading-relaxed">
                Your company baseline is {result.totalScore}/500. Do your CTO, CFO, and COO see your organization's AI capabilities the same way? Invite your leadership team to uncover alignment gaps and identify hidden resistance points.
              </p>
            </div>

            <Link
              href={`/dashboard?companyId=${company?.id || ''}`}
              className="px-6 py-3.5 rounded-xl font-bold bg-white/[0.04] text-purple-100 hover:bg-purple-400/10 shadow-md text-xs sm:text-sm flex-shrink-0 transition-transform active:scale-95 flex items-center gap-2"
            >
              Invite Leadership Team
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* UPGRADE TEASER (If not paid) */}
        {!isPaid && (
          <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-ink-800 rounded-3xl p-8 text-white border border-brand-800 shadow-xl no-print">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Full Executive Deliverable
                </div>
                <h3 className="text-2xl font-bold">Unlock the Complete Paid Company Report</h3>
                <p className="text-sm text-white/60 max-w-xl">
                  Includes in-depth strengths & critical gaps, prioritized action roadmaps with score impact estimates, all 25 response audits, and unblocks unlimited C-level executive invitations.
                </p>
              </div>

              <button
                onClick={() => setCheckoutModal(true)}
                className="px-8 py-4 rounded-xl font-bold bg-white/[0.04] text-brand-200 hover:bg-brand-400/10 shadow-lg shadow-black/20 text-sm flex-shrink-0 transition-transform active:scale-95"
              >
                Unlock Full Report — $149
              </button>
            </div>
          </div>
        )}

        {/* FULL EXECUTIVE REPORT CONTENT & PAYWALL GATE */}
        <div className="space-y-8">
          {/* Key Strengths & Operational Gaps (3-Tier Structure) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths (>=70%) */}
            <div className="bg-white/[0.04] rounded-2xl p-6 border border-emerald-400/25 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-400/15">
                <div className="flex items-center gap-2 text-emerald-200 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <h3>Key Organizational Strengths</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/25">
                  Established (&ge;70%)
                </span>
              </div>
              {result.strengths && result.strengths.length > 0 ? (
                <ul className="space-y-3 mt-1.5">
                  {result.strengths.map((str, i) => (
                    <li key={i} className="text-xs text-white/75 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/50">
                  Scores indicate early-stage maturity across all 5 dimensions. Foundational education recommended.
                </p>
              )}
            </div>

            {/* Gaps & Vulnerabilities (Critical <=40% & Moderate 41-69%) */}
            <div className="bg-white/[0.04] rounded-2xl p-6 border border-rose-400/25 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-rose-400/15">
                <div className="flex items-center gap-2 text-rose-200 font-bold">
                  <AlertTriangle className="w-5 h-5 text-rose-300" />
                  <h3>Operational Gaps & Vulnerabilities</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/25">
                  Action Required
                </span>
              </div>

              {/* Critical Gaps (<=40%) */}
              {result.criticalGaps && result.criticalGaps.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/25">
                    Critical Gaps (&le;40%)
                  </span>
                  <ul className="space-y-2 mt-1">
                    {result.criticalGaps.map((gap, i) => (
                      <li key={i} className="text-xs text-white/75 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 flex-shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Moderate Gaps (41%–69%) */}
              {result.moderateGaps && result.moderateGaps.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/25">
                    Moderate Gaps (41%–69%)
                  </span>
                  <ul className="space-y-2 mt-1">
                    {result.moderateGaps.map((gap, i) => (
                      <li key={i} className="text-xs text-white/75 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Legacy fallback */}
              {(!result.criticalGaps || result.criticalGaps.length === 0) &&
                (!result.moderateGaps || result.moderateGaps.length === 0) &&
                result.gaps &&
                result.gaps.length > 0 && (
                  <ul className="space-y-3">
                    {result.gaps.map((gap, i) => (
                      <li key={i} className="text-xs text-white/75 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                )}

              {(!result.criticalGaps || result.criticalGaps.length === 0) &&
                (!result.moderateGaps || result.moderateGaps.length === 0) &&
                (!result.gaps || result.gaps.length === 0) && (
                  <p className="text-xs text-emerald-300 font-medium">
                    No critical or moderate vulnerabilities detected (&ge;70% across all 5 dimensions).
                  </p>
                )}
            </div>
          </div>

          {/* Priority Actions */}
          <div className="bg-white/[0.04] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-bold text-white">
                  Prioritized Action Roadmap (High ROI Next Steps)
                </h3>
              </div>
              <span className="text-xs text-white/40 font-medium">
                {result.priorityActions?.length || 0} recommendation{(result.priorityActions?.length || 0) === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-4">
              {result.priorityActions?.map((act, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-brand-400/25 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white">
                      {i + 1}. {act.action}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-400/15 text-emerald-200 border border-emerald-400/40 self-start sm:self-auto">
                      Score Impact: {act.scoreImpact}
                    </span>
                  </div>

                  <p className="text-xs text-white/65">
                    <strong className="text-white/90">Why it matters:</strong> {act.whyItMatters}
                  </p>

                  <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white/75 flex items-start gap-2">
                    <span className="font-bold text-brand-300">Next Step:</span>
                    <span>{act.nextStep}</span>
                  </div>
                </div>
              ))}
            </div>

            {!isPaid && (
              <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-brand-400/10 to-indigo-400/10 border border-brand-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-200">
                    <Lock className="w-4 h-4 text-brand-300" />
                    <span>Detailed Implementation Roadmaps Locked</span>
                  </div>
                  <p className="text-xs text-white/65">
                    The free tier includes 1 high-impact action preview. Unlock the $149 full report for prioritized step-by-step playbooks across all 5 dimensions.
                  </p>
                </div>
                <button
                  onClick={() => setCheckoutModal(true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm flex-shrink-0"
                >
                  Unlock All Actions ($149)
                </button>
              </div>
            )}
          </div>

          {/* Full 25-Question Response Audit */}
          <div className="bg-white/[0.04] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-white/[0.06] gap-2">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-brand-300" />
                <div>
                  <h3 className="text-lg font-bold text-white">Response Audit Log</h3>
                  <p className="text-xs text-white/50">
                    {isPaid
                      ? 'Every response recorded during the company assessment (canonical question order).'
                      : 'Previewing 3 of 25 audited responses. Unlock full report to export complete audit log.'}
                  </p>
                </div>
              </div>

              {!isPaid && (
                <button
                  onClick={() => setCheckoutModal(true)}
                  className="text-xs font-bold text-brand-300 hover:text-brand-200 underline self-start sm:self-auto"
                >
                  Unlock all 25 responses
                </button>
              )}
            </div>

            <div className="divide-y divide-white/[0.06]">
              {submission.responses && submission.responses.length > 0 ? (
                submission.responses
                  .slice()
                  .sort((a: any, b: any) => {
                    const orderA = a.question?.order ?? 999;
                    const orderB = b.question?.order ?? 999;
                    return orderA - orderB;
                  })
                  .map((resp: any, idx: number) => {
                    const qNum = resp.question?.order || idx + 1;
                    return (
                      <div key={resp.id || idx} className="py-3 text-xs">
                        <div className="flex items-center justify-between text-white/50 mb-1">
                          <span className="font-semibold text-white/75">
                            Q{qNum}. {resp.question?.text || `Question ${qNum}`}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/25">
                            Recorded
                          </span>
                        </div>
                        <p className="text-white/65 italic bg-white/[0.03] p-2.5 rounded-lg border border-white/10">
                          "{resp.option?.text || 'Response recorded'}"
                        </p>
                      </div>
                    );
                  })
              ) : (
                <p className="text-xs text-white/50 py-3">All responses audited and scored.</p>
              )}
            </div>

            {!isPaid && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] text-center">
                <button
                  onClick={() => setCheckoutModal(true)}
                  className="text-xs font-bold text-brand-300 bg-brand-400/10 hover:bg-brand-400/15 px-4 py-2 rounded-xl border border-brand-400/25 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Unlock Remaining 22 Responses & Full PDF Export ($149)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CHECKOUT MODAL */}
        {checkoutModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/[0.04] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-brand-400/10 text-brand-300 flex items-center justify-center mb-4 border border-brand-400/25">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Unlock Complete Company Report
              </h3>
              <p className="text-xs text-white/65 mt-1 mb-6">
                One-time company license for {company?.name}. Covers unlimited C-level executive invites and exportable PDF reports.
              </p>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6 space-y-2 text-xs">
                <div className="flex justify-between font-medium text-white/65">
                  <span>Full Executive Report & PDF</span>
                  <span>$149.00</span>
                </div>
                <div className="flex justify-between font-medium text-white/65">
                  <span>C-Level Alignment Heatmap Access</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10 text-sm">
                  <span>Total Due</span>
                  <span>$149.00 USD</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleUnlockPaid}
                  disabled={unlocking}
                  className="w-full py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white text-sm shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {unlocking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirm & Unlock Report ($149)'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutModal(false)}
                  className="w-full py-2.5 text-xs font-semibold text-white/50 hover:text-white/90"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
