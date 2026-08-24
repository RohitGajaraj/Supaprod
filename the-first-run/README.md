# THE FIRST RUN — the folder to pick from

> _Created: 2026-08-24 · Everything for this mission is in this folder and nowhere else._

**The mission:** one track walks all seven stations, on demand, on a real workspace, watchable live,
with the forecast captured before Build and graded after Ship, **at one URL**.

**Why:** you have never seen a journey finish. That is not a missing feature — it is measured in
[`DIAGNOSIS.md`](./DIAGNOSIS.md), and the short version is that the product has a complete engine, a
complete component library and a complete moat, **with no screen where a person can watch any of it
happen.**

---

## Paste these three. That is the whole setup.

| Paste this file | Into | Size |
| --- | --- | --- |
| [`GOAL-main-lane.md`](./GOAL-main-lane.md) | **Claude Code** (this repo, `main`) | **3,983 chars** — under the 4,000 limit |
| [`GOAL-lane-0.md`](./GOAL-lane-0.md) | **opencode / OX Alpha**, worktree `cadence-lane-0` | 13,095 chars — no limit there |
| [`GOAL-lane-1.md`](./GOAL-lane-1.md) | **opencode / OX Alpha**, worktree `cadence-lane-1` | 12,312 chars — no limit there |

**MAIN LANE's goal is a pointer, by design.** It cannot carry the full brief in 4,000 characters, so
it carries the objective, the six acceptance criteria, the non-negotiables, and instructions to read
[`MISSION.md`](./MISSION.md) first. The two building lanes get the whole thing inline, because more
context makes them build closer to the mark.

## What each file is

| File | What it is | Who writes it after today |
| --- | --- | --- |
| [`BUILD-QUEUE.md`](./BUILD-QUEUE.md) | **The live board.** Every lane's next item, with status. MAIN is the only writer; lanes report by writing into `coordination/units/` | MAIN LANE |
| [`EVIDENCE.md`](./EVIDENCE.md) | **The production numbers, each with its SQL.** 59 tracks, 58 entered at `sense`, zero reached `learn` | MAIN LANE |
| [`DIAGNOSIS.md`](./DIAGNOSIS.md) | Why no journey has ever finished, every claim carrying its measurement | MAIN LANE |
| [`MISSION.md`](./MISSION.md) | The shared reference all three lanes read: objective, lane ownership by path, the wiring order, acceptance | MAIN LANE |
| `GOAL-*.md` | The three paste-ready goals | MAIN LANE |

**The channel stays where it is.** Messages between the lanes keep using `coordination/` —
`requests/`, `answers/`, `units/`, `STATUS.md`. That folder is live, 80+ units deep, and it already
works; this folder only holds the mission and the goals.

## The wiring order, so three lanes never block each other

```
L0-A  stub    src/components/track/TrackRun.tsx   → LANE 0 pushes FIRST, within 20 min
L1-A  mount   src/routes/_authenticated.track.$trackId.tsx
M-A   create  POST /api/tracks                    → one sentence of intent, zero config
M-B   drive   POST /api/tracks/:id/drive          → foreground walk, no fair-share deadline
M-C   stream  GET  /api/tracks/:id/stream         → SSE of station transitions
L0-B  fill    TrackRun consumes the stream, RunMap in "live" mode
L1-B  onramp  one box → creates a track → lands on /track/:id watching it walk
M-D   moat    forecast captured at Decide, graded at Learn, on a REAL workspace, SQL-proven
L0-C  payoff  the forecast card, and the Learn verdict card
L1-C  doors   collapse the duplicates and the dead ends; the rail leads to a run
```

## What the database said, once I could finally ask it

**59 tracks have ever existed. 58 entered at `sense`. Zero have ever reached `learn`.** The one row
sitting at `learn/done` is a seeded tenant that entered at `define`, skipping the first two stations.

**45 of 59 are stuck at station one.** 17 thrashing on `needs-evidence` across 51 attempts, burning
money on a precondition they cannot satisfy. 18 timed out. **And 9 held `waiting-on-a-person` with
zero attempts — the product decided it needed you, stopped, and never told you.** That is the finding
that turns your visual-presence instinct from a nice-to-have into the fix: the system has been waiting
on you nine times over, in silence, for three months.

The cron is not dead — it ran four minutes before I measured. It moved **5 tracks in 24 hours** out of
59. A journey needs ~21 agent seats, so at that rate one run takes weeks, which for a watching human
is the same as never.

**And the moat has never closed: 14 real forecasts, 0 ever graded.** Full queries: [`EVIDENCE.md`](./EVIDENCE.md).

## How you will know it worked

You type one sentence into one box. Seven stations complete in front of you in minutes. Before the
build, the run says what it expects to happen and records it. After the ship, it tells you what
actually happened and what it now believes. **You can send someone the link.**

None of those six things is true today. All six are in the acceptance list in
[`MISSION.md`](./MISSION.md), and no lane may call the mission done while one is still false.

## Two things worth knowing before you read further

**The `coordination/` folder was not keyrone leftovers.** You suggested deleting it. It is the live
three-lane channel with 80+ units in it, and deleting it would have thrown away the whole message
history. What was actually wrong: its three `PROMPT-*.md` files are 42KB, 45KB and 20KB — **ten times
too large to paste as a goal.** That is the gap this folder fills, and the prompt files stay as the
long-form handbook.

**One claim in the existing audits is stale, and it mattered.** `agent-first-reimagining-index.md`
says the run primitives — `RunTimeline`, `ToolStream`, `RunMap`, `PlanGate`, `AgentInbox` — are
mounted only in the component gallery. Re-measured today: all of them now reach live surfaces. Do not
repeat that line. The real gap is narrower and better news: **`RunMap` already has a `"live"` mode and
already takes a seven-station shape.** The seven-station live view is not something we have to design.
It is something we have to feed.
