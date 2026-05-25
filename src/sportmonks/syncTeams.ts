import type { SupabaseClient } from '@supabase/supabase-js';
import { SportmonksClient } from './client';
import { normalizeTeam } from './normalizers';

export async function syncTeams(
  client: SportmonksClient,
  seasonId: number,
  leagueId: number,
  db: SupabaseClient,
): Promise<void> {
  const rawTeams = await client.getTeams(seasonId);

  const rows = rawTeams.map((r) => {
    const { row, warnings } = normalizeTeam(r, leagueId);
    if (warnings.length > 0) console.warn('[syncTeams] warnings:', warnings);
    return row;
  });

  if (rows.length === 0) {
    console.warn('[syncTeams] no teams returned for season', seasonId);
    return;
  }

  const { error } = await db.from('teams').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`teams upsert failed: ${error.message}`);
  console.log(`[syncTeams] upserted ${rows.length} teams for season ${seasonId}`);
}
