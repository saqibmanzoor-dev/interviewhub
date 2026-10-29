import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Key, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { initAuth, googleLogin } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function handleAuth() {
      // 1. Check query parameters
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        setErrorMsg(decodeURIComponent(error));
        return;
      }

      if (token) {
        localStorage.setItem('interviewhub_token', token);
        await initAuth();
        navigate('/dashboard', { replace: true });
        return;
      }

      // 2. Check hash parameters (OAuth 2.0 client implicit flow: #access_token=...)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const hashError = hashParams.get('error');

        if (hashError) {
          setErrorMsg(decodeURIComponent(hashError));
          return;
        }

        if (accessToken) {
          try {
            // Fetch verified user info directly from Google API
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const profile = await res.json();
            if (profile.email) {
              await googleLogin({
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                role: 'admin',
                credential: accessToken
              });
              navigate('/dashboard', { replace: true });
              return;
            }
          } catch (e) {
            console.warn('Google userinfo fetch failed:', e);
          }
        }
      }

      setErrorMsg('No authentication token received from Google OAuth.');
    }

    handleAuth();
  }, [searchParams, navigate, initAuth, googleLogin]);

  if (errorMsg) {
    const isOriginMismatch = errorMsg.includes('origin_mismatch') || errorMsg.includes('not configured') || errorMsg.includes('GOOGLE_CLIENT_ID');

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 selection:bg-violet-500/30 selection:text-violet-300">
        <div className="max-w-lg w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 text-center space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Key className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Google OAuth Origin Configuration
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{errorMsg}</p>
          </div>

          <div className="text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-xs text-zinc-300">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>Required Google Cloud Console Configuration:</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Google blocked sign-in because this origin is not yet listed under your client ID's Authorized Origins.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-zinc-400 text-[11px] leading-relaxed">
              <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline inline-flex items-center gap-0.5">Google Cloud Console ➔ Credentials <ExternalLink className="w-3 h-3" /></a></li>
              <li>Click your <strong>OAuth 2.0 Web Client ID</strong>.</li>
              <li>Under <strong>Authorized JavaScript origins</strong>, add:
                <div className="font-mono text-violet-300 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700/80 mt-1 select-all">
                  {window.location.origin}
                </div>
              </li>
              <li>Under <strong>Authorized redirect URIs</strong>, add:
                <div className="font-mono text-violet-300 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700/80 mt-1 select-all">
                  {window.location.origin}/auth/callback
                </div>
              </li>
            </ol>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => navigate('/login?google=1', { replace: true })}
              className="flex-1 py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Instant Sign-in with Email Directly</span>
            </button>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-zinc-400 font-medium">Verifying with Google...</span>
      </div>
    </div>
  );
}
