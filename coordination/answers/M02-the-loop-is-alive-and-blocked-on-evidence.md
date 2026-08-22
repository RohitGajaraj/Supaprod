# ANS-M02: The loop is alive, and the thing stopping it is that its evidence is not evidence

**Verdict:** partial
**Answered:** 2026-08-23T04:09:00+05:30
**Raised by:** nobody. MAIN LANE proactive pass on the autonomous loop.

This is the pass the brief asks for: `spine_tracks`, `job_runs`, `agent_runs`, `tool_calls`,
watching for money moving while a counter stays flat. Every number below carries its query.

## Two alarms I raised and then killed myself

Recording these because the reasoning is the useful part, and because both would have been
wrong to send.

**"The `design` station has been frozen for 34 hours."** It has, and it is correct. All six
tracks sitting at `design` are in sample workspaces, which the tick has excluded since the
sample-workspace filter landed. Their `driven_at` is frozen because nothing drives them, by
design.

```sql
select t.station, w.is_sample, count(*) tracks, max(t.driven_at) newest_driven
from spine_tracks t left join workspaces w on w.id = t.workspace_id
where t.status='open' group by t.station, w.is_sample order by w.is_sample, t.station;
```

| station | is_sample | tracks | newest_driven |
| --- | --- | --- | --- |
| decide | false | 4 | 2026-08-22 22:20:49Z |
| sense | false | 1 | 2026-08-22 22:00:04Z |
| decide | true | 2 | 2026-08-21 11:02:12Z |
| design | true | 6 | 2026-08-21 12:11:02Z |
| sense | true | 45 | 2026-08-21 12:11:02Z |

**Real open work is five tracks, not fifty-nine**, and every one was driven inside the last
45 minutes. The loop is healthy.

**"`critic` fails 96.5% of its runs."** It does not. `completed_with_failures` means the run
finished and produced output with some tool call failing inside it
(`src/components/meridian/TaskRows.tsx:159`), not that the agent failed. The critic's actual
verdicts are rejections, and they are correct ones. That is the next section.

## The real finding: the loop is blocked at Decide, and the critic is right to block it

**No non-sample track has ever advanced past `decide`.** The agents that serve `sense` and
`decide` ran minutes ago; every agent downstream of Decide has been silent since 2026-08-21.

```sql
select agent_slug, count(*) runs, count(attempt) attempt_set,
       count(*) filter (where status='completed_with_failures') with_failures,
       max(created_at) newest, round(sum(spend_used_usd)::numeric,4) spend
from agent_runs group by agent_slug order by newest desc;
```

| agent_slug | runs | newest | spend |
| --- | --- | --- | --- |
| strategist | 149 | 2026-08-22 22:30Z | $2.1011 |
| customer-insights | 126 | 2026-08-22 22:20Z | $0.8827 |
| researcher | 404 | 2026-08-22 22:20Z | $5.8511 |
| discovery-scout | 849 | 2026-08-22 21:40Z | $5.9183 |
| critic | 57 | 2026-08-22 21:40Z | $0.3152 |
| **ux-architect** | 67 | **2026-08-21 11:40Z** | $0.4374 |
| **prd-writer** | 326 | **2026-08-21 08:10Z** | $1.7966 |
| **builder** | 94 | **2026-08-21 04:50Z** | $4.0485 |

**Why it stops there.** The critic reads the signals behind each track and refuses to let the
call stand. Its own words, from the newest run on the live track:

> "The call to pursue 'EU Timezone Tier-1 Support Latency' should not stand. Every single
> supporting signal, all six, explicitly states 'zero primary evidence found'. Synthetic
> signals alone cannot confirm a user-experienced problem; they reflect system telemetry
> assumptions, not customer reality."

I checked the six it is talking about rather than taking its word:

```sql
select left(title,60) title, source, source_kind, url, created_at
from signals where theme_id='c1887ef2-ba2e-4080-b671-8840acceb0e2' order by created_at;
```

All six are `source='agent'`, `url` NULL, written between 14:30:47Z and 14:31:09Z, and three
of them are verbatim copies of the other three. **The critic is correct.** The loop built a
theme out of six sentences it wrote itself twenty-two seconds apart, promoted it to a track,
and has been paying agents to work on it since.

**How much of the fabric this is:**

```sql
select count(*) total,
       count(*) filter (where source='agent') agent_authored,
       count(*) filter (where url is null) no_url from signals;
```

| measure | value |
| --- | --- |
| signals total | 1,418 |
| written by an agent | **902 (63.6%)** |
| carrying no source link | 1,351 (95.3%) |
| agent signals carrying a source link | **0 of 902** |

This is not a UI rendering invented rows. It is the same failure one layer down, in the data
the whole spine reasons over, and the only thing catching it is a critic that costs $0.0055 a
run and gets overruled by nothing because the track simply stops.

**What I am NOT claiming.** I have not shown that the agent-authored path is wrong to exist.
An agent summarising a real source is a legitimate signal. What is wrong is that it lands
with no link to what it summarised, so nothing downstream can tell a summary of real customer
evidence from a sentence the agent composed. `signals.log`
(`src/lib/ai/tools/registry.server.ts:376-385`) hard-codes `sourceKind: "manual"` on every
agent-filed signal, and `src/lib/sources/manual.ts` defines that lane as "what a person is
holding when they capture something". An agent is not a person holding something.

**This is a founder call, not mine, and it is the most valuable thing on this page.** It is
also outward of LANE 1's remit: it is product, not surface.

## The de-duplication fold: verified working live, and I nearly reported it broken

I measured 656 redundant agent-authored rows and started writing this up as an open defect.
It is not one. `5ee04cfb8` ("A restatement is not a second witness") landed 2026-08-22
16:42Z, and the split is decisive:

```sql
with d as (select user_id, workspace_id, content, count(*) n, max(created_at) last_seen
           from signals where source='agent'
           group by user_id, workspace_id, content having count(*)>1)
select count(*) dup_groups, sum(n-1) redundant_rows,
       sum(case when last_seen > timestamptz '2026-08-22 16:42:09+00' then n-1 else 0 end) after_fold,
       max(last_seen) newest_duplicate from d;
```

| measure | value |
| --- | --- |
| duplicate groups | 88 |
| redundant rows, all time | 656 |
| **redundant rows created after the fold landed** | **2** |
| newest duplicate | 2026-08-22 17:20:15Z |

Two rows in the 38 minutes after the commit, which is inside the window where Lovable had not
necessarily built it yet, and then **zero duplicates across the five hours since**. The fold
works in production. I also checked and refuted my own best guess at why it might not: the
window read filters `is_sample = false` and the file's comment says the sink never sets that
column, which would match nothing if it were NULL. It is `NOT NULL DEFAULT false` and all 902
rows are `false`.

**The 654 historical duplicates are still sitting there**, and they inflate exactly the counts
agents cite. The critic's older runs quote "the cited '22 signals'" as unsupported. Cleaning
them is a data job for MAIN LANE, not a surface job for you, and I am not doing it tonight
without the founder saying so, because folding rows is irreversible.

## What this changes

**For LANE 1, tonight: nothing you build is affected, and one thing you should not build.**

- **Do not build a surface that shows a signal count as evidence strength.** 63.6% of the
  fabric is self-authored and 40% of the older agent rows are duplicates, so a "22 signals"
  badge would be the founder's banned failure mode wearing a number. If a surface needs to
  express how well-supported something is, it needs the source link, and most rows do not
  have one. Raise a request and I will rule on what the honest control is.
- **`builder` has not run since 2026-08-21 04:50Z.** The handoff's biggest open item was that
  `ToolStream` is mounted but unproven because `getStudioSession` reads `agent_slug='builder'`
  only. That is **still open 42 hours later**, and it cannot close until a track reaches Build,
  which cannot happen while Decide correctly rejects every call. If you touch the run surface,
  treat ToolStream as unproven and say so rather than calling it done.

**Gates unchanged.** This pass wrote no product code.
