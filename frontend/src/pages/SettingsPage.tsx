import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Lock, Bell, BrainCircuit, Shield, Download,
  Trash2, Save, Sparkles, CheckCircle2
} from 'lucide-react';
import { usersApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { AppLayout } from '../components/AppLayout';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  { key: 'profile', label: 'User Profile', icon: User, color: 'text-brand-300', activeBg: 'bg-brand-600/20 border-brand-500/40 text-white shadow-[0_0_15px_rgba(124,58,255,0.3)]' },
  { key: 'ai', label: 'AI Intelligence', icon: BrainCircuit, color: 'text-neon-cyan', activeBg: 'bg-cyan-500/20 border-cyan-500/40 text-white shadow-[0_0_15px_rgba(0,229,255,0.3)]' },
  { key: 'notifications', label: 'Notifications', icon: Bell, color: 'text-neon-green', activeBg: 'bg-emerald-500/20 border-emerald-500/40 text-white shadow-[0_0_15px_rgba(57,255,20,0.3)]' },
  { key: 'privacy', label: 'Privacy & Data', icon: Shield, color: 'text-neon-pink', activeBg: 'bg-pink-500/20 border-pink-500/40 text-white shadow-[0_0_15px_rgba(255,45,146,0.3)]' },
];

export default function SettingsPage() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: user?.name ?? '', notification_enabled: true });
  const [aiSettings, setAiSettings] = useState({ ai_provider: 'openai', ai_model: 'gpt-4o-mini' });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(p => ({ ...p, name: user.name }));
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await usersApi.updateProfile(profile);
      setAuth(res.data, localStorage.getItem('kurippu_token') ?? '');
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const saveAI = async () => {
    setSaving(true);
    try {
      await usersApi.updateProfile(aiSettings);
      toast.success('AI settings saved!');
    } catch { toast.error('Failed to save AI settings'); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await usersApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kurippu-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch { toast.error('Export failed'); }
    finally { setExportLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('This will permanently delete your account and all stored documents, actions, and events. Continue?')) return;
    try {
      await usersApi.deleteAccount();
      clearAuth();
      navigate('/');
      toast.success('Account permanently deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <AppLayout>
      {/* Background ambient neon glow spots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-pink/10 rounded-full blur-[100px]" />
      </div>

      <div className="page-header flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <Sparkles className="w-3 h-3 text-neon-amber animate-pulse" /> Workspace Preferences
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Account & System Settings
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Configure your AI extraction models, profile details, and alerts.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {SECTIONS.map(({ key, label, icon: Icon, color, activeBg }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                activeSection === key
                  ? activeBg
                  : 'bg-surface-1/60 border-white/[0.06] text-ink-muted hover:text-white hover:bg-surface-2'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-3xl bg-surface-1/90 border border-white/[0.08] shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-brand-500 to-neon-pink" />

            {activeSection === 'profile' && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Profile Information</h2>

                {/* Avatar Banner */}
                <div className="flex items-center gap-4 pb-5 border-b border-white/[0.06]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-pink-600 border border-brand-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,255,0.4)]">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">{user?.name}</p>
                    <p className="text-xs text-ink-muted">{user?.email}</p>
                    {user?.is_demo && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-1">
                        ✦ Demo Account Active
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Display Name</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-sm text-white focus:outline-none focus:border-neon-cyan"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Registered Email</label>
                  <input className="w-full px-4 py-2.5 rounded-xl bg-surface-2/40 border border-white/[0.06] text-sm text-ink-muted cursor-not-allowed" value={user?.email} disabled />
                  <p className="text-[11px] text-ink-subtle mt-1">Email is locked to your account identifier.</p>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save Profile Changes'}
                </button>
              </div>
            )}

            {activeSection === 'ai' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-white">AI Intelligence Configuration</h2>
                  <p className="text-xs text-ink-muted mt-1">
                    Kurippu extracts action items using multi-stage NLP & LLM pipelines.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-xs font-bold text-cyan-300 mb-1">Active Extraction Engine</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_#00e5ff]" />
                    <p className="text-sm font-bold text-white">OpenAI Engine (gpt-4o-mini)</p>
                  </div>
                  <p className="text-[11px] text-cyan-200/70 mt-1">Configured securely via environment variables on the backend.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Preferred AI Provider</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-neon-cyan"
                    value={aiSettings.ai_provider}
                    onChange={e => setAiSettings({ ...aiSettings, ai_provider: e.target.value })}
                  >
                    <option value="openai">OpenAI (GPT-4o-mini, GPT-4o)</option>
                    <option value="gemini">Google Gemini (1.5 Flash, Pro)</option>
                    <option value="mock">Heuristic / Rule-based (Fast local)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">Model Identifier</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-neon-cyan"
                    value={aiSettings.ai_model}
                    placeholder="e.g. gpt-4o-mini"
                    onChange={e => setAiSettings({ ...aiSettings, ai_model: e.target.value })}
                  />
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs text-neon-amber font-bold mb-1">🔒 Enterprise Security Note</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    API keys are stored exclusively in the backend <code className="bg-surface-3 px-1.5 py-0.5 rounded text-amber-300">.env</code> configuration and never transmitted to the browser.
                  </p>
                </div>

                <button
                  onClick={saveAI}
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save AI Settings'}
                </button>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Notification Preferences</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Document Analysis Complete', desc: 'Alert when AI finishes extracting actions from an uploaded document' },
                    { label: 'Deadline Reminders', desc: 'Notify 24 hours prior to scheduled action items' },
                    { label: 'Overdue Action Alerts', desc: 'Critical alerts when an item passes its deadline without resolution' },
                    { label: 'New Smart Suggestions', desc: 'Alert when high-confidence tasks are detected' },
                  ].map(({ label, desc }) => (
                    <div key={label} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2/70 border border-white/[0.06]">
                      <div>
                        <p className="text-xs font-bold text-white">{label}</p>
                        <p className="text-[11px] text-ink-muted">{desc}</p>
                      </div>
                      <button
                        onClick={() => setProfile(p => ({ ...p, notification_enabled: !p.notification_enabled }))}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          profile.notification_enabled ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-surface-3'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform absolute top-1 ${
                            profile.notification_enabled ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Privacy, Security & Data Ownership</h2>

                <div className="p-4 rounded-2xl bg-surface-2/70 border border-white/[0.08]">
                  <h3 className="text-xs font-bold text-white mb-1">Export Workspace Data</h3>
                  <p className="text-xs text-ink-muted mb-3">Download complete JSON records of your documents, actions, and calendar events.</p>
                  <button
                    onClick={handleExport}
                    disabled={exportLoading}
                    className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    {exportLoading ? 'Generating Export…' : 'Export Full JSON Archive'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <h3 className="text-xs font-bold text-rose-400 mb-1">Permanent Account Deletion</h3>
                  <p className="text-xs text-ink-muted mb-3">
                    Permanently delete your profile and purge all uploaded files, action items, and notes. This cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/30 transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Account Permanently
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-surface-2/60 border border-white/[0.06]">
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Data Privacy Highlights</p>
                  <ul className="space-y-2 text-xs text-ink-muted">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Encrypted multi-tenant data storage with user-scoped isolation.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Zero third-party training on your proprietary corporate documents.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
