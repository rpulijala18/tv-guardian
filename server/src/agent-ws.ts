import { WebSocketServer, WebSocket } from 'ws';
import { supabaseAdmin } from './lib/supabase.js';
import { config } from './config.js';

interface AgentMessage {
  type: string;
  payload: any;
  requestId?: string;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeout: NodeJS.Timeout;
}

class AgentBus {
  private ws: WebSocket | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private agentOnline = false;
  private agentInfo: any = null;
  private wss: WebSocketServer | null = null;

  init(server: any) {
    this.wss = new WebSocketServer({ server, path: '/agent-ws' });

    this.wss.on('connection', (socket, req) => {
      const agentToken = req.headers['x-agent-token'];
      if (agentToken !== config.agentAuthToken) {
        socket.close(4003, 'Unauthorized');
        return;
      }

      console.log('[AgentBus] Local agent connected');
      this.ws = socket;
      this.agentOnline = true;

      socket.on('message', (data) => {
        try {
          const msg: AgentMessage = JSON.parse(data.toString());
          this.handleAgentMessage(msg);
        } catch {}
      });

      socket.on('close', async () => {
        console.log('[AgentBus] Agent disconnected');
        this.ws = null;
        this.agentOnline = false;
        this.agentInfo = null;
        // Notify all owners their agent went offline
        try {
          if (this.agentInfo?.owner_id) {
            await supabaseAdmin.from('notifications').insert({
              owner_id: this.agentInfo.owner_id,
              title: 'Local Agent Offline',
              message: 'The TV Guardian local network agent has disconnected. Automatic enforcement is paused.',
              category: 'agent',
              read: false
            });
          }
        } catch {}
      });
    });
  }

  private handleAgentMessage(msg: AgentMessage) {
    if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
      const pending = this.pendingRequests.get(msg.requestId)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(msg.requestId);
      pending.resolve(msg.payload);
      return;
    }

    switch (msg.type) {
      case 'heartbeat':
        this.agentInfo = msg.payload;
        this.updateAgentStatus(msg.payload);
        break;
      case 'telemetry':
        this.processTelemetry(msg.payload);
        break;
      case 'notification':
        this.forwardNotification(msg.payload);
        break;
    }
  }

  private async updateAgentStatus(info: any) {
    if (!info?.auth_token) return;
    await supabaseAdmin.from('local_agents').upsert({
      auth_token: info.auth_token,
      status: 'online',
      last_heartbeat: new Date().toISOString(),
      hostname: info.hostname,
      ip_address: info.ip_address,
      router_adapter: info.router_adapter,
      capabilities: info.capabilities,
      owner_id: info.owner_id
    }, { onConflict: 'auth_token' });
  }

  private async processTelemetry(payload: any) {
    if (!payload?.mac || !payload?.device_id) return;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: config.timezone });

    await supabaseAdmin.from('devices').update({
      connection_status: payload.isOnline ? 'online' : 'offline',
      internet_status: payload.verifiedInternetStatus === 'blocked' ? 'blocked' : 'allowed',
      last_seen: payload.isOnline ? new Date().toISOString() : undefined
    }).eq('id', payload.device_id);

    if (payload.isViewing) {
      const addSeconds = Math.round((payload.telemetryIntervalMs || 15000) / 1000);
      try {
        await supabaseAdmin.from('screen_time').upsert({
          device_id: payload.device_id,
          usage_date: today,
          duration_seconds: addSeconds,
          tracking_method: payload.trackingMethod,
          updated_at: new Date().toISOString()
        }, { onConflict: 'device_id,usage_date' });
      } catch {}
    }
  }

  private async forwardNotification(payload: any) {
    if (payload?.owner_id) {
      await supabaseAdmin.from('notifications').insert(payload);
    }
  }

  private sendToAgent(msg: AgentMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(msg));
    return true;
  }

  private async requestFromAgent(type: string, payload: any, timeoutMs = 10000): Promise<any> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Agent request timed out'));
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      const sent = this.sendToAgent({ type, payload, requestId });
      if (!sent) {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        reject(new Error('Agent not connected'));
      }
    });
  }

  isAgentOnline(): boolean {
    return this.agentOnline && this.ws?.readyState === WebSocket.OPEN;
  }

  async sendBlockCommand(mac: string, ip: string, action: 'block' | 'unblock'): Promise<any> {
    try {
      return await this.requestFromAgent('block_command', { mac, ip, action });
    } catch {
      return { success: false, error: 'Agent offline or request timed out', status: 'unknown' };
    }
  }

  async requestDeviceStatus(mac: string): Promise<any> {
    try {
      return await this.requestFromAgent('status_request', { mac });
    } catch {
      return null;
    }
  }
}

export const agentBus = new AgentBus();
