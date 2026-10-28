import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code2, 
  Search, 
  Tag, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  X,
  Play,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/challenges');
      const list = res.data.data?.challenges || (Array.isArray(res.data.data) ? res.data.data : []);
      setChallenges(list);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    const matchesDiff = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
    const matchesSearch = 
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesDiff && matchesSearch;
  });

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B0F19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Code2 className="w-6 h-6 text-emerald-400" />
              <span>Coding Challenge Bank</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Curated technical interview problems equipped with automated test cases and starter templates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
              Total Problems: <strong className="text-emerald-400">{challenges.length}</strong>
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          
          {/* Difficulty filter buttons */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  difficultyFilter === diff
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {diff === 'all' ? 'All Difficulties' : diff}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problems, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

        </div>

        {/* Problem Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading challenges repository...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((prob) => (
              <div
                key={prob._id}
                onClick={() => setSelectedChallenge(prob)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer shadow-lg hover:shadow-emerald-500/5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getDifficultyBadge(prob.difficulty)}`}>
                      {prob.difficulty}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{prob.timeLimitMs || 1000}ms limit</span>
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {prob.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {prob.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {prob.tags?.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                        {t}
                      </span>
                    ))}
                    {(prob.tags?.length || 0) > 2 && (
                      <span className="text-[10px] text-slate-500 self-center">+{prob.tags.length - 2}</span>
                    )}
                  </div>

                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedChallenge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getDifficultyBadge(selectedChallenge.difficulty)}`}>
                {selectedChallenge.difficulty}
              </span>
              <span className="text-xs text-slate-400">Challenge ID: {selectedChallenge._id}</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-4">{selectedChallenge.title}</h2>

            <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">Description</h4>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedChallenge.description}
                </div>
              </div>

              {selectedChallenge.examples?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">Examples</h4>
                  <div className="space-y-2">
                    {selectedChallenge.examples.map((ex, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                        <div><strong className="text-emerald-400">Input:</strong> {ex.input}</div>
                        <div><strong className="text-cyan-400">Output:</strong> {ex.output}</div>
                        {ex.explanation && <div className="text-slate-400 mt-1 font-sans text-xs"><em>Explanation:</em> {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedChallenge.constraints?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">Constraints</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                    {selectedChallenge.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedChallenge.starterCode && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">Starter Template (JavaScript)</h4>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                    {selectedChallenge.starterCode.javascript || '// function solution() {}'}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedChallenge(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Close
              </button>
              <Link
                to={`/interviews?create=true`}
                onClick={() => setSelectedChallenge(null)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Use in New Interview</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
