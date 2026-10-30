import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../lib/api';
import { Schedule, Device, Weekday } from '../types/shared';

export const Schedules: React.FC = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preset templates
  const applyPreset = (preset: 'school' | 'balanced' | 'strict') => {
    if (preset === 'school') {
      // Mon-Fri: 18:00 to 20:00 (6 PM - 8 PM)
      // Sat-Sun: 10:00 to 20:30 (10 AM - 8:30 PM)
      const updated = schedules.map(s => {
        if (s.weekday === 'saturday' || s.weekday === 'sunday') {
          return { ...s, allowed_start: '10:00', allowed_end: '20:30', enabled: true };
        }
        return { ...s, allowed_start: '18:00', allowed_end: '20:00', enabled: true };
      });
      setSchedules(updated);
    } else if (preset === 'balanced') {
      // Everyday: 17:00 to 20:30
      const updated = schedules.map(s => ({
        ...s,
        allowed_start: '17:00',
        allowed_end: '20:30',
        enabled: true
      }));
      setSchedules(updated);
    } else if (preset === 'strict') {
      // Mon-Thu: blocked completely (enabled = false)
      // Fri-Sun: 18:00 to 19:30
      const updated = schedules.map(s => {
        if (['monday', 'tuesday', 'wednesday', 'thursday'].includes(s.weekday)) {
          return { ...s, enabled: false };
        }
        return { ...s, allowed_start: '18:00', allowed_end: '19:30', enabled: true };
      });
      setSchedules(updated);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const devices = await api.getDevices();
    const dev = devices[0];
    setDevice(dev || null);

    if (dev) {
      const list = await api.getSchedules(dev.id);
      setSchedules(list);
    }
  };

  const updateScheduleRow = (idx: number, updates: Partial<Schedule>) => {
    const updated = [...schedules];
    updated[idx] = { ...updated[idx], ...updates };
    setSchedules(updated);
  };

  const handleSave = async () => {
    if (!device) return;
    setIsSaving(true);
    setSavedSuccess(false);

    await api.saveSchedules(device.id, schedules);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const dayLabels: Record<Weekday, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-400" />
            Schedule Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure permitted viewing windows. TV internet is automatically blocked outside permitted hours.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('school')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-all"
          >
            School Week
          </button>
          <button
            onClick={() => applyPreset('balanced')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-all"
          >
            Balanced
          </button>
          <button
            onClick={() => applyPreset('strict')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-all"
          >
            Strict (Exam)
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Weekly schedule updated and transmitted to home router controller!</span>
        </div>
      )}

      {/* Schedule Table / Cards */}
      <GlassCard glow="purple">
        <div className="space-y-3">
          {schedules.map((sch, idx) => {
            const isWeekend = sch.weekday === 'saturday' || sch.weekday === 'sunday';
            return (
              <div
                key={sch.weekday}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                  sch.enabled
                    ? isWeekend
                      ? 'bg-purple-900/10 border-purple-500/30'
                      : 'bg-slate-900/70 border-slate-800'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 w-40 mb-2 sm:mb-0">
                  <button
                    type="button"
                    onClick={() => updateScheduleRow(idx, { enabled: !sch.enabled })}
                    className="text-slate-400 hover:text-white"
                  >
                    {sch.enabled ? (
                      <ToggleRight className="w-6 h-6 text-purple-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                  <span className={`text-sm font-bold ${sch.enabled ? 'text-white' : 'text-slate-500'}`}>
                    {dayLabels[sch.weekday]}
                  </span>
                  {isWeekend && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300">
                      Weekend
                    </span>
                  )}
                </div>

                {sch.enabled ? (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">Permitted:</span>
                    <input
                      type="time"
                      value={sch.allowed_start}
                      onChange={e => updateScheduleRow(idx, { allowed_start: e.target.value })}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="time"
                      value={sch.allowed_end}
                      onChange={e => updateScheduleRow(idx, { allowed_end: e.target.value })}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-rose-400 font-semibold tracking-wide">
                    Television Internet Blocked All Day
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Routine Restrictions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Morning Restriction Window</h4>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Blocks TV internet during school preparation hours (06:00 – 09:00).
          </p>
          <div className="flex items-center justify-between text-xs text-slate-300 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span>Enforcement Rule</span>
            <span className="font-semibold text-emerald-400">Active (Router Drop)</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <Sunset className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Evening Homework Window</h4>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Prevents TV distractions during study time (17:00 – 18:30).
          </p>
          <div className="flex items-center justify-between text-xs text-slate-300 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span>Enforcement Rule</span>
            <span className="font-semibold text-emerald-400">Active (Router Drop)</span>
          </div>
        </GlassCard>
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
              <span>Transmitting to Router...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Apply Schedules</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
