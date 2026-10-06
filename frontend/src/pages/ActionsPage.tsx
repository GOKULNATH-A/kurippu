import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Plus, Filter, LayoutGrid, List,
  CheckCircle2, Clock, AlertTriangle, ArrowRight,
  User, Calendar, Trash2, Edit2, HelpCircle, Sparkles
} from 'lucide-react';
import { actionsApi } from '../lib/api';
import { formatDate, isOverdue } from '../lib/utils';
import {
  PriorityBadge, StatusBadge, ConfidenceBar,
  EmptyState, SkeletonList, Modal, Spinner
} from '../components/ui';
import { AppLayout } from '../components/AppLayout';
import toast from 'react-hot-toast';

const STATUS_COLUMNS = [
  {
    key: 'todo',
    label: 'To Do',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    headerBg: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    dot: 'bg-amber-400 shadow-[0_0_8px_#ffd700]'
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    headerBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40',
    dot: 'bg-cyan-400 shadow-[0_0_8px_#00e5ff]'
  },
  {
    key: 'completed',
    label: 'Completed',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    headerBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    dot: 'bg-emerald-400 shadow-[0_0_8px_#39ff14]'
  },
];

const DEADLINE_GROUPS = [
  { key: 'overdue', label: 'Overdue Items', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/40', filter: (a: any) => isOverdue(a.due_date) && a.status !== 'completed' },
  { key: 'today', label: 'Due Today', badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40', filter: (a: any) => a.due_date === new Date().toISOString().split('T')[0] && a.status !== 'completed' },
  { key: 'tomorrow', label: 'Due Tomorrow', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/40', filter: (a: any) => {
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    return a.due_date === tom.toISOString().split('T')[0] && a.status !== 'completed';
  }},
  { key: 'this_week', label: 'Later This Week', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/40', filter: (a: any) => {
    if (!a.due_date || a.status === 'completed') return false;
    const d = new Date(a.due_date); const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    return diff > 1 && diff <= 7;
  }},
  { key: 'later', label: 'Upcoming Later', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/40', filter: (a: any) => {
    if (!a.due_date || a.status === 'completed') return false;
    const d = new Date(a.due_date); const now = new Date();
    return Math.ceil((d.getTime() - now.getTime()) / 86400000) > 7;
  }},
  { key: 'no_date', label: 'No Deadline Specified', badge: 'bg-surface-3 text-ink-muted border-white/[0.08]', filter: (a: any) => !a.due_date && a.status !== 'completed' },
];

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban' | 'deadline'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [editModal, setEditModal] = useState<{ open: boolean; action: any }>({ open: false, action: null });
  const [whyModal, setWhyModal] = useState<{ open: boolean; actionId: string | null; data: any }>({ open: false, actionId: null, data: null });
  const [createModal, setCreateModal] = useState(false);
  const [newAction, setNewAction] = useState({ title: '', description: '', priority: 'medium', due_date: '', assignee: '' });

  const load = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (priorityFilter) params.priority_filter = priorityFilter;
      const res = await actionsApi.list(params);
      setActions(res.data);
    } catch { toast.error('Failed to load actions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, priorityFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await actionsApi.update(id, { status });
      setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (status === 'completed') toast.success('Action completed! 🎉');
    } catch { toast.error('Update failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await actionsApi.delete(id);
      setActions(prev => prev.filter(a => a.id !== id));
      toast.success('Action deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleWhy = async (action: any) => {
    setWhyModal({ open: true, actionId: action.id, data: null });
    try {
      const res = await actionsApi.why(action.id);
      setWhyModal(prev => ({ ...prev, data: res.data }));
    } catch {
      setWhyModal(prev => ({ ...prev, data: { error: true } }));
    }
  };

  const handleCreate = async () => {
    if (!newAction.title.trim()) return;
    try {
      const res = await actionsApi.create({ ...newAction, is_ai_suggested: false });
      setActions(prev => [res.data, ...prev]);
      setCreateModal(false);
      setNewAction({ title: '', description: '', priority: 'medium', due_date: '', assignee: '' });
      toast.success('Action created!');
    } catch { toast.error('Create failed'); }
  };

  const handleUpdate = async () => {
    if (!editModal.action) return;
    try {
      const res = await actionsApi.update(editModal.action.id, editModal.action);
      setActions(prev => prev.map(a => a.id === editModal.action.id ? res.data : a));
      setEditModal({ open: false, action: null });
      toast.success('Action updated!');
    } catch { toast.error('Update failed'); }
  };

  const filteredActions = actions;

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-80 h-80 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-green/10 rounded-full blur-[130px]" />
      </div>

      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-neon-green animate-pulse" /> Live Execution Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Action Items
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {actions.length} total actions extracted & created across all documents
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-[0_0_20px_rgba(124,58,255,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Action</span>
        </button>
      </div>

      {/* Filters & View Toggle */}
      <div className="p-3 rounded-2xl bg-surface-1 border border-white/[0.08] flex items-center gap-3 mb-6 flex-wrap shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neon-cyan" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-cyan transition-all"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-amber transition-all"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="ml-auto flex items-center bg-surface-2/80 border border-white/[0.08] rounded-xl p-1 gap-1">
          {[
            { key: 'list', icon: List, label: 'List' },
            { key: 'kanban', icon: LayoutGrid, label: 'Kanban' },
            { key: 'deadline', icon: Calendar, label: 'Timeline' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === key
                  ? 'bg-gradient-to-r from-brand-600 to-pink-600 text-white shadow-[0_0_12px_rgba(124,58,255,0.4)]'
                  : 'text-ink-muted hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredActions.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-brand-400" />}
          title="No action items found"
          description="Upload a document to extract actionable items or create one manually."
          action={
            <button onClick={() => setCreateModal(true)} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Create Manual Action
            </button>
          }
        />
      ) : view === 'kanban' ? (
        <KanbanView
          actions={filteredActions}
          onStatusChange={updateStatus}
          onDelete={handleDelete}
          onEdit={(a: any) => setEditModal({ open: true, action: { ...a } })}
          onWhy={handleWhy}
        />
      ) : view === 'deadline' ? (
        <DeadlineView
          actions={filteredActions}
          onStatusChange={updateStatus}
          onDelete={handleDelete}
          onEdit={(a: any) => setEditModal({ open: true, action: { ...a } })}
          onWhy={handleWhy}
        />
      ) : (
        <ListView
          actions={filteredActions}
          onStatusChange={updateStatus}
          onDelete={handleDelete}
          onEdit={(a: any) => setEditModal({ open: true, action: { ...a } })}
          onWhy={handleWhy}
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Action Item">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Title *</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-sm text-white placeholder-ink-subtle focus:outline-none focus:border-brand-400 focus:shadow-[0_0_12px_rgba(124,58,255,0.3)] transition-all"
              placeholder="e.g. Schedule review meeting with design team"
              value={newAction.title}
              onChange={e => setNewAction({ ...newAction, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-sm text-white placeholder-ink-subtle focus:outline-none focus:border-brand-400 h-20 resize-none transition-all"
              placeholder="Provide context or instructions…"
              value={newAction.description}
              onChange={e => setNewAction({ ...newAction, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Priority</label>
              <select
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-amber"
                value={newAction.priority}
                onChange={e => setNewAction({ ...newAction, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Due Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-cyan"
                value={newAction.due_date}
                onChange={e => setNewAction({ ...newAction, due_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Assignee</label>
            <input
              className="w-full px-4 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-brand-400"
              placeholder="e.g. Sarah Connor"
              value={newAction.assignee}
              onChange={e => setNewAction({ ...newAction, assignee: e.target.value })}
            />
          </div>
          <button
            onClick={handleCreate}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-pink-600 hover:from-brand-500 hover:to-pink-500 shadow-[0_0_20px_rgba(124,58,255,0.4)] transition-all cursor-pointer"
          >
            Create Action
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, action: null })} title="Edit Action Item">
        {editModal.action && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Title</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-sm text-white focus:outline-none focus:border-brand-400"
                value={editModal.action.title}
                onChange={e => setEditModal(prev => ({ ...prev, action: { ...prev.action, title: e.target.value } }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Status</label>
              <select
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-brand-400"
                value={editModal.action.status}
                onChange={e => setEditModal(prev => ({ ...prev, action: { ...prev.action, status: e.target.value } }))}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Priority</label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-amber"
                  value={editModal.action.priority}
                  onChange={e => setEditModal(prev => ({ ...prev, action: { ...prev.action, priority: e.target.value } }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-cyan"
                  value={editModal.action.due_date || ''}
                  onChange={e => setEditModal(prev => ({ ...prev, action: { ...prev.action, due_date: e.target.value } }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Assignee</label>
              <input
                className="w-full px-4 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-brand-400"
                value={editModal.action.assignee || ''}
                onChange={e => setEditModal(prev => ({ ...prev, action: { ...prev.action, assignee: e.target.value } }))}
              />
            </div>
            <button
              onClick={handleUpdate}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-pink-600 hover:from-brand-500 hover:to-pink-500 shadow-[0_0_20px_rgba(124,58,255,0.4)] transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        )}
      </Modal>

      {/* Why This Action Modal */}
      <Modal isOpen={whyModal.open} onClose={() => setWhyModal({ open: false, actionId: null, data: null })} title="AI Evidence & Extraction Rationale">
        {!whyModal.data ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : whyModal.data.error ? (
          <p className="text-sm text-ink-muted">No evidence sentence recorded for this action.</p>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-600/10 via-surface-2 to-surface-1 border border-brand-500/30">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-brand-300">
                <Sparkles className="w-3.5 h-3.5 text-neon-amber" />
                <span>Extracted Sentence from Document</span>
              </div>
              <p className="text-sm font-medium text-white italic border-l-2 border-brand-500 pl-3 py-1">
                "{whyModal.data.evidence_sentence}"
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
                <span>Source: <strong className="text-white">{whyModal.data.document_name}</strong></span>
                {whyModal.data.page_number && (
                  <span className="px-2 py-0.5 rounded-full bg-surface-3 border border-white/[0.08]">
                    Page {whyModal.data.page_number}
                  </span>
                )}
              </div>
            </div>

            {whyModal.data.confidence && (
              <div className="p-4 rounded-xl bg-surface-2 border border-white/[0.06]">
                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Confidence Assessment</p>
                <ConfidenceBar confidence={whyModal.data.confidence} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({ actions, onStatusChange, onDelete, onEdit, onWhy }: any) {
  return (
    <div className="space-y-2.5">
      {actions.map((action: any, i: number) => {
        const isUrgent = action.priority === 'urgent';
        const isHigh = action.priority === 'high';
        const isMedium = action.priority === 'medium';
        const overdue = isOverdue(action.due_date) && action.status !== 'completed';

        const priorityAccent = overdue
          ? 'border-l-4 border-l-rose-500 border-rose-500/30 bg-rose-500/5'
          : isUrgent
          ? 'border-l-4 border-l-pink-500 border-pink-500/20'
          : isHigh
          ? 'border-l-4 border-l-amber-500 border-amber-500/20'
          : isMedium
          ? 'border-l-4 border-l-cyan-500 border-cyan-500/20'
          : 'border-l-4 border-l-emerald-500 border-emerald-500/20';

        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className={`p-4 rounded-xl bg-surface-1/90 border border-white/[0.08] ${priorityAccent} shadow-sm hover:border-white/[0.18] transition-all group`}
          >
            <div className="flex items-start gap-3.5">
              {/* Checkbox button */}
              <button
                onClick={() => onStatusChange(action.id, action.status === 'completed' ? 'todo' : 'completed')}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                  action.status === 'completed'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 shadow-[0_0_10px_#39ff14]'
                    : 'border-white/30 hover:border-emerald-400'
                }`}
              >
                {action.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <p className={`text-sm font-bold text-white ${action.status === 'completed' ? 'line-through text-ink-subtle' : ''}`}>
                    {action.title}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={action.priority} />
                    <StatusBadge status={action.status} />
                  </div>
                </div>

                {action.description && (
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">{action.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2 border-t border-white/[0.04]">
                  {action.due_date && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${overdue ? 'text-rose-400 font-bold' : 'text-cyan-300'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {overdue ? '⚠️ Overdue: ' : 'Due '}{formatDate(action.due_date)}
                    </span>
                  )}
                  {action.assignee && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                      <User className="w-3.5 h-3.5 text-purple-400" />
                      {action.assignee}
                    </span>
                  )}
                  {action.source_document_name && (
                    <span className="text-xs text-brand-300 truncate max-w-44 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                      📄 {action.source_document_name}
                    </span>
                  )}
                  {action.confidence && (
                    <span className="text-xs font-mono font-bold text-neon-green">
                      AI: {Math.round(action.confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {action.is_ai_suggested && (
                  <button
                    onClick={() => onWhy(action)}
                    className="p-1.5 rounded-lg text-neon-cyan hover:bg-cyan-500/15 transition-colors cursor-pointer"
                    title="Why this action was extracted?"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(action)}
                  className="p-1.5 rounded-lg text-amber-300 hover:bg-amber-500/15 transition-colors cursor-pointer"
                  title="Edit Action"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(action.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  title="Delete Action"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Kanban View ───────────────────────────────────────────────────────────────
function KanbanView({ actions, onStatusChange, onDelete, onEdit, onWhy }: any) {
  return (
    <div className="grid md:grid-cols-3 gap-5">
      {STATUS_COLUMNS.map(({ key, label, border, headerBg, dot }) => {
        const col = actions.filter((a: any) => a.status === key);
        return (
          <div key={key} className={`p-4 rounded-2xl bg-surface-1/80 border ${border} flex flex-col min-h-[400px]`}>
            <div className={`p-2.5 rounded-xl border ${headerBg} flex items-center justify-between mb-4 shadow-sm`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-black/30 border border-white/[0.1]">
                {col.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {col.length === 0 ? (
                <div className="border-2 border-dashed border-white/[0.08] rounded-xl h-32 flex items-center justify-center text-xs text-ink-subtle">
                  No items in this stage
                </div>
              ) : col.map((action: any) => (
                <motion.div
                  key={action.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl bg-surface-2/90 border border-white/[0.08] hover:border-white/[0.2] transition-all space-y-2 group shadow-sm"
                >
                  <p className="text-xs font-bold text-white">{action.title}</p>
                  {action.description && (
                    <p className="text-[11px] text-ink-muted line-clamp-2">{action.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <PriorityBadge priority={action.priority} />
                    {action.due_date && (
                      <span className="text-[10px] text-ink-muted">
                        📅 {formatDate(action.due_date)}
                      </span>
                    )}
                  </div>
                  {action.assignee && (
                    <div className="flex items-center gap-1 text-[10px] text-purple-300">
                      <User className="w-3 h-3" /> {action.assignee}
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    {key !== 'completed' ? (
                      <button
                        onClick={() => onStatusChange(action.id, key === 'todo' ? 'in_progress' : 'completed')}
                        className="text-[11px] font-bold text-neon-cyan hover:text-white transition-colors"
                      >
                        → Move to {key === 'todo' ? 'In Progress' : 'Done'}
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-400">✓ Done</span>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(action)} className="text-ink-muted hover:text-amber-300 p-1">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(action.id)} className="text-ink-muted hover:text-rose-400 p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Deadline View ─────────────────────────────────────────────────────────────
function DeadlineView({ actions, onStatusChange, onDelete, onEdit, onWhy }: any) {
  return (
    <div className="space-y-6">
      {DEADLINE_GROUPS.map(({ key, label, badge, filter }) => {
        const grouped = actions.filter(filter);
        if (grouped.length === 0) return null;
        return (
          <div key={key} className="p-5 rounded-2xl bg-surface-1/90 border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${badge}`}>
                {label} ({grouped.length})
              </span>
            </div>
            <div className="space-y-2.5">
              {grouped.map((a: any) => (
                <div key={a.id} className="p-3.5 rounded-xl bg-surface-2/80 border border-white/[0.06] flex items-center gap-3.5">
                  <button
                    onClick={() => onStatusChange(a.id, 'completed')}
                    className="w-5 h-5 rounded-full border-2 border-white/20 hover:border-emerald-400 transition-colors shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{a.title}</p>
                    {a.assignee && <p className="text-[10px] text-ink-muted">{a.assignee}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={a.priority} />
                    {a.due_date && <span className="text-[10px] font-mono text-cyan-300">{formatDate(a.due_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
