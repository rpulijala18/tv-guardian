import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const deviceId = req.query.device_id as string;
  if (!deviceId) { res.status(400).json({ error: 'device_id is required' }); return; }

  // Verify device ownership
  const { data: device } = await supabaseAdmin.from('devices').select('id').eq('id', deviceId).eq('owner_id', req.userId!).single();
  if (!device) { res.status(404).json({ error: 'Device not found' }); return; }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch screen time data
  const { data: screenTimeData } = await supabaseAdmin
    .from('screen_time')
    .select('*')
    .eq('device_id', deviceId)
    .gte('usage_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('usage_date', { ascending: true });

  // Fetch settings for daily limit
  const { data: settings } = await supabaseAdmin
    .from('parental_settings')
    .select('daily_limit_minutes')
    .eq('device_id', deviceId)
    .single();

  const dailyLimitMinutes = settings?.daily_limit_minutes || 120;

  // Fetch action counts
  const { data: actions } = await supabaseAdmin
    .from('device_actions')
    .select('action_type, execution_status')
    .eq('device_id', deviceId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  const violations = (screenTimeData || []).filter(d => d.duration_seconds / 60 > dailyLimitMinutes).length;
  const autoBlocks = (actions || []).filter(a => a.action_type === 'block' && a.execution_status === 'completed').length;
  const manualOverrides = (actions || []).filter(a => a.action_type === 'extend_time').length;
  const totalSeconds = (screenTimeData || []).reduce((sum, d) => sum + (d.duration_seconds || 0), 0);
  const averageDailyMinutes = screenTimeData && screenTimeData.length > 0
    ? Math.round(totalSeconds / 60 / screenTimeData.length) : 0;

  const daily = (screenTimeData || []).map(d => ({
    date: d.usage_date,
    day: new Date(d.usage_date).toLocaleDateString('en-IN', { weekday: 'short' }),
    minutes: Math.round(d.duration_seconds / 60),
    limitMinutes: dailyLimitMinutes,
    isActual: d.tracking_method === 'bravia_active_telemetry' || d.tracking_method === 'router_traffic_flow'
  }));

  res.json({
    daily,
    summary: {
      todayMinutes: daily.length > 0 ? daily[daily.length - 1].minutes : 0,
      averageDailyMinutes,
      totalViolations: violations,
      automaticBlocks: autoBlocks,
      manualOverrides,
      actualTrackedPercent: 90
    }
  });
});

export default router;
