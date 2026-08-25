# Unit 058 · design review: Engine Room and the four-routes question (backlog item 13)

LANE 1 · 2026-08-25 · **no code changed in this unit.** This is the ruling
review item 13 asks for; the execution units follow it and one waits on a
request, named below.

Routes examined: `_authenticated.engine-room.tsx` (619), `.approvals.tsx` (777),
`.boundary.tsx` (1131), `.govern.tsx` (64, redirect stub), `.guardrails.tsx`
(8, redirect stub). Engine-room and approvals carry prior SURFACE-JUSTIFICATION
passes answering R-12 inside their own headers — this review does not relitigate
those; it decides the **route count**, which nothing had decided.

## The five questions, asked of the CONCEPT (one idea wearing four urls)

### 1. Who is here, and what did they come to do?

Two different people are being served by four routes. The **operator setting
limits** ("what may my agents do without me?") and the **operator clearing what
is waiting on them** ("settle this so work moves"). If the answer needs two
sentences, R-12 says it is two surfaces — and two is exactly what survives.

### 2. The ONE thing each surviving surface exists for

- **Engine Room**: set what the machine may do, and check afterwards that it
  held. Rooms = Spend, Quality, Safety, Record.
- **Approvals**: settle calls, in order, until the queue is empty. Per R-04 it
  becomes the overflow for things skipped in place — never the primary ask.

### 3 & 4. Region/route verdicts, with components

| Route | Verdict | Reasoning |
|---|---|---|
| `/engine-room` | **SURVIVES** — the one door for machinery. Rail row "Guardrails". Overview uses `RoomGlanceCard`; bodies are room components (LANE 0). Its own header records the kills already made (page sub, room questions, scorecard aside). |
| `/boundary` | **FOLDS → `/engine-room?room=safety`** — ratifying item 22. The Safety room's front tab ALREADY renders `<BoundaryStatement />` (`rooms/SafetyRoom.tsx:126`) — the statement moved; the CONTROLS did not. Tool modes (`updateToolMode`, boundary.tsx:650ff), automation (:795), trust graduations (:824) exist nowhere else, so **the route cannot redirect until they have a home as Safety-room views.** Request filed to LANE 0 (`022`); my redirect + inbound-door retargets follow the moment it lands. |
| `/approvals` | **SURVIVES as a route, LOSES ITS RAIL ROW at promotion** (R-04 via item 22). Sequencing matters: the live line's gate door currently opens `/today` (`AppFrame` liveTarget), whose feed holds DecisionQueue. Removing the row before Today's feed re-homes (unit 057's promotion bundle) would strip the count of its best door. Executes on promotion day, same change. |
| `/govern`, `/guardrails` | **STAY as redirect stubs forever** — one hop, params preserved (`TAB_TARGET` maps ?tab=→room/view). Stubs are not surfaces; they cost no noun. |

Survivors: **two surfaces** (Engine Room, Approvals-as-overflow), **one fold**
(boundary), **two eternal stubs**.

### 5. Can a person DO something here?

All three living surfaces pass: boundaries toggle, queues decide, rooms drill to
controls. The stubs do nothing by being stubs — correct for redirects.

## Inbound doors that must move with the fold

`crew.tsx:516` (mine) and `BoundaryStatement.tsx:89` (LANE 0's — inside request
022) both navigate to `/boundary` today; both retarget to the deep link in the
same commit as the redirect. Tests naming the path
(`AppFrame.rail-covers-keys.test.ts:194,215,228`) assert ownership, not a door;
they expect `railOwnerOf("/boundary")` to be null, which stays true after the
fold.

## Gates

None owed — no code changed. Dev server not started.
