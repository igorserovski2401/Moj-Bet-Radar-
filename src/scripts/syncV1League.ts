// Syncs V1 data from Sportmonks into Supabase for a given league/season.
// Usage: npm run sync:v1 -- --league-id=271 --season-id=23584 [--days-ahead=7] [--days-back=1] [--mock]

import 'dotenv/config';
import { SportmonksClient } from '../sportmonks/client';
import { getSupabaseClient } from '../lib/supabaseClient';
import { syncLeague, syncSeasons } from '../sportmonks/syncLeagues';
import { syncTeams } from '../sportmonks/syncTeams';
import { syncFixtures } from '../sportmonks/syncFixtures';
import { syncStandings } from '../sportmonks/syncStandings';
import { syncOddsForFixtures } from '../sportmonks/syncOdds';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx === -1) result[arg.slice(2)] = true;
      else result[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
    }
  }
  return result;
}

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const mockMode = args['mock'] === true || process.env['MOCK_MODE'] === 'true';

  if (mockMode) {
    console.log('MOCK MODE — skipping real sync. Use --mock=false to run live.');
    process.exit(0);
  }

  const rawLeagueId = typeof args['league-id'] === 'string' ? args['league-id'] : process.env['DEFAULT_LEAGUE_ID'] ?? '271';
  const rawSeasonId = typeof args['season-id'] === 'string' ? args['season-id'] : process.env['DEFAULT_SEASON_ID'];
  const daysAhead = parseInt(String(args['days-ahead'] ?? '7'), 10);
  const daysBack  = parseInt(String(args['days-back']  ?? '1'), 10);
  const skipOdds  = args['skip-odds'] === true;

  const leagueId = parseInt(rawLeagueId, 10);
  if (isNaN(leagueId)) { console.error('--league-id must be an integer'); process.exit(1); }

  const seasonId = rawSeasonId ? parseInt(rawSeasonId, 10) : undefined;

  console.log('V1 League Sync');
  console.log(`  League   : ${leagueId}`);
  if (seasonId) console.log(`  Season   : ${seasonId}`);
  console.log(`  Window   : -${daysBack}d to +${daysAhead}d`);
  console.log('');

  const client = SportmonksClient.fromEnv();
  const db = getSupabaseClient();

  // 1. League
  console.log('Step 1/5: Syncing league...');
  await syncLeague(client, leagueId, db);

  // 2. Seasons — resolved from league include or direct /seasons/{id} fallback
  console.log('Step 2/5: Syncing seasons...');
  await syncSeasons(client, leagueId, db, seasonId);

  // Resolve seasonId — use provided or look up current from DB
  let resolvedSeasonId = seasonId;
  if (!resolvedSeasonId) {
    const { data } = await db
      .from('seasons')
      .select('id')
      .eq('league_id', leagueId)
      .eq('is_current', true)
      .single();
    resolvedSeasonId = data?.id;
    if (!resolvedSeasonId) {
      console.error('Could not resolve season ID. Pass --season-id explicitly.');
      process.exit(1);
    }
    console.log(`  Resolved season: ${resolvedSeasonId}`);
  }

  // 3. Teams
  console.log('Step 3/5: Syncing teams...');
  await syncTeams(client, resolvedSeasonId, leagueId, db);

  // 4. Fixtures
  console.log('Step 4/5: Syncing fixtures...');
  const from = dateOffset(-daysBack);
  const to   = dateOffset(daysAhead);
  const fixtureIds = await syncFixtures(client, { seasonId: resolvedSeasonId, from, to }, db);

  // 5. Standings
  console.log('Step 5a/5: Syncing standings...');
  await syncStandings(client, resolvedSeasonId, db);

  // 5b. Odds (optional — per fixture; skip with --skip-odds flag)
  if (skipOdds) {
    console.log('Step 5b/5: Odds sync skipped by flag.');
  } else if (fixtureIds.length > 0) {
    console.log(`Step 5b/5: Syncing odds for ${fixtureIds.length} fixture(s)...`);
    const oddsSummary = await syncOddsForFixtures(client, fixtureIds, db);
    console.log(`  Odds summary: ${JSON.stringify(oddsSummary)}`);
  } else {
    console.log('Step 5b/5: No fixtures to sync odds for.');
  }

  console.log('');
  console.log(`Sync complete. Fixtures synced: ${fixtureIds.length}`);
}

main().catch((err) => {
  console.error('Sync failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
