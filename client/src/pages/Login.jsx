import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Video, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Lock, 
  Mail, 
  User, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Code2, 
  ExternalLink 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, googleLogin, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  // Google Sign-In modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleRole, setGoogleRole] = useState('admin');
  const [googleModalError, setGoogleModalError] = useState(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '128038841095-5993nhpj6nisp82tbjk1quu84d59lrmk.apps.googleusercontent.com';
  const from = location.state?.from?.pathname || '/dashboard';

  // Handle Google Identity Services (GIS) Credential Response
  const handleGoogleCredentialResponse = async (response) => {
    if (response?.credential) {
      const payload = parseJwt(response.credential);
      const userEmail = payload?.email || '';
      const userName = payload?.name || userEmail.split('@')[0];
      const res = await googleLogin({
        email: userEmail,
        name: userName,
        role: 'admin',
        credential: response.credential
      });
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setLocalError(res.error || 'Failed to authenticate with Google');
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('google') === '1' || params.get('google') === 'direct') {
      setShowGoogleModal(true);
    }

    // Initialize Google Identity Services if available
    const initGis = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });
          const btnEl = document.getElementById('googleSignInBtnDiv');
          if (btnEl && !btnEl.hasChildNodes()) {
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'filled_black',
              size: 'large',
              shape: 'rectangular',
              width: 320,
              text: 'signin_with'
            });
          }
        } catch (e) {
          console.warn('GIS init skipped:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGis();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGis();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [location.search, googleClientId]);

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

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setGoogleModalError(null);
    if (!googleEmail.trim()) {
      setGoogleModalError('Please enter your Google email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(googleEmail.trim())) {
      setGoogleModalError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    const res = await googleLogin({
      email: googleEmail.trim(),
      name: googleName.trim() || googleEmail.split('@')[0],
      role: googleRole
    });

    if (res.success) {
      setShowGoogleModal(false);
      navigate(from, { replace: true });
    } else {
      setGoogleModalError(res.error || 'Failed to authenticate with Google.');
    }
  };

  // Direct Google Cloud OAuth 2.0 SPA redirect flow (works 100% on Vercel without server dependency)
  const handleRealGoogleOAuth = () => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${redirectUri}&response_type=token&scope=openid%20profile%20email&prompt=select_account`;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Interview<span className="text-emerald-400">Hub</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Welcome back
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Sign in to access your real-time collaborative interview workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800 rounded-2xl sm:px-10">
          
          {/* Quick Demo Role Logins */}
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant 1-Click Access</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('admin')}
                className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Admin View (You)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('interviewer')}
                className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Interviewer View</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('candidate')}
                className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Candidate View</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('recruiter')}
                className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Recruiter View</span>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0e1424] px-3 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                Or Sign In with Email / Google
              </span>
            </div>
          </div>

          {(localError || error) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{localError || error}</span>
            </div>
          )}

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
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/20 focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
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

          {/* Google Sign-in Section */}
          <div className="mt-4 space-y-2">
            {/* Native Google Identity Services Button Container */}
            <div id="googleSignInBtnDiv" className="w-full flex justify-center min-h-[44px]"></div>

            {/* Custom Google OAuth 2.0 Launch Button */}
            <button
              type="button"
              onClick={handleRealGoogleOAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs transition-colors group shadow-sm cursor-pointer"
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
              <span className="font-semibold text-slate-100 group-hover:text-white">Sign in with Google Account</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 ml-auto" />
            </button>

            {/* Direct Google Email Input option */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setGoogleModalError(null);
                  setShowGoogleModal(true);
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Or enter Google email directly
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Create an account
            </Link>
          </div>

        </div>
      </div>

      {/* Google Account Modal Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0F172A] border border-slate-800 p-6 sm:p-7 shadow-2xl text-left">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <div>
                <h3 className="text-base font-bold text-white">Sign in with Google</h3>
                <p className="text-xs text-slate-400">Connect directly using your Google account</p>
              </div>
            </div>

            {googleModalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{googleModalError}</span>
              </div>
            )}

            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Google Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="Your full name"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Platform Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'admin', label: 'Admin', desc: 'Full governance (Recommended)' },
                    { id: 'interviewer', label: 'Interviewer', desc: 'Conduct sessions' },
                    { id: 'recruiter', label: 'Recruiter', desc: 'Manage pipeline' },
                    { id: 'candidate', label: 'Candidate', desc: 'Take interviews' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setGoogleRole(r.id)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        googleRole === r.id
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-200 capitalize">{r.label}</div>
                      <div className="text-[10px] text-slate-500">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue with Google</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleRealGoogleOAuth}
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                <span>Launch Google Cloud OAuth 2.0 Consent Screen</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
