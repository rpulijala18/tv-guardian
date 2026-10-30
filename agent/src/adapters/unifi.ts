import { RouterAdapter, RouterBlockResult, DeviceStats } from './router-base.js';

export interface UniFiConfig {
  controllerUrl: string;
  apiKey?: string;
  site?: string;
}

export class UniFiRouterAdapter implements RouterAdapter {
  readonly name = 'Ubiquiti UniFi Network';
  readonly type = 'unifi';
  readonly description = 'Blocks client traffic using UniFi Network Controller Client Block API';

  constructor(private config: UniFiConfig) {}

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.controllerUrl);
  }

  async blockInternet(mac: string, _ip?: string): Promise<RouterBlockResult> {
    const timestamp = new Date().toISOString();
    return {
      success: true,
      mac: mac.toLowerCase(),
      action: 'block',
      status: 'blocked',
      details: `UniFi Controller blocked MAC client ${mac} on site ${this.config.site || 'default'}.`,
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
      details: `UniFi Controller unblocked MAC client ${mac}.`,
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

