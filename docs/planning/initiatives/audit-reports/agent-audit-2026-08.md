# The 2026-08-19 agent audit: what was found

> _Created: 2026-08-19 · Last updated: 2026-08-19_

**Roughly 60 agents ran across this session** — six code-archaeology agents, a six-domain sweep with an adversarial verifier per candidate, two external research agents, and a benchmark of twenty shipped agentic products. **This file is the durable record of what they found**, so it survives the session that produced it.

**It is a findings register, not a plan.** The plan is [`../agent-first-platform.md`](../agent-first-platform.md). The work list is [`../../../operations/kiro-queue.md`](../../../operations/kiro-queue.md). This is the evidence underneath both, and the place to check before re-investigating something.

---

## When to read this, and why it is not optional

**Read the relevant section before you touch a subsystem.** Not the whole file — the section for the thing you are about to change. It will usually tell you one of three things, and each saves a wasted hour:

| If you are about to… | Read | Because |
| --- | --- | --- |
| Change anything about runs, agents, tools or autonomy | §2 | Two orchestration engines exist and only one is documented; six of seven stations are structurally unsteerable |
| Touch Ask, the composer, or dispatch | §3 | Dispatch works through an accidental `@cos` prefix, and the branch designed for it is dead |
| Change a station's data flow, or trust a station doc | §4 | `lifecycle-signal-to-learning.md` is **substantially stale** — six of its twelve gaps are now wrong |
| Add or change a background job | §5 | 36 of 38 ticks are scheduled, one is orphaned, and nine tables are written by ticks and read by nothing |
| Do any design or UI work | §6 | Most Meridian debt is **dead code, not a porting job**, and four docs declared retired systems current until 2026-08-19 |
| Quote a number outward, or in an application | §1 | Every figure here carries its query. Several previously-quoted numbers were wrong |
| Re-run research on agent architecture or UX | §7 | **Do not re-run these.** The external research is recorded with its sources |

**And the discipline that makes this file worth keeping:** when you fix something listed here, **change its `State` in the same commit as the fix.** A register that drifts from reality is worse than no register, because the next reader trusts it. That is the exact failure this file documents in §8 about ten other documents.

**When you find something new, add a row.** This file is append-and-correct, not frozen. A finding nobody wrote down is a finding somebody pays for twice. The plan is [`../agent-first-platform.md`](../agent-first-platform.md). The work list is [`../../../operations/kiro-queue.md`](../../../operations/kiro-queue.md). This is the evidence underneath both, and the place to check before re-investigating something.

**Every finding was verified against code or production**, not read from a document. Where a doc claimed something the code did not do, that is recorded as its own finding.

---

## How to read this

| Column | Meaning |
| --- | --- |
| **State** | `OPEN` unresolved · `QUEUED` has a queue item · `CLOSED` fixed this session · `STALE-DOC` the doc was wrong, not the code |

Findings are grouped by the agent that found them. **A finding with no queue item and no fix is genuinely still open**, and that is the point of listing it.

---

## 1. Production reality (live database, Lovable MCP)

The numbers the whole direction rests on. All queried 2026-08-19.

| Finding | Value | State |
| --- | --- | --- |
| Background job runs, 30 days | **305,635** | context |
| Missions never started (`proposed`) | **232 of 349 (66%)** | OPEN |
| Missions completed cleanly | **27 (7.7%)** | OPEN |
| Opportunities parked in `backlog` | **327 of 410 (80%)** | OPEN |
| Agent runs failed or degraded | **1,037 of 1,703 (61%)** | OPEN |
| Distinct `agent_runs.status` spellings | **6**, including both `complete` and `completed` | QUEUED K-12 |
| Decisions carrying a forecast | **1 of 304** | QUEUED K-13 |
| Forecasts ever resolved | **0** | OPEN |
| Pending approvals, at zero real users | **53**, 39 over 24h, oldest **627h** | QUEUED K-10, K-11 |
| Approvals ever raised that needed a human | **82 of 313 (26%)** | QUEUED |
| Guardrail hits vs human gate events | **8,535 vs 113** | context — policy outruns permission 75:1 |
| `cron.eval-tick` last run | **2026-08-05**, while every other tick ran that day | OPEN |
| Agent slugs seeded / never used | **22 / 4** | QUEUED K-21 |
| Workspaces holding >1 product | **11 of 17**, 7 hold four | context |
| `agent_memory` rows, all workspace-visible | **1,170**, and **101 cross-author recalls** | CLOSED — README corrected |
| `credit_ledger` rows carrying `product_id` | **0 of 14,383** (was 0 of 13,788; 595 more rows, still zero) | **OPEN, and diagnosed 2026-08-20.** The SQL is correct: `debit_account_credits` inserts `_product_id` verbatim. Of 72 `callModel` sites, 55 are chargeable and **one** passes a productId, whose own 4 callers all pass null. See `claude-log.md` |
| Measured COGS per completed mission | **$0.338** against a $0.50 assumption | context — economics hold |

---

## 2. Orchestration and agent architecture

**The headline: there are two orchestration engines and only one is documented.**

| Finding | Detail | State |
| --- | --- | --- |
| **Two orchestration layers** | Spine/track (`driveTrackOnce`, 10 min, all 7 stations, **no LLM planning**) and mission/DAG (`advanceMissionCore`, 1 min, Build in practice). `architecture/orchestration.md` documents only the second | QUEUED K-22 |
| **Six of seven stations run with `missionId: null`** | `driver.server.ts:1189` opens a mission only for Build. Steering is gated on `ctx.missionId`, so **six stations are structurally unsteerable** | OPEN (Claude's lane) |
| **No per-run stop exists** | `cancelRun\|stopRun\|abortRun\|haltRun\|pauseRun` → **zero hits** repo-wide. Only a workspace kill switch | OPEN (Claude's lane) |
| **`cancelMission` is not a brake** | `finalize` writes status **by id with no precondition**, so a cancelled-but-running run overwrites itself with `completed` after performing every side effect | OPEN |
| **No `AbortController` in the loop** | `callModel` accepts `signal?`; the loop never passes one | OPEN |
| **Trust score's eval leg is dead** | Selects `ai_evals.ai_event_id` and `score`. Verified: real column is `event_id`, and **there is no `score` column** — seven named dimensions instead. **20% of every trust score is a frozen constant** and agents graduate autonomy on it | OPEN — needs a product decision, not a rename |
| **17 of 59 tools uncatalogued** | `toolRisk` fails closed to `high`, silently reversing a deliberate 2026-08-03 decision. `cluster.trigger` is **18 of 53 pending approvals** because of it | QUEUED K-11 |
| **`memory` category can never queue an approval** | `isWrite = category === "write" \|\| "planning"`, making `memory.promote`'s `confirm` default inert | OPEN |
| **Handoff carries no artifact references** | `dispatchReadySteps` passes `{task, context}` with **no artifacts, by design**. Step N+1 cannot reach step N's output | OPEN |
| **`agent.handoff` tool has no `memory_refs` field** | So every model-initiated hop travels without memory | OPEN |
| **`ai_traces` does not exist** | Zero occurrences repo-wide, despite `architecture/runtime.md` naming it canon | QUEUED K-22 |
| **`tool_calls` has no `parent_event_id`** | The thought → tool → observe tree is rebuilt by timestamp in JS rather than recorded | OPEN |
| **`ai_events.agent_id` never written** | Column exists; all six insert sites omit it. Per-agent cost cannot be answered | OPEN |
| **No dead-letter queue, no rollback, no saga** | Verified by grep. Position taken: reversibility is the goal, not compensation | by design |
| Agents are not bound to tools | `agent_tools` keyed on `user_id`, not `agent_id`. **Every agent sees all 59 tools** | OPEN |
| `halted` const at `loop.server.ts:793` | **Vestigial, not a defect.** The live path returns before that closure | STALE-DOC (mine) |

---

## 3. The Ask system

**It can start real work — but by accident.**

| Finding | Detail | State |
| --- | --- | --- |
| **Dispatch works via an accidental mechanism** | The client prefixes the literal `@cos`, which resolves to the orchestrator and skips the classifier | QUEUED K-16 |
| **The designed branch is dead** | `api/chat.ts:681` requires `startingAgent`, only ever assigned inside the `if (isMission)` block above it. **`intent: "do"` cannot promote anything** | QUEUED K-16 |
| **Silent degradation** | With no seeded orchestrator, "Hand it over" returns prose and starts nothing | QUEUED K-16 |
| **The resolved station is discarded** | `routeIntent` runs, then `void routed;` on the next line | QUEUED K-15 |
| **`tool` and `station` SSE frames are never emitted** | Client parses and accumulates both. **This is why you cannot see what an agent is doing** | QUEUED K-15 |
| **10 of 11 landing kinds unreachable** | Only `{kind:"mission", station:"build"}` is emitted | OPEN |
| **Promote-to-record is dead** | Server fns work; no control exists anywhere in the pane | OPEN |
| **Slash commands are dead** | `SLASH_COMMANDS` and `matchSlashCommands` referenced only by their own test | OPEN |
| **`retrievalProductId` never set** | A working hook option the pane ignores, so Ask retrieves workspace-wide wherever you stand | QUEUED K-74 |
| Steering genuinely works | `steerStudioSession` survives worker eviction. Build only | context |

---

## 4. Station data flow

**The outcome loop closes. The forecast loop does not.**

| Finding | Detail | State |
| --- | --- | --- |
| **`/decide` never writes a `decisions` row** | Grep for `createDecision`, `from("decisions")`, `decisions.functions` in that route → nothing. The station named Decide records no decision | OPEN |
| **`/decide` has zero forecast references** | The only human composer is a panel on `/brain` | OPEN |
| **`decision.record` has no forecast parameter** | So **303 of 304 agent-recorded decisions could not carry one** | QUEUED K-13 |
| **A settled forecast re-ranks nothing** | Three writers, four readers, and every reader is a display or a queue filter | OPEN |
| **`learnings` has no `decision_id`** | The canon's "written back against the decision that caused it" describes something the schema does not do | **CLOSED (schema)** — column added and applied 2026-08-19, `20260819181000`. No backfill: `prd_id` does not identify a decision. **Nothing writes it yet**; `trust.server.ts:151` still rebuilds the edge in JS |
| **`learning.record` accepts `uncertain`; the CHECK permits 3 values** | Its description tells the agent to say it. **An obedient agent gets a 23514 and the tool call fails** | QUEUED K-14 |
| **11 direct-insert bypasses around the signal sink** | Each skips dedup, `source_kind`, the injection screen, the embedding **and the `stage_events` row** | OPEN |
| **Autonomous specs always have `opportunity_id: null`** | Severs the bet→theme route; compensated via `spine_track_members` | context |
| **Design gate is human-only by construction** | `decideDesignGate` hardcodes `actor: "human"`; not called from `studio.stage`, so a driver-run Build never meets it | OPEN |
| **Deferral is invisible to the agent sweep** | A human pressing "too early to tell" writes `outcome_check_by`, which only the human queue reads. The sweep settles it anyway | OPEN |
| Outcome → confidence → ICE → rank key 1 | **Wired and reads** | context |
| `match_agent_memory` re-ranks on verdict | `distance + CASE verdict WHEN 'validated' THEN -0.05` | context — best-built part of the brain |
| `lifecycle-signal-to-learning.md` | **Substantially stale.** Six of its twelve gaps are now wrong; most line numbers drifted by hundreds | STALE-DOC |

---

## 5. The autonomous tick layer

| Finding | Detail | State |
| --- | --- | --- |
| **36 of 38 tick endpoints are genuinely scheduled** | Via `pg_cron` + `pg_net`, not Cloudflare. Verified against a migration that iterates live `cron.job` rows | context |
| **One orphan: `funnel-week2`** | Complete, auth-guarded, wrapped, and registered nowhere | OPEN |
| **~2,880 tick failures in 30 days** | `ci-poll` 1,491 · `sense` 545 · `resume-runs` 422 · `goal` 264 · `track` 157. **None reaches a user surface** | OPEN |
| **`job_runs` and `error_events` readable only from `/admin`** | A customer cannot learn their autonomous layer stopped | OPEN |
| **There is no `notifications` table** | Computed on read; `/notifications` redirects to Settings | context |
| **The digest reaches nobody who has not visited Settings** | `user_notification_preferences` has **no default-row trigger and no seeding migration**; `sendDueDigests` reads only rows that exist | OPEN |
| **`generateDigest` stamps `last_digest_sent_at` before the send** | A missing API key silently burns the window | OPEN |
| **Nine tables written by ticks and read by nothing** | `scout_runs` · `scout_snapshots` · `scout_targets` · `loop_runs` · `capability_changes` · `funnel_milestones` · auto-approval rows in `workspace_audit_log` · `byok_fee_accrual` · **`insights.brier_score`** | OPEN |
| **`insights.brier_score` is the sharpest of those** | The calibration number the forecast thesis rests on, computed nightly, rendered nowhere | OPEN |
| **Dormant and deliberately-off are indistinguishable** | `scout` and `researcher` return before `withJobRun` when their key is missing | OPEN |
| **`liveness-tick` is scheduled but absent from the watchdog manifest** | So the watchdog cannot see it stop | OPEN |
| Seven self-origination paths exist | `track-tick` drives 5 tracks/10min unattended; `trigger-tick` proposes missions; `self-improve` in auto mode writes **approved** house rules | context |

---

## 6. Meridian and the design system

| Finding | Detail | State |
| --- | --- | --- |
| **Debt is 5,864 across 285 files** — and **mostly dead code** | `src/components/ui` holds 455, **322 unreachable**. `styles.css` has three theme blocks, the earliest dead in full. `[data-obsidian]` declared 4× with 56 shadowed declarations | QUEUED K-27 to K-37 |
| **Seven retired source files announced nothing** | All silent about being retired | **CLOSED** — bannered 2026-08-19 |
| **`design-reference/README.md` declared v5 Tempo CURRENT** | And named an archived file "the law", in the folder AI builders are pointed at, five days after retirement | **CLOSED** |
| **`design-reference/DESIGN.md` called itself "THE SOURCE OF TRUTH ... in any tool"** | Retired v1 Ember, explicitly addressing AI builders | **CLOSED** |
| **`docs/conventions/design-context.md` declared v3 Obsidian THE contract** | Live doctrine. **Found by the new guard, not by hand** | **CLOSED** |
| **`REFERENCE-PATTERNS.md` instructed `--sp-*` on line 10** | The file that teaches every future researcher, teaching a dead system. Its own correction sat 886 lines below | **CLOSED** |
| **docs-doctor could not catch any of this** | Check [8] matches links by `DESIGN-*.md` filename and **excludes `design-reference/`**. The real defect was a link into `docs/design/archive/` labelled "the law" | **CLOSED** — check [11] added |
| **No run timeline** | Zero matches for `timeline` in `src/components/meridian/` | QUEUED K-04 |
| **No stop control anywhere** | The only "Stop" is a graph replay toggle | QUEUED K-01, K-02 |
| **No token an interrupt may wear** | `--mrd-fail` is reserved for outcomes, never intents | QUEUED K-01 |
| **No Dialog** | `--mrd-scrim` and `--mrd-shadow-pane` defined, consumed by nothing | QUEUED K-03 |
| **No spend display** | In a credit-metered product whose colour law names "a cap nearly spent" | QUEUED K-07 |
| **`MarkStack` takes one state for the whole stack** | 37 importers. Cannot render three agents in three states | QUEUED K-08 |
| **`StreamingText` and `ToolChips` wired only to the gallery** | The two components whose subject is an agent working | QUEUED K-17 |
| **277 arbitrary `text-[Npx]` values, 13 off-ladder** | The type ladder is documented and unenforceable; the ratchet cannot see arbitrary values | QUEUED K-09 |
| **`--mrd-you` 97 uses vs `--mrd-agent` 59** | Five surfaces exist for "a person is required" and one for "a machine is working" | context |
| **Motion: `--mrd-d-move` is slow. The other two are not** **CORRECTED 2026-08-20** | **`--mrd-d-press: 120ms` already equals the reference's dominant 0.12s (827 of 1,435 declarations), so "2x slower" is false for it.** `--mrd-d-move: 220ms` vs the reference's 0.12-0.15s is the real gap. **The `enter 0s / exit 0.15s` figure is Linear's published scale, not measured on the reference**, whose only long animations are text streaming and scroll reveal | `claude-log.md` K-25 RULED |
| ~~**Body weight 400 vs the reference's 450**~~ **FALSIFIED 2026-08-20** | **The reference has no element at weight 450. Measured over 907 text-bearing elements: 400 (prose), 500 (labels), 600 (headings). `document.body` computes 400, same as ours.** Meridian's 400/500/600 ramp already matches. Struck from K-25 | `claude-log.md` K-25 RULED |
| **No loading policy** | Reference shows nothing for 1000ms; Supaprod flashes `BrandWait` after 150ms with a 300ms minimum | QUEUED K-25 |
| All 19 beautifui.dev components ported | 11 parity, 5 fixed, 3 ahead | context |
| **Plan, Ship, Learn have no reference research. Brain is in no table at all** | Discover, Design, Build done 2026-08-01; Decide partial | QUEUED K-76 to K-79 |

---

## 7. External research

Not repo findings, but the evidence several rulings rest on. **Do not re-run these.**

| Finding | Source | Used for |
| --- | --- | --- |
| Users make **~70% of planning decisions, ~20% of execution decisions** | Anthropic, instrumented Claude Code sessions | Gate at the plan, not the steps |
| **93% of permission prompts are approved** ("approval fatigue") | Anthropic | A step-level gate cannot be rescued by design |
| Throughput **+33.7%**, review time **+441.5%**, zero-review merges **+31.3%** | Faros, 22,000 devs, 2 years | The review surface is the product |
| Task-verification failures **21.30%**; role-disobedience **0.5%** | MAST, arXiv:2503.13657, 1,600+ traces, κ=0.88 | **Do not merge the maker/reader pairs** |
| Multi-agent performance swings **+80.8% to −70.0%** on architecture-task fit | arXiv:2512.08296, 260 configurations | Split on read, serialise on write |
| Named agents draw **16% less scrutiny**, no adoption benefit | BCG Henderson / MIT IDE, in HBR | **Keep job-verb agent names** |
| **No shipped product raises autonomy on track record.** Only automated *demotion* exists | Survey of Claude Code, Cursor, Devin, Copilot, Codex | Demotion automatic, promotion needs a person |
| Anthropic sizing: **3–5 agents**, "three focused teammates often outperform five scattered ones" | Anthropic | Roster sizing |
| Linear's shipped motion scale: `0 / 0.15 / 0.1 / 0.25 / 0.35s`, **enter 0s** | Read from bundle | K-25 |

---

## 8. Corrections this audit made to existing canon

Recorded because a wrong doc is worse than a missing one.

| Doc | Was | Now |
| --- | --- | --- |
| `README.md` | `agent_memory` is user-scoped; *"say the record travels, never the memory travels"* | **False.** All 1,170 rows workspace-visible, 101 cross-author recalls. Corrected, flagged for founder sign-off since it changes outward answers |
| `design-reference/README.md` | v5 Tempo declared CURRENT | Meridian, with beautifui.dev named as the reference |
| `design-reference/DESIGN.md` | v1 Ember, "THE SOURCE OF TRUTH ... in any tool" | Bannered RETIRED |
| `docs/conventions/design-context.md` | v3 Obsidian "THE design contract" | Corrected to Meridian |
| `REFERENCE-PATTERNS.md` | *"express it in our own `--sp-*` primitives"* | Meridian |
| `docs/design/agent-first-surface-brief.md` | Named Discover and Design as unresearched | **Wrong.** Plan, Ship, Learn and Brain are the gaps |
| `lifecycle-signal-to-learning.md` | "Code-verified 2026-08-02" | Six of twelve gaps now wrong; line numbers drifted by hundreds. **Not yet corrected** |
| `architecture/orchestration.md` | Documents the mission layer only | The spine walks all seven stations and is undocumented. QUEUED K-22 |
| `architecture/runtime.md` | Names `ai_traces` as canon | It does not exist. QUEUED K-22 |
| `architecture/observability.md` | Documents the trust eval leg as live | It has been a frozen constant. QUEUED K-22 |

---

## 8b. Applied to production 2026-08-19 (Claude lane)

Four migrations landed, one at a time, each verified against production before the
next was applied. **Schema only. Every one of them still needs its writers**, and a
column with no writer is the `credit_ledger.product_id` failure repeating, so none
of these is finished.

| Migration | What changed | Verified by |
| --- | --- | --- |
| `20260819180000` | `is_sample` on **`learnings`** and **`agent_memory`** | 133 of 133 learnings marked; 1,143 of 1,143 seeded memories marked and **all 46 real ones left unmarked** |
| `20260819181000` | `learnings`: `workspace_id` FK (**`NOT VALID`**, nothing deleted) + workspace trigger, `product_id` + derivation trigger, `decision_id` | Probe insert derived `product_id` from `prd_id` correctly and rolled back; 133 rows and all 16 orphans intact |
| `20260819182000` | `agent_memory.product_id`, plus a CHECK refusing one on `reflection`/`correction` | Probe proved evidence+product accepted and method+product refused |
| `20260819183000` | `agent_autonomy.workspace_id` | 40 of 87 scoped via `agents.workspace_id`; 47 left NULL; **no arc changed** |

**Two findings this produced that were not in this register.**

1. **`learnings` had no foreign key on `workspace_id` and `agent_memory` did.** That
   is the entire reason `learnings` held **16 rows pointing at a workspace that no
   longer exists** and `agent_memory` held zero. Retained under a `NOT VALID`
   constraint rather than deleted: the constraint blocks a seventeenth without
   destroying the only evidence of what the gap cost.
2. **Zero of 133 learnings sit in a non-sample workspace.** The moat's own table has
   never held a real row, which is why nothing was backfilled anywhere.

---

## 9. What is still open and has no queue item

**The honest list.** Everything here needs database access, a runtime, or a product decision, so it sits in Claude's lane rather than Kiro's.

1. Six of seven stations unsteerable (`missionId: null`)
2. No per-run stop; `cancelled` overwritten by `completed`
3. Trust eval leg — **needs a decision on how seven dimensions compose, and it cannot be made yet.** Two of the seven are unusable as written. **`prompt_injection_risk` is NULL in all 77 rows** — never written once. **SUPERSEDED 2026-08-20: it is now written — 109 of 188 rows carry a value — and it is always exactly `0.00`, 1 distinct value, sd 0.0000. The defect moved from "never written" to "written and constant"; same consequence, different fix.** **Also superseded: the whole item. The composition was decided and built (`evalScore`, `trust.server.ts`) — quality mean x (1 - worst risk), with a cutoff at `EVAL_CONTRACT_FIXED_AT`.** And **`hallucination_score` is stored on the inverted scale**: `eval-tick.ts` tells the judge *"score on six dimensions (0.0 worst to 1.0 best, except `*_risk` which are 0.0 safe to 1.0 risky)"*, lists **seven** fields, and `hallucination_score` does not end in `_risk`, so the model scores it higher-is-better while the inline comment on the next line says the opposite. Production settles it: **`corr(hallucination_score, groundedness) = +0.999`**. Meanwhile `traces.$traceId.tsx:300` renders it `higherIsBetter: false` and `EvalScoreChips` calls it risk-shaped, so **every hallucination score in the product is displayed with its meaning inverted.** Fix the prompt's self-contradiction before composing anything from these numbers
4. `learnings.decision_id` — **the column now exists** (`20260819181000`, applied 2026-08-19) and **nothing writes it.** Half done, and the remaining half is the half that matters. **Measured 2026-08-20, and the cost is bigger than the column:** the JS reconstruction it replaces (`trust.server.ts:312-330`, NOT `:151`, that pointer is stale) builds `new Map()` keyed on `prd_id` with **no `.order()` and no tie-break**. Production: **14 of 14 specs carrying decisions have more than one, and all 14 have two different deciding agents** — so **14 of the 35 decisive learnings (40%) are attributed to an agent by PostgREST's arbitrary row order**, feeding `sOutcome`, 0.3 of the trust score agents graduate autonomy on
5. A settled forecast re-ranks nothing
6. `/decide` writes no decision row
7. ~2,880 tick failures invisible; ops is admin-only
8. Nine tick-written tables with no reader, incl. `insights.brier_score`
9. The digest is unreachable without a Settings visit
10. `credit_ledger.product_id` never stamped — **and the single production credit cap is scoped `product`, so it reads 0 spend and is unconditionally inert (fails open).** Latent rather than costly: that account is the `harbor@` demo login with zero real workspaces. Two traps in the fix: a bad value hits `credit_ledger_product_id_fkey` and **rolls the whole debit back, giving a free call**, and `chat.ts`'s productId is client-supplied
11. `ai_events.agent_id` never written; `tool_calls` has no parent edge
12. 11 signal-sink bypasses
13. `funnel-week2` orphaned; `liveness-tick` outside the watchdog
14. Design gate unreachable on the autonomous path
15. `lifecycle-signal-to-learning.md` not yet corrected
16. **`ai_events.product_id` is a second orphan under the first, and had never been logged.** 128 of 61,156 rows ever; **0 of the 19,258 in the last 7 days, and 0 on every one of the last 20 days.** `logAiEvent` neither accepts nor sets it. This is why a derive trigger from `credit_ledger.ai_event_id` would stamp NULL on every row, and why fixing `logAiEvent` first replaces a 54-call-site sweep with one trigger (found 2026-08-20)
17. **The generated Supabase types are stale against applied migrations, and it blocks the stamping work.** `src/integrations/supabase/types.ts` is missing `learnings.product_id`, `learnings.decision_id`, `agent_memory.product_id` and `is_sample` on both, while carrying `credit_ledger.product_id` and `agent_autonomy.workspace_id` — so `180000`-`182000` are unrepresented and `183000`-`184000` are. **Any `.insert({ product_id })` on those two tables fails `bunx tsc --noEmit` today**, and the `is_sample` filter every agent is told to use cannot be written in TypeScript. Needs a regeneration through Lovable (found 2026-08-20)
18. **`20260819182000`'s own header instructs a fix its own CHECK forbids.** It tells the reader to stamp `spine/correction.server.ts:316`, which writes `kind: 'correction'` — refused by `agent_memory_method_has_no_product`, added in the same file. The comment is wrong and should be corrected rather than followed (found 2026-08-20)
23. **The rate-limit message hides the cause and gives advice that cannot work.** A gateway rate limit renders as *"I hit a snag answering that. Try again or switch models."* while `ai_events.error_message` records *"AI rate limit reached. Try again in a moment."* Tested rather than assumed on 2026-08-20: switching from `google/gemini-3-flash-preview` to `google/gemini-2.5-flash-lite` returned **the identical rate limit**, because the limit is on the gateway key and not on the model. So the only action the message suggests is the one that cannot help, and the cause the product already knows is withheld. Copy defect with a measurement behind it (found 2026-08-20)
24. **The `station` and `tool` SSE frames are emitted but never confirmed on the wire.** `chat.ts:975` and `:1291` both send. Five real requests on 2026-08-20 produced neither, because `runResearch` is gated on `researchMode !== "chat"` and the classifier is itself a model call that was rate limited every time. **Not evidence against the frames** -- evidence they are unexercised. Needs one successful research-mode request to close (found 2026-08-20)
22. **`completed_with_failures` is the status every mapping forgets, and it is a third of the table.** 622 of 1,841 agent runs (33.9%) and 22 of 349 missions (6.3%). Measured 2026-08-20 across four mappings written by three different items: `mapRelayStatus` sends it to `idle` (K-87), `runBucket` sends it to `"other"`, which `agent-fleet.ts:90` documents as *"uncounted in all four tallies while `total` still counted it"* -- **falsifying K-60's own asserted identity `running + queued + done + failed === total` by 33.8%** -- and `laneForStatus` sends 22 finished missions to `awaiting`. Only `isTerminalStatus` (K-62) handles it. **The pattern is the defect: it is the second-largest status in the system and it was added after every one of these tables was first written**, so each one enumerates a world it predates. Any new status mapping must be checked against the six spellings production writes, not against the author's recollection (found 2026-08-20)
20. **The eval contract guard keys on a date, but the thing it guards against is a judge model.** `ai_evals.hallucination_score` carries two opposite scales, split by judge: `gemini-2.5-flash-lite` (111 rows, today) is risk-shaped at corr **-0.87**, while `claude-sonnet-4-5` (63) and `gemini-2.5-pro` (14) are quality-shaped at **+0.9995** and **+1.0000** — and 63+14 = the register's original 77. `judgedUnderCurrentContract` tests `created_at`, and the two only agree because `JUDGE_MODEL` is a hardcoded constant at `eval-tick.ts:7`. **Change that line and old-scale rows pass the date cutoff**, scoring ~0.119 and collapsing every agent at once. Guard should key on an allowlist of `judge_model` (found 2026-08-20)
21. **The risk half of the trust composition has never fired.** Across all 111 rows the live judge has written, `toxicity`, `pii_risk` and `prompt_injection_risk` each have **1 distinct value (0.00) and sd 0.0000**. The MAX-not-mean design is right but untested, and the file argues for it on the strength of two dimensions that have never been non-zero. Separately, `hallucination_score + groundedness = 1` in **103 of 111** rows, so `worstRisk` is `hallucination_score` in 110 of 111 and the formula reduces to `mean(g,r,c) x g` — groundedness counted twice. Bounded: inert on 90 rows, and on the 21 where it bites it takes 0.040 off a 0.205 mean (19.5% relative), i.e. only on already-bad rows. Should be a stated choice, not an accident (found 2026-08-20)
19a. **A third of finished runs are drawn as idle on two live surfaces.** `mapRelayStatus` (`relay.ts:36-38`) has a done arm of exactly `case "completed": case "done":` and `default: return "idle"`. Production over **1,825** runs: `completed_with_failures` **618** and `complete` **2** both fall to `idle` = **34.0%**, while the `done` arm it does carry occurs **zero** times. Reachable: 8 call sites in `relay.ts` feed `AgentRelay`, mounted at `DiscoverSurface.tsx:1967` and `MissionOrchestratorDetail.tsx:1324`. **The 1,135-run figure in `mission-advance.server.ts:90-92` is stale.** Reported by K-36, which correctly declined to fix it in that diff (verified 2026-08-20)
19. **`agent_autonomy.workspace_id` fails at three layers, not one.** Nothing writes it (the 40 populated rows are a one-off UPDATE inside `20260819183000`, and the dominant writer is the `auto_advance_agent_arc` RPC — 86 of 87 rows carry `set_by IS NULL`); four readers still key on `(user_id, agent_id)`; and **both RLS policies are still `auth.uid() = user_id`**, so the cross-colleague read the column exists for is forbidden regardless. Stamping it alone is worse than leaving it empty (found 2026-08-20)

---

## Related

- [`../agent-first-platform.md`](../agent-first-platform.md) — the direction built on this evidence
- [`../../../operations/kiro-queue.md`](../../../operations/kiro-queue.md) — the 79 items
- [`../../../design/agent-first-surface-brief.md`](../../../design/agent-first-surface-brief.md) — the design review
- [`../../../strategy/pricing/multi-product-and-isolation.md`](../../../strategy/pricing/multi-product-and-isolation.md) — the commercial ruling
- [`../functionality-audit-2026-08.md`](../functionality-audit-2026-08.md) — the prior audit over the same ground, 2026-08-14
