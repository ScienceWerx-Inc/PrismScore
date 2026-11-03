'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  HelpCircle,
  Sparkles,
  Save,
  Check,
  Send,
  Wand2,
} from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
  points: number;
}

interface Question {
  id: string;
  dimensionId: string;
  order: number;
  text: string;
  options: QuestionOption[];
}

interface Dimension {
  id: string;
  name: string;
  weight: number;
  description: string;
}

function AssessmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionId = searchParams.get('submissionId');

  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`/api/assessment/company?submissionId=${submissionId || ''}`);
        const data = await res.json();
        if (data.questions) {
          setQuestions(data.questions);
          setDimensions(data.dimensions || []);
          if (data.existingResponses) {
            setAnswers(data.existingResponses);
          }
        }
      } catch (err) {
        console.error('Failed to load assessment questions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [submissionId]);

  const currentQuestion = questions[currentIndex];
  const currentDimension = dimensions.find((d) => d.id === currentQuestion?.dimensionId);

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleSelectOption = async (optionId: string) => {
    if (!currentQuestion) return;

    // Optimistic state update
    const updated = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(updated);
    setSavingStatus('Saving...');

    if (submissionId) {
      try {
        await fetch('/api/assessment/company/save-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            questionId: currentQuestion.id,
            optionId,
          }),
        });
        setSavingStatus('Saved');
        setTimeout(() => setSavingStatus(null), 1200);
      } catch (e) {
        console.error('Auto-save error:', e);
        setSavingStatus('Save failed');
      }
    }
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

  // Quick helper to fill realistic sample data for fast testing
  const handleAutoFill = async () => {
    const filled: Record<string, string> = {};
    for (const q of questions) {
      // Pick option 1, 2, or 3 for balanced realistic score
      const idx = (q.order % 3) + 1;
      const opt = q.options[idx] || q.options[0];
      filled[q.id] = opt.id;

      if (submissionId) {
        await fetch('/api/assessment/company/save-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            questionId: q.id,
            optionId: opt.id,
          }),
        });
      }
    }
    setAnswers(filled);
  };

  const handleSubmit = async () => {
    if (!submissionId) {
      alert('Missing submissionId. Please initialize your assessment from onboarding.');
      return;
    }

    if (answeredCount < questions.length) {
      const confirmSubmit = confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Unanswered questions will receive 0 points. Do you wish to proceed?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/assessment/company/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      router.push(`/report/company/${submissionId}`);
    } catch (err: any) {
      alert(err.message || 'Error submitting assessment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-medium">Loading 25 Company Assessment Questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <p className="text-slate-700 font-semibold mb-2">No questions loaded in database.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Top Header & Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  {currentDimension?.name || 'Company Assessment'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Weight: {currentDimension ? `${currentDimension.weight * 100}%` : '20%'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Company AI Diagnostic — Question {currentIndex + 1} of {questions.length}
              </h1>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              {savingStatus && (
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Save className="w-3.5 h-3.5 animate-pulse" />
                  {savingStatus}
                </span>
              )}
              <button
                type="button"
                onClick={handleAutoFill}
                title="Populate realistic responses for fast demonstration"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Fill Sample Data
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Progress: {answeredCount} of {questions.length} completed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Question Jump Buttons */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-brand-600 text-white ring-2 ring-brand-500 ring-offset-1'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question Card */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
            <div className="flex items-start gap-3 mb-6">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 font-bold flex items-center justify-center text-sm flex-shrink-0">
                {currentIndex + 1}
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {currentQuestion.text}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select the option that most accurately reflects your company's current reality.
                </p>
              </div>
            </div>

            {/* Situation Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 text-brand-950 font-medium ring-1 ring-brand-500 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="leading-relaxed">{opt.text}</span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                      {opt.points} pts
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation & Submit Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-sm shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit & Calculate Score
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading assessment...</div>}>
      <AssessmentContent />
    </Suspense>
  );
}

