# Adversarial review — six lenses against the platform

> _Created: 2026-08-22 · Last updated: 2026-08-22_

> **Status: REVIEW, not direction.** This is a hostile read of the platform design, the two architecture
> documents written today, and the product as it actually stands in production on 2026-08-22. It is
> deliberately one-sided. Where the product is strong it gets one line and no more, because a review that
> praises everything is worth nothing. The design documents this argues with are
> [`agent-first-platform.md`](./agent-first-platform.md), [`../../../architecture/station-journeys.md`](../../../architecture/station-journeys.md)
> and [`../../../architecture/agent-to-agent.md`](../../../architecture/agent-to-agent.md), and all three are
> better than what they describe. That gap is the subject.

**Every claim below carries a `file:line` or a query that was run against production today.** Demo and real
are split on `workspaces.is_sample` everywhere. Where a query contradicted the brief I was given, the query
wins and the correction is recorded in §11.

---

## 0. The one-sentence finding

**Between 14:00 and 15:20 UTC today the product spent its entire monthly credit grant, in eighty minutes, on
thirty-three agent runs whose collective output was the crew reporting that the evidence it was reasoning
from had been written by itself twenty minutes earlier — and then it stopped, out of money, with three of
its four tracks still standing at station 01.**

Everything in this review is a consequence of that sentence or a reason it was allowed to happen.

---

## 1. The three that would kill the company

Ranked by lethality, not by cost to fix.

### 1.1 The economics do not survive the product working

This is first because it is the only finding here that is fatal even if every other line is fixed.

```sql
SELECT w.id, a.balance_credits, a.monthly_grant_credits, a.topup_credits, a.overage_enabled, a.cycle_anchor
FROM workspaces w JOIN account_credits a ON a.account_id = w.account_id
WHERE w.id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4';
-- balance 7 | grant 750 | topup 0 | overage false | cycle_anchor 2026-08-22 02:20:02+00
```

```sql
SELECT reason, count(*), sum(delta_credits), min(created_at), max(created_at)
FROM credit_ledger WHERE account_id='164e0692-71e4-4f53-b5e5-66aa930a672f' AND created_at >= '2026-08-22'
GROUP BY 1;
-- debit | 139 entries | -743 credits | 14:00:09 | 15:20:18
```

The cycle reset at 02:20 today. **743 of 750 credits were consumed in eighty minutes**, across 139 debits.
Since 15:20 every tick produces a `failed` run carrying the string
`"Account credit balance (7) is below the projected cost (13)."` — eleven of today's thirty-three real runs
are that, and three of the four real tracks now hold `last_hold: 'out-of-credit'`.

`FREE_MONTHLY_CREDITS = 750` (`src/lib/entitlements.ts:119`) and its comment states the intent plainly:
*"a new account must be able to run the whole first loop while exploring without the meter cutting it short."*
**Measured today, the grant bought eighty minutes and the loop did not leave station 01 on three of four
tracks.** That is not a tuning miss; the founder ruling's own success condition was tested for the first time
today and failed.

Scale it against the price list. `CREDIT_COGS_USD = 0.0002` (`src/lib/ai/pricing.ts:178`), so 750 credits is
about **fifteen cents of inference**. At the observed 9.3 credits/minute, a continuously running loop consumes
roughly **400,000 credits a month**. The largest publicly purchasable band is **10,000**
(`CREDIT_DROPDOWN_TIERS`, `src/lib/entitlements.ts:53`) — **about eighteen hours of the loop, per month, at
the top of the ladder.** And that was one workspace holding 23 signals and 4 tracks, none of which reached
Design, Build, Ship or Learn. A customer with a live Intercom would be an order of magnitude heavier.

The pricing architecture was designed for a product where agents mostly do not run. The whole claim is that
they do. **Those two facts have never been in the same room until today.**

Two aggravating details:
- `LOW_CREDITS_WARN = 100` (`src/lib/entitlements.ts:125`), described in its own comment as *"a quiet
  running-low notice … subtle, never a blocker."* At today's burn rate that notice fires **eleven minutes**
  before the loop dies, and it renders in `BillingBanner` — a browser surface, for a loop whose entire promise
  is that it runs when nobody is watching.
- The refusal is recorded as `failure_kind: 'model_error'`. A billing state is being written into the field
  every quality metric reads. An operator looking at today sees eleven model failures; the truth is one empty
  wallet.

**Why this is first:** every other finding is a bug. This one is the business model meeting the product for
the first time, in production, and losing.

### 1.2 The autonomous director's evidence bar is defeated by repetition, and the only writer feeding it is the product itself

The theme that opened a track and caused the spend:

```sql
SELECT id, title, frequency, severity, confidence,
       (SELECT count(*) FROM signals s WHERE s.theme_id = t.id) AS attached
FROM themes t WHERE t.id = 'c1887ef2-ba2e-4080-b671-8840acceb0e2';
-- EU Timezone Tier-1 Support Latency | freq 6 | sev 5 | conf 0.95 | attached 6
```

```sql
SELECT left(title,58) AS title, tags, source, source_kind, created_at
FROM signals WHERE theme_id='c1887ef2-ba2e-4080-b671-8840acceb0e2' ORDER BY created_at;
```

All six are `source: agent`, `source_kind: manual`, tagged `src:agent`, and written between **14:30:47 and
14:31:09** — twenty-two seconds. Three carry the identical title *"Users, particularly those in EU timezones,
experience signif…"*; two more carry the identical title *"Users in EU regions face critical delays of up to 12
hours f…"*. **The "frequency 6" that cleared the promotion bar is one sentence, restated six times, by the
crew, to itself.**

The mechanism is exact and it is not a bug in any one place:

1. `signals.log` (`src/lib/ai/tools/registry.server.ts:296`) writes through the sink, which is the repair that
   shipped on 2026-08-21 and is correct as far as it goes.
2. The sink's dedup lives in `prepareSignalRows` and keys on **`external_id` only** —
   `if (c.externalId && seen.has(c.externalId))`, `src/lib/sources/prepare.ts:52`.
3. `signals.log` supplies **no `externalId`** (`registry.server.ts:373-384`). So agent-written signals are
   never deduped, by construction. Six restatements are six rows.
4. `themes.frequency` **is** the member count (`registry.server.ts:503`, verified against the query above), and
   the promotion bar is a threshold on it (`DEFAULT_PROMOTION_BAR`, `src/lib/spine/promote.ts:79-87`).
5. `coldStartBarFor` (`src/lib/autonomy-policy.ts:248-256`) lowers that threshold further on small corpora,
   which is the change that let today happen.

**So the only guard between a model's fluency and the product spending money is a count of rows the model
itself can emit at will.** The cold-start bar was built to help a workspace with little evidence; its actual
effect is to make the product cheapest to fool exactly where it is most eager to act.

And the corpus is entirely self-generated. Every signal written today on a real workspace:

```sql
SELECT s.source, s.source_kind, count(*) FILTER (WHERE s.created_at::date='2026-08-22') AS today, max(s.created_at)
FROM signals s JOIN workspaces w ON w.id=s.workspace_id WHERE w.is_sample=false GROUP BY 1,2;
-- agent | manual | 17 | 2026-08-22 15:10:35
-- github | pull_connector | 0 | 2026-07-09    <- last connector signal, 44 days ago
```

Five connections exist in the entire product, all the founder's, none verified since 2026-07-25
(`SELECT provider, status, max(last_verified_at) FROM connections GROUP BY 1,2`). Layer 01 — the director that
*"reads your signals, your product data, your competitors"* ([`../../../README.md`](../../../README.md)) — has
read nothing from a customer source in six weeks.

**The honest headline for today is not "the loop ran on real customer data."** There is no customer data in
it. The loop ran on its own output, and the strongest evidence for that is the crew's own words, quoted in the
next finding.

### 1.3 A tool that cannot express the question returns an empty answer, and the agent reports it as a fact about the customer

This is the class the session already named as its top open item, and it recurred **the same day, after the
fix, through a different mechanism**. That is what makes it a class rather than an incident.

Today's crew output, verbatim from `agent_runs.output` on the real workspace:

> *"No signals exist in the workspace for 'EU Timezone Tier-1 Support Latency'. The theme is documented (id:
> c1887ef2-…), but no supporting signals were found via signals.list or workspace.search. Therefore, no evidence
> can be logged."*

Six signals are attached to that theme (query in §1.2). The agent is wrong, confidently, in prose a person
reads. In the same hour, on the same theme, `researcher` filed *"found exactly 5 signals"*. **Two agents on one
crew, one workspace, one theme, contradictory counts, and nothing in the system notices.**

The cause is precise: **`signals.list` has no `theme_id` filter.** Its whole argument surface is
`source_kind`, `tag`, `sentiment`, `lookback_days`, `limit` (`src/lib/ai/tools/registry.server.ts:408-426`). An
agent told to gather evidence for a theme cannot ask for that theme's signals. It guesses a tag. Five of the
six rows carry only `src:agent`, so every plausible guess misses.

The tool's own author saw the shape and fixed half of it. `registry.server.ts:446-448` reads:

> *"AN EMPTY WINDOW AND AN EMPTY WORKSPACE ARE DIFFERENT FACTS, and returning a bare [] for both is what let
> this fail silently for weeks."*

The repair that follows re-counts **with the same filters** (`:454-462`), so it distinguishes an empty *time
window* and cannot distinguish an empty *filter*. A wrong tag returns a bare `[]` and the fallback never fires.

Two more of the same class visible today:
- `themes.list` filtered `public.signal_themes`, a table that has never existed, and the agents reported the
  PostgREST error to a user as *"the signal_themes table is missing due to insufficient signal ingestion."* The
  incident is written up in the code itself (`registry.server.ts:486-507`). Fixed.
- Every governed MCP write returns `{status:"quarantined", id:null}` **without throwing**
  (`src/lib/mcp.functions.ts:906`, and five siblings), which `runWriteTool` wraps as `{success:true}` and the
  route audits as `result:'success'`.

**The general statement, which no document in the repo makes yet:** the agent layer has no typed distinction
between *"the system failed"*, *"you have no data"* and *"I asked the wrong question"*. All three arrive as an
empty array or an error string, the model resolves the ambiguity by writing a sentence, and the sentence it
prefers is the one that blames the customer's setup. In a product whose entire sale is that you can trust
what the agents tell you, this is the trust-ending defect, and it is architectural rather than incidental.

---

## 2. Lens 1 — Product

**Strong, in one line:** the diagnosis in [`../../../README.md`](../../../README.md) — that building has a fast
oracle and deciding does not — is correct, unusually well-evidenced, and is the reason this is worth reviewing
hostilely at all.

### 2.1 The moat has never existed on a real tenant, and the door it is required at is the one nobody walks through

```sql
SELECT w.is_sample, count(*) AS decisions,
       count(*) FILTER (WHERE d.forecast_claim IS NOT NULL) AS with_forecast,
       count(*) FILTER (WHERE d.forecast_resolution IS NOT NULL) AS resolved,
       count(*) FILTER (WHERE d.source_kind='mcp') AS via_mcp
FROM decisions d JOIN workspaces w ON w.id=d.workspace_id GROUP BY 1;
-- real | 60  | 0   | 0  | 0
-- demo | 235 | 146 | 91 | 0
```

**0 of 60.** Every forecast and every resolution in the product is seed data. (The brief for this review said
131 real decisions; the live count is 60, because a workspace flipped to `is_sample` since — `ws_sample` is now
12 of 21, not 11. The claim is unchanged and the number is smaller.)

The design is inverted in a way that guarantees this outcome. Three doors write `decisions`:

| Door | Requires a forecast | Real rows written |
| --- | --- | --- |
| Internal agent, `decision.record` (`src/lib/ai/tools/registry.server.ts:3711`, `FORECAST_REQUIRED` at `:3700`) | **yes**, all three parts | 0 |
| External agent, `record_decision` (`src/lib/mcp.functions.ts:828-857`) | **yes**, all six fields | **0** (`source_kind='mcp'` = 0) |
| **Person, `createDecision`** (`src/lib/decisions.functions.ts:236-278`) | **no** — `title` only | **60** |

**The forecast is mandatory on the two paths that have never been used and optional on the only path anyone
walks.** [`station-journeys.md`](../../../architecture/station-journeys.md) §4 names this inversion; what it
does not say is the consequence: the moat is not half-built, it is **structurally impossible to accumulate**
under the current door assignment, and no amount of agent work changes that, because agents are not writing
decisions on real tenants at all.

### 2.2 The clever repair does not produce the asset it claims

[`agent-first-platform.md`](./agent-first-platform.md) §3.4 is the best idea in the document — make the plan
gate's autonomy dial itself the forecast, so it is captured as a by-product rather than typed into a form. It
then concedes, in the same section: *"The dial answers how confident are we. It does not answer what do we
expect to happen or how will we know."*

That concession is larger than it reads. **A choice about how much rope a run gets is a belief about the
executor, not a claim about the world.** Grading it tells you whether you calibrate your agents well — a real
and useful metric — but it cannot be scored against a business outcome, cannot re-rank an opportunity, and is
not *"what a team believed would happen"*. So §3.4 makes one leg free and leaves the two load-bearing legs as
form fields, and form fields are precisely what 0 of 60 measures.

### 2.3 The market read's own negative result reads better as disconfirmation than as whitespace

[`../../research/market-validation-2026-08.md`](../../research/market-validation-2026-08.md):173 records, after
repeated searching, that **no company was found doing forecast capture at decision time, funded or unfunded.**
That is treated throughout as whitespace. It is equally consistent with *nobody wants it*, and the file itself
supplies the mechanism: Cowgill & Zitzewitz's corporate prediction markets beat expert forecasts and died
anyway, and a Waymo VP is quoted saying the transparency *"was counter to his division's goal."* The canon
uses that finding to reorder the pitch. It never treats it as evidence about demand, which is the reading it
most supports.

The same file's dismissal of the experimentation platforms is the one place its reasoning is thin:
*"Statsig and Eppo measure outcomes with no recorded prior belief."* Every experiment on those platforms
requires a primary metric and a minimum detectable effect declared **before** the test runs. That is a claim,
a measure, and a horizon — the three fields `decisions` carries — timestamped, immutable, and already joined
to the result. Eppo went to Datadog for $220M; Statsig went to OpenAI for ~$1.1B and its team now builds
*"the product development system used by every OpenAI team"* (same file, :57 and :61). **The forecast-at-decision-time
asset is not unowned. It is owned by two acquirers who got it as a side effect of a control the customer
cannot skip.**

### 2.4 The wedge cannot self-serve, and the free entry point was deleted twelve hours ago

`/p/teardown` — the zero-signup paste-a-PRD wedge — became a permanent redirect to `/demo` today
(`src/routes/p.teardown.tsx:1-27`, founder ruling). `runPublicTeardown` (`src/lib/ai/public-teardown.server.ts:127`)
now has **zero callers** and the module header still points at `src/routes/api/public/teardown.ts`, which does
not exist. [`agent-to-agent.md`](../../../architecture/agent-to-agent.md) §1, written today, documents that
route as live.

What remains for a stranger is `/demo`, a seeded sample workspace — and per
[`../../operations/demo-credentials.md`](../../operations/demo-credentials.md), **no programme reviewer has ever
signed into any demo login.** The whole population is:

```sql
SELECT count(*) total, count(*) FILTER (WHERE last_sign_in_at IS NOT NULL) ever,
       count(*) FILTER (WHERE last_sign_in_at > now() - interval '30 days') active_30d FROM auth.users;
-- 16 | 11 | 5
```

Sixteen accounts, five active in thirty days, **nine real workspaces each with exactly one member**
(`workspace_members` grouped by workspace, `is_sample = false`). The product has never been used by a team.

---

## 3. Lens 2 — Design and UX

**Strong, in one line:** the empty-state and error copy is the best-written text in the product — *"Nothing has
been settled and nothing has been lost"* (`src/routes/_authenticated.approvals.tsx:591-593`) is what every
error message should read like.

### 3.1 The rail collapsed to four and the screen did not

The rail is genuinely Today · Runs · Brain · Guardrails (`src/components/shell/AppFrame.tsx:317-377`). But the
same screen also renders the seven-stage strip in `mode:"nav"` (`AppFrame.tsx:1635-1640`, chips navigate at
`:1680`) and four foot controls (`:1909-2024`). **A person meets eleven top-level destinations, not four.** The
keyboard reaches thirteen (`PRIMARY_NAV` + `FOOTER_NAV`, `src/lib/nav-model.ts:120-249`, `:395-410`). Slice 7 is
recorded as shipped; what shipped is a smaller rail over the same information architecture.

Underneath: **48 of 84 authenticated route files are pure redirects.** Twelve former destinations
(`analytics`, `budgets`, `evals`, `drift`, `traces`, `prompts`, `swarm`, `guardrails`, `observe`, `govern`,
`trust-ledger`, `track-record`) now resolve to four `?room=` values on one page, and `trust-ledger` takes two
hops to get there (`_authenticated.trust-ledger.tsx:24-25` → `/track-record` → `/engine-room`). The product has
been renamed under its users at least three times. That is a real cost paid by nobody who is currently
counting it, because there are five active users.

### 3.2 Thirteen invented nouns before anything happens, and twenty-nine named things in total

Distinct domain nouns in user-visible copy: **run, brain, guardrail, crew, signal, bet, opportunity, verdict,
mission, autonomy, forecast, scaffold, ARD/Outcome Contract** — thirteen, each with a `file:line` (e.g. bet at
`_authenticated.decide.tsx:745`, verdict at `_authenticated.learn.tsx:575`, scaffold at
`src/components/runs/stages/StagePanel.tsx:576`, Outcome Contract at
`src/components/product/OutcomeContractPanel.tsx:430`). Add the 7 station names, 5 Brain tabs
(`_authenticated.brain.tsx:502-512`), 4 Guardrails rooms (`_authenticated.engine-room.tsx:149`) and the total
a new user must hold is **29**.

The discipline is real where it was applied — `theme` is suppressed in favour of *cluster*, with the ruling
written into the file (`src/components/discover/DiscoverSurface.tsx:1638-1642`) — which makes the other twelve
look like omissions rather than decisions. And `Opportunity`, `Mission` and `Bet` are three words for
overlapping objects on adjacent screens.

### 3.3 Day one is four empty lanes and a labelled fabrication

`/today` with a workspace and no data renders: *"Nothing went live."* (`:946`), *"Nothing is waiting on you."*
(`:1048`), *"Nothing stopped."* (`:1110`), *"No agent is working."* (`:1172`). Then `QuietMorning` renders a
mock approval — tag **"Example"**, note **"Nothing below is from your workspace."**
(`src/components/today/QuietMorning.tsx:30-31`) — with printed keycaps that are not pressable, as its own
header admits (`:18-24`).

**The landing screen's answer to an empty product is a picture of a different product, with a disclaimer.**
That is more honest than faking it and worse than solving it.

The exit chain is five hops long. Brain's empty state is a ninety-word paragraph that narrates the entire loop
(`_authenticated.brain.tsx:1479-1503`) and ends with the only **"Capture a signal"** button — which is on
Brain, one hop from Discover, where a person actually needs it. Discover's own zero state,
*"Your sources have sent nothing yet."* (`DiscoverSurface.tsx:1670`), is the true entry point of the chain and
**has no call to action at all.**

### 3.4 Onboarding is one question and it seeds fabricated rows into a real tenant

Onboarding is a hard gate (`src/routes/_authenticated.tsx:69-74`) and has two phases — a Critic teardown of one
typed assumption, then results (`src/components/onboarding/ObsidianOnboarding.tsx:254`). It refuses a step
counter on purpose (`:250-253`), which is good.

What it does not do is connect a source. It calls `seedWorkspaceForTrack` unconditionally (`:1259`), which
inserts sample signals and opportunities **into the customer's real workspace**
(`src/lib/onboarding.functions.ts:250-275`). The signal rows carry `is_sample: true`; **the opportunity rows do
not** (`:266-275`). So a real tenant's Decide queue opens containing rows the customer never created and no
column marks as fictional — and every future opportunity count on a real workspace is contaminated at source.

### 3.5 The two approval surfaces disagree about the verbs

`/today`'s `DecisionQueue` offers approve / decline / **snooze** / **send back**
(`src/components/today/DecisionQueue.tsx:204-208`). `/approvals` offers approve / decline only. The Send-back
button navigated to a page with no send-back control for weeks; the defect is recorded in place at
`_authenticated.today.tsx:1293-1298`. And nothing expires: no timer, no default, no auto-approve on either
surface — the oldest item in the record has waited **694 hours** ([`agent-first-platform.md`](./agent-first-platform.md) §10).

---

## 4. Lens 3 — AI and agent architecture

**Strong, in one line:** the maker→reader pairing at every write station, argued from MAST's 21.30% task-verification
failure rate ([`agent-first-platform.md`](./agent-first-platform.md) §1.8), is the correct architecture and the
correction that overturned the merge instinct is the best reasoning in the corpus.

### 4.1 The agents guess argument names because the product turned off structured tool calling

`describeToolsForPrompt` (`src/lib/ai/tools/registry.server.ts:5085`) hands the model tool **names and prose,
no schemas**, deliberately. The native path exists and is gated on `AGENT_NATIVE_TOOLCALLING`
(`src/lib/ai/loop.server.ts:116`, applied at `:1232` and `:1244`), which is blank in `.env.example`.

The measured consequence is on the board: `signals.log` is sent `text`/`tag`/`source_kind` where the schema
wants `content`/`tags`/`source` — 6 steps across 3 of the 13 real runs and 109 steps across 88 demo runs
([`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md), open findings). **The single largest failure cause
platform-wide is an agent framework declining to use the mechanism built for exactly this.**

The flag is also the riskiest switch in the repo: it changes the wire protocol for every agent, on every
provider, for every tenant, in one flip, with no canary and no per-workspace rollout. That is the reason it is
correctly a founder call — and it is also the reason the answer cannot be "flip it and see", which leaves
rendering the schemas into the prompt as the only cheap fix.

### 4.2 The status word measures tool hygiene and the metric rewards doing less

`anyToolStepFailed(steps)` decides between `completed` and `completed_with_failures`
(`src/lib/ai/loop.server.ts:249`, applied at `:806`). It returns true if **any** tool call errored or was
denied. So a run that made twelve calls, had one denied by policy, and filed a spec is
`completed_with_failures`; a run that made two reads and wrote nothing is `completed`.

The board records the measurement: 7 of 8 real `completed_with_failures` runs filed an artifact, 0 of 5 clean
runs did, and across 508 runs the split is **75.1% against 54.2%** ([`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md);
commit `0f5c1bc26`). Criterion 9's target of *">70% clean"* is therefore satisfied by runs that do less.

I could **not** independently reproduce the 75.1/54.2 split: the reproduction needs
`agent_run_checkpoints.state`, and that table is 132 MB over 7,550 rows, so every query that unnests it times
out through the MCP. The directional claim is confirmed by the code path and by today's run mix (243
`completed_with_failures` against 287 `completed` since 2026-08-08); the exact split is on the record and not
re-verified here.

### 4.3 The crew reads the workspace through one member's slice

Twenty call sites in the tool registry filter `.eq("user_id", userId)`. Twelve of them are tools the
autonomous crew uses to see the workspace:

`signals.list` (`:434`, `:458`) · `themes.list` (`:515`) · `sources.status` (`:539`) ·
`workspace.list_tasks` (`:220`) · `tasks.update_status` (`:289`) · `research.synthesize` (`:3111`, `:3195`) ·
`prd.draft` (`:3331`) · `prd.revise` (`:3539`, `:3573`) · `prd.link_issue` (`:3064`) · `roadmap.move` (`:4506`,
`:4546`) · `backlog.prioritize` (`:4590`) · `memory.promote` (`:747`).

The `userId` an autonomous run carries is `spine_tracks.user_id` (`src/lib/spine/driver.server.ts:1235`), and
the tick runs service-role (`track-tick.ts` imports `supabaseAdmin`), so **the application filter is the only
scope — RLS is not the guard here.**

In a two-person workspace the Discover crew driving Alice's track cannot see Bob's signals, cannot re-rank
Bob's backlog, and cannot read Bob's spec. The enterprise claim in
[`../../../README.md`](../../../README.md) is the exact opposite: *"When a product manager leaves, the next
person inherits it."* The record does; **the crew does not.**

This is invisible in production because all nine real workspaces have exactly one member. It is a defect the
current population is structurally incapable of detecting, and it lands the first day a customer invites a
colleague.

> I checked whether this caused §1.3's false "no signals exist" and it did **not** — signals, theme, track and
> runs all carry the same `user_id` on that workspace. The two findings are independent and the cause there is
> the missing `theme_id` filter. Recorded because building an argument on the wrong cause is the failure this
> review is supposed to catch.

### 4.4 Recovery re-does work it already paid for

`TICK_DEADLINE_MS = 45_000` (`src/lib/spine/track-caps.server.ts:158`), checked **between seats** only
(`src/lib/spine/driver.server.ts:1207`). When it trips, the meter is persisted (`:1315-1318`) and the track is
held `out-of-time` (`:1325-1329`).

There is no persisted seat index. The next tick recomputes `stationCrew(station)` from seat zero
(`driver.server.ts:1136`), and the file says why: *"The alternative, a seat index persisted on the track,
needed a schema column"* (`:1116-1120`). So a station that times out after seat 1 re-dispatches seat 1, spends
again, and files a second copy of the same artifact. Because `out-of-time` deliberately does not count as an
attempt (`:1341-1344`), `MAX_STATION_ATTEMPTS` never stops the cycle either — it converges on `over-budget`
having produced N duplicates and zero station progress.

`spent` is seeded from the persisted meter on every tick (`:1161`), so the money is at least remembered. What
is not remembered is the work it bought.

### 4.5 Observability: the tree is inferred, not recorded

`tool_calls` carries `trace_id` but no `parent_event_id` and no `ai_event_id`, so the thought → tool → observe
chain is rebuilt by timestamp in JavaScript ([`agent-first-platform.md`](./agent-first-platform.md) §6.6).
`ai_events.agent_id` is selected and never written by any of its six insert sites. `ai_traces` does not exist
despite `architecture/runtime.md:32` naming it as canon. And `tool_calls` discarded **every** agent row since
the tenancy retrofit — 0 rows from any agent run, ever, with 154 of its 283 rows naming six tools that have
never existed ([`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md)).

**Every per-tool reliability number this product could quote is currently unbacked**, which matters more than
it looks: the trust ramp graduates agents on a meter whose eval leg has been dead since it shipped.

---

## 5. Lens 4 — Engineering

**Strong, in one line:** 173 of 173 public tables have RLS enabled, the model-call chokepoint has exactly one
hole, and the reasoning written into `fake-postgrest.test.ts:1-23` about why a naive mock cannot test a
guarded write is better than most production test infrastructure.

### 5.1 The tick that spends money is the one tick with no claim

`track-tick` selects `spine_tracks WHERE status='open' ORDER BY driven_at LIMIT 5`
(`src/routes/api/public/hooks/track-tick.ts:76-83`). That is a read. `driven_at` is written only **after** the
crew runs (`driver.server.ts:1327`, `:1347`, `:1385`, `:1418`, `:1460`, `:1520`). There is no compare-and-swap
anywhere in the file.

Cadence is `*/10 * * * *`; measured runtime was 34s average with **57.3% stuck**
(`supabase/migrations/20260803120000_cron_http_client_timeouts.sql:19`); the HTTP client timeout is 180 s and
`net.http_post` abandoning the response does not stop the Worker. So a long tick is still in flight when the
next one starts, both take the same five oldest tracks, and both dispatch the same crew.

The file's own comment at `:104-106` says seats run sequentially because *"five concurrent loops would race the
cap check"* — correct, and exactly the race two overlapping ticks reintroduce across the tick boundary. The
claim primitive is already written twice in this codebase: `resume_lease_at`
(`src/lib/ai/loop.server.ts:2447-2467`) and the approvals CAS (`approvals-tick.ts:241-257`). It was never
applied to the one tick that dispatches crews.

There are **zero advisory locks in the repository**. The only reference is a TODO
(`src/routes/api/public/hooks/trigger-tick.ts:477`).

### 5.2 Two ticks are bounded and unordered, which at scale is starvation

- `calibrate-tick` — `.limit(20)`, **no `.order()`** (`calibrate-tick.ts:21`). Runs `0 */6 * * *` and spends
  money twice per workspace (`src/lib/brain/calibrate-insights.server.ts:68`,
  `src/lib/brain/forecast-audit.server.ts:181`). Past twenty eligible workspaces, Postgres returns an
  arbitrary twenty and an unlucky tenant may never be calibrated.
- `outcome-tick` — `.limit(20)` and `.limit(15)`, **no `.order()` on either** (`outcome-tick.ts:67`, `:175`).
  Its predicate keeps a PRD whose GitHub issue never closes in the candidate set forever. Twenty such PRDs and
  the twenty-first is unreachable.

Three lines of `.order()` convert both into fairness. `sense-tick`, `cluster-tick` and `track-tick` already do
this correctly.

### 5.3 The two largest tables are the two the retention path does not cover

```sql
SELECT c.relname, pg_size_pretty(pg_total_relation_size(c.oid)), c.reltuples::bigint
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' ORDER BY pg_total_relation_size(c.oid) DESC LIMIT 4;
-- agent_run_checkpoints | 132 MB | 7,319   <- ~18 KB per row
-- job_runs              | 107 MB | 316,197
-- ai_events             |  77 MB | 70,415
-- agent_memory          |  28 MB |  1,523
```

`purge_old_telemetry` covers `ai_events`, `prompt_runs` and `tool_calls`
(`supabase/migrations/20260620000000_data_retention.sql:50-56`). **It covers neither of the top two.** And it
is dormant: `SELECT public.data_retention_enabled()` returns `false` against the live database, from a function
body that is literally `select false`.

`agent_run_checkpoints` is quadratic by construction. The single writer
(`src/lib/ai/loop.server.ts:1040-1063`) upserts the **entire** `conv` array and the **entire** `steps` array at
every step, so a run of N steps stores O(N²) bytes of conversation. Its own comment concedes the right fix
(*"a real history table plus a reader"*) and declines it.

`job_runs` grows with wall-clock time, not with tenants: `approvals-tick`, `resume-runs` and
`event-reactor-tick` all run `* * * * *`, giving roughly 5,400 rows a day forever. `reap_stuck_job_runs`
UPDATEs stuck rows; nothing deletes them.

**132 MB and 316k rows is what nine single-seat workspaces and two demo tenants produced.** The growth is
per-run and per-tick, so it scales with the thing the product is trying to sell.

### 5.4 The gates that would enforce the business are hardcoded off in the deployed database

Read from `pg_proc`, not from migrations:

| Function | Deployed body | Effect |
| --- | --- | --- |
| `credits_enabled` | reads `app_settings` → **true** | billing is live (and today it is what stopped the loop) |
| `interop_write_enabled` | reads `app_settings` → **true** | outward writes open for every tenant |
| `data_retention_enabled` | `select false` | nothing is ever purged |
| `limit_gates_enabled` | `select false` | **no tier cap is enforced** |
| `right_to_erasure_enabled` | `select false` | no deletion path |
| `connector_limit_enabled` | `select false` | no connector cap |

Two of these are per-deployment switches with tenant-wide blast radius and no per-workspace override.
`interop_write_enabled` has been `true` since 2026-08-10 with `updated_by` **NULL**, which
`admin_set_interop_write_enabled` cannot produce — so the switch governing every outward write for the whole
deployment was turned on by direct SQL and the record cannot name who.

### 5.5 The embedding path is outside the meter

The chokepoint is `callModel` / `callModelStream` (`src/lib/ai/runtime.server.ts:1644`, `:2264`), both calling
`assertAccountCredits`. Discipline is good: no provider SDK is imported anywhere outside it.

The one exception is `src/lib/rag/embed.server.ts`. It hits `https://api.openai.com/v1/embeddings` directly
(`:23`), estimates cost (`:178`) and logs the event — and calls **no credit assertion, no budget check and no
kill switch**. With `DECISION_BRAIN_SUPERSESSION` on, one embed fires per recorded outcome. It is the only path
that spends provider money the kill switch cannot stop.

### 5.6 No test drives the loop against a database

612 test files, 10,078 cases. **150 of them read source files and regex them** — lint rules wearing a test's
clothes, and one of them caught a real $1.71/day leak, so they earn their place. But 18 files use the
`fakePostgrest` harness that can actually test a guarded write, and **zero tests exercise the loop end to end
against a database**. The 45-second deadline is tested as arithmetic only
(`src/lib/spine/track-caps.test.ts:168-174`). Nothing tests that a track resumed after `out-of-time` does not
redo seat 1. Nothing tests two overlapping `track-tick` invocations. `src/lib/ai/loop.server.test.ts:234`
and `:239` are `// TODO: Mock agent_run_checkpoints query…`.

Ten Playwright specs exist; all 43 assertions are visual.

**This is why nine features shipped green and did nothing**, which the platform document names in its own
header. The suite proves the code says what the test says. It has never once proven the loop runs.

### 5.7 560 migrations, one documented reversal

No `*.down.sql`, no rollback directory. At least seven migrations contain unconditional top-level `DELETE FROM
public.*` (e.g. `20260801234500_tools_are_platform_not_per_user.sql:41`,
`20260811110000_the_demo_walked_a_graph_the_product_cannot_write.sql:53` and `:58`). Exactly one file documents
how to reverse itself: `20260811090000_seed_and_real_were_told_apart_by_the_shape_of_an_id.sql:125`.

---

## 6. Lens 5 — User psychology

### 6.1 The enterprise pitch, read from the buyer's chair, is a threat

[`../../../README.md`](../../../README.md) sells continuity: *"When a product manager leaves, the next person
inherits it instead of starting cold. That is the enterprise reason to buy."* The Enterprise tier's tagline is
blunter: *"When someone leaves, you can prove what they knew and why they chose it"*
(`src/lib/entitlements.ts:469`).

The individual PM is the front door ([`../../strategy/positioning-locked-2026-08.md`](../../strategy/positioning-locked-2026-08.md) §2).
So the land motion asks a person to adopt a tool whose stated organisational value is that **they become
interchangeable**, and whose stated governance value is that their judgment becomes auditable by the person
above them. The canon already knows the shape of this — it is why the forecast was demoted from the lead, and
why Cowgill is quoted. It has not applied the same reasoning to the continuity claim, which is the same
mechanism pointed at the same buyer.

### 6.2 What a person will avoid

**Learn.** It is the station where you find out you were wrong, and it is the only one with no scheduled
prompt a person cannot dismiss. `learnings` = **0** on every real workspace. Even the demo tenant's 133 rows
were seeded, and the last one was written 2026-08-11.

**The Critic.** Onboarding's single act is *"Your key assumption that could be wrong"*
(`ObsidianOnboarding.tsx:1345`) followed by a teardown. That is a strong first impression and it is also the
one experience most likely to be had once. The button's own escape hatch exists because the primary control
disables itself on an empty box (`:1450-1457`) — the design already knows people freeze here.

### 6.3 Where trust breaks, exactly

Not at a wrong recommendation. Trust breaks at **a confident, specific, false statement about the user's own
data**, because that is the one error the user can immediately verify and the one that generalises. Both of
today's instances are that shape:

- *"the signal_themes table is missing due to insufficient signal ingestion"* — in a workspace holding 12
  themes.
- *"No signals exist in the workspace for 'EU Timezone Tier-1 Support Latency'"* — with six attached.

A user who reads either one learns, correctly, that the product will assert things about their workspace that
are not true. **There is no recovery from that inside the same session, and no eval in the suite that catches
it**, because it is not a wrong answer to a question — it is a right answer to a question the tool could not
ask.

### 6.4 Approval fatigue, already measured

93% of permission prompts are approved industry-wide; six of this product's agents sit at a 100% approval rate;
eleven tools raised 130 approvals and had **zero** decided, ever; two tools were rejected 7 of 7 times and are
still offered ([`agent-first-platform.md`](./agent-first-platform.md) §1.7b). A gate that is clicked through
manufactures the appearance of review while producing none. The document diagnoses this perfectly and Slice 1
has not shipped.

The counter-metric it names is the right one and deserves repeating here: the BCG/MIT finding that a named,
autonomous-looking agent draws **16% less scrutiny** means a visible autonomy ladder is itself a trust signal
that reduces review without any change in competence.

---

## 7. Lens 6 — Enterprise B2B buyer

### 7.1 What a security review kills, in order

1. **A production authorization switch changed with no attributable actor.** `interop_write_enabled` = `true`
   since 2026-08-10 13:10:05Z, `updated_by` NULL, from a function that cannot write NULL. Three `mcp_tokens`
   were minted around the validator by direct SQL nine minutes later. Out-of-band writes to auth-relevant
   tables in production is a finding that ends the review before anything else is read.
2. **The audit trail cannot answer whether a write happened.** Six governed write tools return
   `{status:"quarantined", id:null}` without throwing and are audited `result:'success'`
   (`src/lib/mcp.functions.ts:906` and five siblings). The one `record_decision` call ever made is
   `success`/`error_message NULL`, and `decisions WHERE source_kind='mcp'` is **0**. In a product sold as a
   governed record of agentic work, this is the single worst possible defect.
3. **No SSO, no SCIM, no audit export, no data residency, no retention policy, no legal hold, no departure
   workflow.** The code says so itself — `src/lib/entitlements.ts:483-487` marks all seven *"Planned, not yet
   shipped"* on the tier whose tagline is about departures. `right_to_erasure_enabled()` is `select false` in
   the deployed database, so there is no GDPR deletion path today.
4. **Isolation is one boundary short of what Enterprise is sold on.** RLS is on for 173 of 173 tables and the
   workspace boundary is real. But `learnings`, `agent_memory` and `house_rules` carry **no `product_id`**
   ([`agent-first-platform.md`](./agent-first-platform.md) §2.3), all 1,170 `agent_memory` rows are
   `visibility: 'workspace'`, and 101 recalls had a reader who was not the author. For an agency running three
   clients in one workspace, a measurement taken for client A is retrievable while ranking client B. The
   Enterprise tier sells *"provable isolation"* and *"a cross-product audit showing nothing crossed"*; the
   schema cannot produce that audit.
5. **`connections` is keyed on `user_id`, not `workspace_id`** (information_schema). Every integration belongs
   to a person. When that person leaves, the organisation's pipes stop — the same inversion as §4.3, on the
   data-in side.

### 7.2 Procurement will ask three questions this cannot answer

- *"What does it cost us at our volume?"* — §1.1. The top marketed band buys eighteen hours a month.
- *"Show me a customer using it with more than one person."* — nine real workspaces, one member each.
- *"What is your uptime and how do we know?"* — `job_runs` and `error_events` are readable only from `/admin`.
  ~2,880 tick failures in 30 days reach no customer surface, and a stuck tick is indistinguishable from a
  healthy one for 30 minutes (`supabase/migrations/20260803130000_reap_stuck_job_runs.sql:36`).

### 7.3 Exit is the one enterprise answer that is genuinely good

`export_skillpack` (`src/lib/mcp.functions.ts:548`) produces a deterministic, content-fingerprinted bundle of
the workspace's settled lessons, correctly tenant-scoped, with the cross-tenant hazard in the opportunity embed
reasoned about in the comment. It is the right shape and it is buried as one line in a Settings tab
(`src/components/settings/IntegrationsTab.tsx:66`).

It is also worth naming the tension: **the product ships an export tool for the asset it calls its moat.**
That is correct behaviour and it is also the honest measure of how much lock-in the record provides — at 60
decisions and 0 learnings per real tenant, the answer is none. A moat you can hand over in a JSON envelope is a
feature.

---

## 8. If a big company shipped this

One concrete move each, and they are not four versions of the same move.

**Anthropic — deletes the database.** They already published the SKU-shaped version of layers 01 and 02:
`knowledge-work-plugins`, 2026-01-30, *"Write specs, prioritize roadmaps, and track progress"*, with connectors
for Slack, Linear, Asana, Jira, Notion, Figma, Amplitude, Pendo, Intercom and Fireflies
([`../../research/market-validation-2026-08.md`](../../research/market-validation-2026-08.md):71). Anthropic
would delete the seven-station spine, both orchestration engines and the tenant database, and ship the whole
thing as skills plus MCP over the customer's own tools, with the record as **files in the customer's repo**.
What that invents: the forecast committed next to the spec, so *captured at decision time* is guaranteed by
git's own timestamps rather than by a vendor's table — which makes the moat free, self-hosted and unownable.
The answer to *"why won't Anthropic do this"* cannot be *"they won't"*; it has to be a reason a repo is the
wrong home for it.

**OpenAI — deletes Discover and starts at the experiment.** They paid roughly $1.1B for Statsig and the team
now builds *"the product development system used by every OpenAI team"* (same file, :57, :61). OpenAI would
never ask anyone to type a forecast, because the primary metric and the minimum detectable effect are already
mandatory fields on a control the customer cannot skip. What they invent: the join from pre-registered
hypothesis to shipped result at the **flag** level. They own both ends already, and they get for free the one
field this product has 0 of on real data.

**Google — deletes the accountability framing and infers the prior belief.** Google's own institutional
history is the counter-evidence in this repo's canon: prediction markets that beat experts and died on
politics. Google would not capture a forecast; it would ship this as retrieval over Workspace, where the
decision, its alternatives and its reasoning already live in Docs, Chat and Meet transcripts. What they invent:
the **retro-forecast** — read a spec's revision history to recover what was believed on the day it was written.
That is precisely the backfill this repo says is impossible for forecasts, and a Doc's revision history is a
timestamped record of prior belief that Google already stores.

**Vercel — deletes everything above the deploy.** Vercel's own COO is the person in this repo's canon who
reconstructed a lost deal's true cause with a two-day agent for ~$1,000/year
([`../../../README.md`](../../../README.md)). Vercel would keep Ship → Learn and throw the rest away: the deploy
is the event they own, the flag is the boundary, the outcome is already in their analytics. What they invent:
a required field on the deploy asking *what should this move* — one text box, un-skippable because the deploy
is un-skippable, resolved automatically when the metric lands. It costs them a week. **This product has 0
deployments on any real workspace**, so Vercel would be starting from the one place it has never reached.

**The pattern across all four:** each one deletes the middle of the loop and keeps an end they already own,
and each gets the forecast as a side effect of a control the user cannot decline. This product asks for it in
a form field that is optional on the only door anyone uses.

---

## 9. What I tried to break and could not

Named because a review with no negative results is not a review.

- **The workspace boundary.** RLS is enabled on **173 of 173** public tables. `exportSkillpack` runs
  service-role and reasons explicitly about why `.eq("workspace_id", …)` is the boundary and where a future
  migration would break it (`src/lib/mcp.functions.ts:548-565`). I could not find a read path that crosses
  workspaces.
- **Scope enforcement on the machine surface.** It works, and there is production evidence: `settle_outcome`
  was refused for a missing `write:outcome` scope and audited `permission_denied`, in the same session as a
  successful `record_decision`. The refusal is real, not theoretical.
- **`release.publish`.** Pinned to `review` in `src/lib/ai/tools/defaults.ts:165`, on the trust-ramp exclusion
  list at `src/lib/ai/trust-ramp.ts:74`, and asserted by two independent tests. It cannot graduate. Correct,
  and it should stay exactly as it is.
- **The verdict path's parity.** Human and agent both reach `applyOutcome`, so an agent-written verdict
  re-ranks identically, and `match_agent_memory` genuinely pulls a validated memory closer. This is the
  best-built part of the product.
- **The chokepoint.** No Anthropic or OpenAI SDK is imported anywhere outside `runtime.server.ts` and
  `provider-route.ts`. Embeddings are the only bypass, and they are a deliberate second chokepoint, not an
  accident.
- **The 75.1/54.2 anti-correlation split.** I could not reproduce it — see §4.2. Recorded as unverified by me,
  not as wrong.

---

## 10. The one thing to delete outright

**`coldStartBarFor`** (`src/lib/autonomy-policy.ts:248-256`), and the `workspaces.cold_start_promotion_enabled`
flag with it.

The argument for it is good: a new workspace's corpus is small, so an absolute frequency bar is unreachable.
The argument against it is today.

```sql
SELECT w.is_sample, count(*) AS themes, max(t.frequency) AS max_freq,
       count(*) FILTER (WHERE t.frequency >= 8) AS meets_default_bar
FROM themes t JOIN workspaces w ON w.id=t.workspace_id GROUP BY 1;
-- real | 34  | 6  | 0
-- demo | 591 | 19 | 19
```

```sql
SELECT count(*) FILTER (WHERE cold_start_promotion_enabled) AS on,
       count(*) FILTER (WHERE promotion_min_frequency IS NOT NULL) AS custom_bar, count(*) FROM workspaces;
-- 1 | 0 | 21
```

Two facts sit on top of each other. **No real theme has ever reached the default bar** — 0 of 34, max
frequency 6. And the escape hatch is **on for exactly one workspace of twenty-one**, with
`promotion_min_frequency` NULL on all of them. So for twenty of twenty-one tenants the autonomous director is
silently inert, and for the twenty-first it fired on six self-authored duplicates and spent the month's
budget in eighty minutes.

A per-workspace boolean that decides whether the product's central promise functions, defaults to off, is set
by nobody, and has no surface, is not a feature — it is a hidden kill switch pointed the wrong way. Deleting it
forces the real question into the open: **the bar has to be a judgement about evidence quality, not a count of
rows, because the count is writable by the thing being judged.** Frequency, severity and confidence are all
model-supplied; there is currently no term in `qualifies` (`src/lib/spine/promote.ts:131`) that a fluent model
cannot move on its own.

Keep the intent. Delete the mechanism, because the mechanism's only two production behaviours are *do nothing*
and *do the wrong thing expensively*.

---

## 11. Corrections earned while writing this

Recorded because three of the briefs issued today were wrong and the corrections were worth more than the
tasks.

| Claim I was given or found | What production says |
| --- | --- |
| *"0 of 131 decisions in real workspaces carry a forecast"* | **0 of 60.** A workspace flipped to `is_sample` since; `ws_sample` is 12 of 21, and there are **9** real workspaces, not six. The finding is unchanged and the denominator is not. |
| *"`credits_enabled()` is hardcoded `false`, so there is no revenue metering"* — a careful read of `20260619212731…sql:71-73` | **False.** `SELECT prosrc FROM pg_proc WHERE proname='credits_enabled'` returns a body reading `app_settings`, and the function returns **true**. A later migration superseded the one that was read. Today's 139 credit debits and eleven refusals are the direct disproof. |
| *"The cron fleet posts to a hardcoded `lovable.app` preview host, 45 times across migrations"* | **False.** `SELECT count(*) FILTER (WHERE command LIKE '%supaprod.ai%') FROM cron.job` returns **36 of 37**; zero point at `lovable.app`. The literals are in migration history, not in the live schedule. |
| [`agent-to-agent.md`](../../../architecture/agent-to-agent.md) §1: `POST /api/public/teardown` is a live unauthenticated door | Retired today. `src/routes/p.teardown.tsx` is a permanent redirect and `runPublicTeardown` has zero callers. A document written this morning already cites a route retired this afternoon. |

**The rule these four share, and it belongs on the board:** a migration tells you what was once true;
`pg_proc`, `cron.job` and `information_schema` tell you what is running. Two of the highest-severity
engineering findings in a careful pass were falsified by one query each. This repo already records
*"writer existence must be derived from the code, never from row counts."* Its sibling is
**function behaviour must be derived from the deployed catalog, never from the migration that defined it.**

---

## 12. Related

- [`agent-first-platform.md`](./agent-first-platform.md) — the platform direction this argues with. It is
  right about almost everything and has shipped almost none of it.
- [`../../../architecture/station-journeys.md`](../../../architecture/station-journeys.md) — the two-column walk
  of every station, and the asymmetry table §12 that this review does not repeat.
- [`../../../architecture/agent-to-agent.md`](../../../architecture/agent-to-agent.md) — the machine surface,
  its three doors, and the governance parity defects.
- [`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md) — the one board. Everything here that needs an owner
  belongs there, not in this file.
- [`../../strategy/positioning-locked-2026-08.md`](../../strategy/positioning-locked-2026-08.md) — the canon
  §2.3 argues against.
