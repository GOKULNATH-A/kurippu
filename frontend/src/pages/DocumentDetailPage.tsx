import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, AlertTriangle,
  User, Calendar, Clock, Zap, ChevronDown, ChevronUp,
  CheckSquare, Info, HelpCircle, Trash2, Sparkles, Layers
} from 'lucide-react';
import { documentsApi, actionsApi } from '../lib/api';
import { formatDate, formatDatetime, formatFileSize, timeAgo } from '../lib/utils';
import {
  DocStatusBadge, ConfidenceBar, PriorityBadge,
  Modal, Spinner, ProcessingPulse, EmptyState
} from '../components/ui';
import { AppLayout } from '../components/AppLayout';
import toast from 'react-hot-toast';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [docData, setDocData] = useState<any>(null);
  const [extraction, setExtraction] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActions, setSelectedActions] = useState<number[]>([]);
  const [confirmingActions, setConfirmingActions] = useState(false);
  const [showAllSummary, setShowAllSummary] = useState(false);
  const [whyModal, setWhyModal] = useState<{ open: boolean; action: any }>({ open: false, action: null });
  const [deleting, setDeleting] = useState(false);

  const isProcessing = (status: string) =>
    ['uploading', 'processing', 'analyzing', 'extracting'].includes(status);

  const load = async () => {
    if (!id) return;
    try {
      const [docRes, extRes, tlRes] = await Promise.all([
        documentsApi.get(id),
        documentsApi.getExtractions(id),
        documentsApi.getTimeline(id),
      ]);
      setDocData(docRes.data);
      setExtraction(extRes.data);
      setTimeline(tlRes.data?.timeline ?? []);
    } catch {
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!docData?.document) return;
    if (!isProcessing(docData.document.status)) return;
    const interval = setInterval(load, 2500);
    return () => clearInterval(interval);
  }, [docData?.document?.status]);

  const toggleSelectAction = (idx: number) => {
    setSelectedActions(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAll = () => {
    if (!extraction?.actions_raw) return;
    const unconfirmedIndices = extraction.actions_raw
      .map((_: any, i: number) => i)
      .filter((i: number) => !docData?.actions?.some((a: any) =>
        a.title === extraction.actions_raw[i].title
      ));
    if (selectedActions.length === unconfirmedIndices.length) {
      setSelectedActions([]);
    } else {
      setSelectedActions(unconfirmedIndices);
    }
  };

  const handleConfirm = async () => {
    if (!extraction || selectedActions.length === 0) return;
    setConfirmingActions(true);
    try {
      const actionsToCreate = selectedActions.map(i => extraction.actions_raw[i]);
      await actionsApi.bulkConfirm({
        document_id: id!,
        actions: actionsToCreate,
      });
      toast.success(`${actionsToCreate.length} action item${actionsToCreate.length > 1 ? 's' : ''} added to your workspace!`);
      setSelectedActions([]);
      load();
    } catch {
      toast.error('Failed to create actions');
    } finally {
      setConfirmingActions(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this document and all its extracted actions?')) return;
    setDeleting(true);
    try {
      await documentsApi.delete(id!);
      toast.success('Document deleted');
      navigate('/documents');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-80">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  const doc = docData?.document;
  const actionsRaw = extraction?.actions_raw ?? [];
  const confirmedActionTitles = new Set(docData?.actions?.map((a: any) => a.title) ?? []);
  const unconfirmedActions = actionsRaw.filter((a: any) => !confirmedActionTitles.has(a.title));

  const timelineStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === 'in_progress') return <Spinner size="sm" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-rose-400" />;
    return <Clock className="w-4 h-4 text-ink-subtle" />;
  };

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-ink-muted hover:text-white transition-colors border border-white/[0.06] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-white truncate max-w-lg">
              {doc?.original_filename}
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Uploaded {timeAgo(doc?.created_at)} · {formatFileSize(doc?.file_size ?? 0)}
              {doc?.page_count && ` · ${doc.page_count} pages`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DocStatusBadge status={doc?.status} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Processing Pulse */}
      {doc && isProcessing(doc.status) && (
        <div className="mb-6">
          <ProcessingPulse status={doc.status} />
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Document Info + AI Summary + Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Summary Card */}
          {extraction?.summary && (
            <div className="p-5 rounded-3xl bg-surface-1/90 border border-brand-500/30 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-pink" />
              <h3 className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-amber" />
                AI Executive Summary
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {showAllSummary ? extraction.summary : extraction.summary.slice(0, 240)}
                {extraction.summary.length > 240 && (
                  <button
                    onClick={() => setShowAllSummary(!showAllSummary)}
                    className="text-neon-cyan font-bold ml-1.5 hover:underline cursor-pointer"
                  >
                    {showAllSummary ? 'Show less' : 'Read more…'}
                  </button>
                )}
              </p>

              {extraction.confidence_score && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Extraction Confidence</p>
                  <ConfidenceBar confidence={extraction.confidence_score} />
                </div>
              )}
            </div>
          )}

          {/* Key Points */}
          {extraction?.key_points?.length > 0 && (
            <div className="p-5 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg">
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-neon-cyan" /> Key Takeaways
              </h3>
              <ul className="space-y-2">
                {extraction.key_points.map((p: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-ink-muted leading-relaxed">
                    <span className="text-neon-cyan font-bold shrink-0 mt-0.5">✦</span>
                    <span className="text-white font-medium">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* People Mentioned */}
          {extraction?.people?.length > 0 && (
            <div className="p-5 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg">
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Stakeholders & Assignees</h3>
              <div className="flex flex-wrap gap-2">
                {extraction.people.map((p: string) => (
                  <span key={p} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                    <User className="w-3 h-3 text-purple-400" /> {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Important Dates */}
          {extraction?.important_dates?.length > 0 && (
            <div className="p-5 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg">
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Milestone Dates</h3>
              <div className="space-y-2">
                {extraction.important_dates.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-surface-2/60 border border-white/[0.04] text-xs">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neon-cyan" />
                      {formatDate(d.date)}
                    </span>
                    <span className="text-ink-muted">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Timeline */}
          {timeline.length > 0 && (
            <div className="p-5 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg">
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-4">Processing Pipeline</h3>
              <div className="relative pl-1">
                {timeline.map((step: any, i: number) => (
                  <div key={step.step} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-surface-3" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      step.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                      'bg-surface-3 text-ink-subtle'
                    }`}>
                      {timelineStatusIcon(step.status)}
                    </div>
                    <div className="pb-1">
                      <p className="text-xs font-bold text-white">{step.title}</p>
                      {step.details && <p className="text-[10px] text-ink-muted mt-0.5">{step.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Extracted Actions */}
        <div className="lg:col-span-3 space-y-5">
          {/* Confirmed Actions */}
          {docData?.actions?.length > 0 && (
            <div className="p-5 rounded-3xl bg-surface-1/90 border border-emerald-500/30 shadow-lg">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Active Extracted Actions ({docData.actions.length})
              </h3>
              <div className="space-y-2.5">
                {docData.actions.map((a: any) => (
                  <div key={a.id} className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{a.title}</p>
                      {a.due_date && (
                        <p className="text-[10px] text-emerald-300/80 mt-0.5 font-medium">📅 Due {formatDate(a.due_date)}</p>
                      )}
                    </div>
                    <PriorityBadge priority={a.priority} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggested Actions — Human-in-the-Loop */}
          {unconfirmedActions.length > 0 ? (
            <div className="p-6 rounded-3xl bg-surface-1/90 border border-brand-500/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-pink" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs flex items-center justify-center font-bold">
                      {unconfirmedActions.length}
                    </span>
                    AI Extracted {unconfirmedActions.length} Action{unconfirmedActions.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Select actions to confirm and add to your active workspace agenda.
                  </p>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-xl border border-white/[0.1] bg-surface-2 text-xs font-bold text-ink-muted hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {selectedActions.length === unconfirmedActions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-3">
                {unconfirmedActions.map((action: any, idx: number) => {
                  const origIdx = actionsRaw.findIndex((a: any) => a.title === action.title);
                  const isSelected = selectedActions.includes(origIdx);

                  return (
                    <motion.div
                      key={origIdx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => toggleSelectAction(origIdx)}
                      className={`
                        p-4 rounded-2xl border cursor-pointer transition-all duration-200
                        ${isSelected
                          ? 'border-brand-500 bg-brand-600/15 shadow-[0_0_20px_rgba(124,58,255,0.25)]'
                          : 'border-white/[0.08] bg-surface-2/60 hover:border-white/[0.18]'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-brand-600 to-pink-600 border-pink-500 shadow-[0_0_8px_#ff2d92]'
                            : 'border-white/20'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-white">{action.title}</p>
                            <PriorityBadge priority={action.priority} />
                          </div>

                          {action.description && (
                            <p className="text-xs text-ink-muted mt-1 leading-relaxed">{action.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-white/[0.04]">
                            {action.deadline && (
                              <span className="flex items-center gap-1.5 text-xs text-cyan-300 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(action.deadline)}
                              </span>
                            )}
                            {action.assignee && (
                              <span className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
                                <User className="w-3.5 h-3.5" />
                                {action.assignee}
                              </span>
                            )}
                            <ConfidenceBar confidence={action.confidence ?? 0.85} />
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setWhyModal({ open: true, action });
                            }}
                            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-neon-cyan hover:underline"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            View AI Evidence Sentence
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Confirm / Ignore */}
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/[0.08]">
                <button
                  onClick={handleConfirm}
                  disabled={selectedActions.length === 0 || confirmingActions}
                  className="btn-primary flex-1 py-3 text-sm font-bold shadow-[0_0_25px_rgba(124,58,255,0.45)] cursor-pointer"
                >
                  {confirmingActions ? <Spinner size="sm" /> : <CheckSquare className="w-4 h-4" />}
                  Confirm & Create {selectedActions.length > 0 ? selectedActions.length : ''} Action{selectedActions.length !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => setSelectedActions([])}
                  className="px-4 py-3 rounded-xl border border-white/[0.1] bg-surface-2 hover:bg-surface-3 text-xs font-bold text-ink-muted hover:text-white transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          ) : extraction && actionsRaw.length > 0 ? (
            <div className="p-8 rounded-3xl bg-surface-1/90 border border-emerald-500/30 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">All actions confirmed!</p>
              <p className="text-xs text-ink-muted mt-1">Every item extracted by AI has been added to your actions list.</p>
            </div>
          ) : doc?.status === 'completed' && actionsRaw.length === 0 ? (
            <div className="p-8 rounded-3xl bg-surface-1/90 border border-white/[0.08] text-center">
              <Info className="w-10 h-10 text-ink-subtle mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No action items detected</p>
              <p className="text-xs text-ink-muted mt-1">This document does not contain clear tasks or deadlines.</p>
            </div>
          ) : null}

          {/* Requirements & Decisions Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {extraction?.requirements?.length > 0 && (
              <div className="p-5 rounded-3xl bg-surface-1/90 border border-amber-500/20 shadow-md">
                <h3 className="text-xs font-bold text-neon-amber uppercase tracking-wider mb-3">Key Requirements</h3>
                <ul className="space-y-2">
                  {extraction.requirements.map((r: string, i: number) => (
                    <li key={i} className="text-xs text-ink-muted flex gap-2">
                      <span className="text-amber-400 font-bold shrink-0">→</span>
                      <span className="text-white">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {extraction?.decisions?.length > 0 && (
              <div className="p-5 rounded-3xl bg-surface-1/90 border border-purple-500/20 shadow-md">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Decisions Recorded</h3>
                <ul className="space-y-2">
                  {extraction.decisions.map((d: string, i: number) => (
                    <li key={i} className="text-xs text-ink-muted flex gap-2">
                      <span className="text-purple-400 font-bold shrink-0">✓</span>
                      <span className="text-white">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "Why This Action?" Modal */}
      <Modal
        isOpen={whyModal.open}
        onClose={() => setWhyModal({ open: false, action: null })}
        title="AI Evidence & Extraction Rationale"
        size="md"
      >
        {whyModal.action && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Target Action</p>
              <p className="text-sm font-bold text-white">{whyModal.action.title}</p>
            </div>
            <div className="p-4 rounded-2xl bg-brand-600/10 border border-brand-500/30">
              <p className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">Original Context Sentence</p>
              <p className="text-sm font-medium text-white italic leading-relaxed border-l-2 border-brand-500 pl-3">
                "{whyModal.action.evidence || 'Inferred by AI from overall document instructions and key dates.'}"
              </p>
              {whyModal.action.evidence_page && (
                <p className="text-xs text-ink-subtle mt-2 font-mono">— Document Page {whyModal.action.evidence_page}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Confidence Assessment</p>
                <ConfidenceBar confidence={whyModal.action.confidence ?? 0.85} />
              </div>
              {whyModal.action.assignee && (
                <div>
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Detected Assignee</p>
                  <p className="text-xs font-semibold text-purple-300">{whyModal.action.assignee}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Assigned Priority</p>
              <PriorityBadge priority={whyModal.action.priority} />
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
