import React from 'react';
import { ShieldCheck, ShieldAlert, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  type: 'internet' | 'connection';
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  if (type === 'internet') {
    switch (status) {
      case 'allowed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            INTERNET ACTIVE
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
            <ShieldAlert className="w-3.5 h-3.5" />
            BLOCKED BY ROUTER
          </span>
        );
      case 'verifying':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            VERIFYING RESTRICTION...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            UNKNOWN
          </span>
        );
    }
  }

  // Connection status
  switch (status) {
    case 'online':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Online
        </span>
      );
    case 'offline':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <WifiOff className="w-3 h-3" />
          Offline
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <Wifi className="w-3 h-3" />
          Standby
        </span>
      );
  }
};

