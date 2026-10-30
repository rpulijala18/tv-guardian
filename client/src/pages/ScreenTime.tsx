import React, { useState, useEffect } from 'react';
import {
  Clock,
  Save,
  CheckCircle2,
  Sliders,
  Moon,
  Shield,
  Radio,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../lib/api';
import { ParentalSettings, Device } from '../types/shared';

export const ScreenTime: React.FC = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [settings, setSettings] = useState<ParentalSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preset durations in minutes
  const presets = [
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours (Default)', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const devices = await api.getDevices();
    const dev = devices[0];
    setDevice(dev || null);

    if (dev) {
      const sets = await api.getSettings(dev.id);
      setSettings(sets);
    }
  };

  const handleSelectPreset = (minutes: number) => {
    if (settings) {
      setSettings({ ...settings, daily_limit_minutes: minutes });
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSavedSuccess(false);

    await api.saveSettings(settings);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading parental settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Daily Screen Time Limits
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enforce cumulative daily television viewing limits with midnight reset in Asia/Kolkata timezone.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Screen time rules saved and synchronized to local network controller!</span>
        </div>
      )}

      {/* Main Limit Selector Card */}
      <GlassCard glow="purple">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          Choose Permitted Daily Screen Time
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          When the child reaches this viewing quota, the router will automatically block WAN internet access to the TV.
        </p>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {presets.map(p => {
            const isSelected = settings.daily_limit_minutes === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handleSelectPreset(p.value)}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all text-center border ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg shadow-purple-600/20 glow-text-purple'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom duration slider */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Custom Duration</span>
            <span className="font-mono text-cyan-400 font-bold">
              {settings.daily_limit_minutes} minutes ({Math.floor(settings.daily_limit_minutes / 60)}h {settings.daily_limit_minutes % 60}m)
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="360"
            step="15"
            value={settings.daily_limit_minutes}
            onChange={e => setSettings({ ...settings, daily_limit_minutes: Number(e.target.value) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>15m</span>
            <span>2h</span>
            <span>4h</span>
            <span>6h max</span>
          </div>
        </div>
      </GlassCard>

      {/* Bedtime & Auto-Block Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Evening Bedtime Cutoff</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Regardless of remaining screen time, internet is automatically suspended at bedtime.
          </p>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-medium text-slate-300">Bedtime Lock</span>
            <input
              type="time"
              value={settings.bedtime}
              onChange={e => setSettings({ ...settings, bedtime: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Automatic Hardware Enforcement</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Dispatches hardware firewall drop rule when limit is reached without requiring browser open.
          </p>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <p className="text-xs font-bold text-white">Auto-Block Enabled</p>
              <p className="text-[10px] text-slate-400">Enforced by Home Local Controller</p>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_block_enabled}
              onChange={e => setSettings({ ...settings, auto_block_enabled: e.target.checked })}
              className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
            />
          </div>
        </GlassCard>
      </div>

      {/* Telemetry Accuracy Notice */}
      <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-300">
        <HelpCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">How Screen Time is Reliably Measured</p>
          <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
            TV Guardian inspects the Sony Bravia API power status and router WAN packet transfer rates (&gt;50kbps). The timer pauses whenever the TV is on standby, idle on the home screen, or streaming content is not playing. Daily usage persists in PostgreSQL and resets at 00:00:00 Asia/Kolkata.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Screen Time Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
