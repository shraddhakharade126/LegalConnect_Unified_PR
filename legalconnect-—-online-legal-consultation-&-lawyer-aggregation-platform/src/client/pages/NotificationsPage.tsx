import React from 'react';
import { useNotifications } from '../context/NotificationContext.tsx';
import { Bell, CheckCheck, Clock, Calendar, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface NotificationsPageProps {
  navigate: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ navigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Notifications & Alerts</h1>
            <p className="text-xs text-slate-500">
              Stay updated on consultation statuses, case files, and verification milestones
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">All Caught Up</h3>
          <p className="text-xs text-slate-500">You have no notifications on record.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => {
                if (!notif.read) markAsRead(notif._id);
                if (notif.link) navigate(notif.link);
              }}
              className={`p-5 cursor-pointer hover:bg-slate-50 transition-colors flex items-start justify-between gap-4 ${
                !notif.read ? 'bg-amber-50/40' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>

              {notif.link && (
                <button className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 shrink-0 self-center">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
