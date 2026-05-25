import { buildWidgetPayload } from '../product/widgetPayloadBuilder';
import type { WidgetPayload } from '../product/widgetPayloadBuilder';
import { MATCH_A, MATCH_B, MATCH_C } from './sampleEnrichedMatches';

export const WIDGET_A: WidgetPayload = buildWidgetPayload(MATCH_A, 'en');
export const WIDGET_B: WidgetPayload = buildWidgetPayload(MATCH_B, 'en');
export const WIDGET_C: WidgetPayload = buildWidgetPayload(MATCH_C, 'en');
