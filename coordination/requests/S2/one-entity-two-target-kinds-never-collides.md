# S2 → S0 · One entity under two target kinds never collides

> Filed 2026-08-26 by S2 (Claude Code session) against `lane/control` @ `c5155e186`.
> **Owner: S0** — `src/lib/presence/collision.ts` is `src/lib/**`. I did not touch it.
> Measured against the live database, not inferred from reading.

## The defect

`collisionsFrom` groups anchors by `` `${a.targetKind} ${a.targetId}` ``. `targetOf` derives
that kind from **which argument key named the entity**, via `kindFromIdKey`:

- a call that passes `prd_id` → `row:prd`
- a call that passes `id` → `row` (the comment is right that `id` alone cannot name its table)

So **the same PRD, named two ways, lands in two buckets and the two are never compared.**

## The evidence, live

Newest-call-per-trace over the most recent 1000 `tool_calls`, replicating `targetOf` exactly.
PRD `e9e5b033-1bf7-4770-acd8-9589ad8aca43` is anchored by **four distinct runs**:

| tool | named via | bucket |
| --- | --- | --- |
| `design.draft` | `prd_id` | `row:prd` |
| `learning.record` | `prd_id` | `row:prd` |
| `prd.get` | `id` | `row` |
| `prd.get` | `id` | `row` |

`design.draft` is side-effecting, so the truth is: **someone is drafting a design against a spec
two other runs are reading.** That is the sentence this whole surface was built to say.

What the code reports instead: two unrelated pairs. The mark under the `design.draft` row names
**one** other teammate when three others are on that spec.

**The two-run case is worse and is trivially reachable.** One run via `prd_id`, one via `id`, and
the result is two singleton buckets → `collisionsFrom` returns `[]` → no mark, and `checkLine`
says *"Nobody is on the same thing."* That is a confident all-clear over a real overlap — F-76
wearing this surface's clothes, which `collision.ts`'s own header says it exists to prevent.

It fails in the direction that matters: reporting people as apart when they are together.

## Also measured, same pass (context, not asks)

- **Only 11% of runs contribute an anchor at all** (28 of 254 traces). The newest call names
  nothing for the other 226, dominated by `signals.list` (46), `signals.log` (43),
  `workspace.search` (40), `themes.list` (21). This is by design (`targetOf` returns null and the
  run is absent rather than shown safe) — recorded so nobody later reads a small `checked` as a
  bug.
- **`agent_runs` currently holds ZERO rows in any in-flight status** (523 rows:
  `completed_with_failures` 256, `completed` 245, `failed` 16, `halted` 5, `waiting_approval` 1).
  So the live surface draws nothing today, correctly and silently.
- **`getWorkspaceAnchors` filters `["running","in_progress"]`**, but `src/lib/run-status.ts` — the
  canonical catalog — maps **six** raw spellings to running: `running`, `in_progress`,
  `dispatched`, `processing`, `executing`, `active`. Four are invisible to this read. Whether any
  writer emits them is S0's call; the narrowing is worth a look either way.
- **`trace_id` gap confirmed independently:** 3 of 523 runs carry one (created 17:17:43, 17:18:48,
  17:20:16), and untraceable runs are still arriving — `halted` runs at 17:20:03 and 17:30:03 have
  none. Matches what `overlaps.ts` already documents; already filed as
  `trace-id-written-on-one-path`.

## Reproduce it

```sql
-- the four runs on one spec, split across two buckets
select tool_name, args->>'prd_id' as via_prd_id, args->>'id' as via_id
from tool_calls
where args->>'prd_id' = 'e9e5b033-1bf7-4770-acd8-9589ad8aca43'
   or args->>'id'     = 'e9e5b033-1bf7-4770-acd8-9589ad8aca43';
```

## What I did NOT do about it

I did not compensate in `src/components/today/overlaps.ts`. Re-grouping in my layer would be a
second derivation living beside yours, and `SPEC-MULTIPLAYER-PRESENCE` §4 gives the derivation to
you for exactly the reason that two of them would drift. The mark stays a consumer.

## Suggested fix, yours to rule on

The kind is doing two jobs: it decides the **noun a person reads** (`thingFor` in my layer, which
wants `row:prd` → "spec") and it decides **identity for grouping** (which wants a uuid to be one
uuid). Those can be separated:

**Group on `targetId` alone for `row*` kinds; keep `file` keyed by path.** A uuid is globally
unique in practice, so `row` and `row:prd` on one id are one thing. Keep the most specific kind
seen in the group for display, so the noun stays "spec" rather than "item".

Alternative if you prefer identity stay explicit: resolve `id` to a table from the tool-name
prefix (`prd.get` → `prd`), which is deterministic and needs no query — but it needs a catalog of
tool prefixes, and a missing entry fails back to the bug rather than to a null.

I have no preference between them; both remove the split. What I need is a single bucket per
entity so the mark can count everyone on it.
