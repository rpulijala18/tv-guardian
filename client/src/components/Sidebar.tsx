import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Tv,
  Clock,
  CalendarDays,
  BarChart3,
  Bell,
  Settings,
  Shield,
  LogOut,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  agentOnline?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ agentOnline = true }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'My TV', to: '/devices', icon: Tv },
    { name: 'Screen Time', to: '/screen-time', icon: Clock },
    { name: 'Schedules', to: '/schedules', icon: CalendarDays },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Notifications', to: '/notifications', icon: Bell },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between h-screen sticky top-0 bg-[#0a0f1d]/90 backdrop-blur-2xl border-r border-slate-800/80 p-5 z-40 select-none">
      <div>
        {/* Branding */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#0a0f1d] rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
              TV GUARDIAN
            </h1>
            <p className="text-[10px] text-purple-400/90 font-medium tracking-tight">
              Smart Screen Time. Safer Childhood.
            </p>
          </div>
        </div>

        {/* Local Controller Status Pill */}
        <div className="mb-6 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${agentOnline ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="text-[11px] font-medium text-slate-300">Home Controller</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
            agentOnline
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
          }`}>
            {agentOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-white border border-purple-500/30 shadow-md shadow-purple-900/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-2 mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
              {user?.email?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.email || 'Administrator'}</p>
              <p className="text-[10px] text-purple-400 font-medium">Master Guardian</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock & Log Out</span>
        </button>
      </div>
    </aside>
  );
};

