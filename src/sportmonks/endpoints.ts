// Sportmonks API v3 Football endpoint path builders.
// Base URL: SPORTMONKS_BASE_URL env var (default: https://api.sportmonks.com/v3/football).
//
// Auth: see client.ts — defaults to ?api_token query param (SPORTMONKS_AUTH_MODE=query).
// Token is NEVER logged or included in error messages.
//
// CONFIRMED V1 ENDPOINTS (used in production sync):
//   /leagues/{id}                          — league metadata
//   /leagues/{id}?include=currentSeason;seasons — seasons resolution (embedded)
//   /seasons/{id}                          — direct season fetch (fallback)
//   /teams/seasons/{seasonId}              — teams for a season
//   /fixtures/seasons/{seasonId}           — all fixtures for a season (paginated)
//   /standings/seasons/{seasonId}          — standings for a season
//   /odds/pre-match/fixtures/{fixtureId}   — pre-match odds for a fixture
//
// REMOVED (not verified live):
//   /seasons/leagues/{leagueId}  — REJECTED: not confirmed; use league include instead
//
// UNCERTAIN (not yet used):
//   /fixtures/between/{from}/{to} — date filter syntax unverified; we filter client-side instead

export const ENDPOINTS = {
  leagues: {
    byId: (id: number): string => `/leagues/${id}`,
  },
  seasons: {
    // Direct season fetch by ID — the reliable path when season ID is known
    byId: (id: number): string => `/seasons/${id}`,
    // NOTE: /seasons/leagues/{leagueId} is NOT used — not verified live.
    // Seasons are resolved via /leagues/{id}?include=currentSeason;seasons instead.
  },
  teams: {
    bySeason: (seasonId: number): string => `/teams/seasons/${seasonId}`,
    byId: (id: number): string => `/teams/${id}`,
  },
  fixtures: {
    bySeason: (seasonId: number): string => `/fixtures/seasons/${seasonId}`,
    byId: (id: number): string => `/fixtures/${id}`,
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
  leagues: {
    withSeasons: 'currentSeason;seasons',
  },
  fixtures: {
    withParticipants: 'participants',
    withParticipantsAndRound: 'participants;round',
  },
  standings: {
    withParticipant: 'participant',
    withAll: 'participant;details',
  },
} as const;
