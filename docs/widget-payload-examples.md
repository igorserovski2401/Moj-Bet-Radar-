# Widget Payload Examples

Run `npm run demo:widget` to generate live output from sample data.

---

## Example Widget JSON

```json
{
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
    "generatedAt": "2025-04-19T17:00:00Z",
    "countryCode": "RS",
    "leagueName": "Serbia SuperLiga"
  }
}
```

---

## Risk level values

| riskLevel | Meaning |
|-----------|---------|
| `low` | Low trap signal, both teams motivated |
| `medium` | Moderate trap or motivation asymmetry |
| `high` | High trap signal |
| `avoid` | No-bet flag active + high trap signal |

---

## Usage note for iframe/JS widget (future)

The widget payload is designed to be consumed by a thin JS widget:

```html
<div data-mbr-widget data-fixture-id="10002"></div>
<script src="https://widget.mojbetradar.com/v1/widget.js"></script>
```

The widget script fetches `/api/v1/widgets/match-card/10002` and renders the payload into the div. The `text.disclaimer` field must always be rendered visibly.

The widget must never display:
- Raw odds values from the provider
- Provider fixture IDs
- Any guaranteed-outcome language

Implementation of the actual widget JS is planned for a future release.

---

## Confidence levels

| confidence | Meaning |
|------------|---------|
| `high` | Both V1 scores available, full form data, 5+ recent matches |
| `medium` | Scores available, some data gaps (e.g. no odds) |
| `low` | Missing required scorer, limited form data, or multiple warnings |
