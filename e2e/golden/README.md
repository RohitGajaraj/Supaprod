# The golden set — gap #24

> _Built by S4, 2026-08-31. **It is empty, and that is the finding rather than a gap in the work.**_

## What this is

The AI-native SDLC playbook's third principle is *trust, but verify*, and its mechanic is a golden
set: **verified pairs a change is tested against, so a fix is checked against the records that
already failed** rather than proved by hand one at a time.

`RANKED-BACKLOG.md` #24 puts it here and `QUEUE-S4.md` states the rule that shaped this directory:

> *"Build it from real graded runs — **a golden set built from a broken pipeline encodes the
> breakage.**"* … *"**no case is seeded** — and if that leaves the set nearly empty, **the set says
> nearly empty** (standard #7)."*

**So the admission test came first and the cases came second. There are none.**

## The admission test

A run is admitted as a case only if **all four** hold. Each is a column, not a judgement:

| # | test | why it is not negotiable |
| --- | --- | --- |
| 1 | the workspace is **not** `is_sample` | 133 of 135 `learnings` and 89 of 161 `agent_messages` are on sample workspaces. A set seeded from them measures the seed. |
| 2 | `forecast_resolution IS NOT NULL` | an ungraded forecast has no answer to check a change against. |
| 3 | `forecast_resolved_by_agent_slug IS NOT NULL` | **a human verdict is a fine outcome and a useless test case.** The thing under test is whether the loop grades correctly, so a case graded by a person cannot exercise it. |
| 4 | `forecast_resolved_at` is **not a date literal** — it must carry a real time of day | a backfill writes `00:00:00+00`. A grader firing at a horizon does not. |

**Test 4 is the one that turned this directory into a finding**, and it is the same instrument that
found 98 planted `learning_citations` sharing one microsecond suffix and 7,225 planted
`guardrail_hits` sharing a microsecond a month apart.

## What the database holds today, measured 2026-08-31

```sql
-- every forecast, and how far it gets through the four tests
SELECT count(*) FROM decisions WHERE forecast_claim IS NOT NULL;                    -- 192
SELECT count(*) FROM decisions WHERE forecast_resolution IS NOT NULL;               --  91
-- test 1: drop the sample workspaces
SELECT count(*) FROM decisions d JOIN workspaces w ON w.id = d.workspace_id
 WHERE d.forecast_resolution IS NOT NULL AND NOT w.is_sample;                       --  12
-- test 3: graded by an agent
   ... AND d.forecast_resolved_by_agent_slug IS NOT NULL;                           --   0
```

| gate | surviving |
| --- | --- |
| forecasts recorded | **192** |
| …resolved at all | **91** |
| …on a real workspace | **12** |
| …**graded by an agent** | **0** |
| …**with a real resolution time** | **0** |

**All twelve real resolutions carry `forecast_resolved_at = <date> 00:00:00+00`.** Midnight UTC,
zero minutes, zero seconds, **zero microseconds, twelve times out of twelve.** That is a date
literal written by a backfill, not a timestamp from a grader.

**So the set is empty, and it is empty twice over: nothing was graded by an agent, and nothing carries
a resolution time a clock produced.**

## What that means, stated so it cannot be read as worse than it is

**This is not a claim that the forecast machinery is broken.** 192 forecasts have been *recorded*,
which is the half of the moat the vendor's own playbook leaves empty (`SPEC-AI-NATIVE-SDLC.md` §5).
Capturing the prediction works.

**It is a claim that nothing has ever been graded by the loop**, so there is no verified pair to test
a change against, and there will be none until a forecast reaches its horizon and an agent resolves
it. The nearest real one is due **2026-09-07**, on `d2263583` — corrected 2026-09-01, having first repeated S0's 2026-10-15. That track carries **fourteen** unresolved forecasts across four different horizons for substantially one claim, and 09-07 is the earliest.

**Do not fill this directory by lowering a test.** Every one of the four exists because a specific
number in this repository turned out to be seed data when somebody checked. An empty golden set that
says why is worth more than a full one that encodes the breakage, which is the queue's instruction and
the reason this file exists at all.

## Running it

```bash
bun run check:golden-set      # prints the funnel, admits what qualifies, refuses to pass vacuously
```

It **reports** rather than blocks. It exits non-zero only if the admission test itself is broken —
if it scanned nothing, or if a case were admitted that fails one of the four.
