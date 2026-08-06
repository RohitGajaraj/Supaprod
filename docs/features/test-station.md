# JNY-03 — The test station

> _Created: 2026-07-03 · Last updated: 2026-08-06_

> Status · Shipped 2026-07-03, re-homed onto the run surface after the runs-board rewrite · Run detail (`/runs/$missionId`) · No new agent

## What it does

On a run's own surface, once its PRD has a compiled Outcome Contract (CNV-02), a "Whether it meets the spec" panel shows the run's real acceptance test plan: which eval cases passed or failed, whether the run's own build gate is green, and a UAT checklist the operator ticks off. Once everything checks out, one action records the verdict onto the PRD's linked decision, which surfaces on the Trust Ledger for free.

## Why it exists

Per [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8 (the founder's "what testing needs to be done"): CI and evals already exist in Supaprod but sit disconnected from a spec's stated acceptance criteria. CNV-02 compiles those criteria into real oracles (eval cases, a CI label, a UAT checklist); this closes the loop by giving them one place to live, per mission, with a real pass/fail verdict that lands on the decision record. Board entry: `docs/planning/SOURCE-OF-TRUTH.md` row `JNY-03`.

## Where to find it

Open any run from the Runs board (`/runs`); the row lands on that run's own surface, `/runs/$missionId`. The older doors still work and redirect there permanently: `/build/$missionId`, `/missions/$missionId`, and `/runs?mission=<id>`. The panel renders only when the run's PRD has at least one compiled acceptance clause (eval, ci, or uat); otherwise nothing shows — not even the section heading — per the calm-front doctrine.

## Demo script

1. On a PRD with a compiled Outcome Contract, start (or open) a mission built from it.
2. Open the run at `/runs/$missionId`. Below the Gate (and the stage panel, when a stage other than Build is selected) and above "What happened, in order", the "Whether it meets the spec" panel lists eval cases, CI expectations, and a UAT checklist, each with a status dot.
3. Tick a UAT item to check it off live.
4. Once every eval case passed, the mission's own gate is green, and every UAT item is checked, the header flips to PASSING and a "Record verdict" action appears.
5. Click it. The verdict lands as an `artifact_lineage` edge on the PRD's decision; open `/trust-ledger` and the mission now shows as new evidence on that decision's receipt.

## How it works

- `src/lib/test-station.functions.ts`: `getMissionTestPlan(missionId)` resolves the mission's PRD (missions carries no `prd_id` column; the real link is `studio_changesets.mission_id -> studio_changesets.prd_id`, the same join BYO-P3's `outcome.functions.ts` already relies on), reads the PRD's CNV-02-compiled `contract.success_metrics`, groups the compiled clauses by `oracle_kind`, and computes a pure verdict (`computeVerdict`, unit tested) from the latest `eval_case_results` per case, the mission's own run status (`ciGateStatus`, also pure and tested), and the UAT checklist's checked state.
- `recordTestStationVerdict(missionId)` recomputes the plan server side (never trusts a client-sent verdict), and when it is genuinely passing, finds the `decisions` row F-DECISIONS-CAPTURE already created for that PRD and inserts one `artifact_lineage` edge (`parent: mission`, `child: decision`, `relation: "test_verdict"`, a plain-language `rationale`). No migration: `artifact_lineage.relation` already accepts arbitrary values (`supersedes`, `contradicts`, `promoted`, ...), so a new relation kind needs no schema change, and the Trust Ledger is a derived read over `decisions`/`agent_approvals`/`artifact_lineage`, so the new edge shows up there automatically as fresh evidence.
- UAT checking reuses the existing `toggleUatChecklistItem` (CNV-02, `discovery.functions.ts`) rather than a second copy of the same logic.
- `src/components/obsidian/TestStationPanel.tsx` is mounted in `src/routes/_authenticated.runs.$missionId.tsx`, above the "What happened, in order" ledger and outside the orchestrator-only branch. It was originally wired into `src/components/obsidian/MissionSlideOver.tsx`; the runs-board rewrite deleted that component and nothing carried the panel across, so for the life of the new surface `TestStationPanel`, `getMissionTestPlan` and `recordTestStationVerdict` had no caller in the repo at all. It now hangs on the surface that replaced the slide-over. The panel owns its own `Block` (the route cannot open one for it — only the query knows whether this run has a test plan), so it renders nothing at all, heading included, when the run has no linked PRD or the PRD's contract has not been compiled yet.

## Governance & guardrails

- Read-only until the operator explicitly clicks "Record verdict"; the write is idempotent (checks for an existing `test_verdict` edge before inserting a second one).
- The verdict is always recomputed server side from the current data at record time, never taken from the client, so a stale or manipulated client state cannot force a false "passing" record.
- Standard RLS on `prds`/`decisions`/`artifact_lineage`/`studio_changesets`/`eval_case_results` (the caller's own workspace only), the same trust boundary every other read/write in this codebase relies on.

## Verification checklist

- [x] `bunx tsc --noEmit` clean.
- [x] `bun test` 2127 pass / 0 fail (11 new: `ciGateStatus` + `computeVerdict`, every branch of the verdict logic).
- [ ] Manual walk on the primary checkout (this worktree's `bun run dev`/`build` hits the pre-existing node20-vs-ESM `lovable-tagger` failure that every other item in this lane has also hit; `tsc` + `bun test` are the real gates here).

## Known limits / out of scope

- Only "eval"/"ci"/"uat" oracle kinds get a test-station row; "unverifiable" clauses already file as FS-02 assumptions (CNV-02's own scope) and are not duplicated here.
- If a mission's `studio_changesets` row never got a `prd_id` (a mission not built from a spec), the panel simply does not render; there is no separate "no test plan" empty state, matching the calm-front doctrine for a surface that is not always applicable.

## Related

- `docs/planning/SOURCE-OF-TRUTH.md` row `JNY-03`.
- [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8.
- [`outcome-contract.md`](./outcome-contract.md) (CNV-01/CNV-02, the contract and its compiled oracles this reads).
- `docs/features/README.md` index.
