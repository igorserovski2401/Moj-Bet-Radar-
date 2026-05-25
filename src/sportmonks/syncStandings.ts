import type { SupabaseClient } from '@supabase/supabase-js';
import { SportmonksClient } from './client';
import { normalizeStandingRow } from './normalizers';

export async function syncStandings(
  client: SportmonksClient,
  seasonId: number,
  db: SupabaseClient,
): Promise<void> {
  const rawData = await client.getStandings(seasonId);

  // Sportmonks may return a single object (one group) or an array (multiple groups/stages)
  const groups: unknown[] = Array.isArray(rawData) ? rawData : [rawData];
  const now = new Date().toISOString();

  const standingRows = [];
  for (const group of groups) {
    // Each group may have a `standings` sub-array, or the items may be the group itself
    const groupObj = group as Record<string, unknown>;
    const items: unknown[] = Array.isArray(groupObj['standings'])
      ? groupObj['standings']
      : Array.isArray(group)
      ? group as unknown[]
      : [group];

    for (const raw of items) {
      const { row, warnings } = normalizeStandingRow(raw, seasonId);
      if (warnings.length > 0) console.warn('[syncStandings] warnings:', warnings);
      if (row.team_id === 0) continue;  // skip rows with no team
      standingRows.push(row);
    }
  }

  if (standingRows.length === 0) {
    console.warn('[syncStandings] no standings rows extracted for season', seasonId);
    return;
  }

  // Store raw snapshot
  const { error: snapErr } = await db.from('match_feature_snapshots').insert({
    fixture_id: null,
    feature_key: 'standings',
    raw_payload: rawData as Record<string, unknown>,
    normalized_payload: null,
    provider: 'sportmonks',
    fetched_at: now,
    status: 'success',
    error_message: null,
  });
  if (snapErr) {
    console.warn('[syncStandings] snapshot insert warning:', snapErr.message);
  }

  // Upsert standings (insert new snapshots — no conflict key, always insert fresh)
  const { error } = await db.from('standings_snapshots').insert(standingRows);
  if (error) throw new Error(`standings_snapshots insert failed: ${error.message}`);
  console.log(`[syncStandings] inserted ${standingRows.length} standing rows for season ${seasonId}`);
}
