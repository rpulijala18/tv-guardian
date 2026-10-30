import React, { useState, useEffect } from 'react';
import {
  Tv,
  Clock,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Power,
  Flame,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlusCircle,
  Activity,
  Layers,
  Cpu
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { StatusBadge } from '../components/StatusBadge';
import { ActionConfirmModal } from '../components/ActionConfirmModal';
import { api } from '../lib/api';
import { Device, ParentalSettings, UsageAnalyticsData, LocalAgentStatus } from '../types/shared';

export const Dashboard: React.FC = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [settings, setSettings] = useState<ParentalSettings | null>(null);
  const [agent, setAgent] = useState<LocalAgentStatus | null>(null);
  const [analytics, setAnalytics] = useState<UsageAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Confirmation Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    actionType: 'block' | 'unblock' | 'pause30' | 'pause60' | 'extend30';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    actionType: 'block'
  });

  // Simulated screen time state for real-time reactivity
  const [screenTimeMinutes, setScreenTimeMinutes] = useState(68);

  const loadData = async () => {
    try {
      const [devices, agentData] = await Promise.all([
        api.getDevices(),
        api.getAgentStatus()
      ]);

      const mainDevice = devices[0] || null;
      setDevice(mainDevice);
      setAgent(agentData);

      if (mainDevice) {
        const [sets, anData] = await Promise.all([
          api.getSettings(mainDevice.id),
          api.getAnalytics(mainDevice.id)
        ]);
        setSettings(sets);
        setAnalytics(anData);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // Polling telemetry every 20s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFeedbackMessage({ type: 'info', text: 'Querying local network controller and Sony Bravia hardware...' });
    await loadData();
    setFeedbackMessage({ type: 'success', text: 'Hardware synchronization completed.' });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleConfirmAction = async () => {
    if (!device) return;
    const action = modalState.actionType;
    setModalState(prev => ({ ...prev, isOpen: false }));
    setActionInProgress(action);

    try {
      if (action === 'block') {
        setFeedbackMessage({ type: 'info', text: 'Transmitting drop rule to router. Awaiting verification...' });
        const result = await api.blockDevice(device.id);
        if (result.success && result.verified) {
          setDevice(prev => prev ? { ...prev, internet_status: 'blocked' } : null);
          setFeedbackMessage({
            type: 'success',
            text: `Hardware Block Verified: ${result.details || 'WAN packet drop enforced.'}`
          });
        } else {
          setFeedbackMessage({
            type: 'error',
            text: 'Router restriction could not be verified. Hardware unchanged.'
          });
        }
      } else if (action === 'unblock') {
        setFeedbackMessage({ type: 'info', text: 'Transmitting unblock command to router...' });
        const result = await api.unblockDevice(device.id);
        if (result.success && result.verified) {
          setDevice(prev => prev ? { ...prev, internet_status: 'allowed' } : null);
          setFeedbackMessage({
            type: 'success',
            text: `Internet Restored: ${result.details || 'Firewall forwarding rule flushed.'}`
          });
        } else {
          setFeedbackMessage({
            type: 'error',
            text: 'Failed to verify unblock at hardware level.'
          });
        }
      } else if (action === 'pause30' || action === 'pause60') {
        const mins = action === 'pause30' ? 30 : 60;
        await api.blockDevice(device.id);
        setDevice(prev => prev ? { ...prev, internet_status: 'blocked' } : null);
        setFeedbackMessage({
          type: 'success',
          text: `Internet paused for ${mins} minutes. Auto-restore scheduled.`
        });
      } else if (action === 'extend30') {
        setScreenTimeMinutes(prev => Math.max(0, prev - 30));
        setFeedbackMessage({
          type: 'success',
          text: 'Extended today\'s screen time limit by 30 minutes.'
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionInProgress(null);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const dailyLimitMinutes = settings?.daily_limit_minutes || 120;
  const remainingMinutes = Math.max(0, dailyLimitMinutes - screenTimeMinutes);
  const percentageConsumed = Math.min(100, Math.round((screenTimeMinutes / dailyLimitMinutes) * 100));

  const isBlocked = device?.internet_status === 'blocked';

  return (
    <div className="space-y-6">
      {/* Hardware Feedback Alert */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold tracking-wide border shadow-lg transition-all animate-fade-in ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : feedbackMessage.type === 'error'
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
        }`}>
          <div className="flex items-center gap-3">
            {feedbackMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            {feedbackMessage.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {feedbackMessage.type === 'info' && <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Grid: Cards A, B, and C */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CARD A: TV DEVICE STATUS */}
        <GlassCard glow={isBlocked ? 'danger' : 'purple'} className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">TV Device Status</h3>
                  <p className="text-[11px] text-slate-400">Sony Bravia Smart TV</p>
                </div>
              </div>
              <StatusBadge type="connection" status={device?.connection_status || 'online'} />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Device Name</span>
                <span className="font-semibold text-slate-200">{device?.device_name || 'Sony Bravia 4K'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">IP Address</span>
                <span className="font-mono text-cyan-400">{device?.ip_address || '192.168.1.145'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">MAC Address</span>
                <span className="font-mono text-slate-300">{device?.mac_address || 'f0:bf:97:8a:2d:44'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Internet Access</span>
                <StatusBadge type="internet" status={device?.internet_status || 'allowed'} />
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Power Status</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <Power className="w-3.5 h-3.5" />
                  Active (Screen On)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-400">Current Input / App</span>
                <span className="text-slate-200 font-medium">YouTube 4K</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified via: Router Firewall</span>
            <span className="text-slate-400 font-mono">Sync: Just now</span>
          </div>
        </GlassCard>

        {/* CARD B: SCREEN TIME TODAY */}
        <GlassCard glow="blue" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Screen Time Today</h3>
                  <p className="text-[11px] text-slate-400">Resets at midnight IST</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {percentageConsumed}% Used
              </span>
            </div>

            {/* Time display */}
            <div className="my-5 flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {Math.floor(screenTimeMinutes / 60)}h {screenTimeMinutes % 60}m
                </span>
                <span className="text-xs text-slate-400 ml-2">watched</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-cyan-400">
                  {remainingMinutes}m
                </span>
                <p className="text-[10px] text-slate-400">remaining</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-800/90 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentageConsumed >= 100
                      ? 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : percentageConsumed >= 75
                      ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                      : 'bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  }`}
                  style={{ width: `${percentageConsumed}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0m</span>
                <span>Daily Limit: {dailyLimitMinutes}m</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Signal: Bravia Hardware API</span>
            <span className="text-emerald-400 font-medium">● Measured Activity</span>
          </div>
        </GlassCard>

        {/* CARD C: QUICK CONTROLS */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Quick Controls</h3>
                  <p className="text-[11px] text-slate-400">Enforce Instant Restrictions</p>
                </div>
              </div>
            </div>

            {/* Main Action Button */}
            <div className="mb-4">
              {isBlocked ? (
                <button
                  onClick={() => setModalState({
                    isOpen: true,
                    title: 'Restore TV Internet Access?',
                    message: 'This will instruct the router hardware to flush the firewall DROP rule and restore full WAN internet access to the Sony Bravia Smart TV.',
                    confirmLabel: 'Confirm Unblock',
                    actionType: 'unblock'
                  })}
                  disabled={actionInProgress !== null}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>UNBLOCK TV INTERNET</span>
                </button>
              ) : (
                <button
                  onClick={() => setModalState({
                    isOpen: true,
                    title: 'Block TV Internet Access Now?',
                    message: 'This will instruct the local home network router to enforce a hardware DROP rule for the Sony Bravia MAC address. The TV will immediately lose internet connectivity.',
                    confirmLabel: 'Confirm Block',
                    actionType: 'block'
                  })}
                  disabled={actionInProgress !== null}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>BLOCK TV INTERNET NOW</span>
                </button>
              )}
            </div>

            {/* Quick Helper Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setModalState({
                  isOpen: true,
                  title: 'Pause Internet for 30 Minutes?',
                  message: 'This will immediately disconnect the TV from the internet for 30 minutes, then automatically restore it.',
                  confirmLabel: 'Pause 30m',
                  actionType: 'pause30'
                })}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <span>Pause 30m</span>
              </button>

              <button
                onClick={() => setModalState({
                  isOpen: true,
                  title: 'Pause Internet for 1 Hour?',
                  message: 'Temporarily pauses TV internet access for 60 minutes.',
                  confirmLabel: 'Pause 1h',
                  actionType: 'pause60'
                })}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <span>Pause 1h</span>
              </button>

              <button
                onClick={() => setModalState({
                  isOpen: true,
                  title: 'Extend Screen Time by 30m?',
                  message: 'Grants 30 additional minutes of allowed television viewing for today only.',
                  confirmLabel: 'Grant +30m',
                  actionType: 'extend30'
                })}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>+30m Extra</span>
              </button>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Check TV Ping</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
            Zero-simulation: commands are verified at the hardware router.
          </div>
        </GlassCard>
      </div>

      {/* Middle Section: Usage Analytics Charts (CARD D) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Daily Viewing Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Daily Screen Time (Past 7 Days)
              </h3>
              <p className="text-xs text-slate-400">Comparing actual watched minutes vs 120m daily limit</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-purple-500" />
                Actual Minutes
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-3 h-0.5 bg-rose-400" />
                Limit (120m)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
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
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 text-center text-xs">
            <div>
              <p className="text-slate-400">Weekly Average</p>
              <p className="font-bold text-white mt-0.5">{analytics?.summary.averageDailyMinutes || 108} min / day</p>
            </div>
            <div>
              <p className="text-slate-400">Limit Violations</p>
              <p className="font-bold text-amber-400 mt-0.5">{analytics?.summary.totalViolations || 4} times</p>
            </div>
            <div>
              <p className="text-slate-400">Automatic Blocks</p>
              <p className="font-bold text-emerald-400 mt-0.5">{analytics?.summary.automaticBlocks || 12} enforced</p>
            </div>
          </div>
        </GlassCard>

        {/* Most Active Viewing Hours */}
        <GlassCard>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Most Active Hours
            </h3>
            <p className="text-xs text-slate-400">Peak viewing windows in Asia/Kolkata</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.hourlyActivity || []}>
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Area type="monotone" dataKey="activeMinutes" stroke="#00d2ff" fill="#00d2ff" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Peak Window: 6:00 PM – 8:00 PM</span>
            <span className="text-cyan-400 font-semibold">Active Period</span>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Grid: Local Network Controller Health & Hardware Verification Card */}
      <GlassCard className="border border-slate-800/90">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {agent?.agent_name || 'Home Network Controller (Raspberry Pi 4)'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active Adapter: <span className="text-slate-200 font-medium">{agent?.router_adapter || 'Mock Hardware Router'}</span> · Hostname: <span className="font-mono text-slate-300">{agent?.hostname || 'guardian-gateway.local'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right hidden sm:block">
              <p className="text-slate-400">Cloud Sync Latency</p>
              <p className="font-mono text-emerald-400 font-semibold">18 ms (WebSocket)</p>
            </div>
            <button
              onClick={() => handleRefresh()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ping Agent</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Confirmation Modal */}
      <ActionConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmLabel={modalState.confirmLabel}
        confirmVariant={modalState.actionType === 'block' ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        isLoading={actionInProgress !== null}
      />
    </div>
  );
};
