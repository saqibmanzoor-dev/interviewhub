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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hard':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8 selection:bg-violet-500/30 selection:text-violet-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Code2 className="w-6 h-6 text-violet-400" />
              <span>Coding Challenge Bank</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
              Curated technical interview problems equipped with automated test cases and starter templates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
              Total Problems: <strong className="text-violet-400 font-mono">{challenges.length}</strong>
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 shadow-sm backdrop-blur-xl">
          
          {/* Difficulty filter buttons */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  difficultyFilter === diff
                    ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                {diff === 'all' ? 'All Difficulties' : diff}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problems, algorithms, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

        </div>

        {/* Problem Grid / Skeletons / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-16 bg-zinc-800 rounded" />
                  <div className="h-4 w-20 bg-zinc-800/60 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-zinc-800 rounded" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-zinc-800/60 rounded" />
                  <div className="h-3 w-4/5 bg-zinc-800/60 rounded" />
                </div>
                <div className="pt-3 border-t border-zinc-800/80 flex justify-between">
                  <div className="h-4 w-24 bg-zinc-800/60 rounded" />
                  <div className="h-4 w-16 bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((prob) => (
              <div
                key={prob._id}
                onClick={() => setSelectedChallenge(prob)}
                className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 cursor-pointer shadow-sm hover:shadow-violet-600/5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${getDifficultyBadge(prob.difficulty)}`}>
                      {prob.difficulty}
                    </span>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{prob.timeLimitMs || 1000}ms</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                    {prob.title}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                    {prob.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {prob.tags?.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700/50">
                        {t}
                      </span>
                    ))}
                    {(prob.tags?.length || 0) > 2 && (
                      <span className="text-[10px] text-zinc-500 self-center">+{prob.tags.length - 2}</span>
                    )}
                  </div>

                  <span className="text-xs text-violet-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto mb-3">
              <Code2 className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">No matching challenges</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              No problems match your search criteria. Try adjusting the difficulty filter or keywords.
            </p>
            <button
              onClick={() => { setDifficultyFilter('all'); setSearch(''); }}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-7 relative text-left">
            <button
              onClick={() => setSelectedChallenge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${getDifficultyBadge(selectedChallenge.difficulty)}`}>
                {selectedChallenge.difficulty}
              </span>
              <span className="text-xs font-mono text-zinc-500">ID: {selectedChallenge._id}</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-4">{selectedChallenge.title}</h2>

            <div className="space-y-4 text-xs text-zinc-300">
              <div>
                <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">Description</h4>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {selectedChallenge.description}
                </div>
              </div>

              {selectedChallenge.examples?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">Examples</h4>
                  <div className="space-y-2">
                    {selectedChallenge.examples.map((ex, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px]">
                        <div><strong className="text-emerald-400">Input:</strong> {ex.input}</div>
                        <div><strong className="text-cyan-400">Output:</strong> {ex.output}</div>
                        {ex.explanation && <div className="text-zinc-400 mt-1 font-sans text-xs"><em>Explanation:</em> {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedChallenge.constraints?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">Constraints</h4>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 text-xs">
                    {selectedChallenge.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedChallenge.starterCode && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">Starter Template (JavaScript)</h4>
                  <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-violet-300 overflow-x-auto">
                    {selectedChallenge.starterCode.javascript || '// function solution() {}'}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedChallenge(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link
                to={`/interviews?create=true`}
                onClick={() => setSelectedChallenge(null)}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white shadow-sm hover:shadow-violet-600/25 transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Attach to New Interview</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
