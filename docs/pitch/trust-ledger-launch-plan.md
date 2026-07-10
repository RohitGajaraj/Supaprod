# The Trust Ledger, as launch material — RPT-07 + RPT-30 findings and spec

> _Created: 2026-07-10 (Lane D, G18 sweep). Status: **both mechanisms verified live in code + DB; both need a public-facing wrapper that is genuine product code, outside Lane D's docs/GTM boundary. This file is the finding + the ready-to-execute spec, not the build.** Marked `[needs lane B/C]` on both dashboard rows per the collision protocol._

## What this verified (live code read + live DB query, 2026-07-10)

**RPT-07 (Public dogfood Trust Ledger) and RPT-30 (Launch calibration scorecard) explicitly pair** (RPT-30's own row: "Pairs with RPT-07"). Verifying both together surfaced the same shape twice: **the underlying mechanism already exists and is shipped — what's missing in both cases is a public-facing wrapper, not new infrastructure.**

### RPT-07: the share mechanism is [PROVEN], the content is not real yet

- **[PROVEN] The single-decision public share is shipped.** `src/lib/decisions-share.functions.ts` + the public `/d/$slug` route (`src/routes/d.$slug.tsx`) — an owner can mark any decision public, RLS-gated at the database wire (anon can only SELECT safe columns on `is_public` rows), security-reviewed, tested (commit `896c7b49`, "TRUST-SHARE — public provenance receipt artifact... security-reviewed, tsc+1222 tests green").
- **What's missing: real content.** Queried the live DB (2026-07-10): 14 of 72 total decisions are marked `is_public = true` — but every one of them belongs to workspace `b90da531-...` / `e375a61c-...`, both named **"Explore workspace"** — seeded demo data (fintech-flavored titles like "Ship round-up savings goals," "Kill the in-app crypto wallet parity bet," duplicate title pairs a day apart, `cited_by_count = 0` on all 14). **None of these are real "Cadence building Cadence" decisions.** Publishing this set as the Show HN centerpiece would be the exact thing the whole pitch-room doctrine forbids: a claim without a receipt behind it.
- **The honest unlock:** real dogfood content has to come from the founder actually using Cadence's own decision-recording flow on Cadence's own real build calls — the kind of thing this very campaign is full of (choosing Paddle as MoR, picking the r/ProductManagement cohort over a generic list, killing the `application-draft.md` duplicate in favor of the existing file). These are genuinely-made decisions today; recording a handful of them through the product's normal flow and marking them public is not fabrication, it's dogfooding for real. That's a founder/product-usage action, not something this session can do — I have not created or marked any decision public.

### RPT-30: the scorecard computation is [PROVEN], it just isn't public

- **[PROVEN] The calibration/hit-rate computation already exists, admin-gated.** `src/lib/proof-surface.functions.ts`'s `getProofSurfaceExtras` computes `PredictionHitRate` (`{ rate, hits, total, tableReady }`) plus `SupersessionsCaught` and `BabysittingTax`, composed at the `/admin/proof` route (`src/routes/_authenticated.admin.proof.tsx`) alongside `getMoatMetrics` (`src/lib/observability.functions.ts`: decision velocity, supersession rate, **agent cost**). Every number is already built to be honest when sparse ("not enough data yet, never an invented figure" — the file's own header comment).
- **What's missing: a public, redacted wrapper.** The admin route is auth + role-gated and mixes in genuinely private data (`agentCost` is real operational spend — must never go public). RPT-30 wants exactly the `PredictionHitRate` slice (`hits`/`total`/`rate` — "Cadence called N of the last M, including the misses") as a standalone public artifact, Warp-style. That's a narrow, safe subset of an existing, tested computation — not a new metrics engine.

## The build spec (ready for Lane B/C — this is the whole remaining scope)

1. **A new public server function** (same pattern as `getPublicDecision` in `decisions-share.functions.ts`): expose ONLY `PredictionHitRate` (`rate`, `hits`, `total`) and `SupersessionsCaught.total` from the existing admin computation — no `agentCost`, no `babysittingTax`, no per-decision internal detail. Aggregate counts only; the RLS/anon-safe-column pattern from TRUST-SHARE is the template to follow, not a new security model to invent.
2. **A new public route** — a static-feeling page (`/proof` or similar public slug, following the `p.$slug.tsx` convention) that renders: the calibration line ("Cadence called N of the last M — including the misses"), a short list of real public `/d/$slug` decision receipts (once real ones exist per the content gap above), and nothing else. This IS the "Trust Ledger" the Show HN post and PH listing (`launch-assets.md`) already point to as `[DEMO-LINK]`-adjacent proof.
3. **Accept:** the page renders honestly with `tableReady: false` / zero real public decisions today (matching the codebase's own sparse-data discipline) and upgrades automatically the moment real content exists — no separate "go live" flag needed if built this way.

## What this session did NOT do (by design)

- Did not create a new route or server function — that's Lane B/C's territory per the collision law (Lane D stays in docs/GTM; a new public route + server function is product code).
- Did not mark any decision `is_public` — that would be publishing real internal content, an explicit-permission action, and there is no real content to publish yet regardless.
- Did not touch `agentCost`/spend data in any public-facing draft — the redaction boundary above is binding for whoever builds this.

## Acceptance tracking

- **RPT-07:** mechanism verified [PROVEN] and shipped; content gap is real and honestly flagged, not worked around; public exposure spec is ready. Remaining: founder records real dogfood decisions through the product + `[needs lane B/C]` for the public wrapper route.
- **RPT-30:** computation verified [PROVEN] and shipped, admin-gated; public-redaction spec is ready and scoped to the safe subset only. Remaining: `[needs lane B/C]` for the public route + redacted server function.
