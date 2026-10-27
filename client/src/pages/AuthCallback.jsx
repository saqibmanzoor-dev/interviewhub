import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Key, ExternalLink, ArrowLeft } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { initAuth } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      return;
    }

    if (token) {
      localStorage.setItem('interviewhub_token', token);
      initAuth().then(() => {
        navigate('/dashboard', { replace: true });
      }).catch(() => {
        navigate('/dashboard', { replace: true });
      });
    } else {
      setErrorMsg('No authentication token received from Google OAuth.');
    }
  }, [searchParams, navigate, initAuth]);

  if (errorMsg) {
    const isUnconfigured = errorMsg.includes('not configured') || errorMsg.includes('GOOGLE_CLIENT_ID');

    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            {isUnconfigured ? <Key className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              {isUnconfigured ? 'Google OAuth Credentials Required' : 'Authentication Error'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">{errorMsg}</p>
          </div>

          {isUnconfigured && (
            <div className="text-left bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>Setup instructions for Real Google Sign-In:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Google Cloud Console ➔ Credentials</a>.</li>
                <li>Create an <strong>OAuth 2.0 Client ID</strong> (Application type: <em>Web application</em>).</li>
                <li>Set <strong>Authorized redirect URIs</strong> to:
                  <div className="font-mono text-emerald-300 bg-slate-900 px-2 py-1 rounded border border-slate-700/80 mt-1 select-all">
                    http://localhost:5000/api/v1/auth/google/callback
                  </div>
                </li>
                <li>Add your credentials into <code className="text-slate-200">server/.env</code>:
                  <pre className="font-mono text-[10px] bg-slate-900 p-2 rounded border border-slate-800 text-slate-300 mt-1">
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com&#10;GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret
                  </pre>
                </li>
              </ol>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigate('/login?google=1', { replace: true })}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <span>Sign in with Google Email Directly</span>
            </button>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-300 font-medium">Authenticating via Google Cloud...</span>
      </div>
    </div>
  );
}
