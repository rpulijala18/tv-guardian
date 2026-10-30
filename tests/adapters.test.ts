import { describe, it, expect, beforeEach } from 'vitest';
import { MockRouterAdapter } from '../adapters/mock-router.js';

describe('Router Adapters - Hardware Blocking Architecture', () => {
  let router: MockRouterAdapter;
  const TV_MAC = 'f0:bf:97:8a:2d:44';
  const TV_IP = '192.168.1.145';

  beforeEach(() => {
    router = new MockRouterAdapter({ simulatedDelayMs: 10, failureRate: 0 });
  });

  it('initializes with available status', async () => {
    const isAvail = await router.isAvailable();
    expect(isAvail).toBe(true);
  });

  it('blocks target TV and verifies hardware drop status', async () => {
    const blockResult = await router.blockInternet(TV_MAC, TV_IP);
    expect(blockResult.success).toBe(true);
    expect(blockResult.status).toBe('blocked');
    expect(blockResult.mac).toBe(TV_MAC.toLowerCase());

    // Verify status returns blocked
    const status = await router.verifyStatus(TV_MAC, TV_IP);
    expect(status).toBe('blocked');
  });

  it('unblocks target TV and verifies internet restoration', async () => {
    // First block
    await router.blockInternet(TV_MAC, TV_IP);

    // Unblock
    const unblockResult = await router.unblockInternet(TV_MAC, TV_IP);
    expect(unblockResult.success).toBe(true);
    expect(unblockResult.status).toBe('allowed');

    // Verify status returns allowed
    const status = await router.verifyStatus(TV_MAC, TV_IP);
    expect(status).toBe('allowed');
  });

  it('reports zero WAN throughput when device is blocked', async () => {
    await router.blockInternet(TV_MAC, TV_IP);
    const stats = await router.getDeviceStats(TV_MAC, TV_IP);
    expect(stats.transferRateKbps).toBe(0);
  });

  it('never falsely reports success if router is offline', async () => {
    router.setOnline(false);
    const result = await router.blockInternet(TV_MAC, TV_IP);
    expect(result.success).toBe(false);
    expect(result.status).toBe('unknown');
    expect(result.error).toContain('Router hardware unreachable');
  });
});
