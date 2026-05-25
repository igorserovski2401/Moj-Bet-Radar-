// TODO: implement when xg_match coverage confirmed
// Required Sportmonks features: xg_match (plannedForV15)
// Expected inputs when implemented:
//   homeXgForLast5: number[]       expected goals scored per match
//   homeXgAgainstLast5: number[]   expected goals conceded per match
//   awayXgForLast5: number[]
//   awayXgAgainstLast5: number[]
//   homeActualGoalsLast5: number[]
//   awayActualGoalsLast5: number[]
// A team dramatically over-performing xG is at reversal risk.

import type { ScoreResult } from '../types';

export type XgRealityCheckScoreInput = {
  readonly fixtureId: number;
  // TODO: extend after xg_match coverage confirmed
};

export function computeXgRealityCheckScore(_input: XgRealityCheckScoreInput): ScoreResult {
  return {
    score: 0,
    confidence: 'low',
    metadata: { stub: true, requiredFeature: 'xg_match', tier: 'plannedForV15' },
    warnings: ['xgRealityCheckScore is a stub — xg_match coverage unconfirmed for this league'],
  };
}
