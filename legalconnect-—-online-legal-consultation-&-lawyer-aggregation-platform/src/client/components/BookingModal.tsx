import React, { useState, useEffect } from 'react';
import { Lawyer, ConsultationType, AvailabilitySlot } from '../types/index.ts';
import { api } from '../api/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  Building,
  Sparkles,
  AlertCircle,
  CheckCircle,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { AiLegalAssistantModal } from './AiLegalAssistantModal.tsx';

interface BookingModalProps {
  lawyer: Lawyer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointmentId: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  lawyer,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, switchDemoRole } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [consultationType, setConsultationType] = useState<ConsultationType>('video');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [issueSummary, setIssueSummary] = useState<string>('');
  const [clientQuestions, setClientQuestions] = useState<string[]>(['']);
  const [aiBrief, setAiBrief] = useState<any>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set default date to tomorrow
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isoDate = tomorrow.toISOString().split('T')[0];
      setSelectedDate(isoDate);
      setStep(1);
      setError(null);
    }
  }, [isOpen]);

  // Load lawyer availability
  useEffect(() => {
    if (lawyer && isOpen) {
      api.getLawyerAvailability(lawyer._id).then((res) => {
        setAvailability(res.availability || []);
      });
    }
  }, [lawyer, isOpen]);

  // Calculate available time slots for the selected date
  useEffect(() => {
    if (!lawyer || !selectedDate) return;

    setLoadingSlots(true);
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay();

    // Find schedule for this day
    const daySchedule = availability.find((a) => a.dayOfWeek === dayOfWeek);

    // Fetch existing appointments on this date using the public booked-slots endpoint
    api.getBookedSlots(lawyer._id, selectedDate)
      .then((res) => {
        const taken = res.bookedSlots || [];
        setBookedSlots(taken);

        // Generate time slots
        const slots: string[] = [];
        const startHour = daySchedule ? parseInt(daySchedule.startTime.split(':')[0], 10) : 9;
        const endHour = daySchedule ? parseInt(daySchedule.endTime.split(':')[0], 10) : 17;
        const intervalMins = lawyer.consultationDurationMinutes || 45;

        for (let h = startHour; h < endHour; h++) {
          for (let m = 0; m < 60; m += intervalMins) {
            if (m + intervalMins <= 60 || m === 0) {
              const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
              // Avoid break time if configured
              if (
                daySchedule?.breakStartTime &&
                timeStr >= daySchedule.breakStartTime &&
                timeStr < (daySchedule.breakEndTime || '14:00')
              ) {
                continue;
              }
              slots.push(timeStr);
            }
          }
        }

        setAvailableSlots(slots);
        if (slots.length > 0 && !selectedTime) {
          // Select first non-booked slot
          const firstOpen = slots.find((s) => !taken.includes(s));
          if (firstOpen) setSelectedTime(firstOpen);
        }
      })
      .catch(() => {
        setBookedSlots([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedDate, availability, lawyer]);

  if (!isOpen || !lawyer) return null;

  const handleAddQuestion = () => {
    if (clientQuestions.length < 5) {
      setClientQuestions([...clientQuestions, '']);
    }
  };

  const handleUpdateQuestion = (index: number, val: string) => {
    const updated = [...clientQuestions];
    updated[index] = val;
    setClientQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setClientQuestions(clientQuestions.filter((_, i) => i !== index));
  };

  const handleSubmitBooking = async () => {
    if (!user) {
      setError('Please sign in or select a demo profile to complete this booking.');
      setStep(3);
      return;
    }

    if (!issueSummary.trim()) {
      setError('Please provide a brief description of your legal inquiry.');
      setStep(2);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError('Please select an appointment date and start time slot.');
      setStep(1);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const filteredQuestions = clientQuestions.filter((q) => q.trim() !== '');

      const res = await api.bookAppointment({
        lawyerId: lawyer._id,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        consultationType,
        legalDomainId: lawyer.primaryDomain,
        legalDomainName: lawyer.primaryDomain,
        issueSummary: issueSummary.trim(),
        clientQuestions: filteredQuestions,
        aiBrief,
      });

      onSuccess(res.appointment._id);
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment. Slot may have been taken.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={
                lawyer.avatar ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
              }
              alt={lawyer.name}
              className="w-11 h-11 rounded-lg object-cover ring-2 ring-amber-400/40"
            />
            <div>
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-1.5">
                Schedule Consultation
              </h3>
              <p className="text-xs text-amber-300">
                With {lawyer.name} • ${lawyer.consultationFee} / {lawyer.consultationDurationMinutes}m
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

        {/* Step Tabs */}
        <div className="grid grid-cols-3 text-center border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setStep(1)}
            className={`py-3 transition-colors border-b-2 ${
              step === 1
                ? 'border-amber-500 text-amber-700 bg-white'
                : 'border-transparent text-slate-500'
            }`}
          >
            1. Date & Time Slot
          </button>
          <button
            onClick={() => setStep(2)}
            className={`py-3 transition-colors border-b-2 ${
              step === 2
                ? 'border-amber-500 text-amber-700 bg-white'
                : 'border-transparent text-slate-500'
            }`}
          >
            2. Legal Matter Details
          </button>
          <button
            onClick={() => setStep(3)}
            className={`py-3 transition-colors border-b-2 ${
              step === 3
                ? 'border-amber-500 text-amber-700 bg-white'
                : 'border-transparent text-slate-500'
            }`}
          >
            3. Confirm & Reserve
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {!user && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You are currently browsing as a guest.</span>
              </div>
              <button
                type="button"
                onClick={() => switchDemoRole('client')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 self-start sm:self-auto"
              >
                1-Click Sign In as Demo Client
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Date & Time Slot */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Consultation Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                  Select Consultation Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsultationType('video')}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      consultationType === 'video'
                        ? 'border-amber-500 bg-amber-50/50 text-slate-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Video className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold">Video Room</span>
                    <span className="text-[10px] text-slate-500">Encrypted HD WebRTC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationType('phone')}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      consultationType === 'phone'
                        ? 'border-amber-500 bg-amber-50/50 text-slate-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Phone className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold">Phone Call</span>
                    <span className="text-[10px] text-slate-500">Direct Tele-Counsel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationType('in_person')}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      consultationType === 'in_person'
                        ? 'border-amber-500 bg-amber-50/50 text-slate-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Building className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold">In-Office</span>
                    <span className="text-[10px] text-slate-500">{lawyer.city} Chambers</span>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                  Select Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <CalendarIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Available Time Slots ({selectedDate})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Duration: {lawyer.consultationDurationMinutes} mins
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    Checking advocate availability...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No open consultation slots on this date. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition-all ${
                            isBooked
                              ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                              : isSelected
                              ? 'bg-slate-900 text-amber-400 font-bold shadow-sm ring-2 ring-amber-400'
                              : 'bg-white border border-slate-200 hover:border-amber-400 text-slate-700'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Legal Matter Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50 p-3 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-900">
                    Need help structuring your consultation questions?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-sm transition-colors"
                >
                  Launch AI Prep Assistant
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                  Summary of Legal Matter <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={issueSummary}
                  onChange={(e) => setIssueSummary(e.target.value)}
                  placeholder="Summarize the core facts, contract disputes, pending deadlines, or legal questions you wish to resolve with the lawyer..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Specific Questions for the Advocate (Optional)
                  </label>
                  {clientQuestions.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="text-xs text-amber-700 hover:text-amber-800 font-medium"
                    >
                      + Add Question
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {clientQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                        placeholder={`Question ${idx + 1}`}
                        className="flex-1 text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      {clientQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm & Reserve */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500">Advocate</span>
                  <span className="font-bold text-slate-900">{lawyer.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500">Practice Area</span>
                  <span className="font-medium text-slate-800">{lawyer.primaryDomain}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-bold text-slate-900">
                    {selectedDate} at {selectedTime}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500">Format</span>
                  <span className="font-medium text-slate-800 capitalize">
                    {consultationType.replace('_', ' ')} Consultation
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-sm font-bold">
                  <span className="text-slate-800">Total Consultation Fee</span>
                  <span className="text-emerald-700">${lawyer.consultationFee}.00</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>LegalConnect Protection:</strong> You will receive room access details
                  immediately. If the lawyer fails to attend, you are entitled to an unconditional
                  reschedule or platform fee refund.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && (!selectedDate || !selectedTime)}
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 text-xs font-semibold shadow-md transition-all"
            >
              Continue to Step {step + 1}
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitBooking}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Confirming Reservation...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Confirm & Schedule Consultation
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* AI Assistant Modal Integration */}
      <AiLegalAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        practiceArea={lawyer.primaryDomain}
        onApplyBrief={(brief, questions) => {
          setAiBrief({ summary: brief });
          setIssueSummary(brief.slice(0, 450) + '...');
          if (questions.length > 0) {
            setClientQuestions(questions);
          }
        }}
      />
    </div>
  );
};
