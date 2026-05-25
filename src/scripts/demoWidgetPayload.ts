import { MATCH_A, MATCH_B, MATCH_C } from '../demo/sampleEnrichedMatches';
import { buildWidgetPayload } from '../product/widgetPayloadBuilder';

function main(): void {
  console.log('\n=== MOJ BET RADAR — Widget Payload Demo ===\n');

  const widgets = [
    { label: 'Match A — Low-risk favorite (away)', match: MATCH_A },
    { label: 'Match B — Trap favorite (home)', match: MATCH_B },
    { label: 'Match C — No odds available', match: MATCH_C },
  ];

  for (const { label, match } of widgets) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`${label}`);
    console.log('─'.repeat(60));
    const payload = buildWidgetPayload(match, 'en');
    console.log(JSON.stringify(payload, null, 2));
  }
  console.log('');
}

main();
