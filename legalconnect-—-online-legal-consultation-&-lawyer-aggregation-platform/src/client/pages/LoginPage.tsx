import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Scale,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Shield,
  User,
  Briefcase,
  Sun,
  Moon,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res: any = await login({ email: email.trim().toLowerCase(), password });
      setSuccessMsg('Authentication verified. Redirecting to your workspace...');
      const role = res?.user?.role;
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'lawyer') {
          navigate('/lawyer-dashboard');
        } else {
          navigate('/client-dashboard');
        }
      }, 350);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-9 space-y-6 transition-colors">
        {/* Header with Top Controls & Light/Dark Mode Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-serif font-bold text-slate-900 dark:text-white block leading-tight">
                LegalConnect
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                Secure Portal
              </span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="capitalize">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Sign In to Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your client consultations, advocate case room, or administrator dashboard
          </p>
        </div>

        {/* Quick Auto-Fill Role Buttons */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>1-Click Test Credentials:</span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">All Roles Ready</span>
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setCredentials('client@legalconnect.com', 'ClientPass123!')}
              className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
              title="Click to fill Client credentials"
            >
              <User className="w-3.5 h-3.5 text-emerald-500" /> Client
            </button>
            <button
              type="button"
              onClick={() => setCredentials('rajesh.lawyer@example.com', 'LawyerPass123!')}
              className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
              title="Click to fill Advocate credentials"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Lawyer
            </button>
            <button
              type="button"
              onClick={() => setCredentials('admin@legalconnect.com', 'AdminPass123!')}
              className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
              title="Click to fill Admin credentials"
            >
              <Shield className="w-3.5 h-3.5 text-purple-500" /> Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Selected Form Element(s) Styled */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Selector 1: Email label & Selector 2: Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal lowercase tracking-normal">
                (client, lawyer, or admin)
              </span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@legalconnect.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium transition-all shadow-xs"
                required
                autoComplete="email"
              />
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Selector 3: Password input */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Password</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal tracking-normal lowercase">
                (minimum 8 characters)
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium transition-all shadow-xs"
                required
                autoComplete="current-password"
              />
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Selector 4: Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to LegalConnect</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1">
          <span>Need a new account?</span>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold cursor-pointer underline-offset-2 hover:underline"
          >
            Register as Client or Lawyer
          </button>
        </div>
      </div>
    </div>
  );
};
