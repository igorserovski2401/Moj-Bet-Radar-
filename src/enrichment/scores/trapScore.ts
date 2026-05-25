import type { FormRecord, ScoreResult, ScoreConfidence } from '../types';

export type TrapScoreInput = {
  readonly homeOdds: number;
  readonly awayOdds: number;
  readonly drawOdds: number;
  readonly homeRecentForm: FormRecord;
  readonly awayRecentForm: FormRecord;
  readonly homeGoalsScoredLast5: number;
  readonly homeGoalsConcededLast5: number;
  readonly awayGoalsScoredLast5: number;
  readonly awayGoalsConcededLast5: number;
  readonly homeMotivationScore?: number;
  readonly awayMotivationScore?: number;
  readonly oddsMovement?: number;
  readonly publicNarrativeWeight?: number;
};

function impliedProb(decimalOdds: number): number {
  return 1 / decimalOdds;
}

function normalizeProbs(home: number, draw: number, away: number): {
  homeProb: number;
  drawProb: number;
  awayProb: number;
  overround: number;
} {
  const rawH = impliedProb(home);
  const rawD = impliedProb(draw);
  const rawA = impliedProb(away);
  const total = rawH + rawD + rawA;
  return {
    homeProb: rawH / total,
    drawProb: rawD / total,
    awayProb: rawA / total,
    overround: total - 1,
  };
}

function formBasedProb(homeForm: FormRecord, awayForm: FormRecord): {
  homeFormProb: number;
  awayFormProb: number;
} {
  const homePoints = homeForm.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
  const awayPoints = awayForm.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
  // +5 baseline prevents zero-division; +2 home slight advantage
  const total = homePoints + awayPoints + 5;
  return {
    homeFormProb: (homePoints + 2) / (total + 2),
    awayFormProb: awayPoints / (total + 2),
  };
}

export function computeTrapScore(input: TrapScoreInput): ScoreResult {
  const warnings: string[] = [];

  if (input.homeOdds < 1.01 || input.awayOdds < 1.01 || input.drawOdds < 1.01) {
    warnings.push('One or more odds values are unrealistically low (<1.01)');
  }

  const { homeProb, awayProb, overround } = normalizeProbs(
    input.homeOdds,
    input.drawOdds,
    input.awayOdds
  );

  const { homeFormProb, awayFormProb } = formBasedProb(
    input.homeRecentForm,
    input.awayRecentForm
  );

  const favoriteIsHome = homeProb >= awayProb;
  const favoriteMarketProb = favoriteIsHome ? homeProb : awayProb;
  const favoriteFormProb = favoriteIsHome ? homeFormProb : awayFormProb;
  const favoriteGoalsScored = favoriteIsHome
    ? input.homeGoalsScoredLast5
    : input.awayGoalsScoredLast5;

  let trapSignal = 0;

  // Core: market probability exceeds form probability by >20%
  const divergence = favoriteMarketProb - favoriteFormProb;
  if (divergence > 0.20) {
    trapSignal += Math.min(80, divergence * 200);
  }

  // Weak attacking form on a heavy favorite
  const avgGoals = favoriteGoalsScored / 5;
  if (favoriteMarketProb > 0.60 && avgGoals < 1.0) {
    trapSignal += 20;
    warnings.push(
      `Heavy favorite (${Math.round(favoriteMarketProb * 100)}% market prob) ` +
      `averaging ${avgGoals.toFixed(2)} goals/game over last 5`
    );
  }

  // Motivation reversal: underdog more motivated than favorite
  if (
    input.homeMotivationScore !== undefined &&
    input.awayMotivationScore !== undefined
  ) {
    const favMotiv = favoriteIsHome ? input.homeMotivationScore : input.awayMotivationScore;
    const undMotiv = favoriteIsHome ? input.awayMotivationScore : input.homeMotivationScore;
    if (undMotiv - favMotiv > 20) {
      trapSignal += 20;
      warnings.push(
        `Motivation reversal: underdog motivation (${undMotiv}) exceeds ` +
        `favorite motivation (${favMotiv}) by more than 20 points`
      );
    }
  }

  // Odds dropped hard (negative movement = shortening)
  if (input.oddsMovement !== undefined && input.oddsMovement < -0.15) {
    trapSignal += 15;
    warnings.push(`Sharp odds drop detected: movement ${input.oddsMovement.toFixed(2)}`);
  }

  // Overround inflation
  if (overround > 0.12) {
    const publicWeight = input.publicNarrativeWeight ?? 0.5;
    trapSignal += publicWeight * 10;
    warnings.push(`High overround: ${(overround * 100).toFixed(1)}%`);
  }

  if (input.homeRecentForm.length < 3 || input.awayRecentForm.length < 3) {
    warnings.push('Limited form data — trap analysis has reduced accuracy');
  }

  const score = Math.min(100, Math.max(0, Math.round(trapSignal)));

  let confidence: ScoreConfidence;
  if (warnings.length >= 2) {
    confidence = 'low';
  } else if (input.homeRecentForm.length >= 5 && input.awayRecentForm.length >= 5) {
    confidence = 'high';
  } else {
    confidence = 'medium';
  }

  return {
    score,
    confidence,
    metadata: {
      homeMarketProb: Math.round(homeProb * 1000) / 1000,
      awayMarketProb: Math.round(awayProb * 1000) / 1000,
      homeFormProb: Math.round(homeFormProb * 1000) / 1000,
      awayFormProb: Math.round(awayFormProb * 1000) / 1000,
      favoriteIsHome,
      probabilityDivergence: Math.round(divergence * 1000) / 1000,
      overround: Math.round(overround * 1000) / 1000,
    },
    warnings,
  };
}
