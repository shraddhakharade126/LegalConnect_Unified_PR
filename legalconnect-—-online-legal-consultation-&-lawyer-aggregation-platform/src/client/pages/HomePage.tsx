import React, { useState, useEffect } from 'react';
import { api } from '../api/index.ts';
import { Lawyer, LegalDomain } from '../types/index.ts';
import { LawyerCard } from '../components/LawyerCard.tsx';
import { BookingModal } from '../components/BookingModal.tsx';
import { AiLegalAssistantModal } from '../components/AiLegalAssistantModal.tsx';
import {
  Scale,
  ShieldCheck,
  Search,
  Sparkles,
  Award,
  Lock,
  ArrowRight,
  Briefcase,
  Users,
  Building,
  CheckCircle2,
  Calendar,
  MessageSquare,
  FileCheck,
} from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [featuredLawyers, setFeaturedLawyers] = useState<Lawyer[]>([]);
  const [categories, setCategories] = useState<LegalDomain[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');

  useEffect(() => {
    // Load top verified lawyers
    api.getLawyers({ minRating: 4.8, sort: 'rating' }).then((res) => {
      setFeaturedLawyers(res.lawyers.slice(0, 3));
    });

    api.getCategories().then((res) => {
      setCategories(res.domains || []);
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedDomain) params.append('domain', selectedDomain);
    navigate(`/lawyers?${params.toString()}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-16 pb-24 px-4 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-amber-400 text-xs font-semibold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Bar-Credentialed Legal Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Consult Trusted Lawyers. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
              Clear Advice. Fixed Fees.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            LegalConnect connects individuals and businesses with rigorously vetted advocates.
            Schedule instant encrypted video consultations, organize legal documents, and prepare
            questions before you meet.
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-3xl mx-auto pt-4">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2 text-slate-800"
            >
              <div className="flex-1 w-full flex items-center gap-2.5 px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-slate-200">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lawyer name, practice area, or legal issue..."
                  className="w-full text-xs sm:text-sm outline-none text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="w-full sm:w-56 px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-slate-200">
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full text-xs sm:text-sm outline-none bg-transparent text-slate-700 font-medium cursor-pointer"
                >
                  <option value="">All Practice Areas</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                Find Advocate <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Trust Highlights Pill Row */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Bar Registration Verified
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Attorney-Client Privilege Safeguards
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Anti-Double Booking Engine
            </span>
          </div>
        </div>
      </section>

      {/* AI INTAKE ASSISTANT TEASER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> AI Pre-Consultation Assistant
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Not sure what questions to ask your advocate?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Use our informational intake organizer to summarize your matter chronology, highlight
              missing facts, and formulate 5 essential questions before your consultation starts.
            </p>
          </div>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs sm:text-sm hover:from-amber-400 hover:to-amber-300 shadow-lg transition-all flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" /> Prepare Case Briefing
          </button>
        </div>
      </section>

      {/* PRACTICE AREAS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              Browse by Practice Domain
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find specialized legal counsel across established jurisdictions
            </p>
          </div>
          <button
            onClick={() => navigate('/lawyers')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 self-start sm:self-auto"
          >
            View all categories <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat) => (
            <div
              key={cat._id}
              onClick={() => navigate(`/lawyers?domain=${encodeURIComponent(cat.name)}`)}
              className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-400 cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-amber-100/70 text-slate-800 group-hover:text-amber-700 flex items-center justify-center transition-colors mb-3.5">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED VERIFIED ADVOCATES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Audited Bar Standings
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              Featured Verified Advocates
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Senior practitioners with proven trial experience and verified client feedback
            </p>
          </div>
          <button
            onClick={() => navigate('/lawyers')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 self-start sm:self-auto"
          >
            Explore all lawyers <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLawyers.map((lawyer) => (
            <LawyerCard
              key={lawyer._id}
              lawyer={lawyer}
              onViewProfile={(id) => navigate(`/lawyer-profile/${id}`)}
              onBook={(l) => {
                setSelectedLawyer(l);
                setIsBookingOpen(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-slate-50 border-y border-slate-200/80 py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Seamless Consultation Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              How LegalConnect Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              A transparent, 4-step process designed for total confidentiality and conflict prevention.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900">Discover & Filter</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter verified lawyers by practice domain, state bar council registry, experience,
                and transparent hourly consultation fees.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">Book Real-Time Slots</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose video or in-office slots. Server-side conflict validation eliminates
                overlapping appointments and double-booking.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">Upload Privileged Files</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Safely share contracts, notices, and optional AI pre-consultation briefings.
                Strictly restricted to you and your advocate.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">
                4
              </div>
              <h3 className="font-bold text-sm text-slate-900">Consult & Review</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Meet in encrypted rooms. Access lawyer post-session action items and leave verified
                reviews once your consultation completes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION FOR ADVOCATES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Advocate Network Enrollment
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Are you a licensed advocate or legal practitioner?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Expand your client reach, manage client appointments with automated conflict
              checks, set your own consultation fees, and access secure case vaults.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all text-center"
            >
              Apply as a Lawyer
            </button>
            <button
              onClick={() => navigate('/lawyers')}
              className="px-6 py-3.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm transition-all text-center"
            >
              View Advocate Directory
            </button>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        lawyer={selectedLawyer}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={(aptId) => {
          setIsBookingOpen(false);
          navigate(`/consultations/${aptId}`);
        }}
      />

      {/* AI Assistant Modal */}
      <AiLegalAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
