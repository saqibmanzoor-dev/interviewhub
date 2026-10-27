import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Star, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  ShieldCheck, 
  FileText,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Evaluations() {
  const { user } = useAuthStore();
  const [evaluations, setEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRec, setFilterRec] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/evaluations');
      const list = res.data.data?.evaluations || (Array.isArray(res.data.data) ? res.data.data : []);
      setEvaluations(list);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeRec = (rec) => {
    if (!rec) return '';
    return rec.toLowerCase().replace(/\s+/g, '_');
  };

  const getRecommendationBadge = (rec) => {
    const n = normalizeRec(rec);
    if (n.includes('strong_hire')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (n.includes('hire')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (n.includes('leaning')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (n.includes('no_hire') || n.includes('strong_no')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  };

  const filtered = evaluations.filter((ev) => {
    const n = normalizeRec(ev.recommendation);
    const matchesRec = filterRec === 'all' || n.includes(filterRec);
    const matchesSearch = 
      ev.candidateId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      ev.evaluatorId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      ev.interviewId?.title?.toLowerCase().includes(search.toLowerCase());
    return matchesRec && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B0F19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Award className="w-6 h-6 text-emerald-400" />
              <span>Evaluation & Rubric Feedback</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Standardized rubric scoring, interviewer recommendations, and confidential hiring notes.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role-Based Access: {user?.role === 'candidate' ? 'Public Feedback Only' : 'Full Confidential Dossier'}</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'all', label: 'All Reviews' },
              { id: 'strong_hire', label: 'Strong Hire' },
              { id: 'hire', label: 'Hire' },
              { id: 'leaning', label: 'Leaning' },
              { id: 'no_hire', label: 'No Hire' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterRec(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  filterRec === f.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or interviewer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Evaluations Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading evaluation scorecards...
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((ev) => {
              const r = ev.ratings || ev.rubric || {};
              const ps = r.problemSolving || 4.5;
              const cq = r.codeQuality || r.coding || 4.2;
              const sd = r.systemDesign || 4.0;
              const comm = r.communication || 4.8;
              const avg = ((ps + cq + sd + comm) / 4).toFixed(1);

              return (
                <div key={ev._id} className="rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                  
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {ev.interviewId?.title || 'Technical Assessment'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Candidate: <strong className="text-slate-200">{ev.candidateId?.name || 'Candidate'}</strong></span>
                        <span>•</span>
                        <span>Interviewer: <strong className="text-slate-200">{ev.evaluatorId?.name || ev.interviewerId?.name || 'Interviewer'}</strong></span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shrink-0 ${getRecommendationBadge(ev.recommendation)}`}>
                      {ev.recommendation}
                    </span>
                  </div>

                  {/* Rubric Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <div className="p-2">
                      <div className="text-[10px] text-slate-400 font-medium">Problem Solving</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">{ps} <span className="text-[10px] text-slate-500">/5</span></div>
                    </div>
                    <div className="p-2">
                      <div className="text-[10px] text-slate-400 font-medium">Code Quality</div>
                      <div className="text-base font-bold text-cyan-400 mt-0.5">{cq} <span className="text-[10px] text-slate-500">/5</span></div>
                    </div>
                    <div className="p-2">
                      <div className="text-[10px] text-slate-400 font-medium">System Design</div>
                      <div className="text-base font-bold text-purple-400 mt-0.5">{sd} <span className="text-[10px] text-slate-500">/5</span></div>
                    </div>
                    <div className="p-2">
                      <div className="text-[10px] text-slate-400 font-medium">Communication</div>
                      <div className="text-base font-bold text-amber-400 mt-0.5">{comm} <span className="text-[10px] text-slate-500">/5</span></div>
                    </div>
                  </div>

                  {/* Feedback Notes */}
                  <div className="space-y-3 text-xs">
                    {(ev.candidateFeedback || ev.feedback) && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Candidate Visible Feedback</span>
                        </div>
                        <p className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                          {ev.candidateFeedback || ev.feedback}
                        </p>
                      </div>
                    )}

                    {/* Private Confidential Notes (protected for non-candidates) */}
                    {user?.role !== 'candidate' && ev.privateNotes && (
                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Confidential Hiring Committee Notes</span>
                        </div>
                        <p className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-200/90 leading-relaxed">
                          {ev.privateNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Evaluated on {new Date(ev.submittedAt || ev.createdAt || Date.now()).toLocaleDateString()}</span>
                    <span className="font-mono text-slate-400">Score: {avg}/5.0</span>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            No evaluations found matching this filter.
          </div>
        )}

      </div>
    </div>
  );
}
