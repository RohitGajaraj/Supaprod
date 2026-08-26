# S4-050 · The same approval is pending and expired at once, and two surfaces read different fields

> _S4, 2026-08-27, live database plus code. Read only._

## The rows

Four pending approvals sit on a **real** workspace (`is_sample = false`). Every one has three fields
that contradict each other:

```sql
SELECT id, tool_name, status, escalation_state, created_at, expires_at, now() - created_at
FROM agent_approvals a JOIN workspaces w ON w.id=a.workspace_id
WHERE a.status='pending' AND w.is_sample IS FALSE;
```

| tool | `status` | `escalation_state` | `expires_at` | waiting |
| --- | --- | --- | --- | --- |
| `memory.promote` | **pending** | **expired** | 2026-09-25 | **33 days** |
| `backlog.prioritize` | **pending** | **expired** | 2026-09-25 | 32 days |
| `mission.dispatch` | **pending** | **escalated** | 2026-09-25 | 32 days |
| `studio.pr.merge` | **pending** | **expired** | 2026-09-25 | 32 days |

**`status` says waiting. `escalation_state` says already expired. `expires_at` says it does not
expire for another month.** Three answers to one question on one row.

## Why that matters: two surfaces read different fields

`src/lib/ai/loop.server.ts:2665-2667` states the rule outright:

> *"escalation_state moves with the verdict because a decided gate that keeps
> `escalation_state='pending'` is a phantom in every Needs-You surface (**they read
> `escalation_state`, not `status`**)."*

And the approvals queue reads the other one, `approvals-queue.functions.ts:235`:

```ts
.eq("status", "pending")
```

**So the same four rows are simultaneously in the queue and absent from the Needs-You surface**, or
the reverse, depending on which field a given surface trusts. The code documents that the two fields
can drift and names the drift a "phantom". These rows are that phantom, live, on a real workspace,
thirty-three days old.

## The bit that cannot be explained by drift

`expires_at` is **2026-09-25**, a month in the future, while `escalation_state` already reads
`expired`. Whatever set the escalation state did not consult the expiry, and whatever set the expiry
did not consult the escalation state. Both are on the same row and neither is a computed view of the
other.

## What I am not claiming

**These four are probably fixtures.** Their ids are sequential and hand-shaped
(`60000000-2a03-4000-8000-00000000000{1,2,3,5}`), which is a seed signature, and they sit on the
workspace whose id is likewise `60000000-…`. **I am not reporting "four things are waiting on the
founder right now".**

That does not dissolve the finding, for two reasons. The workspace is `is_sample = false`, so the
sweep drives it and every count in the product includes it. And an internally contradictory row is a
defect whether a person or a seed script wrote it, because the readers cannot both be right.

**What I did not check:** whether a live, non-seeded approval has ever drifted the same way. That
needs the write paths audited rather than the rows, and it is the question that decides whether this
is a seeding bug or a product one.

## The wider count, for whoever picks this up

```sql
SELECT status, count(*), count(*) FILTER (WHERE decided_at IS NULL) FROM agent_approvals GROUP BY 1;
```

| status | n | undecided |
| --- | --- | --- |
| approved | 79 | 0 |
| **expired** | **67** | **67** |
| cancelled | 58 | 49 |
| executed | 44 | 0 |
| **pending** | **32** | **32** |
| rejected | 24 | 0 |
| failed | 20 | 0 |

**Ninety-nine approvals were never decided by anyone** (67 expired plus 32 still pending). Twenty
eight of the 32 pending are on sample workspaces. The historical note that "90 queued approvals since
July, zero ever answered" is close to right on the never-answered count and wrong that none were
answered at all: 79 approved, 24 rejected and 44 executed say decisions do happen.

## Verdict

**CONFIRMED as a data-integrity defect.** One row, three fields, three different answers, and two
surfaces in the codebase that read two of those fields. `src/lib/**` is S0's.

The narrowest thing to settle first is not the fix but the question above: **has a non-seeded
approval ever drifted this way?** If yes it is a product bug and urgent. If no it is a seeding bug
and cheap, and the finding reduces to "our fixtures teach every surface a contradiction".
