import React from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  PlayCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { AppointmentStatus } from '../types/index.ts';

interface StatusBadgeProps {
  status: AppointmentStatus | 'pending' | 'approved' | 'rejected' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  switch (status) {
    case 'confirmed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}
        >
          <CheckCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Confirmed
        </span>
      );
    case 'requested':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}
        >
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Pending Request
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses}`}
        >
          <PlayCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          In Progress
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <CheckCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5 text-slate-500'} />
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <XCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Cancelled
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <AlertCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Rejected
        </span>
      );

    // Lawyer verification statuses
    case 'approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold ${sizeClasses}`}
        >
          <ShieldCheck className={isSm ? 'w-3 h-3 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
          Verified Bar Advocate
        </span>
      );
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-semibold ${sizeClasses}`}
        >
          <Clock className={isSm ? 'w-3 h-3 text-amber-600' : 'w-4 h-4 text-amber-600'} />
          Verification Pending
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
};
