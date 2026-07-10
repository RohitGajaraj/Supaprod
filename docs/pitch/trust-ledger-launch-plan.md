# The Trust Ledger, as launch material — RPT-07 + RPT-30 findings and spec

> _Created: 2026-07-10 (Lane D, G18 sweep). Updated same day: **SHIPPED.** The public `/proof` page is live in the repo (`src/routes/proof.tsx`, `src/lib/proof-share.functions.ts`, `listPublicDecisions` in `decisions-share.functions.ts`) — tsc clean, build green, lint clean, 13 tests passing (`src/lib/proof-share.test.ts`), zero regressions on the full suite. The founder directed this to real closure rather than a handoff spec once the mechanisms were verified; no file collision existed with any other lane's active claim, so Lane D built it directly instead of waiting._

## What this verified (live code read + live DB query, 2026-07-10)

**RPT-07 (Public dogfood Trust Ledger) and RPT-30 (Launch calibration scorecard) explicitly pair** (RPT-30's own row: "Pairs with RPT-07"). Verifying both together surfaced the same shape twice: **the underlying mechanism already exists and is shipped — what's missing in both cases is a public-facing wrapper, not new infrastructure.**

### RPT-07: the share mechanism is [PROVEN], the content is not real yet

- **[PROVEN] The single-decision public share is shipped.** `src/lib/decisions-share.functions.ts` + the public `/d/$slug` route (`src/routes/d.$slug.tsx`) — an owner can mark any decision public, RLS-gated at the database wire (anon can only SELECT safe columns on `is_public` rows), security-reviewed, tested (commit `896c7b49`, "TRUST-SHARE — public provenance receipt artifact... security-reviewed, tsc+1222 tests green").
- **What's missing: real content.** Queried the live DB (2026-07-10): 14 of 72 total decisions are marked `is_public = true` — but every one of them belongs to workspace `b90da531-...` / `e375a61c-...`, both named **"Explore workspace"** — seeded demo data (fintech-flavored titles like "Ship round-up savings goals," "Kill the in-app crypto wallet parity bet," duplicate title pairs a day apart, `cited_by_count = 0` on all 14). **None of these are real "Cadence building Cadence" decisions.** Publishing this set as the Show HN centerpiece would be the exact thing the whole pitch-room doctrine forbids: a claim without a receipt behind it.
- **The honest unlock:** real dogfood content has to come from the founder actually using Cadence's own decision-recording flow on Cadence's own real build calls — the kind of thing this very campaign is full of (choosing Paddle as MoR, picking the r/ProductManagement cohort over a generic list, killing the `application-draft.md` duplicate in favor of the existing file). These are genuinely-made decisions today; recording a handful of them through the product's normal flow and marking them public is not fabrication, it's dogfooding for real. That's a founder/product-usage action, not something this session can do — I have not created or marked any decision public.

### RPT-30: the scorecard computation is [PROVEN], it just isn't public

- **[PROVEN] The calibration/hit-rate computation already exists, admin-gated.** `src/lib/proof-surface.functions.ts`'s `getProofSurfaceExtras` computes `PredictionHitRate` (`{ rate, hits, total, tableReady }`) plus `SupersessionsCaught` and `BabysittingTax`, composed at the `/admin/proof` route (`src/routes/_authenticated.admin.proof.tsx`) alongside `getMoatMetrics` (`src/lib/observability.functions.ts`: decision velocity, supersession rate, **agent cost**). Every number is already built to be honest when sparse ("not enough data yet, never an invented figure" — the file's own header comment).
- **What's missing: a public, redacted wrapper.** The admin route is auth + role-gated and mixes in genuinely private data (`agentCost` is real operational spend — must never go public). RPT-30 wants exactly the `PredictionHitRate` slice (`hits`/`total`/`rate` — "Cadence called N of the last M, including the misses") as a standalone public artifact, Warp-style. That's a narrow, safe subset of an existing, tested computation — not a new metrics engine.

## What shipped (2026-07-10, same session)

1. **`src/lib/proof-share.functions.ts`** — new file, `getPublicCalibration`, PUBLIC (no auth). Reuses the EXACT SAME computation the admin panel runs (`computePredictionHitRate` / `computeSupersessionsCaught`, now exported from `proof-surface.functions.ts` so the public number and the internal number can never drift apart) — returns only `PredictionHitRate` and `supersessionsCaughtTotal`. No `agentCost`, no `babysittingTax`, nothing operational.
2. **`listPublicDecisions`** — added to `decisions-share.functions.ts`, PUBLIC (no auth). Joins against `workspaces.is_sample` server-side via `supabaseAdmin` (anon cannot read `workspace_id` on `decisions`, so this has to happen server-side) and excludes every sample/demo workspace — the exact fix for the seeded-data problem this doc found. The filter/projection logic is a PURE exported function, `toPublicDecisionList`, with its own test file (`src/lib/proof-share.test.ts`, 6 tests: sample-workspace exclusion, non-public/no-slug exclusion, no `workspace_id` leak, limit cap, empty input, a null-vs-empty-string sentinel edge case).
3. **`src/routes/proof.tsx`** — the public `/proof` page. Same parchment shell as `/d/$slug` for visual continuity; renders the calibration line ("Cadence called N of the last M calls right") and the supersessions-caught count, with an honest zero-state when `tableReady` is false or there's no data yet ("we would rather show you an honest zero than a number that isn't real yet") — never a placeholder dressed as data. Below it, the real public-decision list (empty-state copy explains WHY it's empty: nothing seeded, nothing staged). `PreSignupCTA` gained a third `sourceType: "proof"` variant. Card hover/press states added to `.bento` (`a.bento:hover`/`:active` in `styles.css`) per the Emil Kowalski craft pass — transform-only, reduced-motion-gated, matching the site's existing `--ease-out` token.
4. **Gates:** tsc clean (0 new errors — the 5 `CalendarPanel.tsx` errors present are pre-existing, unrelated, last touched by another lane), `bun run build` green, eslint clean, 3752 tests pass / 0 new failures (the 25 pre-existing failures are unrelated env/mock issues in `autoAdjustIce`/`rollupSnapshots`/`runDriftForUser`, none in touched files).

**The one thing still genuinely not this session's to do:** RPT-07's content gap stands exactly as described above (§ "What's missing: real content") — real dogfood decisions still need to come from the founder using Cadence's own decision-recording flow. The page's honest empty state is the CORRECT behavior until then, not a placeholder waiting on a build.

## What this session did NOT do (by design, unchanged)

- Did not mark any decision `is_public` — that would be publishing real internal content, an explicit-permission action, and there is no real content to publish yet regardless.
- Did not touch `agentCost`/spend data anywhere public-facing — the redaction boundary is enforced in `proof-share.functions.ts` itself, not just documented.

## Acceptance tracking

- **RPT-07:** ✅ mechanism [PROVEN] + the public page SHIPPED and honestly empty-stated. Remaining, not a build task: founder records real dogfood decisions through the product.
- **RPT-30:** ✅ computation [PROVEN] + the public redacted scorecard SHIPPED, tested, gates green.
