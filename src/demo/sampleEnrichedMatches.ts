// Sample enriched matches for demos and mock API routes.
// All data is fictional. Teams and leagues are used for illustrative purposes only.
// No real fixtures are claimed or implied.

import { runEnrichment } from '../enrichment/scoreRegistry';
import type { MatchEnrichmentContext, MatchRiskReport } from '../enrichment/types';

// ---- Match A: Low-risk favorite (away team) ----
// NK Vojvodina (home) vs FK Partizan (away)
// Partizan is dominant title leader, Vojvodina barely above relegation.
// Away odds strongly favor Partizan. Form supports the odds. Low trap signal.

const ctxA: MatchEnrichmentContext = {
  fixture: {
    fixtureId: 10001,
    homeTeamId: 501,
    awayTeamId: 502,
    homeTeamName: 'NK Vojvodina',
    awayTeamName: 'FK Partizan',
    kickoffAt: '2025-04-19T17:00:00Z',
  },
  season: {
    roundNumber: 28,
    totalRounds: 30,
    seasonId: 23584,
    leagueId: 271,
    countryCode: 'RS',
    leagueName: 'Serbia SuperLiga',
  },
  standings: {
    homeTeamPosition: 8,
    awayTeamPosition: 1,
    totalTeamsInLeague: 16,
    leaderPoints: 72,
    relegationCutoffPoints: 28,
    homePoints: 32,
    awayPoints: 72,
  },
  form: {
    homeRecentForm: ['W', 'D', 'L', 'L', 'L'],
    awayRecentForm: ['W', 'W', 'W', 'D', 'W'],
    homeGoalsScoredLast5: 4,
    homeGoalsConcededLast5: 8,
    awayGoalsScoredLast5: 11,
    awayGoalsConcededLast5: 3,
  },
  odds: {
    homeOdds: 4.20,
    drawOdds: 3.50,
    awayOdds: 1.75,
  },
};

// ---- Match B: Trap favorite (home team) ----
// FK Crvena Zvezda (home) vs OFK Beograd (away)
// Zvezda is safe mid-table, terrible form, heavy short-odds favorite.
// OFK fighting relegation with strong recent form.
// High trap signal + extreme home apathy → noBetFlag fires.

const ctxB: MatchEnrichmentContext = {
  fixture: {
    fixtureId: 10002,
    homeTeamId: 503,
    awayTeamId: 504,
    homeTeamName: 'FK Crvena Zvezda',
    awayTeamName: 'OFK Beograd',
    kickoffAt: '2025-04-19T19:30:00Z',
  },
  season: {
    roundNumber: 27,
    totalRounds: 30,
    seasonId: 23584,
    leagueId: 271,
    countryCode: 'RS',
    leagueName: 'Serbia SuperLiga',
  },
  standings: {
    homeTeamPosition: 6,
    awayTeamPosition: 12,
    totalTeamsInLeague: 16,
    leaderPoints: 72,
    relegationCutoffPoints: 28,
    homePoints: 40,
    awayPoints: 32,
  },
  form: {
    homeRecentForm: ['L', 'D', 'L', 'W', 'L'],
    awayRecentForm: ['W', 'W', 'D', 'W', 'D'],
    homeGoalsScoredLast5: 4,
    homeGoalsConcededLast5: 5,
    awayGoalsScoredLast5: 8,
    awayGoalsConcededLast5: 4,
  },
  odds: {
    homeOdds: 1.35,
    drawOdds: 4.50,
    awayOdds: 9.00,
  },
};

// ---- Match C: Low data quality (no odds available) ----
// GNK Dinamo Zagreb (home) vs HNK Hajduk Split (away)
// Derby match, mid-season, both teams safe mid-table.
// Odds not available (optional feature). noBetFlag should NOT fire.

const ctxC: MatchEnrichmentContext = {
  fixture: {
    fixtureId: 10003,
    homeTeamId: 601,
    awayTeamId: 602,
    homeTeamName: 'GNK Dinamo Zagreb',
    awayTeamName: 'HNK Hajduk Split',
    kickoffAt: '2025-03-22T18:00:00Z',
  },
  season: {
    roundNumber: 15,
    totalRounds: 30,
    seasonId: 23590,
    leagueId: 210,
    countryCode: 'HR',
    leagueName: 'Hrvatska Prva HNL',
  },
  standings: {
    homeTeamPosition: 4,
    awayTeamPosition: 5,
    totalTeamsInLeague: 10,
    leaderPoints: 45,
    relegationCutoffPoints: 20,
    homePoints: 35,
    awayPoints: 33,
  },
  form: {
    homeRecentForm: ['W', 'D', 'W', 'L', 'D'],
    awayRecentForm: ['D', 'W', 'L', 'D', 'W'],
    homeGoalsScoredLast5: 7,
    homeGoalsConcededLast5: 5,
    awayGoalsScoredLast5: 6,
    awayGoalsConcededLast5: 5,
  },
  // No odds — intentionally omitted to test graceful degradation
};

// Run enrichment pipeline on all three contexts
export const MATCH_A: MatchRiskReport = runEnrichment(ctxA);
export const MATCH_B: MatchRiskReport = runEnrichment(ctxB);
export const MATCH_C: MatchRiskReport = runEnrichment(ctxC);

export const SAMPLE_MATCHES: readonly MatchRiskReport[] = [MATCH_A, MATCH_B, MATCH_C];
