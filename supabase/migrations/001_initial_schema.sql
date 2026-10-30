-- TV Guardian Supabase Initial Schema
-- Migration 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'guardian')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DEVICES
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'Sony Bravia',
  ip_address TEXT NOT NULL,
  mac_address TEXT NOT NULL,
  bravia_psk TEXT,
  connection_status TEXT NOT NULL DEFAULT 'unknown' CHECK (connection_status IN ('online', 'offline', 'unknown')),
  internet_status TEXT NOT NULL DEFAULT 'allowed' CHECK (internet_status IN ('allowed', 'blocked', 'restricted', 'verifying')),
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_owner_mac UNIQUE (owner_id, mac_address)
);

CREATE INDEX IF NOT EXISTS idx_devices_owner ON public.devices(owner_id);
CREATE INDEX IF NOT EXISTS idx_devices_mac ON public.devices(mac_address);

-- 3. SCREEN_TIME
CREATE TABLE IF NOT EXISTS public.screen_time (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  usage_date DATE NOT NULL,
  duration_seconds INTEGER DEFAULT 0 NOT NULL,
  tracking_method TEXT DEFAULT 'bravia_active_telemetry' NOT NULL CHECK (tracking_method IN ('bravia_active_telemetry', 'router_traffic_flow', 'estimated_ping', 'manual_override')),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_device_date UNIQUE (device_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_screen_time_device_date ON public.screen_time(device_id, usage_date);

-- 4. PARENTAL_SETTINGS
CREATE TABLE IF NOT EXISTS public.parental_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  daily_limit_minutes INTEGER DEFAULT 120 NOT NULL CHECK (daily_limit_minutes > 0),
  bedtime TEXT DEFAULT '21:00' NOT NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata' NOT NULL,
  auto_block_enabled BOOLEAN DEFAULT true NOT NULL,
  morning_restriction_enabled BOOLEAN DEFAULT false NOT NULL,
  morning_start TEXT DEFAULT '06:00' NOT NULL,
  morning_end TEXT DEFAULT '09:00' NOT NULL,
  evening_restriction_enabled BOOLEAN DEFAULT false NOT NULL,
  evening_start TEXT DEFAULT '17:00' NOT NULL,
  evening_end TEXT DEFAULT '18:30' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_device_settings UNIQUE (device_id)
);

CREATE INDEX IF NOT EXISTS idx_settings_device ON public.parental_settings(device_id);

-- 5. SCHEDULES
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  weekday TEXT NOT NULL CHECK (weekday IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  allowed_start TEXT NOT NULL, -- HH:mm format
  allowed_end TEXT NOT NULL,   -- HH:mm format
  enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedules_device_weekday ON public.schedules(device_id, weekday);

-- 6. DEVICE_ACTIONS
CREATE TABLE IF NOT EXISTS public.device_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('block', 'unblock', 'status_check', 'extend_time', 'pause_30m', 'pause_60m')),
  requested_by TEXT NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'pending' CHECK (execution_status IN ('pending', 'in_progress', 'completed', 'failed')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'failed')),
  executed_at TIMESTAMPTZ,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_actions_device_status ON public.device_actions(device_id, execution_status);

-- 7. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' NOT NULL CHECK (category IN ('device', 'screen_time', 'enforcement', 'agent', 'security', 'general')),
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_owner_read ON public.notifications(owner_id, read);

-- 8. LOCAL_AGENTS
CREATE TABLE IF NOT EXISTS public.local_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_name TEXT NOT NULL DEFAULT 'Home Network Controller',
  auth_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  hostname TEXT,
  router_adapter TEXT DEFAULT 'mock' NOT NULL,
  status TEXT DEFAULT 'offline' NOT NULL CHECK (status IN ('online', 'offline', 'degraded')),
  capabilities JSONB DEFAULT '{"router_block": true, "bravia_api": true, "arp_scan": true, "traffic_monitoring": true}'::jsonb,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_agents_owner ON public.local_agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_local_agents_token ON public.local_agents(auth_token);

