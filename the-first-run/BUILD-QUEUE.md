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

## THE CORRECTION THAT RESHAPED THIS QUEUE (2026-08-25)

**Most of what this mission needed was already built and mounted nowhere.** Verified today:

| Thing | State found | Consequence |
| --- | --- | --- |
| `startTrack` (server fn) + `TrackStart` mounted at `/plan` | **Already works** | **M-1 is cancelled.** There was never a missing create-a-track door |
| `TrackChain.tsx`, `TrackActivity.tsx` | Built 2026-08-01, **0 importers** | They ARE the run view. `TrackActivity` was built to the founder ruling asking for exactly this, then never mounted |
| `TrackActivity` polls every 10s | Already live | **M-3 (SSE) is cancelled.** Polling is sufficient; revisit only if measured insufficient |
| `driveTrackOnce` | One caller, the cron | **The one genuine gap.** Now closed by `driveTrackNow` |

**Three endpoint drafts were reverted** (`ba23bafbe`): they broke `main`, duplicated `startTrack`, read
a `users` table that does not exist, and decided when to stop by string-matching prose.

## LANE 0 — `src/components/**` except `meridian/` and `shell/`

| # | Status | Item |
| --- | --- | --- |
| L0-1/L0-2 | **DONE (MAIN)** | `src/components/track/TrackRun.tsx` — composes `TrackChain` + `TrackActivity` + the drive control. **Built by MAIN to unblock the path. Do not rebuild it; extend it.** |
| **L0-3** | **READY** | **The "waiting on you" card inside `TrackRun`.** 9 tracks sit held `waiting-on-a-person` with 0 attempts. **MAIN traced the exact mechanism 2026-08-25 — build against this, do not re-derive it:** the hold fires when `pendingApprovals > 0`, which is `stillOpen` from `spine_tracks.pending_gates` (jsonb, shape `[{id, station}]`) cross-checked against `agent_approvals`. **`agent_approvals` has NO back-reference to a track** — its own migration says *"the table carries user_id, run_id, mission_id and workspace_id, and none of those identify a spine track."* So `/approvals` can show the call but **cannot say it is blocking a seven-station journey**, and the track side had no surface at all until `/track/:id`. Read `pending_gates` on the track, name the call, and put the control that answers it on the run. "Approve" only where the click UNBLOCKS. |
| **L0-4** | **READY** | **The two payoff cards inside `TrackRun`.** The **forecast card** (before Build: what it expects, recorded, timestamped — a commitment, not a note) and the **Learn verdict card** (*predicted X · actually Y · what we now believe*). **14 real forecasts exist and 0 have ever been graded** — this is the moat and no user has seen it close. |
| **L0-5** | **READY** | **Movement.** The founder's ask: the work must look alive while it happens. A station going from waiting → running → done should read as motion, not a repaint. Use Meridian's existing transition tokens; if none fit, file a request — never a raw duration. |

## LANE 1 — `src/routes/**` except `api/`, `src/components/shell/**`, `src/styles/**` except `meridian.css`

| # | Status | Item |
| --- | --- | --- |
| L1-1 | **DONE (MAIN)** | `src/routes/_authenticated.track.$trackId.tsx` — the one linkable address. **Built by MAIN. Extend, do not rebuild.** |
| **L1-2** | **READY** | **Close the loop from start to watch.** `TrackStart` is mounted at `/plan` and already creates tracks — but after creating one it does **not** take you to it. Make starting a track land the person on `/track/:id` watching it walk. This is the single highest-leverage item in the queue. |
| **L1-3** | **READY** | **Collapse the duplicate doors.** `_authenticated.discover.tsx` vs `_authenticated.discovery.tsx` — two doors, one station. Read both, keep one, redirect. Then find the rest. One at a time, one commit each, never a mass rename. |
| **L1-4** | **READY** | **The rail leads to a run.** 84 authenticated routes IS the learning curve. A person landing here should reach a live run in one click. `AppFrame.tsx` and `run-strip.tsx` are yours. **Open every route before redirecting or closing it.** |

## MAIN LANE — `src/lib/**`, `src/routes/api/**`, `src/components/meridian/**`, `meridian.css`, `supabase/**`, DB, deploys

| # | Status | Item |
| --- | --- | --- |
| M-1 | **CANCELLED** | `POST /api/tracks` — `startTrack` already exists and is mounted. Building it was duplication |
| M-2 | **DONE** | **`driveTrackNow`** (`track.functions.ts`) — the foreground walk. Fresh clock per seat, stops on structure not prose, bounded twice and reports which bound it hit |
| M-3 | **CANCELLED** | SSE — `TrackActivity` polls at 10s. Revisit only on measured evidence |
| M-4 | **DIAGNOSED, reshaped** | **`needs-evidence` and `waiting-on-a-person` are ONE bug at two stages.** `STATION_NEEDS.sense` already documents it: *"Discover reads the world; if nothing has been ingested there is nothing to read, and three more attempts will find the same nothing. This is precisely what froze the nine live tracks."* The correction layer already escalates `needs-evidence` → an ask to a person. **It works.** The failure is downstream: the ask reaches nobody. So the fix is L0-3, not a driver change. **Remaining MAIN half:** confirm with SQL whether those 9 tracks still hold non-empty `pending_gates`, or whether the gate resolved and the hold went stale — a track waiting on a person who has nothing left to answer. **Blocked on Lovable re-auth** |
| **M-5** | **READY** | **Close the moat once.** Grade one real forecast end to end, proven with SQL. 14 real, 0 graded, ever |
| **M-6** | **READY** | **Prove the walk.** Drive a real track with `driveTrackNow` and show a track that entered at `sense` reaching `learn`. **No track has ever done this.** It is the mission |
| M-7 | ongoing | Audit both lanes, answer every request, keep this queue true |

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
