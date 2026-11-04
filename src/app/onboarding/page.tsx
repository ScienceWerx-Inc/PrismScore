'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function OnboardingPage() {
  const router = useRouter();

  // Company details
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Software & Technology');
  const [sizeBand, setSizeBand] = useState('11-50 employees');
  const [country, setCountry] = useState('United States');

  // Headcount of C-Level leaders
  const [clevelCount, setClevelCount] = useState<number>(3);
  const [skipExecs, setSkipExecs] = useState(false);

  // Dynamic executive rows (preserves data when count changes)
  const [executives, setExecutives] = useState<ExecutiveRow[]>([
    { id: '1', name: '', email: '', role: 'CTO' },
    { id: '2', name: '', email: '', role: 'CFO' },
    { id: '3', name: '', email: '', role: 'COO' },
  ]);

  // Admin details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
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
    if (!adminName.trim() || !adminEmail.trim()) {
      setError('Please provide your administrator name and email.');
      return;
    }

    setLoading(true);

    try {
      const filteredExecs = skipExecs
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
          adminRole,
          alsoTakesClevel,
          executives: filteredExecs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete setup.');
      }

      // Save active session in local storage for navigation
      localStorage.setItem('activeCompanyId', data.companyId);
      localStorage.setItem('activeCompanyName', companyName);
      localStorage.setItem('activeUserId', data.userId);
      localStorage.setItem('activeSubmissionId', data.submissionId);

      // Redirect directly to company assessment
      router.push(`/assessment/company?submissionId=${data.submissionId}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Step 1 of 2: PrismScore™ Setup
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Company & Leadership Onboarding
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Configure your organization profile and set up your confidential Prism C-level diagnostic.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Company Profile */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">1. Company Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Legal or Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Innovations Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
                >
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Headcount Size
                </label>
                <select
                  value={sizeBand}
                  onChange={(e) => setSizeBand(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
                >
                  <option value="1-10 employees">1–10 employees</option>
                  <option value="11-50 employees">11–50 employees</option>
                  <option value="51-200 employees">51–200 employees</option>
                  <option value="201-500 employees">201–500 employees</option>
                  <option value="500+ employees">500+ employees</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Country of Primary Operations
                </label>
                <input
                  type="text"
                  placeholder="e.g. United States, United Kingdom, Germany"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Initiator / Admin Account */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">2. Assessment Initiator / Admin</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Vance"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="elena@company.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Leadership Title
                </label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
                >
                  <option value="CEO">Chief Executive Officer (CEO)</option>
                  <option value="CTO">Chief Technology Officer (CTO)</option>
                  <option value="CFO">Chief Financial Officer (CFO)</option>
                  <option value="COO">Chief Operating Officer (COO)</option>
                  <option value="CHRO">Chief Human Resources Officer (CHRO)</option>
                  <option value="Consultant">External Consultant / Advisor</option>
                  <option value="Operations Lead">Operations Lead / Chief of Staff</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoTakesClevel}
                    onChange={(e) => setAlsoTakesClevel(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>I will also take the C-level executive assessment</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: C-Level Team Onboarding */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">3. C-Level Executive Team</h2>
                  <p className="text-xs text-slate-500">
                    Enter your leadership team to send confidential C-level diagnostic invitations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSkipExecs(!skipExecs)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 underline self-start sm:self-auto"
              >
                {skipExecs ? 'Re-enable adding executives' : 'Add later (skip without losing data)'}
              </button>
            </div>

            {!skipExecs && (
              <>
                <div className="mb-6 p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-sm text-purple-950">
                      How many C-level leaders are in your company?
                    </span>
                    <p className="text-xs text-purple-700 mt-0.5">
                      Changing this number dynamically updates rows while preserving entered details.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={clevelCount}
                      onChange={(e) => handleHeadcountChange(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 rounded-lg border border-purple-300 text-center font-bold text-purple-900 text-base focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-xs text-purple-600 font-medium">executives</span>
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
                          placeholder="Executive Name"
                          value={exec.name}
                          onChange={(e) => handleExecChange(idx, 'name', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <input
                          type="email"
                          placeholder="executive@company.com"
                          value={exec.email}
                          onChange={(e) => handleExecChange(idx, 'email', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <select
                          value={exec.role}
                          onChange={(e) => handleExecChange(idx, 'role', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
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

            {skipExecs && (
              <div className="p-4 rounded-xl bg-slate-100 text-slate-600 text-xs">
                You can invite your C-level executives anytime from your company dashboard after finishing the company assessment.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Initializing...'
              ) : (
                <>
                  Proceed to Company Assessment (25 Qs)
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

