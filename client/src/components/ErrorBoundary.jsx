import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('InterviewHub Uncaught Error:', error, errorInfo);
  }

  handleReload = () => {
    localStorage.removeItem('interviewhub_token');
    localStorage.removeItem('interviewhub_user');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-4">
              An unexpected error occurred while rendering the page.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs text-rose-400 bg-black/40 p-3 rounded-lg overflow-x-auto text-left mb-3 font-mono border border-rose-500/10">
                {this.state.error.message}
              </pre>
            )}
            {this.state.error?.stack && (
              <details className="text-left mb-6">
                <summary className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer select-none">
                  View error details
                </summary>
                <pre className="mt-2 text-[10px] text-slate-400 bg-black/60 p-3 rounded-lg overflow-x-auto font-mono border border-slate-800 max-h-40 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex flex-wrap gap-2.5 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700 cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-medium transition border border-slate-800 cursor-pointer"
                title="Clears saved session and goes to home"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
