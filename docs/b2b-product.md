# Moj Bet Radar — B2B Product Overview

## What it is

Moj Bet Radar is a match-risk intelligence data product for football content publishers, affiliate websites, iGaming agencies, and sports media operators.

It produces enriched, proprietary analysis on football fixtures — not raw API data, not betting tips, not guaranteed predictions.

## What it is not

- Not a betting platform
- Not a tip service
- Not a raw data reseller
- Not a guaranteed-outcome product
- Not a consumer product

## Who it is for

**Primary buyers:**
- Betting affiliate websites needing differentiated match content
- Sports portals and news sites looking for structured pre-match analysis
- iGaming content agencies producing match previews at scale
- Tipster platforms that want risk intelligence on top of their own picks
- White-label data buyers needing embeddable widgets

**Later stage (after licensing/legal review):**
- Operators and bookmakers needing independent pre-match intelligence

## Why generic tip content is weak

Most affiliate content is: "Team A is in good form, we expect a win." This is commodity content. Any publisher can produce it. It ranks poorly, converts poorly, and adds no data value.

Moj Bet Radar adds:
- Motivation quantification (why does each team need points at this exact moment?)
- Trap detection (is the market mispricing the favorite?)
- Risk flagging (when should a reader avoid acting on apparent signals?)
- Confidence scoring (how reliable is this analysis given data availability?)

This is structured, reproducible, defensible analysis — not opinion.

## Enriched outputs available

### Motivation Score (0-100 per team)
Measures how much each team needs points based on: standings position, points gap to leader/relegation, season stage, and recent form momentum.

Returns: `homeMotivationScore`, `awayMotivationScore`, `motivationGap`.

A high gap (>30) between home and away motivation is an independent signal — one team has far more at stake.

### Trap Score (0-100)
Detects when market odds significantly overrate the favorite relative to their recent form.

Key signals: probability divergence, weak attacking output despite short odds, motivation reversal (underdog more motivated than favorite), odds shortening without form justification.

### No-Bet Flag
A composite binary flag that fires when: trap signal is high AND favorite motivation is low, OR required data is missing. Reasons are always included.

### Publisher Content Feed
Ready-to-embed match analysis blocks in:
- JSON (for API consumers)
- Markdown (for content management systems)
- HTML (for direct site injection)

Available in English, Serbian, Croatian, Bosnian, German.

### Match Card Payload
Structured card data for shareable or embeddable match summaries. Includes risk level classification: low / medium / high / avoid.

### Widget Payload
Provider-safe JSON designed to power an iframe or JS widget embed. Includes compliant disclaimer text in the target language.

### JSON API (local mock, deployable)
Standard REST-style endpoints with consistent response envelopes. Ready to wire to Express, Fastify, or a serverless function.

## Delivery formats

| Format | Description | Status |
|--------|-------------|--------|
| Publisher Feed | Markdown/HTML/JSON per match | ✅ Live |
| Match Card | Structured card payload | ✅ Live |
| Widget Payload | Embeddable widget JSON | ✅ Live |
| JSON API | REST endpoints | 🔲 Mock (deployable) |
| Dashboard | Internal monitoring UI | 🔲 Planned |

## Why we do not expose raw Sportmonks data

Sportmonks data is licensed per use case. Re-selling raw API payloads is a license violation. More importantly: raw data is a commodity. Our value is the enrichment layer — the scores, the flags, the analysis blocks. These are our proprietary outputs.

No raw Sportmonks payload is included in any B2B output. Provider IDs are used internally only.

## Compliance

See `docs/compliance-notes.md` for the full compliance framework.

Short version: this is match-risk analysis. It is not financial advice. It is not a bet recommendation. No outcomes are guaranteed. Customers handle their own local regulatory compliance.
