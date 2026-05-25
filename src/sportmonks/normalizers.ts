// Normalize raw Sportmonks v3 API responses into typed DB row objects.
// All functions return { row, warnings } — never throw on missing optional fields.
// Raw payloads are NOT returned here; callers store them in match_feature_snapshots.

import type {
  LeagueRow,
  SeasonRow,
  TeamRow,
  FixtureRow,
  StandingsSnapshotRow,
  OddsSnapshotRow,
} from '../lib/dbTypes';

function str(v: unknown): string {
  return typeof v === 'string' ? v : String(v ?? '');
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return isNaN(n) ? fallback : n;
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function asObj(v: unknown): Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

// ---- League ----

export function normalizeLeague(raw: unknown): { row: LeagueRow; warnings: string[] } {
  const r = asObj(raw);
  const warnings: string[] = [];
  if (!r['id']) warnings.push('league.id missing');
  if (!r['name']) warnings.push('league.name missing');
  const row: LeagueRow = {
    id: num(r['id']),
    name: str(r['name']),
    country_code: str(
      asObj(r['country'])['iso2'] ??
        asObj(r['country'])['name'] ??
        r['country_code'] ??
        'XX',
    ),
    sport_id: num(r['sport_id'], 1),
    is_active: r['active'] !== false,
    created_at: new Date().toISOString(),
  };
  return { row, warnings };
}

// ---- Season ----

export function normalizeSeason(
  raw: unknown,
  leagueId: number,
): { row: SeasonRow; warnings: string[] } {
  const r = asObj(raw);
  const warnings: string[] = [];
  if (!r['id']) warnings.push('season.id missing');
  const row: SeasonRow = {
    id: num(r['id']),
    league_id: num(r['league_id'], leagueId),
    name: str(r['name']),
    year: num(r['year'], new Date().getFullYear()),
    start_date: strOrNull(r['starting_at']),
    end_date: strOrNull(r['ending_at']),
    total_rounds: numOrNull(r['total_rounds']),
    is_current: r['is_current'] === true,
    created_at: new Date().toISOString(),
  };
  return { row, warnings };
}

// ---- Team ----

export function normalizeTeam(
  raw: unknown,
  leagueId?: number,
): { row: TeamRow; warnings: string[] } {
  const r = asObj(raw);
  const warnings: string[] = [];
  if (!r['id']) warnings.push('team.id missing');
  const row: TeamRow = {
    id: num(r['id']),
    name: str(r['name']),
    short_code: strOrNull(r['short_code']),
    country_code: str(
      asObj(r['country'])['iso2'] ??
        asObj(r['country'])['name'] ??
        r['country_code'] ??
        'XX',
    ),
    league_id: leagueId ?? null,
    created_at: new Date().toISOString(),
  };
  return { row, warnings };
}

// ---- Fixture ----

// Sportmonks v3 fixture status → our status enum.
const STATE_MAP: Record<string, string> = {
  NS: 'scheduled',
  LIVE: 'live',
  HT: 'live',
  ET: 'live',
  BREAK: 'live',
  FT: 'finished',
  AET: 'finished',
  PEN: 'finished',
  CANC: 'cancelled',
  POSTP: 'postponed',
  WO: 'cancelled',
  TBA: 'scheduled',
};

function parseRoundNumber(round: unknown): number | null {
  if (round == null) return null;
  const r = asObj(round);
  // "Round 5" or just "5" or numeric
  const name = str(r['name'] ?? r['round'] ?? round);
  const m = name.match(/\d+/);
  return m ? parseInt(m[0], 10) : numOrNull(round);
}

export function normalizeFixture(
  raw: unknown,
  seasonId: number,
): { row: FixtureRow; homeTeamId: number | null; awayTeamId: number | null; warnings: string[] } {
  const r = asObj(raw);
  const warnings: string[] = [];
  const fixtureId = num(r['id']);

  // Participants array → find home/away team IDs
  const participants = Array.isArray(r['participants']) ? r['participants'] : [];
  let homeTeamId: number | null = null;
  let awayTeamId: number | null = null;
  for (const p of participants) {
    const po = asObj(p);
    const meta = asObj(po['meta']);
    const loc = str(meta['location'] ?? '').toLowerCase();
    if (loc === 'home') homeTeamId = num(po['id']);
    else if (loc === 'away') awayTeamId = num(po['id']);
  }
  if (!homeTeamId) warnings.push(`fixture ${fixtureId}: home team not found in participants`);
  if (!awayTeamId) warnings.push(`fixture ${fixtureId}: away team not found in participants`);

  // Status
  const stateObj = asObj(r['state']);
  const stateCode = str(stateObj['state'] ?? stateObj['short_name'] ?? r['status'] ?? 'NS');
  const status = STATE_MAP[stateCode] ?? 'scheduled';

  // Kickoff
  const kickoffRaw = r['starting_at'] ?? r['kickoff_at'];
  const kickoffAt = kickoffRaw ? new Date(str(kickoffRaw)).toISOString() : null;
  if (!kickoffAt) warnings.push(`fixture ${fixtureId}: kickoff_at missing`);

  const now = new Date().toISOString();
  const row: FixtureRow = {
    id: fixtureId,
    season_id: num(r['season_id'], seasonId),
    home_team_id: homeTeamId ?? 0,
    away_team_id: awayTeamId ?? 0,
    round_number: parseRoundNumber(r['round']),
    kickoff_at: kickoffAt,
    status,
    venue: strOrNull(asObj(r['venue'])['name'] ?? r['venue']),
    created_at: now,
    updated_at: now,
  };
  return { row, homeTeamId, awayTeamId, warnings };
}

// ---- Standing row ----

export function normalizeStandingRow(
  raw: unknown,
  seasonId: number,
): { row: StandingsSnapshotRow; warnings: string[] } {
  const r = asObj(raw);
  const warnings: string[] = [];

  const teamId =
    num(r['participant_id']) ||
    num(asObj(r['participant'])['id']);

  if (!teamId) warnings.push('standings row: participant_id missing');

  // Form string — try result or form field
  const formRaw = strOrNull(r['result'] ?? r['form']) ?? '';

  // Stats may be flat on the row or in a `details` array keyed by type_id.
  // We try flat fields only. Never invent values — if missing, store null and warn.
  const played = numOrNull(r['played'] ?? r['games_played']);
  const won    = numOrNull(r['won'] ?? r['games_won']);
  const drawn  = numOrNull(r['draw'] ?? r['drawn'] ?? r['games_drawn']);
  const lost   = numOrNull(r['lost'] ?? r['games_lost']);
  const gf     = numOrNull(r['goals_scored'] ?? r['goals_for']);
  const ga     = numOrNull(r['goals_against'] ?? r['goals_conceded']);

  const missingStats = [played, won, drawn, lost, gf, ga].filter((v) => v === null);
  if (missingStats.length > 0) {
    warnings.push(
      `standings row team_id=${teamId}: ${missingStats.length} detail field(s) unavailable — stored as null`
    );
  }

  const row: StandingsSnapshotRow = {
    fixture_id: null,  // season-level snapshot
    season_id: seasonId,
    team_id: teamId,
    position: num(r['position'], 0),
    points: num(r['points'], 0),
    played,
    won,
    drawn,
    lost,
    goals_for: gf,
    goals_against: ga,
    form: formRaw || null,
    snapped_at: new Date().toISOString(),
  };
  return { row, warnings };
}

// ---- Odds snapshot ----

// Returns one row per bookmaker for the 1X2 market, or null if unusable.
export function normalizeOddsRows(
  raw: unknown,
  fixtureId: number,
): { rows: OddsSnapshotRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const items = Array.isArray(raw) ? raw : raw != null ? [raw] : [];

  const rows: OddsSnapshotRow[] = [];
  const now = new Date().toISOString();

  for (const item of items) {
    const r = asObj(item);
    const bookmakerName = str(
      asObj(r['bookmaker'])['name'] ?? r['bookmaker_id'] ?? 'unknown',
    );

    const oddsArr = Array.isArray(r['odds']) ? r['odds'] : [];
    let home: number | null = null;
    let draw: number | null = null;
    let away: number | null = null;

    for (const o of oddsArr) {
      const oo = asObj(o);
      const label = str(oo['label'] ?? oo['name'] ?? '').toUpperCase();
      const val = parseFloat(str(oo['value'] ?? oo['odds'] ?? '0'));
      if (isNaN(val) || val <= 1) continue;
      if (label === '1' || label === 'HOME') home = val;
      else if (label === 'X' || label === 'DRAW') draw = val;
      else if (label === '2' || label === 'AWAY') away = val;
    }

    if (home == null && draw == null && away == null) {
      warnings.push(`fixture ${fixtureId}: bookmaker "${bookmakerName}" has no 1X2 odds`);
      continue;
    }

    rows.push({
      fixture_id: fixtureId,
      bookmaker: bookmakerName,
      market: '1X2',
      home_odds: home,
      draw_odds: draw,
      away_odds: away,
      line_value: null,
      fetched_at: now,
      source: 'sportmonks',
    });
  }

  if (rows.length === 0) {
    warnings.push(`fixture ${fixtureId}: no usable 1X2 odds found`);
  }

  return { rows, warnings };
}
