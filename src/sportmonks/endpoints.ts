// Sportmonks API v3 Football endpoint path builders.
// Base URL is read from SPORTMONKS_BASE_URL env var (default: https://api.sportmonks.com/v3/football).
// Authentication: Authorization: Bearer {token} header (never in query string).
//
// UNCERTAINTY NOTES (verified against Sportmonks v3 public docs as of 2025):
// - /leagues/{id}                  → confirmed
// - /seasons/{id}                  → confirmed
// - /seasons/leagues/{leagueId}    → confirmed
// - /teams/seasons/{seasonId}      → confirmed
// - /fixtures/seasons/{seasonId}   → confirmed
// - /standings/seasons/{seasonId}  → confirmed
// - /odds/pre-match/fixtures/{id}  → confirmed
// - /fixtures/between/{from}/{to}  → confirmed (date format: YYYY-MM-DD)
//   Filter by league: uncertain — may require ?filters[fixture_league_id]={id}
//   Fallback: fetch all season fixtures, filter by date in app.

export const ENDPOINTS = {
  leagues: {
    byId: (id: number): string => `/leagues/${id}`,
  },
  seasons: {
    byId: (id: number): string => `/seasons/${id}`,
    byLeague: (leagueId: number): string => `/seasons/leagues/${leagueId}`,
  },
  teams: {
    bySeason: (seasonId: number): string => `/teams/seasons/${seasonId}`,
    byId: (id: number): string => `/teams/${id}`,
  },
  fixtures: {
    bySeason: (seasonId: number): string => `/fixtures/seasons/${seasonId}`,
    byId: (id: number): string => `/fixtures/${id}`,
    // TODO: verify filter syntax for league filtering in date range queries
    between: (from: string, to: string): string => `/fixtures/between/${from}/${to}`,
  },
  standings: {
    bySeason: (seasonId: number): string => `/standings/seasons/${seasonId}`,
  },
  odds: {
    preMatchByFixture: (fixtureId: number): string =>
      `/odds/pre-match/fixtures/${fixtureId}`,
  },
} as const;

// Include strings for nested data
export const INCLUDES = {
  fixtures: {
    withParticipants: 'participants',
    withParticipantsAndRound: 'participants;round',
  },
  standings: {
    withDetails: 'details',
    withParticipant: 'participant',
    withAll: 'participant;details',
  },
} as const;
