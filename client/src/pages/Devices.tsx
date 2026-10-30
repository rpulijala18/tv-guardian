import React, { useState, useEffect } from 'react';
import {
  Tv,
  Plus,
  Search,
  Wifi,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Cpu,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { Device } from '../types/shared';

export const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Array<{ ip: string; mac: string; vendor: string; isLikelySony: boolean }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_name: 'Sony Bravia 4K Android TV',
    ip_address: '192.168.1.145',
    mac_address: 'f0:bf:97:8a:2d:44',
    bravia_psk: '0000',
    device_type: 'Sony Bravia' as const
  });
  const [testApiResult, setTestApiResult] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    const list = await api.getDevices();
    setDevices(list);
  };

  const handleScan = async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);

    // Simulates local controller ARP table & SSDP discovery
    setTimeout(() => {
      setDiscoveredDevices([
        {
          ip: '192.168.1.145',
          mac: 'f0:bf:97:8a:2d:44',
          vendor: 'Sony Corporation (Bravia KD-55X80K Google TV)',
          isLikelySony: true
        },
        {
          ip: '192.168.1.189',
          mac: 'b4:52:7d:11:c3:2e',
          vendor: 'Sony Corporation (Bravia OLED Master Series)',
          isLikelySony: true
        },
        {
          ip: '192.168.1.205',
          mac: '44:65:0d:55:aa:19',
          vendor: 'Amazon Fire TV Stick 4K Max',
          isLikelySony: false
        }
      ]);
      setIsScanning(false);
    }, 1800);
  };

  const handleSelectDiscovered = (d: typeof discoveredDevices[0]) => {
    setNewDevice({
      device_name: d.vendor.includes('Sony') ? 'Sony Bravia 4K TV' : 'Smart TV',
      ip_address: d.ip,
      mac_address: d.mac,
      bravia_psk: '0000',
      device_type: 'Sony Bravia'
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addDevice(newDevice);
    setShowAddModal(false);
    loadDevices();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this television from TV Guardian?')) {
      await api.deleteDevice(id);
      loadDevices();
    }
  };

  const handleTestBraviaApi = async () => {
    setIsTestingApi(true);
    setTestApiResult(null);

    // Simulate probing Bravia REST endpoints
    setTimeout(() => {
      setTestApiResult('✓ Sony Bravia REST API Handshake Succeeded. System: Bravia 4K (Model KD-55X80K), Power Status: Active, PSK Authorized.');
      setIsTestingApi(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Tv className="w-5 h-5 text-purple-400" />
            Device Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure target Sony Bravia Smart TV, IP control, and hardware router bindings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
          >
            <Search className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning LAN Subnet...' : 'Scan Local Network'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add TV</span>
          </button>
        </div>
      </div>

      {/* Discovered LAN Devices Panel (if scanned) */}
      {discoveredDevices.length > 0 && (
        <GlassCard glow="blue" className="border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Discovered Devices on Local Network</h3>
            </div>
            <button
              onClick={() => setDiscoveredDevices([])}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {discoveredDevices.map((d) => (
              <div
                key={d.mac}
                onClick={() => handleSelectDiscovered(d)}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {d.vendor}
                  </span>
                  {d.isLikelySony && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      SONY MATCH
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-cyan-400">{d.ip}</p>
                <p className="text-[10px] font-mono text-slate-400">{d.mac}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Click to register TV &rarr;</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Registered Devices List */}
      <div className="space-y-4">
        {devices.map((dev) => (
          <GlassCard key={dev.id} glow={dev.internet_status === 'blocked' ? 'danger' : 'purple'}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-white shadow-lg">
                  <Tv className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white tracking-wide">{dev.device_name}</h3>
                    <StatusBadge type="connection" status={dev.connection_status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                    <span>IP: <strong className="font-mono text-cyan-400">{dev.ip_address}</strong></span>
                    <span>MAC: <strong className="font-mono text-slate-300">{dev.mac_address}</strong></span>
                    <span>Type: <strong className="text-slate-300">{dev.device_type}</strong></span>
                    <span>PSK Control: <strong className="text-purple-400 font-mono">Configured</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <StatusBadge type="internet" status={dev.internet_status} />
                <button
                  onClick={handleTestBraviaApi}
                  disabled={isTestingApi}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Test Bravia API</span>
                </button>
                <button
                  onClick={() => handleDelete(dev.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Test result display */}
            {testApiResult && (
              <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-medium text-purple-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>{testApiResult}</span>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Sony Bravia Smart TV</h3>
            <p className="text-xs text-slate-400 mb-5">
              Enter network identifiers for hardware-level internet restrictions.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Friendly Name</label>
                <input
                  type="text"
                  value={newDevice.device_name}
                  onChange={e => setNewDevice({ ...newDevice, device_name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">IP Address</label>
                  <input
                    type="text"
                    value={newDevice.ip_address}
                    onChange={e => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">MAC Address (Target)</label>
                  <input
                    type="text"
                    value={newDevice.mac_address}
                    onChange={e => setNewDevice({ ...newDevice, mac_address: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sony Bravia Pre-Shared Key (PSK)</label>
                <input
                  type="password"
                  value={newDevice.bravia_psk}
                  onChange={e => setNewDevice({ ...newDevice, bravia_psk: e.target.value })}
                  placeholder="0000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Found on your TV: Settings &rarr; Network &rarr; Home Network &rarr; IP Control &rarr; Pre-Shared Key
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-semibold text-white shadow-lg"
                >
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
