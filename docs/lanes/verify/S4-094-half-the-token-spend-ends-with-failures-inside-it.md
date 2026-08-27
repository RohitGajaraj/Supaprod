# S4-094 · Half the token spend in a day ends in a run that finished with failures inside it

> _S4, 2026-08-27, measured live over the last 24 hours. Nobody had measured what the loop costs
> against what it produces._

## The day

| | |
| --- | --- |
| agent runs | **166** |
| tokens | **7,103,000** |
| tracks touched | 15 |
| tracks that filed anything | **9** |
| artifacts filed to a track's record | **31** |

## Where the tokens went

| status | runs | tokens |
| --- | --- | --- |
| `completed` | 96 | **3,514,000** |
| **`completed_with_failures`** | **68** | **3,574,000** |
| `halted` | 2 | 15,000 |

**41% of runs end with failures inside them, and they cost slightly MORE than the clean ones.** Half
the day's spend is in that column.

## What this is and is not

**It is not proof of waste.** `completed_with_failures` is a legitimate state: a step failed, the run
recovered and finished with something useful. A loop that never had a failed step would be a loop
doing nothing hard.

**What it does establish is the ratio nobody had:** 166 runs and 7.1M tokens produced **31 durable
artifacts**, about **229,000 tokens per artifact**, and **six of the fifteen tracks touched produced
nothing that lands on a record at all**.

That is the founder's own test, measured: *the work agents do made visible on screen rather than
implied*. The runs are visible — their output renders on the run screen. **What is scarcer is work
that becomes an artifact the next station can read**, and that is the difference between a loop and a
transcript.

## Why the ratio is the number to keep

`spine_track_members` is what the next station reads. A run whose output exists only in
`agent_runs.output` is visible to a person watching, and invisible to the loop. The loop's own briefs
say this in their filing lines, in almost these words: *"Evidence that is only in your answer is not
on the record and the next station cannot read it."*

**So 31 artifacts from 166 runs is the loop's own rule, measured against itself.**

## What I am not claiming

- **A 24-hour window during a four-lane build night is not a normal day.** Much of this is lanes
  exercising the product deliberately, and the ratio on a customer's workspace may differ entirely.
- ~~**I did not split by `is_sample`.**~~ **CLOSED, one query later, and it strengthens the finding:**

  ```sql
  SELECT w.is_sample, count(*), round(sum(r.tokens_used)/1000.0)
  FROM agent_runs r LEFT JOIN workspaces w ON w.id = r.workspace_id
  WHERE r.created_at > now() - interval '24 hours' GROUP BY 1;
  -- false | 166 | 7103      (one row: there is no other)
  ```

  **All 166 runs are on REAL workspaces. Zero sample.** So the whole 7.1M tokens, all 68 runs that
  finished with failures, and all 31 artifacts are real work. The split I flagged as missing would
  have been the one thing that could have softened this, and it does the opposite.

  Chased immediately rather than left in the "not claiming" list, because leaving it there is what
  I did three times tonight before somebody else had to ask.
- **`completed_with_failures` is not broken down by what failed.** `failure_kind` is empty on every
  row in the window, so the record does not say.
