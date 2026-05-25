import type { SupabaseClient } from '@supabase/supabase-js';
import { SportmonksClient } from './client';
import { normalizeFixture } from './normalizers';

export type SyncFixturesOptions = {
  readonly seasonId: number;
  readonly from?: string;  // ISO date string filter (inclusive)
  readonly to?: string;    // ISO date string filter (inclusive)
};

export async function syncFixtures(
  client: SportmonksClient,
  options: SyncFixturesOptions,
  db: SupabaseClient,
): Promise<number[]> {
  const { seasonId, from, to } = options;

  const rawFixtures = await client.getFixtures(seasonId, 'participants;round');

  const now = new Date().toISOString();
  const syncedIds: number[] = [];
  const rows = [];
  const snapshotRows = [];

  for (const raw of rawFixtures) {
    const { row, warnings } = normalizeFixture(raw, seasonId);
    if (warnings.length > 0) console.warn('[syncFixtures] warnings:', warnings);

    // Date range filter
    if (from && row.kickoff_at && row.kickoff_at < from) continue;
    if (to && row.kickoff_at && row.kickoff_at > to) continue;

    rows.push(row);
    syncedIds.push(row.id);

    snapshotRows.push({
      fixture_id: row.id,
      feature_key: 'fixtures',
      raw_payload: raw as Record<string, unknown>,
      normalized_payload: null,
      provider: 'sportmonks',
      fetched_at: now,
      status: 'success',
      error_message: null,
    });
  }

  if (rows.length === 0) {
    console.warn('[syncFixtures] no fixtures matched filter for season', seasonId);
    return [];
  }

  // Upsert fixtures
  const { error: fixErr } = await db.from('fixtures').upsert(rows, { onConflict: 'id' });
  if (fixErr) throw new Error(`fixtures upsert failed: ${fixErr.message}`);

  // Store raw snapshots
  if (snapshotRows.length > 0) {
    const { error: snapErr } = await db.from('match_feature_snapshots').insert(snapshotRows);
    if (snapErr) {
      // Non-fatal: duplicate snapshots are acceptable
      console.warn('[syncFixtures] snapshot insert warning:', snapErr.message);
    }
  }

  console.log(`[syncFixtures] upserted ${rows.length} fixtures for season ${seasonId}`);
  return syncedIds;
}
