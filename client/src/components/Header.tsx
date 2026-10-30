import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Device } from '../types/shared';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  device?: Device | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  unreadNotifications?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  device,
  onRefresh,
  isRefreshing = false,
  unreadNotifications = 0
}) => {
  const navigate = useNavigate();
  const [istTime, setIstTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now);
      setIstTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-[#070a13]/80 backdrop-blur-xl border-b border-slate-800/80">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* IST Time Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-medium text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{istTime || '12:30:00 PM'} IST</span>
        </div>

        {/* Current TV Status */}
        {device && (
          <div className="hidden sm:flex items-center gap-2">
            <StatusBadge type="internet" status={device.internet_status} />
          </div>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Synchronize hardware status"
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 hover:text-white transition-all"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/50">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
