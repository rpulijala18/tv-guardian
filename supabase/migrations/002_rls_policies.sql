-- TV Guardian Supabase Row Level Security (RLS)
-- Migration 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parental_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_agents ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. DEVICES POLICIES
CREATE POLICY "Users can view their own devices"
  ON public.devices FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own devices"
  ON public.devices FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own devices"
  ON public.devices FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own devices"
  ON public.devices FOR DELETE
  USING (auth.uid() = owner_id);

-- 3. SCREEN_TIME POLICIES
CREATE POLICY "Users can view screen time of their devices"
  ON public.screen_time FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.devices
      WHERE devices.id = screen_time.device_id
      AND devices.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage screen time of their devices"
  ON public.screen_time FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.devices
      WHERE devices.id = screen_time.device_id
      AND devices.owner_id = auth.uid()
    )
  );

-- 4. PARENTAL_SETTINGS POLICIES
CREATE POLICY "Users can view parental settings for their devices"
  ON public.parental_settings FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert parental settings"
  ON public.parental_settings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their parental settings"
  ON public.parental_settings FOR UPDATE
  USING (auth.uid() = owner_id);

-- 5. SCHEDULES POLICIES
CREATE POLICY "Users can view schedules of their devices"
  ON public.schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.devices
      WHERE devices.id = schedules.device_id
      AND devices.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage schedules of their devices"
  ON public.schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.devices
      WHERE devices.id = schedules.device_id
      AND devices.owner_id = auth.uid()
    )
  );

-- 6. DEVICE_ACTIONS POLICIES
CREATE POLICY "Users can view actions of their devices"
  ON public.device_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.devices
      WHERE devices.id = device_actions.device_id
      AND devices.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert actions for their devices"
  ON public.device_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.devices
      WHERE devices.id = device_actions.device_id
      AND devices.owner_id = auth.uid()
    )
  );

-- 7. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = owner_id);

-- 8. LOCAL_AGENTS POLICIES
CREATE POLICY "Users can view their local agents"
  ON public.local_agents FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their local agents"
  ON public.local_agents FOR ALL
  USING (auth.uid() = owner_id);

-- 9. SERVICE ROLE OVERRIDES
-- Backend API service role key automatically bypasses RLS in Supabase,
-- allowing the local agent gateway to update device telemetry and action completion securely.

