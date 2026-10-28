import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Globe, 
  Calendar, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Palmtree,
  CalendarOff,
  Sliders
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Asia/Singapore',
  'UTC'
];

export default function AvailabilityEditor() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'timeoff'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Availability rule state
  const [timezone, setTimezone] = useState('America/New_York');
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
    tuesday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
    wednesday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
    thursday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
    friday: { enabled: true, intervals: [{ start: '09:00', end: '17:00' }] },
    saturday: { enabled: false, intervals: [] },
    sunday: { enabled: false, intervals: [] }
  });

  // Time off state
  const [timeOffList, setTimeOffList] = useState([]);
  const [newTimeOff, setNewTimeOff] = useState({
    title: 'Vacation',
    startDate: '',
    endDate: ''
  });
  const [timeOffSubmitting, setTimeOffSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailability();
    fetchTimeOff();
  }, []);

  async function fetchAvailability() {
    setLoading(true);
    try {
      const res = await api.get('/availability/me');
      if (res.data?.data) {
        setTimezone(res.data.data.timezone || 'America/New_York');
        if (res.data.data.weeklySchedule) {
          setWeeklySchedule(res.data.data.weeklySchedule);
        }
      }
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimeOff() {
    try {
      const res = await api.get('/availability/time-off');
      setTimeOffList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load time off:', err);
    }
  }

  const handleToggleDay = (day) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        intervals: !prev[day].enabled && prev[day].intervals.length === 0
          ? [{ start: '09:00', end: '17:00' }]
          : prev[day].intervals
      }
    }));
  };

  const handleTimeChange = (day, idx, field, val) => {
    setWeeklySchedule(prev => {
      const updatedIntervals = [...prev[day].intervals];
      updatedIntervals[idx][field] = val;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          intervals: updatedIntervals
        }
      };
    });
  };

  const handleAddInterval = (day) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        intervals: [...prev[day].intervals, { start: '13:00', end: '17:00' }]
      }
    }));
  };

  const handleRemoveInterval = (day, idx) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        intervals: prev[day].intervals.filter((_, i) => i !== idx)
      }
    }));
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await api.put('/availability/me', {
        timezone,
        weeklySchedule
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save availability settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTimeOff = async (e) => {
    e.preventDefault();
    if (!newTimeOff.startDate || !newTimeOff.endDate) return;

    setTimeOffSubmitting(true);
    try {
      await api.post('/availability/time-off', newTimeOff);
      setNewTimeOff({ title: 'Vacation', startDate: '', endDate: '' });
      fetchTimeOff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record time off.');
    } finally {
      setTimeOffSubmitting(false);
    }
  };

  const handleDeleteTimeOff = async (id) => {
    try {
      await api.delete(`/availability/time-off/${id}`);
      setTimeOffList(timeOffList.filter(t => t._id !== id));
    } catch (err) {
      alert('Failed to remove time off.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Availability & Working Hours</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Set when you are available to conduct technical interviews across your weekly schedule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/book/frontend-live-coding"
              target="_blank"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>Preview Public Booking</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </Link>
            <button
              onClick={handleSaveAvailability}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Success / Error notification banner */}
        {saveSuccess && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Availability schedule successfully saved! Open slots updated across all your event types.</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab switchers */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Weekly Recurring Hours
          </button>
          <button
            onClick={() => setActiveTab('timeoff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'timeoff'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palmtree className="w-4 h-4" />
            Time Off & Holidays ({timeOffList.length})
          </button>
        </div>

        {activeTab === 'weekly' ? (
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Timezone Selector */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" /> Default Timezone
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your recurring hours will be calculated in this timezone. Candidates automatically see slots converted to their local timezone.
                </p>
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {/* Weekly Days List */}
            <div className="divide-y divide-slate-800/80">
              {DAYS.map(day => {
                const dayState = weeklySchedule[day] || { enabled: false, intervals: [] };
                return (
                  <div key={day} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Toggle and Label */}
                    <div className="flex items-center gap-3 w-40 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                          dayState.enabled ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            dayState.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-bold ${dayState.enabled ? 'text-white' : 'text-slate-500'}`}>
                        {DAY_LABELS[day]}
                      </span>
                    </div>

                    {/* Intervals */}
                    <div className="flex-1 w-full md:w-auto">
                      {dayState.enabled ? (
                        <div className="space-y-2">
                          {dayState.intervals.map((interval, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={interval.start}
                                onChange={(e) => handleTimeChange(day, idx, 'start', e.target.value)}
                                className="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                              <span className="text-xs text-slate-500">-</span>
                              <input
                                type="time"
                                value={interval.end}
                                onChange={(e) => handleTimeChange(day, idx, 'end', e.target.value)}
                                className="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                              {dayState.intervals.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInterval(day, idx)}
                                  className="p-1.5 text-slate-500 hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddInterval(day)}
                            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 mt-1"
                          >
                            <Plus className="w-3 h-3" /> Add Interval
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Unavailable</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          /* Time Off Tab */
          <div className="space-y-6">
            {/* Add Time Off Card */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-emerald-400" /> Record Time Off or Vacation
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Block out vacation periods or company holidays so no candidates can book during these dates.
              </p>

              <form onSubmit={handleCreateTimeOff} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Reason / Title</label>
                  <input
                    type="text"
                    required
                    value={newTimeOff.title}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, title: e.target.value })}
                    placeholder="e.g. Annual Leave, Hackathon"
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newTimeOff.startDate}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, startDate: e.target.value })}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newTimeOff.endDate}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, endDate: e.target.value })}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={timeOffSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {timeOffSubmitting ? 'Adding...' : 'Add Time Off'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Time Off List */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h4 className="text-sm font-bold text-white mb-4">Scheduled Time Off ({timeOffList.length})</h4>
              {timeOffList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No time off or vacations scheduled.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {timeOffList.map(t => (
                    <div key={t._id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-white">{t.title}</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(t.startDate).toLocaleDateString()} to {new Date(t.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTimeOff(t._id)}
                        className="text-slate-500 hover:text-red-400 p-1.5"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
