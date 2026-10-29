import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyRegisterOtp, resendOtp, isLoading } = useAuthStore();

  const email = location.state?.email || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState(null);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    // Auto-focus first input on mount
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    // Only allow numbers
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
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newDigits = pastedData.split('');
      setDigits(newDigits);
      inputsRef.current[5]?.focus();
      toast.success('6-digit code inserted from clipboard');
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
      toast.success('Account successfully verified!');
      navigate('/dashboard');
    } else {
      const errMsg = result.error || 'Invalid verification code.';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setError(null);
    setResending(true);
    const result = await resendOtp(email, 'registration');
    setResending(false);
    if (result.success) {
      toast.success('A new 6-digit code has been sent to your email.');
      setTimer(60);
    } else {
      const errMsg = result.error || 'Failed to resend code.';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl">
        <Link 
          to="/register" 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to registration
        </Link>

        {/* Shield Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-violet-600/15 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto mb-6 shadow-sm shadow-violet-600/20">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Check Your Email</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            We sent a 6-digit confirmation code to <br />
            <span className="text-zinc-200 font-mono font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 text-left animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Segmented Inputs */}
          <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
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
                className={`w-12 h-14 bg-zinc-950 border rounded-xl text-center text-xl font-bold font-mono text-white transition-all shadow-inner outline-none ${
                  digit 
                    ? 'border-violet-500/80 bg-violet-500/5' 
                    : 'border-zinc-800 hover:border-zinc-700'
                } focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || digits.join('').length < 6}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all shadow-sm hover:shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-xs text-zinc-400 flex flex-col items-center gap-2">
          <span>Didn't receive the email code?</span>
          <button
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className="text-violet-400 hover:text-violet-300 disabled:text-zinc-600 font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend code now'}
          </button>
        </div>
      </div>
    </div>
  );
}
