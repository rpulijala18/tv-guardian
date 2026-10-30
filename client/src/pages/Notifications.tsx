import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Radio,
  Trash2,
  Filter
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../lib/api';
import { NotificationItem } from '../types/shared';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'enforcement'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const list = await api.getNotifications();
    setNotifications(list);
  };

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'enforcement') return n.category === 'enforcement';
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'enforcement':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'screen_time':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'agent':
        return <Radio className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            Security & Restriction Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time notifications from your local network controller and router hardware.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter options */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${filter === 'all' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg transition-all ${filter === 'unread' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('enforcement')}
              className={`px-3 py-1 rounded-lg transition-all ${filter === 'enforcement' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Enforcement
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <GlassCard className="text-center py-12 text-slate-400 text-xs">
            No notifications matching selected filter.
          </GlassCard>
        ) : (
          filtered.map((item) => (
            <GlassCard
              key={item.id}
              glow={!item.read ? 'purple' : 'none'}
              className={`transition-all duration-200 p-4 ${!item.read ? 'border-purple-500/30' : 'opacity-85'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d2ff]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-2">
                      {new Date(item.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST · {new Date(item.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                </div>

                {!item.read && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-purple-600/30 text-slate-400 hover:text-white transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};
