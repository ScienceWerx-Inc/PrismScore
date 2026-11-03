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
        <Users className="w-8 h-8 text-purple-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm">Loading 360 Staff Diagnostic...</p>
      </div>
    );
  }

  const { canLaunch360, cLevelCount, minExecutiveThreshold, totalStaffInvited, totalStaffCompleted, anonymityThreshold, visibleDepartments, comparison } = data;

  const isEligible = canLaunch360 || overrideLaunch;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Phase 3 Diagnostic
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Frontline Workforce & Management Survey
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              360 Staff Assessment & Ground-Truth Diagnostic
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-sm"
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
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* C-Level Launch Prerequisite Banner */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isEligible ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              {isEligible ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-700">
                  360 Launch Requirement:
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isEligible ? 'Requirement Met' : 'Pending C-Level Completions'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Specification: Admin can launch the 360 only after the C-level phase has at least <strong>{minExecutiveThreshold}</strong> completions, or by explicit override. (Currently <strong>{cLevelCount}</strong> executive completions).
              </p>
            </div>
          </div>

          {!canLaunch360 && (
            <button
              onClick={() => setOverrideLaunch(!overrideLaunch)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
            >
              {overrideLaunch ? 'Cancel Admin Override' : 'Explicit Admin Override'}
            </button>
          )}
        </div>

        {/* CSV Upload / Paste Drawer */}
        {showCsvBox && (
          <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-600" />
                Bulk Invite Staff & Managers (CSV Format)
              </h3>
              <span className="text-xs text-slate-400">Format: Name, Email, Department</span>
            </div>

            <form onSubmit={handleBulkInvite} className="space-y-4">
              <textarea
                rows={4}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Name, email@company.com, Department"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCsvBox(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
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
        <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-900">Anonymity Threshold Rule Enforced: </strong>
            To protect employee psychological safety, results are presented only for departmental groups with at least <strong>{anonymityThreshold} respondents</strong>. Groups with fewer than 5 members are automatically aggregated together so individual answers can never be exposed.
          </div>
        </div>

        {/* SIDE-BY-SIDE COMPARISON: STAFF VS C-LEVEL */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Staff Ground Truth vs. C-Level Leadership Perceptions
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Directly highlights organizational blind spots, policy discrepancies, and latent readiness.
            </p>
          </div>

          <div className="space-y-4">
            {comparison.map((row: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-200 transition-all space-y-3"
              >
                <div className="font-bold text-slate-900 text-sm">{row.metric}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-100">
                    <span className="font-semibold text-blue-900 block mb-1">
                      C-Level Executive Perception:
                    </span>
                    <span className="text-blue-800">{row.cLevelPerception}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50/80 border border-purple-100">
                    <span className="font-semibold text-purple-900 block mb-1">
                      Frontline Staff Ground Truth:
                    </span>
                    <span className="text-purple-800">{row.staffReality}</span>
                  </div>
                </div>

                <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                  <strong>Diagnostic Finding:</strong> {row.gap}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DEPARTMENTAL BREAKDOWN (WITH ANONYMITY THRESHOLD ENFORCED) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Departmental Adoption & Training Satisfaction
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Anonymity threshold applied ({anonymityThreshold}+ respondents per group).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              Total Staff Responded: {totalStaffCompleted}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Respondents</th>
                  <th className="py-3 px-4">Weekly AI Usage</th>
                  <th className="py-3 px-4">Felt Adequately Trained</th>
                  <th className="py-3 px-4">Clear on Approved Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleDepartments.map((dept: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{dept.department}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                        {dept.respondentCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{dept.aiUsageFrequency}</td>
                    <td className="py-3.5 px-4 text-amber-700 font-medium">{dept.trainingSatisfaction}</td>
                    <td className="py-3.5 px-4 text-slate-700">{dept.policyAwareness}</td>
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

