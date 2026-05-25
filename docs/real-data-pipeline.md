# Real V1 Data Pipeline

## Overview

```
Sportmonks API v3
  → syncV1League      → leagues / seasons / teams / fixtures / standings / odds  (Supabase)
  → enrichV1Fixtures  → enrichment_runs / match_intelligence                     (Supabase)
  → feed:real         → output/publisher-feed.json, publisher-feed.md, widget-sample.json
```

## 1. Environment setup

Create `.env` in project root:

```
SPORTMONKS_API_TOKEN=your_token_here
SPORTMONKS_BASE_URL=https://api.sportmonks.com/v3/football
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
MOCK_MODE=false
DEFAULT_COUNTRY=Serbia
DEFAULT_LEAGUE_ID=271
DEFAULT_SEASON_ID=23584
```

Never commit `.env`.

## 2. Apply schema to Supabase

Run `schema.sql` in your Supabase project's SQL Editor (Settings → SQL Editor → New query → paste → Run).

Key change vs. original: `standings_snapshots.fixture_id` is now nullable; `season_id` added.

## 3. Test connection

```bash
npm run sportmonks:test
```

Expected output:
```
✓ Sportmonks API reachable — league: SuperLiga (Serbia)
```

Failures:
- `SPORTMONKS_API_TOKEN not set` — add to `.env`
- `HTTP 401` — wrong token
- `HTTP 403` — plan does not include this endpoint

## 4. Run real coverage audit

```bash
npm run sportmonks:audit:real -- --league-id=271 --season-id=23584
```

Probes 4 V1 endpoints live (fixtures, teams, standings, odds). All other features remain at their default status.

To save results to Supabase:
```bash
npm run sportmonks:audit:real -- --league-id=271 --season-id=23584 --save-to-db
```

## 5. Sync V1 data

```bash
npm run sync:v1 -- --league-id=271 --season-id=23584
```

Optional flags:
- `--days-ahead=7` (default: 7) — fixture window, days into the future
- `--days-back=1` (default: 1) — fixture window, days into the past
- `--mock` — skip real API calls (no-op, exits 0)

What it syncs:
1. League metadata → `leagues`
2. All seasons for the league → `seasons`
3. Teams for the season → `teams`
4. Fixtures within the date window → `fixtures` + raw in `match_feature_snapshots`
5. Current standings → `standings_snapshots` + raw in `match_feature_snapshots`
6. Odds per synced fixture (best-effort, 404/422 = skip) → `odds_snapshots`

## 6. Run enrichment

```bash
npm run enrich:v1 -- --season-id=23584
```

Enriches all upcoming fixtures (today + 3 days). Results go to `enrichment_runs` and `match_intelligence`.

Single fixture:
```bash
npm run enrich:v1 -- --fixture-id=12345678
```

Mock mode (uses built-in sample data, no DB):
```bash
npm run enrich:v1 -- --mock
```

## 7. Generate publisher feed

```bash
npm run feed:real -- --season-id=23584
```

Writes:
- `output/publisher-feed.json` — full JSON feed
- `output/publisher-feed.md` — markdown cards for all matches
- `output/widget-sample.json` — widget payload for first match

Mock mode:
```bash
npm run feed:real -- --mock
```

## Troubleshooting

| Symptom | Cause | Action |
|---------|-------|--------|
| `SPORTMONKS_API_TOKEN not set` | Missing env var | Add to `.env` |
| `HTTP 401` | Wrong token | Check token in Sportmonks dashboard |
| `HTTP 403` | Endpoint not on plan | Feature unavailable on your subscription |
| `HTTP 429` | Rate limit hit | Client retries automatically with backoff |
| `standings upsert failed` | Schema not applied | Run `schema.sql` in Supabase |
| `standings snapshot missing` | Standings not synced | Run `sync:v1` before `enrich:v1` |
| `odds not available` | Optional — expected | Enrichment continues without odds (trap score skipped) |
| Empty fixture list | Date window too narrow | Increase `--days-ahead` |
