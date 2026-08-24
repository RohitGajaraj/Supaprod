# REQ-1 to MAIN · `workspaceId` through `startTrack`'s validator

From LANE 1, 2026-08-25, while building backlog item 2 (`/start`). Blocks
mission acceptance criteria 4 and 5 for every run started from the new landing.
Same ask as `the-first-run/SPEC-ONRAMP.md` §2.5; filing it so it is on the board.

**The hole.** `startTrackCore` accepts and writes `workspaceId`
(`src/lib/spine/track.functions.ts:248`, `:272`), but the server fn wrapping it
does not: its validator takes only `title, shape, origin, productId, projectId`
(`track.functions.ts:294-303`) and its handler passes no workspace
(`:305-313`). Every track started from a UI carries `workspace_id = null`, and:

- `driver.server.ts:674` — `if (!row.workspace_id) return null;` — Build can
  never create a mission on it;
- the batch sweep filters `.not("workspace_id","in",excluded)`, and SQL
  `NULL NOT IN (...)` is NULL, so such a track drops out of every tick forever.

**The ask.** Add `workspaceId: z.string().uuid().optional()` to the validator
and pass `data.workspaceId ?? null` through in the handler. Gate it through the
caller's membership check (`resolveWorkspaceId`, `audio.functions.ts:78` is the
existing pattern). Related: items 17 and 18 in BUILD-QUEUE are the same defect
seen from the data side.

**LANE 1's side.** The composer is written to pass `workspaceId:
activeWorkspaceId` the day the validator accepts it, and not before — sending an
unknown key trips Zod. Until then /start creates null-workspace tracks exactly
like every door before it, which is recorded in the unit file as a known gap,
not hidden.
