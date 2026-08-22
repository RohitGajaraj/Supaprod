# The agent-first platform

> _Created: 2026-08-19 · Last updated: 2026-08-19_

> **Status: DIRECTION.** The first-principles redesign of the whole platform, not a reskin. Every claim below carries either a `file:line` or a production query, because this repo has shipped nine features that passed every test and did nothing. Board row: [`SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md). Design contract: [`../../design/DESIGN-SYSTEM.md`](../../design/DESIGN-SYSTEM.md).

**The one-sentence finding: Supaprod is excellent at proposing and structurally unable to finish, and the reason is that work waits to be visited instead of arriving.**

---

## 0. The evidence this is built on

> **The full findings register is [`audit-reports/agent-audit-2026-08.md`](./audit-reports/agent-audit-2026-08.md)** — roughly 60 agents' output, grouped by subsystem, with what is still open and has no queue item. This section is the headline; that file is the evidence, and it is where a finding gets its state updated when it is fixed.

Queried against production on 2026-08-19, not read from a doc.

| Measure | Value | Source |
| --- | --- | --- |
| Background job runs, 30 days | **305,635** | `job_runs` |
| Missions never started (`proposed`) | **232 / 349 (66%)** | `missions` |
| Missions completed cleanly | **27 (7.7%)** | `missions` |
| Opportunities parked in `backlog` | **327 / 410 (80%)** | `opportunities` |
| Agent runs failed or degraded | **1,037 / 1,703 (61%)** | `agent_runs` |
| Distinct `agent_runs.status` spellings | **6**, including both `complete` and `completed` | `agent_runs` |
| Decisions carrying a forecast | **1 / 304 (0.3%)** | `decisions.forecast_claim` |
| Forecasts ever resolved | **0** | `decisions.forecast_resolution` |
| Insights forecast loop, by contrast | **133 captured · 80 pushed · 35 resolved · 28 Brier-scored** | `insights` |
| Guardrail hits vs human gates | **8,535 vs 113** | `guardrail_hits`, `human_gate_events` |
| `cron.eval-tick` last run | **2026-08-05**, 14 days stale while every other tick ran today | `job_runs` |
| Agent slugs seeded / never used | **22 / 4** | `agents`, `agent_runs` |
| Authenticated routes / primary nav items | **84 / 12** | `src/routes/`, `src/lib/nav-model.ts` |
| Routes with zero inbound links | **6** | link scan |

**Two corrections to canon, found while measuring.**

1. **README understates the memory layer.** It lists as a known limit that `agent_memory` is scoped to the user rather than the workspace. All **1,164** rows carry a `workspace_id`; zero are user-only. The read path still needs verifying before the doc is rewritten, but the column-level claim is stale.
2. **The `halted` const at `loop.server.ts:793` is vestigial, not a defect.** The live halt path is inside `executeLoop` at `:1162` and returns before that closure runs. Recorded here so the next reader does not re-file it as a bug.

---

## 1. Current problems

### 1.1 The structural problem: destinations without flow

The surfaces are good. `runs.$missionId.tsx` carries a documented 2026-08-10 redesign that inverted activity-reporting into progress-reporting and promoted the agent's own account above its transcript. That is better thinking than most shipped agent consoles have.

The problem is that **reaching any of it requires knowing which of 84 routes to open.** `nav-model.ts` exposes 12 primary destinations and states the contract law outright: *"Features NEVER add nav items… everything else is a door reached from inside a destination, the command palette, or Settings."* Meanwhile `AGENTS.md` §4 names *"a capability with no door"* as **the dominant defect in this repo**. Both are true at once, and 232 unstarted missions are the receipt.

### 1.2 Two orchestration engines, and only one is documented

| | Spine / track layer | Mission / DAG layer |
| --- | --- | --- |
| Driver | `driveTrackOnce` — `src/lib/spine/driver.server.ts:990` | `advanceMissionCore` — `src/lib/ai/mission-advance.server.ts:956` |
| Heartbeat | `track-tick`, every 10 min, 5 tracks | `resume-runs`, every minute, 50 missions |
| Scope | all 7 stations | Build, in practice |
| Planning | **no LLM**, static route table | one `mission.plan` call, then model-free |

They meet at one line — `driver.server.ts:1189` — where the spine opens a mission **only** for Build. `architecture/orchestration.md` documents only the mission layer, so the engine that actually walks the lifecycle is undocumented.

**The consequence is not academic.** Six of seven stations run with `missionId: null`, and the steer consumer at `loop.server.ts:1085` is gated on `ctx.missionId && runId`. **Discover, Decide, Plan, Design, Ship and Learn cannot be steered at all** — not by policy, by a null.

### 1.3 Intent exists and is thrown away

Ask can genuinely start multi-step work. But:

- It works **by accident.** `contentForIntent` (`ask-intent.ts:61`) prefixes the literal string `@cos`, which resolves to the orchestrator and skips the classifier. The branch designed for this is dead: `api/chat.ts:681` requires `startingAgent`, only ever assigned inside the `if (isMission)` block above it. **`intent: "do"` cannot promote anything on its own.**
- With no seeded orchestrator, "Hand it over" **silently returns prose and starts nothing** (`api/chat.ts:658-675`).
- The correct station **is computed and discarded** — `routeIntent` runs at `:819`, then `void routed;` at `:829`.
- The SSE protocol defines `tool` and `station` frames. The client parses and accumulates both. **Nothing emits either** (`ask-sse.ts:95-99`). This is why you cannot see what an agent is doing while it does it.
- 10 of 11 `landing` kinds are unreachable; only `{kind:"mission", station:"build"}` is ever sent.
- Promote-to-record, slash commands, and `startProjectFromIntent` are live server code with **no reachable caller**.

### 1.4 You can steer an agent but you cannot stop one

Verified across the whole tree: `cancelRun|stopRun|abortRun|haltRun|pauseRun` returns **zero hits**.

- **Steering works** — `steerStudioSession` (`studio.functions.ts:1141`) lands a row the loop re-reads at the top of every iteration (`loop.server.ts:1084-1108`) and survives worker eviction. Build only, per §1.2.
- **`cancelMission` is not a brake.** `finalize` writes status **by id with no status precondition** (`loop.server.ts:797`), so a cancelled-but-executing run overwrites `cancelled` with `completed` on exit, having performed every side effect including GitHub writes.
- **No `AbortController`.** `callModel` accepts `signal?` (`runtime.server.ts:427`); the loop never passes one.
- The only true stop is the **workspace kill switch** (`runtime.server.ts:1640`) — all-or-nothing, per workspace.

### 1.5 The moat is half-wired, and the missing half is the half the strategy leans on

This is the most important finding in this document. It needs stating precisely, because the two halves of the loop are in very different health.

**The OUTCOME half is genuinely closed, and better wired than the docs claim.** A verdict moves `opportunities.confidence`, `ice_score` is a generated column, and ICE is the **first** key in the Decide comparator (`ranking.ts:319`). A verdict also aggregates into per-theme outcome support, which is rank key 4 (`decide.tsx:1240`, `ranking.ts:323`), gates autonomous promotion at support ≤ −2 (`promote.ts:172-178`), and orders `rankForPromotion`. The `match_agent_memory` RPC even re-ranks retrieval on it: `ORDER BY distance + CASE verdict WHEN 'validated' THEN -0.05 WHEN 'missed' THEN 0.05`. **A validated memory is literally pulled closer.** That is a real loop and it reads.

**The FORECAST half — the thing `CLAUDE.md` names as the only defensible asset — is a scoreboard, not an input.** Three separate failures compound:

1. **It is not captured where the decision is made.** `/decide` contains **zero forecast references**, and — separately — **`/decide` never writes a `decisions` row at all.** Grep for `createDecision`, `from("decisions")` and `decisions.functions` in `_authenticated.decide.tsx` returns nothing. The station named Decide settles a bet by updating an opportunity and drafting a spec. The only human forecast composer is a panel on `/brain` (`DecisionsPanel.tsx:481`, whose own comment says *"this is the only place a person can record one"*).

2. **An agent cannot capture one at all.** `decision.record` — the tool the Decide crew is explicitly instructed to call — has schema `{title, rationale, alternatives_considered, prd_id?}` (`registry.server.ts:3667-3672`). No forecast fields. The one function that could retrofit a forecast, `setDecisionForecast`, is reachable **only over MCP** (`mcp.functions.ts:1008`) and shipped with zero callers.

3. **A settled forecast re-ranks nothing.** `forecast_resolution` has three writers (human `settleForecast`, the gated `auditDueForecasts` sweep, MCP) and four readers — and every reader is a display or a queue filter. **No forecast column appears in `rankOpportunities`, `compareOpportunities`, `qualifies`, `rankForPromotion`, `scoreTheme`, `loadDecisionPrecedent`, the Critic prompt, or `match_agent_memory`.**

**So: 303 of 304 decisions were recorded by an agent through a tool that cannot express a forecast, and the one that has a forecast came from the manual form.**

The fix for capture is small, and the argument is already written in the tool's own description, applied to a different field:

> *"Requires at least one rejected alternative — a choice with nothing weighed against it is an assertion, not a decision, and is refused."*

The identical logic applies: **a decision with no forecast is an opinion, not a bet.**

**One further schema note.** `learnings` has no `decision_id` column. The verdict is written back against the **spec** (`prd_id`) and the **bet** (`opportunity_id`). The canonical sentence "written back against the decision that caused it" is doing work the schema does not do. Either the schema gains the edge or the sentence changes; today it is neither.

### 1.6 Measurement that has quietly stopped

- **The trust score's eval leg is structurally dead, and it is worse than a typo.** `trust.server.ts:144` selects `ai_evals.ai_event_id` and `score`. Verified against the live schema on 2026-08-19: the real join column is **`event_id`**, and **there is no `score` column at all.** `ai_evals` carries **seven named dimensions** — `hallucination_score`, `groundedness`, `relevance`, `coherence`, `toxicity`, `pii_risk`, `prompt_injection_risk` — plus `judge_model`, `judge_rationale` and `status`.
>
>   So this cannot be fixed by renaming a column. **Somebody has to decide how seven dimensions compose into one trust number**, which is a product decision about what "quality" means for an agent, not a patch. Until then PostgREST returns 42703, `evals = []`, and **20% of every agent's trust score is a frozen constant while agents graduate autonomy on that meter.** `architecture/observability.md:71` documents the leg as live.
- **`ai_events.agent_id` is selected and never written** — all six insert sites omit it.
- **`ai_traces` does not exist.** Zero occurrences repo-wide, despite `architecture/runtime.md:32` naming it as canon.
- **`cron.eval-tick` has not run since 2026-08-05.** Every other tick ran today.
- **~2,880 tick failures in 30 days** (`ci-poll-tick` 1,491, `sense-tick` 545, `resume-runs` 422, `goal-tick` 264, `track-tick` 157) surface nowhere.

### 1.6b The autonomous layer has no user-facing window

36 of 38 ticks are genuinely scheduled through `pg_cron` + `pg_net` (not Cloudflare triggers), verified by a migration that iterates live `cron.job` rows and fails unless every job targets production with a deadline. That fleet is a real asset. **A customer cannot see any of it.**

- **`job_runs` and `error_events` are read only by `/admin/observability`.** A user has no way to learn that the autonomous layer stopped working in their workspace.
- **There is no `notifications` table.** Notifications are computed on read; `/notifications` redirects to Settings, `/inbox` redirects to `/today`, `/briefing` redirects to Settings.
- **The digest reaches nobody who has not visited Settings.** `user_notification_preferences` has **no default-row trigger and no seeding migration**; its only writer is the settings panel upsert. `sendDueDigests` reads only rows that exist. **A user who never opens notification settings gets no digest, ever, no matter what ran overnight.** Compounding it, `generateDigest` stamps `last_digest_sent_at` *before* the send, so a missing `RESEND_API_KEY` silently burns the window.
- **Nine tables are written by ticks and read by nothing:** `scout_runs`, `scout_snapshots`, `scout_targets`, `loop_runs`, `capability_changes`, `funnel_milestones`, auto-approval rows in `workspace_audit_log`, `byok_fee_accrual`, and — most pointedly — **`insights.brier_score`**. The calibration number the entire forecast thesis rests on is computed nightly and rendered on no surface.
- **Dormant and deliberately-off are indistinguishable in the ledger.** `scout-tick` and `researcher-tick` return before `withJobRun` when their API key is missing, so `job_runs` cannot tell "never configured" from "switched off on purpose."

### 1.7 Governance inverted by an omission

**17 of 59 tools are uncatalogued** in `CONSEQUENCES`/`RISK_PROFILE`, and `toolRisk` fails closed to `"high"` (`tool-consequences.ts:394`).

Live consequence: `cluster.trigger` was deliberately set to `auto` on 2026-08-03 because it was 24 of 60 pending approvals in production (`defaults.ts:107-121`). Being uncatalogued, it scores `high`, `resolveToolMode:187` demotes it to `confirm`, and an approval is queued anyway. **The stated policy is silently reversed.**

Separately, `isWrite = category === "write" || "planning"` (`loop.server.ts:1379`), so the `memory` category **can never queue an approval** — making `memory.promote`'s `confirm` default inert.

And the doctrine's own test is failing in production: six agents sit at a **100% approval rate** (`critic`, `discovery-scout`, `strategist`, `qa`, `prd-writer`, `orchestrator`). `GOVERNANCE-PRINCIPLE` says the product should offer *"You approved 14 of these without changes. Let Engineer do it alone?"* Nothing does.

### 1.7b The approval queue is the product's most urgent scaling failure

**At zero real users the queue holds 53 pending approvals, 39 of them over 24 hours old, blocking 14 missions. The oldest has waited 627 hours — 26 days.** At enterprise scale this is not a friction point, it is the reason the product gets abandoned.

Classifying all 313 approvals ever raised, by what the record says about them:

| Class | Tools | Raised | Pending | What it means |
| --- | --- | --- | --- | --- |
| **Genuinely irreversible** — `studio.pr.merge`, `deploy.promote`, `schema.migrate`, `rollout.ramp` | 4 | 82 | 7 | Correct. Should never graduate. |
| **Perfect record** — approved every time, asks every time | 10 | 87 | 7 | `backlog.prioritize`, `studio.commit`, `tasks.create`, `research.synthesize`, `decisions.kill`, `prd.draft`, `ci.logs`, `mission.finalize`, `github.issue.create`, `memory.remember` |
| **Never once approved** — rejected 100%, still offered | 2 | 14 | 0 | `delegate.openhands` 0/7, `calendar.create` 0/7. Asking seven times to be refused seven times. |
| **Never answered** — asked 130 times, decided zero times | 11 | 130 | 39 | The question was not worth opening the queue for. |

**Only 26% of approvals ever raised were for something a human genuinely had to rule on.**

Three separate mechanical causes, each independently fixable:

1. **`cluster.trigger` alone is 18 of 53 pending (34%).** It was set to `auto` on 2026-08-03 *because* it was 24 of 60 pending approvals. Being uncatalogued, `toolRisk` fails closed to `high`, `resolveToolMode:187` demotes it to `confirm`, and it queues anyway. **A fix already made is being overridden by a missing table row.**
2. **The trust ramp has effectively never landed.** `agent_tool_modes` holds **1 row**; `trust_graduation_proposals` holds **2**. The graduation machinery exists and has fired twice in the product's life.
3. **Nothing expires with a stated default.** `approvals-tick` runs every minute, yet 39 items are over 24h old and one is 26 days old. An approval with no expiry is not a question, it is litter.

**One data-integrity note:** average time-to-decide computes to **−58.7 hours**, i.e. `decided_at` precedes `created_at`. That is backfilled or seeded rows with incoherent timestamps, and it means no current measurement of approval latency can be trusted until it is cleaned.

### 1.8 The roster is drifted, not over-staffed

**Correction, recorded because the first version of this document got it wrong.** An earlier draft proposed merging 15 dispatchable agents down to 9. That is the wrong move, and the evidence against it is strong enough to overturn the instinct.

MAST (arXiv:2503.13657, UC Berkeley — 1,600+ annotated multi-agent traces, inter-annotator κ=0.88) measures **task-verification failures at 21.30%** of all multi-agent failures and **"disobey role specification" at 0.5%**. Supaprod's maker→reader pairing at every write station *is* the verification guard. **Merging the pairs would optimise a 0.5% failure mode by deleting the mitigation for a 21% one.**

The apparent industry disagreement resolves the same way. Anthropic's multi-agent research system beat single-agent Opus by 90.2% on breadth-first research; Cognition's *Don't Build Multi-Agents* argues against it for coding. Both name the same deciding variable, and it is **split on read, serialise on write.** Supaprod already does exactly that: three parallel agents at Discover (read-only), sequential maker→reader at the five write stations. The architecture is aligned with the evidence.

The independent controlled ablation (arXiv:2512.08296, 260 configurations, 6 benchmarks, 5 topologies) reports performance swinging from **+80.8% to −70.0%** purely on architecture-task fit, and finds that *"architectures without centralized verification tend to propagate errors more than those with centralized coordination."* That is an argument for keeping the reader, not removing it.

**So the roster problem is drift, not headcount.** The live roster is 22 distinct slugs across 16 workspaces (283 rows = replication, not 283 agents):

- **`engineer` is `status: "deprecated"` yet seeded into all 16 workspaces** — and both `builder` and `engineer` render as **"Engineer"** at the Build station. Two agents, one display name, at one station. `stationCrew()` filters `status === "active"`, so `engineer` can never be dispatched. This is precisely the defect migration `20260801230000_three_missing_station_agents.sql` was written to fix, recurring at one slug.
- **`reactor` and `archivist` are `status: "active"` and seeded into zero workspaces** — the inverse bug. `driver.test.ts` only guards `tier: "cast"`, so it cannot see them.
- **11 orphan legacy rows** — `copilot` ×4, `stakeholder` ×4, `competitor-watcher`, `growth-strategist`, `operations`.
- `release-manager` appears in `agent_approvals` but is in no roster.

Fixing those three takes the roster to 16 clean slugs, one per job, all dispatched — **with zero architectural change.**

**The one genuine structural gap: tools are not bound per agent.** `agent_tools` is keyed on `user_id`, not `agent_id` (`access.server.ts:39`). Every agent sees the identical 59-tool list; differentiation is by system prompt only. This matters for a measured reason rather than a tidiness one: a Llama-3.1-8B case study failed with 46 tools loaded and succeeded with 19. **A specialist wins partly by not seeing the other 40 tools.** `capToolsByRisk` already implements the defensible half of this and its docstring gets the reasoning right.

**Naming: keep it exactly as it is.** BCG Henderson Institute / MIT IDE, published in HBR, found managers applied **16% less scrutiny** to identical work attributed to a named, employee-framed agent, with **no adoption benefit**. Supaprod's roster is already job verbs — Watch, Research, Listen, Prioritize, Challenge, Draft, Plan, Design, Critique, Engineer, Review, Verify, Announce, Measure, Guide. That is the evidence-backed answer and it should not drift toward personas. The one exception to tidy: `orchestrator` displays as "Chief of Staff", the only person-title in the set.

### 1.9 Context does not travel on the path that matters

Two handoff mechanisms with different shapes. On the live orchestrated path, `dispatchReadySteps` builds `{task, context:{mission_step_idx, orchestrator_run_id, rationale, attempt}}` with **no artifacts and no evidence_ids by design** (`mission-advance.server.ts:743-758`).

**Step N+1 receives no reference to step N's output.**

The evidence gate that would catch this is computed every hop and never enforced (`handoff.server.ts:389`), because arming it would break the verify-green corrective loop, whose handoff carries exactly the shape `validateHandoff` rejects.

### 1.10 Meridian has no vocabulary for an agent working

93 tokens, 36 components, all 19 beautifui.dev components ported, debt frozen at 5,864. Genuinely strong — and missing every primitive an agent-first surface needs:

| Missing | Evidence |
| --- | --- |
| Run timeline | zero matches for `timeline` in `src/components/meridian/` |
| Stop / interrupt control | the only `Stop` in the product is a graph replay toggle |
| Destructive action variant | `Action` has `default\|primary\|quiet`; `--mrd-fail` is reserved for outcomes, so an interrupt has **no token to wear** |
| Dialog / modal | `--mrd-scrim` and `--mrd-shadow-pane` defined, consumed by nothing |
| Cost / spend display | nothing renders spend, in a credit-metered product |
| Multi-agent presence | `MarkStack` takes **one shared state for the whole stack** |
| Command palette | `Search` is a filter field, not a palette |
| Forward-looking plan | `Thinking` variant `Steps` is retrospective; `TaskStatus` has no `pending` and no `skipped` |

The measured symptom: **`--mrd-you` has 97 usages, `--mrd-agent` has 59** — not because agents matter less, but because there are five surfaces for "a person is required" and essentially one for "a machine is working." `StreamingText` and `ToolChips`, whose entire subject is an agent working, are wired **only to the gallery**.

---

## 2. The agent-first platform model

### 2.1 The move: from a work-shaped model to a judgment-shaped one

**Today's object model is work-shaped:** `workspace → product → mission → mission_steps → agent_runs`, with a parallel `spine_tracks` doing the same job differently. Signals, themes and opportunities hang off the side. Every agent product on the market has approximately this shape.

**That is the shape that commoditizes.** Executing work is precisely what gets cheaper on every model release. A model that is twice as good makes the `runs` table cheaper to fill and changes nothing about whether the work was worth doing. Ten years of that pressure leaves a work-shaped product competing on price with whoever has the cheapest inference.

**So the model should be judgment-shaped**, because judgment is the half with no fast oracle. Code compiles in seconds; *"was that worth building"* takes weeks to quarters. Four primitives, and every existing surface becomes a view over them:

```
   QUESTION  ──────►  BET  ──────►  RUN  ──────►  VERDICT
   an open matter     a committed    the work      what actually
   the company is     answer, with   the bet       happened,
   tracking           its forecast   causes        written back
        ▲                                               │
        └────────── re-ranks which questions ───────────┘
                     are worth asking next
```

| Primitive | What it is | What it absorbs today |
| --- | --- | --- |
| **Question** | An open matter, with evidence under it and candidate answers against it. States: `open` → `answered` → `settled` → `reopened` | `signals`, `themes`, `opportunities`, `insights`, `assumptions` |
| **Bet** | A committed answer **carrying its forecast at the moment of commitment**: the claim, what we expect, how we will know, by when, and how much rope we gave it | `decisions`, committed `opportunities`, the autonomy dial |
| **Run** | The work a bet causes. A route through stations, a crew, a stream, gates, artifacts, spend | `missions`, `spine_tracks`, `mission_steps`, `agent_runs` — **the two orchestration engines unify here** |
| **Verdict** | What happened, joined back to the bet that caused it | `learnings`, `prds.outcome`, `forecast_resolution` |

**Three things this buys that the current model cannot.**

1. **The forecast has an obvious home.** Today it is eleven columns on `decisions` used once in 304, because a decision is a record rather than a commitment. A Bet that cannot be created without a forecast makes the moat structural instead of optional.
2. **`learnings` gains the edge it is missing.** Today a verdict is written back against a spec and a bet, and `learnings` has **no `decision_id`** — so the canonical sentence "written back against the decision that caused it" describes something the schema does not do. Under this model the Verdict attaches to the Bet by construction.
3. **Questions are the asset, and they are what nobody can buy.** A competitor can copy the seven stations in a quarter. They cannot acquire *the questions this company has asked and how well it answered them*, because that is produced only by running the loop.

> **Why this is the ten-year model rather than the next-release one.** Assume inference is free and frontier-quality by 2032. Every part of this product that *does work* is then worth roughly zero. What is still scarce is a company's own record of what it believed, what it chose, and what happened — labelled, joined, and time-ordered. A judgment-shaped model accumulates that as a by-product of operating. A work-shaped model accumulates a very large log.

### 2.2 The three laws

**Law 1 — Work arrives; you do not fetch it.**
Every capability is reachable from where you already are. A surface you must remember to visit will not be visited: 232 of 349 missions sit at `proposed` and 327 of 410 opportunities sit in `backlog`, not because the surfaces are bad but because reaching them requires knowing which of 84 routes to open. This replaces navigation-as-primary with intent-as-primary.

**Law 2 — One primitive in flight: the Run.**
Stations stop being *places* and become **phases of a Run**. They keep their distinctiveness as lenses and their own information models; they lose their monopoly on being the way in.

**Law 3 — Visible, steerable, stoppable.**
An agent whose work cannot be watched cannot be trusted; one that cannot be redirected cannot be corrected; one that cannot be stopped cannot be governed. All three are currently partial or absent, and they are the price of admission for autonomy rather than a nice-to-have.

### 2.3 Context scope: evidence is product, method is workspace

**Founder ruling requested and made 2026-08-19. Measured first, because the intuition and the schema disagreed in an instructive way.**

**Multi-product is already the majority state, not a future case: 11 of 17 workspaces have more than one product and 7 have four.**

#### What the schema does today

| Carries `product_id` | Does **not** |
| --- | --- |
| `signals` · `themes` · `opportunities` · `decisions` · `prds` · `rag_chunks` · `connection_bindings` | **`learnings`** · **`agent_memory`** · **`house_rules`** |

**Evidence carries a product. Everything learned from it drops one.** The moment a verdict is written the product dimension is discarded, so a measurement taken in product A is retrievable, unlabelled, while ranking product B.

#### The ruling

**The instinct "scope memory to the product" is right about the dominant harm and wrong if applied universally.** `agent_memory.kind` already splits the two cases:

| Kind | Rows | What it is | Scope |
| --- | --- | --- | --- |
| `reflection` | 1,111 | an agent reflecting on how it worked | **method** → workspace |
| `correction` | 10 | a person corrected the agent | **method** → workspace |
| `precedent` | 28 | a settled outcome | **evidence** → **product** |
| `note` | 26 | mixed | declared, defaults to product |

- **Evidence is product-scoped, and never promotes.** A measurement about product A is not true of product B. Leaking it makes the director *wrong*, and for an agency running three clients in one workspace it is a confidentiality breach rather than noise.
- **Method is workspace-scoped.** *"Check the window before blaming deliverability"* is true everywhere. If each product re-learns it, the compounding claim is dead.
- **Agent track record is workspace-scoped.** It is a fact about the agent, not about the product.
- **Default is PRODUCT.** Safe by default; promotion is the deliberate act.

#### Promotion is a first-class event, and its machinery already exists

`memory_candidates` is already a staging table and `house_rules` is already the workspace-level standing rule with a `pending → approved` flow that reaches **every agent's system prompt**. Neither is product-aware. Making them so turns a lesson graduating from one product to the whole workspace into **a visible, governable moment** instead of an accident:

```
  product memory  ──►  memory_candidate  ──►  house_rule (workspace)
  (evidence stays)      (method proposed)      (approved, reaches every agent)
```

That is also the honest form of the compounding claim: not *"it remembers"*, but *"a lesson earned in one product graduated, and here is who approved it."*

#### Packaging: products are free, isolation is what is sold

**Do not charge per product.** A second product costs more **credits**, and credits are already metered, so a product fee double-charges — once for usage, once for existing. That is the mistake [`pricing-architecture.md`](../../strategy/pricing/pricing-architecture.md) already records burying itself, when a band picker rendered *"$2000/mo for volume whose underlying cost is about $2."*

| Tier | What multi-product buys |
| --- | --- |
| **Any** | unlimited products, each with its own evidence boundary |
| **Business** | cross-product **governance**: who may promote a lesson to the workspace, and per-product connector binding (`connection_bindings` already carries `product_id`) |
| **Enterprise** | **provable** isolation: a cross-product audit showing nothing crossed, and per-product connector credentials |

This adds no pricing axis. It is what Business already sells — *"the collaboration and governance layer, not capacity"* — extended to the boundary that matters once a workspace holds more than one product.

#### The defects this ruling exposes

1. **`learnings` and `agent_memory` need `product_id`.** Until then evidence cannot be scoped at all. **Migration, so it is Claude's.**
2. **`agent_autonomy` has neither `workspace_id` nor `product_id`** — it is keyed per user, so an agent a colleague spent three months graduating arrives untrusted for the next person. **The record travels and the permission does not, which is backwards:** the record is the evidence, the permission is the conclusion drawn from it.
3. **`retrievalProductId` is a real option on the Ask hook and the pane never sets it**, so Ask retrieves workspace-wide regardless of where you are standing. Any multi-product story is wrong until that is wired.


## 3. Reimagined lifecycle and surfaces

### 3.1 The four surfaces

**`/` — Home.** Not a dashboard. A composer, what needs you, and what is running. Three regions, in that order. The composer is the primary control on the primary surface; everything else on the page is either a thing waiting for you or a thing in motion. Replaces `/today` and absorbs `/inbox`, `/notifications`, `/approvals`, `/briefing`.

**`/r/:runId` — the Run.** The main event and the surface most of the product now lives inside. Carries: the intent as written, the plan the crew committed to, the live stream, inline gates, artifacts as they land, spend as it accrues, and the outcome with its forecast. Absorbs `/runs/*`, `/build/*`, `/studio/*`, `/missions/*`, `/traces/*`.

**`/brain` — the Brain.** What has been learned and what it now advises. Keeps `/knowledge` as its graph view. This is the only surface that gets *more* valuable with time, and it is the one that should open with an assertion rather than a search box.

**`/guardrails` — policy.** What agents may do, spend, and must clear. Absorbs `/boundary`, `/budgets`, `/evals`, `/prompts`, `/crew` autonomy config, `/engine-room`.

### 3.2 Stations survive as lenses, not destinations

The seven stations keep their names, glyphs, and distinct information models. What changes is their **role**: from *the way work is reached* to *a view over runs in that phase, plus the tools specific to it*.

`/discover` remains the place to triage the signal stream and see 327 backlog opportunities ranked. It stops being the only way to start discovery work. Both paths coexist:

- **Flow (default):** state an intent → a run is created → it walks the stations → you watch and steer.
- **Station (deliberate):** open `/decide` and triage the queue directly, when that is genuinely the job.

This satisfies "reduce screens without reducing station distinctiveness": the stations are not merged or weakened, they are demoted from mandatory waypoints to optional workspaces.

### 3.3 The commitment moment

The single most important new interaction. Between intent and execution, the crew **publishes a plan and waits briefly**:

```
You said:  "the onboarding drop-off after email verify is getting worse"

Discover → Decide → Plan → Build → Ship
   ·         ·        ·       ·       ·

The crew will:
  1  read Intercom + PostHog for verify-step drop-off      Watch
  2  red-team the three candidate causes                   Challenge
  3  write a cited spec for the top one                    Draft
  4  open a PR behind a flag                               Engineer
  5  ship to preview, hold production for you              Verify

  Spend ceiling $5.00 · production deploy needs you

  [ Start ]   [ Change the plan ]   [ Just answer me ]
```

Three things this earns. It replaces a long approvals queue with **one approval at the top**, which is exactly the doctrine's "policy not permission." It makes the route legible, which is the thing `routeIntent` already computes and throws away. And it gives the user a redirect point *before* spend, which is cheaper than steering after.

**The evidence that this is the right place for the gate.** Anthropic instrumented real Claude Code sessions and found users make **~70% of planning decisions and only ~20% of execution decisions**, while a single prompt triggers around ten agent actions and sometimes over a hundred. People want to own the plan and delegate the execution. Gating the steps fights that; gating the plan serves it.

**And the reason a step-level gate cannot be rescued: 93% of permission prompts are approved.** Anthropic names the mechanism as approval fatigue. **A gate that is clicked through is worse than no gate, because it manufactures the appearance of review while producing none of it.** Our own record says the same thing in different numbers — six agents at a 100% approval rate, and eleven tools asked 130 times and answered zero times.

### 3.4 The gate sets the dial, and the dial is the forecast

This is the most important single interaction in the redesign, and it resolves §1.5 without adding a form.

The plan gate should not ask "may I proceed?" It should ask **how much rope this piece of work gets**, the way Claude Code's plan gate does — three answers in one keystroke, scoped to the work just read:

```
  Start it, and let it run          →  auto within policy, report at the end
  Start it, check with me on writes →  confirm at each external write
  Keep planning                     →  redirect before any spend
```

**The choice is a forecast.** Deciding how much autonomy a run earns, **before the outcome is known**, is a recorded belief about that work — exactly "what a team believed would happen, recorded before the outcome was known," which `CLAUDE.md` names as the only thing a competitor cannot reconstruct. It leaves no trace unless something captures it at the moment of the call, and this is that moment.

So the forecast stops being a three-field form on `/brain` that one person filled in once. It becomes **a by-product of the one gate that has to exist anyway** — which is precisely the posture the positioning canon already argues for: the forecast as a by-product of doing the work, whose first consumer is the agent doing the next piece, never a scoreboard for a reviewing executive.

**What still needs saying explicitly.** The dial answers *how confident are we*. It does not answer *what do we expect to happen* or *how will we know*. Those two stay as fields on `decision.record` (§9 Slice 2). The dial is the third leg and the one that was never going to be typed into a form.

### 3.5 Showing many agents: an inbox, not a control room

The instinct in an agent product is to render every agent working at once. The evidence says that is the wrong surface.

**Showing many agents *working* is bad; showing many agents *needing you* is good.** Cursor shipped eight-way parallelism with no compare-and-pick surface and per-turn review died with it. Human active focus caps at three or four items. Anthropic's own sizing guidance is blunt: start with three to five agents, and *"three focused teammates often outperform five scattered ones."*

The one multi-agent surface that demonstrably works is an **inbox sorted by who needs you**: grouped as needs-input → ready-for-review → working → done, one-line summaries in present-participle verbs, reply without leaving the list, idle rows self-hiding and collapsing to "N idle agents" past three.

That is what `/` (Home) should be, and it is a very different object from a dashboard of activity. It also gives `MarkStack` its real job (§7) and explains why the fix there is per-mark state rather than a bigger stack.

---

## 4. Interaction, navigation, and workspace model

### 4.1 Navigation

Rail collapses from 12 rows to 4, plus the station lens strip:

```
  ⌘K  ─────────────────────────────────────  the composer, anywhere

  Home          what needs you · what is running
  Runs          everything in flight, and everything that finished
  Brain         what it learned, and what it now advises
  Guardrails    what agents may do, spend, and must clear

  ── stations ──────────────────────────────  lenses, not doors
  01 Discover  02 Decide  03 Plan  04 Design  05 Build  06 Ship  07 Learn
```

The `g`-prefix chord law from `nav-model.ts` survives unchanged and gets simpler, since fewer doors compete for letters.

### 4.2 The composer

One control, reachable by `⌘K` from every surface, that:

1. classifies intent (exists — `ask-intent.ts`)
2. resolves the route (exists — `routeIntent`, currently discarded at `api/chat.ts:829`)
3. **shows the plan and waits** (new — §3.3)
4. creates the run and streams it (exists, needs the dead `forcedDo` branch repaired)

It must never silently degrade to prose. The current failure — no seeded orchestrator means "Hand it over" answers instead of acting — becomes an explicit, named state.

### 4.3 Many products in one workspace

A workspace is not one product, and the model breaks in a specific way if that is ignored: the brain is workspace-wide and the evidence is product-scoped, so a naive switcher either leaks measurements between products or walls off the learning that should generalise.

**The rule: what was *learned* crosses; what was *measured* does not.**

| Crosses products | Stays inside one |
| --- | --- |
| Standing rules (`house_rules`) — they reach every agent prompt | Signals, themes, evidence |
| Workspace memory and precedent | Questions, Bets, ranking |
| Policy, autonomy and spend ceilings | Runs and their artifacts |
| Track record per agent | Verdicts and the ICE they move |

So *"check the window before blaming deliverability"* is available to every product, while *"activation rose 11 percent"* is a fact about one.

**Switching product changes the evidence, never the boundaries.** The rail, the policy and the crew are workspace-level and do not move. What changes is the Question queue, the runs in flight, and what Home reports. That means a switch is a **filter, not a context reload** — which is also what makes it fast enough to be worth doing.

**Intent resolution when several products exist.** The composer must not guess silently. Three cases, in order:

1. **You are inside a product** — intent resolves there, and the composer says so.
2. **Intent names something unambiguous** — a spec, a run, a bet that exists in exactly one product. Resolve there and say which.
3. **Genuinely ambiguous** — ask, once, with the candidates. This is the one place a question beats a guess, because starting a run against the wrong product spends real money on the wrong evidence.

> **The defect this design has to survive:** `retrievalProductId` is a real option on the Ask hook and **the pane never sets it**, so Ask currently retrieves workspace-wide regardless of where you are standing. The product chip described in its own comments was never carried over. Any multi-product story is wrong until that is wired.

### 4.4 Progressive disclosure

Three depths, and a user should be able to stop at any one:

| Depth | Shows | For |
| --- | --- | --- |
| **Glance** | one line: what is running, what needs you | the rail, the header, a glance between meetings |
| **Watch** | the run stream: plan, steps, tools, artifacts, spend | the default when something is in flight |
| **Inspect** | the trace: every model call, prompt, token, guardrail hit | debugging, audit, the Engine Room |

The Engine-Room doctrine is preserved exactly: depth 3 is reachable on demand and never in the way.

---

## 5. Every surface, traced end to end

**Verified against code and production on 2026-08-19, not read from the blueprint** — which was checked and found stale in six places. Each block is Purpose → Intent → Inputs → Agent → Backend → Writes → Handoff → Next → Learning, then the gap that is actually there.

Four changes apply to **all seven stations** and are not repeated in each block:

1. **Every station gets a `missionId`.** Removes the `station === "build" ? … : null` at `driver.server.ts:1189`. Six of seven currently run with null, which is why steering reaches one station.
2. **Every station emits `station` and `tool` SSE frames.** The protocol exists; nothing emits it.
3. **Every handoff carries artifact references.** `dispatchReadySteps` passes none by design (`mission-advance.server.ts:743-758`), so step N+1 cannot reach step N's output.
4. **Every hold reason renders.** 16 exist with operator sentences written (`driver.ts:652-684`) and surface nowhere.

---

### 01 Discover

**Purpose** turn everything customers and the market say into a small number of things worth attention.
**Intent** *"what is going wrong, and what is new."*
**Inputs** ~20 pull connectors, each calling `writeSignals` (`sources/sink.server.ts:61`); the Scout (`scout/emit.server.ts:50`); MCP sources; `researcher-tick`; manual capture; and the agent's own `signals.log`.
**Agent** Watch, Research, Listen — three in parallel, which is correct: read-only, breadth-first, independent sources.
**Backend** `writeSignals` screens, dedups on `external_id`, stamps `source_kind`, embeds inline, and writes a `stage_events` row per signal. `clusterSignalsCore` (`cluster.server.ts:103`) takes ≤80 unclustered signals, asks a model for themes, scores novelty, claims signals atomically via `.is("theme_id", null)`, and attaches leftovers through `match_themes` above 0.8 similarity. `promoteClustersOnce` (`promote.server.ts:236`) applies `qualifies` — frequency ≥8, severity ≥4, confidence ≥0.75, max 2 per workspace per sweep — and opens a `spine_tracks` row.
**Writes** `signals` · `themes` · `spine_tracks` · `artifact_lineage` · `stage_events`
**Handoff** both. Automatic: `cluster-tick` every 10 min clusters then promotes, and `track-tick` walks the track. Human: `promoteThemeToOpportunity` writes an `opportunities` row.
**Next** a ranked bet appears in Decide.
**Learning** outcome support **gates** autonomous promotion — a theme at support ≤ −2 refuses to auto-start (`promote.ts:172-178`) — and orders `rankForPromotion`.

> **The gap: eleven write paths bypass the sink.** `sink.server.ts:1-8` says so itself — it claimed to be the only one until 2026-08-15. The public webhook `ingest-signals.ts:138` is among them. Each bypass skips dedup, `source_kind`, the injection screen, the inline embedding **and the `stage_events` row**, so those signals are invisible to the surface that reports where the loop stands.
> **Second gap:** the Discover queue a person reads has **no outcome term at all**, and that is deliberate (`brain/discover-outcome-term.test.ts`) — a learning reaches a theme only through a promoted opportunity, and promoted themes are excluded from that ranking, so the term would evaluate against an empty set.

---

### 02 Decide

**Purpose** rank what is worth doing, and red-team it before a person sees it.
**Intent** *"what should I build next, and why that."*
**Inputs** `listOpportunities`, `listThemes`, `listLearnings`, `getBriefAlignment`, `getPrecedentCitations`.
**Agent** Prioritize, then Challenge. Sequential, because the second reads what the first filed.
**Backend** a nine-key deterministic sort (`ranking.ts:317-336`): ICE → Critic verdict → brief alignment → **outcome support** → corroboration → confidence → impact → created_at → id. The Critic loads precedent from past settled outcomes (`critic.server.ts:245`) before ruling.
**Writes** `opportunities` · `prds` · `roadmap_audit` · `stage_events` · `artifact_lineage`
**Handoff** human click runs `generatePrd` and lands on the spec. Autonomous: strategist then critic.
**Next** a cited spec at Plan.
**Learning** ICE is a generated column driven by `confidence`, which outcomes move — so a settled verdict changes rank key 1 and rank key 4 at once.

> **The gap, and it is the moat's:** **`/decide` never writes a `decisions` row.** Grepping `createDecision`, `from("decisions")` and `decisions.functions` in that route returns nothing. The station named Decide settles a bet by updating an opportunity and drafting a spec. It also contains **zero forecast references**. So the one station whose job is deciding neither records a decision nor captures a belief about it.

---

### 03 Plan

**Purpose** turn a call into a spec somebody could build from, with its citations attached.
**Intent** *"write down exactly what we are building and why."*
**Inputs** a decision, or an opportunity.
**Agent** Draft, then Plan.
**Backend** `prd.draft` (`registry.server.ts:3254`) reads the opportunity if passed, drafts the body with its own model call, inserts `prds`. The human path adds `savePrd`, `generateTaskGraph`, `createGithubIssueForPrd`, `dispatchStudioSession`, `chooseDesignRoute`.
**Writes** `prds` · `tasks` · `opportunities` · `decisions` · `roadmap_audit` · `spine_track_members` · `stage_events` · `artifact_lineage`
**Handoff** automatic, behind two real guards: `produced-nothing` (a station that ran cleanly and filed nothing does not advance, `driver.server.ts:1453`) and `nothing-to-hand-on` (it filed the wrong kind, judged against the **next** station's need, `:1508`).
**Next** Design, or straight to Build when the surface exists.
**Learning** the spec is what a learning is later written back against, via `prd_id`.

> **The gap:** `prd.draft` writes `opportunity_id: opp?.id ?? null` and its own description tells the agent nothing in the toolset creates an opportunity. So **every autonomously drafted spec has a null `opportunity_id`**, severing the bet→theme route a learning needs. The codebase compensates with a second route through `spine_track_members`, which is a real repair rather than a workaround, and worth keeping.

---

### 04 Design

**Purpose** put a surface in front of the spec before code is written.
**Intent** *"show me what this looks like."*
**Inputs** a `prds` row, `design_memory` rules, `prd_flows`.
**Agent** Design, then Critique.
**Backend** `design.draft` (`registry.server.ts:3838`) now does three things: `prepareScaffoldSpeculative` → upserts `prd_scaffolds`, inserts the `prototypes` share record, inserts `prototype_files`.
**Writes** `prd_scaffolds` · `prototypes` · `prototype_files` · `prds.design_gate_status` · `design_memory` · `prd_flows`
**Handoff** automatic. `STATION_NEEDS.build` is `{kinds: ["prd","task"]}` — **a design artifact is not required to reach Build.**
**Next** Build.
**Learning** `design_memory` accumulates rules the next scaffold reads.

> **The gap:** the design gate is **human-only by construction.** `decideDesignGate` hardcodes `actor: "human"` (`design-scaffold.functions.ts:1424`) with no agent tool and no cron. And `designGateBlocksDispatch` is not called from `studio.stage`, so **a driver-run Build never meets the gate at all.** This is the station most obviously not agent-first, and it is a skipped station in most real routes.

---

### 05 Build

**Purpose** write the code, run the checks, open the pull request.
**Intent** *"make the change."*
**Inputs** the spec, the design section, a mission.
**Agent** Engineer, then Review.
**Backend** `runAgentLoop` resolves agent, workspace and model, applies concurrency backpressure at 5 running per workspace, resolves the tool list from the registry, sets an adaptive step budget capped at 40, and resolves approval mode through `resolveToolMode` (`loop.server.ts:162`).
**Writes** `agent_runs` · `agent_run_checkpoints` · `agent_messages` · `agent_approvals` · `tool_calls` · `mission_steps` · `studio_changesets` · `studio_changes` · `builder_file_claims`
**Handoff** **human click.** A merged changeset does not become production by itself.
**Next** Ship.
**Learning** clean completions trigger reflection and an autonomy auto-advance (`loop.server.ts:816`).

> **The gap:** this is the only station a person can steer, and 61% of all agent runs finish `failed` or `completed_with_failures`. `builder` carries **118 approvals against 88 runs** — more approvals than runs.

---

### 06 Ship

**Purpose** put it in front of customers, and hold the one call that cannot be undone.
**Intent** *"release it, safely."*
**Inputs** a merged changeset with a green preview deploy.
**Agent** Verify, then Announce.
**Backend** `promoteChangesetToProductionCore` (`deployments.functions.ts:788`) refuses a non-merged changeset, requires a successful preview, deploys that preview's commit with `production: true`, writes the `deploy.promote` receipt, **closes out every spec the release carries** via `closeOutSpecOnPromote`, and inserts the `launch_plans` row with its `check_by` date.
**Writes** `deployments` · `agent_approvals` · `prds` · `launch_plans` · `changelog_entries` · `announcements` · `stage_events` · `artifact_lineage`
**Handoff** **automatic into Learn**, armed by `prds.shipped_at`. That `check_by` date is what makes the outcome get measured without anyone remembering.
**Next** the outcome comes due.
**Learning** the release is the event that starts the clock on the forecast.

> **What holds:** `release.publish` is pinned to `review` in three independent places and never graduates. That is correct and should stay.
> **The gap:** announcements are entirely human — zero agent tools, zero crons.

---

### 07 Learn

**Purpose** settle what actually happened, and change what gets surfaced next.
**Intent** *"was that worth doing."*
**Inputs** `prds.shipped_at`, a due `launch_plans.check_by`, a due forecast horizon.
**Agent** Measure, then Guide.
**Backend** `applyOutcome` (`outcome.functions.ts:448`) is one shared core with **five callers, three of them not human**: the human `recordOutcome`, the hourly `runOutcomeReviews`, MCP `settle_outcome`, and the `learning.record` tool. It moves `opportunities.confidence`, recomputes ICE, inserts the learning with `opportunity_id`, calls `rememberOutcome`, writes `prds.outcome` with an RLS-refusal check, publishes the changelog, infers supersession, and **holds the deciding agent's trust arc on a miss**.
**Writes** `learnings` · `prds` · `opportunities` · `agent_memory` · `memory_recall_log` · `changelog_entries` · `playbook_proposals` · `artifact_lineage`
**Handoff** back into Decide's ranking, automatically.
**Next** the queue reorders.
**Learning** this station **is** the learning loop. `match_agent_memory` even re-ranks retrieval on it: `ORDER BY distance + CASE verdict WHEN 'validated' THEN -0.05 WHEN 'missed' THEN 0.05`.

> **The gap, and it is a live crash:** `learning.record` accepts `verdict: "uncertain"` and its description tells the agent to *"say uncertain rather than guessing."* The `learnings.verdict` CHECK permits three values and no migration ever widened it, and the insert throws on error. **An obedient agent following the tool's own instruction gets a 23514 and the tool call fails.**
> **Second gap:** a human pressing "too early to tell" writes `prds.outcome_check_by`, which only the human queue reads. The agent sweep never reads it and settles the spec anyway.

---

### Brain — what the crew reads before it acts

**Purpose** make past judgment reachable by whoever, or whatever, needs it next.
**Intent** *"what do we already know about this."*
**Inputs** `agent_memory` (1,170 rows, **all workspace-visible**), `rag_chunks`, `decisions`, `house_rules`, settled outcomes.
**Agent** Guide writes; every other agent reads.
**Backend** `indexer-tick` chunks and embeds changed content hourly; `derive-tick` writes insights; `memory-tick` decays low-importance rows nightly; `retro-tick` and `house-rules-tick` distil standing rules from agent traces and from human learnings respectively.
**Handoff** **into every agent's system prompt**, at `loop.server.ts:756`. This is the single most important edge in the product and it is genuinely wired.
**Learning** an approved `house_rule` reaches every future agent. That is the mechanism behind the compounding claim, and it holds.

> **Measured:** 101 recalls in production had a reader who was **not** the memory's author. The memory travels, and README understated this for weeks.
> **The gap:** `insights.brier_score` — the calibration number the entire forecast thesis rests on — is computed nightly and **rendered on no surface at all.**

---

### Guardrails (Engine Room) — spend, quality, safety, the record

**Purpose** hold the boundaries a person set in advance, so autonomy is safe enough to sell.
**Intent** *"what are they allowed to do, and what has it cost."*
**Inputs** `guardrail_hits` (**8,535**), `ai_budgets`, `credit_ledger`, `ai_evals`, `drift_snapshots`, `job_runs`, `error_events`.
**Agent** none by design. This is where a person sets policy.
**Backend** the AI chokepoint enforces budget → credits → cache → pre-guard → RAG → provider → post-guard → humanize → log, on every call with no second path. `checkKillSwitch` runs on every model call, which is why pausing a workspace genuinely stops every running loop at its next step.
**Handoff** policy resolution into `resolveToolMode` at dispatch.
**Learning** `drift-tick` opens and resolves incidents; `self-improve-tick` proposes changes.

> **Measured:** guardrails fire **8,535 times against 113 human gate events** — policy outruns permission 75 to 1, which is the doctrine working.
> **The gaps:** the trust score's eval leg is dead (no `score` column exists — seven named dimensions do), `eval-tick` has not run since 2026-08-05, and **`job_runs` and `error_events` are readable only from `/admin`**, so a customer cannot learn that their autonomous layer stopped.

---

### Runs and Approvals — the work in flight, and the few calls that block

**Purpose** show what is happening, and hold only what genuinely needs a person.
**Inputs** `agent_runs`, `agent_run_checkpoints` (the only place run history lives), `agent_approvals`, `human_gate_events`.
**Backend** five stranded-work sweepers run in `resume-runs`; a run silent past 10 minutes is halted; a mission with no steps past 20 minutes is abandoned. **`waiting_approval` is never swept** — a human gate has no timer, deliberately.
**Handoff** a decided approval is injected into the loop at resume.
**Learning** `agent_scorecard` and `agent-track-record` compute per-agent and per-tool records on read.

> **The gap:** 53 approvals pending at zero users, oldest **627 hours**, and only 26% of the 313 ever raised were for something irreversible. Covered fully in §1.7b and §6.2.

---

### Settings, Notifications, and the workspace

**Settings** owns what agents may do (`agent_autonomy`, `agent_tool_modes`), what is connected, and who is a member. **`agent_tool_modes` holds one row and `trust_graduation_proposals` holds two** — the graduation machinery has fired twice in the product's life.

**Notifications has no table.** It is computed on read from `agent_approvals`, `agent_runs`, `ai_budgets` and `drift_incidents`. `/notifications` redirects to Settings, `/inbox` redirects to `/today`.

> **The gap that matters most here:** `user_notification_preferences` has **no default-row trigger and no seeding migration**, and `sendDueDigests` reads only rows that exist. **A user who never opens notification settings receives no digest, ever, no matter what ran overnight.** Compounding it, `generateDigest` stamps `last_digest_sent_at` *before* the send, so a missing API key silently burns the window.

**Workspace and products** are the tenancy spine: account → workspace → product, with RLS keyed on membership in the database rather than in application code. That is what makes autonomy safe here, and it is not changing.

---

### Cross-station flows that are not any one station's job

| Flow | State |
| --- | --- |
| **Signal → theme → track → seven stations** | Wired and running: `cluster-tick` every 10 min, `track-tick` every 10 min |
| **Outcome → confidence → ICE → Decide rank** | Wired, and reads. The loop genuinely closes here |
| **Outcome → theme support → autonomous promotion gate** | Wired. Refuses to auto-start a theme whose bets have missed |
| **Outcome → `agent_memory` → every agent prompt** | Wired, including a retrieval re-rank on verdict |
| **Forecast → resolution → anything** | **Open.** Three writers, four readers, and every reader is a display |
| **Failure → a person** | **Open.** ~2,880 tick failures in 30 days reach no user surface |
| **Approval record → autonomy graduation** | **Open.** The machinery exists and has fired twice |


## 6. Agent architecture, autonomy, memory, checkpoints

### 6.1 The roster: keep the shape, fix the drift

Per §1.8, the pairing is the verification guard and must not be merged. The work is:

- **Unseed `engineer`** from all 16 workspaces and resolve the duplicate "Engineer" display name at Build.
- **Delete the 11 orphan legacy rows** and the `release-manager` ghost.
- **Seed or deprecate `reactor` and `archivist`**, and extend `driver.test.ts` to guard `tier: "crew"` — the check that would have caught this.
- **Bind tools per agent.** The single genuine structural change, and it is a context-hygiene fix, not an org chart.

### 6.2 The approval policy engine

This is the answer to §1.7b, and it is the doctrine already written down finally expressed as code. `GOVERNANCE-PRINCIPLE` says *"a long approvals queue is a policy failure to surface, not a workload to render."* Today the queue renders.

**Every tool call resolves on two axes the codebase already models, then a third it does not.**

```
                    reversible from inside the product?
                         yes                 no
  leaves the      ┌──────────────────┬──────────────────┐
  workspace?  no  │  NEVER ASK       │  EARN IT         │
                  │  prd.draft       │  schema.migrate  │
                  │  tasks.create    │                  │
                  │  memory.remember │                  │
                  ├──────────────────┼──────────────────┤
              yes │  EARN IT         │  ALWAYS HUMAN    │
                  │  github.issue    │  studio.pr.merge │
                  │  studio.commit   │  deploy.promote  │
                  │                  │  release.publish │
                  └──────────────────┴──────────────────┘
```

**Four rules, each traceable to evidence rather than taste.**

1. **Never-ask is never asked.** Reversible and internal means the record is the control, not the click. This alone removes the 10 tools with a perfect approval record.
2. **Always-human never graduates.** GitHub Copilot's cloud agent structurally cannot approve or merge its own PR regardless of history; that is the right precedent for `release.publish`. Supaprod already pins it in three places — keep all three.
3. **Demotion is automatic; promotion needs a person.** This is the asymmetry that makes the ladder safe, and it is the *only* automated autonomy movement any shipped product has: Claude Code's circuit breaker pauses auto mode after 3 consecutive or 20 session-level blocks. No shipped product raises a ceiling on track record alone. So: N consecutive rejections drops a rung automatically and says so; every rise requires a human, informed by the record ("approved 44 of 47 at the point of decision").
4. **A tool rejected every time is disabled, not re-offered.** `delegate.openhands` 0/7 and `calendar.create` 0/7 are the product asking a question whose answer it already has, seven times.

**Rule 5, and it is the one that compounds: the gate offers to retire itself.** Codex proposes a persistent prefix rule inline the moment you approve a command twice; Claude Code mines your own transcripts to write the allowlist for you. **The accumulated allowlist is the asset** — every gate answered should make the next one less likely, or the queue is a treadmill. Supaprod's doctrine already specifies the exact interaction (*"You approved 14 of these without changes. Let Engineer do it alone?"*) and nothing implements it, while `agent_tool_modes` holds one row and `trust_graduation_proposals` holds two.

**Three queue mechanics that must ship with it:**

- **Every approval declares its own default and expires into it.** Reversible → proceeds and is logged. Irreversible → cancels and says why. Nothing waits 627 hours.
- **Batch by decision, not by tool call.** 53 approvals blocking 14 missions should present as **14 questions**, not 53.
- **Stop asking questions nobody answers.** 11 tools raised 130 approvals and had zero decided, ever. If a class of question goes unanswered 130 times, the question was wrong. Pick the safe default, record it, and surface it as a fact rather than a request.

**A caution that must ship with the ladder.** The same BCG/MIT finding above means a visible autonomy ladder is itself a trust signal that can reduce human scrutiny without any change in agent competence. Instrument whether review time falls after a promotion. If it does, the ladder is costing more than it earns.

### 6.3 The Run Map: a canvas for watching, not authoring

A node-graph canvas is the standard shape for workflow tools (n8n, Flowise, LangGraph Studio) and it exists because **the user authors the workflow**. Supaprod's premise is the inverse: the director decides the route. **If the user must draw the graph, layer 01 is dead** and the product is a worse Zapier.

But the route data already exists — the spine's static station table, and `mission_steps.depends_on` is a genuine DAG. So there is an honest version, and it earns its place for a reason that is not decoration:

> **The Run Map.** A horizontal station spine, expandable into the step DAG. **Editable before start** (§3.3's commitment moment), **live during** (stations light as they execute, holds render their reason), **replayable after**.

**Why it is more than a diagram.** A founder ruling already requires that *a skipped station is a decision on the record with a reason, never a silent omission.* Today that is a policy with no interaction, and nothing enforces it. On a map, dragging Design out of the route **is** the gesture, and the reason prompt is the natural next beat. The canvas turns an unenforced policy into a control.

It also gives the 16 hold reasons a home. They exist with operator sentences already written (`driver.ts:652-684`) and surface nowhere; a held station is exactly a node that should be able to say why it stopped.

**The constraint that keeps it legal.** Engine-Room doctrine: the user meets the *output* of the machine, never the machine. So nodes are **outcome-labelled** — "Read Intercom and PostHog for verify-step drop-off" — and never tool-labelled (`web.search`, `signals.list`). A node graph of tool calls is precisely the machine leaking into the experience, and it is what makes most agent-workflow UIs feel like developer tooling.

**Explicitly not proposed:** a free-form node editor, a trigger/condition/branch palette, or user-authored automations. Those are a different product and they contradict the director layer.

### 6.2 Autonomy

The ladder is sound — `observing → proving → trusted → ambient`, defaulting to `trusted` with no row (`trust.server.ts:265`), with hard floors that no earned autonomy can lower. Three fixes:

1. **Repair the eval leg** (`trust.server.ts:144`, wrong column names). 20% of the score is currently a constant.
2. **Catalogue the 17 missing tools** so `toolRisk` stops failing closed and inverting stated policy.
3. **Ship the graduation offer.** Six agents sit at 100% approval. The doctrine already specifies the interaction; nothing implements it.

### 6.3 Stop, and what it must guarantee

A per-run stop that:
- passes an `AbortController` into `callModel` (accepted at `runtime.server.ts:427`, never passed)
- writes terminal status **with a status precondition**, closing the `cancelled → completed` overwrite at `loop.server.ts:797`
- refunds the credit draw, as the halt path already does
- is reachable inline from the run stream, not only from a settings page

---

### 6.4 Memory: four tiers, four lifetimes

The brief names memory and the current design has one word for four different things. They differ in **lifetime** and **blast radius**, and conflating them is how a run leaks context into a workspace or a workspace fails to learn from a run.

| Tier | Holds | Lifetime | Scope | Today |
| --- | --- | --- | --- | --- |
| **Working** | the run's own conversation and tool results | the run | the run | `agent_run_checkpoints`, **5,953 rows — the only place run history lives** |
| **Handoff** | what travels from one agent to the next | one hop | the mission | `agent_messages` with a typed `HandoffPayload` |
| **Workspace** | what the organisation has learned | decayed, not permanent | **workspace** | `agent_memory`, **1,170 rows, all workspace-visible** |
| **Precedent** | settled outcomes, retrievable by similarity | permanent | workspace | joined via `match_agent_memory` |

**Three changes.**

1. **Handoff must carry references, not just a task string.** `dispatchReadySteps` builds `{task, context:{step_idx, run_id, rationale, attempt}}` with **no artifacts and no evidence ids, by design**. So step N+1 cannot reach step N's output and re-derives it. Every hop carries `artifacts[]` and `evidence_ids[]`, and the `agent.handoff` tool schema gains `memory_refs` — which it does not have, so **every model-initiated hop travels without memory today**.
2. **Recall is already logged; start reading it.** `memory_recall_log` holds **7,147 rows** and nothing renders what the crew read before it acted. That is the single cheapest way to make an agent's reasoning inspectable, and the data is already there.
3. **Precedent retrieval already re-ranks on verdict** — `ORDER BY distance + CASE verdict WHEN 'validated' THEN -0.05 WHEN 'missed' THEN 0.05`. This is the best-built part of the brain and it is invisible. Show it: when an agent cites precedent, say that the memory was pulled closer *because that bet landed*.

> **What must not happen:** working memory promoted to workspace memory automatically. A run's intermediate reasoning is not a lesson. `memory_candidates` exists (20 rows) as the staging table for exactly this, and promotion stays gated.

### 6.5 Checkpoints: resume exists, rewind and fork do not

`agent_run_checkpoints` carries **5,953 rows** and is described in code as the only place run history lives. Today it powers exactly one behaviour: **resume**. `resume-runs` picks up a stalled run and continues it, and a steer survives worker eviction because it is marked consumed only after the checkpoint persists. That is real and it works.

Two behaviours the substrate already supports and nothing exposes:

- **Rewind.** Return a run to a named checkpoint and continue from there. The state is stored; nothing reads it backwards. This is the correct answer to *"it went wrong four steps ago"*, and today the only options are steer forward or start over.
- **Fork.** Branch a run from a checkpoint to try a different approach without losing the first. `missions.replayed_from_mission_id` already exists, so the schema anticipated this and no surface reaches it.

Both are the pattern Claude Code and Cursor ship as checkpointing, and both are cheap here because the hard half — durable, resumable state — is built and running at scale.

> **The honest constraint:** rewind is safe for reasoning and unsafe for side effects. A run that opened a pull request cannot un-open it by rewinding. So a rewind **replays reasoning and refuses to replay writes**, and says which steps it will not re-run. That distinction is already modelled: `CONSEQUENCES` carries reversibility per tool, for 42 of 59 tools, and K-11 closes the other 17.

### 6.6 Failure recovery, and what does not exist

**What is built and works:** three model-call retries on rate limit and server error; one automatic mission-step retry with genuine exponential backoff; three station attempts then a correction loop capped at two; and **five stranded-work sweepers** — a run silent past 10 minutes is halted, a mission with no steps past 20 minutes is abandoned, and `waiting_approval` is deliberately never swept because a human gate has no timer.

**What does not exist, verified by grep across the whole tree:**

- **No dead-letter queue.** Zero matches for `dead_letter` or `dlq`.
- **No rollback, compensation or saga.** A failed step's side effects — a PR opened, a spec written — are never undone; the mission terminalizes `completed_with_failures`, which is **452 runs**.
- **No `AbortController` in the loop**, though `callModel` accepts one.

**The design position:** compensation is the wrong goal and reversibility is the right one. Do not build a saga engine. Instead make every write **either reversible or gated**, which is what the two-axis policy engine in §6.2 already decides — and then a failure needs no compensation, because nothing irreversible happened without a person.

### 6.7 Observability: the tree that is reconstructed instead of recorded

`ai_events` holds **58,678 rows** and every model call lands there. Spans are **two columns**, `trace_id` and `parent_event_id`, and three paths break the tree: `logAiEvent` never sets a parent, so every out-of-band event is a forced root; embeddings set neither; and **`tool_calls` carries `trace_id` but no `parent_event_id` and no `ai_event_id`**, so the thought → tool → observe chain is rebuilt by timestamp in JavaScript rather than by edges.

`ai_traces` **does not exist** anywhere in the repo, despite `architecture/runtime.md` naming it as canon.

**The change is one column, not a system.** Give `tool_calls` a `parent_event_id` and the tree records itself instead of being inferred. Everything downstream — the run timeline, the tool stream, per-agent attribution — becomes a query rather than a reconstruction.

> **And the thing that makes attribution possible at all:** `ai_events.agent_id` exists in the schema and **all six insert sites omit it**. Until that is written, "which agent cost what" cannot be answered from the record, only estimated.

## 7. Meridian, and the extensions this needs

Every extension below is justified against Meridian's own law: a token earns its place on the second caller, is named for meaning rather than appearance, is measured in both grounds, and carries its argument in the file.

| Extension | Why it is a genuine gap |
| --- | --- |
| `--mrd-stop` | An interrupt is an **intent**, and the colour law reserves `--mrd-fail` for **outcomes that happened**. There is currently no token an interrupt control may wear. Second caller: stop-run, and discard-changeset. |
| `Action` variant `destructive` | Same argument at the component layer. `surface-parts.tsx` has `default\|primary\|quiet` and `Approve`; none may carry a stop. |
| `RunTimeline` | Answers "what happened at 03:12, and what was it waiting on until 03:40" — the question a lead actually has. `--mrd-fade-rail` and `mrd-fade-scroll` were built for exactly this column and are unused. |
| `ToolStream` | Append-as-it-arrives log with pin-to-bottom. **Built, and it is the only view of this kind now.** The finished-array summary that sat beside it in the gallery was deleted 2026-08-21 by founder ruling: the run route's steps ledger already renders every tool call, so mounting it would have put one fact on screen twice in two rhythms. `ToolStream.tsx`'s own header carries the argument. |
| `PlanCard` | Forward-looking, committed steps with `pending`/`skipped` states. `TaskStatus` has neither, and `taskStatus()` collapses unknowns to `blocked`, misreporting a not-yet-started step as stuck. |
| `MarkStack` per-mark state | Currently one shared state for the whole stack; cannot render three agents in three states, which is the normal case for a seven-station loop. |
| `Dialog` | `--mrd-scrim` and `--mrd-shadow-pane` are defined and consumed by nothing. "Stop and discard 40 minutes of work" needs a confirm that is not native chrome. |
| `Spend` | Nothing in the system renders cost, in a credit-metered product whose colour law already names "a cap nearly spent" as a canonical `--mrd-hold` case. |
| `--text-mrd-*` bindings | 277 hand-written `text-[Npx]` values across `meridian/`, 13 off-ladder. The type ladder is documented and unenforceable, and the ratchet cannot see arbitrary Tailwind values. |

**Deliberately not proposed:** a sixth status colour. The system refuses one in writing and the refusal is correct.

### 7.1 Two corrections to Meridian itself, measured against the reference class

Meridian's own standing rule is that beautifui.dev is the floor and the mechanics get ported from source. These two were never ported because they are not visible in a component, only in a token file.

**Motion is roughly twice as slow as the premium reference, and the asymmetry is inverted.** Meridian ships `--mrd-d-press: 120ms`, `--mrd-d-move: 220ms`, `--mrd-d-enter: 420ms`. Linear's shipped scale, read from its bundle, is `0s / 0.15s / 0.1s / 0.25s / 0.35s` — the entire scale sits **below** Material's 200-500ms band, and the governing choice is **enter 0s, exit 0.15s**.

That inversion is the finding. **Things should appear instantly and leave gently.** Waiting 420ms for a panel to fade in reads as the software thinking; watching it leave over 150ms reads as considered. Every product in the premium tier does this and Meridian currently does the opposite. `--mrd-d-enter` should approach zero for appearance, with the easing budget spent on exit and on movement between states.

**Body weight should be 450, not 400.** Linear sets running text at 450 and caps the scale at 15px. Meridian's `--mrd-w-regular: 400` with a 14px base is one notch lighter than the reference at the same size. On the neutral OKLCH ground Meridian uses, 400 reads thin rather than quiet.

**And a loading policy Meridian has no rule for.** The reference behaviour: **no loader at all for the first 1000ms**, explanatory text only 800ms after that, dismissal in 0.1s, and **all animation disabled in the error state**. Supaprod currently shows `BrandWait` after 150ms with a 300ms minimum — so a 200ms navigation is *guaranteed* to flash a loader for 300ms, which is slower-feeling than showing nothing. The design contract's own standing item 6 says *"fix the latency, not the spinner"*; this is the token-level expression of that.

These are cheap changes with a large perceived effect, and they are the difference between a system that is correct and one that feels expensive.

**Reference gap to close:** Plan, Ship and Learn have never been researched against a proven product, per `REFERENCE-PATTERNS.md:18-26`, while Discover, Decide, Design and Build have. Three of seven stations have no reference floor.

---

## 8. Capability gaps

| # | Gap | Class | Cost |
| --- | --- | --- | --- |
| 1 | 17 tools uncatalogued → `toolRisk` fails closed → 34% of the pending queue | governance | S |
| 2 | No approval policy engine; 74% of approvals were avoidable | product | M |
| 3 | Approvals never expire into a stated default (oldest 627h) | product | S |
| 4 | `decision.record` cannot express a forecast | product / moat | S |
| 5 | A settled forecast re-ranks nothing — read only by displays | product / moat | M |
| 6 | `/decide` writes no `decisions` row at all | product | M |
| 7 | `learnings` has no `decision_id`; canon says otherwise | data | M |
| 8 | Six of seven stations have `missionId: null` → unsteerable | engineering | S |
| 9 | `tool` / `station` SSE frames unemitted | engineering | S |
| 10 | No per-run stop; `cancelled` overwritten by `completed` | engineering | M |
| 11 | Trust eval leg queries non-existent columns → 20% frozen | data | S |
| 12 | `learning.record` accepts `uncertain`; CHECK permits 3 → live 23514 crash | data | S |
| 13 | `forcedDo` branch dead; Ask degrades to prose silently | product | S |
| 14 | Digest unreachable without a Settings visit (no default row) | product | S |
| 15 | Handoff carries no artifact refs on the live path | engineering | M |
| 16 | `eval-tick` dead since 2026-08-05 | ops | S |
| 17 | ~2,880 tick failures/30d surface nowhere; ops is admin-only | ops | M |
| 18 | 9 tick-written tables read by nothing, incl. `insights.brier_score` | product | M |
| 19 | Meridian lacks 9 agent-first primitives | design system | L |
| 20 | Two orchestration engines, one undocumented | architecture | L |
| 21 | Agent roster drift: `engineer` deprecated yet seeded; duplicate display name | data | S |
| 22 | Agent tools not bound per agent (all 59 visible to all) | product | M |
| 23 | Plan/Ship/Learn have no reference research | design | M |
| 24 | 6 routes with zero inbound links | IA | S |
| 25 | `agent_runs.status` has 6 spellings incl. `complete`/`completed` | data | S |
| 26 | `agent_approvals.decided_at` precedes `created_at` (−58.7h avg) | data | S |
| 27 | 11 direct-insert bypasses around the signal sink | engineering | M |

---

## 9. Implementation plan

Ordered by leverage per unit of risk. Each slice ships independently and is verifiable in production.

### How the judgment-shaped model lands without a rewrite

**It is not a migration and there is no big-bang.** The 2026-07 rebuild failed by deleting in one move, and the retired design systems still run for that reason. The four primitives in §2.1 arrive as **naming and one column at a time**, over existing tables:

| Primitive | Lands as | Existing table |
| --- | --- | --- |
| **Bet** | `decisions` gains required forecast fields and becomes the thing Decide writes | `decisions`, already carrying eleven forecast columns |
| **Verdict** | `learnings` gains `decision_id`, closing the edge the canon already claims | `learnings` |
| **Run** | the spine's Build-only `missionId` special case is removed, so one concept covers all seven stations | `missions` + `spine_tracks` |
| **Question** | `themes` and `opportunities` are presented as one object with a state, before any schema moves | `themes`, `opportunities` |

**Nothing is dropped, nothing is renamed on day one, and every step is independently shippable.** The model is a way of seeing the tables that already exist; the schema catches up where it is genuinely wrong, which is exactly two edges — a forecast that is required rather than optional, and a verdict that points at the bet that caused it.

---

### Slice 1 — Collapse the approval queue (days)
Catalogue the 17 missing tools so `toolRisk` stops failing closed. Ship the two-axis policy engine (§6.2): never-ask for reversible+internal, always-human for irreversible+external, earn-it between. Auto-disable a tool rejected N times running. Give every approval a declared default and an expiry. Batch by decision rather than by tool call.
**Verify:** pending approvals fall from 53 toward the ~7 that are genuinely irreversible; `cluster.trigger` stops queueing; nothing sits past its expiry.

### Slice 2 — Make the moat real (days)
Add `forecast_claim`, `forecast_how_we_will_know`, `forecast_horizon_date` to `decision.record`'s `argsSchema`, refused without them exactly as the tool already refuses a decision with no rejected alternative. Make `/decide` write a `decisions` row. Then [`forecast-resolution-plan.md`](./forecast-resolution-plan.md) has something to resolve — and a settled forecast must feed at least one ranker, or it stays a scoreboard.
**Verify:** `decisions_with_forecast_claim` moves off 1; a resolved forecast changes a rank.

### Slice 3 — Make agents visible (days)
Emit `station` and `tool` SSE frames. Build `ToolStream` and `RunTimeline` in Meridian. Surface tick failures and the nine unread tables — starting with `insights.brier_score`.

> **Corrected 2026-08-21.** This slice used to end "Wire `StreamingText` and `ToolChips` out of the gallery."
> **Both components were deleted that day by founder ruling and that instruction must not be followed.** The
> answer block's `sources` input had no data source anywhere in the product (0 of 90 `prds` carry citations,
> the run record has no citation column, and `ai_evals.citations` holds a judge's citations about an
> evaluation, a different object), and the chips block was a fourth view of a run where three had just been
> unified. **What is left of this slice is emitting the frames**, which is the half that was ever blocked on
> data rather than on a surface. Reasons in `ToolStream.tsx`'s header and `ledger/claude-log.md` under
> "K-17 · RULED".
**Verify:** a run can be watched end to end without opening a trace; a failing tick is visible to a non-admin.

### Slice 4 — Repair the meters (days)
Fix `trust.server.ts:144` column names. Widen the `learnings.verdict` CHECK or narrow the tool enum, closing the `uncertain` 23514 crash. Restart and alarm `eval-tick`. Add `liveness-tick` to the watchdog manifest. Clean the incoherent `decided_at` timestamps. Fix the roster drift (§6.1).
**Verify:** trust scores move; an agent saying `uncertain` no longer throws.

### Slice 5 — Make agents governable (1-2 weeks)
Per-run stop with `AbortController` and a status precondition. `--mrd-stop`, `Action` destructive variant, `Dialog`. Give every station a `missionId` so steering works on all seven.
**Verify:** a run stops mid-tool-call and its credit draw is refunded; a Decide-station run accepts a steer.

### Slice 6 — The composer, the commitment moment, the Run Map (2-3 weeks)
Repair the `forcedDo` branch. Stop discarding `routeIntent`. Build plan-and-wait and the Run Map (§6.3). Emit all 11 landing kinds.
**Verify:** a sentence typed on any surface starts a run whose route is visible and editable before spend; removing a station records a reason.

### Slice 7 — Navigation collapse (2-3 weeks)
Four primary surfaces; stations become lenses. Re-home the orphaned routes rather than deleting them.
**Verify:** every one of the 84 routes is reachable from the rail, the composer, or a run.

**Sequencing note.** Slices 1-4 are small, independent, and each closes a wire that is currently open — they should ship before any navigation work, because they make the redesign measurable. Slice 1 leads because the approval queue is the failure that scales worst: 53 pending at zero users is a product that cannot be handed to a customer. Slice 7 is the largest and should not start until 3 and 5 have proven the run surface carries its weight.

---

## 10. Validation criteria

Behavioural, measured in production, not in tests. This repo has shipped nine features that passed every test and did nothing.

| # | Criterion | Today | Target |
| --- | --- | --- | --- |
| 1 | Pending approvals | **53** (39 over 24h) | **< 10, none over its expiry** |
| 2 | Approvals raised for reversible+internal tools | 87 | **0** |
| 3 | Approvals raised then never decided | 130 | **0** |
| 4 | Oldest pending approval | **627h** | **< its declared expiry, always** |
| 5 | Decisions carrying a forecast | 0.3% | **> 90%** |
| 6 | Forecasts resolved at horizon | 0 | **> 0, then rising** |
| 7 | A resolved forecast changes a rank | never | **demonstrably** |
| 8 | Missions still at `proposed` after 24h | 66% | **< 20%** |
| 9 | Agent runs clean (`completed`) | 38% | **> 70%** |
| 10 | Runs stopped by a user, ever | 0 (impossible) | **possible, and used** |
| 11 | Stations that accept a steer | 1 of 7 | **7 of 7** |
| 12 | Tick failures visible to a non-admin | 0 of ~2,880 | **all** |
| 13 | Tick-written tables with no reader | 9 | **0** |
| 14 | Users reachable by digest without a Settings visit | 0 | **all** |
| 15 | Routes with zero inbound links | 6 | **0** |
| 16 | `agent_runs.status` distinct spellings | 6 | **4, enumerated** |
| 17 | Agents with a duplicate display name at one station | 2 | **0** |
| 18 | `--mrd-agent` usage vs `--mrd-you` | 59 vs 97 | **near parity** |
| 19 | Meridian ratchet total | 5,864 | **never higher** |

> **Re-measured 2026-08-20 15:35 (`ledger/claude-log.md`). Every figure is a query; the queries are in that entry.**
>
> | # | Original | now | | # | Original | now |
> | --- | --- | --- | --- | --- | --- | --- |
> | 1 | 53 | **36** | | 9 | 38% | **37.8%** |
> | 3 | 130 | **66** | | 16 | 6 | **6** |
> | 4 | 627h | **644h** | | 17 | 2 | **0 live · 10 in catalog** |
> | 5 | 0.3% | **0 of 55 real** | | 18 | 59 v 97 | **92 v 141** |
> | 6 | 0 | **0** | | 19 | 5,864 | **5,542** |
> | 8 | 66% | **66.5%** | | | | |
>
> **PUBLISH LANDED 2026-08-20 13:47 UTC** (`latest_commit_sha 61d3176ee`, one commit behind main). **Today's code is live**, so the standing *"committed TypeScript is not deployed TypeScript"* caveat no longer applies to it. Criterion 1 measured 38 at 19:35, +2 on four hours, **but nothing raised since 10:20** while `cron.cluster-tick` ran at 13:50 and `sense` logged 38 calls in four hours -- so the path is live and raising none. **The stop predates the deploy by 3.5 hours, so the deploy does not explain it and I could not find what does.** Clean test from here: any new `cluster.trigger` approval after 13:47 means the catalogue is not working.
>
> **Criterion 1 was regressing and it was not waiting on work, it was waiting on a publish.** All 8 of its live rows are `cluster.trigger`, first seen 2026-08-19 20:20 and still arriving; every other pending tool is frozen in the seeded July batch. K-11 fixed the cause in application code, and application code is not live until the founder publishes.
>
> **Criterion 3 is `status='expired'`, and the definition matters:** `decided_at IS NULL` returns 151, because it folds in 36 pending and 49 rows this lane cancelled deliberately. Recording a number without its query is how that gets read as an 85-point regression.
>
> **19 is the only criterion that improved**, by K-27 deleting 322 occurrences of dead code. Criteria 2, 7, 10, 11, 12, 13, 14 and 15 were not re-measured this tick.

> ---
>
> **RE-MEASURED 2026-08-22, and two readings in this table are traps. Split every criterion by demo versus real workspace or the number means nothing.**
>
> | # | Was | Now | Read |
> | --- | --- | --- | --- |
> | 1 | 53 → 36 | **38**, all over 24h | still ~4x target |
> | 4 | 627h → 644h | **694h** | still growing; nothing expires |
> | 5 | 1 of 304 | **146 of 290** | **TRAP — see below** |
> | 6 | 0 | **91** | **TRAP — see below** |
> | 8 | 232/349 | **232/349** | unchanged |
> | 9 | 38% | **816/2094 = 39%** | unchanged |
> | 16 | 6 | **6** | unchanged |
>
> **Criteria 5 and 6 have not improved.** Grouped by workspace: Helio Labs (demo) holds 124 decisions, 115 with a forecast, 72 resolved; Sample workspace (demo) holds 35 / 31 / 19; both backdated to February. **Across all six real workspaces: 131 decisions, 0 with a forecast, 0 resolved.** Every forecast in the product is seed data. A summary reading "50% coverage" is reading demo rows.
>
> **The cause is one fact, and it sits under most of this table.** Zero agent runs in the last 24 hours. The last agent run in the product's history is **2026-08-21 12:10** — ten minutes before the AI-spend leak was recorded closed. That fix excluded sample workspaces, and **no real workspace has ever had a spine track** (`tracks_ever_real = 0`, against 52 open tracks on sample workspaces). So the autonomous layer now has nothing to drive, while a 37-job `pg_cron` fleet fires **7,497 times a day**. The fix was correct; what it revealed is that the loop has never run on real data.
>
> **Queries:** counts from `agent_approvals`, `decisions` joined to `workspaces` on `is_sample`, `agent_runs`, `spine_tracks`, `job_runs`, run against production via the Lovable MCP on 2026-08-22.

---

## Addendum, 2026-08-22 — what shipped after this document was written

Verified in source. **Do not re-do these.**

| Claimed here as open | Actual state 2026-08-22 |
| --- | --- |
| §9 Slice 7, navigation collapse, "2-3 weeks" | **SHIPPED.** The rail is exactly Today / Runs / Brain / Guardrails with Settings as a foot icon — §4.1 as proposed. ~50 former routes are redirect stubs |
| §6.3 per-run stop, `cancelRun\|stopRun\|...` "returns zero hits" | **SHIPPED.** `stopRun` at `src/lib/agent-runs.functions.ts:137`, with the credit refund and the terminal-status precondition this section asked for |
| §7 `--mrd-stop` needed | **EXISTS**, `src/styles/meridian.css:573`, argument in the file |
| §7 `RunTimeline`, `PlanCard`, `Dialog`, `Spend` missing | **ALL EXIST**, plus `ToolStream`, `PlanGate`, `AgentInbox`, `RunMap`. Only `MarkStack` per-mark state remains |
| §1.10 "93 tokens, 36 components" | **STALE.** Measured on disk: **111 `--mrd-*` tokens, 47 components**. ~26 components appear in no inventory document. Take inventory from the directory, rules from the contract |

**But the primitives are unreachable.** Counting real importers outside `src/components/meridian/`, each of `RunTimeline`, `ToolStream`, `RunMap`, `PlanGate`, `PlanCard`, `AgentInbox`, `Chat` and `DiffTable` has exactly **one**, and it is `_authenticated.meridian.tsx` — the gallery, rendering fabricated data. This is the founder's 2026-08-20 sequencing ruling working as intended (*"primitives build before the things that use them"*); **the second half, the wiring, has not happened.** So the remaining work in Slice 3 and Slice 6 is integration, not construction.

**And §1.5's forecast finding needs one correction.** `forecast_resolution` *is* written today — by a `forecast-auditor` agent (`src/lib/brain/forecast-audit.server.ts`) on `calibrate-tick`, auto-settling only where the linked spec's outcome was settled by a human and confidence >= 0.75, compare-and-swap guarded so a human wins the race. What stands is the ranking half: no forecast column appears in any ranker. And per the board, *"the auto-settle leg has never run on a real row."*

**The headless surface is larger than §5 credits.** Three machine doors exist: `/api/mcp` (hand-built, bearer `mcp_tokens`, 11 read + 6 governed write tools, JSON-RPC 2.0, idempotency, rate-limited, audited), `/mcp` (auto-generated by `@lovable.dev/mcp-js`, Supabase OAuth, 4 read tools), and a full **A2A** surface with a public agent card at `/.well-known/agent.json`. Writes — including `record_forecast` and `settle_forecast` — need a token scope **and** a global `interop_write_enabled()` gate. Recorded state: *"0 tokens issued, 0 API calls ever."*

**One counter-metric, and it is the important one.** Every criterion above can be gamed by simply asking less. So measure alongside it: **human review time per run**, and **the rate at which auto-approved actions are later reverted** (`artifact.rewind`). If approvals fall while reverts rise, the policy engine is not working, it is hiding. The BCG/MIT finding that a named, autonomous-looking agent draws 16% less scrutiny is the specific mechanism to watch for.

**Gates, every cycle:** `bunx tsc --noEmit`, `bun test`, `bun run build`, plus a production query for each criterion above. A green suite is evidence the code does what the test says and nothing more.

---

## Related

- [`forecast-resolution-plan.md`](./forecast-resolution-plan.md) — the grading half of FC-01, already specced
- [`../../design/DESIGN-SYSTEM.md`](../../design/DESIGN-SYSTEM.md) — the Meridian contract
- [`../../design/REFERENCE-PATTERNS.md`](../../design/REFERENCE-PATTERNS.md) — where new station research is appended
- [`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md) — the one board
