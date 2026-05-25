// TODO: implement when schedules coverage confirmed
// Required Sportmonks features: schedules (optionalForV1)
// Expected inputs when implemented:
//   homeDaysSinceLastMatch: number
//   awayDaysSinceLastMatch: number
//   homeMatchesInLast21Days: number
//   awayMatchesInLast21Days: number
//   homeNextFixtureInDays: number       fixture congestion look-ahead
//   awayNextFixtureInDays: number
//   homeIsInEuropeanCup: boolean

import type { ScoreResult } from '../types';

export type FatigueCongestionScoreInput = {
  readonly fixtureId: number;
  // TODO: extend after schedules coverage confirmed
};

export function computeFatigueCongestionScore(_input: FatigueCongestionScoreInput): ScoreResult {
  return {
    score: 0,
    confidence: 'low',
    metadata: { stub: true, requiredFeature: 'schedules', tier: 'optionalForV1' },
    warnings: ['fatigueCongestionScore is a stub — schedules feature not yet wired'],
  };
}
