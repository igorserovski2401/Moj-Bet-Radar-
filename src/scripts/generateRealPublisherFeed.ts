// Generates real publisher feed from enrichment results.
// Usage: npm run feed:real -- --season-id=23584 [--mock]
// Output: output/publisher-feed.json, output/publisher-feed.md, output/widget-sample.json

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { runDailyRadar } from '../pipeline/runDailyRadar';
import { getSupabaseClient } from '../lib/supabaseClient';
import { buildPublisherFeed } from '../product/publisherFeed';
import { buildWidgetPayload } from '../product/widgetPayloadBuilder';
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const mockMode = args['mock'] === true || process.env['MOCK_MODE'] === 'true';
  const rawSeasonId = typeof args['season-id'] === 'string' ? args['season-id'] : process.env['DEFAULT_SEASON_ID'];

  let reports: MatchRiskReport[];

  if (mockMode) {
    console.log('MOCK MODE — using sample enriched matches');
    reports = [...SAMPLE_MATCHES];
  } else {
    if (!rawSeasonId) { console.error('Provide --season-id'); process.exit(1); }
    const seasonId = parseInt(rawSeasonId, 10);
    if (isNaN(seasonId)) { console.error('--season-id must be an integer'); process.exit(1); }
    const db = getSupabaseClient();
    console.log(`Running daily radar for season ${seasonId}...`);
    reports = await runDailyRadar({ seasonId, db });
  }

  if (reports.length === 0) {
    console.log('No reports to publish. Exiting.');
    process.exit(0);
  }

  const feed = buildPublisherFeed(reports as MatchRiskReport[], {
    language: 'en',
    format: 'json',
    includeComplianceNote: true,
    includeNoBetWarnings: true,
  });

  const mdFeed = buildPublisherFeed(reports as MatchRiskReport[], {
    language: 'en',
    format: 'markdown',
    includeComplianceNote: true,
    includeNoBetWarnings: true,
  });

  const firstReport = reports[0]!;
  const widget = buildWidgetPayload(firstReport, 'en');

  // Write output files
  const outDir = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, 'publisher-feed.json'),
    JSON.stringify(feed, null, 2),
    'utf-8',
  );

  const mdContent = mdFeed.items.map((item) => item.readyToPublishMarkdown).join('\n\n---\n\n');
  fs.writeFileSync(path.join(outDir, 'publisher-feed.md'), mdContent, 'utf-8');
  fs.writeFileSync(
    path.join(outDir, 'widget-sample.json'),
    JSON.stringify(widget, null, 2),
    'utf-8',
  );

  const flaggedCount = feed.items.filter((i) => i.noBetFlag).length;
  console.log(`\nFeed written: ${feed.matchCount} match(es), ${flaggedCount} flagged`);
  console.log(`  output/publisher-feed.json`);
  console.log(`  output/publisher-feed.md`);
  console.log(`  output/widget-sample.json`);
  console.log('');
  console.log('--- Sample (first match) ---');
  console.log(feed.items[0]?.readyToPublishMarkdown ?? '(empty)');
}

main().catch((err) => {
  console.error('Feed generation failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
