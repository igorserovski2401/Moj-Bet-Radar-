# Publisher Feed Examples

Run `npm run demo:publisher-feed` to generate live output from sample data.

---

## JSON Example

```json
{
  "generatedAt": "2025-04-19T17:00:00Z",
  "language": "en",
  "countryCode": "RS",
  "matchCount": 1,
  "items": [
    {
      "fixtureId": 10002,
      "matchTitle": "FK Crvena Zvezda vs OFK Beograd",
      "countryCode": "RS",
      "leagueName": "Serbia SuperLiga",
      "kickoffTime": "2025-04-19T19:30:00Z",
      "homeTeam": "FK Crvena Zvezda",
      "awayTeam": "OFK Beograd",
      "homeMotivationScore": 14,
      "awayMotivationScore": 100,
      "trapScore": 100,
      "noBetFlag": true,
      "confidence": "low",
      "recommendedAction": "Avoid",
      "motivationSummary": "FK Crvena Zvezda motivation: 14/100. OFK Beograd motivation: 100/100. Motivation gap is significant (86 points).",
      "trapSummary": "High trap signal (100/100). Market odds may not reflect recent form.",
      "noBetSummary": "Risk flag active: TRAP+APATHY: trapScore=100 with favoriteMotivation=14.",
      "jsonPayload": {
        "fixtureId": 10002,
        "scores": { "homeMotivation": 14, "awayMotivation": 100, "trap": 100 },
        "flags": { "noBet": true },
        "action": "Avoid",
        "confidence": "low"
      }
    }
  ]
}
```

---

## Markdown Example

```markdown
## FK Crvena Zvezda vs OFK Beograd
**Serbia SuperLiga** | 2025-04-19T19:30:00Z

| Score | Value |
|-------|-------|
| Home Motivation | 14/100 |
| Away Motivation | 100/100 |
| Trap Score | 100/100 |
| Risk Flag | ⚠️ Yes |

**Motivation:** FK Crvena Zvezda motivation: 14/100. OFK Beograd motivation: 100/100.
Motivation gap is significant (86 points).

**Trap Analysis:** High trap signal (100/100). Market odds may not reflect recent form.

**Recommended Action:** Avoid

> ⚠️ Risk flag active: TRAP+APATHY: trapScore=100 with favoriteMotivation=14.

---
*This is football match-risk analysis, not a betting recommendation. No outcome is guaranteed.*
```

---

## HTML Example

```html
<article class="mbr-match-card">
  <h2>FK Crvena Zvezda vs OFK Beograd</h2>
  <p class="mbr-meta">Serbia SuperLiga &bull; 2025-04-19T19:30:00Z</p>
  <table class="mbr-scores">
    <tr><th>Home Motivation</th><td>14/100</td></tr>
    <tr><th>Away Motivation</th><td>100/100</td></tr>
    <tr><th>Trap Score</th><td>100/100</td></tr>
    <tr><th>Risk Flag</th><td><span class="mbr-flag-active">⚠️</span></td></tr>
  </table>
  <p class="mbr-motivation">FK Crvena Zvezda motivation: 14/100. OFK Beograd motivation: 100/100.</p>
  <p class="mbr-trap">High trap signal (100/100). Market odds may not reflect recent form.</p>
  <p class="mbr-action"><strong>Avoid</strong></p>
  <p class="mbr-disclaimer">This is football match-risk analysis, not a betting recommendation. No outcome is guaranteed.</p>
</article>
```

---

## CSS class reference

| Class | Purpose |
|-------|---------|
| `.mbr-match-card` | Wrapper article |
| `.mbr-meta` | League and kickoff line |
| `.mbr-scores` | Score table |
| `.mbr-motivation` | Motivation summary paragraph |
| `.mbr-trap` | Trap analysis paragraph |
| `.mbr-action` | Recommended action |
| `.mbr-flag-active` | Active risk flag indicator |
| `.mbr-disclaimer` | Compliance text |
