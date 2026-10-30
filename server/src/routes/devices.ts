import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { agentBus } from '../agent-ws.js';

const router = Router();

// GET /api/devices - list owner devices
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('*')
    .eq('owner_id', req.userId!)
    .order('created_at', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ devices: data });
});

// POST /api/devices - register device
router.post('/',
  requireAuth,
  body('device_name').isString().isLength({ min: 1, max: 100 }),
  body('ip_address').isIP(),
  body('mac_address').matches(/^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/),
  body('device_type').optional().isString(),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const { device_name, ip_address, mac_address, device_type, bravia_psk } = req.body;

    const { data, error } = await supabaseAdmin
      .from('devices')
      .insert({
        owner_id: req.userId!,
        device_name,
        ip_address,
        mac_address: mac_address.toLowerCase(),
        device_type: device_type || 'Sony Bravia',
        bravia_psk: bravia_psk || null,
        connection_status: 'unknown',
        internet_status: 'allowed'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { res.status(409).json({ error: 'A device with this MAC address is already registered.' }); return; }
      res.status(500).json({ error: error.message }); return;
    }

    // Create default parental settings for device
    await supabaseAdmin.from('parental_settings').insert({
      owner_id: req.userId!,
      device_id: data.id,
      daily_limit_minutes: 120,
      bedtime: '21:00',
      timezone: 'Asia/Kolkata',
      auto_block_enabled: true
    });

    // Create default weekly schedule (Mon-Fri 6PM-8PM, Weekends 10AM-8PM)
    const weekdays = ['monday','tuesday','wednesday','thursday','friday'];
    const weekend = ['saturday','sunday'];
    const schedules = [
      ...weekdays.map(d => ({ device_id: data.id, weekday: d, allowed_start: '18:00', allowed_end: '20:00', enabled: true })),
      ...weekend.map(d => ({ device_id: data.id, weekday: d, allowed_start: '10:00', allowed_end: '20:00', enabled: true }))
    ];
    await supabaseAdmin.from('schedules').insert(schedules);

    res.status(201).json({ device: data });
  }
);

// GET /api/devices/:id - single device
router.get('/:id', requireAuth, param('id').isUUID(), async (req: AuthRequest, res: Response): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('*')
    .eq('id', req.params.id)
    .eq('owner_id', req.userId!)
    .single();

  if (error || !data) { res.status(404).json({ error: 'Device not found' }); return; }
  res.json({ device: data });
});

// PATCH /api/devices/:id - update device name/ip/psk
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const allowed = ['device_name','ip_address','bravia_psk'];
  const updates: Record<string,any> = {};
  for (const k of allowed) { if (req.body[k] !== undefined) updates[k] = req.body[k]; }

  const { data, error } = await supabaseAdmin
    .from('devices').update(updates)
    .eq('id', req.params.id).eq('owner_id', req.userId!).select().single();

  if (error || !data) { res.status(404).json({ error: 'Device not found or update failed' }); return; }
  res.json({ device: data });
});

// DELETE /api/devices/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('devices').delete().eq('id', req.params.id).eq('owner_id', req.userId!);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

// GET /api/devices/:id/status
router.get('/:id/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data: device, error } = await supabaseAdmin
    .from('devices').select('*').eq('id', req.params.id).eq('owner_id', req.userId!).single();

  if (error || !device) { res.status(404).json({ error: 'Device not found' }); return; }

  // Request fresh status from local agent
  const agentResult = await agentBus.requestDeviceStatus(device.mac_address);

  res.json({
    device,
    agentStatus: agentResult,
    agentAvailable: agentBus.isAgentOnline()
  });
});

// POST /api/devices/:id/block
router.post('/:id/block', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data: device, error } = await supabaseAdmin
    .from('devices').select('*').eq('id', req.params.id).eq('owner_id', req.userId!).single();

  if (error || !device) { res.status(404).json({ error: 'Device not found' }); return; }

  if (!agentBus.isAgentOnline()) {
    res.status(503).json({
      error: 'Local network agent is offline. Cannot enforce hardware-level blocking without the agent running on your home network.',
      code: 'AGENT_OFFLINE'
    });
    return;
  }

  // Log pending action
  const { data: action } = await supabaseAdmin.from('device_actions').insert({
    device_id: device.id,
    action_type: 'block',
    requested_by: req.userEmail!,
    execution_status: 'pending',
    verification_status: 'unverified'
  }).select().single();

  // Send blocking command to local agent
  const result = await agentBus.sendBlockCommand(device.mac_address, device.ip_address, 'block');

  const executionStatus = result.success ? 'completed' : 'failed';
  const verificationStatus = result.status === 'blocked' ? 'verified' : 'failed';

  // Update action record
  await supabaseAdmin.from('device_actions').update({
    execution_status: executionStatus,
    verification_status: verificationStatus,
    executed_at: new Date().toISOString(),
    details: { router_adapter: result.adapter, verified_via: 'agent_hardware_verification', error_message: result.error }
  }).eq('id', action?.id);

  // Update device internet status only if verified
  if (verificationStatus === 'verified') {
    await supabaseAdmin.from('devices').update({
      internet_status: 'blocked'
    }).eq('id', device.id);

    // Send notification
    await supabaseAdmin.from('notifications').insert({
      owner_id: req.userId!,
      title: 'TV Internet Blocked',
      message: `Internet access for ${device.device_name} has been blocked and verified at the router level.`,
      category: 'enforcement',
      read: false
    });
  }

  if (!result.success) {
    res.status(502).json({
      error: result.error || 'Blocking command failed at router hardware level',
      details: result,
      action_id: action?.id
    });
    return;
  }

  res.json({
    success: result.success,
    verified: verificationStatus === 'verified',
    status: result.status,
    details: result.details,
    action_id: action?.id
  });
});

// POST /api/devices/:id/unblock
router.post('/:id/unblock', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data: device, error } = await supabaseAdmin
    .from('devices').select('*').eq('id', req.params.id).eq('owner_id', req.userId!).single();

  if (error || !device) { res.status(404).json({ error: 'Device not found' }); return; }

  if (!agentBus.isAgentOnline()) {
    res.status(503).json({ error: 'Local network agent is offline', code: 'AGENT_OFFLINE' });
    return;
  }

  const { data: action } = await supabaseAdmin.from('device_actions').insert({
    device_id: device.id,
    action_type: 'unblock',
    requested_by: req.userEmail!,
    execution_status: 'pending',
    verification_status: 'unverified'
  }).select().single();

  const result = await agentBus.sendBlockCommand(device.mac_address, device.ip_address, 'unblock');
  const executionStatus = result.success ? 'completed' : 'failed';
  const verificationStatus = result.status === 'allowed' ? 'verified' : 'failed';

  await supabaseAdmin.from('device_actions').update({
    execution_status: executionStatus,
    verification_status: verificationStatus,
    executed_at: new Date().toISOString(),
    details: { router_adapter: result.adapter, error_message: result.error }
  }).eq('id', action?.id);

  if (verificationStatus === 'verified') {
    await supabaseAdmin.from('devices').update({ internet_status: 'allowed' }).eq('id', device.id);
    await supabaseAdmin.from('notifications').insert({
      owner_id: req.userId!,
      title: 'TV Internet Restored',
      message: `Internet access for ${device.device_name} has been restored and verified.`,
      category: 'enforcement',
      read: false
    });
  }

  if (!result.success) {
    res.status(502).json({ error: result.error || 'Unblock failed at router level', details: result });
    return;
  }

  res.json({ success: result.success, verified: verificationStatus === 'verified', status: result.status, details: result.details });
});

// GET /api/devices/:id/usage
router.get('/:id/usage', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { data: device } = await supabaseAdmin.from('devices').select('id').eq('id', req.params.id).eq('owner_id', req.userId!).single();
  if (!device) { res.status(404).json({ error: 'Device not found' }); return; }

  const days = Number(req.query.days || 30);
  const from = new Date();
  from.setDate(from.getDate() - days);

  const { data } = await supabaseAdmin
    .from('screen_time')
    .select('*')
    .eq('device_id', req.params.id)
    .gte('usage_date', from.toISOString().split('T')[0])
    .order('usage_date', { ascending: false });

  res.json({ usage: data || [] });
});

export default router;
