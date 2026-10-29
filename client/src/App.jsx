import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PublicBooking from './pages/PublicBooking';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingReschedule from './pages/BookingReschedule';
import BookingCancel from './pages/BookingCancel';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AuthCallback from './pages/AuthCallback';

// Authenticated Pages
import Dashboard from './pages/Dashboard';
import Interviews from './pages/Interviews';
import EventTypes from './pages/EventTypes';
import AvailabilityEditor from './pages/AvailabilityEditor';
import Challenges from './pages/Challenges';
import Evaluations from './pages/Evaluations';
import AdminConsole from './pages/AdminConsole';
import Settings from './pages/Settings';
import InterviewRoom from './pages/InterviewRoom';
import { Toaster } from 'sonner';

import { useAuthStore } from './store/authStore';

export default function App() {
  const { initAuth, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initAuth();
    const safetyTimer = setTimeout(() => {
      useAuthStore.setState({ isLoading: false });
    }, 1500);
    return () => clearTimeout(safetyTimer);
  }, [initAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-medium tracking-wide">Initializing InterviewHub...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-300 antialiased">
      <Toaster 
        position="bottom-right" 
        theme="dark" 
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#f4f4f5',
            fontFamily: 'inherit'
          }
        }} 
        richColors 
        closeButton 
      />
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Home Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Authentication Pages */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
          />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Cal.com-Style Public Booking Flow */}
          <Route path="/book/:slug" element={<PublicBooking />} />
          <Route path="/schedule/:username/:slug" element={<PublicBooking />} />
          <Route path="/booking/:code/confirmation" element={<BookingConfirmation />} />
          <Route path="/booking/:code/reschedule" element={<BookingReschedule />} />
          <Route path="/booking/:code/cancel" element={<BookingCancel />} />

          {/* Legal Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/event-types" element={<EventTypes />} />
            <Route path="/availability" element={<AvailabilityEditor />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/admin" element={<AdminConsole />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/room/:meetingCode" element={<InterviewRoom />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
