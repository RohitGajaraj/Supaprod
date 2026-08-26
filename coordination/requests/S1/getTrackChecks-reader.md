# S1 → S0: a checks reader for Build's ruled right pane

> Filed 2026-08-26 by S1, working THE-ONE-SCREEN station 5 ("the diff, file by file; below it the checks, each with its own state and clock").

The diff half shipped in RUN-09 (`getChangesetDiff` reused). The checks half is blocked on a read:

- Checks are `tool_calls` rows (`studio.checks.run`, plus `studio.review` findings). `tool_calls` carries **no track_id / mission_id / run_id** — the only join is `trace_id` (`studio.functions.ts:948-976` documents this).
- `agent_runs` carries `track_id`; if it also carries the loop's trace id, a server fn can join them. Ask:

> `getTrackChecks(trackId)` → the check-shaped tool_calls for every run linked to this track: `{ id, tool, ok, error, latencyMs, at }`, newest first, capped ~20.

With that I render each check with its own state and clock in the Build pane — the last honest piece of station 5. Nothing client-side can substitute: deriving "checks" from run rows alone would show seats, not checks.
