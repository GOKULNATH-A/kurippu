import React from 'react';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CheckSquare,
  Calendar, Bell, Search, BarChart3
} from 'lucide-react';

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, color: '#7c3aff' },
  { to: '/documents', icon: FileText,        color: '#00e5ff' },
  { to: '/actions',   icon: CheckSquare,     color: '#ff2d92' },
  { to: '/calendar',  icon: Calendar,        color: '#ff6b35' },
  { to: '/analytics', icon: BarChart3,       color: '#ffd700' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url('/bg.png')` }}
      />
      {/* Elegant glass overlay to ensure contrast and readability */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(12, 12, 24, 0.78) 0%, rgba(8, 8, 14, 0.90) 100%)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Decorative background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
             style={{ background: 'rgba(124,58,255,0.06)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl"
             style={{ background: 'rgba(0,229,255,0.05)' }} />
        <div className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full blur-3xl"
             style={{ background: 'rgba(255,45,146,0.04)' }} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex relative z-10">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-full p-6 pb-20 md:pb-6"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2"
           style={{
             background: 'rgba(13,13,26,0.95)',
             backdropFilter: 'blur(20px)',
             borderTop: '1px solid rgba(255,255,255,0.06)',
           }}>
        <div className="flex items-center justify-around">
          {mobileNavItems.map(({ to, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center p-2 rounded-xl transition-all"
            >
              {({ isActive }) => (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={isActive
                    ? { background: `${color}22`, border: `1px solid ${color}55`, color }
                    : { color: '#606088' }
                  }
                >
                  <Icon className="w-5 h-5" />
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
