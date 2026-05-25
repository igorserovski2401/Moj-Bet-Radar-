// Real coverage audit using live Sportmonks probes.
// Usage: npm run sportmonks:audit:real -- --league-id=271 --season-id=23584 [--save-to-db]

import 'dotenv/config';
import { auditLeagueCoverage, printCoverageReport } from '../sportmonks/capabilityAudit';

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

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  const countryCode =
    typeof args['country'] === 'string' ? args['country'] :
    process.env['DEFAULT_COUNTRY'] ?? 'Serbia';

  const rawLeagueId =
    typeof args['league-id'] === 'string' ? args['league-id'] :
    process.env['DEFAULT_LEAGUE_ID'] ?? '271';

  const rawSeasonId =
    typeof args['season-id'] === 'string' ? args['season-id'] :
    process.env['DEFAULT_SEASON_ID'];

  const saveToDb = args['save-to-db'] === true;

  const leagueId = parseInt(rawLeagueId, 10);
  if (isNaN(leagueId)) { console.error('--league-id must be an integer'); process.exit(1); }

  const seasonId = rawSeasonId ? parseInt(rawSeasonId, 10) : undefined;
  if (rawSeasonId && isNaN(seasonId!)) { console.error('--season-id must be an integer'); process.exit(1); }

  console.log('Sportmonks Real Coverage Audit');
  console.log(`  Country  : ${countryCode}`);
  console.log(`  League   : ${leagueId}`);
  if (seasonId) console.log(`  Season   : ${seasonId}`);
  console.log(`  Save DB  : ${saveToDb}`);
  console.log('');

  try {
    const result = await auditLeagueCoverage({
      countryCode,
      leagueId,
      seasonId,
      mockMode: false,
      saveToDb,
    });
    printCoverageReport(result);
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
