import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, FileText, CheckSquare, Calendar, BrainCircuit, Shield, Users, Star, Play } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const features = [
  { icon: BrainCircuit, title: 'AI Extraction',       desc: 'GPT-powered analysis finds deadlines, tasks, and responsibilities buried in your documents.',   color: '#7c3aff', bg: 'rgba(124,58,255,0.12)',  border: 'rgba(124,58,255,0.3)'  },
  { icon: CheckSquare,  title: 'Human-in-the-Loop',   desc: 'AI suggests — you decide. Review every extracted action before it becomes a task.',              color: '#ff2d92', bg: 'rgba(255,45,146,0.12)', border: 'rgba(255,45,146,0.3)' },
  { icon: Calendar,     title: 'Smart Calendar',       desc: 'All your deadlines and meetings auto-populate into an intelligent calendar view.',               color: '#ff6b35', bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.3)' },
  { icon: Shield,       title: 'Privacy First',        desc: 'Documents are processed securely. Delete your data anytime, completely.',                        color: '#00e5ff', bg: 'rgba(0,229,255,0.12)',  border: 'rgba(0,229,255,0.3)'  },
  { icon: Users,        title: 'Assign & Collaborate', desc: 'Tag assignees from your documents and create accountability for each task.',                     color: '#39ff14', bg: 'rgba(57,255,20,0.1)',   border: 'rgba(57,255,20,0.25)' },
  { icon: Star,         title: 'Confidence Scoring',   desc: 'Every extracted insight is rated by AI confidence. Low scores trigger human review.',           color: '#ffd700', bg: 'rgba(255,215,0,0.12)',  border: 'rgba(255,215,0,0.3)'  },
];

const supportedDocs = ['PDF', 'DOCX', 'TXT', 'Images', 'Meeting Notes', 'Assignments', 'Agreements', 'Circulars', 'Bills', 'Notices'];
const docColors = ['#7c3aff','#ff2d92','#00e5ff','#39ff14','#ffd700','#ff6b35','#7c3aff','#ff2d92','#00e5ff','#ffd700'];

const steps = [
  { step: '01', title: 'Upload',  desc: 'Drop any PDF, DOCX, TXT, or image. We support all common document formats.',        icon: '📄', color: '#7c3aff', bg: 'rgba(124,58,255,0.1)'  },
  { step: '02', title: 'Analyze', desc: 'AI reads your document and identifies actions, deadlines, people, and decisions.',   icon: '🧠', color: '#ff2d92', bg: 'rgba(255,45,146,0.1)' },
  { step: '03', title: 'Confirm', desc: 'Review AI suggestions. Choose which to create as tasks. Stay in control.',           icon: '✅', color: '#39ff14', bg: 'rgba(57,255,20,0.08)' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await authApi.demoLogin();
      const { access_token, user } = res.data;
      setAuth(user, access_token);
      navigate('/dashboard');
      toast.success(`Welcome, ${user.name}! Demo loaded.`);
    } catch {
      toast.error('Demo login failed. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-ink overflow-x-hidden relative">
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url('/bg.png')` }}
      />
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(12, 12, 24, 0.78) 0%, rgba(8, 8, 14, 0.90) 100%)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
             style={{ background: 'rgba(124,58,255,0.08)' }} />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full blur-3xl"
             style={{ background: 'rgba(255,45,146,0.06)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl"
             style={{ background: 'rgba(0,229,255,0.05)' }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50"
           style={{ background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center neon-pulse"
                 style={{ background: 'linear-gradient(135deg, #7c3aff, #ff2d92)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-base text-gradient-brand">Kurippu</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-36 pb-24 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {/* Rainbow pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
               style={{
                 background: 'linear-gradient(135deg, rgba(124,58,255,0.2), rgba(255,45,146,0.15), rgba(0,229,255,0.12))',
                 border: '1px solid rgba(124,58,255,0.4)',
                 color: '#c0a8ff',
               }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7c3aff' }} />
            Intelligent Document Processing
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            Turn Documents
            <br />
            <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #7c3aff, #ff2d92, #ff6b35, #ffd700)', WebkitBackgroundClip: 'text' }}>
              Into Actions
            </span>
          </h1>

          <p className="text-lg text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload any document. Kurippu finds what matters — deadlines, tasks, responsibilities —
            and turns them into actionable cards your team can act on.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary px-7 py-3.5 text-sm">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={handleDemo} disabled={demoLoading} className="btn-secondary px-7 py-3.5 text-sm">
              <Play className="w-4 h-4" />
              {demoLoading ? 'Loading Demo…' : 'Try Live Demo'}
            </button>
          </div>
        </motion.div>

        {/* Hero Cards Preview */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="mt-20 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left"
        >
          {/* Document */}
          <div className="card p-6"
               style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(124,58,255,0.2)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                   style={{ background: 'rgba(124,58,255,0.15)', border: '1px solid rgba(124,58,255,0.3)' }}>
                <FileText className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <span className="text-xs text-ink-muted font-mono">College_Project_Guidelines.pdf</span>
            </div>
            <div className="space-y-3 text-xs text-ink-muted font-mono leading-relaxed">
              <p>"Project submission deadline: <span style={{ color: '#ffd700', fontWeight: 700 }}>October 15</span>"</p>
              <p>"<span style={{ color: '#7c3aff', fontWeight: 700 }}>Sakthi</span> is responsible for the presentation"</p>
              <p>"Meeting on <span style={{ color: '#39ff14', fontWeight: 700 }}>Oct 10 at 3 PM</span>"</p>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-6 space-y-3"
               style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(0,229,255,0.15)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00e5ff' }} />
              <p className="text-xs font-bold text-cyan-400">✦ Kurippu detected 3 actions</p>
            </div>
            {[
              { title: 'Submit Project Report', due: 'Oct 15', p: 'urgent', c: '#ff2d92' },
              { title: 'Prepare Presentation',  due: 'Oct 10', p: 'high',   c: '#ff6b35' },
              { title: 'Team Review Meeting',   due: 'Oct 10 · 3PM', p: 'medium', c: '#ffd700' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.15 }}
                          className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-ink">{item.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: `${item.c}20`, color: item.c, border: `1px solid ${item.c}40` }}>
                    {item.p}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-ink-subtle">
                  <span>📅 {item.due}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-3">
              How <span className="text-gradient-brand">Kurippu</span> Works
            </h2>
            <p className="text-ink-muted">Three simple steps to transform documents into actionable tasks</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ step, title, desc, icon, color, bg }, idx) => (
              <motion.div key={step} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                          className="card p-6 hover:-translate-y-1 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5"
                     style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <div className="text-4xl mb-5">{icon}</div>
                <span className="text-xs font-mono font-bold" style={{ color }}>Step {step}</span>
                <h3 className="text-lg font-bold mt-1.5 mb-2.5 text-ink">{title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Docs */}
      <section className="relative z-10 py-20 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-3">Supports <span className="text-gradient-cool">Any Document</span> Type</h2>
          <p className="text-ink-muted mb-10 text-sm">From PDFs to hand-written notice images</p>
          <div className="flex flex-wrap justify-center gap-3">
            {supportedDocs.map((doc, i) => (
              <motion.span key={doc} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                           viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                           className="px-4 py-2 rounded-full text-xs font-bold"
                           style={{
                             background: `${docColors[i]}14`,
                             border: `1px solid ${docColors[i]}30`,
                             color: docColors[i],
                           }}>
                {doc}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-3">Everything You Need</h2>
            <p className="text-ink-muted">Built for teams and individuals who deal with document-heavy workflows</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color, bg, border }, idx) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }} transition={{ delay: idx * 0.08 }}
                          className="card p-5 hover:-translate-y-1 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5"
                     style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                     style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="text-sm font-bold mb-2 text-ink">{title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-12 relative overflow-hidden"
               style={{ border: '1px solid rgba(124,58,255,0.25)', background: 'rgba(15,15,26,0.95)' }}>
            {/* Corner orbs */}
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full blur-3xl"
                 style={{ background: 'rgba(124,58,255,0.15)' }} />
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl"
                 style={{ background: 'rgba(255,45,146,0.12)' }} />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 neon-pulse"
                   style={{ background: 'linear-gradient(135deg, #7c3aff, #ff2d92)' }}>
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-black mb-3">Ready to start?</h2>
              <p className="text-ink-muted mb-8 text-sm leading-relaxed">
                Stop losing important information in documents. Let Kurippu turn every document into clear, trackable actions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-primary px-7 py-3.5">
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={handleDemo} disabled={demoLoading} className="btn-secondary px-7 py-3.5">
                  <Play className="w-4 h-4" />
                  {demoLoading ? 'Loading…' : 'Live Demo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #7c3aff, #ff2d92)' }}>
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-black text-sm text-gradient-brand">Kurippu</span>
            <span className="text-ink-subtle text-xs">— Turn Documents into Actions</span>
          </div>
          <p className="text-xs text-ink-subtle">Built with precision. Designed for clarity.</p>
        </div>
      </footer>
    </div>
  );
}
