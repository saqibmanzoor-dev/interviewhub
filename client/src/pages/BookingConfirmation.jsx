import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Video, 
  User, 
  Copy, 
  Download, 
  ExternalLink,
  RefreshCw,
  XCircle,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

export default function BookingConfirmation() {
  const { code } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await api.get(`/bookings/${code}`);
        if (res.data?.data) {
          setBooking(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch booking:', err);
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      fetchBooking();
    }
  }, [code]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Room URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadICS = () => {
    if (!booking) return;
    const start = new Date(booking.scheduledStart).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(booking.scheduledEnd).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const roomUrl = `${window.location.origin}/room/${code}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//InterviewHub//EN',
      'BEGIN:VEVENT',
      `UID:${booking.meetingCode}@interviewhub.io`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${booking.title}`,
      `DESCRIPTION:InterviewHub Live Interview Room\\nURL: ${roomUrl}`,
      `LOCATION:${roomUrl}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `interview-${code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar .ics file downloaded');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const host = booking?.interviewerIds?.[0] || {};
  const roomUrl = `${window.location.origin}/room/${code}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-16 px-4 sm:px-6 lg:px-8 selection:bg-violet-500/30 selection:text-violet-300">
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl">
          
          {/* Top ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />

          {/* Success Checkmark */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-sm shadow-emerald-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            You're Scheduled!
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
            A calendar invitation and confirmation email with meeting instructions has been dispatched to your inbox.
          </p>

          {/* Meeting Summary Card */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 text-left space-y-4 mb-8">
            <div className="pb-3 border-b border-zinc-800/80">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Interview Session</span>
              <h3 className="text-base font-bold text-white mt-0.5">{booking?.title || 'Technical Interview'}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
                <span>
                  {booking?.scheduledStart ? new Date(booking.scheduledStart).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Confirmed'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-zinc-300">
                <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                <span>
                  {booking?.scheduledStart ? new Date(booking.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : ''}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-zinc-300">
                <User className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Host: <strong className="text-zinc-100">{host.name || 'Lead Interviewer'}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 text-zinc-300">
                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-emerald-400 font-semibold">{code}</span>
              </div>
            </div>

            {/* Room Link Box */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
              <div className="text-xs truncate w-full sm:w-auto">
                <span className="text-zinc-500 block text-[10px]">Direct Join Link:</span>
                <span className="text-violet-400 font-mono font-medium">{roomUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Link
              to={`/room/${code}`}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg text-xs shadow-sm hover:shadow-violet-600/25 transition-all flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Enter Live Interview Room</span>
            </Link>

            <button
              onClick={downloadICS}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs border border-zinc-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .ics Calendar Invite</span>
            </button>
          </div>

          {/* Reschedule & Cancel Footer */}
          <div className="pt-6 border-t border-zinc-800/80 flex items-center justify-center gap-6 text-xs text-zinc-400">
            <Link to={`/booking/${code}/reschedule`} className="hover:text-violet-400 transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Reschedule Session
            </Link>
            <span className="text-zinc-700">•</span>
            <Link to={`/booking/${code}/cancel`} className="hover:text-red-400 transition-colors flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Cancel Interview
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
