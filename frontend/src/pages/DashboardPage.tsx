import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, CheckSquare, Clock, TrendingUp,
  Upload, Plus, Search, Calendar, AlertTriangle,
  ArrowRight, Zap, ChevronRight, Sparkles, FolderOpen
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { documentsApi, actionsApi, analyticsApi } from '../lib/api';
import { formatDate, formatFileSize, getGreeting, isOverdue } from '../lib/utils';
import { SkeletonList, DocStatusBadge, PriorityBadge } from '../components/ui';
import { AppLayout } from '../components/AppLayout';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [analyticsRes, docsRes, actionsRes] = await Promise.all([
          analyticsApi.get(),
          documentsApi.list({ page: 1, page_size: 5 }),
          actionsApi.list(),
        ]);
        setAnalytics(analyticsRes.data);
        setRecentDocs(docsRes.data.documents);
        setActions(actionsRes.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayActions = actions.filter(a =>
    a.due_date === new Date().toISOString().split('T')[0] && a.status !== 'completed'
  );
  const priorityActions = actions.filter(a =>
    ['urgent', 'high'].includes(a.priority) && a.status !== 'completed'
  ).slice(0, 5);
  const overdueActions = actions.filter(a => isOverdue(a.due_date) && a.status !== 'completed');

  const stats = [
    {
      label: 'Total Documents',
      value: analytics?.total_documents ?? 0,
      icon: FileText,
      gradient: 'from-cyan-500/20 to-blue-600/10',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      iconBg: 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]',
      textColor: 'text-cyan-300',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
      tag: 'Library'
    },
    {
      label: 'Actions Extracted',
      value: analytics?.total_actions ?? 0,
      icon: CheckSquare,
      gradient: 'from-emerald-500/20 to-teal-600/10',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      iconBg: 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(57,255,20,0.4)]',
      textColor: 'text-emerald-300',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      tag: 'Tasks'
    },
    {
      label: 'Pending Tasks',
      value: analytics?.pending_actions ?? 0,
      icon: Clock,
      gradient: 'from-amber-500/20 to-orange-600/10',
      border: 'border-amber-500/40 hover:border-amber-400',
      iconBg: 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(255,215,0,0.4)]',
      textColor: 'text-amber-300',
      badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      tag: 'To Do'
    },
    {
      label: 'Overdue Items',
      value: analytics?.overdue_actions ?? 0,
      icon: AlertTriangle,
      gradient: 'from-rose-500/20 to-pink-600/10',
      border: 'border-rose-500/40 hover:border-rose-400',
      iconBg: 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(255,45,146,0.4)]',
      textColor: 'text-rose-300',
      badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      tag: 'Urgent'
    },
  ];

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-60 left-1/3 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-neon-pink/10 rounded-full blur-[130px]" />
      </div>

      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-brand-500/20 via-pink-500/20 to-cyan-500/20 border border-brand-500/30 text-white shadow-[0_0_12px_rgba(124,58,255,0.3)]">
              <Sparkles className="w-3 h-3 text-neon-amber animate-pulse" /> AI-Powered Action Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>{getGreeting()},</span>
            <span className="gradient-rainbow">
              {user?.name?.split(' ')[0]} 👋
            </span>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Transforming your unstructured documents into prioritized, smart action items.
          </p>
        </div>
        <button
          onClick={() => navigate('/documents')}
          className="btn-primary group flex items-center gap-2 px-5 py-2.5 shadow-[0_0_25px_rgba(124,58,255,0.4)]"
        >
          <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Completion Rate Banner with vibrant gradient */}
      {!loading && analytics && analytics.total_actions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 rounded-2xl relative overflow-hidden bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 border border-white/[0.1] shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-pink" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,255,0.5)]">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  Action Item Completion Velocity
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  <span className="font-semibold text-emerald-400">{analytics.completed_actions}</span> completed of{' '}
                  <span className="font-semibold text-white">{analytics.total_actions}</span> total actions extracted
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:w-48 h-3 bg-surface-3 rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analytics.completion_rate}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-green shadow-[0_0_10px_rgba(57,255,20,0.5)]"
                />
              </div>
              <span className="text-base font-extrabold font-mono text-neon-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                {analytics.completion_rate}%
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid - Vivid Multi-Color Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
          : stats.map(({ label, value, icon: Icon, gradient, border, iconBg, textColor, badgeColor, tag }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className={`p-5 rounded-2xl bg-surface-1/90 backdrop-blur-sm border ${border} transition-all duration-300 relative overflow-hidden shadow-lg`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />
              
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
                  {tag}
                </span>
              </div>

              <div className="relative z-10">
                <p className={`text-3xl font-extrabold font-mono tracking-tight ${textColor} drop-shadow-sm`}>
                  {value}
                </p>
                <p className="text-xs font-semibold text-ink-muted mt-1 uppercase tracking-wide">
                  {label}
                </p>
              </div>
            </motion.div>
          ))
        }
      </div>

      {/* Quick Actions - Multi-Color Cards */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-neon-amber" />
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Upload Document',
              icon: Upload,
              to: '/documents',
              color: 'text-neon-pink',
              bgHover: 'hover:border-neon-pink/50 hover:bg-pink-500/10',
              iconBox: 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
            },
            {
              label: 'Create Action',
              icon: Plus,
              to: '/actions',
              color: 'text-neon-green',
              bgHover: 'hover:border-neon-green/50 hover:bg-emerald-500/10',
              iconBox: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            },
            {
              label: 'Smart Search',
              icon: Search,
              to: '/search',
              color: 'text-neon-amber',
              bgHover: 'hover:border-neon-amber/50 hover:bg-amber-500/10',
              iconBox: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            },
            {
              label: 'Action Calendar',
              icon: Calendar,
              to: '/calendar',
              color: 'text-neon-cyan',
              bgHover: 'hover:border-neon-cyan/50 hover:bg-cyan-500/10',
              iconBox: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            },
          ].map(({ label, icon: Icon, to, color, bgHover, iconBox }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`p-4 rounded-xl bg-surface-1 border border-white/[0.08] flex items-center gap-3.5 ${bgHover} transition-all duration-200 text-left group`}
            >
              <div className={`w-9 h-9 rounded-lg ${iconBox} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white group-hover:text-white transition-colors">{label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-ink-subtle ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Actions */}
        <div className="p-5 rounded-2xl bg-surface-1/80 border border-brand-500/20 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_#00e5ff]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">Due Today</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {todayActions.length}
              </span>
            </div>
            <button onClick={() => navigate('/actions')} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? <SkeletonList count={2} /> : todayActions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-surface-2/40 border border-white/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                ✓
              </div>
              <p className="text-sm font-semibold text-white">All clear for today!</p>
              <p className="text-xs text-ink-muted mt-1">No pending actions scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayActions.map(a => (
                <ActionCard key={a.id} action={a} navigate={navigate} />
              ))}
            </div>
          )}
        </div>

        {/* Priority Actions */}
        <div className="p-5 rounded-2xl bg-surface-1/80 border border-amber-500/20 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-amber animate-pulse shadow-[0_0_8px_#ffd700]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">High Priority</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {priorityActions.length}
              </span>
            </div>
            <button onClick={() => navigate('/actions')} className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? <SkeletonList count={3} /> : priorityActions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-surface-2/40 border border-white/[0.04]">
              <p className="text-sm font-semibold text-white">No urgent actions pending</p>
              <p className="text-xs text-ink-muted mt-1">Your high-priority tasks are in good shape.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {priorityActions.map(a => (
                <ActionCard key={a.id} action={a} navigate={navigate} />
              ))}
            </div>
          )}
        </div>

        {/* Overdue Items Alert */}
        {overdueActions.length > 0 && (
          <div className="p-5 rounded-2xl bg-surface-1/80 border border-rose-500/30 backdrop-blur-sm shadow-[0_0_20px_rgba(255,45,146,0.15)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-500/20">
              <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-neon-pink animate-bounce" />
                Overdue Actions ({overdueActions.length})
              </h2>
              <button onClick={() => navigate('/actions')} className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1">
                Resolve all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              {overdueActions.slice(0, 3).map(a => (
                <ActionCard key={a.id} action={a} navigate={navigate} overdue />
              ))}
            </div>
          </div>
        )}

        {/* Recent Documents */}
        <div className={`p-5 rounded-2xl bg-surface-1/80 border border-purple-500/20 backdrop-blur-sm shadow-md ${overdueActions.length === 0 ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">Recent Documents</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {recentDocs.length}
              </span>
            </div>
            <button onClick={() => navigate('/documents')} className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? <SkeletonList count={3} /> : recentDocs.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-surface-2/40 border border-white/[0.04]">
              <FileText className="w-10 h-10 text-purple-400/50 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white mb-1">No documents uploaded yet</p>
              <p className="text-xs text-ink-muted mb-4">Upload a document to extract actionable items automatically</p>
              <button onClick={() => navigate('/documents')} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload Document
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {recentDocs.map(doc => {
                const isPdf = doc.mime_type?.includes('pdf') || doc.original_filename?.endsWith('.pdf');
                const isImg = doc.mime_type?.includes('image');
                const iconColor = isPdf ? 'text-rose-400 bg-rose-500/15 border-rose-500/30' :
                                  isImg ? 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' :
                                          'text-purple-400 bg-purple-500/15 border-purple-500/30';
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="p-3.5 rounded-xl bg-surface-2/70 border border-white/[0.08] hover:border-brand-500/40 hover:bg-surface-2 transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className={`w-9 h-9 rounded-lg border ${iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {doc.original_filename}
                      </p>
                      <p className="text-[10px] text-ink-muted mt-0.5">
                        {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                    <DocStatusBadge status={doc.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ActionCard({ action, navigate, overdue = false }: any) {
  const isUrgent = action.priority === 'urgent';
  const isHigh = action.priority === 'high';
  const isMedium = action.priority === 'medium';

  const borderTheme = overdue
    ? 'border-rose-500/40 bg-rose-500/10 hover:border-rose-400'
    : isUrgent
    ? 'border-pink-500/30 bg-surface-2/60 hover:border-pink-500/60'
    : isHigh
    ? 'border-amber-500/30 bg-surface-2/60 hover:border-amber-500/60'
    : isMedium
    ? 'border-cyan-500/30 bg-surface-2/60 hover:border-cyan-500/60'
    : 'border-white/[0.08] bg-surface-2/40 hover:border-emerald-500/40';

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      onClick={() => navigate('/actions')}
      className={`p-3.5 rounded-xl border ${borderTheme} cursor-pointer transition-all duration-200 group`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`priority-dot-${action.priority} shrink-0`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
              {action.title}
            </p>
            {action.due_date && (
              <p className={`text-[10px] font-medium mt-0.5 ${overdue ? 'text-rose-400 font-bold' : 'text-ink-muted'}`}>
                {overdue ? '⚠️ Overdue · ' : '📅 '}{formatDate(action.due_date)}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <PriorityBadge priority={action.priority} />
        </div>
      </div>
    </motion.div>
  );
}
