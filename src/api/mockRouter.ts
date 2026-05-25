// Mock router — pure functions, no HTTP server.
// Use these handlers to test the API contract locally before wiring a real server.

export { getRadarToday } from './routes/radarToday';
export { getMatchIntelligence } from './routes/matchIntelligence';
export { getPublisherFeed } from './routes/publisherFeed';
export { getWidgetMatchCard } from './routes/widgetMatchCard';
export { getApiDocs } from './routes/apiDocs';
