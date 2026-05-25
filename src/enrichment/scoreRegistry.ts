import type {
  MatchEnrichmentContext,
  MatchRiskReport,
  MotivationScoreOutput,
  ScoreResult,
  NoBetFlagResult,
} from './types';
import { computeMotivationScore } from './scores/motivationScore';
import type { MotivationScoreInput } from './scores/motivationScore';
import { computeTrapScore } from './scores/trapScore';
import type { TrapScoreInput } from './scores/trapScore';
import { computeNoBetFlag } from './scores/noBetFlag';
import type { NoBetFlagInput } from './scores/noBetFlag';
import { computeRefereeRiskScore } from './scores/refereeRiskScore';
import { computeRotationRiskScore } from './scores/rotationRiskScore';
import { computeInjurySuspensionRiskScore } from './scores/injurySuspensionRiskScore';
import { computeXgRealityCheckScore } from './scores/xgRealityCheckScore';
import { computeFatigueCongestionScore } from './scores/fatigueCongestionScore';
import { computeMarketMovementScore } from './scores/marketMovementScore';

// ---- Context adapters ----
// Each adapter extracts scorer-specific input from MatchEnrichmentContext.
// Returns null if required data is absent — scorer is then skipped.

function motivationAdapter(ctx: MatchEnrichmentContext): MotivationScoreInput | null {
  if (!ctx.standings || !ctx.form) return null;
  return {
    homePosition: ctx.standings.homeTeamPosition,
    awayPosition: ctx.standings.awayTeamPosition,
    totalTeams: ctx.standings.totalTeamsInLeague,
    roundNumber: ctx.season.roundNumber,
    totalRounds: ctx.season.totalRounds,
    homePoints: ctx.standings.homePoints,
    awayPoints: ctx.standings.awayPoints,
    leaderPoints: ctx.standings.leaderPoints,
    relegationCutoffPoints: ctx.standings.relegationCutoffPoints,
    homeRecentForm: ctx.form.homeRecentForm,
    awayRecentForm: ctx.form.awayRecentForm,
  };
}

function trapAdapter(
  ctx: MatchEnrichmentContext,
  motivation: MotivationScoreOutput | null
): TrapScoreInput | null {
  if (!ctx.odds || !ctx.form) return null;
  return {
    homeOdds: ctx.odds.homeOdds,
    awayOdds: ctx.odds.awayOdds,
    drawOdds: ctx.odds.drawOdds,
    homeRecentForm: ctx.form.homeRecentForm,
    awayRecentForm: ctx.form.awayRecentForm,
    homeGoalsScoredLast5: ctx.form.homeGoalsScoredLast5,
    homeGoalsConcededLast5: ctx.form.homeGoalsConcededLast5,
    awayGoalsScoredLast5: ctx.form.awayGoalsScoredLast5,
    awayGoalsConcededLast5: ctx.form.awayGoalsConcededLast5,
    homeMotivationScore: motivation?.homeMotivationScore,
    awayMotivationScore: motivation?.awayMotivationScore,
    oddsMovement: ctx.odds.oddsMovement,
    publicNarrativeWeight: ctx.odds.publicNarrativeWeight,
  };
}

// ---- Main enrichment runner ----

export function runEnrichment(ctx: MatchEnrichmentContext): MatchRiskReport {
  const warnings: string[] = [];
  const missingRequired: string[] = [];

  // Step 1: Motivation (requires standings + form)
  const motivInput = motivationAdapter(ctx);
  let motivation: MotivationScoreOutput | null = null;

  if (motivInput) {
    motivation = computeMotivationScore(motivInput);
  } else {
    if (!ctx.standings) {
      missingRequired.push('standings');
      warnings.push('standings data missing — motivation score unavailable');
    }
    if (!ctx.form) {
      missingRequired.push('team_recent_form');
      warnings.push('form data missing — motivation score unavailable');
    }
  }

  // Step 2: Trap (requires odds + form)
  const oddsAvailable = ctx.odds !== undefined;
  let trapScore: ScoreResult | null = null;

  if (oddsAvailable) {
    const trapInput = trapAdapter(ctx, motivation);
    if (trapInput) {
      trapScore = computeTrapScore(trapInput);
      warnings.push(...trapScore.warnings);
    } else {
      warnings.push('Trap score could not be computed despite odds being available');
    }
  } else {
    warnings.push('Odds data not available — trap analysis skipped');
  }

  // Step 3: Stub scorers (run silently — they always return stub output)
  const stubs: Partial<Record<string, ScoreResult>> = {
    refereeRiskScore: computeRefereeRiskScore({ fixtureId: ctx.fixture.fixtureId }),
    rotationRiskScore: computeRotationRiskScore({ fixtureId: ctx.fixture.fixtureId }),
    injurySuspensionRiskScore: computeInjurySuspensionRiskScore({ fixtureId: ctx.fixture.fixtureId }),
    xgRealityCheckScore: computeXgRealityCheckScore({ fixtureId: ctx.fixture.fixtureId }),
    fatigueCongestionScore: computeFatigueCongestionScore({ fixtureId: ctx.fixture.fixtureId }),
    marketMovementScore: computeMarketMovementScore({ fixtureId: ctx.fixture.fixtureId }),
  };

  // Step 4: NoBetFlag (second-pass consumer — uses outputs of steps 1-2)
  const homeIsOddsFavorite: boolean | null = ctx.odds
    ? 1 / ctx.odds.homeOdds >= 1 / ctx.odds.awayOdds
    : null;

  const noBetInput: NoBetFlagInput = {
    trapScore: trapScore?.score ?? null,
    homeMotivationScore: motivation?.homeMotivationScore ?? null,
    awayMotivationScore: motivation?.awayMotivationScore ?? null,
    homeIsOddsFavorite,
    oddsAvailable,
    missingRequiredFeatures: missingRequired,
    dataQualityWarnings: warnings,
  };

  const noBetFlag: NoBetFlagResult = computeNoBetFlag(noBetInput);

  return {
    fixtureId: ctx.fixture.fixtureId,
    homeTeamName: ctx.fixture.homeTeamName,
    awayTeamName: ctx.fixture.awayTeamName,
    kickoffAt: ctx.fixture.kickoffAt,
    countryCode: ctx.season.countryCode,
    leagueName: ctx.season.leagueName,
    generatedAt: new Date().toISOString(),
    motivation,
    trapScore: trapScore
      ? {
          score: trapScore.score,
          confidence: trapScore.confidence,
          metadata: trapScore.metadata,
          warnings: trapScore.warnings,
        }
      : null,
    noBetFlag,
    stubs,
    missingRequiredFeatures: missingRequired,
    dataQualityWarnings: warnings,
  };
}
