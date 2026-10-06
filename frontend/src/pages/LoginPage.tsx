import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, CheckCircle } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { access_token, user } = res.data;
      setAuth(user, access_token);
      navigate('/dashboard');
      toast.success(`Welcome back, ${user.name}!`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      const res = await authApi.demoLogin();
      const { access_token, user } = res.data;
      setAuth(user, access_token);
      navigate('/dashboard');
      toast.success('Demo account loaded!');
    } catch {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url('/bg.png')` }}
      />
      <div
        className="fixed inset-0 pointer-events-none -z-15"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(12, 12, 24, 0.78) 0%, rgba(8, 8, 14, 0.90) 100%)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Dynamic ambient multi-color backdrop orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-neon-cyan/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-neon-pink/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,255,0.6)] mb-3">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            KURIPPU <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">AI</span>
          </h2>
          <p className="text-xs text-ink-muted mt-1 font-medium">Turn documents into actions instantly</p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-surface-1/90 border border-white/[0.12] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Top Rainbow Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-brand-500 via-pink-500 to-amber-400" />

          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-white">Welcome back</h1>
            <p className="text-xs text-ink-muted mt-1">Sign in to manage your AI workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className={`w-full px-4 py-2.5 rounded-xl bg-surface-2/80 border text-sm text-white placeholder-ink-subtle focus:outline-none transition-all ${
                  errors.email
                    ? 'border-rose-500/60 focus:border-rose-400 focus:shadow-[0_0_15px_rgba(255,45,146,0.3)]'
                    : 'border-white/[0.1] focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                }`}
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`w-full px-4 py-2.5 rounded-xl bg-surface-2/80 border text-sm text-white placeholder-ink-subtle pr-10 focus:outline-none transition-all ${
                    errors.password
                      ? 'border-rose-500/60 focus:border-rose-400 focus:shadow-[0_0_15px_rgba(255,45,146,0.3)]'
                      : 'border-white/[0.1] focus:border-brand-400 focus:shadow-[0_0_15px_rgba(124,58,255,0.25)]'
                  }`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 via-pink-600 to-brand-600 hover:from-brand-500 hover:to-pink-500 transition-all shadow-[0_0_25px_rgba(124,58,255,0.45)] hover:shadow-[0_0_35px_rgba(255,45,146,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs uppercase font-bold text-ink-subtle tracking-wider">or instant preview</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,215,0,0.15)] group cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-neon-amber group-hover:rotate-12 transition-transform" />
            <span>Load Demo Account (One-Click)</span>
          </button>

          <p className="text-center text-xs text-ink-muted mt-6">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              Create an account →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
