# S4-093 · The merge did not only stall waiting for a person. Fifteen were attempted and failed

> _S4, 2026-08-27, measured live. S0's four numbers verified exactly, and the query returns three
> statuses their summary did not carry. One of the three changes what "deploy main" will do._

## S0's numbers, confirmed

| status | n | last |
| --- | --- | --- |
| `expired` | **21** | created 2026-07-31 |
| `rejected` | **8** | decided **2026-08-25 18:48:31** ← the F-79 row |
| `pending` | **7** | created 2026-07-25 |
| `executed` | **14** | decided **2026-07-10 21:21:34** |

All four match. The last executed merge really is 2026-07-10, and nothing has executed since.

## The three statuses the summary did not carry

| status | n | what the record says |
| --- | --- | --- |
| **`failed`** | **15** | attempted and errored, last decided 2026-07-20 |
| **`approved`** | **7** | decided **yes** on 2026-07-13, **no error, never executed** |
| `cancelled` | 2 | 2026-07-08 |

**Population is 74 merge approvals, not 36.**

## Why the failures matter more than the stall

```sql
SELECT status, count(*), left(error, 150) FROM agent_approvals
WHERE tool_name ILIKE '%merge%' AND status IN ('failed','approved') GROUP BY 1,3;
```

| n | error |
| --- | --- |
| **8** | *"GitHub is not connected. Connect it in Settings → Connected accounts, then bind a repo on Connectors."* |
| **5** | *"GitHub merge 405: Pull Request has merge conflicts"* |
| 1 | *"MergeBlocked: CI is still running."* |
| 1 | *"no open Studio PR on this mission"* |
| **7** | **(no error recorded)** ← the `approved` ones |

**The story is not only "the loop files a merge approval and waits for a person".** When merges DID
run, **more than half of them failed on a missing GitHub connection**, and a third on real merge
conflicts.

## What this does to the critical path

S0's conclusion is that deploying `main` releases F-75, after which merges execute inline instead of
queueing. That follows, and it is not sufficient on its own:

1. **The binding problem is the same one S0 found in F-106** and corrected themselves: workspace
   `0b792d52` has no GitHub binding and falls back to a repo the App cannot see. **Eight historical
   merge failures say that exact sentence.** Auto-merge will meet it again unless the binding is
   fixed first.
2. **Five failed on merge conflicts**, which no deploy resolves.
3. **Seven were approved by a person and never executed, with nothing recorded about why.** That is
   the most concerning row: a yes that produced neither an execution nor an error. It is the same
   defect shape as `decided_by` and `forecast_resolved_by_agent_slug` being NULL — **the record
   cannot say what happened.**

**None of this argues against deploying.** It argues that "merge, preview within two minutes, Ship"
has two known obstacles standing in it that predate the deploy, and one unexplained state.

## What I am not claiming

- **The 7 `approved` rows may have a mundane cause** — a schema change, a backfill, or an executor
  that never claimed them. `execution_claimed_at` exists on this table and I did not read it.
- **I did not check whether the 8 connection failures are all one workspace.**
- **I did not verify F-75's behaviour**, only the history it is meant to change.
