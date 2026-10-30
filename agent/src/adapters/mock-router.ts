import { RouterAdapter, RouterBlockResult, DeviceStats } from './router-base.js';

export interface MockRouterOptions {
  simulatedDelayMs?: number;
  failureRate?: number; // 0 to 1
  initialBlockedMacs?: string[];
}

export class MockRouterAdapter implements RouterAdapter {
  readonly name = 'Mock Hardware Router (Simulation & Testing)';
  readonly type = 'mock';
  readonly description = 'Simulated router hardware firewall with real-time verification and packet accounting';

  private blockedMacs: Set<string> = new Set();
  private simulatedDelayMs: number;
  private failureRate: number;
  private isOnline: boolean = true;
  private trafficCounters: Map<string, { rx: number; tx: number; lastActive: number }> = new Map();

  constructor(options: MockRouterOptions = {}) {
    this.simulatedDelayMs = options.simulatedDelayMs ?? 200;
    this.failureRate = options.failureRate ?? 0.0;
    if (options.initialBlockedMacs) {
      options.initialBlockedMacs.forEach(mac => this.blockedMacs.add(mac.toLowerCase()));
    }
  }

  public setOnline(online: boolean) {
    this.isOnline = online;
  }

  public setFailureRate(rate: number) {
    this.failureRate = rate;
  }

  private async delay(): Promise<void> {
    if (this.simulatedDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulatedDelayMs));
    }
  }

  async isAvailable(): Promise<boolean> {
    await this.delay();
    return this.isOnline;
  }

  async blockInternet(mac: string, ip?: string): Promise<RouterBlockResult> {
    await this.delay();
    const normalizedMac = mac.toLowerCase();
    const timestamp = new Date().toISOString();

    if (!this.isOnline) {
      return {
        success: false,
        mac: normalizedMac,
        action: 'block',
        status: 'unknown',
        error: 'Router hardware unreachable or gateway unresponsive',
        timestamp
      };
    }

    if (Math.random() < this.failureRate) {
      return {
        success: false,
        mac: normalizedMac,
        action: 'block',
        status: 'allowed',
        error: 'Hardware firewall returned iptables commit rejection',
        timestamp
      };
    }

    // Apply rule to simulated firewall
    this.blockedMacs.add(normalizedMac);

    // Verify actual restriction
    const verifiedStatus = await this.verifyStatus(normalizedMac, ip);
    const verified = verifiedStatus === 'blocked';

    return {
      success: verified,
      mac: normalizedMac,
      action: 'block',
      status: verifiedStatus,
      details: verified
        ? `Firewall rule applied: DROP FORWARD for MAC ${normalizedMac}. WAN packet drop verified.`
        : 'Rule applied but WAN verification failed.',
      timestamp
    };
  }

  async unblockInternet(mac: string, ip?: string): Promise<RouterBlockResult> {
    await this.delay();
    const normalizedMac = mac.toLowerCase();
    const timestamp = new Date().toISOString();

    if (!this.isOnline) {
      return {
        success: false,
        mac: normalizedMac,
        action: 'unblock',
        status: 'unknown',
        error: 'Router hardware unreachable',
        timestamp
      };
    }

    this.blockedMacs.delete(normalizedMac);

    // Verify restriction is removed
    const verifiedStatus = await this.verifyStatus(normalizedMac, ip);
    const verified = verifiedStatus === 'allowed';

    return {
      success: verified,
      mac: normalizedMac,
      action: 'unblock',
      status: verifiedStatus,
      details: verified
        ? `Firewall rule flushed for MAC ${normalizedMac}. Internet route restored and verified.`
        : 'Rule flushed but route verification failed.',
      timestamp
    };
  }

  async verifyStatus(mac: string, _ip?: string): Promise<'allowed' | 'blocked' | 'unknown'> {
    await this.delay();
    if (!this.isOnline) return 'unknown';

    const normalizedMac = mac.toLowerCase();
    return this.blockedMacs.has(normalizedMac) ? 'blocked' : 'allowed';
  }

  async getDeviceStats(mac: string, _ip?: string): Promise<DeviceStats> {
    await this.delay();
    const normalizedMac = mac.toLowerCase();
    const isBlocked = this.blockedMacs.has(normalizedMac);

    let stats = this.trafficCounters.get(normalizedMac);
    if (!stats) {
      stats = { rx: 1048576, tx: 524288, lastActive: Date.now() };
      this.trafficCounters.set(normalizedMac, stats);
    }

    if (!isBlocked && this.isOnline) {
      // Simulate active streaming traffic if not blocked (e.g. 1500 - 4500 kbps)
      const transferRateKbps = Math.floor(Math.random() * 3000) + 1500;
      stats.rx += transferRateKbps * 128;
      stats.tx += 10240;
      stats.lastActive = Date.now();
      return {
        mac: normalizedMac,
        isOnline: true,
        rxBytes: stats.rx,
        txBytes: stats.tx,
        transferRateKbps
      };
    } else {
      // Blocked or offline: zero WAN throughput
      return {
        mac: normalizedMac,
        isOnline: this.isOnline,
        rxBytes: stats.rx,
        txBytes: stats.tx,
        transferRateKbps: 0
      };
    }
  }
}

