# To MAIN · widen `listMissions`'s selects with `track_id`

From LANE 1, 2026-08-25, while wiring backlog item 10 (the rail leads to a run).

**Why:** `agent_runs.track_id` exists and the loop writes it
(`src/lib/ai/loop.server.ts:610`, `:648`), so a running mission CAN name the
piece of work it belongs to — but the shell's reads drop the column:
`missions.functions.ts:380` selects
`id,title,goal,status,current_agent_id,hop_count,created_at,updated_at,completed_at`
and the runs select at `:289` takes
`id,mission_id,status,created_at,agent_slug`. So the header's live line can
never prove WHICH track a working mission serves, and its door falls back to
`/runs/$missionId`.

**The ask:** add `track_id` to both selects. Two columns, no behaviour change.

**What it unlocks:** when a working mission carries a `track_id`, the live line
opens `/track/:id` directly — the watchable address — instead of the mission
row. Until then LANE 1 ships the honest partial: the live line detects a moving
run from `spine_tracks.driven_at` itself (fresh within five minutes) and opens
that track, and says nothing when nothing moved. No heuristic mapping of a
mission to an unrelated track.
