import { SonyBraviaClient } from './sony-bravia/bravia-client.js';
import { RouterAdapter } from './adapters/router-base.js';
import { TrackingMethod } from './types/shared.js';

export interface DeviceTelemetry {
  isOnline: boolean;
  powerStatus: 'active' | 'standby' | 'unknown';
  isViewing: boolean;
  trackingMethod: TrackingMethod;
  transferRateKbps: number;
  currentApp?: string;
  verifiedInternetStatus: 'allowed' | 'blocked' | 'unknown';
}

export class TelemetryCollector {
  private braviaClient: SonyBraviaClient;
  private routerAdapter: RouterAdapter;
  private targetMac: string;
  private targetIp: string;

  constructor(braviaClient: SonyBraviaClient, routerAdapter: RouterAdapter, targetMac: string, targetIp: string) {
    this.braviaClient = braviaClient;
    this.routerAdapter = routerAdapter;
    this.targetMac = targetMac.toLowerCase();
    this.targetIp = targetIp;
  }

  async collect(): Promise<DeviceTelemetry> {
    // 1. Check router-level stats
    const stats = await this.routerAdapter.getDeviceStats(this.targetMac, this.targetIp);
    const verifiedInternet = await this.routerAdapter.verifyStatus(this.targetMac, this.targetIp);

    // 2. Query Sony Bravia REST API
    let powerStatus: 'active' | 'standby' | 'unknown' = 'unknown';
    let currentApp = 'None';
    let isBraviaReachable = false;

    try {
      const braviaInfo = await this.braviaClient.getSystemInformation();
      if (braviaInfo) {
        powerStatus = braviaInfo.powerStatus;
        currentApp = braviaInfo.currentApp || 'Home Launcher';
        isBraviaReachable = true;
      }
    } catch {
      // TV might be offline or sleeping
    }

    // 3. Determine if television is actively being viewed
    let isViewing = false;
    let trackingMethod: TrackingMethod = 'estimated_ping';

    if (isBraviaReachable) {
      // Reliable hardware signal: TV screen is physically on and active
      isViewing = powerStatus === 'active';
      trackingMethod = 'bravia_active_telemetry';
    } else if (stats.isOnline && (stats.transferRateKbps ?? 0) > 60) {
      // TV power API not answering, but steady network traffic flow indicates video streaming
      isViewing = true;
      trackingMethod = 'router_traffic_flow';
    } else if (stats.isOnline) {
      // Online in ARP/ping table, but idle/standby
      isViewing = false;
      trackingMethod = 'estimated_ping';
    }

    return {
      isOnline: stats.isOnline || isBraviaReachable,
      powerStatus,
      isViewing,
      trackingMethod,
      transferRateKbps: stats.transferRateKbps || 0,
      currentApp,
      verifiedInternetStatus: verifiedInternet
    };
  }
}

