import React from 'react';
import { Lawyer } from '../types/index.ts';
import { Star, MapPin, Briefcase, ShieldCheck, Clock, Calendar } from 'lucide-react';

interface LawyerCardProps {
  lawyer: Lawyer;
  onViewProfile: (id: string) => void;
  onBook: (lawyer: Lawyer) => void;
}

export const LawyerCard: React.FC<LawyerCardProps> = ({ lawyer, onViewProfile, onBook }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5">
        {/* Top Header: Avatar, Name, Verification */}
        <div className="flex items-start gap-4">
          <img
            src={
              lawyer.avatar ||
              'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
            }
            alt={lawyer.name || 'Advocate'}
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3
                onClick={() => onViewProfile(lawyer._id)}
                className="font-bold text-slate-900 text-base hover:text-amber-700 cursor-pointer transition-colors line-clamp-1"
              >
                {lawyer.name}
              </h3>
              {lawyer.verificationStatus === 'approved' && (
                <span
                  title="Bar Council Enrollment Verified"
                  className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                >
                  <ShieldCheck className="w-3 h-3 mr-0.5 text-emerald-600" /> Verified
                </span>
              )}
            </div>

            <p className="text-xs text-amber-700 font-medium line-clamp-1 mt-0.5">
              {lawyer.primaryDomain}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {lawyer.experienceYears} yrs exp.
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {lawyer.city}, {lawyer.state}
              </span>
            </div>
          </div>
        </div>

        {/* Bio Excerpt */}
        <p className="text-xs text-slate-600 line-clamp-2 mt-3.5 leading-relaxed">
          {lawyer.bio}
        </p>

        {/* Practice Area Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3.5">
          {lawyer.practiceAreas.slice(0, 3).map((area, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
            >
              {area}
            </span>
          ))}
          {lawyer.practiceAreas.length > 3 && (
            <span className="text-[11px] text-slate-400 self-center">
              +{lawyer.practiceAreas.length - 3} more
            </span>
          )}
        </div>

        {/* Bar Registration Notice */}
        <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span className="font-mono text-[10px] truncate max-w-[200px]">
            Bar Reg: {lawyer.barRegistrationNumber}
          </span>
          <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded">
            Admitted {lawyer.yearOfAdmission}
          </span>
        </div>
      </div>

      {/* Card Footer: Rating, Fee & Action */}
      <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{lawyer.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-normal">({lawyer.reviewCount})</span>
          </div>

          <div className="border-l border-slate-200 pl-3">
            <span className="text-base font-bold text-slate-900">${lawyer.consultationFee}</span>
            <span className="text-[11px] text-slate-500 block leading-none">
              / {lawyer.consultationDurationMinutes}m session
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewProfile(lawyer._id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => onBook(lawyer)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> Book
          </button>
        </div>
      </div>
    </div>
  );
};
