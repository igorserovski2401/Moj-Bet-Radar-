import { buildWidgetPayload } from '../../product/widgetPayloadBuilder';
import type { WidgetPayload } from '../../product/widgetPayloadBuilder';
import { ok, fail } from '../../product/apiResponseBuilder';
import type { ApiResponse } from '../types';
import { SAMPLE_MATCHES } from '../../demo/sampleEnrichedMatches';

export function getWidgetMatchCard(fixtureId: number): ApiResponse<WidgetPayload> {
  const match = SAMPLE_MATCHES.find((m) => m.fixtureId === fixtureId);
  if (!match) {
    return fail('NOT_FOUND', `No widget data found for fixtureId=${fixtureId}`);
  }
  try {
    return ok(buildWidgetPayload(match, 'en'));
  } catch (err) {
    return fail('BUILD_ERROR', err instanceof Error ? err.message : 'Widget build failed');
  }
}
