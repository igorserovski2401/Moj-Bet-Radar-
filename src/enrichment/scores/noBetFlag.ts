import type { NoBetFlagResult, ScoreConfidence } from '../types';

export type NoBetFlagInput = {
  readonly trapScore: number | null;
  readonly homeMotivationScore: number | null;
  readonly awayMotivationScore: number | null;
  readonly homeIsOddsFavorite: boolean | null;
  readonly oddsAvailable: boolean;
  readonly missingRequiredFeatures: readonly string[];
  readonly dataQualityWarnings: readonly string[];
};

function getFavoriteMotivation(input: NoBetFlagInput): number | null {
  if (input.homeIsOddsFavorite === null) return null;
  return input.homeIsOddsFavorite
    ? input.homeMotivationScore
    : input.awayMotivationScore;
}

export function computeNoBetFlag(input: NoBetFlagInput): NoBetFlagResult {
  const reasons: string[] = [];
  const favoriteMotivation = getFavoriteMotivation(input);

  // Rule 1: high trap signal AND low favorite motivation
  if (
    input.trapScore !== null &&
    favoriteMotivation !== null &&
    input.trapScore > 65 &&
    favoriteMotivation < 30
  ) {
    reasons.push(
      `TRAP+APATHY: trapScore=${input.trapScore} with favoriteMotivation=${favoriteMotivation}`
    );
  }

  // Rule 2: required V1 features missing
  if (input.missingRequiredFeatures.length > 0) {
    reasons.push(
      `MISSING_REQUIRED_DATA: ${input.missingRequiredFeatures.join(', ')}`
    );
  }

  // Rule 3: extreme favorite apathy — dead rubber risk
  if (favoriteMotivation !== null && favoriteMotivation < 15) {
    reasons.push(
      `EXTREME_APATHY: favoriteMotivation=${favoriteMotivation} — high dead rubber risk`
    );
  }

  // Rule 4: motivation scorer unavailable (required)
  if (input.homeMotivationScore === null && input.awayMotivationScore === null) {
    reasons.push('MISSING_SCORE: motivationScore could not be computed');
  }

  // Rule 5: trap scorer unavailable despite odds being present (optional — only flags when odds exist)
  if (input.trapScore === null && input.oddsAvailable) {
    reasons.push('MISSING_SCORE: trapScore failed despite odds data being available');
  }
  // Note: if !oddsAvailable, trapScore=null is expected — no flag, just a warning

  const flagged = reasons.length > 0;

  let confidence: ScoreConfidence;
  if (input.homeMotivationScore === null || (input.trapScore === null && input.oddsAvailable)) {
    confidence = 'low';
  } else if (input.dataQualityWarnings.length > 2) {
    confidence = 'low';
  } else if (input.dataQualityWarnings.length > 0 || !input.oddsAvailable) {
    confidence = 'medium';
  } else {
    confidence = 'high';
  }

  return {
    flagged,
    reasons,
    confidence,
    metadata: {
      favoriteMotivation,
      trapScore: input.trapScore,
      homeMotivationScore: input.homeMotivationScore,
      awayMotivationScore: input.awayMotivationScore,
      homeIsOddsFavorite: input.homeIsOddsFavorite,
      missingRequiredCount: input.missingRequiredFeatures.length,
      warningsCount: input.dataQualityWarnings.length,
    },
  };
}
