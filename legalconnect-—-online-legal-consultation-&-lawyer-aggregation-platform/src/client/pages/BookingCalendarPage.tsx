import React, { useState, useEffect } from 'react';
import { api } from '../api/index.ts';
import { Lawyer, LegalDomain } from '../types/index.ts';
import { BookingModal } from '../components/BookingModal.tsx';
import { Calendar, Search, ShieldCheck, Star, MapPin, ArrowRight } from 'lucide-react';

interface BookingCalendarPageProps {
  navigate: (path: string) => void;
}

export const BookingCalendarPage: React.FC<BookingCalendarPageProps> = ({ navigate }) => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getLawyers({ sort: 'rating' })
      .then((res) => setLawyers(res.lawyers || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Real-Time Scheduling
            </span>
            <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded-full font-mono">
              Live Conflict Validation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Appointment Booking Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Select an advocate below to inspect real-time weekly calendar availability and reserve
            your consultation slot.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing available appointment schedules...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lawyers.map((lawyer) => (
            <div
              key={lawyer._id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={
                      lawyer.avatar ||
                      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={lawyer.name}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{lawyer.name}</h3>
                    <p className="text-xs text-amber-700 font-semibold">{lawyer.primaryDomain}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-0.5 text-slate-900 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {lawyer.rating.toFixed(1)}
                      </span>
                      <span>• {lawyer.experienceYears} yrs practice</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Fixed Rate</span>
                  <span className="font-bold text-slate-900">
                    ${lawyer.consultationFee} / {lawyer.consultationDurationMinutes}m
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLawyer(lawyer);
                    setIsBookingOpen(true);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" /> Pick Date & Reserve Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
};
