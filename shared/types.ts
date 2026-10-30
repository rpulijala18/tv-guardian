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
  usage_date: string; // YYYY-MM-DD
  duration_seconds: number;
  tracking_method: TrackingMethod;
  updated_at: string;
}

export interface ParentalSettings {
  id: string;
  owner_id: string;
  device_id: string;
  daily_limit_minutes: number;
  bedtime: string; // HH:mm format, e.g. "21:00"
  timezone: string; // e.g. "Asia/Kolkata"
  auto_block_enabled: boolean;
  morning_restriction_enabled: boolean;
  morning_start: string; // "06:00"
  morning_end: string;   // "09:00"
  evening_restriction_enabled: boolean;
  evening_start: string; // "17:00"
  evening_end: string;   // "18:30"
  created_at: string;
  updated_at: string;
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Schedule {
  id: string;
  device_id: string;
  weekday: Weekday;
  allowed_start: string; // HH:mm
  allowed_end: string;   // HH:mm
  enabled: boolean;
  is_weekend?: boolean;
}

export interface DeviceAction {
  id: string;
  device_id: string;
  action_type: ActionType;
  requested_by: string;
  execution_status: ExecutionStatus;
  verification_status: VerificationStatus;
  executed_at: string | null;
  details?: {
    router_adapter?: string;
    verified_via?: string;
    error_message?: string;
    duration_minutes?: number;
    notes?: string;
  };
  created_at: string;
}

export interface NotificationItem {
  id: string;
  owner_id: string;
  title: string;
  message: string;
  category: 'device' | 'screen_time' | 'enforcement' | 'agent' | 'security';
  read: boolean;
  created_at: string;
}

export interface LocalAgentStatus {
  id: string;
  owner_id: string;
  agent_name: string;
  version: string;
  ip_address: string;
  hostname: string;
  router_adapter: string;
  status: 'online' | 'offline' | 'degraded';
  last_heartbeat: string;
  capabilities: {
    router_block: boolean;
    bravia_api: boolean;
    arp_scan: boolean;
    traffic_monitoring: boolean;
  };
}

export interface DashboardSummary {
  device: Device | null;
  agent: LocalAgentStatus | null;
  screenTimeToday: {
    totalSeconds: number;
    totalMinutes: number;
    remainingMinutes: number;
    dailyLimitMinutes: number;
    percentConsumed: number;
    trackingMethod: TrackingMethod;
    isViewingNow: boolean;
    isLimitReached: boolean;
  };
  quickControls: {
    canBlock: boolean;
    canUnblock: boolean;
    isBlocked: boolean;
    parentalLockActive: boolean;
  };
  recentActions: DeviceAction[];
  notifications: NotificationItem[];
}

export interface UsageAnalyticsData {
  daily: { date: string; day: string; minutes: number; limitMinutes: number; isActual: boolean }[];
  weekly: { week: string; minutes: number; averageDaily: number }[];
  monthly: { month: string; totalHours: number; violations: number }[];
  hourlyActivity: { hour: string; label: string; activeMinutes: number }[];
  summary: {
    todayMinutes: number;
    averageDailyMinutes: number;
    totalViolations: number;
    automaticBlocks: number;
    manualOverrides: number;
    actualTrackedPercent: number;
  };
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

