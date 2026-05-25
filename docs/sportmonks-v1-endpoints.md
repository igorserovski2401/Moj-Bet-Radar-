# Sportmonks V1 Endpoints

Base URL: `https://api.sportmonks.com/v3/football`

## Authentication

Default mode: `SPORTMONKS_AUTH_MODE=query` (recommended)  
- Sends `?api_token=...` as a query parameter  
- Token is **never** logged, never included in error messages  
- Debug mode (`SPORTMONKS_DEBUG=true`) redacts token to `[REDACTED]` in any logged URL

Header mode: `SPORTMONKS_AUTH_MODE=header`  
- Sends `Authorization: Bearer {token}` instead  
- If this returns HTTP 401, the client reports clearly and recommends switching to query mode  
- Some Sportmonks plans require header mode; others only work with query mode

## Implemented V1 endpoints

| Endpoint | Status | Include used | Output table | Notes |
|----------|--------|--------------|--------------|-------|
| `GET /leagues/{id}` | ✓ Used | `currentSeason;seasons` | `leagues` | Confirmed v3 path; include used for season resolution |
| `GET /seasons/{id}` | ✓ Used (fallback) | none | `seasons` | Fallback if league include does not return seasons |
| `GET /teams/seasons/{seasonId}` | ✓ Used | none | `teams` | Paginated |
| `GET /fixtures/seasons/{seasonId}` | ✓ Used | `participants;round` | `fixtures` | Paginated; `participants` needed for home/away team IDs |
| `GET /standings/seasons/{seasonId}` | ✓ Used | `participant` | `standings_snapshots` | Single-call response |
| `GET /odds/pre-match/fixtures/{fixtureId}` | ✓ Used | none | `odds_snapshots` | Optional — 404/422/403 = graceful skip |

## Rejected endpoint

| Endpoint | Status | Reason |
|----------|--------|--------|
| `GET /seasons/leagues/{leagueId}` | ✗ NOT USED | Not verified live — removed from all code |

Season resolution uses `/leagues/{leagueId}?include=currentSeason;seasons` instead. If that include does not return embedded seasons, falls back to `GET /seasons/{DEFAULT_SEASON_ID}` directly.

## Season resolution strategy

```
1. GET /leagues/{leagueId}?include=currentSeason;seasons
   → if league.seasons[] present → use those
   → if league.currentSeason present → use that
2. If no embedded seasons:
   GET /seasons/{DEFAULT_SEASON_ID}  (explicit fallback)
3. If that also fails:
   warn and continue without seasons synced
```

## Odds availability

Odds are an **optional V1 feature**. Availability depends on your Sportmonks subscription add-on.

- Empty array response → `match_feature_snapshots.status = 'skipped'`
- HTTP 403/404/422 → `status = 'skipped'` (not an error)
- Valid 1X2 rows → `status = 'success'`, upserted to `odds_snapshots`
- Partial labels (e.g. only home+draw) → stored with `status = 'partial'`

Odds per bookmaker are stored as one row per `(fixture_id, bookmaker, market)`. Unique index `uq_odds_snapshot` enforces this.

## TODOs and uncertainty

### Fixture participants format
- Assumed: `participants` array with `meta.location` = `"home"` / `"away"`.
- Normalizer warns and sets `homeTeamId = 0` if location field is missing.
- **TODO**: Verify exact field path after first real sync.

### Standings row fields
- Flat fields (`points`, `played`, `won`, `drawn`, `lost`, `goals_for/against`) are read directly.
- `details` sub-array (type_id keyed) is not parsed — falls back to 0 with warning.
- Form string: tries `result` field first, then `form`.
- **TODO**: Confirm field names from real standings response.

### Form data quality
- `FormContext.homeRecentForm` / `awayRecentForm` parsed from standings form string (e.g. "WWDLW").
- `goalsLast5` is a season-average estimate: `round(goals / played * 5)`. Warned in output.
- **TODO V1.5**: fetch per-fixture results to compute true last-5 goals.

### Fixture status codes
- `STATE_MAP` covers: `NS`, `LIVE`, `HT`, `ET`, `BREAK`, `FT`, `AET`, `PEN`, `CANC`, `POSTP`, `WO`, `TBA`.
- Unknown codes fall back to `scheduled`.
- **TODO**: Add `ABD` (abandoned) and any league-specific codes found in real data.

## Not implemented (V1.5+)

| Endpoint | Tier | Reason |
|----------|------|--------|
| `/fixtures/head-to-head/{t1}/{t2}` | V1.5 | plannedForV15 |
| `/referees/{fixtureId}` | V1.5 | plannedForV15 — low Balkan coverage |
| `/lineups/fixtures/{fixtureId}` | V1.5 | only available ~1h pre-kickoff |
| `/squads/seasons/{s}/teams/{t}` (sidelined) | V1.5 | plannedForV15 |
| `/statistics/seasons/xg` | V1.5 | partial coverage in Balkan leagues |
| `/schedules/seasons/{id}` | V1 optional | fatigue scoring not yet wired |
