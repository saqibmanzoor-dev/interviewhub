import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyRegisterOtp, resendOtp, isLoading } = useAuthStore();

  const email = location.state?.email || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState(null);
  const [resendStatus, setResendStatus] = useState(null);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      // If visited directly without registration state, redirect to register
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setError(null);
    const result = await verifyRegisterOtp(email, code);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid verification code.');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError(null);
    const result = await resendOtp(email, 'registration');
    if (result.success) {
      setResendStatus('A new code has been sent to your email.');
      setTimer(60);
      setTimeout(() => setResendStatus(null), 4000);
    } else {
      setError(result.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center">
        
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-2">Check Your Email</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          We sent a 6-digit confirmation code to <br />
          <strong className="text-slate-200 font-mono">{email}</strong>
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resendStatus && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Inputs */}
          <div className="flex justify-between gap-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputsRef.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="w-12 h-14 bg-[#1E293B] border border-slate-700 focus:border-blue-500 rounded-xl text-center text-xl font-bold font-mono text-white focus:outline-none transition-all shadow-inner"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || digits.join('').length < 6}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Verifying Account...' : 'Verify & Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex flex-col items-center gap-2">
          <span>Didn't receive the email?</span>
          <button
            onClick={handleResend}
            disabled={timer > 0}
            className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend code now'}
          </button>
        </div>

      </div>
    </div>
  );
}
