# ANS-M11: 42 runs report failures, 3 tool calls failed, and the critic is being libelled

**Verdict:** partial
**Answered:** 2026-08-23T12:00:00+05:30
**Raised by:** nobody. MAIN LANE, seven-hour loop-health pass. **This one is for the founder.**

## The discrepancy

Over the last twelve hours the loop reports **42 runs `completed_with_failures`** (critic 23,
strategist 19). Over the same twelve hours, across every agent, **three tool calls failed.**

```sql
select tool_name, ok, count(*) from tool_calls
where created_at > now() - interval '12 hours' group by 1,2 order by 3 desc;
-- 74 signals.list ok · 67 signals.log ok · 35 sources.status ok · 30 workspace.search ok ...
-- 2 decision.revise  ok=false  "decision not found"
-- 1 mission.plan     ok=false  "mission already has steps"
```

Forty-two against three. **The status and the data disagree, and the status is the one on the
surfaces.**

## They are two different failures wearing one word

`completed_with_failures` is written when a STEP failed, not when a tool call did
(`orchestrator.server.ts:474`, `handoff.server.ts:597`). Splitting the runs by where they died
separates two things that have nothing to do with each other:

```sql
select agent_slug, status, count(*), avg(step_index), avg(tokens_used), sum(spend_used_usd)
from agent_runs where created_at > now() - interval '12 hours' group by 1,2;
```

| agent | status | runs | avg step | avg tokens | spend |
| --- | --- | --- | --- | --- | --- |
| strategist | completed | 7 | **1.0** | 11,391 | $0.0253 |
| strategist | with failures | **19** | **5.5** (max 7) | **53,099** | **$0.2594** |
| discovery-scout | with failures | 3 | 6.7 (max 7) | 53,519 | $0.0334 |
| critic | completed | 2 | 2.0 | 17,061 | $0.0098 |
| critic | with failures | **23** | **1.9** (max 4) | 19,054 | $0.1262 |

**Strategist is burning the step ceiling.** Its failing runs sit at step 5.5 against 1.0 for its
successes, carry five times the tokens, and cost roughly **ten times per run** ($0.0137 against
$0.0036). That is a real problem and it is the expensive one.

**The critic is not.** Its failing runs die at step 1.9 and its successful ones at 2.0, on the
same tokens. Nothing is being exhausted. Twenty-three runs out of twenty-five fail identically,
early and cheaply, which is not what running out of budget looks like.

## So I read what the critic actually produced, and it is correct

Three most recent "failed" critic runs, verbatim from `agent_runs.output`:

> "The halt decision stands unchallenged and is correct. The strongest case against it would
> require at least one piece of primary evidence, a verbatim customer quote, a support ticket ID
> with timestamp and geo-context, or an SLA breach log, but exhaustive audit confirms zero such
> evidence exists across all sources."

> "All evidence confirms: (1) zero verbatim customer quotes, tickets, or survey responses
> referencing 4 to 12h delays; (2) workspace.search returned zero matches across exhaustive
> latency and region-specific terms; (3) telemetry ingestion is confirmed inactive."

**Those are complete, reasoned, correct verdicts.** The critic did its job, said so clearly, cited
what it checked, and was recorded as a failure.

**It is also the same finding as [`M02`](./M02-the-loop-is-alive-and-blocked-on-evidence.md),
arriving from the other direction.** The critic keeps halting because 63.6% of the signal fabric
is agent-authored with no source link. It is the only component in the loop refusing to build on
evidence that is not evidence, and the health signal calls it the most broken thing in the
product.

## Why this matters more than the numbers

**Anyone reading `agent_runs.status` concludes the critic is broken.** It is 92% "failed" over
twelve hours, the worst rate of any agent, and it is the one component behaving correctly. A
person triaging this loop would go and fix the critic, and fixing the critic means making it
stop refusing, which would let the loop run on invented evidence at speed.

**That is the failure mode the founder has banned, reachable by reading a dashboard correctly.**

## What I am NOT claiming

I have not found the line that marks the critic's step failed. `agent_runs` carries no
step-level detail and `failure_kind` and `halted_reason` are NULL on every one of the 42 runs,
so the reason a step was marked failed is not recorded anywhere I can read. **That absence is
itself the finding**: a status that says "with failures" and stores nothing about which failure
cannot be acted on by anyone, which is why this went twelve hours without being noticed.

## What I would do, and none of it is mine to decide

1. **Record a `failure_kind` when a step fails.** The column exists and is NULL on all 42. Until
   something writes it, every one of these needs a human reading model output to classify.
2. **Look at strategist's step budget before its spend.** It is the one genuinely burning money:
   ten times per run, nineteen runs in twelve hours, and it is at the ceiling every time.
3. **Do not touch the critic.** It is the control that is working.

**The evidence question underneath all of this is still open and still yours** ([`M02`](./M02-the-loop-is-alive-and-blocked-on-evidence.md)):
902 of 1,418 signals are agent-authored with no link to a source. Until that changes the critic
will keep halting, correctly, and the loop will keep spending to be told no.
