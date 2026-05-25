// TODO: implement when lineups + schedules coverage confirmed
// Required Sportmonks features: lineups, schedules (both plannedForV15)
// Expected inputs when implemented:
//   homeStartingXI: Player[]
//   awayStartingXI: Player[]
//   homeDaysSinceLastMatch: number
//   awayDaysSinceLastMatch: number
//   homeMatchesInLast14Days: number
//   awayMatchesInLast14Days: number
//   isHomeInEuropeanCompetition: boolean
//   isAwayInEuropeanCompetition: boolean

import type { ScoreResult } from '../types';

export type RotationRiskScoreInput = {
  readonly fixtureId: number;
  // TODO: extend after lineups and schedules coverage confirmed
};

export function computeRotationRiskScore(_input: RotationRiskScoreInput): ScoreResult {
  return {
    score: 0,
    confidence: 'low',
    metadata: { stub: true, requiredFeatures: ['lineups', 'schedules'], tier: 'plannedForV15' },
    warnings: ['rotationRiskScore is a stub — pending lineups + schedules coverage audit'],
  };
}
