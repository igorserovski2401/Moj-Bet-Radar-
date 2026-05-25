import type { FormRecord, MotivationScoreOutput, ScoreConfidence } from '../types';

export type MotivationScoreInput = {
  readonly homePosition: number;
  readonly awayPosition: number;
  readonly totalTeams: number;
  readonly roundNumber: number;
  readonly totalRounds: number;
  readonly homePoints: number;
  readonly awayPoints: number;
  readonly leaderPoints: number;
  readonly relegationCutoffPoints: number;
  readonly homeRecentForm: FormRecord;
  readonly awayRecentForm: FormRecord;
};

function formToPoints(form: FormRecord): number {
  return form.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
}

type TeamMotivation = {
  score: number;
  reasons: string[];
};

function computeTeamMotivation(
  position: number,
  points: number,
  totalTeams: number,
  leaderPoints: number,
  relegationCutoff: number,
  form: FormRecord,
  lateSeasonMultiplier: number
): TeamMotivation {
  let motivation = 50;
  const reasons: string[] = [];

  const pointsFromLeader = leaderPoints - points;
  if (pointsFromLeader <= 3) {
    motivation += 30;
    reasons.push('title_race');
  } else if (pointsFromLeader <= 6) {
    motivation += 15;
    reasons.push('title_contention');
  }

  const pointsAboveRelegation = points - relegationCutoff;
  if (pointsAboveRelegation <= 6 && position > totalTeams - 6) {
    motivation += 35;
    reasons.push('relegation_pressure');
  } else if (pointsAboveRelegation <= 6) {
    motivation += 20;
    reasons.push('relegation_risk');
  }

  const isSafeMidTable =
    pointsFromLeader > 12 &&
    pointsAboveRelegation > 9 &&
    position > 3 &&
    position < totalTeams - 3;

  if (isSafeMidTable) {
    motivation -= 25;
    reasons.push('safe_midtable_apathy');
  }

  const formPts = formToPoints(form);
  if (formPts >= 12) {
    motivation += 15;
    reasons.push('strong_form_momentum');
  } else if (formPts <= 3) {
    motivation -= 10;
    reasons.push('poor_form');
  }

  // Late season amplifies deviations from neutral (50)
  const amplified = motivation + (motivation - 50) * (lateSeasonMultiplier - 1);
  return {
    score: Math.min(100, Math.max(0, Math.round(amplified))),
    reasons,
  };
}

export function computeMotivationScore(input: MotivationScoreInput): MotivationScoreOutput {
  const warnings: string[] = [];

  if (input.roundNumber > input.totalRounds) {
    warnings.push('roundNumber exceeds totalRounds — data inconsistency');
  }

  const seasonProgress = Math.min(1, input.roundNumber / input.totalRounds);
  // Linear ramp: 1.0 at round 1 → 1.5 at final round
  const lateSeasonMultiplier = 1.0 + 0.5 * seasonProgress;

  const home = computeTeamMotivation(
    input.homePosition,
    input.homePoints,
    input.totalTeams,
    input.leaderPoints,
    input.relegationCutoffPoints,
    input.homeRecentForm,
    lateSeasonMultiplier
  );

  const away = computeTeamMotivation(
    input.awayPosition,
    input.awayPoints,
    input.totalTeams,
    input.leaderPoints,
    input.relegationCutoffPoints,
    input.awayRecentForm,
    lateSeasonMultiplier
  );

  const overall = Math.round((home.score + away.score) / 2);
  const gap = Math.abs(home.score - away.score);

  const minFormLen = Math.min(input.homeRecentForm.length, input.awayRecentForm.length);
  let confidence: ScoreConfidence;
  if (warnings.length > 0 || minFormLen < 3) {
    confidence = 'low';
  } else if (minFormLen >= 5) {
    confidence = 'high';
  } else {
    confidence = 'medium';
  }

  return {
    homeMotivationScore: home.score,
    awayMotivationScore: away.score,
    overallMotivationScore: overall,
    motivationGap: gap,
    keyReasons: [...new Set([...home.reasons, ...away.reasons])],
    confidence,
  };
}
