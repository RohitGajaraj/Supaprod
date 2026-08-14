# The functionality audit, 2026-08-14

> _Lane 0. Written before any code was changed, then kept current as fixes landed._

**What this is.** A state-of-the-app audit of features, data, logic, integrations and correctness. Not design: look and feel is Lane 1's, and this document does not touch it.

**How to read it.** Every number below carries the query or the grep that produced it, because a number without its query cannot be re-checked and has twice been wrong in this repo. Findings are ranked P0 (breaks a core flow or loses money), P1 (degrades a demanding user), P2 (worth doing, not now).

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

## 2. The three mechanisms that were live and doing nothing

This is the headline, and all three share one shape: **a gate whose control side was never built.**

### 2.1 P0 — `auto_derive_enabled` had no writer anywhere in the repo

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

### 2.2 P0 — the guard test then found a second one

A test asserting the real invariant — *a column the code branches on must be a column some code can write* — immediately surfaced `auto_scout_enabled`: identical state, 0 of 21, gating `scout-tick` (hourly) and `competitor-tick` (weekly).

Four other gating flags were checked and are healthy, so this is a real distinction rather than a blanket complaint: `auto_cluster_enabled` and `design_stage_enabled` have writers and are on for all 21 workspaces; `auto_sense_enabled` and `auto_trigger_enabled` are written by `onboarding/first-ingest.server.ts`.

The guard is `src/lib/workspace-automation.test.ts`, proven red by removing a flag from the catalogue and green by restoring it.

### 2.3 P0 — the observability layer reported failed jobs as successful

`withJobRun` writes `status='ok'` when its callback **resolves** and `status='error'` only when it **throws**, and fires the external heartbeat on the same branch. At least twelve tick handlers `return json({...}, 500)` from *inside* that callback. Returning a Response is resolving.

So a tick failing on every invocation writes an unbroken run of `ok` rows on schedule and the external monitor stays green. `EXPECTED_JOBS` only checks recency, and the rows *are* arriving on time. `resume-runs` — the Build execution heartbeat, every 60 seconds — can be failing totally while every dashboard is green.

**This is the multiplier on everything else in this document.** Until it is fixed, no other failure here is observable. `house-rules-tick` is the one tick that already rethrows correctly, and its comment states the rule the other eleven break.

---

## 3. Money and correctness

### 3.1 P0 — no Stripe webhook idempotency exists at all

```sql
SELECT count(*) FROM information_schema.tables WHERE table_name IN ('stripe_events','webhook_events');
-- 0
```

`event.id` is never read; the type cast in the handler does not even include it. Stripe delivers at-least-once, and `reset_subscription_cycle` unconditionally sets `balance_credits = _grant`. **A redelivered `invoice.payment_succeeded` after the customer has spent credits restores them to full, free.**

### 3.2 P0 — customer charged, zero credits granted, 200 returned, no retry

The Stripe line-items fetch has no `r.ok` check and no timeout. On a 401/429/500 the error body parses fine, `lookup_key` is undefined, the grant is skipped, and the route still answers 200 — so Stripe never retries. Compounding: the three payment RPCs never destructure `error`, so their try/catch blocks are decorative, and `apply_topup_credits` returns an `applied` flag that is discarded, making a capped grant indistinguishable from a successful one.

### 3.3 P0 — double refund mints credits from nothing

`refundAbandonedRunCredits` reads `credits_refunded`, refunds, then stamps the flag with no precondition and no `.select()`. Two concurrent callers (there are two call sites) both read `false` and both refund. The migration's own comment delegates idempotency to the caller; the caller does not hold it. The fix is to make the flag the claim: stamp first, conditionally, and refund only if you won.

### 3.4 P0 — `accounts.owner_id` has no unique index

```sql
SELECT count(*) FROM pg_indexes WHERE tablename='accounts' AND indexdef ILIKE '%UNIQUE%owner_id%';  -- 0
SELECT count(*) FROM (SELECT owner_id FROM accounts GROUP BY owner_id HAVING count(*)>1) x;         -- 0
```

`ensure_user_default_account` is SELECT-then-INSERT and runs on every billing read. Two parallel page loads at signup both see null and both insert: two accounts, two credit pools, two monthly grants, spend split so every cap under-counts. **Zero duplicates exist today, which is luck, not design.**

### 3.5 P0 — the same approval can execute twice

Three writers set approval status with no `.eq("status","pending")` precondition, and `executeApproval` checks `approved` by *reading*, runs the tool, and only stamps `executed` afterwards — so the window is the entire tool run. Two approval surfaces exist. The consequence is `studio.pr.merge` **merging a customer PR twice**, `studio.commit` pushing twice, and `delegate.openhands` dispatching a second paid external job. There is no unique index and no state-machine trigger on `agent_approvals` to catch it.

Worse, the expiry sweeper updates by id alone, so it can flip an already-`executed` approval back to `expired` with a fabricated error, after which the resume path tells the agent the tool was never run.

### 3.6 P0 — `resume-runs` replays live agent runs, every 60 seconds

It selects runs with `status='running'` and a stale checkpoint, then resumes them. The compare-and-swap inside `resumeAgentLoop` covers only `queued` and `waiting_approval`; `running` falls straight through. Stale is 2 minutes, the cron period is 60 seconds. Two or more workers replay the same checkpoint: doubled model calls, doubled credit debits, doubled tool execution including GitHub writes, and interleaved checkpoint writes.

### 3.7 P1 — budget meters lose updates permanently

`incrementBudget` reads `daily_usd_used`, adds in JavaScript, and blind-writes. Two concurrent calls both read 10.00 and both write 10.50. Unlike the balance check this is **not self-correcting**: the ledger is permanently short and the cap under-reports for the rest of the window. The adjacent `record_mission_usage` does the same job correctly as an atomic `SET x = x + n`.

---

## 4. What is stubbed, dark, or claimed but not implemented

### 4.1 P0 — the guidance loop has never carried a real outcome

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

### 4.2 P0 — the agent surface is a reader, not an operator

Measured against the lifecycle verbs, **19 of 20 are UI-only**; only "ingest a signal" has full coverage. The product's own agents run on a 55-tool registry that is unreachable from outside the process; external agents got 11 reads and 4 writes.

And three of those four writes **could never be authorized.** The mint path kept a second, hand-written scope allow-list reading `["write:signal"]`, never widened when the write layer grew to four tools. `record_decision`, `draft_spec` and `settle_outcome` were catalogued, dispatched, scope-checked and unit-tested while being impossible to grant.

```sql
SELECT slug, scopes, revoked_at FROM mcp_tokens ORDER BY created_at;
-- three tokens, all revoked, all carrying write:decision or write:spec
```
All three were minted by calling the SQL RPC directly, *around* the validator. Today there are zero live tokens. The global `interop_write_enabled()` gate is **true**, so the gate was never the blocker — the application was. **Fixed:** the list is now derived from `WRITE_SCOPE_BY_TOOL`, pinned by a test asking the question none of the existing ones did — not "does this tool declare a scope" but "can that scope be granted".

Still open: no idempotency key on any external write, no bulk operations anywhere (a user with 200 pending approvals has 200 clicks), errors returned as prose rather than typed codes, and no way for an agent to obtain a credential without a human visiting a web page.

### 4.3 P1 — built-but-unreachable code

27 server-function modules (~4,400 lines) have no production importer. The notable ones: `today-lanes.functions.ts` (559 lines — an entire Today information architecture that `/today` does not use), `calendar.functions.ts` (724 lines), `goals.functions.ts` and `loops.functions.ts` (the SW-4 GOAL and LOOP modes), `briefing.functions.ts`. `surface-registry.ts` independently self-declares 91 surfaces as `status: "planned"`, and the two lists largely agree — the server half was built, the UI half was not.

`funnel-week2` is the fleet's one genuinely dead loop: a complete, auth-guarded, `withJobRun`-wrapped endpoint with no cron entry in any of the 533 migrations. Rated P1 rather than P0 because its readers have no callers either — it is dead code driving a dead read.

### 4.4 P0 — the connector "connect" loop

`linear.functions.ts` reads only shared admin env keys and never the per-user vault token the OAuth flow mints. A user who **completes** the Linear OAuth round-trip is told *"Linear isn't connected yet. Link it from Integrations"* — pointed back at the flow they just finished. Same shape for `notion` and `google_docs`. Separately, 11 of 20 connector adapters are `stubAdapter`, whose `validate()` returns "adapter not implemented", so "Test it" fails for all 11.

### 4.5 P1 — silent failures that present as legitimate zeroes

706 call sites destructure `{ data }` without checking `error`. The consequential ones are where an empty array feeds a *claim*: the public proof page prints "0 supersessions caught" on any DB error; the drift health check fails open to `ok: true`; the loop-stall detector reports "idle" because it could not look, and its type has no `unknown` verdict to express the difference; the credits ledger records a delta computed from an unchecked read.

The generalization is precise and worth keeping: **a readiness flag that exists on a sibling type in the same file was omitted from this one, so the error state has nowhere to live and collapses into a legitimate-looking zero.** Five of these additionally carry a comment asserting the safety property the code does not have, which is exactly why they survived review.

---

## 4.6 The spine, traced end to end — P0

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

## 6. Priorities, and the reasoning

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
