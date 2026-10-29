import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Lock, 
  Mail, 
  User, 
  X, 
  ShieldCheck, 
  Code2, 
  ExternalLink,
  Terminal,
  Video,
  CheckCircle2,
  Calendar,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
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
        toast.success(`Welcome back, ${userName}!`);
        navigate(from, { replace: true });
      } else {
        const errMsg = res.error || 'Failed to authenticate with Google';
        setLocalError(errMsg);
        toast.error(errMsg);
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
      setLocalError('Please enter both your email and password.');
      return;
    }
    const res = await login(email, password);
    if (res.success) {
      toast.success('Signed in successfully');
      navigate(from, { replace: true });
    } else {
      toast.error(res.error || 'Failed to sign in');
    }
  };

  const handleDemoSignIn = async (role) => {
    setLocalError(null);
    const res = await demoLogin(role);
    if (res.success) {
      toast.success(`Signed in as ${role.toUpperCase()}`);
      navigate(from, { replace: true });
    } else {
      toast.error(res.error || 'Failed to initiate demo session');
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
      toast.success('Google authentication verified');
      navigate(from, { replace: true });
    } else {
      setGoogleModalError(res.error || 'Failed to authenticate with Google.');
    }
  };

  // Direct Google Cloud OAuth 2.0 SPA redirect flow
  const handleRealGoogleOAuth = () => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${redirectUri}&response_type=token&scope=openid%20profile%20email&prompt=select_account`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex w-full bg-zinc-950 text-zinc-100 selection:bg-violet-500/30 selection:text-violet-300">
      {/* Left Column: Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-20 relative z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Header & Logo */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-105 group-hover:border-violet-500/60 transition-all duration-200 shadow-sm shadow-violet-600/20">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-100">
                Interview<span className="text-violet-400">Hub</span>
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Sign in to access your collaborative coding workspace and interview sessions.
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Instant 1-Click Persona Access
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">No password needed</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('admin')}
                className="py-2 px-3 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none"
              >
                <span>Admin View</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('interviewer')}
                className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none"
              >
                <span>Interviewer</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('candidate')}
                className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none"
              >
                <span>Candidate</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('recruiter')}
                className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none"
              >
                <span>Recruiter</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-3 text-zinc-500 font-medium tracking-wider text-[10px]">
                or continue with credentials
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {(localError || error) && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-[0.99] text-white font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-violet-600/25 focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign In Options */}
          <div className="mt-5 space-y-2.5">
            <div id="googleSignInBtnDiv" className="w-full flex justify-center min-h-[44px]"></div>

            <button
              type="button"
              onClick={handleRealGoogleOAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-200 font-medium text-xs transition-all duration-200 group cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none"
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
              <span>Continue with Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 ml-auto" />
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setGoogleModalError(null);
                  setShowGoogleModal(true);
                }}
                className="text-[11px] text-zinc-400 hover:text-violet-400 transition-colors"
              >
                Or enter Google test email directly
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Abstract Gradient Mesh & Hero Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900/40 border-l border-zinc-800/80 items-center justify-center p-12 overflow-hidden">
        {/* Subtle dot matrix pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
        
        {/* Ambient violet & indigo glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Card Visual */}
        <div className="relative z-10 w-full max-w-lg">
          {/* Main Card */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 shadow-2xl backdrop-blur-xl">
            {/* Top Bar with mock dots */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <span className="ml-2 text-xs font-mono text-zinc-400">interview-session.tsx</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400">WebRTC Live</span>
              </div>
            </div>

            {/* Code Snippet Preview */}
            <div className="py-4 font-mono text-xs text-zinc-300 space-y-1">
              <div><span className="text-violet-400">async function</span> <span className="text-blue-400">conductTechnicalInterview</span>(session) &#123;</div>
              <div className="pl-4 text-zinc-500">// Collaborative real-time Monaco editor</div>
              <div className="pl-4"><span className="text-violet-400">const</span> workspace = <span className="text-violet-400">await</span> session.<span className="text-emerald-400">connect</span>();</div>
              <div className="pl-4"><span className="text-violet-400">const</span> feedback = <span className="text-violet-400">await</span> workspace.<span className="text-emerald-400">runTestCases</span>();</div>
              <div className="pl-4"><span className="text-violet-400">return</span> feedback.<span className="text-amber-400">score</span>;</div>
              <div>&#125;</div>
            </div>

            {/* Feature Pills */}
            <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center text-center">
                <Video className="w-4 h-4 text-violet-400 mb-1" />
                <span className="text-[10px] text-zinc-400 font-medium">HD Video Mesh</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center text-center">
                <Terminal className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-[10px] text-zinc-400 font-medium">Monaco Dark</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center text-center">
                <Calendar className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 font-medium">Cal.com Booking</span>
              </div>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="mt-6 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              IH
            </div>
            <div>
              <p className="text-xs text-zinc-300 font-medium">
                "The Tier-1 standard for remote engineering assessments."
              </p>
              <p className="text-[11px] text-zinc-500">
                End-to-end encrypted • Socket.IO synchronized
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Direct Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 shadow-2xl text-left">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0">
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
                <p className="text-xs text-zinc-400">Connect directly using your Google account</p>
              </div>
            </div>

            {googleModalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{googleModalError}</span>
              </div>
            )}

            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Google Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="Your full name"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Platform Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'admin', label: 'Admin', desc: 'Full platform governance' },
                    { id: 'interviewer', label: 'Interviewer', desc: 'Conduct interviews' },
                    { id: 'recruiter', label: 'Recruiter', desc: 'Pipeline management' },
                    { id: 'candidate', label: 'Candidate', desc: 'Take technical tests' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setGoogleRole(r.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        googleRole === r.id
                          ? 'bg-violet-600/15 border-violet-500/50 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-medium text-zinc-200 capitalize">{r.label}</div>
                      <div className="text-[10px] text-zinc-500">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-violet-600/25 disabled:opacity-50 cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  );
}
