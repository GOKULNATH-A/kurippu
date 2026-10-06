import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, FileText, Sparkles, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { analyticsApi } from '../lib/api';
import { AppLayout } from '../components/AppLayout';
import { SkeletonList } from '../components/ui';
import toast from 'react-hot-toast';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ff2d92', // neon pink
  high: '#ff6b35',   // neon orange
  medium: '#ffd700', // neon amber
  low: '#7c3aff',    // electric violet
};

const STATUS_COLORS: Record<string, string> = {
  todo: '#ffd700',       // neon amber
  in_progress: '#00e5ff',// neon cyan
  completed: '#39ff14',  // neon green
  cancelled: '#6b7280',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-2 border border-white/[0.15] rounded-xl p-3 shadow-2xl backdrop-blur-md">
        <p className="text-xs font-bold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs font-mono font-bold" style={{ color: p.color || p.fill }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.get()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const priorityChartData = data ? Object.entries(data.priority_distribution).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    value: v as number,
    color: PRIORITY_COLORS[k] || '#7c3aff',
  })).filter(d => d.value > 0) : [];

  const statusChartData = data ? Object.entries(data.actions_by_status).map(([k, v]) => ({
    name: k === 'in_progress' ? 'In Progress' : k.charAt(0).toUpperCase() + k.slice(1),
    value: v as number,
    color: STATUS_COLORS[k] || '#7c3aff',
  })).filter(d => d.value > 0) : [];

  const summaryCards = data ? [
    {
      label: 'Total Documents',
      value: data.total_documents,
      icon: FileText,
      gradient: 'from-cyan-500/20 to-blue-600/10',
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]',
      textColor: 'text-cyan-300'
    },
    {
      label: 'Actions Extracted',
      value: data.total_actions,
      icon: CheckCircle2,
      gradient: 'from-emerald-500/20 to-teal-600/10',
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(57,255,20,0.4)]',
      textColor: 'text-emerald-300'
    },
    {
      label: 'Completion Velocity',
      value: `${data.completion_rate}%`,
      icon: TrendingUp,
      gradient: 'from-brand-600/20 to-pink-600/10',
      border: 'border-brand-500/30',
      iconBg: 'bg-brand-500/20 text-brand-300 shadow-[0_0_15px_rgba(124,58,255,0.4)]',
      textColor: 'text-brand-300'
    },
    {
      label: 'Overdue Actions',
      value: data.overdue_actions,
      icon: AlertTriangle,
      gradient: 'from-rose-500/20 to-pink-600/10',
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(255,45,146,0.4)]',
      textColor: 'text-rose-300'
    },
  ] : [];

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-1/3 w-96 h-96 bg-brand-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[100px]" />
      </div>

      <div className="page-header flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <Sparkles className="w-3 h-3 text-neon-amber animate-pulse" /> Analytics & Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Performance Metrics
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Real-time insights into extraction rates, action velocity, and document throughput.
          </p>
        </div>
      </div>

      {loading ? <SkeletonList count={4} /> : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map(({ label, value, icon: Icon, gradient, border, iconBg, textColor }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-5 rounded-2xl bg-surface-1/90 backdrop-blur-sm border ${border} relative overflow-hidden shadow-lg`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className={`text-3xl font-extrabold font-mono tracking-tight ${textColor}`}>
                    {value}
                  </p>
                  <p className="text-xs font-semibold text-ink-muted mt-1 uppercase tracking-wide">
                    {label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Completion Progress Banner */}
          {data && data.total_actions > 0 && (
            <div className="p-6 rounded-3xl bg-surface-1/90 border border-white/[0.08] relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-pink" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neon-cyan" />
                    Overall Action Completion Progress
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {data.completed_actions} resolved out of {data.total_actions} total detected actions
                  </p>
                </div>
                <span className="text-2xl font-black font-mono text-neon-green drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
                  {data.completion_rate}%
                </span>
              </div>

              <div className="h-3.5 bg-surface-3 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.completion_rate}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-green rounded-full shadow-[0_0_12px_rgba(57,255,20,0.6)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/[0.06]">
                <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xl font-mono font-bold text-emerald-300">{data.completed_actions}</p>
                  <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mt-0.5">Completed</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xl font-mono font-bold text-amber-300">{data.pending_actions}</p>
                  <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mt-0.5">Pending</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xl font-mono font-bold text-rose-300">{data.overdue_actions}</p>
                  <p className="text-xs font-semibold text-rose-400/80 uppercase tracking-wider mt-0.5">Overdue</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Priority Distribution Pie */}
            {priorityChartData.length > 0 && (
              <div className="p-6 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-pink" /> Actions by Priority
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-full sm:w-1/2 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={72}
                          dataKey="value"
                          paddingAngle={4}
                        >
                          {priorityChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full sm:w-1/2 space-y-2.5">
                    {priorityChartData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-2/60 border border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                          <span className="font-semibold text-white">{d.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Status Distribution */}
            {statusChartData.length > 0 && (
              <div className="p-6 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-cyan" /> Actions by Status
                </h2>
                <div className="space-y-4">
                  {statusChartData.map(d => {
                    const pct = data.total_actions > 0 ? Math.round((d.value / data.total_actions) * 100) : 0;
                    return (
                      <div key={d.name} className="p-2.5 rounded-xl bg-surface-2/50 border border-white/[0.04]">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <span className="text-white">{d.name}</span>
                          <span className="font-mono text-ink-muted">{d.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: d.color, boxShadow: `0 0 8px ${d.color}66` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
