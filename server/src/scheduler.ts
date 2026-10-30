import { supabaseAdmin } from './lib/supabase.js';
import { agentBus } from './agent-ws.js';

const TIMEZONE = 'Asia/Kolkata';

function getNowInTZ(): { hour: number; minute: number; weekday: string; date: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    hour: '2-digit', minute: '2-digit', weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
    hour12: false
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  return {
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: get('weekday').toLowerCase(),
    date: `${get('year')}-${get('month')}-${get('day')}`
  };
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export class ScheduleEnforcer {
  private intervalId?: NodeJS.Timeout;

  start() {
    // Run enforcement every minute
    this.intervalId = setInterval(() => this.enforce(), 60 * 1000);
    console.log('[Scheduler] Schedule enforcer started — checking every 60s');
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async enforce() {
    if (!agentBus.isAgentOnline()) return;

    const { hour, minute, weekday, date } = getNowInTZ();
    const currentMinutes = hour * 60 + minute;

    // Fetch all devices with auto_block enabled and their schedules
    const { data: settingsRows } = await supabaseAdmin
      .from('parental_settings')
      .select('*, devices!inner(*)')
      .eq('auto_block_enabled', true);

    if (!settingsRows) return;

    for (const row of settingsRows) {
      const device = (row as any).devices;
      if (!device) continue;

      // Check bedtime
      const bedtimeMinutes = timeToMinutes(row.bedtime || '21:00');
      if (currentMinutes >= bedtimeMinutes) {
        // Bedtime — block if not already blocked
        if (device.internet_status !== 'blocked') {
          await agentBus.sendBlockCommand(device.mac_address, device.ip_address, 'block');
          await supabaseAdmin.from('devices').update({ internet_status: 'blocked' }).eq('id', device.id);
          await supabaseAdmin.from('notifications').insert({
            owner_id: row.owner_id,
            title: 'Bedtime Block Applied',
            message: `Bedtime reached (${row.bedtime}). TV internet blocked automatically.`,
            category: 'enforcement', read: false
          });
        }
        continue;
      }

      // Check schedule for today's weekday
      const { data: schedules } = await supabaseAdmin
        .from('schedules')
        .select('*')
        .eq('device_id', device.id)
        .eq('weekday', weekday)
        .eq('enabled', true);

      let isInAllowedPeriod = false;
      if (schedules && schedules.length > 0) {
        for (const schedule of schedules) {
          const startMin = timeToMinutes(schedule.allowed_start);
          const endMin = timeToMinutes(schedule.allowed_end);
          if (currentMinutes >= startMin && currentMinutes < endMin) {
            isInAllowedPeriod = true;
            break;
          }
        }
      } else {
        // No schedule defined for today — default: allow
        isInAllowedPeriod = true;
      }

      // Check screen time limit
      const { data: screenTime } = await supabaseAdmin
        .from('screen_time')
        .select('duration_seconds')
        .eq('device_id', device.id)
        .eq('usage_date', date)
        .single();

      const usedMinutes = Math.round((screenTime?.duration_seconds || 0) / 60);
      const limitReached = usedMinutes >= (row.daily_limit_minutes || 120);

      const shouldBlock = !isInAllowedPeriod || limitReached;
      const currentlyBlocked = device.internet_status === 'blocked';

      if (shouldBlock && !currentlyBlocked) {
        await agentBus.sendBlockCommand(device.mac_address, device.ip_address, 'block');
        await supabaseAdmin.from('devices').update({ internet_status: 'blocked' }).eq('id', device.id);
        await supabaseAdmin.from('notifications').insert({
          owner_id: row.owner_id,
          title: limitReached ? 'Screen Time Limit Reached' : 'Outside Permitted Hours',
          message: limitReached
            ? `Daily limit of ${row.daily_limit_minutes} minutes reached. TV internet blocked.`
            : `Current time is outside the permitted schedule. TV internet blocked.`,
          category: 'enforcement', read: false
        });
      } else if (!shouldBlock && currentlyBlocked) {
        await agentBus.sendBlockCommand(device.mac_address, device.ip_address, 'unblock');
        await supabaseAdmin.from('devices').update({ internet_status: 'allowed' }).eq('id', device.id);
        await supabaseAdmin.from('notifications').insert({
          owner_id: row.owner_id,
          title: 'TV Internet Restored',
          message: `Scheduled permitted period started. TV internet access restored.`,
          category: 'enforcement', read: false
        });
      }
    }
  }
}

export const scheduleEnforcer = new ScheduleEnforcer();
