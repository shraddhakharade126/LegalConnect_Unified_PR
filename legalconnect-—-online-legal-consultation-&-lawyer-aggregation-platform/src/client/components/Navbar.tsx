import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import {
  Scale,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Briefcase,
  FileText,
  Star,
  CheckCircle,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, lawyer, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'lawyer') return '/lawyer-dashboard';
    return '/client-dashboard';
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setNotifDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-7 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold font-serif tracking-tight text-white flex items-center gap-1.5">
                LegalConnect
              </span>
              <span className="block text-[10px] text-amber-400 font-medium tracking-widest uppercase">
                Verified Legal Network
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNav('/lawyers')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPath === '/lawyers'
                  ? 'text-amber-400 bg-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Lawyer Directory
            </button>
            <button
              onClick={() => handleNav('/documents')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPath === '/documents'
                  ? 'text-amber-400 bg-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Document Centre
            </button>
            <button
              onClick={() => handleNav('/reviews')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPath === '/reviews'
                  ? 'text-amber-400 bg-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Reviews
            </button>
            {user && (
              <button
                onClick={() => handleNav(getDashboardRoute())}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentPath.includes('dashboard') || currentPath === '/admin'
                    ? 'text-amber-400 bg-slate-800 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {user.role === 'admin'
                  ? 'Admin Portal'
                  : user.role === 'lawyer'
                  ? 'Lawyer Dashboard'
                  : 'Client Dashboard'}
              </button>
            )}
          </nav>

          {/* Right Action Icons & User controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-300" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleNav('/notifications')}
                        className="text-xs text-amber-700 hover:text-amber-800 font-medium"
                      >
                        View all
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => {
                              markAsRead(n._id);
                              if (n.link) handleNav(n.link);
                              setNotifDropdownOpen(false);
                            }}
                            className={`p-3 cursor-pointer text-left hover:bg-slate-50 transition-colors ${
                              !n.read ? 'bg-amber-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                                {n.title}
                              </h4>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotifDropdownOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-left"
                >
                  <img
                    src={
                      user.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400/40"
                  />
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-white leading-tight line-clamp-1">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-amber-400/90 capitalize leading-tight">
                      {user.role} {lawyer ? `(${lawyer.verificationStatus})` : ''}
                    </p>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => handleNav(getDashboardRoute())}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => handleNav('/profile-settings')}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        Profile & Settings
                      </button>
                      <button
                        onClick={() => handleNav('/documents')}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Document Centre
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-md transition-all"
                >
                  Join Platform
                </button>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => handleNav('/lawyers')}
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-800"
          >
            Lawyer Directory
          </button>
          <button
            onClick={() => handleNav('/documents')}
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-800"
          >
            Document Centre
          </button>
          <button
            onClick={() => handleNav('/reviews')}
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-800"
          >
            Reviews
          </button>
          {user && (
            <button
              onClick={() => handleNav(getDashboardRoute())}
              className="block w-full text-left px-3 py-2 rounded-md text-sm text-amber-400 font-semibold hover:bg-slate-800"
            >
              My Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
};
