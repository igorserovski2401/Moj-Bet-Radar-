// Row types for type-safe Supabase operations.
// These mirror the schema.sql table definitions.
// TODO: replace with supabase gen types once the project reaches stable schema.

export type LeagueRow = {
  id: number;
  name: string;
  country_code: string;
  sport_id: number;
  is_active: boolean;
  created_at: string;
};

export type SeasonRow = {
  id: number;
  league_id: number;
  name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  total_rounds: number | null;
  is_current: boolean;
  created_at: string;
};

export type TeamRow = {
  id: number;
  name: string;
  short_code: string | null;
  country_code: string;
  league_id: number | null;
  created_at: string;
};

export type FixtureRow = {
  id: number;
  season_id: number;
  home_team_id: number;
  away_team_id: number;
  round_number: number | null;
  kickoff_at: string | null;
  status: string;
  venue: string | null;
  created_at: string;
  updated_at: string;
};

// fixture_id is nullable: null = season-level snapshot, non-null = fixture-specific snapshot
export type StandingsSnapshotRow = {
  id?: string;
  fixture_id: number | null;
  season_id: number;
  team_id: number;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  form: string | null;
  snapped_at: string;
};

export type OddsSnapshotRow = {
  id?: string;
  fixture_id: number;
  bookmaker: string;
  market: string;
  home_odds: number | null;
  draw_odds: number | null;
  away_odds: number | null;
  line_value: number | null;
  fetched_at: string;
  source: string;
};

export type EnrichmentRunRow = {
  id?: string;
  fixture_id: number;
  triggered_at: string;
  completed_at: string | null;
  status: string;
  features_used: string[] | null;
  error_message: string | null;
  duration_ms: number | null;
};

export type MatchIntelligenceRow = {
  id?: string;
  fixture_id: number;
  motivation_home: number | null;
  motivation_away: number | null;
  motivation_gap: number | null;
  motivation_confidence: string | null;
  trap_score: number | null;
  trap_confidence: string | null;
  no_bet_flag: boolean;
  no_bet_reasons: string[] | null;
  referee_risk_score: number | null;
  rotation_risk_score: number | null;
  injury_suspension_risk_score: number | null;
  xg_reality_check_score: number | null;
  fatigue_congestion_score: number | null;
  market_movement_score: number | null;
  overall_confidence: string | null;
  generated_at: string;
  enrichment_run_id: string | null;
};

export type FeatureCoverageRow = {
  id?: string;
  country_code: string;
  league_id: number | null;
  season_id: number | null;
  feature_key: string;
  coverage_status: string;
  sample_fixture_id: number | null;
  sample_response_summary: Record<string, unknown> | null;
  checked_at: string;
  notes: string | null;
};

export type MatchFeatureSnapshotRow = {
  id?: string;
  fixture_id: number | null;  // null for season-level snapshots
  season_id?: number | null;
  feature_key: string;
  raw_payload: unknown;
  normalized_payload: Record<string, unknown> | null;
  provider: string;
  fetched_at: string;
  status: string;
  error_message: string | null;
};
