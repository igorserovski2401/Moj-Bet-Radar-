# Sales Demo Script

## 60-second pitch

"You're publishing match previews that look like every other site's match previews. Our readers can tell. Moj Bet Radar gives you a data layer that no one else in the Balkan and Southeast European market has: motivation scoring, trap detection, and a risk flag — all calculated per match, updated automatically, delivered as ready-to-publish content blocks or embeddable widgets. You don't need a data team. You plug in the feed."

---

## Problem statement

Affiliate and sports content sites face three problems:

1. **Commodity content** — everyone has the same team news, form table, and H2H stats
2. **No risk context** — readers see "Partizan to win" but not "Partizan hasn't scored in 4 games and has nothing left to play for"
3. **No scalability** — manual match previews don't scale to cover 50+ fixtures per week

Moj Bet Radar solves all three.

---

## Match walkthrough example

**Fixture:** FK Crvena Zvezda vs OFK Beograd — Serbia SuperLiga, Round 27

**What a standard preview says:** "Crvena Zvezda are heavy favorites at 1.35 at home."

**What Moj Bet Radar shows:**

| Signal | Value |
|--------|-------|
| Zvezda motivation | 14/100 — safe mid-table, nothing to play for |
| OFK motivation | 100/100 — 4 points above relegation, fighting for survival |
| Trap Score | 100/100 — odds heavily overrate the home favorite |
| No-Bet Flag | ⚠️ ACTIVE — TRAP+APATHY + EXTREME_APATHY |
| Recommended Action | **Avoid** |

The 1.35 odds imply a 69% win probability for Zvezda. Their recent form implies a 27% probability based on last 5 games. Their motivation score is 14/100. OFK is fully motivated and in better form. This is a textbook value trap.

That analysis is produced automatically, in seconds, for every fixture in the feed.

---

## Delivery formats

1. **Publisher Feed** — Markdown/HTML/JSON blocks, publish directly to your CMS
2. **Widget** — embed a risk card on any match preview page
3. **JSON API** — connect your own frontend to our enrichment engine
4. **Dashboard** — internal monitoring (planned Q3)

---

## Pricing (indicative — subject to legal and commercial review)

| Tier | Description | Price |
|------|-------------|-------|
| Starter Publisher Feed | JSON/Markdown feed, 1 league, weekly delivery | €199/month |
| Pro Data Feed | JSON feed, up to 5 leagues, daily refresh | €499/month |
| White Label Widget | Embeddable widget, custom CSS, 1 domain | €999/month + setup |
| API Access | REST API, up to 10 leagues, SLA included | from €799/month / custom |

Enterprise pricing and white-label licensing available on request.

---

## Outreach message template

**For betting affiliate sites:**

> Subject: Match risk intelligence feed for [site name]
>
> Hi [name],
>
> I run Moj Bet Radar — a football risk intelligence product built for Balkan and SE European leagues.
>
> Rather than standard form tables and head-to-head stats, we produce:
> - Motivation scores per team (how much does each side need points?)
> - Trap detection (is the market overrating the favorite?)
> - A risk flag when multiple signals align
>
> All delivered as ready-to-publish content blocks or embeddable widgets.
>
> Would a 15-minute demo be worth your time?
>
> [signature]

**For sports publishers and iGaming agencies:**

> Subject: Structured pre-match intelligence for your editorial team
>
> Hi [name],
>
> Most match preview content looks the same. Moj Bet Radar gives your editorial team a quantified risk layer — motivation scores, trap signals, and risk flags — that can be embedded directly into your workflow.
>
> We cover Serbia SuperLiga, Croatian Prva HNL, and expanding into further Balkan leagues.
>
> Happy to send a sample feed for your next fixture week.
>
> [signature]
