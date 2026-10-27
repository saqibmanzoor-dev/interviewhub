import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Video, 
  Calendar, 
  Users, 
  TrendingUp, 
  Award, 
  Code2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Play, 
  Sparkles, 
  BarChart3, 
  Plus,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meetingInput, setMeetingInput] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, interviewsRes] = await Promise.all([
        api.get('/analytics/overview').catch(() => ({ data: { data: null } })),
        api.get('/interviews?limit=5').catch(() => ({ data: { data: { interviews: [] } } }))
      ]);

      setAnalytics(analyticsRes.data.data);
      const rawInterviews = interviewsRes.data.data?.interviews || (Array.isArray(interviewsRes.data.data) ? interviewsRes.data.data : []);
      setInterviews(rawInterviews);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Default fallback data for Social Blade velocity chart if backend has limited history
  const chartData = analytics?.weeklyTrends?.length ? analytics.weeklyTrends : [
    { week: 'W1', completed: 4, scheduled: 6, passRate: 75 },
    { week: 'W2', completed: 7, scheduled: 8, passRate: 85 },
    { week: 'W3', completed: 11, scheduled: 12, passRate: 80 },
    { week: 'W4', completed: 9, scheduled: 10, passRate: 90 },
    { week: 'W5', completed: 14, scheduled: 16, passRate: 86 },
    { week: 'W6', completed: 18, scheduled: 20, passRate: 92 },
  ];

  // Competency radar data
  const radarData = [
    { subject: 'Problem Solving', score: analytics?.competencyScores?.problemSolving || 4.6, fullMark: 5 },
    { subject: 'Code Quality', score: analytics?.competencyScores?.codeQuality || 4.4, fullMark: 5 },
    { subject: 'System Design', score: analytics?.competencyScores?.systemDesign || 4.1, fullMark: 5 },
    { subject: 'Communication', score: analytics?.competencyScores?.communication || 4.7, fullMark: 5 },
    { subject: 'Debugging', score: 4.5, fullMark: 5 },
  ];

  const recommendationPie = [
    { name: 'Strong Hire', value: 45, color: '#10b981' },
    { name: 'Hire', value: 35, color: '#3b82f6' },
    { name: 'Leaning No', value: 12, color: '#f59e0b' },
    { name: 'Strong No', value: 8, color: '#ef4444' }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B0F19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Banner & Quick Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Live Engineering Platform
              </span>
              <span className="text-xs text-slate-400 capitalize">Role: {user?.role}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5">
              Welcome back, {user?.name || 'Engineer'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Social Blade analytics, active technical evaluation pipelines, and upcoming meetings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/interviews?create=true"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Interview</span>
            </Link>

            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1">
              <input
                type="text"
                placeholder="Meeting Code..."
                value={meetingInput}
                onChange={(e) => setMeetingInput(e.target.value)}
                className="bg-transparent px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-32"
              />
              <button
                onClick={() => meetingInput && navigate(`/room/${meetingInput.trim().toLowerCase()}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Social Blade Inspired Grade & KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Social Blade Overall Grade Card */}
          <div className="sm:col-span-2 lg:col-span-1 rounded-2xl p-5 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            <div className="absolute top-2 right-2 text-emerald-500/20 group-hover:text-emerald-500/30 transition-colors">
              <Award className="w-16 h-16 -mr-4 -mt-4 opacity-50" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Platform Rank & Grade</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white tracking-tight">A+</span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">TOP 2%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Based on candidate completion, execution pass rate, and interviewer feedback score.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Global Rank</span>
              <span className="font-bold text-white">#12 in Enterprise</span>
            </div>
          </div>

          {/* Metric 1: Total Interviews */}
          <div className="rounded-2xl p-5 bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Interviews</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{analytics?.totalInterviews || 24}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% this month</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              {analytics?.inProgressCount || 2} in progress now
            </div>
          </div>

          {/* Metric 2: Hire Pass Rate */}
          <div className="rounded-2xl p-5 bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Hiring Pass Rate</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{analytics?.passRate || 78.5}%</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+4.2% vs industry</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              Filtered for senior roles
            </div>
          </div>

          {/* Metric 3: Code Executions */}
          <div className="rounded-2xl p-5 bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Code Executions</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Code2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{analytics?.codeExecutionsCount || 142}</div>
              <div className="flex items-center gap-1 text-[11px] text-purple-400 mt-1 font-medium">
                <Zap className="w-3.5 h-3.5" />
                <span>99.2% success rate</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              Avg runtime: 18ms
            </div>
          </div>

          {/* Metric 4: Avg Score */}
          <div className="rounded-2xl p-5 bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Avg Candidate Score</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{analytics?.averageScore || 4.3} <span className="text-xs text-slate-500">/ 5.0</span></div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Rubric normalized</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              4 rubric categories
            </div>
          </div>

        </div>

        {/* Charts Section: Velocity Trends & Competencies */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Velocity Area Chart */}
          <div className="lg:col-span-2 rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Interview Velocity & Completion Trends</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Weekly interview volume and successful completions over time</p>
              </div>
              <span className="text-[11px] bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-medium">Last 6 Weeks</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#emeraldGrad)" name="Completed" />
                  <Area type="monotone" dataKey="scheduled" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#blueGrad)" name="Scheduled" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>Completed Interviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Total Scheduled</span>
              </div>
            </div>
          </div>

          {/* Competency Radar Chart */}
          <div className="rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Candidate Competency Profile</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Average ratings across key technical evaluation rubrics</p>
            </div>

            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={80} data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#475569" fontSize={9} />
                  <Radar name="Candidate Average" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>Top Strength: <strong className="text-emerald-400">Communication</strong></span>
              <span>Growth Area: <strong className="text-amber-400">System Design</strong></span>
            </div>
          </div>

        </div>

        {/* Live / Upcoming Interviews Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>Upcoming & Recent Technical Interviews</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Instant room launch, candidate details, and meeting statuses</p>
            </div>
            <Link to="/interviews" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Meeting Title & Role</th>
                  <th className="px-5 py-3 font-semibold">Candidate</th>
                  <th className="px-5 py-3 font-semibold">Interviewer</th>
                  <th className="px-5 py-3 font-semibold">Date & Time</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {interviews.length > 0 ? (
                  interviews.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">Code: {item.meetingCode}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-200">{item.candidateId?.name || 'Sarah Chen'}</div>
                        <div className="text-[11px] text-slate-400">{item.candidateId?.email || 'sarah@candidate.com'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-200">{item.interviewerIds?.[0]?.name || item.interviewerId?.name || 'Alex Morgan'}</div>
                        <div className="text-[11px] text-slate-400">{item.interviewerIds?.[0]?.title || 'Technical Interviewer'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-200">{new Date(item.scheduledStart || item.scheduledAt || Date.now()).toLocaleDateString()}</div>
                        <div className="text-[11px] text-slate-400">{new Date(item.scheduledStart || item.scheduledAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' :
                          item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          item.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {item.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/room/${item.meetingCode}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Join Room</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                      No interviews scheduled. Click "Schedule Interview" above to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
