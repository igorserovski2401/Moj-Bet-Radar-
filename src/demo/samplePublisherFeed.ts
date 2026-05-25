import { buildPublisherFeed } from '../product/publisherFeed';
import type { PublisherFeed } from '../product/publisherFeed';
import { SAMPLE_MATCHES } from './sampleEnrichedMatches';

export const SAMPLE_FEED_EN: PublisherFeed = buildPublisherFeed([...SAMPLE_MATCHES], {
  language: 'en',
  format: 'json',
  includeComplianceNote: true,
  includeNoBetWarnings: true,
});

export const SAMPLE_FEED_SR: PublisherFeed = buildPublisherFeed([...SAMPLE_MATCHES], {
  language: 'sr',
  format: 'json',
  includeComplianceNote: true,
  includeNoBetWarnings: true,
});
