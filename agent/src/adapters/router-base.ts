export interface RouterBlockResult {
  success: boolean;
  mac: string;
  action: 'block' | 'unblock';
  status: 'allowed' | 'blocked' | 'unknown';
  details?: string;
  error?: string;
  timestamp: string;
}

export interface DeviceStats {
  mac: string;
  ip?: string;
  isOnline: boolean;
  rxBytes?: number;
  txBytes?: number;
  transferRateKbps?: number;
}

export interface RouterAdapter {
  readonly name: string;
  readonly type: string;
  readonly description: string;

  /**
   * Check if router is reachable and authorized
   */
  isAvailable(): Promise<boolean>;

  /**
   * Block internet for target MAC address
   */
  blockInternet(mac: string, ip?: string): Promise<RouterBlockResult>;

  /**
   * Unblock internet for target MAC address
   */
  unblockInternet(mac: string, ip?: string): Promise<RouterBlockResult>;

  /**
   * Verify actual blocking status at the hardware / firewall level
   */
  verifyStatus(mac: string, ip?: string): Promise<'allowed' | 'blocked' | 'unknown'>;

  /**
   * Retrieve device network stats and traffic flow
   */
  getDeviceStats(mac: string, ip?: string): Promise<DeviceStats>;
}

