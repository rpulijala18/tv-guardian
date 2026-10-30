export type DeviceConnectionStatus = 'online' | 'offline' | 'unknown';
export type DeviceInternetStatus = 'allowed' | 'blocked' | 'restricted' | 'verifying';
export type TrackingMethod = 'bravia_active_telemetry' | 'router_traffic_flow' | 'estimated_ping' | 'manual_override';
export type ActionType = 'block' | 'unblock' | 'status_check' | 'extend_time' | 'pause_30m' | 'pause_60m';
export type ExecutionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type VerificationStatus = 'verified' | 'unverified' | 'failed';

export interface Device {
  id: string;
  owner_id: string;
  device_name: string;
  device_type: 'Sony Bravia' | 'Android TV' | 'Google TV' | 'Smart TV' | 'Other';
  ip_address: string;
  mac_address: string;
  bravia_psk?: string;
  connection_status: DeviceConnectionStatus;
  internet_status: DeviceInternetStatus;
  last_seen: string | null;
  created_at: string;
}

export interface ScreenTime {
  id: string;
  device_id: string;
  usage_date: string;
  duration_seconds: number;
  tracking_method: TrackingMethod;
  updated_at: string;
}

export interface SonyBraviaSystemInfo {
  product: string;
  model: string;
  serial: string;
  macAddr: string;
  powerStatus: 'active' | 'standby';
  currentApp?: string;
  volume?: number;
  isMuted?: boolean;
}

