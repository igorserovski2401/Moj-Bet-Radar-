-- ============================================================
-- Moj Bet Radar — Supabase Schema
-- Run in Supabase SQL editor (Settings > SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Core domain tables
-- ============================================================

CREATE TABLE IF NOT EXISTS leagues (
  id          bigint PRIMARY KEY,
  name        text NOT NULL,
  country_code text NOT NULL,
  sport_id    int NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seasons (
  id           bigint PRIMARY KEY,
  league_id    bigint NOT NULL REFERENCES leagues(id),
  name         text NOT NULL,
  year         int NOT NULL,
  start_date   date,
  end_date     date,
  total_rounds int,
  is_current   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id           bigint PRIMARY KEY,
  name         text NOT NULL,
  short_code   text,
  country_code text NOT NULL,
  league_id    bigint REFERENCES leagues(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fixtures (
  id           bigint PRIMARY KEY,
  season_id    bigint NOT NULL REFERENCES seasons(id),
  home_team_id bigint NOT NULL REFERENCES teams(id),
  away_team_id bigint NOT NULL REFERENCES teams(id),
  round_number int,
  kickoff_at   timestamptz,
  status       text NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled','live','finished','cancelled','postponed')),
  venue        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fixtures_season ON fixtures(season_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_kickoff ON fixtures(kickoff_at);

-- ============================================================
-- Snapshot tables (raw data from Sportmonks)
-- ============================================================

CREATE TABLE IF NOT EXISTS standings_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id   bigint NOT NULL REFERENCES fixtures(id),
  team_id      bigint NOT NULL REFERENCES teams(id),
  position     int NOT NULL,
  points       int NOT NULL,
  played       int NOT NULL DEFAULT 0,
  won          int NOT NULL DEFAULT 0,
  drawn        int NOT NULL DEFAULT 0,
  lost         int NOT NULL DEFAULT 0,
  goals_for    int NOT NULL DEFAULT 0,
  goals_against int NOT NULL DEFAULT 0,
  form         text,
  snapped_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_standings_fixture ON standings_snapshots(fixture_id);

CREATE TABLE IF NOT EXISTS odds_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id   bigint NOT NULL REFERENCES fixtures(id),
  bookmaker    text NOT NULL,
  market       text NOT NULL DEFAULT '1X2'
               CHECK (market IN ('1X2','BTTS','OU25','OU35')),
  home_odds    numeric(6,3),
  draw_odds    numeric(6,3),
  away_odds    numeric(6,3),
  line_value   numeric(5,2),
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  source       text NOT NULL DEFAULT 'sportmonks'
);

CREATE INDEX IF NOT EXISTS idx_odds_fixture ON odds_snapshots(fixture_id);

-- ============================================================
-- Enrichment output tables
-- ============================================================

CREATE TABLE IF NOT EXISTS enrichment_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id    bigint NOT NULL REFERENCES fixtures(id),
  triggered_at  timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','running','completed','failed')),
  features_used jsonb,
  error_message text,
  duration_ms   int
);

CREATE INDEX IF NOT EXISTS idx_runs_fixture ON enrichment_runs(fixture_id);

CREATE TABLE IF NOT EXISTS match_intelligence (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id                  bigint NOT NULL REFERENCES fixtures(id) UNIQUE,
  motivation_home             int,
  motivation_away             int,
  motivation_gap              int,
  motivation_confidence       text,
  trap_score                  int,
  trap_confidence             text,
  no_bet_flag                 boolean NOT NULL DEFAULT false,
  no_bet_reasons              jsonb,
  referee_risk_score          int,
  rotation_risk_score         int,
  injury_suspension_risk_score int,
  xg_reality_check_score      int,
  fatigue_congestion_score    int,
  market_movement_score       int,
  overall_confidence          text,
  generated_at                timestamptz NOT NULL DEFAULT now(),
  enrichment_run_id           uuid REFERENCES enrichment_runs(id)
);

-- ============================================================
-- Feature audit tables
-- ============================================================

CREATE TABLE IF NOT EXISTS sportmonks_feature_coverage (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code            text NOT NULL,
  league_id               bigint,
  season_id               bigint,
  feature_key             text NOT NULL,
  coverage_status         text NOT NULL
                          CHECK (coverage_status IN ('unknown','available','missing','partial','error')),
  sample_fixture_id       bigint,
  sample_response_summary jsonb,
  checked_at              timestamptz NOT NULL DEFAULT now(),
  notes                   text
);

-- COALESCE handles NULLs in unique index (nulls would not match otherwise)
CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_coverage
  ON sportmonks_feature_coverage (
    country_code,
    COALESCE(league_id, -1),
    COALESCE(season_id, -1),
    feature_key
  );

CREATE INDEX IF NOT EXISTS idx_coverage_feature_key ON sportmonks_feature_coverage(feature_key);

CREATE TABLE IF NOT EXISTS match_feature_snapshots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id         bigint NOT NULL,
  feature_key        text NOT NULL,
  raw_payload        jsonb,
  normalized_payload jsonb,
  provider           text NOT NULL DEFAULT 'sportmonks',
  fetched_at         timestamptz NOT NULL DEFAULT now(),
  status             text NOT NULL
                     CHECK (status IN ('success','error','partial','skipped')),
  error_message      text
);

CREATE INDEX IF NOT EXISTS idx_snapshots_fixture_id  ON match_feature_snapshots(fixture_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_feature_key ON match_feature_snapshots(feature_key);
CREATE INDEX IF NOT EXISTS idx_snapshots_fetched_at  ON match_feature_snapshots(fetched_at);
