# BUILD QUEUE — the live board

> _MAIN LANE is the only writer of this file._ Lanes do **not** edit it — that would make it a
> multi-writer file, which is exactly what broke `main` on 2026-08-22. **A lane reports completion by
> writing its own file into `coordination/units/`**, and MAIN moves the row here. One writer per file,
> always.
>
> _Last updated: 2026-08-25 00:1x IST by MAIN LANE. Items are added continuously — a lane that
> finishes its list re-pulls and reads further down. **Never wait for this file to grow; pull.**_

**Status keys:** `READY` = start now, nothing blocks it · `BLOCKED` = waiting, dependency named ·
`WIP` = a lane claimed it in `units/` · `DONE` = verified by MAIN, not merely reported.

**PARALLEL BY DESIGN.** Every lane has `READY` work at all times below. If your next numbered item is
`BLOCKED`, **skip it and take the next `READY` one in your lane.** Do not idle and do not build
another lane's item.

---

## LANE 0 — `src/components/**` except `meridian/` and `shell/`

| # | Status | Item | Why it matters to a user |
| --- | --- | --- | --- |
| **L0-1** | **READY** | **`src/components/track/TrackRun.tsx` stub.** Export `TrackRun({ trackId }: { trackId: string })`. Render the id + the seven names from `AGENT_STATION_ORDER`. **Push within 20 min — LANE 1 is blocked on the import target existing.** | Nothing yet. This is the unblocker that lets three lanes work at once. |
| **L0-2** | **READY** | **The live seven-station view.** Fill `TrackRun` in. **Do not design this — `RunMap` already has `mode="live"` and already takes `RunMapStation[]`.** Copy the shape-builder pattern from `stopsForRoute()` in `src/components/ask/AskPlanGate.tsx`. Feed it from `GET /api/tracks/:id/stream` (MAIN, M-3). Add `RunTimeline` for history and `ToolStream` for what the agent is doing this second. | **This is the screen that does not exist.** 59 tracks have run and no human has ever watched one move. |
| **L0-3** | **READY** | **The "waiting on you" card.** 9 tracks are held `waiting-on-a-person` with 0 attempts — **the product has been waiting on the founder in total silence.** Build the card that says which work is waiting, what it needs, and the one control that unblocks it. Compose `AgentInbox`. **"Approve" only where the click UNBLOCKS; "review" where it only shows.** | The single sharpest instance of the complaint: the system was waiting on him and could not say so. |
| **L0-4** | BLOCKED → L0-2 | **The two payoff cards.** The **forecast card** (before Build: what it expects, recorded, timestamped — a commitment, not a note) and the **Learn verdict card** (*predicted X · actually Y · what we now believe*). Give these the most visual weight on the page. | **14 real forecasts exist and 0 have ever been graded.** This is the moat, and no user has seen it close. |

## LANE 1 — `src/routes/**` except `api/`, `src/components/shell/**`, `src/styles/**` except `meridian.css`

| # | Status | Item | Why it matters to a user |
| --- | --- | --- | --- |
| **L1-1** | BLOCKED → L0-1 | **Mount `src/routes/_authenticated.track.$trackId.tsx`**, importing `TrackRun` from `@/components/track/TrackRun`, passing the param as `trackId`. Pull until L0-1 lands; **take L1-3 meanwhile, do not idle and do not create the component yourself.** | The one URL the mission is about. It must be linkable and shareable. |
| **L1-2** | BLOCKED → M-1 | **The on-ramp.** One box, one sentence, one action, **zero configuration** → `POST /api/tracks` → land on `/track/:id` watching it walk. No workspace / product / station picker in the path; default them and disclose after. Read `src/components/ask/__tests__/one-prompt-per-screen.test.ts` first — there is a standing one-composer rule you will trip. | **A user who must configure before anything happens does not come back.** This is the difference between a demo and a product. |
| **L1-3** | **READY** | **Collapse the duplicate doors.** `_authenticated.discover.tsx` and `_authenticated.discovery.tsx` are two doors to one station — read both, keep one, redirect the other. Then find the rest of the near-duplicates. One at a time, one commit each, never a mass rename. | 84 authenticated routes **is** the learning curve. |
| **L1-4** | **READY** | **The rail leads to a run.** `AppFrame.tsx` and `run-strip.tsx` are yours. A person landing in this product should reach a live run in **one click**, not assemble the journey by navigating. **Open every route before redirecting or closing it** — some of the 84 hold real work. | Today the person walks and the system waits. It must be the other way round. |

## MAIN LANE — `src/lib/**`, `src/routes/api/**`, `src/components/meridian/**`, `meridian.css`, `supabase/**`, DB, deploys

| # | Status | Item | Why |
| --- | --- | --- | --- |
| **M-1** | **READY** | **`POST /api/tracks`** — create a track from one sentence. Wrap `startTrackCore` (`src/lib/spine/track.functions.ts:238`). Default workspace + product, return what was defaulted. **LANE 1's L1-2 is blocked on this.** | The way in. |
| **M-2** | **READY** | **`POST /api/tracks/:id/drive`** — foreground walk. Loop `driveTrackOnce` until the route finishes or a gate blocks, **without** the tick's shared 45s fair-share deadline. **Do not change the tick.** | The tick moved **5 tracks in 24 hours**. A watched run cannot be rationed. |
| **M-3** | **READY** | **`GET /api/tracks/:id/stream`** — SSE of station transitions, on the `src/lib/ask-sse.ts` conventions. **Publish the exact event type into `MISSION.md` so both lanes can code against it.** | Both lanes need the contract; L0-2 is waiting on it. |
| **M-4** | **READY** | **Kill the `needs-evidence` thrash.** 17 tracks, **51 attempts**, retrying a precondition they can never satisfy and spending real money. `MAX_STATION_ATTEMPTS` has never fired. Find the unsatisfiable condition and make the failure terminal + visible. | Money burning on a loop that cannot win, invisibly. |
| **M-5** | **READY** | **Close the moat once.** Grade one real forecast end to end and prove it with SQL. 14 real forecasts, **0 graded, ever.** | Until this happens the moat is a claim, not a product. |
| **M-6** | ongoing | **Audit, answer, verify.** Every `coordination/requests/` file is mine; a blocked lane is my cost. Neither lane has DB, deploy, Mobbin or founder access. | Two lanes stall without me. |

---

## The parallel start order

```
NOW ─┬─ LANE 0 takes L0-1 (20 min), then L0-2, L0-3
     ├─ LANE 1 takes L1-3 and L1-4 immediately (neither is blocked)
     └─ MAIN   takes M-1, M-3 (unblocks both lanes), then M-2, M-4, M-5

as soon as L0-1 lands  → LANE 1 picks up L1-1
as soon as M-1 lands   → LANE 1 picks up L1-2
as soon as M-3 lands   → LANE 0 wires L0-2 to the real stream
```

**No lane ever has zero `READY` work.** That is the property this ordering exists to guarantee.

## Acceptance — the mission is not done while any of these is false

1. A route at `/track/:trackId` shows one track's seven stations.
2. **It moves without a page refresh** while the run walks.
3. A person starts a run in one action, **with no configuration**.
4. Seven stations complete in **minutes, not weeks**.
5. A forecast is recorded **before** Build and **graded after** Ship, on a real workspace, both visible.
6. **A track that entered at `sense` reaches `learn`.** No track has ever done this. It is the whole mission.
