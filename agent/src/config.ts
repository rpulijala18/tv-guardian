import dotenv from 'dotenv';
dotenv.config();

export interface AgentConfig {
  backendUrl: string;
  backendWsUrl: string;
  authToken: string;
  routerAdapterType: string;
  targetTvMac: string;
  targetTvIp: string;
  targetTvPsk: string;
  timezone: string;
  heartbeatIntervalMs: number;
  telemetryIntervalMs: number;
  routerConfig: Record<string, any>;
}

export const config: AgentConfig = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  backendWsUrl: process.env.BACKEND_WS_URL || (process.env.BACKEND_URL ? process.env.BACKEND_URL.replace(/^http/, 'ws') + '/agent-ws' : 'ws://localhost:3001/agent-ws'),
  authToken: process.env.AGENT_AUTH_TOKEN || 'tvg_agent_default_secret_key_88329',
  routerAdapterType: process.env.ROUTER_ADAPTER_TYPE || 'mock',
  targetTvMac: (process.env.TARGET_TV_MAC || 'f0:bf:97:8a:2d:44').toLowerCase(),
  targetTvIp: process.env.TARGET_TV_IP || '192.168.1.145',
  targetTvPsk: process.env.TARGET_TV_PSK || '0000',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS || 10000),
  telemetryIntervalMs: Number(process.env.TELEMETRY_INTERVAL_MS || 15000),
  routerConfig: {
    ROUTER_HOST: process.env.ROUTER_HOST,
    ROUTER_PORT: process.env.ROUTER_PORT,
    ROUTER_USER: process.env.ROUTER_USER,
    ROUTER_PASSWORD: process.env.ROUTER_PASSWORD,
    MOCK_DELAY_MS: process.env.MOCK_DELAY_MS || 250,
    MOCK_FAILURE_RATE: process.env.MOCK_FAILURE_RATE || 0
  }
};

