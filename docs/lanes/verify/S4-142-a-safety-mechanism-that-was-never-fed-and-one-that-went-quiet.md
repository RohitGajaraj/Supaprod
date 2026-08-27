# S4-142 · Which safety mechanisms have ever had anything to compare against

> _S4, 2026-08-28, measured read-only against the Lovable database
> (`371dd588-1b70-4629-9bb5-9f003f3af373`). Every number carries the query that produced it. This
> answers a question S3 posed and nothing in the repo could answer: **has this mechanism never bound
> because nothing crossed it, or because nothing fed it?**_

## Why the distinction is the whole thing

Three separate mechanisms have been found this week that are **wired and unfed**. Every component
works, every test passes, and a gate with nothing to compare against **reports healthy forever**.

**No test in this repo can catch that class, because there is nothing wrong to catch.** A cap that is
never exceeded and a cap that is never supplied produce the same silence, and the difference between
them is the difference between a guarded workspace and an unguarded one.

## The read

| mechanism | is it FED? | has it ever BOUND? | which silence is it |
| --- | --- | --- | --- |
| `agent_runs.mission_spend_cap_usd` | **2,555 of 2,847** | **never** | nothing crossed it |
| `agent_runs.mission_token_cap` | **0 of 2,847** | cannot | **nothing feeds it** |
| `spine_tracks.spend_cap_usd` | **0 of 106 rows, but FED BY A RESOLVER** | never | nothing crossed it |
| `ai_budgets` (any of 4 caps) | **4 of 14** | — | **10 rows hold no cap at all** |
| `guardrail_rules` | 27 rules, **3 of 21 workspaces** | **no organic hit on record** | **see below** |
| `agent_approvals` | 324 raised | 176 answered | **113 expired unanswered** |

## The spend cap is fed, and it is not a limit

```sql
SELECT max(mission_spend_cap_usd), max(spend_used_usd) FROM agent_runs;
```

| | |
| --- | --- |
| the cap | **$10.00** |
| most ever spent on one run | **$0.1420** |
| **percentage of the cap ever reached** | **1.42%** |
| runs that hit the cap | **0** |
| runs that reached even HALF of it | **0** |

**Spend would have to rise seventy-fold before this cap did anything.** It is fed, it is compared on
every call, and it has never been within two orders of magnitude of binding. That is not a criticism
of the mechanism — it works — but a `$10` ceiling over a workload whose worst case is 14 cents is a
number nobody has revisited since it was chosen, and it should not be read as evidence that spending
is under control. **Nothing has tested it.**

> ## CORRECTION · a null column is not the same defect twice, and S3 caught me flattening it
>
> **I listed `spine_tracks.spend_cap_usd` as "never fed" beside `mission_token_cap`. They are not the
> same thing, and the difference is the whole point of this verdict.**
>
> `resolveTrackSpendCap` (`src/lib/spine/track-caps.server.ts`) falls back to
> `workspaces.default_track_spend_cap_usd` — **$5.00 on all 21 workspaces** — and then to
> `DEFAULT_TRACK_SPEND_CAP_USD = 5.0` if the read fails. **A null column there is fed by the
> resolver.** I verified the fallback in the source rather than taking it on report.
>
> That fallback is itself a repair: it used to return null on an unset workspace column, on the
> reasoning that a cleared ceiling was a human decision, until somebody measured it null in all 21
> workspaces with no surface anywhere that could clear it. Migration `20260824230000` backfilled it
> and inverted the branch.
>
> **So the class has two halves that look identical in a column dump:**
>
> | shape | reads as | actually |
> | --- | --- | --- |
> | null column **with** a resolver fallback | unfed | **fed by the default** |
> | null column with **no** resolver | unfed | **genuinely never fed** |
>
> **`mission_token_cap` is the second, and it is unfed three ways at once**: no default constant, no
> resolver, no caller. I checked for all three rather than repeat the mistake in the other direction —
> the only non-type references in `src/` are the comparison at `runtime.server.ts:264`, a display read
> in `ControlsPanel.tsx:836`, and a column list. There is no `DEFAULT_MISSION_TOKEN_*` anywhere.
>
> **The alarming half is smaller than I reported and sharper for it.** A dump of null columns is not
> evidence of an unguarded mechanism; a null column with nothing behind it is.

## The token half has never had anything to compare against

**`mission_token_cap` is NULL on all 2,847 rows.** `checkMissionCaps` compares it before every model
call, `executeLoop` accepts and writes it, and **no caller anywhere passes one** (S3, measured today).
The most expensive run used **233,988 tokens** against no ceiling whatsoever.

`spine_tracks.spend_cap_usd` is **0 of 106** too, and is the OTHER half: `S4-127` found it from the
schema side, and the resolver behind it means the tracks are capped at $5.00 regardless.

## The guardrails did not go quiet. They may never have spoken

**I drafted this section saying the guard fired 8,535 times and went silent 33 days ago. That was
wrong, and it is the fourth time this week I have counted planted fixtures as real work.**

```sql
SELECT w.is_sample, count(*), min(h.created_at), max(h.created_at)
FROM guardrail_hits h JOIN workspaces w ON w.id = h.workspace_id GROUP BY 1;
```

| `is_sample` | hits | workspaces | span |
| --- | --- | --- | --- |
| **true** | **7,225** | 7 | 2026-06-28 → 2026-07-23 |
| false | **1,310** | 3 | 2026-06-04 → 2026-07-25 |

**85% are demo fixtures**, and they carry the fingerprint openly: the oldest and newest sample rows
share the microsecond `08:22:40.532032` **a month apart**, which is one INSERT with computed dates.
`supabase/migrations/20260725130000_helio_demo_seed_rich.sql:1479` inserts them under the comment
*"guardrail_hits, proof the rules actually fire"*, and `..._clone_helio_to_investor_workspaces.sql`
copies them into the investor workspaces.

**And the 1,310 on real workspaces do not look organic either:**

| | |
| --- | --- |
| rows | 1,310 |
| **distinct timestamps** | **83** |
| most rows sharing one instant | **24** |
| **distinct rules across those 24 rows** | **1** |

I checked the obvious innocent explanation first, because the write path is
`supabase.from("guardrail_hits").insert(` with an **array** — one screening event that matches many
rules writes many rows at one instant, which would look exactly like this.

**It is not that.** Every one of those 24 rows carries the **same `rule_id`**. A screening event that
matched one rule writes one row, not twenty-four. Twenty-four rows of a single rule at a single
microsecond is a bulk write.

> **So `guardrail_hits` contains no demonstrated organic screening event, on any workspace.** The
> 8,535 figure cannot be cited as evidence that the guard works, and neither can the 1,310.

**What this does NOT prove:** that screening never happens. S0 established that `callModel` screens
unless told not to and the loop never tells it not to, so the comparison may well run on every call
and simply record nothing when nothing matches. **Absence of hits is not absence of screening.** But
it does mean the table cannot be used as proof in either direction, and the "33-day silence" I was
about to report is an artifact of when somebody last ran a seed.

**The 439 runs under live rules in the last 30 days remain the real question**, and they now have a
sharper form: 439 runs, rules present, and **not one row written by any of them**.

| | |
| --- | --- |
| workspaces holding rules | 3 of 21 |
| of those, ran in the last 30 days | **2** |
| runs in those ruled workspaces, last 30 days | **439** |
| most recent run in a ruled workspace | 2026-08-27 00:40 UTC |
| runs in workspaces with **no rules at all** | **2,131 of 2,570 — 83%** |

## 113 boundary calls expired with nobody answering

| | |
| --- | --- |
| approvals raised | **324** |
| answered by a person | 176 |
| **expired unanswered** | **113 — 35%** |

**More than a third of the moments the machine stopped to ask a person, it eventually gave up.** That
is the cost of gap #2 with a number on it, and it bears directly on R-18: a run that halts on an
unanswered approval is not autonomous and is not blocked by a decision either.

## What I am not claiming

- **Absence of hits is not absence of screening.** `callModel` screens unless told not to, and a
  call that matches no rule correctly writes nothing. What I have shown is that the table cannot
  serve as evidence in either direction, not that the guard is off.
- **A cap nothing has crossed is not necessarily wrong.** `$10` over a 14-cent workload may be a
  deliberate ceiling against a runaway rather than a budget. It is reported as untested, not as
  broken.
- **`ai_budgets` having 10 rows with no cap** may be intentional per surface. I did not check which
  surfaces those are.

## Verdict

- **ONE mechanism is genuinely never fed**: `mission_token_cap`, null on all 2,847 rows, with no
  default, no resolver and no caller. `spine_tracks.spend_cap_usd` looks identical in a column dump
  and is not — a resolver caps it at $5.00.
- **One is fed and has never been within 70x of binding**: the `$10` mission spend cap against a
  worst case of `$0.142`.
- **`guardrail_hits` is fixture data.** 7,225 of 8,535 are on demo workspaces, and the 1,310 on
  real ones sit at 83 instants with up to 24 rows of a SINGLE rule at one microsecond. No organic
  screening event is on record, and 439 runs under live rules in 30 days wrote nothing.
- **113 of 324 boundary calls expired unanswered.**
