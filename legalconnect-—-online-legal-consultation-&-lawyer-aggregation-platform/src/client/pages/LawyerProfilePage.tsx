import React, { useState, useEffect } from 'react';
import { api } from '../api/index.ts';
import { Lawyer, Review, AvailabilitySlot } from '../types/index.ts';
import { BookingModal } from '../components/BookingModal.tsx';
import {
  ShieldCheck,
  Star,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle,
  Building,
  Clock,
  Languages,
  Award,
  ArrowLeft,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface LawyerProfilePageProps {
  lawyerId: string;
  navigate: (path: string) => void;
}

export const LawyerProfilePage: React.FC<LawyerProfilePageProps> = ({ lawyerId, navigate }) => {
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    api.getLawyerById(lawyerId)
      .then((res) => {
        setLawyer(res.lawyer);
        setReviews(res.reviews || []);
        setAvailability(res.availability || []);
      })
      .catch((err) => {
        console.error('Error fetching lawyer details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lawyerId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
        <span className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading advocate dossier & credentials...</span>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-serif font-bold text-slate-900">Advocate Profile Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested advocate record could not be located in our verified directory.
        </p>
        <button
          onClick={() => navigate('/lawyers')}
          className="px-4 py-2 bg-slate-900 text-amber-400 text-xs font-semibold rounded-xl"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/lawyers')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      {/* Main Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <img
              src={
                lawyer.avatar ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
              }
              alt={lawyer.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover ring-4 ring-slate-100 shadow-md shrink-0"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                  {lawyer.name}
                </h1>
                {lawyer.verificationStatus === 'approved' && (
                  <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Advocate
                  </span>
                )}
                {lawyer.isDemo && (
                  <span className="inline-flex items-center text-slate-500 bg-slate-100 text-[10px] font-medium px-2 py-0.5 rounded">
                    Demo Profile
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-amber-700">{lawyer.primaryDomain}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  {lawyer.experienceYears} Years Experience
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {lawyer.city}, {lawyer.state}
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {lawyer.rating.toFixed(1)} ({lawyer.reviewCount} verified client reviews)
                </span>
              </div>

              {/* Bar Council Verification Strip */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">
                    Bar Enrollment Reg.
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {lawyer.barRegistrationNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">State Bar</span>
                  <span className="font-semibold text-slate-900">{lawyer.barCouncilState}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Admitted Year</span>
                  <span className="font-semibold text-slate-900">{lawyer.yearOfAdmission}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Booking CTA Box */}
          <div className="w-full md:w-72 bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4 shrink-0">
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-2xl font-bold text-amber-400">
                  ${lawyer.consultationFee}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ session</span>
              </div>
              <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                {lawyer.consultationDurationMinutes} mins
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted Video or In-Office</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confidential Document Vault</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Written Post-Session Advice</span>
              </div>
            </div>

            <button
              onClick={() => setIsBookingOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Book Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details & Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Biography */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-base font-bold font-serif text-slate-900 uppercase tracking-wider">
              Professional Biography
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {lawyer.bio}
            </p>
          </section>

          {/* Practice Areas */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-base font-bold font-serif text-slate-900 uppercase tracking-wider">
              Specialized Practice Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {lawyer.practiceAreas.map((area, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  {area}
                </span>
              ))}
            </div>
          </section>

          {/* Verified Client Reviews */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold font-serif text-slate-900 uppercase tracking-wider">
                  Verified Client Reviews ({reviews.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reviews are strictly verified from clients who completed paid consultations
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-base font-bold text-slate-900">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{lawyer.rating.toFixed(1)} / 5.0</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No reviews recorded yet for this advocate. Be the first to consult!
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev._id} className="pt-4 first:pt-0 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rev.clientName}</span>
                        {rev.isVerifiedConsultation && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                            Verified Consultation
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                        />
                      ))}
                      <span className="font-bold text-slate-800 ml-1.5">{rev.title}</span>
                    </div>

                    <p className="text-slate-600 leading-relaxed">{rev.comment}</p>

                    {/* Lawyer Reply */}
                    {rev.lawyerReply && (
                      <div className="bg-slate-50 border-l-2 border-amber-500 p-3 rounded-r-xl space-y-1 text-slate-700 mt-2">
                        <span className="font-semibold text-slate-900 block text-[11px]">
                          Advocate Response:
                        </span>
                        <p className="text-[11px] text-slate-600">{rev.lawyerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Credentials Sidebar (Right Column) */}
        <div className="space-y-6">
          {/* Education & Qualifications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-600" /> Education & Degrees
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {lawyer.education}
            </p>
          </div>

          {/* Court Admissions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-amber-600" /> Court Admissions
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {lawyer.courtAdmissions.map((court, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{court}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Spoken Languages */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-amber-600" /> Languages Spoken
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {lawyer.languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Consultation Hours */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" /> Weekly Availability Windows
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              {availability.map((slot) => (
                <div key={slot.dayOfWeek} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <span className="font-semibold text-slate-800">{dayNames[slot.dayOfWeek]}</span>
                  <span>{slot.startTime} – {slot.endTime}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        lawyer={lawyer}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={(aptId) => {
          setIsBookingOpen(false);
          navigate(`/consultations/${aptId}`);
        }}
      />
    </div>
  );
};
