import React, { useState } from 'react';
import { api } from '../api/index.ts';
import { Sparkles, AlertTriangle, CheckCircle, Copy, Check, X, ShieldAlert } from 'lucide-react';

interface AiLegalAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceArea?: string;
  onApplyBrief?: (briefText: string, questions: string[]) => void;
}

export const AiLegalAssistantModal: React.FC<AiLegalAssistantModalProps> = ({
  isOpen,
  onClose,
  practiceArea = 'Corporate & Commercial',
  onApplyBrief,
}) => {
  const [situationText, setSituationText] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefResult, setBriefResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situationText.trim()) {
      setError('Please provide a brief description of your matter.');
      return;
    }
    if (!consentAccepted) {
      setError('You must accept the informational disclaimer below before proceeding.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.getAiBrief({
        situationDescription: situationText.trim(),
        practiceArea,
        clientConsentAccepted: true,
      });
      setBriefResult(res.brief);
    } catch (err: any) {
      setError(err.message || 'Failed to generate briefing.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (briefResult) {
      navigator.clipboard.writeText(briefResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAttachToBooking = () => {
    if (briefResult && onApplyBrief) {
      // Extract bullet questions if present
      const questions: string[] = [];
      const lines = briefResult.split('\n');
      lines.forEach((l) => {
        if (/^\d+\.\s/.test(l.trim())) {
          questions.push(l.trim().replace(/^\d+\.\s*/, ''));
        }
      });
      onApplyBrief(briefResult, questions);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">
                Pre-Consultation Legal Matter Organizer
              </h3>
              <p className="text-xs text-amber-300">
                AI-Powered Case Intake Briefing & Question Generator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Statutory Disclaimer Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Important Legal Notice:</span>
              <p className="text-amber-800 leading-relaxed">
                This intake assistant helps structure your chronology and formulate relevant
                questions for your licensed advocate. It does <strong>not</strong> provide legal
                advice, assess chances of success, or create an attorney-client relationship. Do not
                submit sensitive trade secrets or confidential identifiers.
              </p>
            </div>
          </div>

          {!briefResult ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                  Legal Domain
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                  {practiceArea}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                  Describe Your Situation or Problem
                </label>
                <textarea
                  rows={5}
                  value={situationText}
                  onChange={(e) => setSituationText(e.target.value)}
                  placeholder="E.g., We are negotiating a convertible note with an angel investor who requested board observer rights and right of first refusal. We want to know if this is typical for our stage and what clauses to negotiate..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 placeholder:text-slate-400"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Focus on dates, actions taken, and what you hope to achieve.
                </span>
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700">
                  I consent to processing this general description for pre-consultation question
                  organization. I understand this does not constitute legal counsel.
                </span>
              </label>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !consentAccepted || !situationText.trim()}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Structuring Legal Questions & Documents...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Consultation Brief & Questions
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans max-h-80 overflow-y-auto">
                {briefResult}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBriefResult(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Edit Matter Description
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Brief
                      </>
                    )}
                  </button>

                  {onApplyBrief && (
                    <button
                      type="button"
                      onClick={handleAttachToBooking}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Attach to Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
