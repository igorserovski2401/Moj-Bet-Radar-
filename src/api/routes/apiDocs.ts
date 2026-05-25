import { ok } from '../../product/apiResponseBuilder';
import type { ApiResponse, ApiDocsPayload } from '../types';

const DOCS: ApiDocsPayload = {
  title: 'Moj Bet Radar — Enrichment API',
  version: '1.0.0',
  baseUrl: '/api/v1',
  endpoints: [
    {
      method: 'GET',
      path: '/radar/today',
      description: 'Returns enriched match risk reports for today\'s fixtures',
      params: { country: 'ISO country code filter, e.g. RS or HR (optional)' },
    },
    {
      method: 'GET',
      path: '/matches/:fixtureId/intelligence',
      description: 'Returns full enrichment report for a single fixture',
      params: { fixtureId: 'Numeric fixture ID' },
    },
    {
      method: 'GET',
      path: '/feed/publisher',
      description: 'Returns a publisher-ready feed with Markdown, HTML, and JSON variants',
      params: {
        country: 'ISO country code filter (optional)',
        language: 'en | sr | hr | bs | de (default: en)',
        format: 'json | markdown | html (default: json)',
      },
    },
    {
      method: 'GET',
      path: '/widgets/match-card/:fixtureId',
      description: 'Returns a widget-ready payload for embedding match risk data',
      params: { fixtureId: 'Numeric fixture ID' },
    },
    {
      method: 'GET',
      path: '/docs',
      description: 'Returns this API documentation',
    },
  ],
  responseEnvelope: JSON.stringify(
    {
      success: true,
      data: '<payload>',
      error: null,
      meta: {
        generatedAt: '<ISO8601>',
        version: '1.0.0',
        source: 'moj-bet-radar-enrichment',
      },
    },
    null,
    2
  ),
  complianceNote:
    'This API exposes enriched/proprietary match-risk intelligence only. ' +
    'Raw provider data is never included in responses. ' +
    'Outputs must not be used to place bets programmatically.',
};

export function getApiDocs(): ApiResponse<ApiDocsPayload> {
  return ok(DOCS);
}
