import React from 'react';
import { HelpCircle, Home, Search } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center shadow-sm">
        <HelpCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-slate-900">404 — Page Not Found</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          The legal consultation dossier or page you requested could not be found. It may have been
          moved or deleted.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4" /> Go to Homepage
        </button>
        <button
          onClick={() => navigate('/lawyers')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
        >
          <Search className="w-4 h-4" /> Search Directory
        </button>
      </div>
    </div>
  );
};
