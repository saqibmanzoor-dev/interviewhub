import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Play, 
  Clock, 
  User, 
  Video, 
  Code2, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ExternalLink,
  Zap
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Interviews() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [interviews, setInterviews] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [instantLoading, setInstantLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    title: 'Technical Interview Session',
    candidateEmail: '',
    candidateName: '',
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    durationMinutes: 60,
    challengeId: ''
  });

  useEffect(() => {
    fetchInterviews();
    fetchChallenges();
    if (searchParams.get('create') === 'true') {
      setShowModal(true);
    }
  }, []);

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/interviews');
      const list = res.data.data?.interviews || (Array.isArray(res.data.data) ? res.data.data : []);
      setInterviews(list);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      const res = await api.get('/challenges');
      const list = res.data.data?.challenges || (Array.isArray(res.data.data) ? res.data.data : []);
      setChallenges(list);
      if (list.length > 0 && !formData.challengeId) {
        setFormData(prev => ({ ...prev, challengeId: list[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching challenges:', err);
    }
  };

  const handleCopyLink = (code) => {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    try {
      await api.post('/interviews', {
        title: formData.title,
        candidateEmail: formData.candidateEmail,
        candidateName: formData.candidateName,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        durationMinutes: Number(formData.durationMinutes),
        challengeId: formData.challengeId || undefined
      });
      setShowModal(false);
      fetchInterviews();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setModalLoading(false);
    }
  };

  const handleInstantMeeting = async () => {
    setInstantLoading(true);
    try {
      const res = await api.post('/interviews', {
        title: `${user?.name || 'Live'} Technical Interview`,
        durationMinutes: 60,
        challengeId: challenges[0]?._id || undefined
      });
      const meetingCode = res.data.data?.meetingCode;
      if (meetingCode) {
        navigate(`/room/${meetingCode}`);
      }
    } catch (err) {
      console.error('Instant meeting error:', err);
      alert(err.response?.data?.message || 'Failed to start instant meeting');
    } finally {
      setInstantLoading(false);
    }
  };

  const filtered = interviews.filter((item) => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meetingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidateId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidateId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B0F19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <span>Interview Management</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Schedule, launch Google Meet-style interview rooms, and track candidate evaluations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleInstantMeeting}
              disabled={instantLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all hover:scale-102 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
            >
              {instantLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Start Instant Meeting</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold shadow-md transition-all hover:scale-102 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Schedule Interview</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Interviews' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  filterStatus === tab.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

        </div>

        {/* Interviews Cards / Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Title & Meeting Code</th>
                  <th className="px-5 py-3 font-semibold">Candidate</th>
                  <th className="px-5 py-3 font-semibold">Interviewer</th>
                  <th className="px-5 py-3 font-semibold">Scheduled Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading interviews...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white text-sm">{item.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] border border-emerald-500/20">
                            {item.meetingCode}
                          </span>
                          <button
                            onClick={() => handleCopyLink(item.meetingCode)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Copy Invitation Link"
                          >
                            {copiedCode === item.meetingCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">{item.candidateId?.name || 'Technical Candidate'}</div>
                        <div className="text-[11px] text-slate-400">{item.candidateId?.email || 'candidate@interviewhub.io'}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">{item.interviewerIds?.[0]?.name || item.interviewerId?.name || item.createdBy?.name || 'Lead Interviewer'}</div>
                        <div className="text-[11px] text-slate-400">{item.interviewerIds?.[0]?.email || item.interviewerId?.email || item.createdBy?.email || 'interviewer@interviewhub.io'}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-slate-200">{new Date(item.scheduledStart || item.scheduledAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.scheduledStart || item.scheduledAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.durationMinutes || item.actualDuration || 60}m)</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          item.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' :
                          item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          item.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {item.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyLink(item.meetingCode)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Copy Direct Link"
                          >
                            {copiedCode === item.meetingCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>

                          <Link
                            to={`/room/${item.meetingCode}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Launch Room</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                      No interviews match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Schedule Interview Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Schedule Technical Interview</h2>
                <p className="text-xs text-slate-400">Generates unique meeting code & collaborative room session.</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Interview Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Candidate Name <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Candidate name"
                    value={formData.candidateName}
                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Candidate Email <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="candidate@example.com"
                    value={formData.candidateEmail}
                    onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration</label>
                  <select
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Attach Coding Challenge (Optional)</label>
                <select
                  value={formData.challengeId}
                  onChange={(e) => setFormData({ ...formData, challengeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">No challenge attached (Free-form editor)</option>
                  {challenges.map((c) => (
                    <option key={c._id} value={c._id}>
                      [{c.difficulty.toUpperCase()}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {modalLoading && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
