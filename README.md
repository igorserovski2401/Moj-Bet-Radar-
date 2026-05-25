# Moj Bet Radar

**Balkan Match Risk Intelligence** — enrichment pipeline and B2B data product.

This is a data-enrichment backend. It is not a betting platform, a Telegram bot, or a UI product.

---

## What it does

Takes raw Sportmonks API 3.0 data and produces:

- **Motivation Score** — how much each team needs points (standings, form, season stage)
- **Trap Score** — odds vs form divergence detection (favorite-agnostic)
- **No-Bet Flag** — composite risk signal when multiple conditions align
- **Publisher Feed** — ready-to-publish Markdown, HTML, and JSON for content sites
- **Widget Payload** — embeddable card data for affiliate widgets
- **API Contract** — mock endpoints usable locally, ready for a real server

---

## Quick start

```
cp .env.example .env
npm install
npm run demo:publisher-feed
npm run demo:widget
npm run demo:api
npm run audit -- --mock
npm run typecheck
```

---

## How to audit Sportmonks coverage before enabling a feature

Before enabling any feature in `src/config/features.ts` or wiring a new scorer, run a coverage audit to verify that the target league actually has the data available.

### Step 1 — Run mock audit (no API key needed)

```
npm run audit -- --mock
```

Uses hardcoded Serbia SuperLiga 2024/25 reference data. Shows you the format and which features are realistic to expect for Balkan leagues.

### Step 2 — Run real audit for your target league

```
npm run audit -- --country=Serbia --league-id=271
```

Requires `SPORTMONKS_API_TOKEN` in `.env`. Probes live Sportmonks endpoints and writes results to `sportmonks_feature_coverage` if Supabase is configured.

### Step 3 — Read the symbols

```
✓ available   — endpoint returned expected data for this league/season
~ partial     — endpoint responded but with missing nested fields
✗ missing     — endpoint returned 404 or empty data array
? unknown     — not yet audited
```

### Step 4 — Decide based on tier

- **V1 Required** (`fixtures`, `teams`, `standings`): must be `✓`. Missing = hard noBetFlag on every fixture.
- **V1 Optional** (`odds`, `team_recent_form`, `team_season_statistics`, `schedules`): partial is tolerable. Missing = graceful degradation, no hard flag.
- **V1.5 / V2**: do not enable until coverage is `✓` and scorer logic is implemented.

### Step 5 — Enable a feature

1. Confirm coverage in audit output
2. Update `FEATURE_TIERS` in `src/config/features.ts` if needed
3. Add or activate scorer in `src/enrichment/scoreRegistry.ts`
4. Re-run `npm run typecheck`

---

## Architecture

```
Sportmonks API 3.0
      │
      ▼
SportmonksClient (src/sportmonks/client.ts)
      │
      ├──→ capabilityAudit.ts → sportmonks_feature_coverage (Supabase)
      │
      ▼
match_feature_snapshots (raw + normalized payloads, Supabase)
      │
      ▼
MatchEnrichmentContext (assembled from snapshots)
      │
      ├──→ motivationScore (V1 — real logic)
      ├──→ trapScore       (V1 — real logic)
      ├──→ [6 stub scorers — V1.5/V2]
      └──→ noBetFlag       (V1 — composite, second-pass)
                │
                ▼
          MatchRiskReport
                │
      ┌─────────┼──────────┐
      ▼         ▼          ▼
 Publisher   Widget      API
   Feed     Payload   Response
```

---

## Score status

| Score | Status | Required data |
|-------|--------|---------------|
| Motivation Score | ✅ V1 live | standings, form |
| Trap Score | ✅ V1 live | odds, form |
| No-Bet Flag | ✅ V1 live | motivation + trap outputs |
| Referee Risk | 🔲 Stub | referee_statistics (V1.5) |
| Rotation Risk | 🔲 Stub | lineups + schedules (V1.5) |
| Injury/Suspension Risk | 🔲 Stub | injuries_suspensions (V1.5) |
| xG Reality Check | 🔲 Stub | xg_match (V1.5) |
| Fatigue/Congestion | 🔲 Stub | schedules (V1 optional) |
| Market Movement | 🔲 Stub | historical odds provider (V2) |

---

## Environment variables

```
SPORTMONKS_API_TOKEN=        # from sportmonks.com — never logged
SPORTMONKS_BASE_URL=         # default: https://api.sportmonks.com/v3/football
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # service role — keep secret
MOCK_MODE=true               # set false for live API
```

`.env` and `.env.local` are gitignored.

---

## B2B product

See `docs/b2b-product.md` for the full B2B delivery model, pricing tiers, and sales materials.
