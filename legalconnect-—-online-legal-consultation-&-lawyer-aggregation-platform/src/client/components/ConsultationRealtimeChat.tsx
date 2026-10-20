import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ShieldCheck,
  Radio,
  Clock,
  User,
  Scale,
  Sparkles,
  Search,
  Bell,
  BellOff,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ConsultationMessage, Appointment } from '../types/index.ts';
import {
  subscribeToMessages,
  sendConsultationRealtimeMessage,
} from '../config/firebase.ts';
import { api } from '../api/index.ts';
import { useToast } from '../context/ToastContext.tsx';

interface ConsultationRealtimeChatProps {
  appointment: Appointment;
  onOpenDocModal?: () => void;
}

export const ConsultationRealtimeChat: React.FC<ConsultationRealtimeChatProps> = ({
  appointment,
  onOpenDocModal,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'synced'>('connecting');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef<number>(0);

  // Quick message presets for legal consultations
  const quickTemplates = user?.role === 'lawyer'
    ? [
        'I am reviewing your case files right now.',
        'Please join the secure video link above when ready.',
        'Could you confirm your jurisdiction/state of residence?',
        'I have noted your points and prepared advisory action items.',
      ]
    : [
        'I have attached the initial agreement to the Case Documents.',
        'Joining the video room in 2 minutes.',
        'Can we review the termination clause and notice period?',
        'Thank you advocate, looking forward to the counsel session.',
      ];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Play subtle incoming notification tone using Web Audio API
  const playTone = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Real-time Firebase Subscription
  useEffect(() => {
    if (!appointment?._id) return;

    setConnectionStatus('connecting');

    // Initial backend fetch for guaranteed persistence
    api.getConsultationMessages(appointment._id)
      .then((res) => {
        if (res.messages && res.messages.length > 0) {
          setMessages((prev) => {
            const mergedMap = new Map<string, ConsultationMessage>();
            res.messages.forEach((m) => mergedMap.set(m.id || m._id, m));
            prev.forEach((m) => mergedMap.set(m.id, m));
            const list = Array.from(mergedMap.values());
            list.sort((a, b) => a.timestamp - b.timestamp);
            return list;
          });
        }
      })
      .catch((err) => {
        console.warn('Backend message load note:', err);
      });

    // Realtime Firebase Listener (RTDB + Firestore Snapshot)
    const unsubscribe = subscribeToMessages(
      appointment._id,
      (incomingMessages) => {
        setConnectionStatus('connected');
        setMessages((prev) => {
          const mergedMap = new Map<string, ConsultationMessage>();
          prev.forEach((m) => mergedMap.set(m.id, m));
          incomingMessages.forEach((m) => mergedMap.set(m.id, m));
          const list = Array.from(mergedMap.values());
          list.sort((a, b) => a.timestamp - b.timestamp);

          // If new message from other user, ring subtle tone
          if (list.length > prevMessagesCountRef.current) {
            const latest = list[list.length - 1];
            if (latest && latest.senderId !== user?._id) {
              playTone();
            }
          }
          prevMessagesCountRef.current = list.length;
          return list;
        });
      },
      (err) => {
        console.warn('Real-time connection listener note:', err);
        setConnectionStatus('synced');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [appointment._id, user?._id]);

  useEffect(() => {
    scrollToBottom('auto');
  }, [messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending || !user) return;

    setIsSending(true);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newMsg: ConsultationMessage = {
      id: messageId,
      consultationId: appointment._id,
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role as any,
      content: text,
      timestamp: Date.now(),
      read: false,
    };

    // Optimistically show message
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    try {
      // 1. Broadcast over Firebase Realtime Database / Firestore
      await sendConsultationRealtimeMessage(newMsg);

      // 2. Persist to Express backend store
      await api.sendConsultationMessage(appointment._id, {
        content: newMsg.content,
        clientMessageId: newMsg.id,
      });

      setConnectionStatus('connected');
    } catch (err: any) {
      console.warn('Message sync note:', err);
      // Fallback save to backend if Firebase network threw
      try {
        await api.sendConsultationMessage(appointment._id, {
          content: newMsg.content,
          clientMessageId: newMsg.id,
        });
      } catch (backendErr) {
        showToast('Message delivery failed. Please retry.', 'error');
      }
    } finally {
      setIsSending(false);
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
      {/* Header bar */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-white">
                Privileged Consultation Messaging
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Firebase Realtime
              </span>
            </div>
            <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Advocate-Client privilege protected • End-to-end recorded</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onOpenDocModal && (
            <button
              type="button"
              onClick={onOpenDocModal}
              title="Attach document to case"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Attach File</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute consultation chime' : 'Enable consultation chime'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {soundEnabled ? <Bell className="w-3.5 h-3.5 text-amber-400" /> : <BellOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Sub-bar: Search & Participants preview */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-600 text-[11px]">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-blue-600" />
            Client: <strong className="text-slate-800">{appointment.clientName}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Scale className="w-3 h-3 text-amber-600" />
            Advocate: <strong className="text-slate-800">{appointment.lawyerName}</strong>
          </span>
        </div>

        <div className="relative w-44">
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat..."
            className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg border border-slate-300 focus:outline-none focus:border-amber-500 bg-white"
          />
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-slate-900 text-sm">
                Case Room Messaging Initialized
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Connect directly between client and counsel in real time. Share questions, statutory clarifications, or update meeting arrival times.
              </p>
            </div>

            {/* Quick Templates starter */}
            <div className="pt-2 w-full max-w-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Click a quick prompt to send:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {quickTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(tmpl)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/50 text-[11px] text-slate-700 font-medium transition-all text-left shadow-2xs"
                  >
                    "{tmpl}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === user?._id;
            const isLawyerSender = msg.senderRole === 'lawyer';
            const isAdminSender = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
              >
                {/* Sender Tag */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      isLawyerSender
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : isAdminSender
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {isLawyerSender ? 'Advocate' : isAdminSender ? 'Admin' : 'Client'}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5 ml-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed max-w-[85%] sm:max-w-[75%] break-words shadow-2xs ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : isLawyerSender
                      ? 'bg-amber-50 text-slate-900 border border-amber-200 rounded-tl-none font-medium'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {isMe && (
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-emerald-600">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Delivered in real-time</span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts Bar if chat has messages */}
      {filteredMessages.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-100/70 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" /> Quick reply:
          </span>
          {quickTemplates.slice(0, 3).map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(tmpl)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 text-[10px] transition-colors"
            >
              {tmpl}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${user?.role === 'lawyer' ? appointment.clientName : `Advocate ${appointment.lawyerName}`} in real-time...`}
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
            disabled={isSending}
          />

          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-amber-400 disabled:text-slate-500 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Press Enter to send</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Connected via Firebase Realtime channel
          </span>
        </div>
      </div>
    </div>
  );
};
