# Parallel build — Lane 3 report

> Lane 3 (`parallel/lane-3`, worktree `cadence-lane-3`). Preferred: Governance, then Cockpit; roams the whole board. Driver: continuous `/loop` in this terminal. Full rules: `docs/operations/autonomous-build-loop.md` §15-16.

## 2026-06-25 — SANDBOX #23: ExecProvider seam made load-bearing (founder-directed pick)

Founder directed: "start with #23 - SANDBOX." The seam (`src/lib/exec/provider.ts`, shipped ◐ 2026-06-21) was scaffolded but **parallel** to the real merge gate — both it and the chokepoint-pinned `registry.server.ts` read `studio-ci.ts` directly, so it was in no decision path. The natural wiring target (`studio.pr.merge` at `registry.server.ts:1702`) is chokepoint-pinned to the core lane, so I took the spec's sanctioned alternative ("or a preview surface") through the **un-pinned** server data path.

**What shipped:**
- `src/lib/exec/provider.ts` — added `label` to `ExecProvider` (human name; engine-room "name the place, not the mechanism"), the `ExecGate` type, and a pure `execGateFromChecks(checks, preferred?)` helper.
- `src/lib/studio.functions.ts` — `StudioCi` gains a `gate` field derived through the seam in `getStudioSession` (`overallFromChecks(checks)` equals the stored snapshot `overall`, so it cannot drift from the verdict chip).
- `src/components/studio/CiPanel.tsx` — surfaces the plain-language merge readiness (`gate.reason`, coral only on real failure) + `ran on · {providerLabel}` provenance at the point of merge decision (v11 CORE-UX-TRUST). Guarded on `checks > 0`.
- `src/lib/exec/provider.test.ts` — +6 tests (label + `execGateFromChecks`).

**Gates:** tsc 0 · bun test 1547 (`provider.test.ts` 15) · build red only at the known pre-existing lovable-tagger ESM config-load baseline (unrelated). Touches ZERO chokepoint-pinned + ZERO founder-only surfaces (no spend, no secret, no `registry.server.ts`, no new dep).

**4-lens adversarial Workflow review (drift · type-breakage · doctrine-UX · security): 3 ship + 1 blocker FOUND & FIXED.** The doctrine lens caught that the neutral/empty-checks `gate.reason` ("No CI is configured…") rendered above, and contradicted, the existing "No checks reported yet" line — and was factually wrong on a fresh PR during the open→CI-start window. Fixed by guarding the whole gate block on `ci.checks.length > 0`, so the misleading neutral verdict can never render.

**Status: SANDBOX → ◐ (~70%).** Remaining (gated, NOT autonomous from this lane): the Cloudflare Sandbox SDK adapter (founder compute-spend, sourcing-map call #4) + routing the `studio.pr.merge` gate itself through the seam (`registry.server.ts` chokepoint, behaviour-identical today). Commit `7bb9947a90` (rebased + pushed to main).

**Then: board dry.** `bash scripts/lane.sh next` reports no eligible Tier-1/Tier-3 ⬜/◐ item unclaimed + not done. The only non-Gated open row is DEF-04 (◐), whose autonomous slice is ledger-done and whose remainder is chokepoint-pinned + founder-spend-gated (the same gates). Lanes 1 & 2 are actively building (EMBED-CHOKEPOINT, CONN-STATUS-UX). Long-polling per protocol; recheck ~25 min.

## 2026-07-02 15:42 — Board dry (dependency-blocked): OBS foundation in flight

Cycle: `git fetch` + rebase (22 commits behind → caught up) → `lane.sh reap` → `lane.sh next`.

`bash scripts/lane.sh next` returned 8 ids: `OBS-PORT, OBS-04, OBS-05, OBS-06, OBS-07, OBS-08, OBS-09, OBS-10` — the entire remaining Tier-1/Tier-3 open pool (Tier 2 OBS-11..15 and the 4 Gated rows are correctly excluded). None are actually buildable this cycle:

- `OBS-PORT` is the initiative-tracking row only ("no feature work rides along ... this row tracks the initiative") — no distinct buildable slice.
- `OBS-04` through `OBS-09` each state **"Needs OBS-03"** in the row text (core primitives: Button/StatusDot/VerdictChip/CallCard/MissionRow/etc.) — hard sequential dependency, not yet built.
- `OBS-10` (IA consolidation) states **"After 04..09"** — depends transitively on the same block.

Live ledger (`lane.sh board`): lane1 holds `OBS-02` (shell, 10m in), lane2 holds `OBS-03` (primitives, 6m in) — both actively building the exact foundation that unblocks 04-10. Lanes 0 and 4 are also idle for the same reason. Building any of 04-10 now would mean coding against primitives that don't exist yet (rework risk, contradicts "surgical changes only").

**Not forcing premature work. Long-polling per protocol** (`docs/operations/autonomous-build-loop.md` §15.6 — a hard dependency stated in the row text is the documented "another lane's area" skip case, not a lazy "looks dry" judgment). Recheck in ~25 min: once `OBS-03` lands, `OBS-04` through `OBS-09` become genuinely parallelizable across lanes 0/3/4.
