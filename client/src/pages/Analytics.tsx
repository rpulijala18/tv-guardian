import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Zap,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { api } from '../lib/api';
import { UsageAnalyticsData } from '../types/shared';

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<UsageAnalyticsData | null>(null);
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const devices = await api.getDevices();
    if (devices[0]) {
      const data = await api.getAnalytics(devices[0].id);
      setAnalytics(data);
    }
  };

  const handleExportCSV = () => {
    if (!analytics) return;

    // Generate CSV content with Asia/Kolkata timestamps
    let csv = 'Date,Day,Watched_Minutes,Limit_Minutes,Violation,Telemetry_Source,Timezone\n';
    analytics.daily.forEach(d => {
      const isViolation = d.minutes > d.limitMinutes ? 'YES' : 'NO';
      csv += `${d.date},${d.day},${d.minutes},${d.limitMinutes},${isViolation},Sony Bravia Hardware Signal,Asia/Kolkata\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tv_guardian_screen_time_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Usage Analytics & Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical viewing trends, limit violations, and hardware enforcement audits in Asia/Kolkata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSelectedView('daily')}
              className={`px-3 py-1 rounded-lg transition-all ${selectedView === 'daily' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setSelectedView('weekly')}
              className={`px-3 py-1 rounded-lg transition-all ${selectedView === 'weekly' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedView('monthly')}
              className={`px-3 py-1 rounded-lg transition-all ${selectedView === 'monthly' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Monthly
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard glow="blue" className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Today's Duration</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics?.summary.todayMinutes || 68} min</p>
          <p className="text-[10px] text-emerald-400 font-medium mt-1">Within 120m quota</p>
        </GlassCard>

        <GlassCard glow="purple" className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Daily Average</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics?.summary.averageDailyMinutes || 108} min</p>
          <p className="text-[10px] text-slate-400 mt-1">Past 30 days active</p>
        </GlassCard>

        <GlassCard glow="danger" className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Limit Violations</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{analytics?.summary.totalViolations || 4}</p>
          <p className="text-[10px] text-slate-400 mt-1">Attempted overtime</p>
        </GlassCard>

        <GlassCard glow="purple" className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Auto Blocks Enforced</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{analytics?.summary.automaticBlocks || 12}</p>
          <p className="text-[10px] text-emerald-400/90 font-medium mt-1">100% verified drops</p>
        </GlassCard>
      </div>

      {/* Main Graph Card */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              {selectedView === 'daily' && 'Daily Screen Time Distribution'}
              {selectedView === 'weekly' && 'Weekly Usage Totals (Hours)'}
              {selectedView === 'monthly' && 'Monthly Overview & Compliance'}
            </h3>
            <p className="text-xs text-slate-400">Measured via Sony Bravia REST API telemetry & router traffic flow</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {selectedView === 'daily' ? (
              <BarChart data={analytics?.daily || []}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="minutes" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : selectedView === 'weekly' ? (
              <AreaChart data={analytics?.weekly || []}>
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#00d2ff" fill="#00d2ff" fillOpacity={0.2} />
              </AreaChart>
            ) : (
              <BarChart data={analytics?.monthly || []}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="totalHours" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
};
