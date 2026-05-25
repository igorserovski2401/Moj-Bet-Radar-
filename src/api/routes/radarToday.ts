import type { MatchRiskReport } from '../../enrichment/types';
import { ok, fail } from '../../product/apiResponseBuilder';
import type { ApiResponse } from '../types';
import { SAMPLE_MATCHES } from '../../demo/sampleEnrichedMatches';

export type RadarTodayParams = {
  readonly country?: string;
};

export function getRadarToday(
  params: RadarTodayParams
): ApiResponse<readonly MatchRiskReport[]> {
  try {
    const matches = params.country
      ? SAMPLE_MATCHES.filter((m) => m.countryCode === params.country)
      : SAMPLE_MATCHES;
    return ok(matches);
  } catch (err) {
    return fail(
      'INTERNAL_ERROR',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}
