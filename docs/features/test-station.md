# JNY-03 — The test station

> Status · Shipped 2026-07-03 · Build mission slide-over (`/build/$missionId`, the `?mission=` slide-over) · No new agent

## What it does

Inside a mission's slide-over, once its PRD has a compiled Outcome Contract (CNV-02), a "Test station" panel shows the mission's real acceptance test plan: which eval cases passed or failed, whether the mission's own build gate is green, and a UAT checklist the operator ticks off. Once everything checks out, one action records the verdict onto the PRD's linked decision, which surfaces on the Trust Ledger for free.

## Why it exists

Per [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8 (the founder's "what testing needs to be done"): CI and evals already exist in Cadence but sit disconnected from a spec's stated acceptance criteria. CNV-02 compiles those criteria into real oracles (eval cases, a CI label, a UAT checklist); this closes the loop by giving them one place to live, per mission, with a real pass/fail verdict that lands on the decision record. Board entry: `docs/planning/feature-dashboard.md` row `JNY-03`.

## Where to find it

Open any Build mission's slide-over. The panel renders only when the mission's PRD has at least one compiled acceptance clause (eval, ci, or uat); otherwise nothing shows, per the calm-front doctrine.

## Demo script

1. On a PRD with a compiled Outcome Contract, start (or open) a mission built from it.
2. Open the mission's slide-over. Below the pending-approval card (if any), the Test station panel lists eval cases, CI expectations, and a UAT checklist, each with a status dot.
3. Tick a UAT item to check it off live.
4. Once every eval case passed, the mission's own gate is green, and every UAT item is checked, the header flips to PASSING and a "Record verdict" action appears.
5. Click it. The verdict lands as an `artifact_lineage` edge on the PRD's decision; open `/trust-ledger` and the mission now shows as new evidence on that decision's receipt.

## How it works

- `src/lib/test-station.functions.ts`: `getMissionTestPlan(missionId)` resolves the mission's PRD (missions carries no `prd_id` column; the real link is `studio_changesets.mission_id -> studio_changesets.prd_id`, the same join BYO-P3's `outcome.functions.ts` already relies on), reads the PRD's CNV-02-compiled `contract.success_metrics`, groups the compiled clauses by `oracle_kind`, and computes a pure verdict (`computeVerdict`, unit tested) from the latest `eval_case_results` per case, the mission's own run status (`ciGateStatus`, also pure and tested), and the UAT checklist's checked state.
- `recordTestStationVerdict(missionId)` recomputes the plan server side (never trusts a client-sent verdict), and when it is genuinely passing, finds the `decisions` row F-DECISIONS-CAPTURE already created for that PRD and inserts one `artifact_lineage` edge (`parent: mission`, `child: decision`, `relation: "test_verdict"`, a plain-language `rationale`). No migration: `artifact_lineage.relation` already accepts arbitrary values (`supersedes`, `contradicts`, `promoted`, ...), so a new relation kind needs no schema change, and the Trust Ledger is a derived read over `decisions`/`agent_approvals`/`artifact_lineage`, so the new edge shows up there automatically as fresh evidence.
- UAT checking reuses the existing `toggleUatChecklistItem` (CNV-02, `discovery.functions.ts`) rather than a second copy of the same logic.
- `src/components/obsidian/TestStationPanel.tsx` wired into `src/components/obsidian/MissionSlideOver.tsx`, below the pending-approval `CallCard`. Renders nothing when the mission has no linked PRD or the PRD's contract has not been compiled yet.

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

- `docs/planning/feature-dashboard.md` row `JNY-03`.
- [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8.
- [`outcome-contract.md`](./outcome-contract.md) (CNV-01/CNV-02, the contract and its compiled oracles this reads).
- `docs/features/README.md` index.
