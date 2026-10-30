import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('parental_settings')
    .select('*')
    .eq('owner_id', req.userId!);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ settings: data });
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { device_id, daily_limit_minutes, bedtime, timezone, auto_block_enabled,
    morning_restriction_enabled, morning_start, morning_end,
    evening_restriction_enabled, evening_start, evening_end } = req.body;

  const { data, error } = await supabaseAdmin
    .from('parental_settings')
    .upsert({
      owner_id: req.userId!,
      device_id,
      daily_limit_minutes,
      bedtime,
      timezone: timezone || 'Asia/Kolkata',
      auto_block_enabled,
      morning_restriction_enabled,
      morning_start,
      morning_end,
      evening_restriction_enabled,
      evening_start,
      evening_end,
      updated_at: new Date().toISOString()
    }, { onConflict: 'device_id' })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ settings: data });
});

export default router;
