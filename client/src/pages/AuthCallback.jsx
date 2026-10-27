import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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
      setErrorMsg('No authentication token received from OAuth provider.');
    }
  }, [searchParams, navigate, initAuth]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">OAuth Authentication Failed</h2>
          <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{errorMsg}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-300 font-medium">Completing Google Authentication...</span>
      </div>
    </div>
  );
}
