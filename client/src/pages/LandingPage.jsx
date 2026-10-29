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
  Globe,
  Lock,
  Layers
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-500/30 selection:text-violet-300">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-zinc-800/80">
        {/* Subtle background radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-violet-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Next-Generation Engineering Assessments</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              Cal.com Scheduling <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400">
                meets Live Collaborative Coding
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed">
              Conduct high-signal engineering interviews with seamless public self-booking, Google Meet-grade WebRTC audio/video, Monaco editor sync, and structured scoring rubrics.
            </p>

            {/* Main CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg text-sm shadow-sm hover:shadow-violet-600/25 transition-all flex items-center gap-2"
                >
                  <span>Go to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg text-sm shadow-sm hover:shadow-violet-600/25 transition-all flex items-center gap-2"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium rounded-lg text-sm transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}

              {/* Instant Test Booking Page */}
              <Link
                to="/book/frontend-live-coding"
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-violet-300 font-medium rounded-lg border border-violet-500/30 transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-violet-400" />
                <span>Test Public Booking Flow</span>
              </Link>
            </div>

            {/* Instant 1-Click Interactive Persona Switcher */}
            <div className="mt-10 pt-6 border-t border-zinc-800/80 w-full max-w-xl">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold block mb-3">
                Or jump directly into an instant interactive persona:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleDemo('interviewer')}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-violet-500/50 hover:bg-zinc-850 text-xs font-medium text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  Interviewer (Elena)
                </button>
                <button
                  onClick={() => handleDemo('candidate')}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-850 text-xs font-medium text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Candidate (Alex)
                </button>
                <button
                  onClick={() => handleDemo('recruiter')}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-850 text-xs font-medium text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Recruiter (Rachel)
                </button>
                <button
                  onClick={() => handleDemo('admin')}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850 text-xs font-medium text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Admin Console
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Section */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-violet-400">Platform Architecture</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Built for engineering leaders and candidates
            </p>
            <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
              A single unified stack replacing scattered tools: calendar links, video calls, shared scratchpads, and disconnected scorecard sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-7 hover:border-violet-500/40 transition-all group shadow-sm backdrop-blur-xl">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cal.com-Style Scheduling</h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                Share custom booking links with weekly recurring availability, buffers, date overrides, time-off blocking, and automated iCalendar (.ics) attachments.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> Concurrency-safe slot prevention</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> Timezone conversion & custom questions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> Self-service rescheduling and cancellation</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-7 hover:border-emerald-500/40 transition-all group shadow-sm backdrop-blur-xl">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Interview Room</h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                Google Meet-grade live video/audio conferencing using WebRTC with STUN/TURN, screen sharing, low-latency signaling, and participant presence.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Peer-to-peer audio & video streams</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Integrated room chat & participant list</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Live elapsed timer & active speaker ring</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-7 hover:border-indigo-500/40 transition-all group shadow-sm backdrop-blur-xl">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Collaborative IDE & Runner</h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                Full Monaco editor with multi-language syntax highlighting, real-time code synchronization over Socket.IO, challenge prompts, and isolated test runner.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> JavaScript, Python, C++, Java support</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Sandboxed execution with latency tracking</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Automated test cases & custom stdin input</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interview Room Showcase Preview */}
      <section className="py-20 border-t border-zinc-800/80 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Try Room meet-demo-live</span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">Jump Directly into a Live Interview Room</h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
                  Test the Monaco editor, video call controls, code runner, and challenge bank without scheduling anything in advance.
                </p>
              </div>
              <Link
                to="/room/meet-demo-live"
                className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg text-xs shadow-sm hover:shadow-violet-600/25 transition-all flex items-center gap-2 shrink-0"
              >
                <Video className="w-4 h-4" />
                <span>Join Demo Room Now</span>
              </Link>
            </div>

            {/* Mock Code & Video Layout Preview */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3 text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-zinc-800 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-zinc-800 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-zinc-800 inline-block" />
                  <span className="text-zinc-500 ml-2">interview-session-meet-demo-live.ts</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-sans font-medium flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> WebRTC Active (2 Peers)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 text-zinc-300 space-y-1 py-2 font-mono text-xs">
                  <p className="text-zinc-500">// Problem: Two Sum - Return indices matching target</p>
                  <p><span className="text-violet-400">function</span> <span className="text-amber-300">twoSum</span>(nums: <span className="text-emerald-400">number[]</span>, target: <span className="text-emerald-400">number</span>) &#123;</p>
                  <p className="pl-4 text-zinc-400">const map = new Map&lt;number, number&gt;();</p>
                  <p className="pl-4 text-zinc-400">for (let i = 0; i &lt; nums.length; i++) &#123;</p>
                  <p className="pl-8 text-zinc-300">const complement = target - nums[i];</p>
                  <p className="pl-8 text-zinc-300">if (map.has(complement)) return [map.get(complement)!, i];</p>
                  <p className="pl-8 text-zinc-300">map.set(nums[i], i);</p>
                  <p className="pl-4 text-zinc-400">&#125;</p>
                  <p className="pl-4 text-zinc-400">return [];</p>
                  <p>&#125;</p>
                </div>
                <div className="lg:col-span-4 bg-zinc-900 rounded-xl border border-zinc-800 p-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>Test Case 1</span>
                      <span className="text-emerald-400 font-semibold">Passed (0.4ms)</span>
                    </div>
                    <div className="bg-zinc-950 p-2.5 rounded-lg text-[11px] text-zinc-300 border border-zinc-800">
                      Input: [2, 7, 11, 15], target = 9 <br />
                      Output: [0, 1]
                    </div>
                  </div>
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Elena Rostova (Host)</span>
                    <span className="text-violet-400">WebRTC HD Audio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tracking-tight">Interview<span className="text-violet-400">Hub</span></span>
            <span className="text-xs text-zinc-500 ml-2">© {new Date().getFullYear()} InterviewHub Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <Link to="/privacy" className="hover:text-zinc-200 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-zinc-200 transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-zinc-200 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
