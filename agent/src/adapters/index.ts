import { RouterAdapter } from './router-base.js';
import { MockRouterAdapter } from './mock-router.js';
import { OpenWrtRouterAdapter } from './openwrt.js';
import { AsusWrtRouterAdapter } from './asuswrt.js';
import { UniFiRouterAdapter } from './unifi.js';
import { TPLinkRouterAdapter } from './tplink.js';
import { ArpGuardAdapter } from './arp-guard.js';

export * from './router-base.js';
export * from './mock-router.js';
export * from './openwrt.js';
export * from './asuswrt.js';
export * from './unifi.js';
export * from './tplink.js';
export * from './arp-guard.js';

export function createRouterAdapter(type: string, config: any = {}): RouterAdapter {
  switch (type.toLowerCase()) {
    case 'openwrt':
      return new OpenWrtRouterAdapter({
        host: config.ROUTER_HOST || '192.168.1.1',
        port: Number(config.ROUTER_PORT || 22),
        username: config.ROUTER_USER || 'root',
        password: config.ROUTER_PASSWORD,
        sshKeyPath: config.ROUTER_KEY_PATH,
        useNftables: config.OPENWRT_NFTABLES !== 'false'
      });

    case 'asuswrt':
      return new AsusWrtRouterAdapter({
        host: config.ROUTER_HOST || '192.168.50.1',
        port: Number(config.ROUTER_PORT || 22),
        username: config.ROUTER_USER || 'admin',
        password: config.ROUTER_PASSWORD
      });

    case 'unifi':
      return new UniFiRouterAdapter({
        controllerUrl: config.UNIFI_CONTROLLER_URL || 'https://192.168.1.1:8443',
        apiKey: config.UNIFI_API_KEY,
        site: config.UNIFI_SITE || 'default'
      });

    case 'tplink':
      return new TPLinkRouterAdapter({
        gatewayIp: config.ROUTER_HOST || '192.168.0.1',
        adminPassword: config.ROUTER_PASSWORD
      });

    case 'arpguard':
      return new ArpGuardAdapter({
        gatewayIp: config.ROUTER_HOST || '192.168.1.1',
        interfaceName: config.NETWORK_INTERFACE
      });

    case 'mock':
    default:
      return new MockRouterAdapter({
        simulatedDelayMs: Number(config.MOCK_DELAY_MS || 250),
        failureRate: Number(config.MOCK_FAILURE_RATE || 0)
      });
  }
}

