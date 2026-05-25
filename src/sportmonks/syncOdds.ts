import type { SupabaseClient } from '@supabase/supabase-js';
import { SportmonksClient, SportmonksError } from './client';
import { normalizeOddsRows } from './normalizers';

export type OddsSyncSummary = {
  readonly attempted: number;
  readonly withOdds: number;
  readonly skipped: number;
  readonly errors: number;
};

export async function syncOddsForFixtures(
  client: SportmonksClient,
  fixtureIds: number[],
  db: SupabaseClient,
): Promise<OddsSyncSummary> {
  let withOdds = 0;
  let skipped = 0;
  let errors = 0;
  const now = new Date().toISOString();

  for (const fixtureId of fixtureIds) {
    try {
      const rawData = await client.getOdds(fixtureId);
      const { rows, warnings } = normalizeOddsRows(rawData, fixtureId);

      const snapStatus = rows.length > 0 ? 'success' : 'skipped';
      if (warnings.length > 0 && rows.length === 0) {
        skipped++;
      }

      // Store raw snapshot regardless of whether odds found
      await db.from('match_feature_snapshots').insert({
        fixture_id: fixtureId,
        season_id: null,
        feature_key: 'odds',
        raw_payload: rawData as Record<string, unknown>,
        normalized_payload: null,
        provider: 'sportmonks',
        fetched_at: now,
        status: snapStatus,
        error_message: warnings.length > 0 ? warnings.join('; ') : null,
      });

      if (rows.length === 0) continue;

      // Upsert odds rows
      const { error } = await db
        .from('odds_snapshots')
        .upsert(rows, { onConflict: 'fixture_id,bookmaker,market' });
      if (error) {
        console.warn(`[syncOdds] fixture ${fixtureId} upsert warning: ${error.message}`);
        errors++;
        continue;
      }
      withOdds++;
    } catch (err) {
      const smErr = err as SportmonksError;
      const status = smErr.statusCode;

      // 404 / 422 = odds genuinely unavailable for this fixture (optional feature)
      if (status === 404 || status === 422 || status === 403) {
        skipped++;
        await db.from('match_feature_snapshots').insert({
          fixture_id: fixtureId,
          season_id: null,
          feature_key: 'odds',
          raw_payload: null,
          normalized_payload: null,
          provider: 'sportmonks',
          fetched_at: now,
          status: 'skipped',
          error_message: `HTTP ${status ?? 'err'}: odds not available`,
        });
        continue;
      }
      errors++;
      console.warn(`[syncOdds] fixture ${fixtureId} error: ${smErr.message}`);
    }
  }

  const summary: OddsSyncSummary = {
    attempted: fixtureIds.length,
    withOdds,
    skipped,
    errors,
  };
  console.log(`[syncOdds] ${JSON.stringify(summary)}`);
  return summary;
}
