import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Service-role client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// User-scoped client factory for RLS-enforced operations
export function createUserClient(accessToken: string) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
