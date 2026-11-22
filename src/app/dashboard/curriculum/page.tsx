'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Download,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Code,
  Layers,
  Clock,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

export default function CurriculumPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const res = await fetch('/api/curriculum/generate');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to load curriculum:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCurriculum();
  }, []);

  const handleCopyJson = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-gap-curriculum-${data.company?.name || 'company'}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <BookOpen className="w-8 h-8 text-emerald-300 animate-spin mb-4" />
        <p className="text-white/65 text-sm">Synthesizing tailored executive curriculum from gap profiles...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <p className="text-white/75 font-bold mb-4">No curriculum plan available.</p>
        <Link href="/dashboard" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { company, executiveTracks, resistanceInterventions, recommendedSolutions } = data;

  return (
    <div className="flex-1 bg-white/[0.03] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/25">
                Phase 4: Course Engine & Solutions
              </span>
              <span className="text-xs text-white/50 font-medium">
                Downstream Integration with AI Course-Creation Module
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Tailored Executive Curriculum & Action Plan
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white/75 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied JSON' : 'Copy Course JSON'}
            </button>

            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Gap Payload (.json)
            </button>
          </div>
        </div>

        {/* Overview Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-ink-800 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Diagnostic-Driven Upskilling
            </span>
            <h3 className="text-lg font-bold">
              Customized for {company.name} Leadership Team
            </h3>
            <p className="text-xs text-white/60 max-w-2xl">
              Generated directly from C-level assessment gap profiles and resistance concerns. Addresses knowledge deficiencies without wasting executive time on commodity basics.
            </p>
          </div>

          <button
            onClick={() => setShowJson(!showJson)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 self-start md:self-auto flex items-center gap-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            {showJson ? 'Hide Raw JSON' : 'Inspect Course Generator Schema'}
          </button>
        </div>

        {/* JSON Schema Viewer Modal/Card */}
        {showJson && (
          <div className="bg-ink-800 text-emerald-400 rounded-2xl p-6 font-mono text-xs overflow-x-auto border border-emerald-900/60 shadow-inner">
            <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/10 text-white/40">
              <span>// Structured Gap Profile Payload for AI Course Generator</span>
              <span>application/json</span>
            </div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}

        {/* ROLE-SPECIFIC EXECUTIVE TRACKS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">
              Role-Specific Executive Learning Tracks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {executiveTracks.map((track: any) => (
              <div
                key={track.role}
                className="bg-white/[0.04] rounded-2xl p-6 border border-white/10 shadow-sm flex flex-col justify-between hover:bg-white/[0.08] hover:border-white/15 transition-colors space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-400/10 text-emerald-200 border border-emerald-400/25 uppercase">
                      {track.role} Track
                    </span>
                    <span className="text-xs text-white/50 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                      {track.duration}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {track.title}
                  </h3>
                  <div className="text-xs text-white/50 mt-1 mb-3">
                    Assigned to: <strong className="text-white/90">{track.executiveName}</strong>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {track.competencyGapsAddressed.map((gap: string, gi: number) => (
                      <span
                        key={gi}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.06] text-white/75"
                      >
                        Target Gap: {gap}
                      </span>
                    ))}
                  </div>

                  {/* Module List */}
                  <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
                    {track.modules.map((m: any, mi: number) => (
                      <div key={mi} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                        <div className="font-bold text-white">{m.title}</div>
                        <p className="text-white/65 mt-1 leading-relaxed">{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RESISTANCE INTERVENTIONS (NON-COURSE ROADMAP) */}
        <div className="bg-white/[0.04] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-sm">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
              <h2 className="text-lg font-bold text-white">
                Resistance Interventions (Non-Course Facilitation)
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Specification rule: Leadership resistance does not map to classroom course modules. It maps to targeted organizational interventions, facilitated briefings, and derisked pilots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resistanceInterventions.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-indigo-400/15 bg-indigo-400/10 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block mb-1">
                    Underlying Concern: {item.concern}
                  </span>
                  <h3 className="font-bold text-sm text-white leading-snug">
                    {item.interventionType}
                  </h3>
                  <div className="text-xs text-indigo-300 font-semibold mt-1">
                    Format: {item.format}
                  </div>
                  <p className="text-xs text-white/65 mt-2">
                    <strong className="text-white/75">Objective:</strong> {item.objective}
                  </p>
                </div>

                <div className="pt-3 border-t border-indigo-400/25 text-[11px] text-white/50">
                  Facilitator: {item.facilitator}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SOLUTION EVALUATION & RECOMMENDATIONS */}
        <div className="bg-white/[0.04] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-sm">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-300" />
              <h2 className="text-lg font-bold text-white">
                Tailored ScienceWerx Solutions & Commercial Evaluation
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Objective technical matches based on your organization's specific gap profile and dimension bottlenecks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedSolutions.map((sol: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-brand-400/25 transition-all space-y-3"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-400/10 text-amber-200 border border-amber-400/25">
                    {sol.category}
                  </span>
                  <h3 className="font-bold text-white text-sm mt-2">{sol.solutionName}</h3>
                  <p className="text-xs text-white/65 mt-1.5 leading-relaxed">
                    <strong className="text-white/90">Match Reason:</strong> {sol.matchReason}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <span className="text-xs font-bold text-brand-300 hover:text-brand-200 flex items-center gap-1 cursor-pointer">
                    Request Solution Briefing
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

