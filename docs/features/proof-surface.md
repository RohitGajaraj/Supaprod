# PRF-01: The proof surface

> _Created: 2026-07-02_

> Status: Shipped 2026-07-02 (lane 3) · Route `/admin/proof` · Owner: the loop (no single agent)

## What it does

An admin-only tab that composes every moat-proof metric Cadence has, in one investor-safe panel: the Gauntlet (acceptance rate, autonomy ratio, ritual retention), the MOAT-METRIC pair (outcome accuracy, the memory-depth lift split, memory compounding), the AFD-12 admin materialized views (decision velocity, outcome rate by agent, cost per decision), and three pieces that did not exist anywhere before this: a babysitting-tax trend, a supersessions-caught count, and an FS-01 prediction hit-rate probe. The sentence it exists to prove: "the system gets measurably better at this workspace's decisions as its memory grows, and here is the curve." Every number reads from real tables; a sparse window says "not enough data yet" rather than inventing a figure.

## Why it exists

v12 §9 names the investor justification gap directly: the moat is real in the code but was not legible in one place for a diligence conversation. This front composes what already exists (nothing here is a new metric definition beyond the three additions) and adds the last three receipts a skeptic asks for. See [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §9 and the dashboard row PRF-01 (group G15).

## Where to find it

Admin console → **Proof** tab. Direct link: `/admin/proof`. Gated by the same `has_role(auth.uid(),'admin')` check as every other admin tab (see `_authenticated.admin.tsx`).

## How it works

- **Reused as-is, zero new code:** `<GauntletMetricsPanel />` (acceptance, autonomy, ritual retention, outcome accuracy, memory-depth lift, memory compounding) is embedded directly; see [`gauntlet-metrics.md`](./gauntlet-metrics.md) for those formulas. `getMoatMetrics` (the three AFD-12 materialized views) is called and condensed into three rollup cards with a link to the full per-week / per-agent tables at `/admin/ai-costs`.
- **New server function:** [`../../src/lib/proof-surface.functions.ts`](../../src/lib/proof-surface.functions.ts) exports `getProofSurfaceExtras`, admin-gated (mirrors `getMoatMetrics`'s `user_roles` check), reading via `supabaseAdmin` (service role, workspace-wide, the same posture as the materialized views):
  - **Babysitting-tax trend:** weekly count of `agent_approvals` rows (gated, human-decided calls) over the trailing 8 weeks. Trend compares the most recent 4-week average to the prior 4-week average; a falling count reads "improving" (fewer gated calls landing on the operator).
  - **Supersessions caught:** count of active `supersedes` / `contradicts` edges in `artifact_lineage` (the same edge definition as `isSupersessionRelation` in `trust-ledger.functions.ts`) over the last 60 days, with a last-30-days figure and a trend.
  - **Prediction hit rate (FS-01):** a tolerant probe against a `predictions` table that does not exist yet (FS-01 was mid-build on another lane when this shipped). Degrades to "not enough data yet, FS-01 prediction calibration is not live yet" on any error, not just a missing-relation code, since the table's exact shape may still change. This card starts reading real numbers once FS-01 ships, or needs a one-line column-name update if the shipped shape differs from the guess.
- UI: [`../../src/routes/_authenticated.admin.proof.tsx`](../../src/routes/_authenticated.admin.proof.tsx), styled to match `GauntletMetricsPanel` / `admin.ai-costs.tsx` (bento cards, `MonoLabel`, serif tabular headline, honest sub-lines).

## Governance & guardrails

- Admin-only (workspace-wide data via the service-role client, same posture as `getMoatMetrics`; never exposed to a non-admin route).
- No new tables, no migration: composes existing reads plus three new `supabaseAdmin` queries against existing tables (`agent_approvals`, `artifact_lineage`) and one tolerant probe against a not-yet-created table.
- Honesty rule held throughout: every new card has an explicit sparse/not-ready state, never a fabricated number.

## Known gaps / follow-ups

- The FS-01 card is a placeholder probe until FS-01 (prediction contracts and calibration) ships; update the table/column names in `computePredictionHitRate` once that lands if they differ from the guess.
- The babysitting-tax metric is a proxy (raw gated-call volume), not the specific auto-clear-rate metric named informally in v11; no dedicated `babysitting_tax` column exists anywhere in the schema, so this is the best available honest signal.
