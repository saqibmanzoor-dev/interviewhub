import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  AlertCircle, 
  User, 
  Mail, 
  Lock, 
  Building, 
  Code2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Users,
  Video,
  FileCode2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { register, requestRegisterOtp, isLoading, error } = useAuthStore();
  const [useOtp] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidate',
    organizationName: ''
  });
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setLocalError('Please complete all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (useOtp) {
      const res = await requestRegisterOtp(formData);
      if (res.success) {
        toast.success('Verification code dispatched to your email');
        navigate('/verify-otp', { state: { email: formData.email } });
      } else {
        const errMsg = res.error || 'Failed to dispatch verification code.';
        setLocalError(errMsg);
        toast.error(errMsg);
      }
    } else {
      const res = await register(formData);
      if (res.success) {
        toast.success('Account created successfully');
        navigate('/dashboard');
      } else {
        toast.error(res.error || 'Registration failed');
      }
    }
  };

  const roles = [
    { id: 'candidate', label: 'Candidate', desc: 'Taking technical interviews' },
    { id: 'interviewer', label: 'Interviewer', desc: 'Conducting evaluations' },
    { id: 'recruiter', label: 'Recruiter', desc: 'Hiring pipeline management' }
  ];

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
              Create an account
            </h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Join engineering teams conducting high-fidelity technical assessments.
            </p>
          </div>

          {/* Error Banner */}
          {(localError || error) && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Full Name <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Chen"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Work Email <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@company.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            {/* Role Selector Pills */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Select your primary role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
                      formData.role === r.id
                        ? 'bg-violet-600/15 border-violet-500/60 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-200 capitalize">{r.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Company / Organization <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp or Stanford"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-[0.99] text-white font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-violet-600/25 focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Verify</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In link */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Abstract Gradient Mesh & Hero Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900/40 border-l border-zinc-800/80 items-center justify-center p-12 overflow-hidden">
        {/* Subtle dot matrix pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
        
        {/* Ambient violet & indigo glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Feature showcase card */}
        <div className="relative z-10 w-full max-w-lg space-y-4">
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Enterprise Assessment Suite</h3>
                <p className="text-xs text-zinc-400">Trusted by modern engineering teams</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Zero-Friction Cal.com Booking</div>
                  <div className="text-[11px] text-zinc-500">Custom availability slots, calendar invites, and instant WebRTC workspace links.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Integrated Monaco & Remote Code Runner</div>
                  <div className="text-[11px] text-zinc-500">Real-time multiplayer cursor synchronization with automated test case evaluation.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">Structured Rubrics & Analytics</div>
                  <div className="text-[11px] text-zinc-500">Objective scoring, candidate feedback, and pipeline conversion metrics.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-zinc-500">
            <span>SOC2 Type II Certified Process</span>
            <span>99.99% Workspace Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
