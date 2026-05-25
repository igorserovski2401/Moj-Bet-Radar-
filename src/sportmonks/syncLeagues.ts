import type { SupabaseClient } from '@supabase/supabase-js';
import { SportmonksClient } from './client';
import { normalizeLeague, normalizeSeason } from './normalizers';

export async function syncLeague(
  client: SportmonksClient,
  leagueId: number,
  db: SupabaseClient,
): Promise<void> {
  const rawLeague = await client.getLeague(leagueId);
  const { row: leagueRow, warnings } = normalizeLeague(rawLeague);
  if (warnings.length > 0) console.warn('[syncLeague] warnings:', warnings);

  const { error: leagueErr } = await db
    .from('leagues')
    .upsert(leagueRow, { onConflict: 'id' });
  if (leagueErr) throw new Error(`leagues upsert failed: ${leagueErr.message}`);
  console.log(`[syncLeague] upserted league ${leagueRow.id} (${leagueRow.name})`);
}

export async function syncSeasons(
  client: SportmonksClient,
  leagueId: number,
  db: SupabaseClient,
): Promise<void> {
  const rawSeasons = await client.getSeasons(leagueId);
  const rows = rawSeasons
    .map((r) => normalizeSeason(r, leagueId))
    .flatMap(({ row, warnings }) => {
      if (warnings.length > 0) console.warn('[syncSeasons] warnings:', warnings);
      return [row];
    });

  if (rows.length === 0) {
    console.warn('[syncSeasons] no seasons returned for league', leagueId);
    return;
  }

  const { error } = await db.from('seasons').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`seasons upsert failed: ${error.message}`);
  console.log(`[syncSeasons] upserted ${rows.length} seasons for league ${leagueId}`);
}
