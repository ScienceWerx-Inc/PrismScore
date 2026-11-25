'use client';

import { ASSESSMENT } from '@/lib/product';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  ShieldCheck,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ExecutiveRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

const LABEL = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5';
const FIELD =
  'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white';

export default function OnboardingPage() {
  const router = useRouter();

  // Company details
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Software & Technology');
  const [sizeBand, setSizeBand] = useState('11-50 employees');
  const [country, setCountry] = useState('United States');

  // Headcount of C-Level leaders
  const [clevelCount, setClevelCount] = useState<number>(3);
  const [inviteTeamNow, setInviteTeamNow] = useState(false);

  // Dynamic executive rows (preserves data when count changes)
  const [executives, setExecutives] = useState<ExecutiveRow[]>([
    { id: '1', name: '', email: '', role: 'CTO' },
    { id: '2', name: '', email: '', role: 'CFO' },
    { id: '3', name: '', email: '', role: 'COO' },
  ]);

  // Admin details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminRole, setAdminRole] = useState('CEO');
  const [alsoTakesClevel, setAlsoTakesClevel] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update headcount and preserve entered data
  const handleHeadcountChange = (newCount: number) => {
    const validCount = Math.max(0, Math.min(25, newCount));
    setClevelCount(validCount);

    setExecutives((prev) => {
      if (validCount > prev.length) {
        const defaultRoles = ['CTO', 'CFO', 'COO', 'CMO', 'CHRO', 'CIO', 'Other'];
        const additions: ExecutiveRow[] = [];
        for (let i = prev.length; i < validCount; i++) {
          additions.push({
            id: String(i + 1),
            name: '',
            email: '',
            role: defaultRoles[i % defaultRoles.length] || 'Other',
          });
        }
        return [...prev, ...additions];
      } else {
        return prev.slice(0, validCount);
      }
    });
  };

  const handleExecChange = (index: number, field: keyof ExecutiveRow, value: string) => {
    setExecutives((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError('Please provide your company name.');
      return;
    }
    if (!adminEmail.trim()) {
      setError('Please provide your work email.');
      return;
    }

    if (password.length < 10) {
      setError('Choose a password of at least 10 characters.');
      return;
    }

    setLoading(true);

    try {
      const filteredExecs = !inviteTeamNow
        ? []
        : executives.filter((ex) => ex.name.trim() || ex.email.trim());

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry,
          sizeBand,
          country,
          adminName,
          adminEmail,
          password,
          adminRole,
          alsoTakesClevel,
          executives: filteredExecs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete setup.');
      }

      // The response set the session cookie; the server knows the company from it.
      // Redirect directly to company assessment
      router.push(`/assessment/company?submissionId=${data.submissionId}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-paper flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Step 1 of 2: Confidential Diagnostic Setup
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Get your company’s AI readiness score
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Complete the {ASSESSMENT.questions}-question baseline assessment to benchmark your organization across {ASSESSMENT.dimensions} dimensions and get your free score and readiness band straight away.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Confidential & Non-Disclosive
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {ASSESSMENT.minutes} minutes
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Instant Free Score Report
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: the essentials */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">1. Your company</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label htmlFor="ob-company" className={LABEL}>
                  Company name *
                </label>
                <input
                  id="ob-company"
                  type="text"
                  required
                  autoComplete="organization"
                  placeholder="e.g. Apex Innovations Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={FIELD}
                />
              </div>

              <div>
                <label htmlFor="ob-industry" className={LABEL}>
                  Industry
                </label>
                <select id="ob-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={FIELD}>
                  <option value="Software & Technology">Software & Technology</option>
                  <option value="Financial & Professional Services">Financial & Professional Services</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                  <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                  <option value="Retail & E-commerce">Retail & E-commerce</option>
                  <option value="Media, Marketing & Agency">Media, Marketing & Agency</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="ob-email" className={LABEL}>
                  Work email *
                </label>
                <input
                  id="ob-email"
                  type="email"
                  required
                  autoComplete="email"
                  aria-describedby="ob-email-hint"
                  placeholder="you@company.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={FIELD}
                />
                <span id="ob-email-hint" className="text-[11px] text-slate-500 mt-1 block">
                  Used only to save your results and give you access to your score.
                </span>
              </div>
              <div>
                <label htmlFor="ob-password" className={LABEL}>
                  Password *
                </label>
                <input
                  id="ob-password"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  aria-describedby="ob-password-hint"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={FIELD}
                />
                <span id="ob-password-hint" className="text-[11px] text-slate-500 mt-1 block">
                  At least 10 characters. You will use it to come back to your results.{' '}
                  <Link href="/sign-in" className="text-brand-700 underline">Already have an account?</Link>
                </span>
              </div>
            </div>

            {/* Everything else is optional and has sensible defaults */}
            <details className="group mt-6 border-t border-slate-100 pt-4">
              <summary className="cursor-pointer select-none list-none text-sm font-semibold text-brand-700 hover:text-brand-600 flex items-center gap-2">
                <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span>
                More details (optional)
              </summary>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="ob-name" className={LABEL}>
                    Your name
                  </label>
                  <input
                    id="ob-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Elena Vance"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className={FIELD}
                  />
                </div>

                <div>
                  <label htmlFor="ob-role" className={LABEL}>
                    Your title
                  </label>
                  <select id="ob-role" value={adminRole} onChange={(e) => setAdminRole(e.target.value)} className={FIELD}>
                    <option value="CEO">Chief Executive Officer (CEO)</option>
                    <option value="CTO">Chief Technology Officer (CTO)</option>
                    <option value="CFO">Chief Financial Officer (CFO)</option>
                    <option value="COO">Chief Operating Officer (COO)</option>
                    <option value="CHRO">Chief Human Resources Officer (CHRO)</option>
                    <option value="Consultant">External Consultant / Advisor</option>
                    <option value="Operations Lead">Operations Lead / Chief of Staff</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ob-size" className={LABEL}>
                    Headcount
                  </label>
                  <select id="ob-size" value={sizeBand} onChange={(e) => setSizeBand(e.target.value)} className={FIELD}>
                    <option value="1-10 employees">1–10 employees</option>
                    <option value="11-50 employees">11–50 employees</option>
                    <option value="51-200 employees">51–200 employees</option>
                    <option value="201-500 employees">201–500 employees</option>
                    <option value="500+ employees">500+ employees</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ob-country" className={LABEL}>
                    Country of primary operations
                  </label>
                  <input
                    id="ob-country"
                    type="text"
                    autoComplete="country-name"
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={FIELD}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alsoTakesClevel}
                      onChange={(e) => setAlsoTakesClevel(e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-600"
                    />
                    <span>I will also take the C-level executive assessment</span>
                  </label>
                </div>
              </div>
            </details>
          </div>

          {/* Section 3: C-Level Team Onboarding (Optional) */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">2. Your C-level team</h2>
                    <span className="text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Invite your executive peers now, or easily add them from your dashboard after seeing your company score.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInviteTeamNow(!inviteTeamNow)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all ${
                  inviteTeamNow
                    ? 'bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {inviteTeamNow ? 'Skip for now (add after score)' : '+ Add leadership team now'}
              </button>
            </div>

            {!inviteTeamNow ? (
              <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-brand-950 font-medium">
                  <strong>Recommended:</strong> Complete your {ASSESSMENT.questions} questions first to get your company baseline, then invite your C-level team to uncover alignment gaps and blind spots.
                </div>
                <button
                  type="button"
                  onClick={() => setInviteTeamNow(true)}
                  className="text-xs font-bold text-brand-700 hover:text-brand-900 underline whitespace-nowrap self-start sm:self-auto"
                >
                  Enter executives now instead
                </button>
              </div>
            ) : (
              <>
                {/* Inline Confidentiality and Trust Callout */}
                <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-slate-800">Confidentiality Guarantee:</strong> Zero spam. No invitation emails are dispatched until you finish and review your assessment. Individual C-level responses remain confidential to ensure candid, authentic self-reporting.
                  </div>
                </div>

                <div className="mb-5 p-4 rounded-xl bg-brand-50/60 border border-brand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-sm text-brand-950">
                      How many C-level leaders are in your company?
                    </span>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Changing this number dynamically updates rows while preserving entered details.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      aria-label="Number of C-level leaders"
                      min={1}
                      max={20}
                      value={clevelCount}
                      onChange={(e) => handleHeadcountChange(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 rounded-lg border border-brand-300 text-center font-bold text-brand-900 text-base focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-xs text-brand-600 font-medium">executives</span>
                  </div>
                </div>

                {/* Dynamic Executive Rows */}
                <div className="space-y-3">
                  {executives.map((exec, idx) => (
                    <div
                      key={exec.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                        <input
                          type="text"
                          aria-label={`Executive ${idx + 1} name`}
                          placeholder="Executive name"
                          value={exec.name}
                          onChange={(e) => handleExecChange(idx, 'name', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <input
                          type="email"
                          aria-label={`Executive ${idx + 1} work email`}
                          placeholder="executive@company.com"
                          value={exec.email}
                          onChange={(e) => handleExecChange(idx, 'email', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <select
                          aria-label={`Executive ${idx + 1} role`}
                          value={exec.role}
                          onChange={(e) => handleExecChange(idx, 'role', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="CTO">CTO (Technology)</option>
                          <option value="CFO">CFO (Finance)</option>
                          <option value="COO">COO (Operations)</option>
                          <option value="CMO">CMO (Marketing)</option>
                          <option value="CHRO">CHRO (People/HR)</option>
                          <option value="CIO">CIO (Information)</option>
                          <option value="Other">Other Executive</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  'Initializing...'
                ) : (
                  <>
                    Start the {ASSESSMENT.questions}-question assessment
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-500 font-medium text-center sm:text-right">
                Your free score out of {ASSESSMENT.maxScore} and readiness band appear as soon as you finish.
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

