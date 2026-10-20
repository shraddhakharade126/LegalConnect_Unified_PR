import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/index.ts';
import { Appointment, LegalDocument } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { AiLegalAssistantModal } from '../components/AiLegalAssistantModal.tsx';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Star,
  Search,
  Sparkles,
  ArrowRight,
  AlertCircle,
  XCircle,
  CheckCircle,
} from 'lucide-react';

import { useToast } from '../context/ToastContext.tsx';

interface ClientDashboardProps {
  navigate: (path: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [loading, setLoading] = useState<boolean>(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [aptRes, docRes] = await Promise.all([
        api.getAppointments(),
        api.getDocuments(),
      ]);
      setAppointments(aptRes.appointments || []);
      setDocuments(docRes.documents || []);
    } catch (err) {
      console.error('Error loading client dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelAppointment = async (id: string) => {
    if (!cancelReason.trim()) {
      showToast('Please enter a cancellation reason.', 'warning');
      return;
    }
    try {
      await api.updateAppointmentStatus(id, {
        status: 'cancelled',
        reason: cancelReason.trim(),
      });
      showToast('Appointment successfully cancelled.', 'success');
      setCancellingId(null);
      setCancelReason('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error cancelling appointment.', 'error');
    }
  };

  const upcomingSessions = appointments.filter((a) =>
    ['requested', 'confirmed', 'in_progress'].includes(a.status)
  );

  const pastSessions = appointments.filter((a) =>
    ['completed', 'cancelled', 'rejected'].includes(a.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Client Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Welcome, {user?.name || 'Client'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Manage your legal consultations, confidential documents, and advocate discussions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Case Prep AI
          </button>
          <button
            onClick={() => navigate('/lawyers')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" /> Book an Advocate
          </button>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{upcomingSessions.length}</span>
            <p className="text-xs text-slate-500">Upcoming Consultations</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {pastSessions.filter((s) => s.status === 'completed').length}
            </span>
            <p className="text-xs text-slate-500">Completed Sessions</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{documents.length}</span>
            <p className="text-xs text-slate-500">Privileged Case Files</p>
          </div>
        </div>
      </div>

      {/* Consultation Sessions Manager */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Upcoming Consultations
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {upcomingSessions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Consultation History
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {pastSessions.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => navigate('/documents')}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold hidden sm:flex items-center gap-1 mb-2"
          >
            Access Document Vault <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading consultation schedule...</span>
            </div>
          ) : activeTab === 'upcoming' ? (
            upcomingSessions.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No Upcoming Consultations</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not have any pending or confirmed consultation sessions scheduled.
                </p>
                <button
                  onClick={() => navigate('/lawyers')}
                  className="px-4 py-2 bg-slate-900 text-amber-400 text-xs font-semibold rounded-xl hover:bg-slate-800"
                >
                  Schedule First Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((apt) => (
                  <div
                    key={apt._id}
                    className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{apt.lawyerName}</h4>
                        <span className="text-xs text-slate-500 font-medium">
                          • {apt.legalDomainName}
                        </span>
                        <StatusBadge status={apt.status} size="sm" />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {apt.appointmentDate} at {apt.startTime} – {apt.endTime}
                        </span>
                        <span className="capitalize font-medium">
                          Format: {apt.consultationType.replace('_', ' ')}
                        </span>
                        <span className="text-emerald-700 font-bold">${apt.fee} (Paid)</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1 italic max-w-xl">
                        "{apt.issueSummary}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                      <button
                        onClick={() => navigate(`/consultations/${apt._id}`)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-colors shadow-sm"
                      >
                        Consultation Details
                      </button>

                      {apt.status !== 'cancelled' && (
                        <button
                          onClick={() => setCancellingId(apt._id)}
                          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : pastSessions.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No historical consultations on record.
            </div>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((apt) => (
                <div
                  key={apt._id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800 text-sm">{apt.lawyerName}</h4>
                      <span className="text-xs text-slate-500">• {apt.legalDomainName}</span>
                      <StatusBadge status={apt.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Date: {apt.appointmentDate} at {apt.startTime}
                      </span>
                      <span>Fee: ${apt.fee}</span>
                    </div>

                    {apt.cancellationReason && (
                      <p className="text-xs text-rose-700">Reason: {apt.cancellationReason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => navigate(`/consultations/${apt._id}`)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      View Case Dossier
                    </button>

                    {apt.status === 'completed' && !apt.reviewedByClient && (
                      <button
                        onClick={() => navigate(`/consultations/${apt._id}`)}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" /> Rate Consultation
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Prompt Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Cancel Consultation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please specify the reason for cancelling this appointment. The advocate will be
              notified immediately and the time slot will be reopened.
            </p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="E.g., Scheduling conflict, issue resolved amicably, etc."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingId(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={() => handleCancelAppointment(cancellingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      <AiLegalAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
