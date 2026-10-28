import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Video, 
  Code2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  Terminal, 
  Award,
  Zap,
  Globe
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, demoLogin } = useAuthStore();

  const handleDemo = async (role) => {
    await demoLogin(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-blue-500/30">
      {/* Top Banner / Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>The Complete Technical Interview Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Cal.com Scheduling <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                meets Live Collaborative Coding
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed">
              Conduct high-signal engineering interviews with seamless public self-booking, Google Meet-style WebRTC audio/video, Monaco editor sync, and structured scoring.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
                  >
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}

              {/* Instant Test Booking Page */}
              <Link
                to="/book/frontend-live-coding"
                className="px-6 py-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold rounded-xl border border-emerald-500/30 transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Test Public Booking Flow</span>
              </Link>
            </div>

            {/* 1-Click Interactive Demo Persona Switcher */}
            <div className="mt-8 pt-6 border-t border-slate-800/60 w-full max-w-xl">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-3">
                Or jump into an instant interactive persona:
              </span>
              <div className="flex flex-wrap justify-center gap-2.5">
                <button
                  onClick={() => handleDemo('interviewer')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Interviewer (Elena)
                </button>
                <button
                  onClick={() => handleDemo('candidate')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Candidate (Alex)
                </button>
                <button
                  onClick={() => handleDemo('recruiter')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-purple-500/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Recruiter (Rachel)
                </button>
                <button
                  onClick={() => handleDemo('admin')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Admin Console
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 bg-[#0E1322]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Production Architecture</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Built for engineering leaders and candidates
            </p>
            <p className="mt-4 text-slate-400 text-base">
              A single unified stack replacing scattered tools: calendar links, video calls, shared scratchpads, and disconnected scorecard sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-7 hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cal.com-Style Scheduling</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Share custom booking links with weekly recurring availability, buffers, date-specific overrides, time-off blocking, and automated iCalendar (.ics) attachments.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Concurrency-safe double-booking prevention</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Timezone conversion & custom questions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Self-service rescheduling and cancellation</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-7 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Interview Room</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Google Meet-grade live video/audio conferencing using WebRTC with STUN/TURN, screen sharing, low-latency signaling, and participant presence.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Peer-to-peer audio & video streams</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Integrated room chat & participant list</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Live elapsed timer & session security</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-7 hover:border-purple-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Collaborative IDE & Sandbox</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Full Monaco editor with multi-language syntax highlighting, real-time code synchronization over Socket.IO, question prompts, and isolated test runner.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> JavaScript, Python, C++, Java support</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sandboxed execution with memory & CPU caps</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Preloaded test cases with hidden test evaluation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interview Room Showcase Preview */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-b from-slate-900 to-[#111827] border border-slate-800 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Try Room meet-demo-live</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Jump Directly into a Test Interview Room</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xl">
                  Test the Monaco editor, video call controls, code runner, and challenge bank without scheduling anything in advance.
                </p>
              </div>
              <Link
                to="/room/meet-demo-live"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
              >
                <Video className="w-5 h-5" />
                <span>Join Demo Room Now</span>
              </Link>
            </div>

            {/* Mock Code & Video Layout Preview */}
            <div className="bg-[#0B0F19] rounded-2xl border border-slate-800 p-4 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-slate-400 ml-2">interview-session-meet-demo-live.ts</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-sans font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Connected (2 Peers)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 text-slate-300 space-y-1 py-2">
                  <p className="text-slate-500">// Problem: Two Sum - Given nums and target, return indices</p>
                  <p><span className="text-blue-400">function</span> <span className="text-amber-300">twoSum</span>(nums: <span className="text-emerald-400">number[]</span>, target: <span className="text-emerald-400">number</span>) &#123;</p>
                  <p className="pl-4 text-slate-400">const map = new Map&lt;number, number&gt;();</p>
                  <p className="pl-4 text-slate-400">for (let i = 0; i &lt; nums.length; i++) &#123;</p>
                  <p className="pl-8 text-slate-300">const complement = target - nums[i];</p>
                  <p className="pl-8 text-slate-300">if (map.has(complement)) return [map.get(complement)!, i];</p>
                  <p className="pl-8 text-slate-300">map.set(nums[i], i);</p>
                  <p className="pl-4 text-slate-400">&#125;</p>
                  <p className="pl-4 text-slate-400">return [];</p>
                  <p>&#125;</p>
                </div>
                <div className="lg:col-span-4 bg-[#111827] rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Test Case 1</span>
                      <span className="text-emerald-400 font-bold">Passed (0.4ms)</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded text-[11px] text-slate-300">
                      Input: [2, 7, 11, 15], target = 9 <br />
                      Output: [0, 1]
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Elena Rostova (Host)</span>
                    <span className="text-blue-400">WebRTC Audio HD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-[#070A12] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white tracking-tight">Interview<span className="text-blue-500">Hub</span></span>
            <span className="text-xs text-slate-500 ml-2">© {new Date().getFullYear()} InterviewHub Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link to="/privacy" className="hover:text-slate-200 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-200 transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-slate-200 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
