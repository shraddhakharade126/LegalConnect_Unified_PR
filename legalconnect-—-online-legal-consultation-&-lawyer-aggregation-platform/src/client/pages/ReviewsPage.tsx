import React, { useState, useEffect } from 'react';
import { api } from '../api/index.ts';
import { Review, Lawyer } from '../types/index.ts';
import { Star, ShieldCheck, MessageSquare, ArrowLeft } from 'lucide-react';

interface ReviewsPageProps {
  navigate: (path: string) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ navigate }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([api.getReviews(), api.getLawyers()])
      .then(([revRes, lRes]) => {
        setReviews(revRes.reviews || []);
        setLawyers(lRes.lawyers || []);
      })
      .catch((err) => console.error('Error fetching reviews:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredReviews = selectedLawyerId
    ? reviews.filter((r) => r.lawyerId === selectedLawyerId)
    : reviews;

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Reviews Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Verified Feedback
            </span>
            <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded-full font-mono">
              Completed Consultations Only
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Client Reviews & Ratings
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Transparent feedback from real individuals and enterprises who completed consultations.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700 shrink-0">
          <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
          <div>
            <div className="text-2xl font-bold text-white leading-none">{averageRating}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Based on {reviews.length} Verified Reviews
            </span>
          </div>
        </div>
      </div>

      {/* Filter by Advocate */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filter by Advocate:</span>
          <select
            value={selectedLawyerId}
            onChange={(e) => setSelectedLawyerId(e.target.value)}
            className="text-xs font-medium p-2 border border-slate-300 rounded-xl bg-white text-slate-800 outline-none"
          >
            <option value="">All Advocates</option>
            {lawyers.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name} ({l.primaryDomain})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredReviews.length} verified ratings
        </span>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
          <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading client ratings...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No reviews found for this advocate.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReviews.map((rev) => {
            const targetLawyer = lawyers.find((l) => l._id === rev.lawyerId);
            return (
              <div
                key={rev._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{rev.clientName}</h4>
                      <p className="text-[11px] text-amber-700 font-semibold">
                        Consulted with {targetLawyer?.name || 'Advocate'}
                      </p>
                    </div>
                    {rev.isVerifiedConsultation && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Session
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 fill-slate-200'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-slate-900 text-xs ml-1.5">{rev.title}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>

                  {rev.lawyerReply && (
                    <div className="bg-slate-50 border-l-2 border-amber-500 p-3 rounded-r-xl space-y-1 text-slate-700 mt-2 text-xs">
                      <span className="font-bold text-slate-900 block text-[11px]">
                        Advocate Response:
                      </span>
                      <p className="text-slate-600">{rev.lawyerReply}</p>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Advisory Consultation</span>
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
