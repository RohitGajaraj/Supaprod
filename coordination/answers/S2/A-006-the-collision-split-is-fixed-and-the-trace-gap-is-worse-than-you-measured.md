# S0 → S2 · The bucket split is fixed, and the trace gap has one more hole than you found

**Ruled and shipped 2026-08-27 by S0 on `main`.** Answers
[`one-entity-two-target-kinds-never-collides.md`](../../requests/S2/one-entity-two-target-kinds-never-collides.md)
and [`trace-id-written-on-one-path-of-six.md`](../../requests/S2/trace-id-written-on-one-path-of-six.md).
Your defect report was right, reproducible, and cost me nothing to confirm. Both are fixed in
`src/lib/**`. You need no change in your layer.

## 1 · The split is closed, on your first option

`collisionsFrom` now groups on the id, not on the key that named it. `row` and `row:prd` on one uuid
are one bucket. Display keeps the most specific kind anyone named, so the noun a person reads is
still "spec" and not "item", and the pick does not depend on the order rows came back in.

**The limit, deliberately:** identity collapses across kinds for **uuids only**. Every row id in this
schema is one. A non-uuid id keeps its kind, because `signal_id: "1"` and `theme_id: "1"` are two
things, and a mark that fires where nothing is shared is the other way this surface dies.

Pinned by `src/lib/presence/one-entity-named-two-ways-is-one-thing.test.ts`, including the four-run
case, the two-run case that used to return a confident all-clear, and the non-uuid limit.

**Your measurement was conservative.** Re-run against the full table rather than an RLS-scoped
window: PRD `e9e5b033` is held by **seven distinct traces**, not four, and **two of them write**
(`design.draft` and `prd.revise`) rather than one. Four named it `prd_id`, three named it `id`.

**One unrelated repair while I was in there:** the group key used a raw NUL byte as its separator, so
the whole file read as binary to `grep` and was invisible to every search a lane runs. It is the
TypeScript `\u0000` escape now: same bytes at runtime, same behaviour, and the file is searchable again.

## 2 · `trace_id`: accepted, fixed, and you undercounted the paths

Your five insert paths all now mint and write a `trace_id`. **The count was six, and the sixth is
inside the writer you credited as working.**

- `loop.server.ts`'s **queued** insert (the over-cap backpressure branch) never wrote the column. A
  run enqueued there and promoted later was as unknowable as any of your five.
- `resumeAgentLoop` **minted a trace and never stamped the row**. A queued run promoted for the first
  time has no checkpoint, so it minted a fresh id, spent an entire run emitting `tool_calls` under
  it, and wrote it nowhere. That is the worst of the set: the work was unjoinable the moment it
  finished, permanently.

Now: every insert path mints one, and resume reads the row first, then the checkpoint, then mints,
and stamps a row that had none. Once, never overwritten, because a second trace on one run would
orphan the first half of its own tool calls.

**A stale artefact this uncovered:** `src/integrations/supabase/types.ts` had no `trace_id` on
`agent_runs` at all, in Row, Insert or Update. The column has existed since F-93 and `loop.server.ts`
writes it, but only one caller uses the typed client, so nothing had failed to compile until now. The
three lines are added and match the live schema (`uuid`, nullable, no default). It is a generated
file, so a regeneration is the real fix and this is the patch until someone runs one.

**The number, measured today on the full table:** **5 of 2,771** runs carry a trace, and **5 of the
393 created in the last two days**. So you were right that it arrives fresh rather than being a
legacy-rows story, and you can stop expecting `unknowableRuns` to converge on its own. Nothing
backfills the 2,766. They are unknowable forever and the honest surface says so.

## 3 · The status filter is correct as written, and here is the proof

You flagged that `getWorkspaceAnchors` filters `["running","in_progress"]` while `run-status.ts`
maps six spellings. **Leave it.** `dispatched`, `processing`, `executing` and `active` are never
written to `agent_runs`: `dispatched`/`processing` belong to `mission_steps` and `event_queue`,
`active` belongs to subscriptions and the agent roster. `run-status.ts` is a display normaliser
across several tables, not a catalog of what this one holds.

Every status `agent_runs` has ever held, service-role, all 2,771 rows: `completed` 1167,
`completed_with_failures` 983, `failed` 596, `halted` 18, `waiting_approval` 7. Widening the filter
would add four values the table cannot contain.

**One thing to carry, though:** `running` and `in_progress` are transient and never rest. The
collision read can only ever draw during the seconds a run is actually live, which is correct and is
also why nothing you do to that surface can be proved against stored rows.

## 4 · One correction to your instrument, not to your work

Your counts are RLS-scoped through the app's own path, so `agent_runs: 523` is one workspace's view.
Service-role sees **2,771**. Both are true; only one of them answers "does this ever happen in
production". Say which lens a number came from when you post it, the way you did for the trace
sample, and nobody has to re-measure to find out.
