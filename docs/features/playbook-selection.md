# RF-05 — Playbook selection by win rate

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Shipped 2026-07-03 · Route(s) none (engine-only, rides `mission.plan`) · Owner: Orchestrator (`src/lib/ai/tools/orchestrator.server.ts`)

## What it does

At mission-plan time, every step whose station has a bound PM method (Sense → discovery, Decide
→ prioritization, Define → prd) is automatically bound to that station's win-rate leader from
`rankPlaybooksByOutcome` (PLAYBOOK-REGISTRY, live since v11). When the step later reaches a
terminal state (done or failed), a `playbook_runs` row is recorded automatically — no manual
`recordPlaybookRun` call needed for mission-driven work.

## Why it exists

`rankPlaybooksByOutcome` has been live and verified since v11 (`registry.test.ts`) but nothing
ever consumed it — the ranking sat unused. This closes PLAYBOOK-REGISTRY's loop and makes
"institutional judgment as software" literally true: the method that keeps validating in a
workspace rises to the top and gets picked automatically next time. See
[`strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §3.2 (RF-05).

## Where to find it

No UI surface (Size S, engine-only). Verify via a mission's step `rationale`/trace, or by reading
`playbook_runs` rows for a workspace (`getPlaybooks()` in `playbooks.functions.ts`, or the
existing playbook-registry UI if one is wired to it).

## Demo script

1. Run a mission whose plan includes a Sense, Decide, or Define station step (e.g. a discovery or
   prioritization goal).
2. Inspect the returned `mission.plan` tool result — Sense/Decide/Define steps carry a
   `playbook_id` (e.g. `discovery-interview`, `rice`, `prd-spine`); Build/Ship/Learn steps carry
   `null` (no PM method to pick between).
3. Let the step run to completion (or force a failure). A `playbook_runs` row appears for that
   workspace + playbook automatically — no manual recording.
4. Run the same mission again after a few decisive `learnings`/verdicts accrue on that station's
   methods: the picked `playbook_id` shifts to whichever method now has the higher win rate.

## How it works

- **The mapping** — `AGENT_TO_PLAYBOOK_STATION` (`src/lib/playbooks/registry.ts`) maps the
  six-phase `AgentStation` mission spine to the five-station `PlaybookStation` PM-method
  taxonomy. Only `sense→discovery`, `decide→prioritization`, `define→prd` are mapped; `build`/
  `ship` are execution/delivery phases with no PM method to choose, and `learn` is outcome
  recording (RF-01/RF-04's territory), not a pre-work method choice. `positioning`/`validation`
  playbooks stay reachable via direct `getPlaybooks()`/`recordPlaybookRun()` even though no
  mission station auto-selects them.
- **Selection** — `pickPlaybookForAgentStation` (pure, unit-tested) returns the top-ranked
  playbook for a station's mapped `PlaybookStation`, or `null` if unmapped or the station's
  registry has no methods. `mission.plan` (`orchestrator.server.ts`) fetches the workspace's
  `playbook_runs` once, calls this per resolved step, and stores the result on a new
  `mission_steps.playbook_id` column (migration `20260703001000_rf05_playbook_selection.sql`,
  additive). The insert is pre-migration tolerant: a missing-column error retries once without
  `playbook_id` so a planning mission never hard-fails on a lagging migration deploy.
- **Auto-recording** — `recordPlaybookRunInternal` (`playbooks.functions.ts`, server-internal,
  not a `createServerFn`) is called from `reflectStepStatusFromRuns` and `failOrRequeueStep`
  (`mission-advance.server.ts`) the moment a step with a `playbook_id` reaches a genuine terminal
  state (`done` or a final `failed`, not a retry-in-progress). Best-effort: never throws, so a
  playbook-recording failure can never break the deterministic mission-advance loop.

## Governance & guardrails

- No new write surface a human approves — this only records that a station ran with a given
  method, mirroring existing `mission_steps` observability. No verdict is stamped by this ticket
  (see Known limits).
- `recordPlaybookRunInternal` never throws; a DB error here degrades to "no run recorded," never
  a broken mission.

## Verification checklist

- [ ] `pickPlaybookForAgentStation("sense", [])` returns the first Discovery-station playbook by
      registry order when a workspace has no track record yet.
- [ ] Once a station has decisive `playbook_runs`, the win-rate leader is picked over an untried
      or lower-win-rate method.
- [ ] `build`/`ship`/`learn` steps always plan with `playbook_id: null`.
- [ ] A step reaching `done` or a final `failed` writes exactly one `playbook_runs` row.
- [ ] `mission.plan` still succeeds (steps unbound) if `mission_steps.playbook_id` is not yet
      live in the DB.

## Known limits / out of scope

- **No verdict stamping.** `playbook_runs.verdict` stays `null` for mission-recorded rows — this
  ticket records that a station RAN, not whether its output was later validated. There is
  currently no wired path from a `mission_steps`/`agent_runs` row to a `decisions` row to a
  `learnings.verdict` (a gap the original research for this ticket flagged explicitly). Wiring
  `decision_id`/verdict stamping through the mission chain is future work, likely alongside RF-01.
- **Only 3 of 6 stations are mapped.** `positioning` and `validation` playbooks are never
  auto-selected by a mission step; they remain manually applicable.

## Related

- [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (2026-07-03 entry)
- [`strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §3.2
- Sibling: PLAYBOOK-REGISTRY (v11 #17), `src/lib/playbooks/registry.ts` / `.test.ts`
