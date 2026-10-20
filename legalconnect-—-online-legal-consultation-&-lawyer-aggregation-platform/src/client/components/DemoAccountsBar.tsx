import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/index.ts';
import { Shield, User, Briefcase, Database, Sparkles, CheckCircle2 } from 'lucide-react';

export const DemoAccountsBar: React.FC = () => {
  const { user, switchDemoRole, logout } = useAuth();
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    api.getSystemStatus().then((res) => setDbStatus(res.database)).catch(() => {});
  }, []);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 py-1.5 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[10px]">
            <Sparkles className="w-3.5 h-3.5" /> Demo Sandbox:
          </span>
          <span className="text-slate-400 hidden sm:inline">Switch roles instantly:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => switchDemoRole('client')}
              className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                user?.role === 'client'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <User className="w-3 h-3" /> Client
            </button>
            <button
              onClick={() => switchDemoRole('lawyer')}
              className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                user?.role === 'lawyer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Briefcase className="w-3 h-3" /> Lawyer
            </button>
            <button
              onClick={() => switchDemoRole('admin')}
              className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
                user?.role === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" /> Admin
            </button>
            {user && (
              <button
                onClick={logout}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-400 transition-colors"
                title="Log out"
              >
                Log Out
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500">Active as:</span>
              <span className="font-semibold text-white">{user.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-amber-300 rounded uppercase font-mono">
                {user.role}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Not logged in (Browsing as Guest)</span>
          )}

          <div
            className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50"
            title={dbStatus?.error || 'Database storage engine'}
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span>DB:</span>
            <span className="text-slate-200 font-medium">
              {dbStatus?.type === 'atlas' ? 'MongoDB Atlas' : 'Persistent Mongoose'}
            </span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
