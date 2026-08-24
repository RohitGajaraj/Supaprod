# The first real run — why no journey has ever finished, and the one thing that fixes it

> _Created: 2026-08-24 · Owner: MAIN LANE · Status: executing_

**The founder's question, verbatim:** *"till now it's been disappointing for me that I myself have
not seen one single loop or entire journey running from end to end on its own. And how can I claim
it as a truly agentic first platform."*

**He is right, and the reason is not a missing feature.** Every part needed to run and watch a
seven-station journey is already built. Nothing assembles them into a path, and nothing lets a
person start one and watch it. This document is the measurement behind that claim and the mission
that follows from it.

---

## 1. What is actually true, measured 2026-08-24

| Claim | Evidence |
| --- | --- |
| An object exists that walks all seven stations | `spine_tracks`, migration `20260801130000`. Owns identity, intent, route |
| It can walk them | `src/lib/spine/a-signal-walks-the-whole-spine.test.ts` passes. Real decision layer, effects as data |
| **It has no address anywhere in the product** | **0 of 84 authenticated routes surface a track.** `ls src/routes/ \| grep -c '^_authenticated'` = 84 |
| **Its only driver is a background cron** | `driveTrackOnce` has exactly one caller: `src/routes/api/public/hooks/track-tick.ts` |
| A watched run is impossible by construction | The tick serves ≤5 tracks under one shared 45s deadline, ≤3 seats a station. Seven stations ≈ 21 seats, round-robin. Hours, invisibly |
| The moat has never fired on a real workspace | 146 forecasts and 91 resolutions, all in two seeded demo tenants. **0 of 131 across six real workspaces** |

**The run primitives are NOT unreachable any more.** `agent-first-reimagining-index.md` says
`RunTimeline`, `ToolStream`, `RunMap`, `PlanGate`, `AgentInbox` are mounted only in the gallery.
Re-measured today: all six are now reached from real surfaces (`runs.$missionId`, `today`,
`ask/AskPlanGate`, `MissionOrchestratorDetail`). **That claim is stale — do not repeat it.**

## 2. The defect, in one sentence

**The product built the object that represents a journey, and never gave it a door, a driver a
human can pull, or a screen where the walk is visible.**

`spine_tracks`' own migration comment argued for itself on exactly this ground:

> *A person needs one address. The learning curve of this product is the number of nouns in it, and
> "your work is eight different things depending on which page you are on" is the expensive version.*

That fix shipped as a table and stopped there. The expensive version is what the product still is:
84 doors, and the user is the one who walks between them. **That is the opposite of agentic.** In an
agentic product the system walks and the person watches. Here the person walks and the system waits.

## 3. The user lens, which is the only lens that matters here

A user does not want seven stations. Seven stations is our org chart shown to a customer. A user
wants four things, in this order:

1. *Here is what I want.* — one box, one sentence.
2. *Go.* — it starts without being configured.
3. *Show me.* — it moves on screen while it works.
4. *Did it work?* — it tells me, against what it predicted.

**Nothing in the product does 2, 3 or 4 today.** Point 1 exists in several places. This is why there
is no moment of surprise: the impressive thing happens in a table, over hours, with nobody watching.

**The reframe: stations become a transcript, not a menu.** One run, scrolling, seven stations
passing by as it works. The 84 routes stop being destinations and become drill-downs from a run.
Learning curve goes to roughly zero because there is one thing to learn: the run.

**And the moat becomes a moment you can see.** Before Build the run stops and says what it expects to
happen, and records it. After Ship it says what actually happened and what it now believes. That is
the one thing in this market that cannot be reconstructed after the fact, and today it has never
once happened in front of a real user on a real workspace.

## 4. The mission — "THE FIRST RUN"

**One track walks all seven stations, on demand, on a real workspace, watchable live, with the
forecast captured before Build and graded after Ship, at one URL that can be revisited.**

Done means the founder types one sentence, watches seven stations complete in minutes, sees the
prediction recorded before the build and graded after the ship, and can send someone the link.

**This is an assembly mission, not a build mission.** The default move on every unit is to wire what
exists. A new component or table needs a reason in its unit file for why nothing existing served.

## 5. Why this and not the other candidates

- *Fix the spine's remaining perf issues* — the tick still overruns. Real, and invisible to a user.
  A watched run does not use the tick at all, so this mission routes around it rather than waiting.
- *Reduce the 84 routes first* — that is a month, and it does not produce a run. The run makes most
  of the 84 self-evidently drill-downs, so it should come first and inform the collapse.
- *More stations / more agents* — the complaint is that no journey finishes. More parts is the
  failure mode being corrected, not the fix.

## 6. Standing pattern this mission is a symptom of

From the 2026-08-24 handoff: *"the product builds the engine and forgets the door. Five in two
days."* — `createWorkspace`, `draftContractFromIntent` (0 callers, 140 lines), `reopenForecast`
(0 callers, copy promises it), `recordJudgment`'s unreachable forecast param, `ensureDefaultProduct`.

**The spine is the largest instance of that pattern in the repo.** Rule adopted with this mission:
**when a lib function lands, its door ships in the same unit, or the unit says why there is none.**

---

**Operational plan, lane ownership and acceptance:** [`MISSION.md`](./MISSION.md)
