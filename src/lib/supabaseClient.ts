import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || url.trim() === '') {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  if (!key || key.trim() === '') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}
