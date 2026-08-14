# The functionality audit, 2026-08-14

> _Lane 0. Written before any code was changed, then kept current as fixes landed._

**What this is.** A state-of-the-app audit of features, data, logic, integrations and correctness. Not design: look and feel is Lane 1's, and this document does not touch it.

**How to read it.** Every number below carries the query or the grep that produced it, because a number without its query cannot be re-checked and has twice been wrong in this repo. Findings are ranked P0 (breaks a core flow or loses money), P1 (degrades a demanding user), P2 (worth doing, not now).

**The evidence behind it** is in [`audit-reports/`](./audit-reports/README.md), one file per pass, committed as each finished rather than at the end.

**The measurement baseline**, taken on `0c9ff970` before any edit: `bunx tsc --noEmit` 0 errors; `bun test` 8,787 pass, 0 fail, 23 skip, 60 todo across 517 files. Production is `supaprod.lovable.app`, Lovable project `371dd588-1b70-4629-9bb5-9f003f3af373`, last published from `0c9ff970`.

---

## The one-sentence finding

**The product's machinery is built to an unusually high standard and large parts of it have never executed, because the switches that would start them were never given a way to be flipped, and the layer that would have reported the silence was reporting success.**

That is not a stylistic complaint. Three independent mechanisms below were live in cron, on schedule, and processing zero rows, and every dashboard said they were healthy.

---

## 1. What exists and works

Verified, so that nobody rebuilds it.

- **Row-level security is genuinely clean.** All 172 public tables have RLS enabled; 0 have it disabled. The nine tables with RLS on and zero policies are deliberate service-role lockdowns (billing secrets, waitlist, landing events) and deny by default, which is correct.
  ```sql
  SELECT c.relname, c.relrowsecurity, (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid)
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND (c.relrowsecurity=false OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid)=0);
  ```
- **Cron registration is complete.** 37 jobs active, covering every tick endpoint except `github-webhook` (driven by GitHub, correctly) and `funnel-week2` (genuinely unscheduled, see 4.3). `SELECT jobname, schedule, active FROM cron.job;`
- **Hook authentication is sound.** All 37 cron endpoints call `requireHookCaller`, which fails closed when no secret is configured and compares with `timingSafeEqual`. `github-webhook` verifies an HMAC-SHA256 signature instead. There is no unguarded public tick.
- **The money primitives in SQL are correct.** `debit_account_credits`, `apply_topup_credits`, `refund_account_credits`, `redeem_voucher` and the clawback all use `SELECT ... FOR UPDATE` or `ON CONFLICT DO NOTHING` plus a row-count gate. Stripe signature verification reads the raw body before any parse. The defects in section 3 are in the JavaScript callers, not these.
- **Several claim/compare-and-swap patterns are textbook** and are the reference implementations the rest of the codebase should copy: `event-reactor-tick` (claim-first CAS with a readback), `extendApprovalTtl`, the mission-step dispatch CAS, and `builder_file_claims` (a real lease on a partial unique index).
- **Error boundaries are well built.** `error-page.ts`, `__root.tsx` and `_authenticated.tsx` all give a real message and a retry. There are no white screens; the dead ends found are hangs, not blanks.
- **Retries are bounded everywhere they exist**, with true exponential backoff, and no retry sits on a non-idempotent write.
- **The empty and refusal states are, as a rule, honest.** The Design station refuses to draw a screen from a spec shorter than a paragraph rather than inventing one. Ship refuses to state a count when the underlying read failed. This is a real strength.

---

## 2. What exists but is broken, flaky, or partially wired

### 2A. Three mechanisms that were live and doing nothing

This is the headline, and all three share one shape: **a gate whose control side was never built.**

#### 2A.1 P0 — `auto_derive_enabled` had no writer anywhere in the repo

```sql
SELECT count(*) AS ws, count(*) FILTER (WHERE auto_derive_enabled) AS derive_on FROM workspaces;
-- ws 21, derive_on 0
```
```
grep -rn "auto_derive_enabled" src/ | grep -v types.ts
-- two hits, both `.eq("auto_derive_enabled", true)` read filters. No writer. None.
```

Shipped 2026-06-30 with `NOT NULL DEFAULT false`. Two live cron jobs filter on it — `calibrate-tick` (every 6h) and `assumption-watch-tick` (every 4h) — so both have selected **zero rows on every run for six weeks**, on schedule, reporting healthy.

Dead with it: insight resolution, brier scoring, the 72h generator throttle, and **the entire FC-01 forecast audit**, which is the mechanism the positioning rests on.

**Fixed** by building the writers it never had (`src/lib/workspace-automation.functions.ts`), RLS-enforced and zero-row checked. **Deliberately not fixed:** arming it across the fleet, which starts recurring model spend on 21 workspaces. That is a founder call under standing ruling 3.

#### 2A.2 P0 — the guard test then found a second one

A test asserting the real invariant — *a column the code branches on must be a column some code can write* — immediately surfaced `auto_scout_enabled`: identical state, 0 of 21, gating `scout-tick` (hourly) and `competitor-tick` (weekly).

Four other gating flags were checked and are healthy, so this is a real distinction rather than a blanket complaint: `auto_cluster_enabled` and `design_stage_enabled` have writers and are on for all 21 workspaces; `auto_sense_enabled` and `auto_trigger_enabled` are written by `onboarding/first-ingest.server.ts`.

The guard is `src/lib/workspace-automation.test.ts`, proven red by removing a flag from the catalogue and green by restoring it.

#### 2A.3 P0 — the observability layer reported failed jobs as successful

`withJobRun` writes `status='ok'` when its callback **resolves** and `status='error'` only when it **throws**, and fires the external heartbeat on the same branch. At least twelve tick handlers `return json({...}, 500)` from *inside* that callback. Returning a Response is resolving.

So a tick failing on every invocation writes an unbroken run of `ok` rows on schedule and the external monitor stays green. `EXPECTED_JOBS` only checks recency, and the rows *are* arriving on time. `resume-runs` — the Build execution heartbeat, every 60 seconds — can be failing totally while every dashboard is green.

**This is the multiplier on everything else in this document.** Until it is fixed, no other failure here is observable. `house-rules-tick` is the one tick that already rethrows correctly, and its comment states the rule the other eleven break.

---

### 2B. Money, concurrency and correctness

#### 2B.1 P0 — no Stripe webhook idempotency exists at all

```sql
SELECT count(*) FROM information_schema.tables WHERE table_name IN ('stripe_events','webhook_events');
-- 0
```

`event.id` is never read; the type cast in the handler does not even include it. Stripe delivers at-least-once, and `reset_subscription_cycle` unconditionally sets `balance_credits = _grant`. **A redelivered `invoice.payment_succeeded` after the customer has spent credits restores them to full, free.**

#### 2B.2 P0 — customer charged, zero credits granted, 200 returned, no retry

The Stripe line-items fetch has no `r.ok` check and no timeout. On a 401/429/500 the error body parses fine, `lookup_key` is undefined, the grant is skipped, and the route still answers 200 — so Stripe never retries. Compounding: the three payment RPCs never destructure `error`, so their try/catch blocks are decorative, and `apply_topup_credits` returns an `applied` flag that is discarded, making a capped grant indistinguishable from a successful one.

#### 2B.3 P0 — double refund mints credits from nothing

`refundAbandonedRunCredits` reads `credits_refunded`, refunds, then stamps the flag with no precondition and no `.select()`. Two concurrent callers (there are two call sites) both read `false` and both refund. The migration's own comment delegates idempotency to the caller; the caller does not hold it. The fix is to make the flag the claim: stamp first, conditionally, and refund only if you won.

#### 2B.4 P0 — `accounts.owner_id` has no unique index

```sql
SELECT count(*) FROM pg_indexes WHERE tablename='accounts' AND indexdef ILIKE '%UNIQUE%owner_id%';  -- 0
SELECT count(*) FROM (SELECT owner_id FROM accounts GROUP BY owner_id HAVING count(*)>1) x;         -- 0
```

`ensure_user_default_account` is SELECT-then-INSERT and runs on every billing read. Two parallel page loads at signup both see null and both insert: two accounts, two credit pools, two monthly grants, spend split so every cap under-counts. **Zero duplicates exist today, which is luck, not design.**

#### 2B.5 P0 — the same approval can execute twice

Three writers set approval status with no `.eq("status","pending")` precondition, and `executeApproval` checks `approved` by *reading*, runs the tool, and only stamps `executed` afterwards — so the window is the entire tool run. Two approval surfaces exist. The consequence is `studio.pr.merge` **merging a customer PR twice**, `studio.commit` pushing twice, and `delegate.openhands` dispatching a second paid external job. There is no unique index and no state-machine trigger on `agent_approvals` to catch it.

Worse, the expiry sweeper updates by id alone, so it can flip an already-`executed` approval back to `expired` with a fabricated error, after which the resume path tells the agent the tool was never run.

#### 2B.6 P0 — `resume-runs` replays live agent runs, every 60 seconds

It selects runs with `status='running'` and a stale checkpoint, then resumes them. The compare-and-swap inside `resumeAgentLoop` covers only `queued` and `waiting_approval`; `running` falls straight through. Stale is 2 minutes, the cron period is 60 seconds. Two or more workers replay the same checkpoint: doubled model calls, doubled credit debits, doubled tool execution including GitHub writes, and interleaved checkpoint writes.

#### 2B.7 P1 — budget meters lose updates permanently

`incrementBudget` reads `daily_usd_used`, adds in JavaScript, and blind-writes. Two concurrent calls both read 10.00 and both write 10.50. Unlike the balance check this is **not self-correcting**: the ledger is permanently short and the cap under-reports for the rest of the window. The adjacent `record_mission_usage` does the same job correctly as an atomic `SET x = x + n`.

---

## 3. What is stubbed or claimed but not implemented

### 3.1 P0 — the guidance loop has never carried a real outcome

This is the product's central claim, so it gets the most evidence.

```sql
SELECT kind, count(*) FROM agent_memory GROUP BY kind;
-- reflection 959 | precedent 28 | note 26 | correction 9 | outcome 0
SELECT count(*) FROM ai_events WHERE surface_ref='precedent';
-- 358
```

`agent_memory` has **never held a row of kind `outcome`** — the only kind every precedent reader filters on. Meanwhile the read side has fired **358 times** and paid for an embedding each time, returning empty structurally rather than by chance.

The read path is real and I would not rebuild it: `/decide` fetches precedent under the Gate at decision time, prior outcomes *reorder* the opportunity queue through `outcomeSupport`, and the Critic folds five learning blocks into its red-team prompt. The wiring is genuine. The pipe is empty.

Three causes, each verified:
1. The agent settle path gated its memory write on `if (resolvedPrdId)`. Its own comment prescribed the fix and called it "one line in another file plus dropping the `if` here" — the widening had landed, the `if` had not been dropped. **Fixed.**
2. No real workspace has ever reached a settled outcome: every settled spec and attributable learning is in an `is_sample` workspace.
3. The demo seeds insert `learnings` rows directly in SQL and write only `reflection` memories, so a demo workspace *displays* a full learning history while the pool `/decide` reads stays empty.

**The honest form remains: the loop is wired and proven, and it begins accruing on first real use.** It is now able to.

### 3.2 P0 — the agent surface is a reader, not an operator

Measured against the lifecycle verbs, **19 of 20 are UI-only**; only "ingest a signal" has full coverage. The product's own agents run on a 55-tool registry that is unreachable from outside the process; external agents got 11 reads and 4 writes.

And three of those four writes **could never be authorized.** The mint path kept a second, hand-written scope allow-list reading `["write:signal"]`, never widened when the write layer grew to four tools. `record_decision`, `draft_spec` and `settle_outcome` were catalogued, dispatched, scope-checked and unit-tested while being impossible to grant.

```sql
SELECT slug, scopes, revoked_at FROM mcp_tokens ORDER BY created_at;
-- three tokens, all revoked, all carrying write:decision or write:spec
```
All three were minted by calling the SQL RPC directly, *around* the validator. Today there are zero live tokens. The global `interop_write_enabled()` gate is **true**, so the gate was never the blocker — the application was. **Fixed:** the list is now derived from `WRITE_SCOPE_BY_TOOL`, pinned by a test asking the question none of the existing ones did — not "does this tool declare a scope" but "can that scope be granted".

Still open: no idempotency key on any external write, no bulk operations anywhere (a user with 200 pending approvals has 200 clicks), errors returned as prose rather than typed codes, and no way for an agent to obtain a credential without a human visiting a web page.

### 3.3 P1 — built-but-unreachable code

27 server-function modules (~4,400 lines) have no production importer. The notable ones: `today-lanes.functions.ts` (559 lines — an entire Today information architecture that `/today` does not use), `calendar.functions.ts` (724 lines), `goals.functions.ts` and `loops.functions.ts` (the SW-4 GOAL and LOOP modes), `briefing.functions.ts`. `surface-registry.ts` independently self-declares 91 surfaces as `status: "planned"`, and the two lists largely agree — the server half was built, the UI half was not.

`funnel-week2` is the fleet's one genuinely dead loop: a complete, auth-guarded, `withJobRun`-wrapped endpoint with no cron entry in any of the 533 migrations. Rated P1 rather than P0 because its readers have no callers either — it is dead code driving a dead read.

### 3.4 P0 — the connector "connect" loop

`linear.functions.ts` reads only shared admin env keys and never the per-user vault token the OAuth flow mints. A user who **completes** the Linear OAuth round-trip is told *"Linear isn't connected yet. Link it from Integrations"* — pointed back at the flow they just finished. Same shape for `notion` and `google_docs`. Separately, 11 of 20 connector adapters are `stubAdapter`, whose `validate()` returns "adapter not implemented", so "Test it" fails for all 11.

### 3.5 P1 — silent failures that present as legitimate zeroes

706 call sites destructure `{ data }` without checking `error`. The consequential ones are where an empty array feeds a *claim*: the public proof page prints "0 supersessions caught" on any DB error; the drift health check fails open to `ok: true`; the loop-stall detector reports "idle" because it could not look, and its type has no `unknown` verdict to express the difference; the credits ledger records a delta computed from an unchecked read.

The generalization is precise and worth keeping: **a readiness flag that exists on a sibling type in the same file was omitted from this one, so the error state has nowhere to live and collapses into a legitimate-looking zero.** Five of these additionally carry a comment asserting the safety property the code does not have, which is exactly why they survived review.

---

## 3.6 The spine, traced end to end — P0

The founder's question is whether one piece of work travels Discover to Learn. Traced in production, station by station.

**The driver is real, scheduled, and running.** `track-tick` fires every 10 minutes and drove every open track this morning. `spine_tracks` is the unit of work; `driveTrackOnce` dispatches each station's agent crew under its own boundary.

**And 39 of 43 tracks are standing at the FIRST station.** Exactly one track has ever reached `learn` and finished, on 2026-08-01. Nothing has completed since.

```sql
SELECT status, station, count(*), max(driven_at) FROM spine_tracks GROUP BY 1,2;
-- open/sense 39 (driven today) · open/decide 2 · open/define 1 · done/learn 1
SELECT last_hold, count(*), max(attempts) FROM spine_tracks WHERE station='sense' GROUP BY 1;
-- station-cannot-finish 26 (attempts 3) · waiting-on-a-person 12 · out-of-credit 1
```

The lineage graph says the same thing from the other side: the front of the spine is alive and the middle went cold weeks ago.

```sql
SELECT parent_kind||' -> '||child_kind, count(*), max(created_at) FROM artifact_lineage GROUP BY 1;
-- signal->theme 591, latest 08-12   ·  theme->opportunity 38, latest 08-06
-- opportunity->prd 13, latest 07-30 ·  prd->mission 31, latest 07-15
-- mission->changeset 21, 07-21      ·  changeset->deployment 14, 07-16
```

**The cause is not a broken station. It is that the first station has nothing to read.** A `discovery-scout` run on 2026-08-12 says it in its own words:

> "No verbatim evidence exists beyond the confirmed signal... The claim of '12 signals' and '83% confidence' is unsupported, ingestion pipeline is not yet configured. To proceed, the Intercom connector must first be configured. No further signals can be logged."

**The agent is behaving correctly and the product is punishing it for it.** It refused to invent evidence, filed nothing, and the driver read a clean run that filed nothing as a station failure worth retrying. Three attempts later the track froze.

Three separate defects sit behind that, and two are now fixed:

1. **A credit refusal was misclassified as a station failure.** `isEnvironmentFailure` tested `message.includes("credit balance")`, but the runtime raises the same refusal in two wordings and every live failure carried the one that does not contain that substring. **Fixed:** matched on the error's `code` first, prose second. This is the "pin the claim, not the spelling" failure in its purest form.
2. **A track frozen by an empty account could never recover**, because `stalled` escalates to `station-cannot-finish`, which is terminal. Topping the account up did not revive it. **Fixed:** the attempt ceiling no longer applies when the last hold was `out-of-credit` or `over-budget`, since those attempts were never spent on anything.
3. **STILL OPEN: the correction loop misdiagnoses a starved station as a broken one.** `STATION_NEEDS.sense` already carries the right words, "evidence in this workspace to gather" with the fix "Connect a source on Discover". But `needIsMet` is satisfied by any signal ever attached to the track, and these tracks all carry historical signals. So a station that cannot find anything NEW reads as a station that has what it needs and failed anyway, and the person is sent to inspect the station rather than to connect a source.

**What actually blocks a live end-to-end run, and it is not code.** No real inbound signal source is connected. Nine OAuth providers are built and unregistered, and `FIRECRAWL_API_KEY` is unset. Both are on this repo's own founder-gated list. Until one real source flows, Discover has nothing to sense, and every station after it is waiting on Discover.

Credits are a secondary blocker on two accounts only: tracks in workspaces holding 5,000 credits are frozen identically, so credit exhaustion explains 1 frozen track, not 26.

---

## 5. What is missing entirely

- **A reopen path for a settled forecast.** No unsettle, no re-settle, no correction. The migration says the agent-slug column exists so agent verdicts stay reversible; the surface renders those rows with no control, so in practice an agent verdict is irreversible. Design decision handed to Lane 1.
- **A Stripe event-dedupe table.** See 3.1.
- **Any test of the impure half of the forecast audit.** The five pins cited as proof are all on pure functions, which is precisely why the race, the unchecked write and the false gate premise all survived.
- **Bulk operations on any machine surface**, and an idempotency key on any external write.
- **A distinction between "recall failed" and "nothing to recall"** in the memory layer. The repo has already been burned by exactly this once, and documented it.

---

## 6. Priorities, and the reasoning (see also the register in section 8)

Worked in this order, and the reasoning is not severity alone:

1. **The observability lie first**, because it is the multiplier. Every other finding here is invisible while a failed job reports success, and fixing it converts the rest from "trust this audit" into "watch it happen."
2. **The switches with no writers**, because they are cheap and they un-dark three mechanisms at once, including the moat's.
3. **The moat's agent surface and its safety gate**, because the positioning rests on it and because an agent-authored decision that cannot carry a forecast is capturing only the half a competitor can reconstruct.
4. **Money**, because the failure is unrecoverable and silent: a customer charged with nothing granted does not retry, and a redelivered webhook does not announce itself.
5. **Double execution**, because merging a customer's PR twice is the most externally visible failure in the list.

**Deliberately deferred, with reasons.** Arming the automation flags fleet-wide (recurring model spend, founder's call, ruling 3). The 27 orphan modules (each is either a missing UI wire-up or a deletion, and both are product decisions rather than defects). Bulk operations and idempotency keys on the agent surface (real P1s, but they degrade a power user rather than breaking a loop, and the loop-breakers came first).

---

## 7. Verification

Fixes are landing with tests proven red before green by planting the defect, not merely written after. Two worked examples:

- Removing the `settled_by` check from the auto-settle gate turns the agent-chain test red, which is the property that stops agent-judges-outcome from authorizing agent-judges-forecast.
- Removing a flag from the automation catalogue turns the writer test red, which is the property that would have caught `auto_derive_enabled` six weeks ago.

The per-cycle gate stays `bunx tsc --noEmit` plus `bun test`, and green must be measured on the merged tree rather than one worktree, because three worktrees share this commit.

---

## 8. The register

Every finding in one table, with what happened to it. `Closed` means fixed with a test proven red before green. `Deferred` always carries a reason; a deferral with no reason is just a thing nobody did.

| # | P | Finding | Status |
| --- | --- | --- | --- |
| 1 | P0 | `withJobRun` records success when a handler returns a 500 from inside it, so twelve ticks could fail forever while every dashboard stayed green | **Closed.** Guarded durably: a non-2xx return is now a failure in the ledger, so the next tick written cannot reintroduce it |
| 2 | P0 | `auto_derive_enabled` readable and unwritable for six weeks; calibration, brier scoring and the whole forecast audit selected zero rows | **Closed.** Writers built; guard test then found `auto_scout_enabled` in the same state |
| 3 | P0 | Arming those two flags fleet-wide | **Deferred.** Starts recurring model spend on 21 workspaces. Founder call under standing ruling 3, not an agent's |
| 4 | P0 | No Stripe webhook idempotency at all; a redelivered renewal refills spent credits free | **Closed.** `stripe_events` claim, released on a thrown handler so the retry path still works |
| 5 | P0 | Customer charged, zero credits granted, 200 returned so Stripe never retries | **Closed.** `r.ok` checked, timeout added, RPC errors and the `applied` flag now read |
| 6 | P0 | Double refund mints credits from nothing | **Closed.** The flag is now the claim, taken before the refund |
| 7 | P0 | `accounts.owner_id` not unique on a SELECT-then-INSERT path that runs on every billing read | **Closed.** Unique index, with a migration that names duplicates loudly rather than failing cryptically |
| 8 | P0 | The same approval could execute twice, merging a customer PR twice | **Closed.** Claim taken before `def.run()`, plus a DB trigger making the illegal transition impossible for any writer |
| 9 | P0 | Expiry sweeper overwrote an executed approval, then told the agent the tool never ran | **Closed.** |
| 10 | P0 | `resume-runs` replayed live agent runs every 60 seconds: doubled model calls, credits and GitHub writes | **Closed.** Five-minute lease on the `running` branch |
| 11 | P0 | Duplicate and silently-dropped customer email from one block | **Closed.** Claim before send; a failed send releases the claim |
| 12 | P0 | The guidance loop had never carried a real outcome: `agent_memory` held zero `outcome` rows against 358 precedent lookups | **Closed.** The one `if` its own comment prescribed removing |
| 13 | P0 | Three of four MCP write tools could never be authorized; the mint path kept a stale scope list | **Closed.** Derived from the tool map and pinned by a test |
| 14 | P0 | The moat surface had no agent access at all: no read, no write | **Closed.** `record_forecast`, `settle_forecast`, `list_due_forecasts`, with separate scopes |
| 15 | P0 | Auto-settle gate rested on a false premise, letting agent-judges-outcome authorize agent-judges-forecast | **Closed.** Now reads `outcome->>settled_by` |
| 16 | P0 | Forecast tick could clobber a human verdict mid-`callModel`, and re-billed the same call forever | **Closed.** Compare-and-swap, plus a read of the write result |
| 17 | P0 | A settled forecast could never be reopened, inverting the property its own column exists for | **Closed.** Reopening appends to an append-only log; no update or delete policy exists on it |
| 18 | P0 | Credit refusal misclassified as a station failure, freezing tracks permanently | **Closed.** Matched on the error's code, not its prose |
| 19 | P0 | A track frozen by an empty account could never recover once paid | **Closed.** The attempt ceiling no longer applies to a money hold |
| 20 | P0 | **The spine is starved at station one: no real inbound signal source is connected** | **Open, and not a code fix.** Nine OAuth providers built-and-unregistered, `FIRECRAWL_API_KEY` unset. Both already on this repo's founder-gated list |
| 21 | P0 | 12 tracks blocked behind approvals unanswered for up to 86 hours; nothing surfaces the cost of not answering | **Open.** Building the programmatic approval path rather than faking the rows |
| 22 | P0 | A starved station is misdiagnosed as a broken one, sending a person to inspect a station instead of connecting a source | **Open.** `STATION_NEEDS.sense` already has the right words; `needIsMet` is the wrong predicate |
| 23 | P0 | The connect loop: a user who completes Linear OAuth is told to go and connect Linear | **Open.** Auth reads shared env keys, never the per-user vault token the flow mints |
| 24 | P1 | `agentic_model` silently discarded on save; every unattended tick ran on a model nobody chose | **Closed.** Plus a guard comparing what the caller sends against what the schema accepts |
| 25 | P1 | Budget meters lose updates permanently, so the cap under-reports for the rest of the window | **Open.** Needs an atomic RPC in the shape of `record_mission_usage` |
| 26 | P1 | No idempotency key on any external write; `record_decision` twice makes two decisions | **Open.** `withIdempotency` already exists and is unused on external paths |
| 27 | P1 | No bulk operations on any machine surface; 200 pending approvals means 200 clicks | **Open.** |
| 28 | P1 | Tool errors are prose, not typed codes; no `Retry-After` on a 429 | **Open.** |
| 29 | P1 | 27 server modules (~4,400 lines) with no importer, including a whole Today IA that `/today` does not use | **Open.** Each is a wire-up or a deletion, and both are product calls rather than defects |
| 30 | P1 | Silent failures presenting as legitimate zeroes on health, analytics and public proof surfaces | **Partly closed.** The tick and connector cases are fixed; the health-surface `unknown` state is open |
| 31 | P2 | Seat limits dormant (`limit_gates_enabled()` returns false) and racy the moment they are switched on | **Open.** Nothing enforces seats today, in JS or SQL |
| 32 | P2 | A locked four-tier pricing ruling was never implemented; code still ships five tiers on old slugs | **Open.** |

**Why this order.** The observability lie went first because it is the multiplier: every other finding here was invisible while a failed job reported success, and fixing it turns "trust this audit" into "watch it happen." Then the switches with no writers, because they are cheap and they un-dark three mechanisms at once including the moat's. Then the moat's agent surface, because the positioning rests on it. Then money, because the failure is unrecoverable and silent. Then double execution, because merging a customer's PR twice is the most externally visible failure in the list.

**What I did not do, and would not.** I did not arm the automation flags across the fleet, and I did not approve the 12 stuck gates in the database to make the spine appear to move. Setting `approved` without `executed` would resume the run telling the agent a tool ran when it did not, and a demonstration that moves because the record lies is worse than one that is honestly stuck.

---

## 9. The pattern worth naming: a green test guarding a thing nobody reaches

Four separate findings this session are the same defect wearing different clothes, and the repetition is the finding.

| Instance | The test asserts | What nobody checked |
| --- | --- | --- |
| `auto_derive_enabled` | nothing; the column has a default and a filter | that any code can WRITE it. Two cron jobs read it, none set it, 0 of 21 workspaces enabled |
| The three MCP write tools | each tool declares a required scope | that the scope can be GRANTED. The mint path kept a stale second list |
| `assertConnectorSlotAvailable` | the function refuses a fourth connector | that anything CALLS it. Zero callers; the cap is advertised on two surfaces and enforced nowhere |
| `surface-registry` | every module has an entry with a non-empty `opensFrom` | that anything IMPORTS the module. 28 orphans, ~5,177 lines, passed CI |

**The shape.** Each test asks *"does this unit behave correctly in isolation"* and every one answers yes. None asks *"is this unit reachable"*. So the code is correct, the tests are honest, and the feature does not exist. This is more dangerous than an untested gap, because the green test is read as evidence that the capability works, and in three of the four cases a document was written asserting exactly that.

**Why it keeps happening here specifically.** This codebase is unusually good at pure, table-tested units, and that strength is the vector: a pure function is trivially testable in isolation and its reachability is invisible from inside its own test file. The four instances span four different subsystems and four different authors' work, so this is a property of the testing habit rather than of any one person.

**The fix is a class of test, not four fixes.** Two now exist and both were proven red before green:

- `workspace-automation.test.ts` scans the source for `.eq("<flag>", true)` read filters against `workspaces` and demands every gating flag have a writer. It found the second dead flag within seconds of being written.
- `mcp-protocol.test.ts` now asks whether each write tool's scope is in the grantable set, rather than merely whether the tool declares one.

Two more are owed and are the cheapest wins left in this document: make `surface-registry.test.ts` assert an actual import rather than a declared intention, and pin `assertConnectorSlotAvailable` to having a caller.

**The rule, stated for the next person.** A test that proves a unit works is not evidence the feature works. Somewhere there must also be a test that the unit is *reached* — by a caller, by a writer, by a grantable scope, by an import. Where that second test is missing, the first one is a claim about code rather than about the product.

---

# Second pass, 2026-08-14 (evening), working directly on main

> _Continuation of the audit above, not a replacement. Same rules: every claim carries the grep or the query that produced it, and every fix was proven red by planting the defect before it was fixed._

**Baseline taken on `7c7a2d6d`:** `bunx tsc --noEmit` 0 errors; `bun test` 8,968 pass, **1 fail**. Gate at the end of this pass: tsc 0, **9,034 pass, 0 fail**, production build green.

**The one-sentence finding of this pass.** The previous audit concluded the spine was starved at station one and filed it as founder-gated rather than a code fix; the starvation was real, and underneath it were three defects that a connected source would not have fixed, one of which was silently billing a full agent crew every five ticks.

---

## 10. What the first pass got wrong, and why it is worth writing down

Register row 20 reads *"The spine is starved at station one: no real inbound signal source is connected. Open, and not a code fix."* Row 22 reads *"a starved station is misdiagnosed as a broken one. `STATION_NEEDS.sense` already has the right words; `needIsMet` is the wrong predicate."*

Both were true. Neither was the cause.

**The cause is that the autonomous path throws away the evidence that justified the work.** `promoteClustersOnce` turns a qualifying cluster into a track and writes `spine_tracks.theme_id`. Nothing on the drive path reads that column:

```
grep -rn "theme_id" src/lib/spine/ | grep -v test
-- promote.server.ts (which themes are taken) and track.functions.ts (the insert). Nothing else.
```

The driver briefs every station from `spine_track_members` through `loadUpstream`. A promoted track therefore reached Discover carrying **no members at all**, so the crew whose job is to gather evidence for a cluster was handed the cluster's *title* and nothing else: no summary, no frequency, no severity, none of the signals underneath it. The agent reported it could find nothing, which was true, and the driver read a clean run that filed nothing as a station worth retrying until the attempt ceiling froze the work.

**This is the driver's own documented defect, fixed between stations and still live at the door.** `describeUpstream` in `driver.ts` says the handoff's absence meant the loop "was not a chain, it was seven strangers given the same sentence". That was repaired for stations two through seven. Station one was never given its brief, because its brief arrives from outside the loop and the column carrying it had no reader.

**The lesson for the register.** A mechanism sweep looks for a flag with no writer. This was a writer with no reader, which is the same defect inverted, and the first pass's own section 9 table has no row for that shape. It should: three of the four instances there are "nothing calls it", and this one is "nothing reads it".

---

## 11. What this pass found, ranked

| # | P | Finding | Status |
| --- | --- | --- | --- |
| 33 | P0 | **The autonomous promotion path files no evidence against the track it starts.** `spine_tracks.theme_id` has no reader on the drive path, so a promoted track reaches Discover with zero members and a one-line brief | **Closed.** `attachOriginTheme` at the single door a track is born through. The theme and not its signals, because `HANDOFF_BODIES` inlines two bodies and a dozen signal rows would push the cluster summary out of the brief |
| 34 | P0 | **A station's own output satisfied a precondition no station can produce.** Discover's need kinds are `signal` and `theme`, exactly what Discover files, so `needIsMet` answered yes forever after one success. A later empty tick therefore read as *"has everything and still fails"* and escalated to `station-cannot-finish`, which is **terminal** and sends a person to inspect a station that was working correctly | **Closed.** A precondition with no owning station is answered by the world alone |
| 35 | P0 | **A resumable escalation was answered by rows that had been sitting there for weeks, so the loop billed a full crew every five ticks in silence.** `externalEvidence` counted signals workspace-wide and all-time. `needs-evidence` is in `RESUMABLE_HOLDS`, so any workspace holding any signal resumed immediately, ran the crew, filed nothing, escalated, resumed | **Closed.** Measured against `driven_at`, so the resume fires only when something actually landed. `driven_at` added to `DRIVE_SELECT` |
| 36 | P0 | **A user who completed Linear OAuth was told to go and connect Linear.** `linear.functions.ts`, `notion.functions.ts` and `gdocs.functions.ts` read `process.env` and never imported `resolveProviderAuth`, the chokepoint whose own header says every external call site resolves through it. Production holds a real Linear connection in this state | **Closed.** A shared resolver returning a transport, not just a token: the two credentials go to different hosts. Vendor rules pinned rather than assumed |
| 37 | P0 | **The connector cap was enforced nowhere**, and a test title said *"the cap is enforced, not just advertised"* while asserting neither | **Closed.** Trigger on both connector tables plus a friendly pre-check before the OAuth round trip. Dormant behind its own flag |
| 38 | P0 | **Both AI spend meters lost updates permanently.** Read, add in JavaScript, blind-write. A ledger lost update is not self-correcting: the cap under-reports for the rest of the window | **Closed.** Atomic RPCs, window roll decided inside the locking statement |
| 39 | P1 | **The spec-approval gate was enforced in one React component only.** Both server dispatch paths accepted a draft, including the one its own header calls "the agent door" | **Closed.** A pure module both paths import, beside the design gate rather than instead of it |
| 40 | P1 | **Two of the seven stations were dead ends.** Learn rendered a headline and one paragraph with no button and no link; Ship had no router navigation at all | **Closed.** Both now offer a door. The guard found the Ship half |
| 41 | P1 | **The suite was red on every machine that has credentials.** A test asserted a property of the resume lease by running the whole agent loop, which reached a live call and hung | **Closed.** The property belongs to the lease claim; asserting it directly is deterministic and stricter |
| 42 | P2 | **A guard pinned an entire column list**, so adding a column for finding 39 broke a test about a different column | **Closed.** It asserts its property now. A guard that cannot tell a legitimate addition from a regression is one that gets loosened under deadline |
| 43 | P1 | `TrackChain.tsx` and `TrackActivity.tsx` are built and mounted nowhere. `getTrackChain`'s own docstring calls itself *"THE DOOR THAT WAS MISSING"* and it is still missing, because nothing mounts the component that consumes it | **Open.** The spine's only door in the product is `TrackStart` on `/plan` |
| 44 | P1 | **No control anywhere retries a held track.** A track at `station-cannot-finish` or `given-up` is dead to its owner; `advanceTrack` skips the station instead, producing nothing | **Open.** Related to 43: the surface that would carry the control is the one with no door |
| 45 | P2 | `advanceTrack` consults only the kill switch. No `last_hold`, no `attempts`, no `pending_gates`, no did-this-station-finish predicate, so a person can walk a track through its whole remaining route with an empty member list while the board reports completion | **Open.** Deliberate in part (its header argues a person may carry their own work forward), but it is the one mover with no station-finished check at all |
| 46 | P2 | The `writeSignals` sink header claims to be *"the single write path into public.signals"*. It is one of six; eleven other paths insert directly, so they carry no `source_kind`, no `external_id` dedup, no injection screen and no `stage_events` trail | **Open.** The claim is the defect, not necessarily the paths |

---

## 12. The pattern this pass adds to section 9

Section 9 names *a green test guarding a thing nobody reaches* and gives four instances. This pass found a fifth shape and a sixth, and both belong in that table.

| Instance | The test asserts | What nobody checked |
| --- | --- | --- |
| `spine_tracks.theme_id` | the column is written, and the promotion sweep is tested against it | that anything READS it. The drive path never did, so the link existed and carried nothing |
| Learn's empty desk | each block renders correctly when it has no rows | that the PAGE still offers a way forward when every block correctly declines. Four right answers composed into a dead end |

**The generalisation.** Section 9's four instances are all *"nothing calls it"*. These two are *"nothing reads it"* and *"the composition of correct parts is wrong"*. All six share one property: the unit test is honest, the unit is correct, and the feature does not exist. So the rule stated there needs one more clause: somewhere there must be a test that the unit is **reached**, that its output is **read**, and that the surface still **works when every unit correctly does nothing**.

---

## 13. Two migrations are staged and need applying

Neither is destructive and neither touches a row on apply.

| Migration | What it adds | Ordering |
| --- | --- | --- |
| `20260814180000_a_cap_advertised_on_two_surfaces_and_enforced_on_none.sql` | `connector_limit_enabled()` (false), `tier_connector_limit()`, `connected_source_count()`, and a `BEFORE INSERT` trigger on `connections` and `user_calendar_connections` | None. The trigger no-ops until the flag is flipped, which is a pricing decision |
| `20260814190000_a_meter_that_loses_updates_undercounts_forever.sql` | `record_ai_budget_usage()`, `record_ai_surface_usage()` | **Apply before publishing the app code.** The code calls these; if it goes live first, the meters log a failure and spend goes unmetered until the migration lands |

**Both prove themselves on apply**, and both are advisory rather than fatal about it: each arms its mechanism inside a transaction it rolls back and raises only if the mechanism demonstrably failed. Every other condition downgrades to a `WARNING` naming what could not be checked, because the fixtures need a user id and a foreign key to `auth.users` must not be able to fail a correct schema change. **Read the notices:** `PROVEN` means it was exercised, `WARNING` means correct by construction only and wants a live check.

---

## 14. What I did not do, and would not

- **I did not query production.** No Lovable MCP is available in this harness, so every claim in section 11 is verified at the code and test level and none of it is a statement about live row state. In particular, *"the 26 frozen tracks recover on the next tick"* is traced through `decideDrive` and `decideCorrection`, not observed. The query that would confirm it is in section 13's handoff.
- **I did not arm the connector cap.** Flipping `connector_limit_enabled()` starts refusing a fourth source on Free, and the standing rule is that a free user is never capped without a live upgrade path.
- **I did not touch the tier or pricing slugs.** Register row 32 is still open and is a founder ruling, not a defect.
- **I did not fix the eleven stub connector adapters**, so "Test it" still reports failure on a perfectly good connection for eleven providers. It is real and it is a day of work per adapter, so it wants its own pass rather than a rushed one.
