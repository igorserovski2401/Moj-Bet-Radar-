import { getRadarToday, getPublisherFeed, getWidgetMatchCard, getApiDocs, getMatchIntelligence } from '../api/mockRouter';

function section(title: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function main(): void {
  console.log('\n=== MOJ BET RADAR — API Response Demo ===');

  section('GET /api/v1/radar/today?country=RS');
  const today = getRadarToday({ country: 'RS' });
  console.log(`success: ${today.success}`);
  console.log(`source:  ${today.meta.source}`);
  console.log(`matches: ${today.data?.length ?? 0}`);
  if (today.data) {
    for (const m of today.data) {
      const trap = m.trapScore?.score ?? '—';
      const flag = m.noBetFlag?.flagged ? '⚠️' : '✓';
      console.log(`  ${flag} [${m.fixtureId}] ${m.homeTeamName} vs ${m.awayTeamName} | trap=${trap}`);
    }
  }

  section('GET /api/v1/matches/10002/intelligence (trap match)');
  const intel = getMatchIntelligence(10002);
  if (intel.data) {
    const r = intel.data;
    console.log(JSON.stringify({
      fixtureId: r.fixtureId,
      match: `${r.homeTeamName} vs ${r.awayTeamName}`,
      homeMotivation: r.motivation?.homeMotivationScore,
      awayMotivation: r.motivation?.awayMotivationScore,
      motivationGap: r.motivation?.motivationGap,
      trapScore: r.trapScore?.score,
      noBetFlag: r.noBetFlag?.flagged,
      noBetReasons: r.noBetFlag?.reasons,
      confidence: r.noBetFlag?.confidence,
      warnings: r.dataQualityWarnings,
    }, null, 2));
  }

  section('GET /api/v1/feed/publisher?country=RS&language=en&format=json');
  const feed = getPublisherFeed({ country: 'RS', language: 'en', format: 'json' });
  console.log(`success:     ${feed.success}`);
  console.log(`matchCount:  ${feed.data?.matchCount ?? 0}`);
  console.log(`language:    ${feed.data?.language}`);
  if (feed.data) {
    for (const item of feed.data.items) {
      console.log(`  [${item.fixtureId}] ${item.matchTitle} → ${item.recommendedAction} (trap=${item.trapScore ?? '—'})`);
    }
  }

  section('GET /api/v1/widgets/match-card/10002 (trap match)');
  const widget = getWidgetMatchCard(10002);
  if (widget.data) {
    console.log(JSON.stringify(widget.data, null, 2));
  }

  section('GET /api/v1/docs');
  const docs = getApiDocs();
  if (docs.data) {
    console.log(`API: ${docs.data.title} v${docs.data.version}`);
    for (const ep of docs.data.endpoints) {
      console.log(`  ${ep.method} ${ep.path} — ${ep.description}`);
    }
  }

  console.log('\n');
}

main();
