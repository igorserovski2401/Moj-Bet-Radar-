# Sportmonks V1 Endpoints

Base URL: `https://api.sportmonks.com/v3/football`  
Auth: `Authorization: Bearer {token}` header (never in query string)

## Implemented endpoints

| Endpoint | Status | Includes used | Output table | Notes |
|----------|--------|---------------|--------------|-------|
| `GET /leagues/{id}` | ✓ Implemented | none | `leagues` | Confirmed v3 path |
| `GET /seasons/leagues/{leagueId}` | ✓ Implemented | none | `seasons` | Returns all seasons for league |
| `GET /teams/seasons/{seasonId}` | ✓ Implemented | none | `teams` | Paginated via `getAll()` |
| `GET /fixtures/seasons/{seasonId}` | ✓ Implemented | `participants;round` | `fixtures` | Paginated; `participants` needed for home/away IDs |
| `GET /standings/seasons/{seasonId}` | ✓ Implemented | `participant` | `standings_snapshots` | Single response (no pagination needed) |
| `GET /odds/pre-match/fixtures/{fixtureId}` | ✓ Implemented | none | `odds_snapshots` | Optional — 404/422 = graceful skip |

## TODOs and uncertainty

### Fixture participants format
- Assumed: `participants` array with `meta.location` = `"home"` / `"away"` per team entry.
- If `meta.location` is missing or named differently, normalizer warns and returns `homeTeamId = 0`.
- **TODO**: Verify exact field path once first real sync runs.

### Standings details array
- The `details` sub-array (type_id keyed stats) is not parsed — we use flat fields (`points`, `played`, `won`, etc.) which are typically top-level in Sportmonks v3 standings.
- If flat fields are absent, values default to 0 with a warning.
- **TODO**: Map key `type_id` values if flat fields prove unavailable for some leagues.

### Standings form field
- Assumed present at `result` or `form` on each standing row.
- Used to derive `FormContext.homeRecentForm` / `awayRecentForm`.
- `goalsLast5` is a season-average estimate (goals/played * 5), not actual last-5 data.
- **TODO**: Consider fetching per-fixture results to compute true last-5 goals.

### Odds structure
- Assumed: response is an array of bookmaker objects, each with `bookmaker.name` and `odds` array (labels `"1"`, `"X"`, `"2"`).
- If Sportmonks returns a single wrapper object, `normalizeOddsRows` handles it via `[raw]`.
- **TODO**: Verify odds response shape (single vs. array) after first real odds sync.

### Fixture status codes
- `STATE_MAP` covers: `NS`, `LIVE`, `HT`, `ET`, `BREAK`, `FT`, `AET`, `PEN`, `CANC`, `POSTP`, `WO`, `TBA`.
- Unknown codes fall back to `scheduled`.
- **TODO**: Add `ABD` (abandoned) and any league-specific codes found in real data.

### Date filtering for fixtures
- Fixtures are fetched for the full season, then filtered client-side by `kickoff_at` date range.
- Sportmonks v3 does not guarantee a reliable server-side date filter in the season fixtures endpoint.
- For large seasons (200+ fixtures), this may cause extra API calls. Consider caching or server-side filter if available.

## Not implemented (V1.5+)

| Endpoint | Tier | Reason |
|----------|------|--------|
| `/fixtures/head-to-head/{t1}/{t2}` | V1.5 | plannedForV15 |
| `/referees/{fixtureId}` | V1.5 | plannedForV15 — low Balkan coverage |
| `/lineups/fixtures/{fixtureId}` | V1.5 | plannedForV15 — only available ~1h pre-kickoff |
| `/squads/seasons/{s}/teams/{t}` (sidelined) | V1.5 | plannedForV15 |
| `/statistics/seasons/xg` | V1.5 | plannedForV15 — partial coverage in Balkan leagues |
| `/schedules/seasons/{id}` | V1 optional | plannedForV1 — fatigue scoring not yet wired |
