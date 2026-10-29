import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, AlertTriangle, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

export default function BookingCancel() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await api.get(`/bookings/${code}`);
        if (res.data?.data) {
          setBooking(res.data.data);
          if (res.data.data.status === 'cancelled') {
            setCancelled(true);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Booking not found');
      } finally {
        setLoading(false);
      }
    }

    if (code) fetchBooking();
  }, [code]);

  const handleCancel = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post(`/bookings/${code}/cancel`, { reason });
      if (res.data?.success) {
        setCancelled(true);
        toast.success('Interview cancelled successfully');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to cancel booking.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-16 px-4 selection:bg-violet-500/30 selection:text-violet-300">
      <div className="max-w-md mx-auto bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        <Link 
          to={`/booking/${code}/confirmation`} 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to booking
        </Link>

        {cancelled ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Booking Cancelled</h1>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              This interview has been cancelled and the time slot has been freed on the calendar. An email notification has been dispatched to all participants.
            </p>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg text-xs transition-colors"
            >
              Return Home
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Cancel Interview</h1>
                <p className="text-xs text-zinc-400">Release reserved slot for {booking?.title}</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCancel} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Reason for Cancellation (Optional)</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Let the interviewer know why you need to cancel..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Link
                  to={`/booking/${code}/confirmation`}
                  className="px-4 py-2.5 text-xs text-zinc-400 hover:text-white"
                >
                  Never mind
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
