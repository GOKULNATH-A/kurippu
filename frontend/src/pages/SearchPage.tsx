import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, CheckSquare, X, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { searchApi } from '../lib/api';
import { formatDate, formatFileSize } from '../lib/utils';
import { AppLayout } from '../components/AppLayout';
import { PriorityBadge, DocStatusBadge, EmptyState } from '../components/ui';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 350);

  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    const search = async () => {
      setLoading(true);
      try {
        const res = await searchApi.search(debouncedQuery.trim());
        setResults(res.data);
      } catch { setResults(null); }
      finally { setLoading(false); }
    };
    search();
  }, [debouncedQuery]);

  const hasResults = results && (results.documents?.length > 0 || results.actions?.length > 0);

  const exampleQueries = [
    { label: 'project', color: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20' },
    { label: 'October', color: 'border-pink-500/30 text-pink-300 bg-pink-500/10 hover:bg-pink-500/20' },
    { label: 'Sakthi', color: 'border-amber-500/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20' },
    { label: 'presentation', color: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20' },
    { label: 'deadline', color: 'border-rose-500/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20' },
    { label: 'submission', color: 'border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20' },
  ];

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[100px]" />
      </div>

      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3 h-3 text-neon-cyan animate-pulse" /> Unified Semantic Search
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Workspace Search
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Instantly search across documents, actions, team assignees, and dates.
          </p>
        </div>
      </div>

      {/* Search Input Box with Neon Multi-Color Glow */}
      <div className="relative mb-8 max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-cyan" />
        <input
          autoFocus
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-surface-1 border border-white/[0.12] text-white placeholder-ink-subtle text-base focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_25px_rgba(0,229,255,0.25)] transition-all shadow-md"
          placeholder="Search by keywords, person, topic, or date…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-ink-subtle hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan animate-spin" />
        )}
      </div>

      {/* Results / Empty View */}
      <AnimatePresence mode="wait">
        {!query ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState
              icon={<Search className="w-8 h-8 text-neon-cyan" />}
              title="Search everything in your workspace"
              description="Type any name, project, date, or topic to find matching documents and extracted actions."
            />
            <div className="mt-8 max-w-xl mx-auto text-center">
              <p className="text-xs text-ink-muted mb-3 uppercase tracking-wider font-bold">Suggested Quick Searches</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {exampleQueries.map(({ label, color }) => (
                  <button
                    key={label}
                    onClick={() => setQuery(label)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${color}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : loading ? null : !hasResults ? (
          <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState
              icon={<Search className="w-8 h-8 text-rose-400" />}
              title={`No matches found for "${query}"`}
              description="Try adjusting your query or check for typos."
            />
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <p className="text-xs font-semibold text-ink-muted">
              Found <strong className="text-neon-cyan">{results.total}</strong> result{results.total !== 1 ? 's' : ''} for "<span className="text-white">{query}</span>"
            </p>

            {/* Documents */}
            {results.documents?.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Documents ({results.documents.length})
                </h2>
                <div className="space-y-2.5">
                  {results.documents.map((doc: any, i: number) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="p-4 rounded-xl bg-surface-1/90 border border-purple-500/20 hover:border-purple-500/60 flex items-center gap-4 cursor-pointer transition-all group shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-purple-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                          {highlightMatch(doc.original_filename, query)}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">{formatFileSize(doc.file_size)}</p>
                      </div>
                      <DocStatusBadge status={doc.status} />
                      <ArrowRight className="w-4 h-4 text-ink-subtle group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Actions */}
            {results.actions?.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-neon-green" /> Extracted Actions ({results.actions.length})
                </h2>
                <div className="space-y-2.5">
                  {results.actions.map((action: any, i: number) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => navigate('/actions')}
                      className="p-4 rounded-xl bg-surface-1/90 border border-emerald-500/20 hover:border-emerald-500/60 flex items-start gap-4 cursor-pointer transition-all group shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {highlightMatch(action.title, query)}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                          {action.due_date && (
                            <span className="text-xs text-cyan-300 font-medium">📅 {formatDate(action.due_date)}</span>
                          )}
                          {action.assignee && (
                            <span className="text-xs text-purple-300">👤 {highlightMatch(action.assignee, query)}</span>
                          )}
                          {action.source_document_name && (
                            <span className="text-xs text-brand-300 truncate max-w-40 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                              📄 {action.source_document_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <PriorityBadge priority={action.priority} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-neon-cyan/30 text-neon-cyan font-bold rounded px-1">{part}</mark>
          : part
      )}
    </>
  );
}
