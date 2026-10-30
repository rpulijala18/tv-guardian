import axios from 'axios';
import { SonyBraviaSystemInfo } from '../types/shared.js';

export interface BraviaClientConfig {
  ip: string;
  psk?: string;
  timeoutMs?: number;
}

export class SonyBraviaClient {
  private baseUrl: string;
  private psk: string;
  private timeoutMs: number;

  constructor(config: BraviaClientConfig) {
    this.baseUrl = `http://${config.ip}/sony`;
    this.psk = config.psk || '0000';
    this.timeoutMs = config.timeoutMs || 4000;
  }

  private async postJsonRpc(service: string, method: string, params: any[] = [], version = '1.0'): Promise<any> {
    const url = `${this.baseUrl}/${service}`;
    const payload = {
      id: Math.floor(Math.random() * 1000) + 1,
      method,
      version,
      params
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Auth-PSK': this.psk
    };

    const response = await axios.post(url, payload, {
      headers,
      timeout: this.timeoutMs
    });

    if (response.data.error) {
      throw new Error(`Bravia API error: ${JSON.stringify(response.data.error)}`);
    }

    return response.data.result;
  }

  /**
   * Ping / check connectivity to Sony Bravia TV
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const result = await this.postJsonRpc('system', 'getPowerStatus');
      return Boolean(result && result[0]);
    } catch {
      return false;
    }
  }

  /**
   * Get power status: 'active' (screen on / viewing) vs 'standby' (screen off)
   */
  async getPowerStatus(): Promise<'active' | 'standby' | 'unknown'> {
    try {
      const result = await this.postJsonRpc('system', 'getPowerStatus');
      if (result && result[0] && result[0].status) {
        return result[0].status; // 'active' or 'standby'
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get complete system information (model, serial, mac)
   */
  async getSystemInformation(): Promise<SonyBraviaSystemInfo | null> {
    try {
      const [sysInfo] = await this.postJsonRpc('system', 'getSystemInformation');
      const powerStatus = await this.getPowerStatus();

      let currentApp = 'Home Launcher';
      try {
        const [contentInfo] = await this.postJsonRpc('avContent', 'getPlayingContentInfo');
        if (contentInfo && contentInfo.title) {
          currentApp = contentInfo.title;
        }
      } catch {
        // optional endpoint depending on model
      }

      return {
        product: sysInfo.product || 'Sony Bravia TV',
        model: sysInfo.model || 'Bravia 4K Android TV',
        serial: sysInfo.serial || 'Unknown',
        macAddr: sysInfo.macAddr || '',
        powerStatus: powerStatus === 'active' ? 'active' : 'standby',
        currentApp
      };
    } catch (err) {
      return null;
    }
  }

  /**
   * Send command to put TV in standby (useful when bedtime/screen limit triggers)
   */
  async setPowerStandby(): Promise<boolean> {
    try {
      await this.postJsonRpc('system', 'setPowerStatus', [{ status: false }]);
      return true;
    } catch {
      return false;
    }
  }
}

