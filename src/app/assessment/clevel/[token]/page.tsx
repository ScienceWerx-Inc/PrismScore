'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sparkles,
  Info,
  Award,
} from 'lucide-react';

export default function CLevelAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function fetchAssessment() {
      try {
        const res = await fetch(`/api/assessment/clevel/${token}`);
        const data = await res.json();
        if (data.invitation) {
          setInvitation(data.invitation);
          setQuestions(data.questions || []);
        }
      } catch (e) {
        console.error('Failed to load C-level assessment:', e);
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchAssessment();
  }, [token]);

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const handleSelect = (optionId: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionId }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      const confirmContinue = confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Submit anyway?`
      );
      if (!confirmContinue) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/assessment/clevel/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, responses: answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setCompleted(true);
    } catch (err: any) {
      alert(err.message || 'Error submitting assessment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm">Loading confidential C-level diagnostic...</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <p className="text-slate-700 font-semibold mb-3">Invalid or expired invitation link.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm"
        >
          Return to Platform
        </button>
      </div>
    );
  }

  // Completion Screen
  if (completed) {
    return (
      <div className="flex-1 bg-slate-50 py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Assessment Completed
          </h2>
          <p className="text-sm text-slate-600 mt-2 mb-6 leading-relaxed">
            Thank you, <strong className="text-slate-900">{invitation.name}</strong> ({invitation.execRole}). 
            Your responses have been securely recorded into the {invitation.company?.name} leadership matrix.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 mb-8 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Lock className="w-4 h-4 text-brand-600" />
              <span>Confidentiality Safeguards Applied</span>
            </div>
            <p>
              Your individual answers are confidential to you and the company admin. Aggregated team heatmaps and resistance distributions are visible to the team once the minimum completion threshold is reached.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white text-sm shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
            >
              Enter Leadership Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-Assessment Welcome & Privacy Transparency
  if (!started) {
    return (
      <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5" /> Confidential C-Level Diagnostic
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {invitation.name || 'Leader'}
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            You have been invited by <strong className="text-slate-900">{invitation.invitedBy || 'your company admin'}</strong> to participate in the AI readiness assessment for <strong className="text-slate-900">{invitation.company?.name}</strong> as <strong className="text-brand-600">{invitation.execRole}</strong>.
          </p>

          {/* Privacy Box */}
          <div className="my-6 p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-3">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Privacy & Fairness Guarantee</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-blue-800">
              <li>Individual executive scores are confidential to you and the company admin.</li>
              <li>Peer executives only see anonymous, aggregate team heatmaps.</li>
              <li>This diagnostic evaluates organizational conditions and concerns — it is never a personal performance judgment.</li>
              <li>Takes approximately 15 to 20 minutes (scenario decisions, not self-rating).</li>
            </ul>
          </div>

          {/* 3 Layers summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Layer 1: Knowledge</span>
              <span className="text-slate-500">Decision scenarios & role-specific questions for {invitation.execRole}.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Layer 2: Awareness</span>
              <span className="text-slate-500">Perceptions of operational reality vs ground truth.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Layer 3: Resistance</span>
              <span className="text-slate-500">Identifying key conditions & concern profiles.</span>
            </div>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full py-4 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white text-base shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
          >
            Start C-Level Assessment ({questions.length} Scenarios)
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Active Assessment Question Wizard
  const layerLabels: Record<string, string> = {
    KNOWLEDGE: 'Layer 1: Knowledge & Decision Scenarios',
    AWARENESS: 'Layer 2: Organizational Awareness',
    RESISTANCE: 'Layer 3: Conditions & Concern Identification',
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                {currentQ?.layer ? layerLabels[currentQ.layer] : 'Executive Diagnostic'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {invitation.execRole} Perspective
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Question {currentIndex + 1} of {questions.length} • {answeredCount} answered
            </div>
          </div>

          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            {currentQ.scenarioContext && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic flex items-start gap-2.5">
                <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 not-italic">Executive Scenario: </strong>
                  {currentQ.scenarioContext}
                </div>
              </div>
            )}

            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {currentQ.text}
            </h2>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt: any) => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 text-purple-950 font-medium ring-1 ring-purple-500 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white disabled:opacity-40 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-sm transition-all flex items-center gap-1.5"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Complete Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

