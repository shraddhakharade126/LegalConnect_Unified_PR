import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './client/context/AuthContext.tsx';
import { NotificationProvider } from './client/context/NotificationContext.tsx';
import { ToastProvider } from './client/context/ToastContext.tsx';
import { DemoAccountsBar } from './client/components/DemoAccountsBar.tsx';
import { Navbar } from './client/components/Navbar.tsx';
import { Footer } from './client/components/Footer.tsx';

import { ThemeProvider } from './client/context/ThemeContext.tsx';

// Pages
import { HomePage } from './client/pages/HomePage.tsx';
import { LawyerDirectoryPage } from './client/pages/LawyerDirectoryPage.tsx';
import { LawyerProfilePage } from './client/pages/LawyerProfilePage.tsx';
import { BookingCalendarPage } from './client/pages/BookingCalendarPage.tsx';
import { ClientDashboard } from './client/pages/ClientDashboard.tsx';
import { LawyerDashboard } from './client/pages/LawyerDashboard.tsx';
import { AdminDashboard } from './client/pages/AdminDashboard.tsx';
import { ConsultationDetailsPage } from './client/pages/ConsultationDetailsPage.tsx';
import { DocumentCentrePage } from './client/pages/DocumentCentrePage.tsx';
import { ReviewsPage } from './client/pages/ReviewsPage.tsx';
import { NotificationsPage } from './client/pages/NotificationsPage.tsx';
import { RegisterPage } from './client/pages/RegisterPage.tsx';
import { LoginPage } from './client/pages/LoginPage.tsx';
import { ProfileSettingsPage } from './client/pages/ProfileSettingsPage.tsx';
import { UnauthorizedPage } from './client/pages/UnauthorizedPage.tsx';
import { NotFoundPage } from './client/pages/NotFoundPage.tsx';

function MainRouter() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getQueryParams = () => {
    return new URLSearchParams(window.location.search);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">
        <span className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-serif tracking-widest uppercase">
          Initializing LegalConnect Platform...
        </span>
      </div>
    );
  }

  // Route matching
  const renderPage = () => {
    const path = currentPath;

    // Home
    if (path === '/' || path === '') {
      return <HomePage navigate={navigate} />;
    }

    // Register & Login
    if (path === '/register') {
      return <RegisterPage navigate={navigate} />;
    }
    if (path === '/login') {
      return <LoginPage navigate={navigate} />;
    }

    // Lawyer Directory & Profile
    if (path === '/lawyers') {
      return <LawyerDirectoryPage navigate={navigate} initialParams={getQueryParams()} />;
    }
    if (path.startsWith('/lawyer-profile/')) {
      const id = path.replace('/lawyer-profile/', '');
      return <LawyerProfilePage lawyerId={id} navigate={navigate} />;
    }

    // Standalone Booking Calendar
    if (path === '/booking-calendar') {
      return <BookingCalendarPage navigate={navigate} />;
    }

    // Consultation Details
    if (path.startsWith('/consultations/')) {
      const id = path.replace('/consultations/', '');
      return <ConsultationDetailsPage appointmentId={id} navigate={navigate} />;
    }

    // Document Centre
    if (path === '/documents') {
      if (!user) {
        navigate('/login');
        return <LoginPage navigate={navigate} />;
      }
      return <DocumentCentrePage navigate={navigate} />;
    }

    // Reviews
    if (path === '/reviews') {
      return <ReviewsPage navigate={navigate} />;
    }

    // Notifications
    if (path === '/notifications') {
      if (!user) {
        navigate('/login');
        return <LoginPage navigate={navigate} />;
      }
      return <NotificationsPage navigate={navigate} />;
    }

    // Profile & Settings
    if (path === '/profile-settings') {
      if (!user) {
        navigate('/login');
        return <LoginPage navigate={navigate} />;
      }
      return <ProfileSettingsPage navigate={navigate} />;
    }

    // Client Dashboard
    if (path === '/client-dashboard') {
      if (!user) {
        navigate('/login');
        return <LoginPage navigate={navigate} />;
      }
      return <ClientDashboard navigate={navigate} />;
    }

    // Lawyer Dashboard (RBAC check)
    if (path === '/lawyer-dashboard') {
      if (!user) {
        navigate('/login');
        return <LoginPage navigate={navigate} />;
      }
      if (user.role !== 'lawyer' && user.role !== 'admin') {
        return <UnauthorizedPage navigate={navigate} />;
      }
      return <LawyerDashboard navigate={navigate} />;
    }

    // Admin Dashboard (RBAC check)
    if (path === '/admin') {
      if (!user) {
        navigate('/login');
        return <LoginPage navigate={navigate} />;
      }
      if (user.role !== 'admin') {
        return <UnauthorizedPage navigate={navigate} />;
      }
      return <AdminDashboard navigate={navigate} />;
    }

    // 403 Forbidden
    if (path === '/unauthorized') {
      return <UnauthorizedPage navigate={navigate} />;
    }

    // 404 Fallback
    return <NotFoundPage navigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 transition-colors">
      {/* 1-Click Role Switcher Sandbox Bar */}
      <DemoAccountsBar />

      {/* Main Responsive Header */}
      <Navbar currentPath={currentPath} navigate={navigate} />

      {/* Active Page View */}
      <main className="flex-1">{renderPage()}</main>

      {/* Professional Legal Platform Footer */}
      <Footer navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <MainRouter />
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
