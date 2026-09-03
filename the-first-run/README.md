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
| [`START-HERE.md`](./START-HERE.md) | **Read first.** What we are doing and why, in one page |
| [`RULINGS.md`](./RULINGS.md) | **The tiebreaker, R-01…R-20** |
| [`FINDINGS-LEDGER.md`](./FINDINGS-LEDGER.md) | What was found, FIXED, OPEN, DEFERRED or proved FALSE |
| [`GAP-AUDIT.md`](./GAP-AUDIT.md) | The 40-finding platform sweep |
| [`FRONTIER-BRIEF.md`](./FRONTIER-BRIEF.md) | How the labs ship, and the strategic angle |
| [`THE-ONE-SCREEN.md`](./THE-ONE-SCREEN.md) | The target architecture |
| [`DESIGN-DIRECTION.md`](./DESIGN-DIRECTION.md) · [`MERIDIAN-ADOPTION.md`](./MERIDIAN-ADOPTION.md) | The design ruling and the component census |
| [`SPEC-ARTIFACTS.md`](./SPEC-ARTIFACTS.md) · [`SPEC-LAYOUT.md`](./SPEC-LAYOUT.md) · [`SPEC-CONSENT.md`](./SPEC-CONSENT.md) · [`SPEC-ONRAMP.md`](./SPEC-ONRAMP.md) | Build specs, `file:line` on every claim |
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

## The five-session model — 2026-08-26, current

| File | What it settles |
| --- | --- |
| **[`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md)** | **Every session reads this first.** The user lens, the structural defect (§0.5 — three surfaces, not 119 routes), the authorised feature gaps and the frontier standard (§0.6), what "truly agentic" means so it can be failed, path ownership for five sessions, the worktree bus protocol, work-safety rules, both gates, and the six-verb persona |
| [`SESSION-0-CONDUCTOR.md`](./SESSION-0-CONDUCTOR.md) | Claude Code on `main` — database, deploys, merges, the spine, and keeping four lanes unblocked |
| [`SESSION-1-THE-RUN.md`](./SESSION-1-THE-RUN.md) | The one screen: assign, watch, steer, review, verdict |
| [`SESSION-2-MISSION-CONTROL.md`](./SESSION-2-MISSION-CONTROL.md) | Many pieces of work at once, and the multiplayer cursor layer |
| [`SESSION-3-THE-PLATFORM.md`](./SESSION-3-THE-PLATFORM.md) | The sixty seconds, the boundary, and everything a company must have to buy this |
| [`SESSION-4-THE-PROVING-GROUND.md`](./SESSION-4-THE-PROVING-GROUND.md) | Writes no product code. Proves or disproves every claim the other four make |
| [`SPEC-STATION-MODEL-AND-ARTIFACTS.md`](./SPEC-STATION-MODEL-AND-ARTIFACTS.md) | **The seven stations stay seven, and why the merge is the wrong instrument.** Discover and Decide do not club — the forecast needs a moment of decision distinct from the moment of finding, and the two stations have different cardinality — but they write **one `intent.md`** between them, which is what the merge was reaching for. Deploy and Learn do not club because **Deploy is an event and Learn is a two-month wait**. Carries the artifact formats in full (`intent.md` with the forecast block their format has no field for, `spec.md`, `plan.md`, `verdict.md` which their pipeline has no equivalent of), **the engine-portability law** — `AGENTS.md` carries the substance, `CLAUDE.md`/`GEMINI.md`/`QWEN.md` are generated pointers, and no engine name appears in any artifact body — and **§4, the UX contract**: the artifact is never the interface, three kinds of moment rather than seven, and the five fields are a shape and never a form. |
| [`RANKED-BACKLOG.md`](./RANKED-BACKLOG.md) | **All 29 gaps ranked and distributed across the five lanes**, written at the founder's instruction. Tier 0 is the acceptance and all of it is S0's; every other lane has a Tier 1 item that does not wait on it. Carries the navigation ruling for F-144/145/146 — **one primary door with the board folded into it** — and the gate that keeps layer 03 blocked until forecasts are actually being graded. |
| [`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md) | **Anthropic's AI-native SDLC playbook, and it is our framework — adopt by default, argue every refusal** (founder ruling 2026-08-31). Their six stages mapped onto our seven, the adoption register marking every artifact and practice ADOPTED / ADOPTING / ADAPTED / REFUSED, gaps 15–22, and the three refusals with their arguments. **The largest adoption: what we hand a builder should BE `intent.md` · `spec.md` · `plan.md`, named their names, so a team on the playbook needs no adapter.** Carries the finding that matters most — in six stages, ten artifacts and eighteen measures, **nothing records a prediction before the outcome is known**, so the vendor published layers 01 and 02 and left 03 empty. Read this, never the post.** Its strategic half — what we rewire, what it costs, what could derail us and what we kill — is [`../docs/strategy/ai-native-sdlc-rewiring-2026-08.md`](../docs/strategy/ai-native-sdlc-rewiring-2026-08.md). |
| [`SPEC-BUILD-PATHS.md`](./SPEC-BUILD-PATHS.md) | **Hybrid, ruled 2026-08-26: both build paths ship** — hand the spec and the forecast to their builder, or build it here on credits. Holds the station-by-station sandbox ranking (five of seven need something to run, and Decide's metric probe and Ship's preview deploy outrank the Design prototype for closing the loop), and the four ways an outcome gets back when somebody else built it. **The load-bearing fact: the verdict is measured against the forecast, not against the code.** |
| [`SPEC-AGENT-COMMS.md`](./SPEC-AGENT-COMMS.md) | **Teammates that address each other, and you.** Seven message types and no eighth, the person as a participant rather than an audience, Slack out-and-back so a reply never requires coming back, and the mention-consent rule that does not bend. Opens with why addressed messages are the opposite of the context-dumping [`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md) §2.5 refuses — and carries the budget guard that would kill the feature if that objection turns out to be right. |
| [`SPEC-CONNECTORS.md`](./SPEC-CONNECTORS.md) | **The tools at every station, and how an agent acts in somebody else's system.** Opens with what already exists — about twenty providers including Jira, Linear, GitHub and Slack, a generic MCP client, and Supaprod as an MCP server — so this is a wiring job. Holds the four integrations that carry the loop, inbound work assignment (an issue assigned to Supaprod becomes work), the external-write governance by reversibility, and the research protocol. |
| [`SURFACE-MAP.md`](./SURFACE-MAP.md) | **Every route and every component directory in the repo, with its owner and what happens to it** — keep, fold, delete, or audit-first. 113 routes become roughly 41. Also holds the design-reference protocol: only S0 reaches Mobbin, so lanes request through `coordination/requests/` and S0 commits the reference so every worktree can see it. |
| [`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md) | Named, coloured teammates with live cursors across every surface — and the law that stops it being theatre |
- [`checkpoints/`](./checkpoints/) — per-lane resume files written before a system restart (2026-09-03).
