# v12: The Self-Improving OS

> _Created: 2026-07-02 · Status: **CURRENT depth-and-learning canon.** [v11](./v11-guiding-star.md) remains the guiding star for direction, moat, positioning, market, and pricing. v12 sits under it and answers the founder's 2026-07-02 questions at engine depth: where the self-learning actually comes from, how the platform predicts before something falls, where the knowledge physically lives and how it becomes a visual memory OS, how Supaprod gives users the design leg of the product triad, whether the PM artifact conventions themselves should be reinvented for the agent era, and whether the platform survives an end-to-end journey test from a buyer, an investor, and a daily power user. **Where v12 and an older doc disagree on the learning loop, foresight, the Brain surface, design capability, artifact conventions, or the journey-coverage build plan, v12 wins. On direction, v11 wins.**_

> **For agents and future sessions:** the build items live in [`../planning/feature-dashboard.md`](../planning/feature-dashboard.md) as group **G15** (registered 2026-07-02, sequenced AFTER the founder-set G14 Obsidian port block). This doc carries the why and the designs; the dashboard carries the what and the status. Every claim below is grounded in a 2026-07-02 audit: four parallel code auditors (learning loop, proactive layer, agent engine and build spine, surface depth), one mid-2026 market sweep with sources, one canon compression, plus direct verification in this session. Provenance: §13.

---

## 0. How to use this document

1. §1 for the seven questions and their one-paragraph answers.
2. §2 for the refreshed ground truth and the depth scorecard (the "real engine or UI veneer" answer).
3. §3 to §8 for the six capability programs, each with its doctrine and its build items.
4. §9 for the buyer, investor, and power-user justification.
5. §10 for what the mid-2026 market frontier ships, with sources.
6. §11 for the ranked build plan and what is founder-gated.
7. §12 for the session inputs record; §13 for provenance.

House terms are used exactly as the canon defines them: the three pillars (own the loop, sense continuously, keep the receipts), no-fast-oracle asymmetry, outcome-labeled judgment, claim-never-outruns-wiring, calm front deep engine, name the outcome not the mechanism, credits not seats. See [moat.md](./moat.md) and [v11 §1A](./v11-guiding-star.md).

---

## 1. Executive summary: seven questions, seven answers

The founder asked (2026-07-02, five voice inputs, distilled in §12):

1. **Where does the agent's self-learning, the reinforcement, actually come from?**
2. **Can the agent recognize and notify BEFORE something falls over, and predict?**
3. **Where is the knowledge layer stored, and can I see and operate it, an Obsidian-style visual memory OS?**
4. **Design is the third leg of the product triad (PM, engineer, designer). How does Supaprod give a user design capability?**
5. **Should we reinvent the PM artifact conventions themselves for the agent era, something like an Agent Requirements Document, and lead the industry?**
6. **Run the end-to-end journey test: a PM arrives, does everything get done here, without overwhelm, from vision and market analysis through build, testing, ship, and GTM?**
7. **The adversarial depth test: is this really doing the job, or a UI layer on top of a model? Would a buyer, an investor, a power user find substance behind every door?**

The answers, each expanded in its section:

1. **In a BYOK, model-agnostic OS, learning cannot live in model weights. It lives in three substrates Supaprod owns: the data layer (outcome-labeled memory, supersession edges, playbook win rates), the policy layer (trust arcs, approval floors, distilled house rules), and the routing layer (which precedent, which playbook, which model gets pulled).** Today the write half of that loop is real and the policy half is partially real, but the audit found the one missing keystone: **no retrieval or behavior anywhere re-ranks on outcomes.** Memory gets bigger, not smarter. The recall RPC is pure cosine similarity; outcome verdicts reach prompts as text, never as ranking signal. Program REINFORCE (§3) closes exactly this, on seams that already exist.
2. **The nervous system is real and running unattended (12+ live pg_cron jobs driving real AI work), the detectors are real (staleness, drift, usage spikes, external-surface diffs, narrative predictions every 2 hours), but the system is mute outside the app.** The email path is a console.log scaffold; there is no Slack outbound, no push. And detection is threshold-crossing, not forecasting. Program FORESEE (§4) adds calibrated prediction contracts, assumption watchers that flag a decision at risk BEFORE its outcome fails, and a user-scheduled digest channel (the pattern the market proved; ambient push without user control is the pattern OpenAI just retired).
3. **Stored: workspace-scoped Postgres you own (Supabase), pgvector 1536-dim embeddings, a typed bi-temporal decision graph in `artifact_lineage`, RLS on every table, exportable as JSON, governed by the Archive / Delete / Forget ruling.** Seen: a real graph surface already renders (GraphCanvasView, GraphNodeStory, CompoundingPanel) plus the four Brain lenses. The gap is that it renders but does not OPERATE. Program BRAIN (§5) turns it into the memory OS the founder described: click any node, get its receipts and track record, take one-click actions from it, watch the brain grow.
4. **Everyone in the mid-2026 market gives non-designers screens grounded in a CONFIGURED design system. Nobody learns a team's design language from what it ships, approves, and rejects.** That learned-taste cell is empty, and Supaprod is uniquely shaped to fill it because design memory is just decision memory pointed at design. Program DESIGN-LEG (§6): design language as first-class brain content with supersession, a Design Critic lens, flow-before-screens artifacts, and a design contract that rides the BuildSpec into codegen. Not a canvas tool, not a Figma competitor.
5. **Yes, but pressure-tested it is bigger than a rename (§7.1 stress-tests the naive PRD-to-ARD move and it fails four ways).** What the agent actually requires is a **type change plus a lifecycle change**: requirements decompose into standing context (memory the agent pulls, never restated), a small agent-authored **Outcome Contract** the human judges as deltas, and a compiled verification set where every requirement ships with its oracle and every unverifiable clause becomes a watched assumption. The command grammar that falls out (one-line intent, agent-drafted contract with one batched clarification round, plan-level consent, speculative reversible prep, ambiguity policy instead of mid-run stalls) is engineered for exactly what the founder named: latency, friction, and time-to-outcome (§7.3). ARD stays the public name of the standard, published as the dispatch contract external coding agents consume. Program CONVENTIONS (§7).
6. **The journey has a deep middle and thin ends.** Sense to decide to define to build to learn is genuinely covered with real engines. The strategy head (vision formation, competitive and tech-shift intelligence as first-class, decision-grade inputs) and the launch tail (test depth beyond CI, launch and GTM artifacts, ambient stakeholder communication) are thin or absent, and they are exactly the stages the founder named as "three steps before code" and "after shipping." Program JOURNEY (§8).
7. **Verdict: a real agentic engine, not a wrapper.** Durable multi-step loops with per-step checkpoints and resume, a governed 44-tool registry with non-overridable safety floors, a 13-agent DB-coordinated mesh with typed handoffs, a model-free mission advance engine on a 1-minute cron, 7 tools that take real GitHub actions behind CI, eval, and human gates, RLS on all tables, and a SHA-256 sealed Trust Ledger. The honest caveats a diligence pass will find, and the fixes, are in §2 and §9. The scorecard is printable.

**The strategic through-line:** v11 said light the engine and fuel the moat. That is done (the v11 front closed 2026-06-25, Signal Fabric closed 2026-07-01). v12's job is the next compounding turn: **make the memory change behavior, make the foresight reach the user, make the brain operable, add the design leg, set the artifact standard, and close the journey's two ends.** Nothing in this plan adds a nav destination. Almost everything composes seams that already exist, which is why the whole front is on the order of one to two focused lane-weeks, not a quarter.

---

## 2. Ground truth, 2026-07-02: what changed since v11, and the depth scorecard

### 2.1 What changed since the v11 audit (nine days)

- **The v11 front (#1 to #21) closed 2026-06-25.** Ambient sense and trigger crons live, Trust Ledger and share live, Brain lenses plus AI analyst live, IA collapsed to outcome-named destinations plus one Engine Room door, playbook registry with per-outcome win-rate ranking live-verified, PM Impact Ledger and Stakeholder Pack shipped, landing page rebuilt.
- **Signal Fabric closed 2026-07-01:** one `writeSignals` sink, the 8-connector customer voice fleet (4 confirmed ingesting live), the Scout watchtower, MCP sources (Linear verified end to end), derive generators plus InsightRail on Today, governed auto-trigger with `BRAIN_AUTO_TRIGGER=1` set live.
- **MA-1 (2026-06-30):** the platform AI backend is model-agnostic (any OpenAI-compatible provider by env) with capability routing ON. MA-2 (consumer surface + agentic-run defaults) is mapped, not built; agentic runs still pin `gemini-2.5-flash`.
- **BLD-04 live-verified 2026-07-02:** delegate-out to OpenHands polls and folds back end to end on a 5-minute cron.
- **Obsidian v3 became the app design contract (2026-07-02)** and the G14 port (OBS-01..15) now leads the board; OBS-01 shipped same day. THE PROTOTYPE IS THE FLOOR.
- **Agent-native layer:** machine view on every page, `/llms.txt`, `/agents.txt`, a 10-tool read MCP server, A2A card and endpoints.

### 2.2 The depth scorecard (print this for any diligence conversation)

Grades: **WIRED** (code path exists and is gated green) · **ORGANIC** (runs on real non-seeded data in prod) · **BEHAVIORAL** (its output changes what agents do next) · **FELT** (a user sees it working without hunting) · **PROVABLE** (a metric a buyer can check).

| Capability claim                                                   | Wired   | Organic | Behavioral | Felt    | Provable | The honest one-liner                                                                                                        |
| ------------------------------------------------------------------ | ------- | ------- | ---------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| Autonomous loop (missions self-advance, agents hand off)           | YES     | YES     | YES        | YES     | YES      | 12+ live crons; model-free DAG advance every minute; live-verified repeatedly                                               |
| Outcome recording to memory (W1-AUTO, LRN-02)                      | YES     | THIN    | PARTIAL    | PARTIAL | YES      | Writes fire only inside human recordOutcome; volume is low                                                                  |
| Auto-reflection per run                                            | YES     | YES     | PARTIAL    | NO      | PARTIAL  | Real self-assessment, recalled next run; no ground-truth check                                                              |
| Outcome-weighted retrieval                                         | NO      | NO      | NO         | NO      | NO       | **The gap.** Recall is cosine similarity only; verdicts are display text                                                    |
| Supersession engine (detected, bi-temporal)                        | YES     | ARMED   | PARTIAL    | PARTIAL | YES      | Flag ON in prod since 06-24; trigger is still only human recordOutcome; engine-origin edges: zero (visible ones are seeded) |
| Playbook win-rate ranking                                          | YES     | SEEDED  | NO         | NO      | YES      | Ranking verified live; **no agent selects a playbook by it yet**                                                            |
| Trust arc / earned autonomy                                        | YES     | YES     | YES        | PARTIAL | YES      | The one genuinely outcome-derived behavior signal today                                                                     |
| Ambient sense (signals in, no human start)                         | YES     | YES     | YES        | YES     | YES      | 5-min sense-tick; 4 connectors live; injection-screened                                                                     |
| Self-initiated missions (trigger-tick)                             | YES     | YES     | YES        | PARTIAL | YES      | Proposes with Trust-Ledger receipt; auto-promote armed 07-01, cap 2/day                                                     |
| Prediction (derive: prediction/risk/cost-of-inaction)              | YES     | YES     | NO         | PARTIAL | NO       | Narrative AI on a live 2h cron; no calibration, no forecast model, nothing scores whether predictions came true             |
| Pre-emptive detection (staleness, drift, spikes, scout diffs)      | YES     | PARTIAL | PARTIAL    | PARTIAL | PARTIAL  | Real engines; **drift/eval/indexer crons registered against a dead URL** (defect); scout/researcher keyed off               |
| Out-of-app notification                                            | NO      | NO      | NO         | NO      | NO       | Email dispatch is a console.log scaffold; prefs schema and UI already exist                                                 |
| Design capability for the user's product                           | THIN    | YES     | NO         | PARTIAL | NO       | Readiness grader + one-shot generic HTML mockup; no design memory, no iteration                                             |
| Build spine (stage, commit, PR, CI gate, eval gate, merge, revert) | YES     | YES     | YES        | YES     | YES      | 7 real GitHub write tools behind hard gates; merge review-pinned                                                            |
| Deploy / hosting                                                   | NO      | NO      | NO         | NO      | NO       | Interface-only seam; deno-deploy adapter exists with zero importers                                                         |
| Memory OS (visual, operable brain)                                 | PARTIAL | YES     | NO         | PARTIAL | NO       | Graph + node stories render; no actions from nodes, no growth metrics                                                       |
| Trust Ledger + integrity seal                                      | YES     | YES     | n/a        | YES     | YES      | SHA-256 seal, share pages, public verify                                                                                    |
| Interop (MCP read, A2A, machine view, llms.txt)                    | YES     | YES     | n/a        | PARTIAL | YES      | 10 read tools; write half gated by design                                                                                   |

### 2.3 Engine facts a CTO will ask about (from the 2026-07-02 engine audit)

- Loop: strict JSON thought/action protocol, tool results re-enter as `<untrusted_tool_output>`, adaptive step budgets (6 specialist / 14 orchestrator / 24 builder, +2 trusted +4 ambient, hard ceiling 40), checkpoint of the full conversation EVERY step, CAS-protected resume, mid-run operator steering, 5-concurrent-missions backpressure per workspace.
- Tools: 44 registered; approval floors compose tool mode with the agent's earned arc; merge is review-pinned; low-risk reversible tools auto-clear (the babysitting-tax fix); `STUDIO_AUTO_SHIP` graduates merge only behind CI-green plus eval-regression gates.
- Mesh: 13 seeded agents (12 specialists + orchestrator), typed A2A handoffs claimed compare-and-set, deterministic model-free advance engine. The "19-agent mesh" phrase in older docs is aspirational; stop using it unqualified.
- Chokepoint: kill switches, mission caps, per-user and per-surface budgets, capability routing, credit engine seam (dormant by design), BYOK chain with SSRF-safe base URLs, guardrails in and out, humanizer hard gate, response cache, retries plus flag-gated provider fallback, full `ai_events` telemetry.

### 2.4 Defects the audit found (queued as G15 fix item RF-08)

1. **Stale cron registrations (prod impact):** `drift-tick`, `eval-suite-tick`, `indexer-tick` are registered against the OLD project URL with an `apikey` header the hook auth rejects. Scheduled drift detection, scheduled eval suites, and hourly RAG indexing are presumptively dead in prod. Fix: one re-registration migration (the `20260626061818` pattern).
2. **Tool-enablement enforcement gap:** the execute gate checks registry membership, not the user's enabled set; unenabled reads execute, unenabled writes fall to confirm. Fix: enforce enablement at execution, fail closed.
3. **`agent-tick` is a stub:** user-defined per-agent schedules stamp a timestamp and do nothing. Either wire it or remove the schedule field from the UI (claim-never-outruns-wiring).
4. **KI-34 cross-tenant guard fails OPEN on lookup error** in `resolveProviderAuth`. Fail closed.
5. **`eval-tick` (per-event LLM judge) is orphaned:** never scheduled. Schedule it or fold into eval-suite-tick.
6. **`deno-deploy` hosting adapter has zero importers:** dead code until BYO-P5; stamp it dormant-by-design in the file header so audits do not re-flag it.

---

## 3. Program REINFORCE: where the learning actually comes from

### 3.1 The doctrine (the answer to "where is the reinforcement coming from")

Supaprod is model-agnostic by mandate, so it will never own weights. The market sweep (§10) confirms this is not a handicap: every credible shipped learning loop in mid-2026 (Sierra, Devin, Cursor, OpenAI's AgentKit) is **system-level learning**: memory distillation, retrieval over outcomes, eval-driven configuration updates, playbook distillation. All of it is model-agnostic engineering. Nobody ships unsupervised self-modification; every loop is approval-gated, and vendors treat the gate as a feature. Sierra monetizes exactly this shape.

**The Supaprod reinforcement stack, named precisely:**

| Substrate         | What updates                                                            | The update signal                                                  | State today                           |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| **Data layer**    | agent_memory, learnings, artifact_lineage edges, playbook_runs          | Recorded outcomes, supersessions, validations                      | Wired, human-triggered, thin volume   |
| **Policy layer**  | Trust arcs, approval modes, house rules in prompts                      | Run history, approval history, eval scores                         | Arc + floors real; house rules absent |
| **Routing layer** | Which precedent is recalled, which playbook applied, which model called | Should be outcome quality; today is similarity + static preference | **The missing keystone**              |

The Learning Ladder, used from here on to grade any learning claim:

- **L0 Static instruction** (prompts, Strategic Brief): have.
- **L1 Similarity memory** (embed, recall by cosine): have, everywhere.
- **L2 Outcome-labeled memory** (verdicts attached to what happened): have; thin organic volume; writes are human-gated by design (correct per the market: approval-gated learning is the shipped frontier).
- **L3 Outcome-weighted behavior** (retrieval rank, playbook choice, and generation change because of results): **absent. This is the rung v12 climbs.**
- **L4 Policy learning** (autonomy, budgets, routing tuned by track record): partial (trust arc is real; nothing else adapts).
- **L5 Self-revising method** (the system drafts new house rules and playbook variants from outcome clusters, human approves): absent; Sierra Expert Answers is the reference implementation.

### 3.2 The build items (all on seams the audit located, file-precise)

- **RF-01 Outcome attribution breadth (Tier 1).** Today outcomes enter only when a human records them. Chain the observers that already run into provisional outcomes: `outcome-tick` (GitHub ship detection) feeds the existing Historian draft (`suggestOutcomeVerdict`), plus the PostHog usage deltas already ingested (SEN-05, `product_analytics`, the ICE auto-adjust), plus the changeset-to-PRD join (BYO-P3). Confidence-tiered: high-confidence attributions write provisional outcomes that surface for one-click confirm; low-confidence queue as suggestions. The human gate stays (the market says it should); the human stops being the bottleneck for observation.
- **RF-02 Outcome-weighted retrieval (Tier 1). The keystone.** One ranking chokepoint serves every recall: the `match_agent_memory` RPC. Add an outcome term to its ORDER BY (fields already on the row: importance, `last_used_at`, `metadata->>'verdict'`), with decay, so a validated precedent outranks a similar-but-refuted one. Upgrades the loop, Ambient Precedent, the Critic, and chat in one migration. This is the single highest-leverage learning change in the codebase.
- **RF-03 Retrieval feedback writeback (Tier 1).** Record whether a recalled memory was used, ignored, or contradicted by the run that recalled it (the loop already touches `last_used_at`; extend to a usefulness signal). Feeds RF-02's ranking. Also finally give `ai_feedback` (thumbs) a behavioral consumer.
- **RF-04 House-rules distillation (Tier 1, L5).** A weekly steward pass that clusters validated learnings and drafts versioned, per-workspace operating rules ("bets touching checkout convert 2x when scoped under a week", "this team consistently underestimates infra work"), approval-gated like everything else, injected at the chokepoint alongside the Strategic Brief, supersedable like any decision. Sierra proved the pattern pays.
- **RF-05 Playbooks that select by win rate (Tier 1).** `rankPlaybooksByOutcome` is live and verified but nothing consumes it. At mission plan time, pick the station playbook by workspace win rate and record a `playbook_runs` row automatically per station run. This closes PLAYBOOK-REGISTRY's loop and makes "institutional judgment as software" literally true.
- **RF-06 Trust arc fed by outcome quality (Gated: pinned `loop.server.ts` + autonomy policy call).** The arc promotes on clean runs and approvals today. Add validated-outcome rate per agent and per tool (agent-track-record already computes the display); rejected outcomes hold the arc back even when runs are clean. Moves the arc from "did not crash" to "was right."
- **RF-07 Eval-driven prompt optimization (Gated: attended chokepoint work).** The AgentKit pattern on infrastructure that already exists: trace-grade `ai_events` with the eval judge, propose prompt-template diffs from graded failures, human approves, versioned in the existing prompt tables. The self-tuning loop for the platform's own agents.
- **RF-08 Loop integrity fixes (Tier 1).** The six defects in §2.4. Do first; two of them silently disable learning-adjacent crons in prod.

**What v12 explicitly does NOT do:** train or fine-tune models, autonomous self-modification without gates, or a bandit that changes behavior invisibly. Every learning write stays receipted in the Trust Ledger. Accountability scales with autonomy (doctrine law 6).

---

## 4. Program FORESEE: recognize before it falls, and reach the user

### 4.1 The doctrine

The market's proven proactive shape (§10, Amplitude, incident.io, Datadog): **detect, auto-investigate, recommend, deliver as a digest with HITL, never detect-act on user-facing surfaces.** The anti-pattern is also proven: OpenAI retired Pulse; uncontrolled ambient push loses to user-scheduled, high-precision digests. Supaprod's foresight layer therefore: watchers detect, an investigation enriches (what changed, which decisions it touches, what the precedent says), the recommendation lands as a Call or a digest item at the user's cadence, and every self-initiated act keeps its Trust-Ledger receipt.

What exists today (audited): staleness steward, scout diffs, usage-spike signals, drift incidents (engine real, schedule dead per RF-08), gate-expiry and stalled-run probes, narrative predictions every 2 hours, self-proposed missions with receipts. What is missing: calibration (nothing checks whether predictions came true), assumption-level watching (drift in the world, not just in metrics), and any channel to a user who is not looking at the app.

### 4.2 The build items

- **FS-01 Prediction contracts and calibration (Tier 1).** Every derive-tick prediction and risk insight gets a falsifiable claim, a horizon date, and a confidence. A `calibrate-tick` scores expired predictions against what happened (Brier-style), throttles generators that miss, and publishes the hit rate ("Supaprod called 7 of the last 9"). This makes foresight honest, feeds RF-02's weighting, and creates the single most quotable trust artifact the product can show a skeptic.
- **FS-02 Assumption watchers, proactive supersession (Tier 1).** At decision time, extract the assumptions a decision stands on as typed graph nodes (the ontology already has them). Watchers match incoming signals (scout diffs, competitor moves, usage deltas, contradicting learnings) against standing assumptions and open a supersession-candidate Call BEFORE the outcome fails: "this decision assumed X; Tuesday's signal contradicts it." This is the Decision Brain's push half, the strongest form of "recognize before something falls."
- **FS-03 The reach channel (Tier 1; env-gated key).** Swap the console.log in `dispatchInstantEmailScaffold` for a real sender behind the observability-style facade (BBI: BUY email delivery, Resend-class vendor, env-gated no-op without keys, founder owns the account). User-scheduled digest (daily/weekly, quiet hours, per-category prefs that already exist in schema and Settings), instant sends reserved for expiring gates and critical incidents. Slack outbound rides the same dispatcher later, behind the Business-tier write-back ruling (2026-06-27). Engine-Room: notification machinery → Settings > Notifications → "Supaprod reaches you when it matters."
- **FS-04 Risk in the brief, not a new panel (Tier 2).** Compose deriveRisk and FS-01 hit rates into the Today brief's stakes lead and the InsightRail. Today is not a dashboard; no new surface. Engine-Room: risk scoring → existing brief → "what needs you first."

---

## 5. Program BRAIN: where the knowledge lives, and the memory OS

### 5.1 The storage truth (the founder's question, answered exactly)

- **Substrate:** Supabase Postgres the workspace owns, with pgvector; embeddings are 1536-dim `text-embedding-3-small` via the governed gateway. No external memory vendor; the BBI verdict (build the intelligence, self-host the substrate, buy embeddings) holds and the market sweep re-confirms renting the brain would be moat suicide.
- **Shape:** typed rows (`agent_memory` with kinds note/reflection/outcome, `learnings`, `decisions`, `playbook_runs`, `product_analytics`) plus the typed bi-temporal graph (`artifact_lineage`: supersedes, validates, contradicts, cites, depends-on, derived-from; invalidate-never-delete; 16-hop governing-decision walk, cycle-guarded).
- **Tenancy and safety:** RLS on all 111 tables, workspace and account scoping (WM-F1/F1b/F2), service-role-only vaults for secrets, injection screens on every inbound signal.
- **Lifecycle:** Archive / Delete / Forget (2026-06-26 ruling): deleting working artifacts never erases decision and outcome memory; forgetting is a separate deliberate act. Rolling 30-day decay only for low-importance unused rows, and free-tier decay as a monetization hook.
- **Portability:** `exportWorkspace` dumps the brain as JSON. Lock-in is gravity, not a wall.

That answer should also be legible IN the product: **BRN-02 "Where your brain lives" (Tier 2)**, one calm card in Settings > Data naming the substrate, the ownership, the export, and the integrity seal. Trust is the thing serious buyers pay for; this card is cheap and disarms the data-custody question in every sales conversation.

### 5.2 The memory OS (the Obsidian instinct, honored properly)

Rendering exists: GraphCanvasView, GraphTreeView, GraphNodeStory, GraphExplorer, CompoundingPanel, the four Brain lenses, the AI analyst card. The founder's ask is the next rung: **interact, not just view.**

- **BRN-01 The operable brain (Tier 1).** On the existing Brain graph surface: click any node (decision, outcome, learning, precedent, assumption, design token) and get its object card: the receipts, the track record, what cites it, what supersedes it, its current standing. From the card, one-click actions that dispatch real work through the existing loop: re-open the decision, run the Critic against it, start a mission from it, watch this assumption (FS-02), share the receipt. Overlays that a terminal cannot show: warmth (which memories actually get recalled), contradiction hotspots, a growth time-lapse ("your brain, week by week"), and the compounding metrics strip (memory depth, lift, supersessions caught, prediction hit rate). BBI: INTEGRATE the graph viz library (never build a render engine); BUILD the object cards and actions (they are the moat made visible). Engine-Room: graph machinery → Brain destination → "your product's memory, operable."
- Scope guard: one home (Brain). No new nav. The Knowledge > Graph tab today reads a single edge table and under-delivers its name; BRN-01 is also the fix for that thinnest-door finding.

---

## 6. Program DESIGN-LEG: the third leg of the product triad

### 6.1 The gap and the wedge

The founder's read is correct and the market confirms it: AI thinned the designer out of small product teams, and every mid-2026 tool answers with generation grounded in a CONFIGURED design system (v0 registries, Figma agent, Magic Patterns style files, Lovable knowledge). **The empty cell: a system that LEARNS a team's design language from what it ships, approves, and rejects.** Design memory everywhere else is a config file. In Supaprod it can be what everything else here is: decisions with receipts that compound.

Supaprod's existing pieces: DEF-04 (spec to one-shot HTML mockup in a sandboxed iframe) and the deterministic design-readiness grader, the lineage relation types, the Critic, and internally the entire Obsidian v3 contract as proof that this company can operationalize taste. What a user gets today is honest but thin: a readiness score and a generic mockup that deliberately ignores their brand.

### 6.2 The build items

- **DSN-01 Design memory (Tier 1).** The workspace's design language as first-class brain content: tokens, type, spacing, principles, voice, patterns, each stored as a standing decision with provenance and supersession ("we moved from blue to ember on 06-12, because..."). Seeded three ways: import from a URL (extract computed styles), paste a design constitution, or accept defaults and let it learn. Every DEF-04 scaffold generation then binds this memory, so mockups come back in THEIR product's language, and every approve/reject on a scaffold writes back a design learning (the learned-taste loop nobody has).
- **DSN-02 The Design Critic lens (Tier 1).** The Critic gains a design dimension: heuristic evaluation (hierarchy, accessibility floors, IA laws) plus consistency-vs-design-memory ("this screen introduces a fourth button style; your standing pattern is two"). Receipts cite the violated principle and the standing decision. Runs on PRDs and scaffolds.
- **DSN-03 Flow before screens (Tier 2).** The artifact designers actually start with: a typed user-flow graph (steps, states, decision points) generated from the PRD, rendered as a diagram, stored with lineage edges (PRD derives flow, scaffold derives from flow). Catches the "beautiful screen, broken journey" failure that one-shot screen generation ships constantly.
- **DSN-04 The design contract rides the BuildSpec (Tier 2).** Scaffold, tokens, and flow travel with the spec into Build (and later through the BuildDriver seam to external engines), and the returning PR is checked against them (lightweight parity: tokens present, flow states covered). Design intent survives the handoff, which is exactly where it dies in every AI-codegen pipeline today.
- **DSN-05 BYO-Figma import (Gated: OAuth).** Import an existing Figma library into design memory. Integration posture per moat.md: integrate and orchestrate, never compete with the canvas.

Positioning sentence for this program: **"Your design system becomes standing decisions with receipts, and your agents design inside it."** Note the boundary: this is user-facing product capability, not the founder-gated internal design pass (SSOT ruling 2, which stays LAST and ONCE for our own surfaces).

---

## 7. Program CONVENTIONS: pressure-tested, then rebuilt from what the agent requires

### 7.1 The pressure test first (per the founder's instruction: do not just adopt the rename)

The naive move is "rename PRD to ARD and add typed fields." Stress-tested, it breaks in four places:

1. **A document is a batch artifact.** Even perfectly typed, a big up-front spec recreates waterfall at agent speed: intent goes stale between authoring and consumption, and the human is back to writing documents, which is the exact PM pain the product exists to kill.
2. **Most of a PRD is restated context.** Vision, ICP, constraints, quality bars, design language: the same paragraphs re-authored per feature. Agents with memory should never be handed context they can pull; restating it is pure friction and token latency.
3. **A static artifact cannot govern a dynamic run.** Agents discover ambiguity mid-flight. A document has no answer; a halt costs hours of latency waiting for a human; silently guessing costs trust.
4. **A standard with no consumer is a press release.** llms.txt spread because every crawler consumed it. An ARD spreads only if agents actually take it as input.

So the convention change is real, but it is a **type change plus a lifecycle change**, not a bigger template. Start from what the agent requires: small verifiable units of intent, standing context it can pull instead of being handed, oracles it can check itself against, an explicit policy for ambiguity, and a budget. Then give the human the only jobs that are genuinely theirs: intent, judgment, and accountability.

### 7.2 The design: requirements decompose into three lifetimes

| Lifetime                                                                   | What it holds                                                                                                                       | Where it lives                                                                                                               | Who authors it                                               |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Standing context** (changes rarely)                                      | Vision, ICP, positioning, constraints, quality bars, design language, house rules                                                   | The brain: Strategic Brief (JNY-02), design memory (DSN-01), house rules (RF-04)                                             | Accreted, not re-written; supersedable                       |
| **The Outcome Contract** (per bet; the artifact formerly known as the PRD) | Intent in one paragraph, evidence links, success metrics with oracle bindings, non-goals, budget and blast radius, ambiguity policy | A typed object on the graph; human view = narrative projection; agent view = the contract; clauses individually supersedable | **The agent drafts it; the human edits deltas and approves** |
| **The verification set** (per contract)                                    | Acceptance compiled to eval cases, CI checks, UAT items; everything unverifiable filed as a watched assumption                      | Evals + ExecGate + assumption register (FS-02)                                                                               | Compiled, human-tuned                                        |

Standing rules inside the contract: **a requirement without an oracle is an assumption, and assumptions get watched, not asserted. A contract without a budget and a rollback is not executable.** The document is a projection of the graph, so it is never stale, and machine view already proves the dual-projection layer platform-wide.

**ARD stays as the public name of the standard** (it is PRD-adjacent and industry-legible, the founder's instinct is right for the category move); the mechanics underneath are the Outcome Contract above. The self-audit that makes the whole argument credible: Supaprod's decision layer is typed and bi-temporal, yet `prds.body_md` is a TEXT blob today. The moat doctrine currently stops at the requirements boundary.

### 7.3 The command grammar (latency, friction, and time-to-outcome, engineered)

The founder's real question is efficiency: the right way to give the command and get the outcome fast. The grammar, each step with its latency lever:

1. **Intent in one line** (Ask, or an ambient trigger proposes it). The human authors a sentence, not a spec.
2. **The agent authors the contract in seconds**: pulls standing context, precedents, and the Critic's history; drafts intent, scope, oracles, assumptions, plan, and a cost estimate; and asks its clarifying questions **in one batch, up front** (never one at a time, never mid-run for anything reversible).
3. **The human judges deltas, not blank pages.** Edit, tighten scope, approve. This inverts the market's shape: ChatPRD makes AI draft documents for humans to own; here the contract is the agent's plan-of-record that the human governs. Authoring time collapses from days to minutes, and the human's leverage concentrates where the moat says it should: judgment.
4. **Consent is granted at the plan level** (AGT-02): approving the contract approves its reversible work as a scope; per-step gates remain only at irreversible boundaries (merge, deploy, spend, publish, outbound). Kills the residual approval round-trips without touching the safety floors.
5. **Reversible work runs speculatively** (AGT-03): while the human reviews, the agent pre-fetches evidence, pre-binds context, pre-stages scaffolds. Review latency and execution latency overlap instead of stacking.
6. **Mid-run ambiguity follows the contract's ambiguity policy:** resolve against standing context and precedent, take the reversible interpretation, log "assumption taken" with a receipt; halt only when irreversibility or budget is at stake. No more hours-long stalls for questions memory could answer.
7. **Outcomes auto-attribute** (RF-01) against the contract's oracle bindings; the learning loop closes without a meeting.

Engine-level latency levers that ride under this grammar: plan-time context pre-binding cached per mission (not re-retrieved per step), parallel dispatch of ready DAG steps (already wired, cap 10/tick), capability routing fast-models for drafting and frontier for the novel 20% (MA-1, live), and **AGT-01**: retiring the regex-parsed JSON-in-text protocol for native structured outputs per provider at the chokepoint, which removes the retry tax that is today's biggest hidden latency (the brittle-parse problem the v11 CTO villain correctly named).

### 7.4 The build items (revised after the pressure test)

- **CNV-01 The Outcome Contract type with dual projection (Tier 1).** Typed contract (JSONB sections) alongside `body_md`, backward compatible; clauses supersedable; machine view serves the contract; humans keep the narrative. Lazy migration for existing PRDs (AI structures on open, human confirms).
- **CNV-04 Agent-authored contracts (Tier 1). The friction killer.** One-line intent to a full drafted contract with cost estimate and a single batched clarification round, built from standing context plus precedent; the human edits deltas. This, not the schema, is what changes the daily feel.
- **CNV-02 The requirement-to-oracle compiler (Tier 1).** Acceptance compiles to eval cases, CI expectations, and UAT items; unverifiable clauses auto-file as watched assumptions (FS-02). Makes "agents built it, and here is proof it does what we agreed" a sentence the product can say.
- **CNV-03 Publish ARD as the dispatch standard (Tier 2; timing is the founder's call).** Reframed by attack 4: the standard's first consumers are not other PM tools but **the coding agents Supaprod dispatches to**. The ARD is the BuildSpec's parent; publish the schema as the contract external engines receive (Devin, OpenHands, Claude-SDK adapters), served over MCP and llms.txt with export/import. The standard then rides real dispatch traffic instead of hoping for adoption. The schema is open; the compounding decision-and-outcome record behind it is not.
- **AGT-02 Consent scopes (Gated: approval semantics in the pinned loop).** Plan-level consent for reversible scope; irreversible floors unchanged and non-overridable.
- **AGT-03 Speculative reversible prep (Tier 2).** Overlap review and execution; zero side effects until consent.
- **AGT-01 Structured-output protocol upgrade (Gated: attended chokepoint).** Native tool-calling and structured outputs per provider behind the existing dispatch resolver; deletes the regex-parse retry tax; measurably cuts run latency and failure rate.

### 7.5 Beyond documents: the agentic replacements table (the manifesto layer)

The same type-change logic applied across PM rituals, each mapped to what already exists or is planned here:

| The old ritual          | The agent-native replacement                                     | Where it lives                      |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| The PRD                 | The Outcome Contract (ARD), agent-authored, human-judged         | CNV-01/02/04                        |
| Status meetings         | Ambient stakeholder digests from live state                      | stakeholder-update + FS-03 (JNY-05) |
| Roadmap as a slide      | A live bet portfolio with ICE auto-adjusted from usage           | shipped (SEN-05 + ice-adjust)       |
| OKRs reviewed quarterly | Outcome contracts with oracles, scored on a window               | ARD metrics + RL-01                 |
| Backlog grooming        | Signal triage with novelty scoring                               | shipped (Signal Fabric + Focus)     |
| Sprint ceremonies       | Mission DAGs with HITL gates                                     | shipped (missions)                  |
| The annual strategy doc | A living brief with watched assumptions                          | JNY-02 + FS-02                      |
| The retro               | Auto-drafted learnings, validated and distilled into house rules | LRN-02 + RF-04                      |

This table is the "lead the industry" narrative in one artifact, and every row is either shipped or in this plan. Claim-never-outruns-wiring holds.

---

## 8. Program JOURNEY: the end-to-end test, and closing the two ends

### 8.1 The stage-by-stage verdict (PM arrives with "I want to build a product")

| Stage                                       | What the PM needs                                                      | Supaprod today                                                                    | Grade                            | Gap owner                |
| ------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------- | ------------------------ |
| Vision and strategy                         | Form the vision, ICP, positioning; make the "right call" with evidence | Strategic Brief (free text, injected everywhere); no formation flow              | THIN                             | JNY-02                   |
| Market, competitor, tech-shift intelligence | Continuous, decision-grade competitive and trend awareness             | researcher-tick (daily brief, keyed off), scout-tick (diffs, keyed off), signals | PARTIAL (keys + synthesis depth) | JNY-01                   |
| Discovery                                   | Signals in, clustered, scored                                          | Signal Fabric: 8 connectors, MCP sources, novelty, Focus                         | DEEP                             | ship keys (founder)      |
| Decide                                      | Evidence-backed calls, red-teamed, precedent-loaded                    | Critic + precedent + governing chain + Trust Ledger                              | DEEP                             | RF-02 makes it smarter   |
| Define                                      | Specs agents can execute                                               | PRD + AI assist + readiness; prose-shaped                                        | REAL                             | CNV-01/02                |
| Plan and sequence                           | Tasks, dependencies, dispatch                                          | Task graphs, Linear dispatch (topological, idempotent)                           | DEEP                             | none                     |
| Design                                      | Flows, mockups, design system, critique                                | Readiness + one-shot generic mockup                                              | THIN                             | DSN-01..05               |
| Build                                       | Code written, staged, reviewed, merged                                 | Studio spine + delegate-out; CI + eval gates                                     | DEEP                             | BuildDriver (G13, gated) |
| Test / QA                                   | Prove it does what the ARD says                                        | CI gate + evals exist, disconnected from acceptance                              | PARTIAL                          | JNY-03                   |
| Ship / release                              | Merge, changelog, release notes                                        | Shipped (BYO-P3): changelog, notes, outcome-tick                                 | REAL                             | deploy = BYO-P5 (gated)  |
| Launch / GTM / marketing                    | Launch plan, messaging, channel drafts, success metrics armed          | Launch-kit generator exists in Build; nothing else                               | THIN                             | JNY-04                   |
| Stakeholders (continuous)                   | Everyone in the loop without meetings                                  | One-keystroke status update + packs; no send, no cadence                         | PARTIAL                          | JNY-05 (+FS-03)          |
| Learn                                       | Did it work; what do we now believe                                    | LRN-02 + W1-AUTO + supersession + lift metric                                    | DEEP (thin volume)               | RF-01                    |

**The shape:** a deep middle, thin ends. The two ends are precisely the founder's "three steps before code" and "after shipping." Closing them makes "everything I want gets done here" true across the lifecycle rather than true in the middle.

### 8.2 The overwhelm test (value without complication)

What protects the felt simplicity, verified: one intent bar (Ask) that classifies into missions, five outcome-named destinations plus one Engine Room door, 28 legacy routes as silent redirects, auto-cleared reversible gates (the babysitting tax fix), a brief that leads with stakes, jargon de-jargoned, and now the Obsidian port making the whole shell a calm instrument. The remaining overwhelm risks, called honestly: the Engine Room's 14 tabs are a lot (grouping shipped, density remains), onboarding is the port's OBS-14, and the connector catalog shows tiles that do not work yet (Figma, Jira, the token-starved fleet), which reads as broken promises to a new PM. The fix for the last one is one afternoon: mark unprovisioned tiles "coming soon" or hide them (claim-never-outruns-wiring applies to catalog chrome too); folded into RF-08.

### 8.3 Where a PM still leaves the product (retention leaks, ranked)

1. Design (fixed by DSN program), 2. Launch/GTM assets (JNY-04), 3. Outbound comms: email/Slack of anything (FS-03/JNY-05), 4. Deep analytics exploration (inbound loop exists; PostHog stays the drill-down tool by design, integrate posture), 5. User interviews and research ops (out of scope now; adjacent-market note in v11 §16 stands), 6. Deploy (BYO-P5, founder-gated).

### 8.4 The build items

- **JNY-01 The strategy head: competitive and market intelligence as decisions (Tier 1).** Upgrade researcher-tick and scout from "signals in the feed" to a structured competitor and trend registry: tracked entities, their moves diffed and summarized weekly, tech-shift briefs, each linked into the graph so FS-02 can watch decisions against them ("we bet on X assuming competitor Y lacked it; Y shipped it Tuesday"). First watch targets seed themselves from the workspace's own domain plus the founder's watchlist. (Also the internal watch item: airfocus's June 2026 "strategic drift detection" claims, teardown scheduled through this exact machinery.)
- **JNY-02 The living strategy brief (Tier 2).** The Strategic Brief graduates from free text to a structured, versioned decision cluster: vision, ICP, positioning, top bets, each with watched assumptions and receipts, surfaced on Brain/Today per the v11 reuse note. The founder's "how would the right call be made" for the highest-level calls, answered with the same machinery as every other call.
- **JNY-03 The test station (Tier 2).** Compile ARD acceptance (CNV-02) into an executable test plan per mission: CI expectations, eval cases, UAT checklist; verdicts recorded back onto the decision and the Trust Ledger. The fast-oracle station, finally first-class.
- **JNY-04 Launch and GTM kit (Tier 2).** From a shipped decision and its receipts: launch plan, positioning and messaging derived from the WHY already in the graph, channel drafts (changelog is live; announcement pages exist), a launch checklist, and success metrics armed as an RL-01 outcome window. GTM artifacts as projections of the decision record, not fresh prose from nothing.
- **JNY-05 Ambient stakeholder loop (Tier 2).** The one-keystroke status update becomes a scheduled, audience-tuned digest through FS-03 (exec/eng/board variants already exist as packs); write-back posting to Slack rides the Business-tier ruling. Nobody chases the PM for status again, which is the pain survey's number one.

---

## 9. The buyer, the investor, the power user: is the justification there

**The power-user PM (daily):** the felt loop holds end to end in the middle; after this front, the product also opens their day with calibrated foresight (FS-01/03/04), lets them operate their memory (BRN-01), designs inside their language (DSN), and writes their status updates to stakeholders on cadence (JNY-05). The babysitting tax is fixed; the overwhelm risks are named and cheap. The remaining honest ask of them: record or confirm outcomes (RF-01 shrinks this to one click).

**The buyer (VP/Head of Product):** governance is real (RLS, RBAC, approval floors, audit trails, integrity seal, export), pricing is decided (credits not seats, account pooling), and after RF/FS the pitch gains the two proofs buyers actually probe: a measurable learning curve and calibrated foresight. The known sales-motion gaps stay founder-gated on purpose (Stripe go-live, connector OAuth registrations, tier flips).

**The investor:** the villain masks from v11 §9 stay answered, and v12 adds the metric layer that makes the moat legible in diligence. **PRF-01 The proof surface (Tier 1):** compose the Gauntlet (acceptance rate, ritual retention, autonomy ratio), the memory-lift split (MOAT-METRIC), the admin materialized views that already exist (cost per decision, decision velocity, supersession rate), plus the new prediction hit rate (FS-01), babysitting-tax trend, and supersessions-caught, into one investor-safe panel with honest sparse-data states. The sentence it exists to prove: **"the system gets measurably better at this workspace's decisions as its memory grows, and here is the curve."**

**The one-line depth answer, grounded:** a UI layer cannot re-plan a mission at 3 a.m. from a cron, hold a merge behind CI and eval gates, walk a 16-hop governing-decision chain, seal its ledger with SHA-256, or refuse its own agent a tool because that agent's track record has not earned it. All of that is in the code and live. What was missing was learning-that-changes-behavior, foresight-that-reaches-you, and two lifecycle ends, and that is precisely this front.

---

## 10. The market frontier, mid-2026 (evidence for every bet above)

Full sourced sweep in the session record; the strategic extract:

1. **Self-improving agents shipped today** = approval-gated memory distillation (Cursor, Devin, Claude Code), retrieval over outcomes (Sierra Expert Answers, +4% resolution in their A/B), eval-driven prompt optimization (OpenAI AgentKit trace grading), playbook/skill distillation (the Agent Skills standard). All system-level, all model-agnostic, all human-gated. **Nobody ships "learns what decisions this team made and how they turned out." The moat cell stays empty, and the BYOK constraint is validated as no handicap.**
2. **AI PM tools**: drafting is fully commoditized ($15 to 60/maker/mo plus credits: ChatPRD, Productboard Spark, Rovo, Notion, Linear agents). Claimed intelligence is feedback clustering and context persistence. **One direct encroachment to watch: airfocus relaunched 2026-06-01 as "product intelligence" claiming "strategic drift detection", a launch-post claim, not evidenced. Hands-on teardown queued via JNY-01.** Linear's agent platform trajectory is the second watch item.
3. **AI design tools**: multi-screen generation grounded in configured design systems is table-stakes (v0 registries, Figma agent open beta, Stitch 2.0, Magic Patterns, Lovable knowledge). **Learned design language from shipped/approved/rejected work: nobody.** DSN-01's exact opening.
4. **Proactive agents**: the working pattern is detect, auto-investigate, recommend into Slack/email digests with explicit HITL (Amplitude, incident.io, Datadog Watchdog); OpenAI retired Pulse, proving ambient push without user-controlled cadence dies. **For strategic signals (drift from stated strategy, decision risk, precedent contradiction) the field is empty except the unverified airfocus claim.** FS-01/02/03 are aimed at exactly that empty field.

---

## 11. The build plan: G15, sequenced under the founder's port

**Sequencing law:** the founder set the Obsidian port (G14) as the active front this morning; it stays ranked first. G15 items are registered Tier 1/Tier 2 so lanes pick them after the port's foundation block, and engine-lane work (server, migrations, crons) does not collide with port-lane work (surfaces) if run in parallel. Founder may promote any G15 item explicitly.

| ID     | Item                                                                                                     | Tier  | Size | Needs founder?                                     |
| ------ | -------------------------------------------------------------------------------------------------------- | ----- | ---- | -------------------------------------------------- |
| RF-08  | Loop integrity fixes (stale crons, tool-enablement, fail-closed, agent-tick, eval-tick, catalog honesty) | 1     | S    | No                                                 |
| RF-01  | Outcome attribution breadth                                                                              | 1     | M    | No                                                 |
| RF-02  | Outcome-weighted retrieval (the keystone)                                                                | 1     | S    | No (one migration + tests)                         |
| RF-03  | Retrieval feedback writeback                                                                             | 1     | S    | No                                                 |
| RF-04  | House-rules distillation                                                                                 | 1     | M    | No                                                 |
| RF-05  | Playbook selection by win rate                                                                           | 1     | S    | No                                                 |
| FS-01  | Prediction contracts + calibration                                                                       | 1     | M    | No                                                 |
| FS-02  | Assumption watchers (proactive supersession)                                                             | 1     | L    | No                                                 |
| FS-03  | The reach channel (email digest facade)                                                                  | 1     | M    | Env key only (Resend-class; account founder-owned) |
| PRF-01 | The proof surface                                                                                        | 1     | M    | No                                                 |
| BRN-01 | The operable brain (memory OS)                                                                           | 1     | L    | No                                                 |
| CNV-01 | Outcome Contract type + dual projection                                                                  | 1     | M    | No                                                 |
| CNV-04 | Agent-authored contracts (intent to drafted contract, human judges deltas)                               | 1     | M    | No                                                 |
| CNV-02 | Requirement-to-oracle compiler                                                                           | 1     | M    | No                                                 |
| JNY-01 | Strategy head: competitive/trend intelligence                                                            | 1     | M    | Firecrawl key presence check                       |
| DSN-01 | Design memory (learned)                                                                                  | 1     | M    | No                                                 |
| DSN-02 | Design Critic lens                                                                                       | 1     | S    | No                                                 |
| BRN-02 | "Where your brain lives" card                                                                            | 2     | S    | No                                                 |
| DSN-03 | Flow before screens                                                                                      | 2     | M    | No                                                 |
| DSN-04 | Design contract rides the BuildSpec                                                                      | 2     | M    | No                                                 |
| JNY-02 | Living strategy brief                                                                                    | 2     | M    | No                                                 |
| JNY-03 | Test station                                                                                             | 2     | M    | No                                                 |
| JNY-04 | Launch/GTM kit                                                                                           | 2     | M    | No                                                 |
| JNY-05 | Ambient stakeholder loop                                                                                 | 2     | S    | Tier ruling already made                           |
| FS-04  | Risk in the brief (no new panel)                                                                         | 2     | S    | No                                                 |
| AGT-03 | Speculative reversible prep (overlap review and execution)                                               | 2     | M    | No                                                 |
| CNV-03 | Publish ARD as the dispatch standard                                                                     | 2     | S    | Timing call                                        |
| RF-06  | Trust arc fed by outcomes                                                                                | Gated | M    | Pinned chokepoint + autonomy policy                |
| RF-07  | Eval-driven prompt optimization                                                                          | Gated | M    | Attended chokepoint work                           |
| AGT-02 | Consent scopes (plan-level approval, irreversible floors unchanged)                                      | Gated | M    | Approval semantics in the pinned loop              |
| AGT-01 | Structured-output protocol upgrade (kills the regex-parse retry tax)                                     | Gated | M    | Attended chokepoint work                           |
| DSN-05 | BYO-Figma import                                                                                         | Gated | M    | OAuth registration                                 |

Founder decision list (small): the FS-03 email vendor account and key; the CNV-03 publish timing; the three Gated items above; and the standing key-provisioning pile that already exists in SSOT §4 (Firecrawl, PostHog, connector tokens, Stripe go-live) which this plan repeatedly makes more valuable but never blocks on.

---

## 12. Session inputs and decisions (2026-07-02)

| #   | Founder input (distilled from voice)                                                                                                                                                                                               | What it produced                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Adversarial analysis: agentic-first OS claim, where does reinforced learning come from, agent should recognize/notify/predict before failure, what are we lagging, what to build/modify, how to deliver value, implementation plan | The audit method (§13), §2 scorecard, §3 REINFORCE, §4 FORESEE, §11 plan                                                                         |
| 2   | Buyer/investor/power-user lens: "really doing the job or a UI layer?", core users justified?                                                                                                                                       | §2.2/§2.3, §9, PRF-01                                                                                                                            |
| 3   | Use skills and agents at maximum potential; better strategy on designing and modeling the platform                                                                                                                                 | Six parallel audit/research agents + cadence-design skill; this doc                                                                              |
| 4   | PM journey test end to end: value without overwhelm; starts three steps before code (market, competitors, tech shifts, vision); plan; stakeholders; testing after build; ship; then marketing/GTM                                  | §8 journey table + JNY program                                                                                                                   |
| 5   | Where is the knowledge layer stored; visual agentic OS layer for memory; Obsidian-style interaction, one-click actions, metrics a terminal cannot show                                                                             | §5 storage truth + BRN-01/02                                                                                                                     |
| 6   | Should conventions like PRD/TRD be reinvented for agents (an ARD); revolutionize across the PM domain; lead the industry, creative but implementable                                                                               | §7 CONVENTIONS + the replacements table                                                                                                          |
| 7   | Do not just adopt my PRD-to-ARD framing; pressure-test it, think from what the agent requires: the right command shape, efficient outcomes, lower latency, less friction, shorter time-to-outcome                                  | §7.1 stress test (the rename fails four ways), §7.2 three-lifetime decomposition, §7.3 command grammar + latency levers, CNV-04 and AGT-01/02/03 |

Decisions logged in [session-decisions.md](./session-decisions.md) (2026-07-02 v12 entry); the raw reasoning in [strategic-inputs-log.md](./strategic-inputs-log.md) (2026-07-02 entry).

---

## 13. Provenance

Produced 2026-07-02 by a max-effort audit session: four parallel read-only code auditors (learning loop write/read paths with file:line evidence; the 21-hook unattended layer and notification reality; the agent loop, 44-tool registry, mesh, chokepoint, and build spine; the route-by-route depth inventory, connector reality map, and design capability), one mid-2026 market sweep (primary sources: vendor docs, changelogs, launch posts; Devin, Cursor, Claude Code, Sierra, OpenAI AgentKit, Manus, Lindy, Zapier, Glean, ChatPRD, Productboard, airfocus, Linear, Rovo, Notion, Zeda, Amplitude, v0, Figma Config 2026, Stitch, Lovable, Magic Patterns, Subframe, UX Pilot, Krea, Datadog, incident.io, PostHog, Salesforce, Slack), one strategy-canon compression (moat.md, v8, v9, engine-room doctrine, design trio, BYO/build-driver pair, last founder rulings, dashboard state, README), plus direct in-session verification (storage substrate, brain components, PRD schema, journey modules, rerank mechanics). Cross-checked against the live-verified SSOT and dashboard records of 2026-06-24 to 2026-07-02. Related canon: [v11](./v11-guiding-star.md) · [moat.md](./moat.md) · [signal-fabric](../features/signal-fabric.md) · [model-agnostic](../features/model-agnostic.md) · [build-driver-and-dispatch](./build-driver-and-dispatch.md) · [byo-build-and-supaprod-cloud](./byo-build-and-supaprod-cloud.md) · [engine-room-doctrine](../conventions/engine-room-doctrine.md) · [DESIGN-OBSIDIAN](../design/archive/obsidian-v3.md) · [obsidian-port-plan](../planning/archive/retired-design-eras/obsidian-port-plan.md) · [the role map](./README.md) · [feature-dashboard](../planning/feature-dashboard.md) · [SOURCE-OF-TRUTH](../planning/SOURCE-OF-TRUTH.md).
