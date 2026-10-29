import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Globe, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Video,
  ShieldCheck,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

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

export default function PublicBooking() {
  const { slug, username } = useParams();
  const navigate = useNavigate();

  const [eventType, setEventType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scheduling state
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Booking questions state
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [attendeeNotes, setAttendeeNotes] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Step state: 'select_slot' | 'details'
  const [step, setStep] = useState('select_slot');

  useEffect(() => {
    async function fetchEventType() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = username 
          ? `/event-types/public/${username}/${slug}`
          : `/event-types/public/${slug}`;
        
        const res = await api.get(endpoint);
        if (res.data?.data) {
          setEventType(res.data.data);
          if (res.data.data.userId?.timezone) {
            setSelectedTimezone(res.data.data.userId.timezone);
          }
        } else {
          throw new Error('Event type not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load booking details.');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchEventType();
    }
  }, [slug, username]);

  // When date changes, query available slots
  useEffect(() => {
    if (!selectedDate || !eventType) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const res = await api.get(`/availability/slots?eventTypeId=${eventType._id}&date=${dateStr}&timezone=${selectedTimezone}`);
        setSlots(res.data?.data?.slots || []);
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, eventType, selectedTimezone]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !candidateName.trim() || !candidateEmail.trim()) {
      setSubmitError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => {
        const qObj = eventType.bookingQuestions?.find(q => q.id === qId);
        return {
          questionId: qId,
          questionLabel: qObj?.label || qId,
          answer: String(ans)
        };
      });

      const res = await api.post('/bookings/public', {
        eventTypeId: eventType._id,
        slotStart: selectedSlot.start,
        candidateName,
        candidateEmail,
        attendeeNotes,
        bookingAnswers: formattedAnswers
      });

      if (res.data?.success && res.data?.data?.meetingCode) {
        toast.success('Interview booked successfully!');
        navigate(`/booking/${res.data.data.meetingCode}/confirmation`);
      } else {
        throw new Error(res.data?.message || 'Booking failed');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not confirm booking. The slot may have just been claimed.';
      setSubmitError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-xs text-zinc-400">Loading booking calendar...</span>
        </div>
      </div>
    );
  }

  if (error || !eventType) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Booking Page Unavailable</h2>
          <p className="text-zinc-400 text-xs mb-6">{error || 'This interview schedule link is invalid or inactive.'}</p>
          <Link to="/" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-all">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const host = eventType.userId || {};

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-violet-500/30 selection:text-violet-300">
      <div className="max-w-6xl mx-auto">
        {/* Cal.com-grade Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sticky Host Profile & Event Specifications */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-sm backdrop-blur-xl space-y-6">
            {/* Host Avatar & Info */}
            <div className="flex items-center gap-3.5 pb-6 border-b border-zinc-800/80">
              <div className="relative">
                <img
                  src={host.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={host.name}
                  className="w-14 h-14 rounded-full border border-zinc-700/80 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-900" title="Active Host" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">{host.name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{host.title || 'Technical Interviewer'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded border border-violet-500/20">
                  Technical Evaluation
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-2 leading-snug">
                  {eventType.title}
                </h1>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{eventType.duration} minutes</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>InterviewHub Live Workspace (WebRTC + Monaco IDE)</span>
              </div>

              {eventType.description && (
                <p className="text-xs text-zinc-400 leading-relaxed pt-3 border-t border-zinc-800/80">
                  {eventType.description}
                </p>
              )}

              {host.bio && (
                <div className="bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/80 text-xs text-zinc-400">
                  <span className="text-[10px] font-semibold text-zinc-300 block mb-1">About Host:</span>
                  {host.bio}
                </div>
              )}
            </div>

            {/* Timezone Selector */}
            <div className="pt-4 border-t border-zinc-800/80">
              <label className="text-xs font-medium text-zinc-400 block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-violet-400" /> Timezone
              </label>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column: Calendar & Time Slots OR Booking Questions */}
          <div className="lg:col-span-8 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm backdrop-blur-xl">
            {step === 'select_slot' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Calendar Grid */}
                <div className="md:col-span-7">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-base">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <span key={d} className="py-1">{d}</span>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth().map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="h-10" />;
                      }

                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPast = day < today;
                      const isSelected = selectedDate && selectedDate.toDateString() === day.toDateString();

                      return (
                        <button
                          key={day.toISOString()}
                          disabled={isPast}
                          onClick={() => setSelectedDate(day)}
                          className={`h-10 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                              : isPast
                              ? 'text-zinc-600 cursor-not-allowed'
                              : 'text-zinc-200 hover:bg-violet-500/10 hover:text-violet-300 border border-transparent hover:border-violet-500/30'
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Slots List */}
                <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-6 md:pt-0 md:pl-6 flex flex-col">
                  <h4 className="font-semibold text-white text-sm mb-3">
                    {selectedDate 
                      ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      : 'Select a Date'}
                  </h4>

                  {!selectedDate ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                      <CalendarIcon className="w-8 h-8 mb-2 opacity-40 text-zinc-400" />
                      <p className="text-xs">Pick a day on the calendar to see real-time open slots.</p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="flex-1 flex items-center justify-center py-10">
                      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                      <Clock className="w-8 h-8 mb-2 opacity-40 text-amber-400" />
                      <p className="text-xs text-amber-400 font-medium">No open slots on this date.</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Please select another date on the calendar.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto max-h-80 space-y-2 pr-1">
                      {slots.map((slot) => {
                        const isChosen = selectedSlot?.start === slot.start;
                        return (
                          <div 
                            key={slot.start} 
                            className={`flex items-center gap-2 transition-all duration-300 ${
                              isChosen ? 'scale-[1.02]' : ''
                            }`}
                          >
                            <button
                              onClick={() => setSelectedSlot(slot)}
                              className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                                isChosen
                                  ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-violet-500/60 hover:text-white'
                              }`}
                            >
                              {slot.timeLabel}
                            </button>
                            {isChosen && (
                              <button
                                onClick={() => setStep('details')}
                                className="px-3.5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm flex items-center gap-1 shrink-0 animate-in fade-in slide-in-from-left-2 duration-200 cursor-pointer"
                              >
                                <span>Confirm</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Smooth Slide-In Candidate Details Form */
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  onClick={() => setStep('select_slot')}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to calendar
                </button>

                <div className="mb-6 pb-4 border-b border-zinc-800/80">
                  <h3 className="text-lg font-bold text-white">Enter Your Booking Details</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Slot: <strong className="text-violet-400 font-medium">{new Date(selectedSlot.start).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</strong> ({selectedTimezone})
                  </p>
                </div>

                {submitError && (
                  <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                        Your Full Name <span className="text-violet-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="e.g. Alex Chen"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                        Email Address <span className="text-violet-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        placeholder="e.g. alex.chen@example.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Dynamic Event Type Questions */}
                  {eventType.bookingQuestions?.map((q) => (
                    <div key={q.id}>
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                        {q.label} {q.required && <span className="text-violet-400">*</span>}
                      </label>
                      {q.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          required={q.required}
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                      ) : q.type === 'select' && q.options?.length ? (
                        <select
                          required={q.required}
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
                        >
                          <option value="">Select an option...</option>
                          {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={q.type || 'text'}
                          required={q.required}
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Additional Notes / Background <span className="text-zinc-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={attendeeNotes}
                      onChange={(e) => setAttendeeNotes(e.target.value)}
                      placeholder="Share anything that will help prepare for the technical evaluation..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-all shadow-sm hover:shadow-violet-600/25 flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Confirm & Schedule Interview</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
