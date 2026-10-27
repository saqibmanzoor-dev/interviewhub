import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Video, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  UserCheck, 
  Lock, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Code2,
  X,
  ExternalLink,
  User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Please fill in both email and password.');
      return;
    }
    const res = await login(email, password);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  const handleDemoSignIn = async (role) => {
    setLocalError(null);
    const res = await demoLogin(role);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  // Google OAuth flow initiation
  const handleGoogleSelect = (googleEmail, googleName) => {
    setShowGoogleModal(false);
    const params = new URLSearchParams();
    if (googleEmail) params.set('email', googleEmail);
    if (googleName) params.set('name', googleName);
    
    // Redirect through backend Google OAuth endpoint (which handles real Google or simulated session)
    window.location.href = `/api/v1/auth/google?${params.toString()}`;
  };

  const handleLiveGoogleDirect = () => {
    setShowGoogleModal(false);
    window.location.href = '/api/v1/auth/google';
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[1.5px] shadow-2xl shadow-emerald-500/20 mb-4">
          <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
            <Video className="w-7 h-7 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Welcome to <span className="text-emerald-400">InterviewHub</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Real-time collaborative video interviews, live coding, and hiring analytics.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 relative z-10">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800">
          
          {/* Quick Demo Login Personas Section */}
          <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                1-Click Instant Demo Login
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Explore InterviewHub immediately with seeded data across four key stakeholder roles:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('candidate')}
                disabled={isLoading}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  SC
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 truncate">Candidate</div>
                  <div className="text-[10px] text-slate-400 truncate">Sarah Chen</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('interviewer')}
                disabled={isLoading}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  AM
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 truncate">Interviewer</div>
                  <div className="text-[10px] text-slate-400 truncate">Alex Morgan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('recruiter')}
                disabled={isLoading}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                  DM
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 truncate">Recruiter</div>
                  <div className="text-[10px] text-slate-400 truncate">David Miller</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('admin')}
                disabled={isLoading}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                  EV
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 truncate">Admin</div>
                  <div className="text-[10px] text-slate-400 truncate">Elena Vance</div>
                </div>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-[#111827] px-3 text-slate-500 font-medium">Or continue with credentials</span>
            </div>
          </div>

          {/* Error Alert */}
          {(localError || error) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.chen@example.com"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <span className="text-[11px] text-slate-500">Demo: Password123!</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/20 focus:outline-none transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google OAuth Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs transition-colors group shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-semibold text-slate-100 group-hover:text-white">Sign in with Google OAuth</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Create an account
            </Link>
          </div>

        </div>
      </div>

      {/* Google OAuth Account Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#111622] border border-slate-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white p-2.5 mb-3 shadow-md">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Sign in with Google</h3>
              <p className="text-xs text-slate-400 mt-0.5">to continue to <strong className="text-slate-200">InterviewHub</strong></p>
            </div>

            {/* Account List */}
            <div className="space-y-2 mb-4">
              {[
                { name: 'Alex Chen', email: 'alex.chen.dev@gmail.com', role: 'Candidate profile' },
                { name: 'Elena Rostova', email: 'elena.rostova@gmail.com', role: 'Interviewer profile' },
                { name: 'David Miller', email: 'david.miller.hire@gmail.com', role: 'Recruiter profile' }
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleGoogleSelect(acc.email, acc.name)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      {acc.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400">{acc.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{acc.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Google Account */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2 mb-4">
              <label className="block text-[11px] font-medium text-slate-400">Or use a custom Google email:</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your.name@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => customGoogleEmail && handleGoogleSelect(customGoogleEmail, customGoogleEmail.split('@')[0])}
                  disabled={!customGoogleEmail.includes('@')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>

            {/* Live Google Cloud OAuth redirect */}
            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                onClick={handleLiveGoogleDirect}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 mx-auto font-medium"
              >
                <span>Direct Live Redirect to accounts.google.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-slate-500 mt-1">Requires GOOGLE_CLIENT_ID configured in server/.env</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
