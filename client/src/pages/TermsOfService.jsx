import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
            <span>This terms of service document is a template provided for architectural completeness and does not constitute formal legal counsel.</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-6">Terms of Service</h1>
        
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white mb-2">1. Acceptance of Terms</h2>
            <p className="text-slate-400 text-xs">
              By registering an account, scheduling an interview, or joining an interview room on InterviewHub, you agree to comply with and be bound by these terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">2. Acceptable Use of Code Execution</h2>
            <p className="text-slate-400 text-xs">
              Users agree not to run malicious binaries, attempt container escapes, perform denial-of-service attempts, port-scan internal networks, or execute unauthorized code on the sandbox execution cluster.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-2">3. Scheduling Fair Use</h2>
            <p className="text-slate-400 text-xs">
              Public self-scheduling booking links must be used responsibly. Automated slot-hogging, spam bookings, or abusive cancellations may result in rate-limiting or account suspension.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
