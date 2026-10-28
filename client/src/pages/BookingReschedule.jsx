import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RefreshCw, Calendar, Clock, ArrowRight, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import api from '../services/api';

export default function BookingReschedule() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await api.get(`/bookings/${code}`);
        if (res.data?.data) {
          setBooking(res.data.data);
          // Preselect tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 2);
          const dateStr = tomorrow.toISOString().split('T')[0];
          setSelectedDate(dateStr);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Booking not found');
      } finally {
        setLoading(false);
      }
    }

    if (code) fetchBooking();
  }, [code]);

  useEffect(() => {
    if (!selectedDate || !booking?.eventTypeId?._id) return;

    async function fetchSlots() {
      try {
        const res = await api.get(`/availability/slots?eventTypeId=${booking.eventTypeId._id}&date=${selectedDate}`);
        setSlots(res.data?.data?.slots || []);
        setSelectedSlot(null);
      } catch (err) {
        setSlots([]);
      }
    }

    fetchSlots();
  }, [selectedDate, booking]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please choose a new time slot.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post(`/bookings/${code}/reschedule`, {
        newSlotStart: selectedSlot.start,
        reason
      });

      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/booking/${code}/confirmation`);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule. Slot might be unavailable.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4">
      <div className="max-w-xl mx-auto bg-[#111827] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
        <Link to={`/booking/${code}/confirmation`} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to booking confirmation
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reschedule Interview</h1>
            <p className="text-xs text-slate-400">Select a new date & time slot for {booking?.title}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Session rescheduled successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleReschedule} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Pick New Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Select Available Time Slot</label>
            {slots.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
                No slots open on this date. Please select another date above.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {slots.map(s => (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      selectedSlot?.start === s.start
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 border-slate-700/80 text-blue-400 hover:border-blue-500/50'
                    }`}
                  >
                    {s.timeLabel}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Reason for Rescheduling (Optional)</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict with college exam..."
              className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            {submitting ? 'Updating Slot...' : 'Confirm Rescheduled Time'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
