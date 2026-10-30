import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('owner_id', req.userId!)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ notifications: data });
});

router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  await supabaseAdmin.from('notifications').update({ read: true }).eq('id', req.params.id).eq('owner_id', req.userId!);
  res.json({ success: true });
});

router.patch('/mark-all-read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  await supabaseAdmin.from('notifications').update({ read: true }).eq('owner_id', req.userId!);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  await supabaseAdmin.from('notifications').delete().eq('id', req.params.id).eq('owner_id', req.userId!);
  res.json({ success: true });
});

export default router;
