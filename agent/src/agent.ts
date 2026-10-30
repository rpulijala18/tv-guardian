import WebSocket from 'ws';
import os from 'node:os';
import { config } from './config.js';
import { createRouterAdapter, RouterAdapter } from './adapters/index.js';
import { SonyBraviaClient } from './sony-bravia/bravia-client.js';
import { TelemetryCollector } from './telemetry.js';
import { scanLocalNetworkForSony } from './sony-bravia/discovery.js';

class TVGuardianAgent {
  private ws: WebSocket | null = null;
  private routerAdapter: RouterAdapter;
  private braviaClient: SonyBraviaClient;
  private telemetryCollector: TelemetryCollector;
  private isRunning: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private telemetryInterval: NodeJS.Timeout | null = null;

  // Local schedule cache for offline enforcement
  private localScheduleCache: {
    dailyLimitMinutes: number;
    bedtime: string;
    todayUsedMinutes: number;
    lastResetDate: string;
  } = {
    dailyLimitMinutes: 120,
    bedtime: '21:00',
    todayUsedMinutes: 0,
    lastResetDate: new Date().toISOString().split('T')[0]
  };

  constructor() {
    console.log('----------------------------------------------------');
    console.log('       TV GUARDIAN - LOCAL NETWORK CONTROLLER        ');
    console.log('       "Smart Screen Time. Safer Childhood."       ');
    console.log('----------------------------------------------------');
    console.log(`[Agent] Initializing adapter: ${config.routerAdapterType.toUpperCase()}`);
    console.log(`[Agent] Target Sony Bravia: ${config.targetTvMac} (${config.targetTvIp})`);

    this.routerAdapter = createRouterAdapter(config.routerAdapterType, config.routerConfig);
    this.braviaClient = new SonyBraviaClient({
      ip: config.targetTvIp,
      psk: config.targetTvPsk
    });
    this.telemetryCollector = new TelemetryCollector(
      this.braviaClient,
      this.routerAdapter,
      config.targetTvMac,
      config.targetTvIp
    );
  }

  start() {
    this.isRunning = true;
    this.connectToCloud();

    // Start local telemetry & offline schedule enforcement loop (every 15s)
    this.telemetryInterval = setInterval(() => {
      this.runTelemetryCycle();
    }, config.telemetryIntervalMs);

    console.log(`[Agent] Local controller running. Outbound cloud sync active.`);
  }

  stop() {
    this.isRunning = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.telemetryInterval) clearInterval(this.telemetryInterval);
    if (this.ws) this.ws.close();
    console.log(`[Agent] Local controller stopped.`);
  }

  private connectToCloud() {
    if (!this.isRunning) return;

    console.log(`[Agent] Connecting outbound to cloud backend: ${config.backendWsUrl}`);

    try {
      this.ws = new WebSocket(config.backendWsUrl, {
        headers: {
          'x-agent-token': config.authToken
        }
      });

      this.ws.on('open', () => {
        console.log(`[Agent] ✓ Connected securely to TV Guardian Cloud.`);
        this.sendHeartbeat();

        // Send heartbeats every 10s
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
          this.sendHeartbeat();
        }, config.heartbeatIntervalMs);
      });

      this.ws.on('message', async (data: Buffer | string) => {
        try {
          const msg = JSON.parse(data.toString());
          await this.handleIncomingMessage(msg);
        } catch (err: any) {
          console.error(`[Agent] Failed to parse cloud message:`, err.message);
        }
      });

      this.ws.on('close', (code, reason) => {
        console.warn(`[Agent] Cloud connection closed (${code}: ${reason.toString() || 'connection dropped'}). Retrying in 5s...`);
        this.cleanupConnection();
        this.scheduleReconnect(5000);
      });

      this.ws.on('error', (err) => {
        console.warn(`[Agent] Cloud connection warning: ${err.message}. Retrying in 5s...`);
      });
    } catch (err: any) {
      console.error(`[Agent] Socket init error:`, err.message);
      this.scheduleReconnect(5000);
    }
  }

  private scheduleReconnect(delayMs: number) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connectToCloud();
    }, delayMs);
  }

  private cleanupConnection() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.ws = null;
  }

  private sendToCloud(type: string, payload: any, requestId?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, requestId }));
    }
  }

  private sendHeartbeat() {
    this.sendToCloud('heartbeat', {
      auth_token: config.authToken,
      hostname: os.hostname(),
      ip_address: this.getLocalIp(),
      router_adapter: this.routerAdapter.name,
      status: 'online',
      capabilities: {
        router_block: true,
        bravia_api: true,
        arp_scan: true,
        traffic_monitoring: true
      }
    });
  }

  private async handleIncomingMessage(msg: { type: string; payload: any; requestId?: string }) {
    console.log(`[Agent] Received cloud action: ${msg.type}`);

    switch (msg.type) {
      case 'block_command': {
        const { mac, ip, action } = msg.payload;
        console.log(`[Agent] Executing ${action.toUpperCase()} for TV MAC: ${mac}`);

        let result;
        if (action === 'block') {
          result = await this.routerAdapter.blockInternet(mac, ip);
        } else {
          result = await this.routerAdapter.unblockInternet(mac, ip);
        }

        console.log(`[Agent] Restriction result: ${result.status.toUpperCase()} (Success: ${result.success})`);

        this.sendToCloud('action_result', {
          ...result,
          adapter: this.routerAdapter.name
        }, msg.requestId);
        break;
      }

      case 'status_request': {
        const telemetry = await this.telemetryCollector.collect();
        this.sendToCloud('status_result', telemetry, msg.requestId);
        break;
      }

      case 'scan_lan': {
        const discovered = await scanLocalNetworkForSony();
        this.sendToCloud('scan_result', { devices: discovered }, msg.requestId);
        break;
      }

      case 'sync_schedule_cache': {
        if (msg.payload) {
          this.localScheduleCache = { ...this.localScheduleCache, ...msg.payload };
          console.log(`[Agent] Synced offline schedule cache: limit=${this.localScheduleCache.dailyLimitMinutes}m, bedtime=${this.localScheduleCache.bedtime}`);
        }
        break;
      }
    }
  }

  private async runTelemetryCycle() {
    try {
      const telemetry = await this.telemetryCollector.collect();

      // Check date rollover for local screen time tracking in Asia/Kolkata
      const today = new Date().toLocaleDateString('en-CA', { timeZone: config.timezone });
      if (today !== this.localScheduleCache.lastResetDate) {
        this.localScheduleCache.lastResetDate = today;
        this.localScheduleCache.todayUsedMinutes = 0;
        console.log(`[Agent] Midnight rollover in ${config.timezone}. Daily screen time reset.`);
      }

      // If TV is currently being watched, increment local counter
      if (telemetry.isViewing) {
        const intervalMinutes = config.telemetryIntervalMs / 60000;
        this.localScheduleCache.todayUsedMinutes += intervalMinutes;
      }

      // Offline Schedule Enforcement:
      // Even if cloud is disconnected, verify if bedtime or screen limit is violated
      await this.enforceLocalRules(telemetry);

      // Report telemetry to cloud if connected
      this.sendToCloud('telemetry', {
        mac: config.targetTvMac,
        ...telemetry,
        telemetryIntervalMs: config.telemetryIntervalMs
      });
    } catch (err: any) {
      console.warn(`[Agent] Telemetry cycle warning:`, err.message);
    }
  }

  private async enforceLocalRules(telemetry: any) {
    const now = new Date();
    const istTimeStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: config.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const isBedtime = istTimeStr >= this.localScheduleCache.bedtime;
    const isLimitExceeded = this.localScheduleCache.todayUsedMinutes >= this.localScheduleCache.dailyLimitMinutes;

    if ((isBedtime || isLimitExceeded) && telemetry.verifiedInternetStatus === 'allowed') {
      console.log(`[Agent] OFFLINE ENFORCEMENT TRIGGERED: ${isBedtime ? 'Bedtime reached' : 'Screen time limit exceeded'}. Blocking TV internet...`);
      const blockResult = await this.routerAdapter.blockInternet(config.targetTvMac, config.targetTvIp);
      if (blockResult.success) {
        console.log(`[Agent] ✓ TV internet successfully BLOCKED by local controller.`);
      }
    }
  }

  private getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (!iface.internal && iface.family === 'IPv4') {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }
}

// Bootstrap agent if run directly
const agent = new TVGuardianAgent();
agent.start();

process.on('SIGINT', () => {
  agent.stop();
  process.exit(0);
});

