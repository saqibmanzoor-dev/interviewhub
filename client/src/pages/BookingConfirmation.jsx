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
  AlertCircle
} from 'lucide-react';
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const host = booking?.interviewerIds?.[0] || {};
  const roomUrl = `${window.location.origin}/room/${code}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          
          {/* Top glow decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Success Checkmark */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            You're Scheduled!
          </h1>
          <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
            A calendar invitation and confirmation email with meeting instructions has been sent to your inbox.
          </p>

          {/* Meeting Summary Card */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 text-left space-y-4 mb-8">
            <div className="pb-3 border-b border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Interview Session</span>
              <h3 className="text-lg font-bold text-white mt-0.5">{booking?.title || 'Technical Interview'}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {booking?.scheduledStart ? new Date(booking.scheduledStart).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Confirmed'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {booking?.scheduledStart ? new Date(booking.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : ''}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Host: <strong>{host.name || 'Lead Interviewer'}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-emerald-400 font-semibold">{code}</span>
              </div>
            </div>

            {/* Room Link Box */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="text-xs truncate w-full sm:w-auto">
                <span className="text-slate-400 block text-[11px]">Direct Join Link:</span>
                <span className="text-blue-400 font-mono font-medium">{roomUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link
              to={`/room/${code}`}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Enter Live Interview Room</span>
            </Link>

            <button
              onClick={downloadICS}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download .ics Calendar Invite</span>
            </button>
          </div>

          {/* Reschedule & Cancel Footer */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-center gap-6 text-xs text-slate-400">
            <Link to={`/booking/${code}/reschedule`} className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Reschedule Session
            </Link>
            <span className="text-slate-700">•</span>
            <Link to={`/booking/${code}/cancel`} className="hover:text-red-400 transition-colors flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Cancel Interview
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
