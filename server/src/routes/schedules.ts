import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

router.get('/:deviceId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('schedules')
    .select('*')
    .eq('device_id', req.params.deviceId)
    .order('weekday', { ascending: true });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ schedules: data });
});

router.put('/:deviceId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { schedules } = req.body as { schedules: Array<{weekday: string; allowed_start: string; allowed_end: string; enabled: boolean}> };

  // Delete existing schedules and reinsert
  await supabaseAdmin.from('schedules').delete().eq('device_id', req.params.deviceId);

  if (schedules && schedules.length > 0) {
    const rows = schedules.map(s => ({ device_id: req.params.deviceId, ...s }));
    const { data, error } = await supabaseAdmin.from('schedules').insert(rows).select();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ schedules: data });
  } else {
    res.json({ schedules: [] });
  }
});

export default router;
