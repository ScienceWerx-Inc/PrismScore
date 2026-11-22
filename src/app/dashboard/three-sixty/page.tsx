'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ArrowRight,
  TrendingUp,
  BarChart2,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ThreeSixtyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overrideLaunch, setOverrideLaunch] = useState(false);
  const [csvText, setCsvText] = useState(
    'Amelia Cole, amelia.c@company.com, Engineering\nLiam Bennett, liam.b@company.com, Engineering\nSophia Rodriguez, sophia.r@company.com, Marketing\nNoah Campbell, noah.c@company.com, Operations'
  );
  const [showCsvBox, setShowCsvBox] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/three-sixty');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load 360 overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const lines = csvText.split('\n');
      const invites = [];
      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2 && parts[1]) {
          invites.push({
            name: parts[0],
            email: parts[1],
            department: parts[2] || 'General',
          });
        }
      }

      const res = await fetch('/api/three-sixty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_invite',
          companyId: 'demo-company-vanguard',
          invites,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setSuccessMsg(`Sent ${resData.count} staff invitations.`);
        setShowCsvBox(false);
        fetchOverview();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (e) {
      alert('Error parsing CSV');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Users className="w-8 h-8 text-purple-300 animate-spin mb-4" />
        <p className="text-white/65 text-sm">Loading 360 Staff Diagnostic...</p>
      </div>
    );
  }

  const { canLaunch360, cLevelCount, minExecutiveThreshold, totalStaffInvited, totalStaffCompleted, anonymityThreshold, visibleDepartments, comparison } = data;

  const isEligible = canLaunch360 || overrideLaunch;

  return (
    <div className="flex-1 bg-white/[0.03] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/25">
                Phase 3 Diagnostic
              </span>
              <span className="text-xs text-white/50 font-medium">
                Frontline Workforce & Management Survey
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              360 Staff Assessment & Ground-Truth Diagnostic
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white/75 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 transition-colors shadow-sm"
            >
              Back to C-Level Dashboard
            </Link>

            <button
              onClick={() => setShowCsvBox(!showCsvBox)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Invite Staff by CSV
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/25 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* C-Level Launch Prerequisite Banner */}
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isEligible ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/25' : 'bg-amber-400/10 text-amber-300 border border-amber-400/25'
              }`}
            >
              {isEligible ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-white/75">
                  360 Launch Requirement:
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isEligible ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'
                  }`}
                >
                  {isEligible ? 'Requirement Met' : 'Pending C-Level Completions'}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Specification: Admin can launch the 360 only after the C-level phase has at least <strong>{minExecutiveThreshold}</strong> completions, or by explicit override. (Currently <strong>{cLevelCount}</strong> executive completions).
              </p>
            </div>
          </div>

          {!canLaunch360 && (
            <button
              onClick={() => setOverrideLaunch(!overrideLaunch)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.03] hover:bg-white/10 text-white/75"
            >
              {overrideLaunch ? 'Cancel Admin Override' : 'Explicit Admin Override'}
            </button>
          )}
        </div>

        {/* CSV Upload / Paste Drawer */}
        {showCsvBox && (
          <div className="bg-white/[0.04] rounded-2xl p-6 border border-purple-400/25 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-300" />
                Bulk Invite Staff & Managers (CSV Format)
              </h3>
              <span className="text-xs text-white/40">Format: Name, Email, Department</span>
            </div>

            <form onSubmit={handleBulkInvite} className="space-y-4">
              <textarea
                rows={4}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Name, email@company.com, Department"
                className="w-full p-3 font-mono text-xs rounded-xl border border-white/15 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCsvBox(false)}
                  className="px-4 py-2 text-xs font-semibold text-white/65 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-sm"
                >
                  {inviting ? 'Sending...' : 'Send Staff Invitations'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ANONYMITY THRESHOLD SAFEGUARD NOTICE */}
        <div className="p-4 rounded-xl bg-purple-400/10 border border-purple-400/25 text-xs text-purple-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-200">Anonymity Threshold Rule Enforced: </strong>
            To protect employee psychological safety, results are presented only for departmental groups with at least <strong>{anonymityThreshold} respondents</strong>. Groups with fewer than 5 members are automatically aggregated together so individual answers can never be exposed.
          </div>
        </div>

        {/* SIDE-BY-SIDE COMPARISON: STAFF VS C-LEVEL */}
        <div className="bg-white/[0.04] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-sm">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-300" />
              <h2 className="text-lg font-bold text-white">
                Staff Ground Truth vs. C-Level Leadership Perceptions
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Directly highlights organizational blind spots, policy discrepancies, and latent readiness.
            </p>
          </div>

          <div className="space-y-4">
            {comparison.map((row: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-brand-400/25 transition-all space-y-3"
              >
                <div className="font-bold text-white text-sm">{row.metric}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-blue-400/10 border border-blue-400/15">
                    <span className="font-semibold text-blue-200 block mb-1">
                      C-Level Executive Perception:
                    </span>
                    <span className="text-blue-200">{row.cLevelPerception}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-400/10 border border-purple-400/15">
                    <span className="font-semibold text-purple-200 block mb-1">
                      Frontline Staff Ground Truth:
                    </span>
                    <span className="text-purple-200">{row.staffReality}</span>
                  </div>
                </div>

                <div className="text-xs text-amber-200 bg-amber-400/10 p-2.5 rounded-lg border border-amber-400/25 font-medium">
                  <strong>Diagnostic Finding:</strong> {row.gap}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DEPARTMENTAL BREAKDOWN (WITH ANONYMITY THRESHOLD ENFORCED) */}
        <div className="bg-white/[0.04] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-bold text-white">
                Departmental Adoption & Training Satisfaction
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Anonymity threshold applied ({anonymityThreshold}+ respondents per group).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white/[0.06] text-white/75">
              Total Staff Responded: {totalStaffCompleted}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-white/75 font-bold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Respondents</th>
                  <th className="py-3 px-4">Weekly AI Usage</th>
                  <th className="py-3 px-4">Felt Adequately Trained</th>
                  <th className="py-3 px-4">Clear on Approved Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {visibleDepartments.map((dept: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/[0.06]">
                    <td className="py-3.5 px-4 font-bold text-white">{dept.department}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-purple-400/10 text-purple-300 border border-purple-400/25 font-bold">
                        {dept.respondentCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-white/75">{dept.aiUsageFrequency}</td>
                    <td className="py-3.5 px-4 text-amber-300 font-medium">{dept.trainingSatisfaction}</td>
                    <td className="py-3.5 px-4 text-white/75">{dept.policyAwareness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

