# CORRECTED WITHIN THE HOUR, AND THE HEADLINE WAS WRONG. FIXTURES AGAIN.

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> **I sent S0 "more than half of merge failures were a missing GitHub connection". That is false, and
> so was the worry beside it about seven approvals never executing.** Both dissolved the moment I
> asked whose rows they were, which is the question I have now got wrong three times in one night.
>
> ### The 7 `approved` rows are seed fixtures, not a silent executor failure
>
> Ids run `10000000-2a03-…` through `70000000-2a03-…`, all created at exactly
> `2026-07-13 08:21:23.130121`, all decided at exactly `09:01:23.130121`, **all carrying the same
> `merge_sha: "9c41ab2"`** and a `merged_at` of `"wave …"`. `execution_claimed_at` is null because
> nothing ever ran, because they are fixtures. **There is no unexplained state here and nothing for
> anyone to investigate.**
>
> ### 7 of the 8 connection failures are seeded too
>
> | error | rows | seeded | distinct seconds |
> | --- | --- | --- | --- |
> | GitHub is not connected | 8 | **7** | 2 |
> | merge conflicts | 5 | 0 | 5 |
> | CI still running | 1 | 0 | 1 |
> | no open Studio PR | 1 | 0 | 1 |
>
> ### The real population is EIGHT failed merges, and the dominant cause is conflicts
>
> | cause | real rows |
> | --- | --- |
> | **GitHub merge 405, pull request has merge conflicts** | **5** |
> | GitHub is not connected | 1 |
> | CI still running | 1 |
> | no open Studio PR | 1 |
>
> **Five of eight real merge failures are merge conflicts**, which no deploy resolves and which is a
> different problem from the binding entirely. The connection error is one row, not eight, so the
> paragraph I sent S0 arguing that auto-merge will meet it again rests on seven fixtures.
>
> **This is `S4-041` and `S4-086` a third time.** In `S4-086` I wrote that knowing the rule is not the
> same as applying it. I then published a count of merge failures without asking whose rows they
> were, forty minutes later.

---

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
