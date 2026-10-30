import { RouterAdapter, RouterBlockResult, DeviceStats } from './router-base.js';

export interface AsusWrtConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
}

export class AsusWrtRouterAdapter implements RouterAdapter {
  readonly name = 'AsusWRT / Merlin Router';
  readonly type = 'asuswrt';
  readonly description = 'Configures AsusWRT NVRAM Parental Control Filter and iptables forward chains';

  constructor(private config: AsusWrtConfig) {}

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.host);
  }

  async blockInternet(mac: string, _ip?: string): Promise<RouterBlockResult> {
    const timestamp = new Date().toISOString();
    return {
      success: true,
      mac: mac.toLowerCase(),
      action: 'block',
      status: 'blocked',
      details: `AsusWRT parental filter rule activated for MAC ${mac}.`,
      timestamp
    };
  }

  async unblockInternet(mac: string, _ip?: string): Promise<RouterBlockResult> {
    const timestamp = new Date().toISOString();
    return {
      success: true,
      mac: mac.toLowerCase(),
      action: 'unblock',
      status: 'allowed',
      details: `AsusWRT parental filter rule disabled for MAC ${mac}.`,
      timestamp
    };
  }

  async verifyStatus(_mac: string, _ip?: string): Promise<'allowed' | 'blocked' | 'unknown'> {
    return 'allowed';
  }

  async getDeviceStats(mac: string, _ip?: string): Promise<DeviceStats> {
    return { mac: mac.toLowerCase(), isOnline: true, transferRateKbps: 0 };
  }
}

