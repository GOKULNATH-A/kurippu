import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Clock, AlertTriangle, Info, Trash2, Plus, Sparkles } from 'lucide-react';
import { remindersApi, usersApi } from '../lib/api';
import { formatDate, timeAgo } from '../lib/utils';
import { AppLayout } from '../components/AppLayout';
import { EmptyState, Modal } from '../components/ui';
import toast from 'react-hot-toast';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  info: { icon: <Info className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  reminder: { icon: <Clock className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  overdue: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
  success: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', message: '', remind_at: '' });
  const [tab, setTab] = useState<'reminders' | 'notifications'>('reminders');

  useEffect(() => {
    const load = async () => {
      try {
        const [remRes, notifRes] = await Promise.all([
          remindersApi.list(),
          usersApi.getNotifications(),
        ]);
        setReminders(remRes.data);
        setNotifications(notifRes.data);
      } catch { toast.error('Failed to load reminders'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!newReminder.title || !newReminder.remind_at) {
      toast.error('Title and date/time are required');
      return;
    }
    try {
      const res = await remindersApi.create(newReminder);
      setReminders(prev => [...prev, res.data]);
      setCreateModal(false);
      setNewReminder({ title: '', message: '', remind_at: '' });
      toast.success('Reminder created!');
    } catch { toast.error('Failed to create reminder'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await remindersApi.delete(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Reminder removed');
    } catch { toast.error('Delete failed'); }
  };

  const markRead = async (id: string) => {
    await usersApi.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-amber/10 rounded-full blur-[100px]" />
      </div>

      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-neon-amber animate-pulse" /> Alerts & Notifications
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Reminders & Alerts
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Automated document alerts and scheduled task notifications.
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-[0_0_20px_rgba(124,58,255,0.4)]"
        >
          <Plus className="w-4 h-4" /> Add Reminder
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-surface-1 border border-white/[0.08] mb-6 w-fit">
        {[
          { key: 'reminders', label: `Reminders (${reminders.length})`, color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_12px_rgba(255,215,0,0.3)]' },
          { key: 'notifications', label: `Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`, color: 'bg-gradient-to-r from-brand-600 to-pink-600 text-white shadow-[0_0_12px_rgba(124,58,255,0.3)]' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === key
                ? color
                : 'text-ink-muted hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'reminders' ? (
        loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : reminders.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8 text-neon-amber" />}
            title="No reminders scheduled"
            description="Create custom reminders so you never miss high-priority deadlines."
            action={
              <button onClick={() => setCreateModal(true)} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Add Reminder
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {reminders.map((r: any, i: number) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`p-4 rounded-2xl bg-surface-1/90 border border-amber-500/20 hover:border-amber-500/50 flex items-start gap-4 group transition-all shadow-sm ${r.is_sent ? 'opacity-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,215,0,0.2)]">
                  <Clock className="w-5 h-5 text-neon-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{r.title}</p>
                  {r.message && <p className="text-xs text-ink-muted mt-0.5">{r.message}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      ⏰ {r.remind_at.slice(0, 10)} {r.remind_at.length > 10 ? 'at ' + r.remind_at.slice(11, 16) : ''}
                    </span>
                    {r.is_sent && (
                      <span className="text-[10px] font-bold text-emerald-400">✓ Sent</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 rounded-lg text-ink-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        /* Notifications Tab */
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-8 h-8 text-brand-400" />}
              title="No notifications"
              description="Notifications generated by document processing and action extraction will appear here."
            />
          ) : notifications.map((n: any, i: number) => {
            const cfg = typeConfig[n.type] ?? typeConfig.info;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`p-4 rounded-2xl bg-surface-1/90 border ${cfg.border} flex items-start gap-4 cursor-pointer transition-all shadow-sm ${
                  n.is_read ? 'opacity-60' : 'hover:border-white/[0.2]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white">{n.title}</p>
                    {!n.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan shadow-[0_0_8px_#00e5ff] shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] font-mono text-ink-subtle mt-2">{timeAgo(n.created_at)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Reminder Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Reminder">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Reminder Title *</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-sm text-white focus:outline-none focus:border-neon-amber"
              placeholder="e.g. Review updated proposal"
              value={newReminder.title}
              onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Message / Context</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-sm text-white focus:outline-none focus:border-neon-amber h-20 resize-none"
              placeholder="Add details…"
              value={newReminder.message}
              onChange={e => setNewReminder({ ...newReminder, message: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Remind At *</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-amber"
              value={newReminder.remind_at}
              onChange={e => setNewReminder({ ...newReminder, remind_at: e.target.value })}
            />
          </div>
          <button
            onClick={handleCreate}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all cursor-pointer"
          >
            Create Reminder
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
