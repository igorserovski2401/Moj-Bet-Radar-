import { getRadarToday, getPublisherFeed, getWidgetMatchCard, getApiDocs } from '../api/mockRouter';

export const SAMPLE_RADAR_TODAY = getRadarToday({ country: 'RS' });
export const SAMPLE_PUBLISHER_FEED = getPublisherFeed({ country: 'RS', language: 'en', format: 'json' });
export const SAMPLE_WIDGET_B = getWidgetMatchCard(10002); // trap match
export const SAMPLE_API_DOCS = getApiDocs();
