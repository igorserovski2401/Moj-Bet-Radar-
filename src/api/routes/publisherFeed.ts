import { buildPublisherFeed } from '../../product/publisherFeed';
import type { PublisherFeed, PublisherFeedOptions, SupportedLanguage, FeedFormat } from '../../product/publisherFeed';
import { ok, fail } from '../../product/apiResponseBuilder';
import type { ApiResponse } from '../types';
import { SAMPLE_MATCHES } from '../../demo/sampleEnrichedMatches';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'sr', 'hr', 'bs', 'de'];
const SUPPORTED_FORMATS: FeedFormat[] = ['json', 'markdown', 'html'];

export type PublisherFeedParams = {
  readonly country?: string;
  readonly language?: string;
  readonly format?: string;
};

export function getPublisherFeed(
  params: PublisherFeedParams
): ApiResponse<PublisherFeed> {
  const language = (
    SUPPORTED_LANGUAGES.includes(params.language as SupportedLanguage)
      ? params.language
      : 'en'
  ) as SupportedLanguage;

  const format = (
    SUPPORTED_FORMATS.includes(params.format as FeedFormat)
      ? params.format
      : 'json'
  ) as FeedFormat;

  try {
    const matches = params.country
      ? [...SAMPLE_MATCHES].filter((m) => m.countryCode === params.country)
      : [...SAMPLE_MATCHES];

    const options: PublisherFeedOptions = {
      countryCode: params.country,
      language,
      format,
      includeComplianceNote: true,
      includeNoBetWarnings: true,
    };

    const feed = buildPublisherFeed(matches, options);
    return ok(feed);
  } catch (err) {
    return fail('BUILD_ERROR', err instanceof Error ? err.message : 'Feed build failed');
  }
}
