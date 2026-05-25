// TODO: implement when injuries_suspensions + lineups coverage confirmed
// Required Sportmonks features: injuries_suspensions, lineups (both plannedForV15)
// Expected inputs when implemented:
//   homeAbsentPlayers: AbsentPlayer[]
//   awayAbsentPlayers: AbsentPlayer[]
//   homeSquadSize: number
//   awaySquadSize: number
// AbsentPlayer: { name: string; role: 'GK'|'CB'|'CM'|'FW'; reason: 'injury'|'suspension' }

import type { ScoreResult } from '../types';

export type InjurySuspensionRiskScoreInput = {
  readonly fixtureId: number;
  // TODO: extend after injuries_suspensions coverage confirmed
};

export function computeInjurySuspensionRiskScore(
  _input: InjurySuspensionRiskScoreInput
): ScoreResult {
  return {
    score: 0,
    confidence: 'low',
    metadata: { stub: true, requiredFeatures: ['injuries_suspensions', 'lineups'], tier: 'plannedForV15' },
    warnings: ['injurySuspensionRiskScore is a stub — pending coverage audit'],
  };
}
