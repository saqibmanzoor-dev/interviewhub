import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Copy, 
  ExternalLink, 
  Check, 
  Edit3, 
  Trash2, 
  Sliders, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function EventTypes() {
  const { user } = useAuthStore();
  const [eventTypes, setEventTypes] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    duration: 45,
    color: '#3B82F6',
    bufferBefore: 10,
    bufferAfter: 15,
    minimumNoticeHours: 4,
    maxBookingHorizonDays: 30,
    slotIntervalMinutes: 30,
    dailyLimit: 6,
    challengeId: '',
    bookingQuestions: [
      { id: 'q1', label: 'GitHub or Portfolio Link', type: 'url', required: true }
    ]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [etRes, chRes] = await Promise.all([
        api.get('/event-types'),
        api.get('/challenges')
      ]);
      setEventTypes(etRes.data?.data || []);
      setChallenges(chRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load event types:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (et) => {
    const url = `${window.location.origin}/book/${et.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(et._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      duration: 45,
      color: '#3B82F6',
      bufferBefore: 10,
      bufferAfter: 15,
      minimumNoticeHours: 4,
      maxBookingHorizonDays: 30,
      slotIntervalMinutes: 30,
      dailyLimit: 6,
      challengeId: '',
      bookingQuestions: [
        { id: 'q1', label: 'GitHub or Portfolio Link', type: 'url', required: true }
      ]
    });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (et) => {
    setEditingId(et._id);
    setForm({
      title: et.title,
      slug: et.slug,
      description: et.description || '',
      duration: et.duration,
      color: et.color || '#3B82F6',
      bufferBefore: et.bufferBefore || 0,
      bufferAfter: et.bufferAfter || 0,
      minimumNoticeHours: et.minimumNoticeHours || 0,
      maxBookingHorizonDays: et.maxBookingHorizonDays || 30,
      slotIntervalMinutes: et.slotIntervalMinutes || 30,
      dailyLimit: et.dailyLimit || 6,
      challengeId: et.challengeId?._id || et.challengeId || '',
      bookingQuestions: et.bookingQuestions?.length ? et.bookingQuestions : [
        { id: 'q1', label: 'GitHub or Portfolio Link', type: 'url', required: true }
      ]
    });
    setError(null);
    setShowModal(true);
  };

  const handleAddQuestion = () => {
    const newId = 'q_' + Date.now();
    setForm({
      ...form,
      bookingQuestions: [
        ...form.bookingQuestions,
        { id: newId, label: 'New Question', type: 'text', required: false }
      ]
    });
  };

  const handleRemoveQuestion = (id) => {
    setForm({
      ...form,
      bookingQuestions: form.bookingQuestions.filter(q => q.id !== id)
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title) {
      setError('Please provide a title.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        await api.put(`/event-types/${editingId}`, form);
      } else {
        await api.post('/event-types', form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event type.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event type?')) return;
    try {
      await api.delete(`/event-types/${id}`);
      setEventTypes(eventTypes.filter(et => et._id !== id));
    } catch (err) {
      alert('Failed to delete event type.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Event Types</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Configure your interview durations, buffer periods, and shareable public booking links.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/availability"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Manage Working Hours
            </Link>
            <button
              onClick={openNewModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Event Type
            </button>
          </div>
        </div>

        {/* List of Event Types */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : eventTypes.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-1">No Event Types Configured</h3>
            <p className="text-xs text-slate-400 mb-6">Create your first interview event type to start accepting public bookings from candidates.</p>
            <button
              onClick={openNewModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((et) => {
              const bookingUrl = `${window.location.origin}/book/${et.slug}`;
              return (
                <div
                  key={et._id}
                  className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden"
                >
                  <div className="w-1.5 h-full absolute left-0 top-0" style={{ backgroundColor: et.color || '#3B82F6' }} />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" /> {et.duration}m
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          onClick={() => openEditModal(et)}
                          className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Event Type"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(et._id)}
                          className="p-1.5 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-base leading-snug mb-1">{et.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {et.description || 'No description provided.'}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400 mb-6">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        Buffer: {et.bufferBefore}m / {et.bufferAfter}m
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        Notice: {et.minimumNoticeHours}h
                      </span>
                      {et.challengeId?.title && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 truncate max-w-[140px]">
                          Code: {et.challengeId.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopy(et)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === et._id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === et._id ? 'Copied Link!' : 'Copy Link'}
                    </button>

                    <Link
                      to={`/book/${et.slug}`}
                      target="_blank"
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-2xl my-8 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Event Type' : 'Create New Event Type'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Senior Frontend Technical Screen"
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. frontend-technical-screen"
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell candidates what to prepare for this interview..."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Duration (Min)</label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Buffer Before</label>
                  <select
                    value={form.bufferBefore}
                    onChange={(e) => setForm({ ...form, bufferBefore: Number(e.target.value) })}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={0}>0 min</option>
                    <option value={5}>5 mins</option>
                    <option value={10}>10 mins</option>
                    <option value={15}>15 mins</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Buffer After</label>
                  <select
                    value={form.bufferAfter}
                    onChange={(e) => setForm({ ...form, bufferAfter: Number(e.target.value) })}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={0}>0 min</option>
                    <option value={10}>10 mins</option>
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Default Coding Challenge</label>
                  <select
                    value={form.challengeId}
                    onChange={(e) => setForm({ ...form, challengeId: e.target.value })}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None (Freeform IDE)</option>
                    {challenges.map(c => (
                      <option key={c._id} value={c._id}>{c.title} ({c.difficulty})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Minimum Notice</label>
                  <select
                    value={form.minimumNoticeHours}
                    onChange={(e) => setForm({ ...form, minimumNoticeHours: Number(e.target.value) })}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={4}>4 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                  </select>
                </div>
              </div>

              {/* Booking Questions Sub-list */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200">Custom Booking Questions</label>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Question
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {form.bookingQuestions.map((q, idx) => (
                    <div key={q.id} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        value={q.label}
                        onChange={(e) => {
                          const updated = [...form.bookingQuestions];
                          updated[idx].label = e.target.value;
                          setForm({ ...form, bookingQuestions: updated });
                        }}
                        className="flex-1 bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const updated = [...form.bookingQuestions];
                          updated[idx].type = e.target.value;
                          setForm({ ...form, bookingQuestions: updated });
                        }}
                        className="bg-[#1E293B] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                      >
                        <option value="text">Short Text</option>
                        <option value="url">URL</option>
                        <option value="textarea">Paragraph</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/25"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Event Type' : 'Create Event Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
