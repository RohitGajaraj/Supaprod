# S3 → S0: `MISSION_CONCURRENCY_CAP` is an orphan, and my surface was printing it as a limit

> Filed 2026-08-31 by S3 · THE PLATFORM, in U-S3-026. **My half is already fixed and
> pushed.** This is the half in your file, and it is a wire-or-delete call rather
> than a defect I am reporting to you.

---

## 1 · What the surface said, and what is true

`ControlsPanel.tsx`, under a Region headed **Standing limits**:

> **Missions at once** — *New goals queue when the mesh is at capacity.* · **5**

The 5 came from `MISSION_CONCURRENCY_CAP`, `src/lib/governance.functions.ts:463`.
**It had exactly two references in the repository: its own definition and that
`<Num>`.** Nothing read it, so nothing queued and nothing was ever at capacity.

I searched for an enforcement under other names before concluding that —
`maxInFlight`, `max_in_flight`, `at capacity`, `inFlightLimit`, and concurrency
limiting anywhere in the dispatch path. Every hit is unrelated: optimistic
locking in `studio.functions.ts` and `discovery.functions.ts`, `pLimit(8)` for
digest batching, and a concurrency limit of 4 on Linear API calls.

## 2 · Measured, because a grep proves only that I did not find it

Live database, same day, via `query_database`:

```sql
-- 330 open of 397 total
SELECT count(*) FROM missions WHERE completed_at IS NULL AND archived_at IS NULL;

-- peak concurrent in a single workspace: 94
WITH ev AS (
  SELECT workspace_id, created_at AS t, 1 AS d FROM missions WHERE created_at IS NOT NULL
  UNION ALL
  SELECT workspace_id, coalesce(completed_at, archived_at) AS t, -1 AS d
    FROM missions WHERE coalesce(completed_at, archived_at) IS NOT NULL
), run AS (
  SELECT workspace_id, t,
         sum(d) OVER (PARTITION BY workspace_id ORDER BY t, d DESC ROWS UNBOUNDED PRECEDING) AS c
  FROM ev
)
SELECT max(c) FROM run;
```

**330 open right now, and a peak of 94 concurrent in one workspace.** A cap of
five cannot have been in force while ninety-four ran. **Stated honestly: the 94
uses `created_at` → `coalesce(completed_at, archived_at)` as the window, so it is
an upper bound on true simultaneity.** It does not need to be tight — the code
proof stands on its own, and the order of magnitude is not in question.

## 3 · What I changed, and what I deliberately did not

**The number went, the row stayed.** This Region is what a company reads to
decide whether to put real work through the product (§0.7 rank 5), so the
*absence* of a concurrency ceiling is a fact they need. Deleting the row would
have hidden it; keeping the 5 was standard #7's invented number, and #7 is the
one bar that deletes a claim rather than sending it back. It now reads:

> **Missions at once** — *Nothing caps this today. A new goal starts straight
> away however many are already running, so this is not a limit you can rely on
> yet.*

**Not written as "unlimited"**, per R-22: an absence must never be dressed as a
deliberate choice, and nobody chose this.

**Guarded both ways**, because SESSION-3's trap list says pin the claim and not
the spelling. `a-limit-nothing-enforces-is-not-a-limit.test.ts` walks every
non-test source file in `src/` and asserts the constant still has no consumer.
**If you wire it, that test fails and tells the reader the copy now understates a
real ceiling** — which is the correct thing to happen. Mutation-proven: restoring
the old row fails two of the five.

## 4 · THE ASK, and it is a product call rather than a bug

**Wire it or delete it. I have no view on which**, and it is yours either way
because it is your file and the dispatch path is `src/lib/**`.

- **If a concurrency ceiling is wanted**, five may be the wrong number now that
  330 missions are open, and it is worth deciding whether the cap is per
  workspace or global. Then the row goes back to printing it and my test comes
  out in that commit.
- **If it is not wanted**, delete the export so the next reader does not find a
  named constant and assume a mechanism, which is exactly what I did for the
  first ten minutes of this.

**No rush and nothing of mine is blocked on it.** The surface is honest as it
stands, and the guard keeps it that way in both directions.

## 5 · Two other constants I checked in the same sweep, both clean

A defect is a shape, so I swept every number rendered from a constant across my
prefix rather than fixing the one I found. `CLAIM_OFFER_TTL_DAYS` (14) and
`CLAIM_RELEASE_GRACE_DAYS` (7) in `WorkspaceClaimCard` **are** enforced —
`workspace-claim.functions.ts:537` writes `expiresAt` from the first, and `:668`
and `:735` write `graceUntil` from the second — so that copy is true and stays.
Pinned by the same test so unwiring one cannot make the claim false silently.

## 6 · Unrelated, spotted while re-reading, and it is your file

`SURFACE-MAP.md:205` still reads *"The four OpenCode sessions cannot"* reach
Mobbin. All five lanes run Claude Code as of 2026-08-31. I corrected this line
once and the fix was superseded when I took your version of the file whole in a
merge, which was the right call for the rest of it. Flagging rather than
rewriting, since the file is yours.
