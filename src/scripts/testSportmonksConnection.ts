// Tests Sportmonks API connectivity safely — never prints token or full URL.
// Usage: npm run sportmonks:test

import 'dotenv/config';
import { SportmonksClient } from '../sportmonks/client';

async function main(): Promise<void> {
  const leagueId = parseInt(process.env['DEFAULT_LEAGUE_ID'] ?? '271', 10);

  let client: SportmonksClient;
  try {
    client = SportmonksClient.fromEnv();
  } catch (err) {
    console.error('✗ Config error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  console.log(`Testing Sportmonks API connection (league ${leagueId})...`);

  try {
    const raw = await client.getLeague(leagueId);
    const league = raw as Record<string, unknown>;
    const name = String(league['name'] ?? league['short_code'] ?? '(unknown)');
    const country = (league['country'] as Record<string, unknown> | undefined)?.['name'] ?? '?';
    console.log(`✓ Sportmonks API reachable — league: ${name} (${country})`);
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Connection failed: ${msg}`);
    process.exit(1);
  }
}

main();
