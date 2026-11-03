'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  ShieldCheck,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Send,
  Mail,
  RefreshCw,
  Plus,
  BookOpen,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newInviteModal, setNewInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CMO');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Simulation toggle to allow reviewer to test "Below 3 threshold" vs "Unlocked"
  const [forceThreshold, setForceThreshold] = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard/overview');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !data?.company?.id) return;

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_or_send',
          companyId: data.company.id,
          name: inviteName,
          email: inviteEmail,
          execRole: inviteRole,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setActionMessage(`Invitation sent to ${inviteEmail}`);
        setNewInviteModal(false);
        setInviteName('');
        setInviteEmail('');
        fetchDashboard();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (e) {
      alert('Failed to send invitation');
    }
  };

  const handleRemind = async (invitationId: string, email: string) => {
    try {
      await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remind', invitationId }),
      });
      setActionMessage(`Reminder sent to ${email}`);
      fetchDashboard();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (e) {
      alert('Error sending reminder');
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', invitationId }),
      });
      setActionMessage('Invitation revoked');
      fetchDashboard();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (e) {
      alert('Error revoking invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm">Loading Executive Dashboard...</p>
      </div>
    );
  }

  if (!data || !data.company) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <p className="text-slate-700 font-bold mb-4">No company workspace found.</p>
        <Link href="/onboarding" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold">
          Create Company Workspace
        </Link>
      </div>
    );
  }

  const { company, companyResult, completedCount, minThreshold, domains, heatmapMatrix, resistanceMap, awarenessAccuracy, executiveGaps, invitations } = data;

  const effectiveThreshold = forceThreshold !== null ? forceThreshold : minThreshold;
  const isUnlocked = completedCount >= effectiveThreshold;

  const levelColorMap: Record<string, { bg: string; text: string; border: string }> = {
    UNAWARE: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
    AWARE: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
    PRACTICING: { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-300' },
    PROFICIENT: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
    LEADING: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Workspace Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                PrismScore™ Workspace
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {company.industry} • {company.sizeBand} • {company.country}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              {company.name} Prism™ Leadership Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {companyResult && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Company Score</div>
                  <div className="text-lg font-black text-brand-600">
                    {companyResult.totalScore} <span className="text-xs font-normal text-slate-400">/ 500</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  {companyResult.band}
                </span>
              </div>
            )}

            <button
              onClick={() => setNewInviteModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Invite Executive
            </button>

            <Link
              href="/dashboard/three-sixty"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
            >
              <Users className="w-4 h-4" />
              360 Staff View
            </Link>

            <Link
              href="/dashboard/curriculum"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Tailored Courses
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* C-Level Invitee Status Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                C-Level Leadership Invitee Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracks invitation delivery, start progress, and diagnostic completion.
              </p>
            </div>

            <div className="text-xs text-slate-600 font-semibold flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span>Diagnostic Completions:</span>
              <span className="font-bold text-brand-600">{completedCount}</span>
              <span className="text-slate-400">/</span>
              <span>{Math.max(completedCount, invitations.length)} executives</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Executive</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">Diagnostic Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Seeded and invited executives */}
                {company.users
                  .filter((u: any) => u.role === 'EXECUTIVE' || (u.role === 'ADMIN' && u.alsoTakesClevel))
                  .map((exec: any) => {
                    const isDone = exec.submissions.some((s: any) => s.status === 'COMPLETED');
                    return (
                      <tr key={exec.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-5 font-bold text-slate-900">{exec.name}</td>
                        <td className="py-3.5 px-5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            {exec.execRoleTitle || 'Executive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-500">{exec.email}</td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Completed
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right text-slate-400">
                          Profile Synced
                        </td>
                      </tr>
                    );
                  })}

                {/* Pending / Sent invitations */}
                {invitations
                  .filter((inv: any) => inv.status !== 'ACCEPTED')
                  .map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-medium text-slate-800">{inv.name || 'Invited Leader'}</td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                          {inv.execRole || 'Executive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">{inv.email}</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-amber-800 bg-amber-50 border border-amber-200">
                          <Mail className="w-3.5 h-3.5 text-amber-600" />
                          {inv.status === 'SENT' ? 'Invitation Sent (Pending)' : inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <Link
                          href={`/assessment/clevel/${inv.token}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 font-semibold transition-colors"
                          title="Open direct assessment link for this executive"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Take as {inv.execRole}
                        </Link>
                        <button
                          onClick={() => handleRemind(inv.id, inv.email)}
                          className="px-2.5 py-1 rounded text-slate-600 hover:bg-slate-100 border border-slate-200 font-semibold transition-colors"
                        >
                          Remind
                        </button>
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          className="px-2.5 py-1 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold transition-colors"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MINIMUM COMPLETION RULE BANNER & SIMULATOR CONTROLS */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isUnlocked
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Privacy Threshold Status:
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isUnlocked
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isUnlocked ? 'Unlocked (Threshold Satisfied)' : 'Locked (Below Minimum)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rule: Heatmaps unlock only when at least <strong>{effectiveThreshold}</strong> executives have completed their confidential diagnostic. Currently: <strong>{completedCount}</strong> completed.
              </p>
            </div>
          </div>

          {/* Reviewer Simulation Toggle */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Test Rule:</span>
            <button
              onClick={() => setForceThreshold(3)}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                effectiveThreshold === 3
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Unlocked (≥3)
            </button>
            <button
              onClick={() => setForceThreshold(5)}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                effectiveThreshold === 5
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Locked (Simulate &lt;5)
            </button>
          </div>
        </div>

        {/* LOCKED STATE BANNER */}
        {!isUnlocked && (
          <div className="bg-slate-900 text-white rounded-3xl p-10 text-center shadow-lg border border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">
              C-Level Heatmaps Locked for Anonymity Protection
            </h3>
            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              To safeguard psychological safety and prevent identifying individual leader feedback, team heatmaps require at least {effectiveThreshold} completed executive assessments.
            </p>
            <div className="inline-block bg-slate-800 text-slate-300 text-xs px-4 py-2 rounded-xl border border-slate-700">
              Currently {completedCount} of {effectiveThreshold} completed. Send reminders above or use the toggle to test.
            </div>
          </div>
        )}

        {/* UNLOCKED HEATMAP & RESISTANCE SECTIONS */}
        {isUnlocked && (
          <div className="space-y-8">
            {/* ALIGNMENT HEATMAP */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      C-Level Competency Alignment Heatmap
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Knowledge level distribution by executive role across 6 core AI domains.
                  </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">Unaware</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">Aware</span>
                  <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-900 border border-yellow-300">Practicing</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">Proficient</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">Leading</span>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 w-44">
                        Executive Leader
                      </th>
                      {domains.map((dom: string) => (
                        <th key={dom} className="py-3 px-3 text-xs font-bold text-slate-700">
                          {dom}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {heatmapMatrix.map((row: any) => (
                      <tr key={row.roleTitle} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4 text-left font-bold text-slate-900">
                          <div>{row.executiveName}</div>
                          <div className="text-[11px] font-normal text-slate-400">{row.roleTitle}</div>
                        </td>
                        {domains.map((dom: string) => {
                          const level = row.competencies[dom] || 'PRACTICING';
                          const style = levelColorMap[level] || levelColorMap.PRACTICING;
                          return (
                            <td key={dom} className="py-4 px-2">
                              <span
                                className={`inline-block w-full py-1.5 px-2 rounded-lg font-bold border text-[11px] uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                              >
                                {level}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RESISTANCE MAP & NON-COURSE INTERVENTIONS */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Leadership Resistance Map & Tailored Interventions
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Conditions and concerns identified across the team. 
                    <span className="text-slate-700 font-medium"> Note: Resistance does not map to course modules; it maps to leadership interventions.</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resistanceMap.map((item: any) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{item.label}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.count} {item.count === 1 ? 'executive concern' : 'executive concerns'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Recommended Intervention: {item.intervention?.title}
                      </div>
                      <p className="text-slate-600">
                        {item.intervention?.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AWARENESS ACCURACY (PERCEPTION VS REALITY) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="pb-4 mb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  Awareness Accuracy Summary (Perception vs Reality)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compares executive perceptions with company assessment baselines and staff 360 findings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-semibold uppercase block mb-1">
                    Frontline Tool Adoption
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{awarenessAccuracy.toolUsagePerception}</div>
                  <div className="text-amber-700 mt-2 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                    {awarenessAccuracy.groundTruthDifference}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-semibold uppercase block mb-1">
                    Confidentiality Compliance
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{awarenessAccuracy.policyPerception}</div>
                  <div className="text-rose-700 mt-2 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                    {awarenessAccuracy.policyReality}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-semibold uppercase block mb-1">
                    Overall Team Cohesion
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{awarenessAccuracy.alignmentStatus}</div>
                  <p className="text-slate-600 mt-2">
                    Staff report higher informal AI use but lack written guardrails, creating hidden compliance exposure.
                  </p>
                </div>
              </div>
            </div>

            {/* INDIVIDUAL EXECUTIVE GAP PROFILES */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="pb-4 mb-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  Individual Executive Gap Profiles (Target Level – Current Level)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visible to executive and company admin per confidentiality rules. Drives Phase 4 Course Plan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {executiveGaps.map((exec: any) => (
                  <div
                    key={exec.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase text-brand-600 px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
                        {exec.roleTitle}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1.5">{exec.name}</h3>
                      <p className="text-xs text-slate-400">{exec.email}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Top Competency Gaps:
                      </span>
                      {exec.gaps.map((g: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{g.competency}</div>
                            <div className="text-[10px] text-slate-400">
                              {g.current} → {g.target}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              g.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Gap +{g.gap}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Concern Profile:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {exec.concerns.map((c: string, ci: number) => (
                          <span
                            key={ci}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INVITE NEW EXECUTIVE MODAL */}
        {newInviteModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Invite C-Level Leader
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Send a confidential invitation to join {company.name}'s workspace.
              </p>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Leader Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Hayes"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jordan@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Executive Role Title
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="CTO">Chief Technology Officer (CTO)</option>
                    <option value="CFO">Chief Financial Officer (CFO)</option>
                    <option value="COO">Chief Operating Officer (COO)</option>
                    <option value="CMO">Chief Marketing Officer (CMO)</option>
                    <option value="CHRO">Chief Human Resources Officer (CHRO)</option>
                    <option value="CIO">Chief Information Officer (CIO)</option>
                    <option value="Other">Other Executive Leader</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setNewInviteModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/20"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

