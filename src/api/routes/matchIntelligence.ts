import type { MatchRiskReport } from '../../enrichment/types';
import { ok, fail } from '../../product/apiResponseBuilder';
import type { ApiResponse } from '../types';
import { SAMPLE_MATCHES } from '../../demo/sampleEnrichedMatches';

export function getMatchIntelligence(
  fixtureId: number
): ApiResponse<MatchRiskReport> {
  const match = SAMPLE_MATCHES.find((m) => m.fixtureId === fixtureId);
  if (!match) {
    return fail('NOT_FOUND', `No intelligence found for fixtureId=${fixtureId}`);
  }
  return ok(match);
}
