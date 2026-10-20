import React, { useState, useEffect } from 'react';
import { api } from '../api/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Appointment, Review, LegalDocument } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { DocumentUploadModal } from '../components/DocumentUploadModal.tsx';
import {
  Video,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  Star,
  CheckCircle,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  UploadCloud,
  Edit,
  Save,
  MessageSquare,
} from 'lucide-react';
import { ConsultationRealtimeChat } from '../components/ConsultationRealtimeChat.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface ConsultationDetailsPageProps {
  appointmentId: string;
  navigate: (path: string) => void;
}

export const ConsultationDetailsPage: React.FC<ConsultationDetailsPageProps> = ({
  appointmentId,
  navigate,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'brief' | 'notes'>('chat');

  // Lawyer notes editing
  const [lawyerNotes, setLawyerNotes] = useState<string>('');
  const [newActionItem, setNewActionItem] = useState<string>('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  // Client review submission
  const [rating, setRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  const loadConsultation = async () => {
    setLoading(true);
    try {
      const [aptRes, docRes] = await Promise.all([
        api.getAppointmentById(appointmentId),
        api.getDocuments(),
      ]);
      setAppointment(aptRes.appointment);
      setReview(aptRes.review);
      setLawyerNotes(aptRes.appointment.lawyerNotes || '');
      setActionItems(aptRes.appointment.actionItems || []);

      // Filter docs for this appointment
      const related = (docRes.documents || []).filter(
        (d: LegalDocument) => d.relatedAppointmentId === appointmentId
      );
      setDocuments(related);
    } catch (err) {
      console.error('Error fetching consultation details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultation();
  }, [appointmentId]);

  const handleSaveLawyerNotes = async () => {
    setSavingNotes(true);
    try {
      await api.updateAppointmentStatus(appointmentId, {
        lawyerNotes,
        actionItems,
      });
      showToast('Advocate notes and action items updated successfully.', 'success');
      loadConsultation();
    } catch (err: any) {
      showToast(err.message || 'Error saving notes.', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAddActionItem = () => {
    if (newActionItem.trim()) {
      setActionItems([...actionItems, newActionItem.trim()]);
      setNewActionItem('');
    }
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, { status: newStatus });
      showToast(`Consultation status updated to ${newStatus.replace('_', ' ')}.`, 'success');
      loadConsultation();
    } catch (err: any) {
      showToast(err.message || 'Error updating status.', 'error');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      await api.createReview({
        consultationId: appointmentId,
        rating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      showToast('Thank you! Your verified client review was published.', 'success');
      setReviewSuccess(true);
      loadConsultation();
    } catch (err: any) {
      showToast(err.message || 'Error submitting review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCopyLink = () => {
    if (appointment?.meetingLink) {
      navigator.clipboard.writeText(appointment.meetingLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
        <span className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading confidential case room...</span>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold font-serif text-slate-900">Consultation Not Found</h2>
        <p className="text-xs text-slate-500">
          This consultation record could not be found or you do not have permission to access it.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-slate-900 text-amber-400 text-xs font-semibold rounded-xl"
        >
          Return Home
        </button>
      </div>
    );
  }

  const isClient = user?._id === appointment.clientId || user?.role === 'client';
  const isLawyer = user?.role === 'lawyer';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => {
          if (isLawyer) navigate('/lawyer-dashboard');
          else if (isAdmin) navigate('/admin');
          else navigate('/client-dashboard');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </button>

      {/* Case Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
                Case Room Ref: LC-{appointment._id.substring(0, 8).toUpperCase()}
              </span>
              <StatusBadge status={appointment.status} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {appointment.legalDomainName} Consultation
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Between <strong className="text-white">{appointment.clientName}</strong> and Advocate{' '}
              <strong className="text-white">{appointment.lawyerName}</strong>
            </p>
          </div>

          {/* Status Controllers for Advocate */}
          {(isLawyer || isAdmin) && (
            <div className="flex items-center gap-2 shrink-0">
              {appointment.status === 'requested' && (
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Accept & Confirm
                </button>
              )}
              {appointment.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Mark In Progress
                </button>
              )}
              {appointment.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Conclude & Mark Completed
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Meeting Room Connection Box */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              Encrypted Consultation Video Room
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Scheduled Date: <strong>{appointment.appointmentDate}</strong> at{' '}
              <strong>
                {appointment.startTime} – {appointment.endTime}
              </strong>
            </p>
            <span className="text-[11px] text-amber-300 block mt-1">
              End-to-end encrypted WebRTC channel. No software installation required.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {appointment.meetingLink && (
            <>
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy Link
              </button>
              <a
                href={appointment.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Video className="w-4 h-4" /> Join Video Room
              </a>
            </>
          )}
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'chat'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Real-Time Consultation Chat</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'notes'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Advocate Counsel & Action Items</span>
          {appointment.actionItems && appointment.actionItems.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-800 rounded-full text-[10px]">
              {appointment.actionItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brief')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'brief'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Client Matter Summary</span>
        </button>
      </div>

      {/* Main Grid: Left Workspace & Right Case Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Dynamic Workspace based on Active Tab */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'chat' && (
            <ConsultationRealtimeChat
              appointment={appointment}
              onOpenDocModal={() => setIsDocModalOpen(true)}
            />
          )}

          {activeTab === 'brief' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" /> Client Matter Summary & Inquiry
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {appointment.issueSummary}
              </p>

              {/* Client Prepared Questions */}
              {appointment.clientQuestions && appointment.clientQuestions.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-800 block mb-2">
                    Client's Specific Questions for the Session:
                  </span>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 pl-1">
                    {appointment.clientQuestions.map((q, i) => (
                      <li key={i} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Advocate Consultation Notes &
                    Action Items
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Legal advisory summary and recommended next steps
                  </p>
                </div>

                {(isLawyer || isAdmin) && (
                  <button
                    type="button"
                    onClick={handleSaveLawyerNotes}
                    disabled={savingNotes}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                )}
              </div>

              {isLawyer || isAdmin ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confidential Advocate Counsel & Observations:
                    </label>
                    <textarea
                      rows={4}
                      value={lawyerNotes}
                      onChange={(e) => setLawyerNotes(e.target.value)}
                      placeholder="Document your legal assessment, statutory considerations, and advice provided to the client..."
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Client Action Items:
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newActionItem}
                        onChange={(e) => setNewActionItem(e.target.value)}
                        placeholder="Add an actionable next step for the client..."
                        className="flex-1 text-xs p-2 border border-slate-300 rounded-lg outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddActionItem}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg"
                      >
                        + Add Item
                      </button>
                    </div>

                    <ul className="space-y-1.5 text-xs">
                      {actionItems.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <span>• {item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveActionItem(idx)}
                            className="text-slate-400 hover:text-rose-600 text-[10px]"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {appointment.lawyerNotes ? (
                    <p className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
                      {appointment.lawyerNotes}
                    </p>
                  ) : (
                    <div className="p-4 text-center text-slate-400 italic bg-slate-50 rounded-xl">
                      The advocate will post written notes and actionable guidance following the
                      consultation.
                    </div>
                  )}

                  {appointment.actionItems && appointment.actionItems.length > 0 && (
                    <div className="pt-2">
                      <span className="font-bold text-slate-900 block mb-2">
                        Advocate's Recommended Action Plan:
                      </span>
                      <ul className="space-y-1.5">
                        {appointment.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-slate-700">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Client Review Section (If Completed) */}
          {appointment.status === 'completed' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Client Consultation
                Review
              </h3>

              {review ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                        />
                      ))}
                      <span className="font-bold text-slate-900 ml-2">{review.title}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                      Verified Consultation
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                </div>
              ) : isClient ? (
                <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
                  {reviewSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                      Thank you! Your verified review has been published.
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Rating (1 to 5 Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(starVal)}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 transition-all ${
                              starVal <= rating
                                ? 'fill-amber-400 text-amber-400 scale-110'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-800 ml-2">
                        {rating} out of 5 stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Review Headline</label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="E.g., Invaluable advice regarding our SAFE terms"
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Detailed Feedback
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Describe how the consultation helped your matter..."
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    {submittingReview ? 'Submitting...' : 'Publish Verified Review'}
                  </button>
                </form>
              ) : (
                <div className="p-4 text-center text-slate-400 italic bg-slate-50 rounded-xl text-xs">
                  Awaiting review submission from client.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Documents Vault for this Consultation */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" /> Case Documents ({documents.length})
                </h3>
                <p className="text-[10px] text-slate-400">Privileged case attachments</p>
              </div>

              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="px-2.5 py-1 bg-slate-900 text-amber-400 text-[11px] font-bold rounded-lg hover:bg-slate-800 flex items-center gap-1"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200/60">
                No documents uploaded to this case yet. Click Upload to attach agreements, notices, or evidence.
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-1 text-xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-slate-900 line-clamp-1">{doc.title}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded shrink-0">
                        {doc.documentType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>By {doc.uploadedByName}</span>
                      <span>{(doc.fileSize / 1024).toFixed(0)} KB • PDF</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={loadConsultation}
        defaultAppointmentId={appointment._id}
        defaultLawyerId={appointment.lawyerId}
      />
    </div>
  );
};
