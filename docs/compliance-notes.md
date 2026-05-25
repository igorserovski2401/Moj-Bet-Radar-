# Compliance Notes

This document records the compliance constraints built into Moj Bet Radar's product design. It must be reviewed by a qualified legal professional before any commercial launch.

---

## What this product does and does not do

**Does:**
- Generate match-risk intelligence from enriched football data
- Assign numerical scores (Motivation, Trap) and a binary risk flag (No-Bet)
- Produce ready-to-publish content blocks and widget payloads
- Expose structured JSON outputs via a local API contract

**Does not:**
- Place bets or interact with any betting system
- Execute financial transactions
- Guarantee any outcome
- Claim insider knowledge
- Resell raw Sportmonks API payloads

---

## Prohibited language

The following language must never appear in any output, API response, documentation, or marketing material:

- "guaranteed"
- "safe bet"
- "sure win"
- "100%"
- "fixed match"
- "insider tip"
- "certain result"
- Any phrasing that implies a known outcome

This is enforced in product design: the No-Bet Flag is named explicitly as a risk signal, not a recommendation. All compliance text is stored in `src/product/complianceText.ts` and included in every publisher feed item.

---

## Raw provider data policy

Sportmonks API 3.0 data is licensed per use case. Moj Bet Radar:

1. Does not expose raw Sportmonks payloads in any B2B output
2. Does not include Sportmonks fixture or team IDs in public responses
3. Stores raw payloads internally only (in `match_feature_snapshots` table) for audit and re-scoring purposes
4. Only exposes our own enriched/proprietary outputs

---

## Customer responsibilities

Customers who purchase access to Moj Bet Radar outputs are responsible for:

1. Compliance with local gambling advertising regulations in their jurisdiction
2. Ensuring their platform holds any required gambling or affiliate licenses
3. Adding any jurisdiction-specific disclaimers required by local law
4. Not presenting Moj Bet Radar content as guaranteed predictions

Moj Bet Radar provides the data. The customer controls the publishing context.

---

## Required actions before commercial launch

1. **Legal review**: a qualified legal professional must review this product against applicable regulations in each target market (RS, HR, BA, DE, and others)
2. **License check**: confirm Sportmonks API license permits use in commercial B2B data products
3. **Jurisdiction mapping**: define which countries the product can be sold in, with what disclaimers
4. **Terms of service**: draft customer terms that clearly state intended use and prohibitions
5. **Data retention policy**: define how long raw payloads in `match_feature_snapshots` are retained

---

## Compliance text

Reusable compliance text for all output formats is maintained in `src/product/complianceText.ts`. Available in: English, Serbian, Croatian, Bosnian, German.

The short form reads (English): *"This is football match-risk analysis, not a betting recommendation. No outcome is guaranteed."*

This text must appear in every publisher feed item and every widget payload.
