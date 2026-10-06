import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CheckSquare, Calendar,
  Bell, Search, BarChart3, Settings, LogOut,
  Zap, User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  color: 'text-brand-400', bg: 'rgba(124,58,255,0.15)',  border: 'rgba(124,58,255,0.3)' },
  { to: '/documents', icon: FileText,        label: 'Documents',  color: 'text-cyan-400',  bg: 'rgba(0,229,255,0.12)',   border: 'rgba(0,229,255,0.3)'  },
  { to: '/actions',   icon: CheckSquare,     label: 'Actions',    color: 'text-pink-400',  bg: 'rgba(255,45,146,0.12)',  border: 'rgba(255,45,146,0.3)' },
  { to: '/calendar',  icon: Calendar,        label: 'Calendar',   color: 'text-orange-400',bg: 'rgba(255,107,53,0.12)',  border: 'rgba(255,107,53,0.3)' },
  { to: '/reminders', icon: Bell,            label: 'Reminders',  color: 'text-gold-400',  bg: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.3)'  },
  { to: '/search',    icon: Search,          label: 'Search',     color: 'text-lime-400',  bg: 'rgba(57,255,20,0.1)',    border: 'rgba(57,255,20,0.25)' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics',  color: 'text-brand-400', bg: 'rgba(124,58,255,0.15)', border: 'rgba(124,58,255,0.3)' },
];

export function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/');
  };

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col w-64 shrink-0 h-screen sticky top-0"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 13, 28, 0.88) 0%, rgba(15, 15, 26, 0.92) 100%)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Decorative top glow */}
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl"
             style={{ background: 'rgba(124,58,255,0.2)' }} />
        <div className="absolute -top-6 right-0 w-28 h-28 rounded-full blur-3xl"
             style={{ background: 'rgba(255,45,146,0.15)' }} />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3 px-5 py-5"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative w-9 h-9 rounded-2xl flex items-center justify-center neon-pulse"
             style={{ background: 'linear-gradient(135deg, #7c3aff, #ff2d92)' }}>
          <Zap className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="text-base font-black tracking-tight text-gradient-brand">Kurippu</span>
          <p className="text-[10px] text-ink-subtle leading-none mt-0.5">Turn Docs into Actions</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative z-10">
        {navItems.map(({ to, icon: Icon, label, color, bg, border }, idx) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'sidebar-link active'
                : 'sidebar-link group'
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${color}`}
                  style={isActive
                    ? { background: bg, border: `1px solid ${border}` }
                    : { background: 'rgba(255,255,255,0.04)' }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-sm">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-ink-muted"
                style={isActive
                  ? { background: 'rgba(124,58,255,0.15)', border: '1px solid rgba(124,58,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)' }
                }
              >
                <Settings className="w-3.5 h-3.5" />
              </span>
              <span className="text-sm">Settings</span>
            </>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left mt-0.5 hover:text-pink-400 group"
        >
          <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-ink-muted group-hover:text-pink-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
            <LogOut className="w-3.5 h-3.5" />
          </span>
          <span className="text-sm">Logout</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-2 rounded-xl"
             style={{
               background: 'linear-gradient(135deg, rgba(124,58,255,0.12), rgba(255,45,146,0.08))',
               border: '1px solid rgba(124,58,255,0.2)',
             }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
               style={{ background: 'linear-gradient(135deg, #7c3aff, #ff2d92)' }}>
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ink truncate">{user?.name}</p>
            {user?.is_demo && (
              <span className="text-[10px] text-gold-400 font-medium">Demo Account</span>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
