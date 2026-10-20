import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/index.ts';
import { Appointment, Lawyer, AvailabilitySlot } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Star,
  Users,
  Video,
  AlertCircle,
  FileText,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  XCircle,
  Check,
  Edit3,
} from 'lucide-react';

import { useToast } from '../context/ToastContext.tsx';

interface LawyerDashboardProps {
  navigate: (path: string) => void;
}

export const LawyerDashboard: React.FC<LawyerDashboardProps> = ({ navigate }) => {
  const { user, lawyer, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'schedule' | 'settings'>('requests');

  // Rate & Settings state
  const [fee, setFee] = useState<number>(lawyer?.consultationFee || 150);
  const [duration, setDuration] = useState<number>(lawyer?.consultationDurationMinutes || 45);
  const [bio, setBio] = useState<string>(lawyer?.bio || '');
  const [isAccepting, setIsAccepting] = useState<boolean>(lawyer?.isAcceptingNewClients ?? true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState<boolean>(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const aptRes = await api.getAppointments();
      setAppointments(aptRes.appointments || []);

      if (lawyer) {
        const availRes = await api.getLawyerAvailability(lawyer._id);
        setAvailability(availRes.availability || []);
        setFee(lawyer.consultationFee);
        setDuration(lawyer.consultationDurationMinutes);
        setBio(lawyer.bio);
        setIsAccepting(lawyer.isAcceptingNewClients);
      }
    } catch (err) {
      console.error('Error loading lawyer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [lawyer]);

  const handleUpdateStatus = async (appointmentId: string, status: string, reason?: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, { status, reason });
      showToast(`Appointment status changed to ${status}.`, 'success');
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Error updating status.', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateLawyerProfile({
        consultationFee: Number(fee),
        consultationDurationMinutes: Number(duration),
        bio: bio.trim(),
        isAcceptingNewClients: isAccepting,
      });
      await refreshUser();
      setSettingsSuccess(true);
      showToast('Practice settings and consultation fee saved.', 'success');
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Error saving settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const pendingRequests = appointments.filter((a) => a.status === 'requested');
  const confirmedSessions = appointments.filter((a) =>
    ['confirmed', 'in_progress'].includes(a.status)
  );
  const completedSessions = appointments.filter((a) => a.status === 'completed');
  const totalVolume = appointments
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Verification Status Banner */}
      {lawyer && (
        <div>
          {lawyer.verificationStatus === 'approved' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-emerald-950">
                    State Bar Council Credentials Verified
                  </span>
                  <span>
                    Your profile is active in the public directory ({lawyer.barCouncilState} Bar
                    Reg: {lawyer.barRegistrationNumber}).
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/lawyer-profile/${lawyer._id}`)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0"
              >
                View Public Profile
              </button>
            </div>
          ) : lawyer.verificationStatus === 'pending' ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-amber-950">
                    Verification In Progress — Pending Admin Audit
                  </span>
                  <span>
                    Our compliance team is validating your Bar license documents against state
                    records. You can configure your schedule in the meantime.
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                Review Pending
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-3 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold block">Verification Incomplete</span>
                <span>{lawyer.verificationNotes || 'Please contact platform administration.'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lawyer Header Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={
              lawyer?.avatar ||
              user?.avatar ||
              'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
            }
            alt={user?.name}
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-amber-400"
          />
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Advocate Chambers
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {user?.name || 'Advocate'}
            </h1>
            <p className="text-xs text-slate-300">
              {lawyer?.primaryDomain} • {lawyer?.experienceYears} Years Practice • {lawyer?.city},{' '}
              {lawyer?.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('settings')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4" /> Practice Settings
          </button>
        </div>
      </div>

      {/* Advocate Stats Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{pendingRequests.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Upcoming Sessions</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{confirmedSessions.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Consultation Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900">${totalVolume}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Client Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {lawyer?.rating.toFixed(1) || '5.0'}
            </span>
            <span className="text-xs text-slate-400">({lawyer?.reviewCount || 0})</span>
          </div>
        </div>
      </div>

      {/* Main Tab Controller */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Booking Requests
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'schedule'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Consultation Schedule ({confirmedSessions.length + completedSessions.length})
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Fee & Availability Preferences
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* TAB 1: PENDING REQUESTS */}
          {activeTab === 'requests' && (
            <div>
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800 text-sm">All Requests Handled</p>
                  <p>You have no pending appointment consultation requests requiring your review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <div
                      key={req._id}
                      className="p-5 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{req.clientName}</h4>
                          <span className="text-xs text-slate-500">({req.clientEmail})</span>
                          <StatusBadge status={req.status} size="sm" />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">
                            Requested Slot: {req.appointmentDate} at {req.startTime} – {req.endTime}
                          </span>
                          <span className="capitalize">
                            Format: {req.consultationType.replace('_', ' ')}
                          </span>
                          <span className="text-emerald-700 font-bold">Fee: ${req.fee}</span>
                        </div>

                        <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200 max-w-xl">
                          "{req.issueSummary}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateStatus(req._id, 'confirmed')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Accept & Confirm
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Please enter reason for declining:');
                            if (reason) handleUpdateStatus(req._id, 'rejected', reason);
                          }}
                          className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONSULTATION SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {confirmedSessions.concat(completedSessions).length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No confirmed or completed sessions yet.
                </div>
              ) : (
                confirmedSessions.concat(completedSessions).map((apt) => (
                  <div
                    key={apt._id}
                    className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{apt.clientName}</h4>
                        <span className="text-xs text-slate-500">({apt.clientEmail})</span>
                        <StatusBadge status={apt.status} size="sm" />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {apt.appointmentDate} at {apt.startTime} – {apt.endTime}
                        </span>
                        <span className="capitalize">
                          {apt.consultationType.replace('_', ' ')}
                        </span>
                        <span className="text-emerald-700 font-bold">${apt.fee}</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1 italic">
                        "{apt.issueSummary}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/consultations/${apt._id}`)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-colors shadow-sm"
                      >
                        Open Case Dossier
                      </button>

                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(apt._id, 'in_progress')}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        >
                          Start Session
                        </button>
                      )}

                      {apt.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(apt._id, 'completed')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS & AVAILABILITY */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-5 text-xs">
              {settingsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Advocate settings and rates saved successfully.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 uppercase tracking-wider mb-1">
                    Consultation Fee ($ USD)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 uppercase tracking-wider mb-1">
                    Session Duration (Minutes)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes (Standard)</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 uppercase tracking-wider mb-1">
                  Practice Biography
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAccepting}
                  onChange={(e) => setIsAccepting(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">
                  Accept New Client Inquiries (Profile visible in search results)
                </span>
              </label>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {savingSettings ? 'Saving...' : 'Update Practice Preferences'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
