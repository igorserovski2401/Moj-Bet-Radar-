# Moj Bet Radar — API Contract v1.0

## Base URL

```
/api/v1
```

In production, prefix with your domain. Local mock: run handlers directly from `src/api/mockRouter.ts`.

## Response envelope

All responses follow this shape:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "generatedAt": "2025-04-19T17:00:00Z",
    "version": "1.0.0",
    "source": "moj-bet-radar-enrichment"
  }
}
```

On error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "No intelligence found for fixtureId=99999"
  },
  "meta": { ... }
}
```

## Versioning

Breaking changes increment the major version in the URL path (`/api/v2/...`). The `meta.version` field reflects the current schema version. Clients should check `meta.version` if they depend on specific fields.

---

## Endpoints

### GET /api/v1/radar/today

Returns enriched match risk reports for today's fixtures.

**Parameters:**
- `country` (optional) — ISO country code, e.g. `RS`, `HR`

**Example request:**
```
GET /api/v1/radar/today?country=RS
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "fixtureId": 10001,
      "homeTeamName": "NK Vojvodina",
      "awayTeamName": "FK Partizan",
      "kickoffAt": "2025-04-19T17:00:00Z",
      "countryCode": "RS",
      "leagueName": "Serbia SuperLiga",
      "motivation": {
        "homeMotivationScore": 79,
        "awayMotivationScore": 100,
        "overallMotivationScore": 89,
        "motivationGap": 21,
        "keyReasons": ["relegation_risk", "title_race", "strong_form_momentum"],
        "confidence": "high"
      },
      "trapScore": {
        "score": 0,
        "confidence": "high",
        "metadata": { "favoriteIsHome": false, "probabilityDivergence": -0.021 },
        "warnings": []
      },
      "noBetFlag": {
        "flagged": false,
        "reasons": [],
        "confidence": "high"
      },
      "missingRequiredFeatures": [],
      "dataQualityWarnings": []
    }
  ],
  "error": null,
  "meta": {
    "generatedAt": "2025-04-19T17:00:01Z",
    "version": "1.0.0",
    "source": "moj-bet-radar-enrichment"
  }
}
```

---

### GET /api/v1/matches/:fixtureId/intelligence

Full enrichment report for a single fixture.

**Example request:**
```
GET /api/v1/matches/10002/intelligence
```

Returns the same `MatchRiskReport` shape as above, for one fixture.

---

### GET /api/v1/feed/publisher

Publisher-ready feed with Markdown, HTML, and JSON variants per match.

**Parameters:**
- `country` (optional) — ISO country code
- `language` — `en | sr | hr | bs | de` (default: `en`)
- `format` — `json | markdown | html` (default: `json`)

**Example request:**
```
GET /api/v1/feed/publisher?country=RS&language=sr&format=json
```

**Example response (abbreviated):**
```json
{
  "success": true,
  "data": {
    "generatedAt": "...",
    "language": "sr",
    "countryCode": "RS",
    "matchCount": 2,
    "items": [
      {
        "fixtureId": 10001,
        "matchTitle": "NK Vojvodina vs FK Partizan",
        "homeMotivationScore": 79,
        "awayMotivationScore": 100,
        "trapScore": 0,
        "noBetFlag": false,
        "confidence": "high",
        "recommendedAction": "Prati",
        "readyToPublishMarkdown": "## NK Vojvodina vs FK Partizan\n...",
        "readyToPublishHtml": "<article class=\"mbr-match-card\">...",
        "jsonPayload": { ... }
      }
    ]
  }
}
```

---

### GET /api/v1/widgets/match-card/:fixtureId

Widget-ready payload for embedding.

**Example request:**
```
GET /api/v1/widgets/match-card/10002
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "fixtureId": 10002,
    "title": "FK Crvena Zvezda vs OFK Beograd",
    "scores": {
      "motivationHome": 14,
      "motivationAway": 100,
      "trap": 100,
      "confidence": "low"
    },
    "flags": {
      "noBet": true,
      "riskLevel": "avoid"
    },
    "text": {
      "headline": "FK Crvena Zvezda vs OFK Beograd — High Risk Match",
      "shortReason": "trapScore=100 with favoriteMotivation=14",
      "disclaimer": "This is football match-risk analysis, not a betting recommendation. No outcome is guaranteed."
    },
    "meta": {
      "generatedAt": "...",
      "countryCode": "RS",
      "leagueName": "Serbia SuperLiga"
    }
  }
}
```

---

### GET /api/v1/docs

Returns this API documentation as a structured object.

---

## Error codes

| Code | Meaning |
|------|---------|
| `NOT_FOUND` | Fixture ID does not exist in available data |
| `BUILD_ERROR` | Feed or widget builder failed |
| `INTERNAL_ERROR` | Unexpected server error |
