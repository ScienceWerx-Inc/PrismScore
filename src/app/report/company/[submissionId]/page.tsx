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
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm">Generating your PrismScore Report...</p>
      </div>
    );
  }

  if (!submission || !result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <p className="text-slate-700 font-semibold mb-4">Report not found or not yet scored.</p>
        <Link href="/" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  const isPaid = company?.planStatus === 'PAID';

  const bandColors: Record<string, { bg: string; text: string; border: string }> = {
    Unaware: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    Exploring: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Established: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'AI-led': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  const currentBandStyle = bandColors[result.band] || bandColors.Exploring;

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Print / Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                Official PrismScore™ Result
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                Generated {new Date(submission.completedAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl mt-1">
              {company?.name || 'Company'} PrismScore™ Executive Report
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Print / Save PDF
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-sm"
            >
              Go to Leadership Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* FREE SCORE CARD (Always Visible) */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Score circle */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900 text-white text-center shadow-inner">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Official PrismScore™
              </span>
              <div className="text-6xl font-black tracking-tighter text-blue-400">
                {result.totalScore}
              </div>
              <div className="text-sm font-medium text-slate-400 mt-1">out of 500 maximum points</div>

              <div
                className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${currentBandStyle.bg} ${currentBandStyle.text} border ${currentBandStyle.border}`}
              >
                Readiness Band: {result.band}
              </div>

              <p className="text-xs text-slate-400 mt-4 max-w-xs leading-relaxed">
                Self-reported assessment based on 25 operational questions across 5 dimensions.
              </p>
            </div>

            {/* Dimensional Bars */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Dimension Performance Breakdown
              </h3>

              {Object.entries(result.perDimensionPercentages).map(([dimKey, pct]) => {
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
                      <span className="text-slate-700">{names[dimKey] || dimKey}</span>
                      <span className={pct >= 60 ? 'text-brand-600' : 'text-amber-600'}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
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
            </div>
          </div>
        </div>

        {/* UPGRADE TEASER (If not paid) */}
        {!isPaid && (
          <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white border border-brand-800 shadow-xl no-print">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Full Executive Deliverable
                </div>
                <h3 className="text-2xl font-bold">Unlock the Complete Paid Company Report</h3>
                <p className="text-sm text-slate-300 max-w-xl">
                  Includes in-depth strengths & critical gaps, prioritized action roadmaps with score impact estimates, all 25 response audits, and unblocks unlimited C-level executive invitations.
                </p>
              </div>

              <button
                onClick={() => setCheckoutModal(true)}
                className="px-8 py-4 rounded-xl font-bold bg-white text-brand-900 hover:bg-brand-50 shadow-lg shadow-black/20 text-sm flex-shrink-0 transition-transform active:scale-95"
              >
                Unlock Full Report — $149
              </button>
            </div>
          </div>
        )}

        {/* FULL PAID REPORT CONTENT */}
        <div className={`space-y-8 ${!isPaid ? 'opacity-30 blur-[2px] pointer-events-none select-none' : ''}`}>
          {/* Key Strengths & Critical Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-emerald-100 text-emerald-800 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3>Key Organizational Strengths</h3>
              </div>
              {result.strengths && result.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {result.strengths.map((str, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">
                  Scores indicate early-stage maturity across all 5 dimensions. Foundational training is recommended.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-rose-200/80 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-rose-100 text-rose-800 font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3>Critical Gaps & Vulnerabilities</h3>
              </div>
              {result.gaps && result.gaps.length > 0 ? (
                <ul className="space-y-3">
                  {result.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-600 font-medium">
                  No critical low-scoring dimensions detected (&gt;40% across all areas).
                </p>
              )}
            </div>
          </div>

          {/* Priority Actions */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">
                  Prioritized Action Roadmap (High ROI Next Steps)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {result.priorityActions?.length || 0} recommendations
              </span>
            </div>

            <div className="space-y-4">
              {result.priorityActions?.map((act, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-200 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {i + 1}. {act.action}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                      Score Impact: {act.scoreImpact}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Why it matters:</strong> {act.whyItMatters}
                  </p>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <span className="font-bold text-brand-600">Next Step:</span>
                    <span>{act.nextStep}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full 25-Question Response Audit */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
              <FileText className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Complete Response Audit Log</h3>
                <p className="text-xs text-slate-500">
                  Every response recorded during the company assessment.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {submission.responses && submission.responses.length > 0 ? (
                submission.responses.map((resp: any, idx: number) => (
                  <div key={resp.id || idx} className="py-3 text-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">
                        Q{idx + 1}. {resp.question?.text || `Question ${idx + 1}`}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        Recorded
                      </span>
                    </div>
                    <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      "{resp.option?.text || 'Response recorded'}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-3">All responses audited and scored.</p>
              )}
            </div>
          </div>
        </div>

        {/* CHECKOUT MODAL */}
        {checkoutModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 border border-brand-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Unlock Complete Company Report
              </h3>
              <p className="text-xs text-slate-600 mt-1 mb-6">
                One-time company license for {company?.name}. Covers unlimited C-level executive invites and exportable PDF reports.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 space-y-2 text-xs">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Full Executive Report & PDF</span>
                  <span>$149.00</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>C-Level Alignment Heatmap Access</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
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
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
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
