# TODAY — The daily ritual (app home)

> _Created: 2026-07-07 · Last updated: 2026-07-07_

> Status · ◐ Live, deepened to consumer/enterprise grade 2026-07-07 (dim 17 pass, Kiro) · Route `/today` · Owner agent(s): Chief of Staff (orchestrator), Critic, the loop

## What it does

Today is the landing surface: the operator's daily ritual of "what needs my judgment, and what did the loop do while I was away." It never overwhelms (triage, not a wall). Top to bottom it is: a greeting hero that counts the calls needing you; a **brief spotlight** (the one call that matters, what proved out, and the full written brief one disclosure deeper); a **My day** strip (today's meetings, tasks due, the one Focus-next suggestion, a focus timer); a one-line **quick capture** that lands a passing thought as a real Discover signal; the **loop strip** (SENSE to LEARN, each a jump); the **triage Calls queue** grouped by the kind of judgment owed (Ship it? / Worth building? / Worth re-examining?), each family showing its top call in full with the rest folded behind "N more"; a **what-changed-overnight** feed of outcome-driven re-scores; and a right rail with **loop health**, **the machine right now** (live agent runs), and the **strategic brief** editor.

Every Call and every learning is now a first-class, auditable object (dim 17): a single click opens its own detail (assembled from the shared DetailKit), and each carries its registered trace ref, its timestamps, a status pill, provenance that links back up the loop, and the same decide-in-place actions.

## SW-5: the four-lane content model (mission 3.11, 2026-07-07)

The founder's verdict on the old surface was "a data dump ... not properly segregated." SW-5 re-cuts Today's content into **exactly four segregated lanes**, each computed and grouped from real rows — an information-architecture change, not a restyle. Per the Obsidian contract, **Lane 1 is the only ember lane**; lanes 2-4 speak the calm glacier machine voice.

1. **Needs your judgment** (the only ember lane) — the approval/spec/opportunity/assumption gates (the proven `getNeedsYou` triage, unchanged) **plus pushed Brain insights** (`insights` rows of kind `next_best_action`/`hidden_connection`, status `open`, top-scored). One-click actions on the gates; a pushed insight opens in Brain.
2. **What the swarm did** — recent `stage_events` (last 24h) **grouped by the mission that moved** (goal + title), each group carrying its real spend (`agent_runs.spend_used_usd` summed by `mission_id`). Non-mission transitions fold under one "Other activity" group. Clicking a mission group opens it in Build.
3. **At risk / watch** — open foresight (`insights` kind `prediction`/`risk`/`cost_of_inaction`, no resolution), calibration misses (`insights.resolution = 'miss'`), and live assumption challenges (`assumption_challenges` status `open`).
4. **Shipped and what it cost** — closed outcomes (`learnings` with a verdict), verdict mapped from the real enum (`validated`→achieved, `missed`→missed, `mixed`→partial), each with its per-mission spend and an average cost-per-outcome (reconciled to the workspace week spend, never fabricated).

Data layer: `src/lib/today-lanes.functions.ts` (`getTodayLanes`, workspace-scoped via the `current_user_default_workspace` RPC, degrades to empty lanes rather than throwing). Render: `src/components/today/TodayLanes.tsx` + the four lane sections in `src/routes/_authenticated.today.tsx`. Pure mappers (verdict, insight→watch, mission grouping, Lane-4 assembly) are unit-tested in `today-lanes.test.ts`. The old free-standing `WhatChanged` and `MachineNow` surfaces are folded into lanes 4 and 2 respectively so Today shows one four-lane model, not the old surfaces plus lanes.

## Why it exists

Today is the felt product for the senior PM: it collapses "15 tools, human as glue" into one place where the loop brings you only the few calls that genuinely need you and shows its own work. It is the second half of the Today mandate (what needs me + what the loop did while I was away). Build log: [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (OBS-04 ritual; Loom W2-TODAY triage; the 2026-07-07 dim 17 pass).

## Where to find it

Nav: the first destination, `/today` (route `src/routes/_authenticated.today.tsx`). It is the post-login home.

## Demo script (≤ 90s)

1. Sign in as `demo@redcadence.app`; you land on Today with the hero counting the calls that need you.
2. Read the spotlight: "The call that matters" names the top Call; click it. Its detail slides in from the shared DetailKit: the recommendation band, the stat strip (blast radius, reversibility, spend), what happens if you approve, why the agent asked, where it came from, and the trace ref (top-right, copyable).
3. Close it; in the triage queue click any Call card body (not the buttons) to open the same detail; hit Approve or Send back from the footer and watch the queue advance with no reload.
4. Under "What changed overnight", click a re-score line: it opens that learning in Brain (its home).
5. In the right rail, "The machine right now" lists live agent runs, each with its MIS trace ref and start time; click one to open it in Build.

## How it works

- **Read fns** (`src/lib/today.functions.ts` + siblings): `getNeedsYou` (the one truth for the calls queue + server-side counts, live vs expired gates, per-gate model/spend), `getDashboard` (the written brief), `listLearnings` + `rescoresOf` (the what-changed feed), `listAgentRuns` (the machine-now rail), `getAcceptanceRate` / `getAutonomyRatio` (loop health).
- **Decide mutations**: `resolveApproval` (Ship it? tool gates; approving also executes the tool), `savePrd` (Worth building? specs; approve logs the decision, send-back returns to draft), `updateOpportunity` (Worth building? opportunities; keep to Now, drop to dropped), `resolveAssumptionChallenge` (Worth re-examining? confirm/dismiss). Answering invalidates the queue so the next call advances.
- **Click-to-open detail** (`src/components/today/CallDetailSheet.tsx`): a discriminated union over the four families (ship / spec / opportunity / assumption), assembled from the shared `DetailKit` (DetailHeader → glacier recommendation band → StatStrip → DetailSections → actions footer) exactly like the Decide opportunity sheet. Reads only real `getNeedsYou` columns; an absent field renders nothing. The card body is the click target (`CallCard.onOpen`), and its Approve/Send-back buttons stop propagation.
- **Trace-ref registry** (dim 17): calls carry `MIS` (agent tool gates), `PRD` (specs), `OPP` (opportunities), `ASM` (assumption challenges, newly registered); the what-changed feed carries `LRN` (learnings); the machine rail carries `MIS`. All via the shared `traceRef()` helper; the full id is copyable in the detail.
- **Consequence + blast radius** come from the static `tool-consequences` catalogue (never the model), so the claim never outruns the wiring.

## Governance & guardrails

- RLS-scoped: every read/write is scoped to the caller (`user_id` + workspace). `getNeedsYou` counts are derived server-side, never from array lengths.
- Approval gates are human-in-the-loop: nothing an agent proposes runs without your call; expired gates leave the live queue into a quiet Expired group (still actionable, honestly labelled). Reversibility + blast radius are shown before you approve.
- Optimistic only where reversible (task toggle); a failed write rolls back and says so.

## Verification checklist

- `/today` loads with the hero, spotlight, My day, loop strip, and triage queue; no dead tiles.
- Clicking a Call card body opens the `CallDetailSheet`; the trace ref (MIS/PRD/OPP/ASM) is top-right and copies the full id; the recommendation band is glacier (not amber); the footer Approve/Send-back run the same mutation and close the sheet.
- Clicking a Call's inline Approve/Send-back acts WITHOUT opening the detail (propagation stopped).
- "What changed overnight" lines show `LRN·XXXXXX` + a relative time and open the learning in Brain.
- "The machine right now" rows show `MIS·XXXXXX` + start time and open Build.
- Empty (all clear), loading (skeleton, no false all-clear), and error (cause + retry) states all render; no spinner for primary content.
- `npx tsc --noEmit` = 0; `bun run build` succeeds; `bun test` shows only the 3 known `resolveEmbedRoute` fails.

## Known limits / out of scope

- **No snooze/defer verb**: `agent_approvals` has no snooze/defer column, so a "Later" action is not offered (documented for a follow-up migration).
- **Ship-it provenance links to `/build`**, not to a specific mission trace: approvals carry a `trace_id` but no `mission_id` in the queue read, so the click-back opens Build generally rather than the exact run. A per-approval mission join would sharpen this.
- **Per-transition stage history** is not tracked; the detail's activity section shows created/updated only (the dim 17 honest floor; a stage-events table is the deeper follow-up).

## Related

- [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4, the dated build log (OBS-04, Loom W2-TODAY, the 2026-07-07 dim 17 pass)
- [`../conventions/design-anatomy.md`](../conventions/design-anatomy.md), the binding card + detail anatomy, trace-ref registry (incl. the new `ASM` prefix), color/token palette
- [`design/archive/loom-v4.md`](../design/archive/loom-v4.md) §0.1 dim 17 (the contract) + §8b (Today ritual)
- [`opportunity-ranking.md`](./opportunity-ranking.md), the Decide detail-sheet exemplar this surface aligns to
- [`signal-fabric.md`](./signal-fabric.md) · [`foresight-generators.md`](./foresight-generators.md) · [`plg-memory-retention-nudge.md`](./plg-memory-retention-nudge.md), sibling capabilities that also render on Today
