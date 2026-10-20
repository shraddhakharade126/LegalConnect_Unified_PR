import React from 'react';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface UnauthorizedPageProps {
  navigate: (path: string) => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ navigate }) => {
  const { user } = useAuth();

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-serif font-bold text-slate-900">403 — Access Restricted</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          You do not have the required role permissions to access this administrative or privileged
          legal resource.
        </p>
        {user && (
          <p className="text-[11px] text-slate-500 font-mono">
            Your current logged-in role is: <strong>'{user.role}'</strong>
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4" /> Go to Homepage
        </button>
        {!user && (
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        )}
      </div>
    </div>
  );
};
