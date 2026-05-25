// Assembles a MatchEnrichmentContext for a given fixture from Supabase.
// Missing required data → missingRequired list (not a throw).
// Missing optional data → warnings list only.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MatchEnrichmentContext,
  StandingsContext,
  FormContext,
  OddsContext,
  MatchResult,
} from '../enrichment/types';
import type { StandingsSnapshotRow } from '../lib/dbTypes';
import { getSupabaseClient } from '../lib/supabaseClient';

export type BuildContextResult = {
  readonly ctx: MatchEnrichmentContext;
  readonly missingRequired: string[];
  readonly warnings: string[];
};

function parseForm(formStr: string | null): MatchResult[] {
  if (!formStr) return [];
  return (formStr.toUpperCase().split('').filter((c) => c === 'W' || c === 'D' || c === 'L') as MatchResult[]).slice(-5);
}

// Returns null if either input is null — never invent a goals estimate.
function last5GoalsEstimate(goalsTotal: number | null, played: number | null): number | null {
  if (goalsTotal === null || played === null) return null;
  if (played === 0) return null;
  return Math.round((goalsTotal / played) * 5);
}

export async function buildMatchEnrichmentContext(
  fixtureId: number,
  dbOverride?: SupabaseClient,
): Promise<BuildContextResult> {
  const db = dbOverride ?? getSupabaseClient();
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // ---- Fixture ----
  const { data: fixture, error: fixErr } = await db
    .from('fixtures')
    .select('*')
    .eq('id', fixtureId)
    .single();
  if (fixErr || !fixture) {
    missingRequired.push('fixture');
    // Cannot continue without fixture
    return {
      ctx: buildFallbackContext(fixtureId),
      missingRequired,
      warnings: ['fixture not found in DB'],
    };
  }

  // ---- Season ----
  const { data: season, error: seasonErr } = await db
    .from('seasons')
    .select('*, leagues(name, country_code)')
    .eq('id', fixture.season_id)
    .single();
  if (seasonErr || !season) {
    missingRequired.push('season');
    warnings.push(`season ${fixture.season_id} not found`);
  }

  // ---- Teams ----
  const teamIds = [fixture.home_team_id, fixture.away_team_id].filter(Boolean);
  const { data: teamsData, error: teamsErr } = await db
    .from('teams')
    .select('*')
    .in('id', teamIds);
  if (teamsErr || !teamsData || teamsData.length < 2) {
    missingRequired.push('teams');
    warnings.push('one or both teams not found in DB');
  }
  const teams = teamsData ?? [];
  const homeTeam = teams.find((t) => t.id === fixture.home_team_id);
  const awayTeam = teams.find((t) => t.id === fixture.away_team_id);

  // ---- Standings (latest season-level snapshot for both teams) ----
  const { data: standingsRows, error: standErr } = await db
    .from('standings_snapshots')
    .select('*')
    .eq('season_id', fixture.season_id)
    .is('fixture_id', null)
    .in('team_id', teamIds)
    .order('snapped_at', { ascending: false });

  // Deduplicate to latest snapshot per team
  const allStandings = (standingsRows ?? []) as unknown as StandingsSnapshotRow[];
  const latestByTeam = new Map<number, StandingsSnapshotRow>();
  for (const row of allStandings) {
    if (row.team_id != null && !latestByTeam.has(row.team_id)) latestByTeam.set(row.team_id, row);
  }
  const homeStanding = latestByTeam.get(fixture.home_team_id) ?? null;
  const awayStanding = latestByTeam.get(fixture.away_team_id) ?? null;

  if (standErr || !homeStanding || !awayStanding) {
    missingRequired.push('standings');
    warnings.push('standings snapshot missing for one or both teams');
  }

  // ---- Odds (latest 1X2 snapshot — optional) ----
  const { data: oddsRows, error: oddsErr } = await db
    .from('odds_snapshots')
    .select('*')
    .eq('fixture_id', fixtureId)
    .eq('market', '1X2')
    .order('fetched_at', { ascending: false })
    .limit(10);

  let oddsCtx: OddsContext | undefined;
  if (oddsErr || !oddsRows || oddsRows.length === 0) {
    warnings.push('odds not available for this fixture — trap analysis skipped');
  } else {
    // Pick the row with lowest overround (best quality odds)
    const best = oddsRows.find(
      (r) => r.home_odds != null && r.draw_odds != null && r.away_odds != null,
    ) ?? null;
    if (best) {
      oddsCtx = {
        homeOdds: best.home_odds,
        drawOdds: best.draw_odds,
        awayOdds: best.away_odds,
      };
    } else {
      warnings.push('odds rows exist but no complete 1X2 odds found');
    }
  }

  // ---- Build typed contexts ----
  const leagueRow = (season as Record<string, unknown> | null)?.['leagues'] as
    | { name: string; country_code: string }
    | null
    | undefined;

  const seasonCtx = season
    ? {
        roundNumber: season.total_rounds
          ? Math.round(season.total_rounds / 2)  // fallback if no current round
          : 1,
        totalRounds: season.total_rounds ?? 30,
        seasonId: season.id,
        leagueId: season.league_id,
        countryCode: leagueRow?.country_code ?? 'XX',
        leagueName: leagueRow?.name ?? 'Unknown League',
      }
    : {
        roundNumber: 1,
        totalRounds: 30,
        seasonId: fixture.season_id,
        leagueId: 0,
        countryCode: 'XX',
        leagueName: 'Unknown League',
      };

  // Try to get actual round from fixture
  const actualRoundNumber = fixture.round_number ?? seasonCtx.roundNumber;
  const seasonCtxFinal = { ...seasonCtx, roundNumber: actualRoundNumber };

  let standingsCtx: StandingsContext | undefined;
  let formCtx: FormContext | undefined;

  if (homeStanding && awayStanding) {
    // Determine total teams (max position we can infer from available data)
    const allPositions = allStandings.map((r) => r.position);
    const totalTeams = Math.max(...allPositions, 16);

    // Points leader — highest points in the snapshot set
    const allPoints = allStandings.map((r) => r.points);
    const leaderPoints = Math.max(...allPoints, awayStanding.points, homeStanding.points);

    // Relegation cutoff: typically bottom 2–3 teams; approximate as position > totalTeams - 3
    const relegationIdx = Math.max(totalTeams - 3, 1);
    const relegationTeams = allStandings
      .filter((r) => r.position >= relegationIdx)
      .map((r) => r.points);
    const relegationCutoff =
      relegationTeams.length > 0 ? Math.max(...relegationTeams) : 0;

    standingsCtx = {
      homeTeamPosition: homeStanding.position,
      awayTeamPosition: awayStanding.position,
      totalTeamsInLeague: totalTeams,
      leaderPoints,
      relegationCutoffPoints: relegationCutoff,
      homePoints: homeStanding.points,
      awayPoints: awayStanding.points,
    };

    const homeForm = parseForm(homeStanding.form);
    const awayForm = parseForm(awayStanding.form);

    if (homeForm.length > 0 || awayForm.length > 0) {
      const hGF = last5GoalsEstimate(homeStanding.goals_for, homeStanding.played);
      const hGA = last5GoalsEstimate(homeStanding.goals_against, homeStanding.played);
      const aGF = last5GoalsEstimate(awayStanding.goals_for, awayStanding.played);
      const aGA = last5GoalsEstimate(awayStanding.goals_against, awayStanding.played);

      if ([hGF, hGA, aGF, aGA].some((v) => v === null)) {
        warnings.push('goalsLast5 unavailable because goals_for or played is missing from standings');
      } else {
        warnings.push('goalsLast5 values are season-average estimates, not actual last-5 data');
      }

      formCtx = {
        homeRecentForm: homeForm,
        awayRecentForm: awayForm,
        homeGoalsScoredLast5: hGF,
        homeGoalsConcededLast5: hGA,
        awayGoalsScoredLast5: aGF,
        awayGoalsConcededLast5: aGA,
      };
    } else {
      warnings.push('form strings empty in standings — FormContext unavailable');
    }
  }

  const ctx: MatchEnrichmentContext = {
    fixture: {
      fixtureId: fixture.id,
      homeTeamId: fixture.home_team_id,
      awayTeamId: fixture.away_team_id,
      homeTeamName: homeTeam?.name ?? `Team ${fixture.home_team_id}`,
      awayTeamName: awayTeam?.name ?? `Team ${fixture.away_team_id}`,
      kickoffAt: fixture.kickoff_at ?? new Date().toISOString(),
    },
    season: seasonCtxFinal,
    standings: standingsCtx,
    form: formCtx,
    odds: oddsCtx,
  };

  return { ctx, missingRequired, warnings };
}

function buildFallbackContext(fixtureId: number): MatchEnrichmentContext {
  return {
    fixture: {
      fixtureId,
      homeTeamId: 0,
      awayTeamId: 0,
      homeTeamName: 'Unknown Home',
      awayTeamName: 'Unknown Away',
      kickoffAt: new Date().toISOString(),
    },
    season: {
      roundNumber: 1,
      totalRounds: 30,
      seasonId: 0,
      leagueId: 0,
      countryCode: 'XX',
      leagueName: 'Unknown',
    },
  };
}
