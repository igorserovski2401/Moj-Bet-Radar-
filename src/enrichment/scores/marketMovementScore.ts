// TODO: implement when historical odds line data is confirmed
// Required features: odds (optionalForV1) + historical line tracking (may need additional provider)
// Sportmonks pre-match odds do not include opening line history by default.
// May require Pinnacle history via RapidAPI or a dedicated odds history provider.
// Expected inputs when implemented:
//   openingHomeOdds: number
//   currentHomeOdds: number
//   openingAwayOdds: number
//   currentAwayOdds: number
//   volumeSignal?: number             sharp money indicator if available

import type { ScoreResult } from '../types';

export type MarketMovementScoreInput = {
  readonly fixtureId: number;
  // TODO: extend after historical odds provider is confirmed
};

export function computeMarketMovementScore(_input: MarketMovementScoreInput): ScoreResult {
  return {
    score: 0,
    confidence: 'low',
    metadata: {
      stub: true,
      note: 'Requires historical odds line data — not available from Sportmonks alone',
    },
    warnings: ['marketMovementScore is a stub — no historical odds provider configured'],
  };
}
