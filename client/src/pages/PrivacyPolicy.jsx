import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-[#111827] border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Legal Review Disclaimer Alert */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong className="block font-bold mb-1">Draft Placeholder for Legal Review</strong>
            <span>This document is a technical draft provided as part of the InterviewHub software implementation. It is clearly marked for review and does not constitute legal counsel or formal legal advice.</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white mb-2">1. Information We Collect</h2>
            <p className="text-slate-400 text-xs">
              InterviewHub collects information that you provide directly, including your name, email address, timezone, submitted code solutions, and interview scheduling records. For Google OAuth authentication, verified profile identifiers and email addresses are received from Google APIs.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. Live Audio & Video Data</h2>
            <p className="text-slate-400 text-xs">
              Audio and video streams during technical interview sessions are transmitted directly via peer-to-peer WebRTC connections. In adherence with our core security guidelines, meeting recordings are disabled by default unless explicitly initiated with full two-party attendee consent.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. Code Execution & Submissions</h2>
            <p className="text-slate-400 text-xs">
              Code submitted during interviews is executed in isolated sandbox environments with strict CPU, memory, and timeout bounds. Submissions are associated with interview records for interviewer evaluation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">4. Contact & Inquiries</h2>
            <p className="text-slate-400 text-xs">
              For inquiries regarding data retention or account erasure, contact <span className="text-blue-400 font-mono">privacy@interviewhub.io</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
