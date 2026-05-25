// TODO: implement when referee_statistics feature coverage is confirmed
// Run: npm run audit -- --country=Serbia --league-id=271
// Required Sportmonks features: referee_statistics (plannedForV15)
// Expected inputs when implemented:
//   refereeId: number
//   refereeCardsPerGame: number        (from football/referees/{id}/statistics)
//   refereeHomeFavorBias: number       (ratio of home calls vs away calls)
//   leagueAverageCardsPerGame: number
//   refereeMatchesInLeague: number

import type { ScoreResult } from '../types';

export type RefereeRiskScoreInput = {
  readonly fixtureId: number;
  // TODO: extend with referee fields after coverage audit confirms availability
};

export function computeRefereeRiskScore(_input: RefereeRiskScoreInput): ScoreResult {
  return {
    score: 0,
    confidence: 'low',
    metadata: { stub: true, requiredFeature: 'referee_statistics', tier: 'plannedForV15' },
    warnings: ['refereeRiskScore is a stub — pending referee_statistics coverage audit'],
  };
}
