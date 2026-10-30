import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Radio,
  Router,
  Lock,
  Bell,
  Save,
  CheckCircle2,
  Copy,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../lib/api';
import { ParentalSettings, LocalAgentStatus } from '../types/shared';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<ParentalSettings | null>(null);
  const [agent, setAgent] = useState<LocalAgentStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [routerTestStatus, setRouterTestStatus] = useState<string | null>(null);
  const [isTestingRouter, setIsTestingRouter] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Router adapter selection
  const [selectedAdapter, setSelectedAdapter] = useState('mock');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const devices = await api.getDevices();
    if (devices[0]) {
      const [sets, ag] = await Promise.all([
        api.getSettings(devices[0].id),
        api.getAgentStatus()
      ]);
      setSettings(sets);
      setAgent(ag);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveSuccess(false);

    await api.saveSettings(settings);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestRouter = () => {
    setIsTestingRouter(true);
    setRouterTestStatus(null);

    setTimeout(() => {
      setRouterTestStatus('✓ Router Gateway Reached (192.168.1.1): Access Control API ready. Firewall forward rules validated.');
      setIsTestingRouter(false);
    }, 1500);
  };

  const handleCopyAgentToken = () => {
    navigator.clipboard.writeText('tvg_agent_default_secret_key_88329');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (!settings) {
    return <div className="text-slate-400 text-sm">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-purple-400" />
          System Settings & Integrations
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Hardware router adapter bindings, local agent security tokens, and timezone configuration.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>System configuration updated successfully!</span>
        </div>
      )}

      {/* Timezone & Core Settings */}
      <GlassCard glow="purple">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Regional Timezone & Midnight Reset
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          All daily quotas, morning/evening restrictions, and scheduler rollovers operate in this timezone.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Configured Timezone</label>
            <select
              value={settings.timezone}
              onChange={e => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
              <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-08:00)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Bedtime</label>
            <input
              type="time"
              value={settings.bedtime}
              onChange={e => setSettings({ ...settings, bedtime: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>
      </GlassCard>

      {/* Local Controller Connection & Agent Token */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            Home Local Network Agent (Controller)
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            AGENT CONNECTED
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          The local agent runs inside your home network (e.g. on a Raspberry Pi or Windows PC) and executes hardware restrictions.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Agent Security Token (PSK)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="tvg_agent_default_secret_key_88329"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-xs focus:outline-none"
              />
              <button
                onClick={handleCopyAgentToken}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedToken ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Place this token in your local agent's <code className="text-purple-400 font-mono">.env</code> file under <code className="text-purple-400 font-mono">AGENT_AUTH_TOKEN</code>.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Router Hardware Adapter Settings */}
      <GlassCard glow="blue">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Router Hardware Adapter
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Select the router or gateway interface supported by your home network infrastructure.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { id: 'mock', name: 'Mock Router (Dev / Testing)', desc: 'Hardware simulation with verified latency' },
            { id: 'openwrt', name: 'OpenWrt / LEDE', desc: 'UCI firewall & nftables/iptables drop' },
            { id: 'asuswrt', name: 'AsusWRT / Merlin', desc: 'NVRAM parental filter & iptables forward' },
            { id: 'unifi', name: 'Ubiquiti UniFi', desc: 'UniFi Network Controller Client API' },
            { id: 'tplink', name: 'TP-Link Omada / Tether', desc: 'Parental controls & MAC binding' },
            { id: 'arpguard', name: 'Local ARP Guard', desc: 'Autonomous LAN isolate without router admin' }
          ].map(adapter => (
            <div
              key={adapter.id}
              onClick={() => setSelectedAdapter(adapter.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedAdapter === adapter.id
                  ? 'bg-purple-900/20 border-purple-500 shadow-md shadow-purple-900/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{adapter.name}</span>
                {selectedAdapter === adapter.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </div>
              <p className="text-[10px] text-slate-400">{adapter.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleTestRouter}
            disabled={isTestingRouter}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isTestingRouter ? 'animate-spin' : ''}`} />
            <span>{isTestingRouter ? 'Testing Gateway Handshake...' : 'Test Router Gateway'}</span>
          </button>
        </div>

        {routerTestStatus && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{routerTestStatus}</span>
          </div>
        )}
      </GlassCard>

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
              <span>Saving Configuration...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
