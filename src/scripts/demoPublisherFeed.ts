import { SAMPLE_MATCHES } from '../demo/sampleEnrichedMatches';
import { buildPublisherFeed } from '../product/publisherFeed';

function hr(): void {
  console.log('─'.repeat(70));
}

function main(): void {
  console.log('\n=== MOJ BET RADAR — Publisher Feed Demo ===\n');

  const feed = buildPublisherFeed([...SAMPLE_MATCHES], {
    language: 'en',
    format: 'json',
    includeComplianceNote: true,
    includeNoBetWarnings: true,
  });

  console.log(`Generated: ${feed.generatedAt}`);
  console.log(`Matches:   ${feed.matchCount}`);
  console.log(`Language:  ${feed.language}`);

  for (const item of feed.items) {
    hr();
    console.log(`\nFIXTURE ${item.fixtureId}: ${item.matchTitle}`);
    console.log(`League   : ${item.leagueName} (${item.countryCode})`);
    console.log(`Kickoff  : ${item.kickoffTime}`);
    console.log(`Home Mot : ${item.homeMotivationScore ?? '—'}/100`);
    console.log(`Away Mot : ${item.awayMotivationScore ?? '—'}/100`);
    console.log(`Trap     : ${item.trapScore ?? '—'}/100`);
    console.log(`No-Bet   : ${item.noBetFlag ? '⚠️  YES' : 'No'}`);
    console.log(`Action   : ${item.recommendedAction}`);
    console.log(`Conf     : ${item.confidence}`);
    console.log(`\n[Motivation]\n${item.motivationSummary}`);
    console.log(`\n[Trap]\n${item.trapSummary}`);
    if (item.noBetFlag) {
      console.log(`\n[Risk Flag]\n${item.noBetSummary}`);
    }
    console.log('\n--- Markdown preview (first 5 lines) ---');
    const mdLines = item.readyToPublishMarkdown.split('\n').slice(0, 5);
    console.log(mdLines.join('\n'));
  }

  hr();
  console.log('\n--- JSON Payload (Match B — trap match) ---');
  const trapItem = feed.items.find((i) => i.fixtureId === 10002);
  if (trapItem) {
    console.log(JSON.stringify(trapItem.jsonPayload, null, 2));
  }
  console.log('');
}

main();
