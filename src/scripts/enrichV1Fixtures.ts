// Runs enrichment on synced fixtures and upserts results into match_intelligence.
// Usage: npm run enrich:v1 -- --season-id=23584 [--fixture-id=X] [--mock]

import 'dotenv/config';
import { runDailyRadar } from '../pipeline/runDailyRadar';
import { runFixtureEnrichment } from '../pipeline/runFixtureEnrichment';
import { getSupabaseClient } from '../lib/supabaseClient';
import { SAMPLE_MATCHES } from '../demo/sampleEnrichedMatches';
import type { MatchRiskReport } from '../enrichment/types';

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

function printReport(report: MatchRiskReport): void {
  console.log('');
  console.log(`  ${report.homeTeamName} vs ${report.awayTeamName}`);
  console.log(`  League : ${report.leagueName} (${report.countryCode})`);
  console.log(`  Kickoff: ${report.kickoffAt}`);
  console.log(`  Motivation H/A : ${report.motivation?.homeMotivationScore ?? '—'}/${report.motivation?.awayMotivationScore ?? '—'}`);
  console.log(`  Trap Score     : ${report.trapScore?.score ?? '—'}`);
  console.log(`  NoBet Flag     : ${report.noBetFlag?.flagged ? '⚠ YES' : 'no'}`);
  if (report.noBetFlag?.flagged) {
    console.log(`  Reasons        : ${report.noBetFlag.reasons.slice(0, 2).join('; ')}`);
  }
  if (report.missingRequiredFeatures.length > 0) {
    console.log(`  Missing req    : ${report.missingRequiredFeatures.join(', ')}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const mockMode = args['mock'] === true || process.env['MOCK_MODE'] === 'true';

  const rawSeasonId = typeof args['season-id'] === 'string' ? args['season-id'] : process.env['DEFAULT_SEASON_ID'];
  const rawFixtureId = typeof args['fixture-id'] === 'string' ? args['fixture-id'] : undefined;

  if (mockMode) {
    console.log('MOCK MODE — using sample enriched matches (no DB access)');
    console.log(`${SAMPLE_MATCHES.length} match reports:`);
    for (const r of SAMPLE_MATCHES) printReport(r);
    console.log('');
    console.log('To run against real data, set MOCK_MODE=false and provide --season-id');
    process.exit(0);
  }

  if (!rawSeasonId && !rawFixtureId) {
    console.error('Provide --season-id or --fixture-id');
    process.exit(1);
  }

  const db = getSupabaseClient();
  const reports: MatchRiskReport[] = [];

  if (rawFixtureId) {
    const fixtureId = parseInt(rawFixtureId, 10);
    console.log(`Enriching single fixture ${fixtureId}...`);
    const report = await runFixtureEnrichment(fixtureId, db);
    reports.push(report);
  } else {
    const seasonId = parseInt(rawSeasonId!, 10);
    if (isNaN(seasonId)) { console.error('--season-id must be an integer'); process.exit(1); }
    console.log(`Running daily radar for season ${seasonId}...`);
    const radar = await runDailyRadar({ seasonId, db });
    reports.push(...radar);
  }

  console.log(`\nEnrichment complete. ${reports.length} fixture(s) processed:`);
  for (const r of reports) printReport(r);
}

main().catch((err) => {
  console.error('Enrichment failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
