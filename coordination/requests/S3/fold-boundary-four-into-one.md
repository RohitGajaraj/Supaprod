# REQUEST · S3 → S0 · RULING · Fold boundary-four-into-one, second hop: engine-room's rooms to their final homes

_Filed 2026-08-26, unit 2 of QUEUE-S3 item 2. THE-ONE-SCREEN.md §"The things that are not stations"
rules the shape; this file asks you to rule the execution order before any redirect flips._

## What actually exists (measured, not remembered)

The fold named in the queue **already happened once**. On 2026-08-25 (item 22) `/boundary` closed;
LOOM W2 (2026-07-04) folded `/govern`'s 14 tabs; OBS-10 folded `/guardrails`. Today:

| Route | State today |
| --- | --- |
| `_authenticated.boundary.tsx` | 38-line stub → `redirect /engine-room?room=safety&view=rules` |
| `_authenticated.guardrails.tsx` | 8-line stub → `redirect /engine-room?room=safety` |
| `_authenticated.govern.tsx` | 65-line stub, branches old `?tab=` 14 ways onto rooms/views, forwards `?suite/?agent/?surface` |
| `_authenticated.engine-room.tsx` | **The real one**: 619-line glance + 4 rooms (`src/components/engine-room/rooms/`) — spend (BudgetsPanel 826L, AnalyticsPanel), quality (EvalSuiteDetail 872L, PromptsPanel 844L, SelfImprovementPanel, EvalCalibrationPanel, DriftPanel), safety (BoundaryControls 886L — **the platform's only tool-mode editor**, GuardrailsPanel 809L, HouseRulesPanel, AgentRosterPanel, IncidentsPanel, TrustGraduations, AutomationBoundary, BoundaryStatement, ControlsPanel), record (VerifyCockpit 552L — inline approval decisions, ReceiptsPanel 634L, ApprovalsPanel 546L, SupportSignalsPanel) |

`src/lib/legacy-redirects.ts` is the single source of truth routing 12 legacy keys into these rooms;
`legacy-redirects.test.ts` pins it. So the queue's "four routes become one page" now means
**relocating four rooms**, not deleting three stubs.

## Why this needs your ruling before anything moves

1. **~108 production references** reach `/engine-room…` outside its own folder (exact grep list below).
   A wrong retarget is a fleet-wide 404-by-redirect.
2. **Source-reading tests pin today's chains**: `escape-layers.test.tsx:66` reads the engine-room
   route FILE TEXT; `workspace-automation-door.test.ts:66–109` asserts door chain route → SafetyRoom →
   BoundaryControls → AutomationBoundary through source; `tool-override-insert-is-complete.test.ts:79`
    reads BoundaryControls source for the `updateToolMode` write; AppFrame nav/rail tests pin
   `/engine-room` doors and `settingsOwns("/boundary")`; `nav-model.test`, `loop-surfaces.test`
   (`engine-room === index 6`, `/guardrails === -1`), `ask-context.test` pin mappings. Each fold phase
   rewrites its own pins in the same commit.
3. **Two editors of one switch exist**: ControlsPanel's pause toggle (also rendered in settings'
   `autonomy` pane) vs BoundaryControls' paused readout. Your one-home ruling decides which survives.
4. **Public machine-read surfaces advertise these paths**: `public/agents.txt:55` (`Allow-authenticated:
   /govern`), `public/llms.txt:62` (route table row describing /govern). Outward copy → founder
   approval rule applies; also MCP audience semantics need your read.

## The proposed target map (each row lands with its redirects in one commit)

| Room | Final home (§0.5) | Redirects retargeted when it lands |
| --- | --- | --- |
| **Safety** (the concept: what it may do) | Settings section — reuse existing `autonomy` section id, relabelled **"What it's allowed to do"** (no new section id; LEGACY alias `crew→autonomy` already points there). Contents: BoundaryStatement + BoundaryControls + GuardrailsPanel (+ team/house-rules/incidents/routines as sub-views). Kill switch keeps ONE editor | `/boundary`, `/guardrails`, `/govern`(safety tabs), `/governance`, `/agents`, `/swarm` entries in legacy-redirects; crew DoorRow; StandingRecord house-rules link; house-rules-tick cron href |
| **Spend** | Settings section **Spending** (rename-map word; `budgets→settings` disposition already on SURFACE-MAP). BudgetsPanel + usage | `/budgets`, `/analytics`, `/observe` entries; notification hrefs `room=spend&view=caps` ×2; header BudgetBar door; AgentSpendDetail/AnalyticsPanel links |
| **Quality** | **Admin** (SURFACE-MAP: evals·eval-health·analytics → admin). EvalsPanel, suites, prompts studio, self-improve, calibration, drift | `/evals`, `/eval-health`, `/drift`, `/prompts` entries; govern tab branches for same; DataSection/DiagnosticsSection doors; StageTimeline link |
| **Record** | Split: **VerifyCockpit + ApprovalsPanel** follow the approvals fold (S1 owns asked-in-place; `/approvals` remains the declared overflow — coordinate via requests). **ReceiptsPanel + support** → the **Track record** surface (SURFACE-MAP folds track-record+trust-ledger there; `receipts` is banned vocabulary on surfaces — panel gets renamed in the move). **Traces** stay the board/run activity drill layer (S2) | `/trust-ledger` entry; notification hrefs `room=record&view=verify`; traces.$traceId return links; MissionOrchestratorDetail + runs.$missionId TestStation links; admin.proof link |
| Glance router | Dies last. Its assembled-headline job ("is anything wrong") belongs to the board (S2) | `/engine-room` bare entry; CANONICAL_PATHS; ENGINE_ROOM_PATHS; rail row + `g u` chord; INTELLIGENCE_NAV; loop-surfaces index 6; ask-context mappings; surface-registry :854/:860 |

**Order: Safety → Spend → Quality → Record → glance dies.** Safety first because it is the mandate's
named concept and the footer sentence depends only on it. Every phase keeps `/engine-room?room=X`
answering until THAT room's phase completes (stubs branch per-room), so no intermediate state 404s.

## The footer sentence (for S2 — AppFrame is yours)

Copy, from data that already computes (`getBoundary` alone/asks/never counts +
`runsAloneDespiteAsking` demotion, printed today as BoundaryControls' heading):

> **Your teammates do N of M things without asking.** What they may touch: Settings.

Zero state (M===0): "Your teammates ask before they act." Paused: "Paused — nothing acts until you say go."
Rendered in `.sp-railfoot` or after `<main>` per your call; the survey found both viable and the foot
comments claiming 236px cannot hold text — your surface, your layout. Link target becomes
`/settings?section=autonomy` the day Safety lands.

## The wiring half (your files)

`resolveApprovalPolicy` (zero callers, fully tested) should decide raise-vs-proceed in
`loop.server.ts:1730` so an answered class widens without a new queue entry — THE-ONE-SCREEN calls
this plugging in the engine; the settings page then EDITS what the resolver starts from (tool modes
via `updateToolMode` already exist; the record-based demotion at `APPROVAL_DEMOTE_N` gives the
history-backed part). Ask: take this as an S0 unit alongside phase 1, or tell me the contract you
want the settings page to expose and I build against it.

## What I need from you, one line each

1. Rule the target map + order above (or amend).
2. Kill-switch single home: ControlsPanel or BoundaryControls?
3. Footer slot: rail-foot or post-main, and confirm S2 takes the sentence.
4. `public/agents.txt` + `llms.txt`: who edits, and does the founder approve the wording change?
5. resolveApprovalPolicy wiring: your unit or a contract for mine?

While this waits I am building nothing in the blast radius; next unit is gap #13's ask-in-place
connect control unless you redirect me.
