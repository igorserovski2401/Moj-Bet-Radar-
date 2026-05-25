// Usage:
//   npm run audit -- --mock
//   npm run audit -- --country=Serbia --league-id=271 --mock
//   npm run audit -- --country=Serbia --league-id=271  (requires SPORTMONKS_API_TOKEN)

import 'dotenv/config';
import { auditLeagueCoverage, printCoverageReport } from '../sportmonks/capabilityAudit';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx === -1) {
        result[arg.slice(2)] = true;
      } else {
        const key = arg.slice(2, eqIdx);
        const value = arg.slice(eqIdx + 1);
        result[key] = value;
      }
    }
  }
  return result;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  const mockMode =
    args['mock'] === true || process.env['MOCK_MODE'] === 'true';

  const countryCode =
    typeof args['country'] === 'string'
      ? args['country']
      : process.env['DEFAULT_COUNTRY'] ?? 'Serbia';

  const rawLeagueId =
    typeof args['league-id'] === 'string'
      ? args['league-id']
      : process.env['DEFAULT_LEAGUE_ID'] ?? '271';

  const rawSeasonId =
    typeof args['season-id'] === 'string'
      ? args['season-id']
      : process.env['DEFAULT_SEASON_ID'];

  const leagueId = parseInt(rawLeagueId, 10);
  if (isNaN(leagueId)) {
    console.error('Error: --league-id must be a valid integer');
    process.exit(1);
  }

  const seasonId = rawSeasonId !== undefined ? parseInt(rawSeasonId, 10) : undefined;

  console.log('Sportmonks Coverage Audit');
  console.log(`  Country : ${countryCode}`);
  console.log(`  League  : ${leagueId}`);
  if (seasonId !== undefined) console.log(`  Season  : ${seasonId}`);
  console.log(`  Mode    : ${mockMode ? 'MOCK' : 'LIVE API'}`);

  try {
    const result = await auditLeagueCoverage({
      countryCode,
      leagueId,
      seasonId,
      mockMode,
      saveToDb: false,
    });
    printCoverageReport(result);
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
