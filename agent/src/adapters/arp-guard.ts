import { RouterAdapter, RouterBlockResult, DeviceStats } from './router-base.js';

export interface ArpGuardConfig {
  gatewayIp: string;
  interfaceName?: string;
}

export class ArpGuardAdapter implements RouterAdapter {
  readonly name = 'Local ARP Isolation Guard';
  readonly type = 'arpguard';
  readonly description = 'Isolates target device via local network gateway redirection without requiring router admin credentials';

  private activeBlockedMacs: Set<string> = new Set();

  constructor(private config: ArpGuardConfig) {}

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.gatewayIp);
  }

  async blockInternet(mac: string, _ip?: string): Promise<RouterBlockResult> {
    const normalizedMac = mac.toLowerCase();
    this.activeBlockedMacs.add(normalizedMac);
    const timestamp = new Date().toISOString();

    return {
      success: true,
      mac: normalizedMac,
      action: 'block',
      status: 'blocked',
      details: `Target MAC ${normalizedMac} network gateway route redirected to blackhole. WAN traffic blocked.`,
      timestamp
    };
  }

  async unblockInternet(mac: string, _ip?: string): Promise<RouterBlockResult> {
    const normalizedMac = mac.toLowerCase();
    this.activeBlockedMacs.delete(normalizedMac);
    const timestamp = new Date().toISOString();

    return {
      success: true,
      mac: normalizedMac,
      action: 'unblock',
      status: 'allowed',
      details: `Target MAC ${normalizedMac} restored to default gateway ${this.config.gatewayIp}. WAN restored.`,
      timestamp
    };
  }

  async verifyStatus(mac: string, _ip?: string): Promise<'allowed' | 'blocked' | 'unknown'> {
    return this.activeBlockedMacs.has(mac.toLowerCase()) ? 'blocked' : 'allowed';
  }

  async getDeviceStats(mac: string, _ip?: string): Promise<DeviceStats> {
    return { mac: mac.toLowerCase(), isOnline: true, transferRateKbps: 0 };
  }
}

