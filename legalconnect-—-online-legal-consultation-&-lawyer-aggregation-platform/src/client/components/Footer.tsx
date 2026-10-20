import React from 'react';
import { Scale, ShieldCheck, Lock, Award, HeartHandshake } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Bar Council Verified</h4>
              <p className="text-[11px] text-slate-400">Strict registry credential audits</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Privileged Confidentiality</h4>
              <p className="text-[11px] text-slate-400">Encrypted document vaults</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Verified Client Reviews</h4>
              <p className="text-[11px] text-slate-400">Only completed consultations rate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Transparent Fixed Fees</h4>
              <p className="text-[11px] text-slate-400">Clear rates before you book</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-lg font-serif font-bold text-white tracking-tight">
                LegalConnect
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pr-6">
              The premier online legal consultation platform connecting clients with rigorously
              verified advocates and specialized attorneys. Confidential scheduling, secure case
              files, and pre-consultation briefings.
            </p>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-amber-400 block mb-1">Mandatory Regulatory Notice:</strong>
              LegalConnect is an independent technology facilitation marketplace. We are not a law
              firm and do not provide legal advice or form attorney-client relationships directly.
              All consultations are provided by licensed advocates in their respective jurisdictions.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('/lawyers')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Find Lawyers
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/documents')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Document Centre
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/reviews')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Verified Reviews
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/register')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Join as an Advocate
                </button>
              </li>
            </ul>
          </div>

          {/* Practice Areas */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Practice Domains
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('/lawyers?domain=Corporate%20%26%20Commercial')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Corporate & Commercial
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/lawyers?domain=Intellectual%20Property')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Intellectual Property
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/lawyers?domain=Criminal%20Defense')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Criminal Defense
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/lawyers?domain=Family%20%26%20Matrimonial')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Family & Matrimonial
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/lawyers?domain=Real%20Estate%20%26%20Property')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Real Estate & Property
                </button>
              </li>
            </ul>
          </div>

          {/* Compliance & Support */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Security & Standards
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400">Bar License Validation</li>
              <li className="text-slate-400">Strict Anti-Conflict Checks</li>
              <li className="text-slate-400">Encrypted Client Records</li>
              <li className="text-slate-400">Audit Trail Logging</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} LegalConnect Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Demo Dataset Flag: Demo Advocates Clearly Labeled</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
