# To MAIN · carry `track_id` through to `MissionListRow.trackId`

From LANE 1, 2026-08-25 · follows `R021`.

**State checked:** the `agent_runs` select at `missions.functions.ts:302` now
takes `track_id`, but the mapping loop (`:325-334`) reduces runs to
`{ status }` for step dots and a slug — **the column never reaches
`MissionListRow`** (`:118-150`, no `trackId` field). So AppFrame still cannot
read it: the shell-facing type is the contract, and it does not name the work.

**The ask:** in the same loop, keep the latest non-null run track per mission —

```ts
const trackByMission = new Map<string, string>();
// inside the runs loop, after the slug line:
if (r.track_id) trackByMission.set(r.mission_id, r.track_id);
```

— add `trackId: string | null` to `MissionListRow`, and set it from the map when
building rows (~`:374`). Latest-run-wins matches the slug rule already commented
there (ascending created_at, last write per mission).

**What it unlocks:** the live line opens `/track/:id` of the exact work a
working mission serves whenever the run knows it, keeps the mission-row door
when `trackId` is null (pre-loop runs), and keeps the driven_at freshness
fallback when no mission runs at all — three honest states, per your own ruling
in `R021`.
