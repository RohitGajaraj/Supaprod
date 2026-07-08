# Mission: Ship-Week Full Closure (the Fable goal) -- Treat this as an reference document only., what you haev to do will from your goal prompt ultimately. 

> _Created: 2026-07-07 · Owner: founder · Executor: the next Fable session (and its swarm)_
>
> **What this is.** In one week this product SHIPS to real end consumers: a live, production, consumer-grade, enterprise-grade application that a stranger can sign up for and use unassisted. This is NOT demo preparation; a demo also happens, but the demo is just one user's walkthrough of a genuinely live product. This document is the single goal to feed that session: take Cadence from "row-complete" (the board reads 285/292) to **journey-complete and consumer-live**: every stage of the product lifecycle runs end to end, autonomously, on real data, with agent swarms doing the work and the human appearing only at judgment gates, and the whole thing open for real sign-ups. This mission supersedes the normal register pick-order for the week, exactly as the Loom mission did on 2026-07-04.
>
> **Read order before acting:** this file, then [`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md) section 0, then [`overnight-platform-pass.md`](./overnight-platform-pass.md) (the flagged-migration list), then the v12 canon ([`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md)) for the learning-loop depth model, then [`../strategy/build-driver-and-dispatch.md`](../strategy/build-driver-and-dispatch.md) for the build-engine seam. The Claude Code lessons this mission applies are logged in [`../strategy/strategic-inputs-log.md`](../strategy/strategic-inputs-log.md) (2026-07-07 entry).

---

**Instruction to you to follow:**

Those changes make the prompt stronger. Here's the revised version with your requested updates incorporated:

**Mission: Build Cadence as if it were conceived and shipped inside the world's best AI-native companies that have built category-defining products.**

Your first responsibility is **not** to implement this prompt. It is to identify everything that is missing, incomplete, inconsistent, incorrectly modeled, or not yet finalized. Challenge assumptions, rethink workflows, discover gaps, define the right solution, and build it. Treat every instruction here as guidance, not a constraint. If you find a better product direction, architecture, terminology, workflow, capability, or operating model, you have full authority to replace it. Optimize for solving real customer problems, product-market fit, monetization, adoption, and long-term product quality, not adherence to existing documentation.

Execute **docs/planning/mission-demo-week.md** end to end. Build only. Documentation, design polish, and strategy logging happen in one final pass. Work continuously. Close one seam completely before moving to the next. Swarm parallel agents within the active seam. Never leave the tree red. Every cycle must pass typecheck, build, tests, deployment, and production validation.

This is **not** a refinement of the existing application. This session exists to design and build the complete product from first principles. The output should be a consumer-grade, enterprise-grade, AI-native platform that feels like it was created by the teams behind the world's best AI products.

Our core belief is that building software is becoming commoditized. The real value is deciding **what** to build and **why**. Cadence must become the AI-native Product Operating System that continuously senses, reasons, validates, decides, builds, learns, and compounds knowledge autonomously.

My suggestions below are only starting points. You should expand them significantly. Include anything missing from modern product management, AI-native software development, autonomous execution, organizational intelligence, and agentic operating systems. If something should exist but I haven't mentioned it, build it.

The platform should autonomously capture signals, cluster evidence, discover opportunities, prioritize with confidence, generate Agentic Requirement Documents instead of traditional PRDs, validate assumptions, design experiences, generate implementation plans, execute both existing-product and new-product build paths, manage Git workflows, testing, self-healing, deployment, promotion, production rollout, reviews, learnings, and continuously improve future decisions through accumulated memory and **reinforcement learning**.

Design every missing capability completely, including Brain architecture, long-term memory, reasoning, multi-agent orchestration, autonomous handoffs, Engine Room, Trust Ledger, Today, Design Station, Goal Mode, Loop Mode, insight compounding, administration, pricing, tenant safety, governance, failure recovery, observability, production operations, and anything else required.

Think beyond today's terminology. Reinvent concepts where appropriate. Replace user journeys with agent journeys, PRDs with Agentic Requirement Documents, workflows with autonomous loops, and introduce new abstractions wherever they create a fundamentally better product.

This is an **agent-first platform**, not simply software using AI. The finished application must itself provide autonomous multi-agent capabilities to end users. Agents should own planning, execution, verification, coordination, recovery, memory, learning, intelligent handoffs, and autonomous decision making with minimal human intervention.

Use real implementations, real data, and truthful system behavior. No placeholders. No fake logic. No UI polish. Founder authority overrides any previous doctrine, design principle, architecture, or documentation that prevents the right product decision. Correctness, tenant safety, and honesty remain non-negotiable.

**The mission is complete only when the platform autonomously senses signals from multiple sources, discovers opportunities, prioritizes, validates, defines, designs, builds, tests, deploys, reviews outcomes, compounds learnings into the Brain through accumulated memory and reinforcement learning, updates the system state, and continuously executes the complete product lifecycle through its autonomous multi-agent ecosystem with only minimal human supervision.** If a better direction emerges during execution, pursue it and build the product as if it were launching from one of the world's best AI-native product companies.


## 0. How to run this mission (operating mode)

**Rule zero: BUILD ONLY.** This mission runs under the standing **BUILD-ONLY MODE** founder ruling (`AGENTS.md` §3, active): the full documentation loop is SUSPENDED for build work. Past missions of this shape burned large fractions of their budget on documentation passes, design passes, strategy entries, and re-audits, and still did not land an enterprise-grade application; this mission does not repeat that. The only writing allowed during the mission, exactly per the standing rule: (a) the one-line WHY on each commit (hook-enforced, cheap), (b) the ONE required trace, flipping the feature-dashboard row status and adding a short one-line note when a seam closes, (c) ticking this file's per-stage progress marks, (d) appending to the founder-blockers list in section 6. Nothing else: no SSOT §0/§6 prose, no feature-doc creation, no `plan.md` §4 appends, no `strategic-inputs-log.md`/`session-decisions.md` captures, no doc-closure-checklist runs, until the single post-mission batch pass (one session, after section 7 runs clean).

1. **Continuous closure, swarm within the seam.** No day-by-day plan; the founder works continuously. Take the seams in section 4's order, close one FULLY (oracle met, gates green, pushed) before starting the next, and swarm WITHIN the active seam: parallel workers on its parts, each with a tightly scoped prompt (the stage's spec paragraph from section 3, the file list, the oracle), claiming files via the dashboard's In-Dev claim line only (one line, no prose). At most one seam of look-ahead prep is allowed, and only when the active seam is waiting on the founder.
2. **Token economy is a hard constraint (Fable budget is limited).** No re-audits of anything section 2 already states as verified. Targeted greps and partial reads over full-file reads. Never re-read the strategy canon; this file is the distillation. Adversarial review is reserved for chokepoint files and migrations only (see section 5); everything else ships on gates alone. If a worker's report exceeds a page, it is too long.
3. **Gate every cycle on correctness only:** `npx tsc --noEmit` + `bun run build` + `bun test` (the 3 known `resolveEmbedRoute` env fails are the only allowed reds). Never leave the tree red. Commit with a WHY, push `origin main`.
4. **ZERO UI/UX polish work.** Founder constraint, stated twice. This week is core functionality and platform capability only. "Design" in this mission means the design _station_ (a product capability for users, section 3.4), never restyling Cadence's own screens. If a capability needs a surface, build the plainest honest surface that the existing dim-17/DetailKit standard already provides and move on.
5. **Real data only, honest gates.** Never fabricate. Where a capability is blocked on a secret or founder call, wire it fully, gate it honestly, and add it to the founder-needs list (section 6) instead of faking or silently dropping.
6. **When blocked, flag and keep moving.** Post the blocker to section 6's live list, pick the next stage. Nothing waits idle on the founder.
7. **Verify by driving, not by claiming.** A stage's oracle is met by a live run against the real app (or a real test that exercises the seam), never by "the code looks right." The walkthrough in section 7 is the terminal oracle.
8. **Founder autonomy grant (2026-07-07, explicit).** The strategy canon, doctrine rules, design principles, and version docs are GUIDANCE for this mission, not shackles. Several were written for earlier iterations and may now be stale. If any documented rule, principle, or prior ruling blocks the right build call for the vision (an agentic-first, autonomous, consumer-live product), you have full authority to supersede it: make the call, note it in ONE line in this doc's section 6 ledger so the post-mission batch pass can reconcile the canon, and keep building. What this grant does NOT cover (still non-negotiable): the correctness gates, real-data honesty, tenant/RLS safety, secrets handling, and the founder-gated items in section 6.

---

## 1. Doctrine: the seven Claude Code lessons this mission applies

From Anthropic's "Making of Claude Code" oral history (analysis logged 2026-07-07 in the strategic-inputs log):

1. **Capability before chrome.** "The model just wasn't ready for the product we wanted to build. But then it was." The form factor reveals itself once the capability crosses the threshold. This week is capability week; the surfaces already exist.
2. **The fix-ships-in-minutes loop.** Claude Code's team shipped fixes immediately with no review restrictions, backed by auto-updates and good metrics. Our equivalent: correctness-only gates, push to main, Lovable picks it up in seconds.
3. **Small team, forced leverage.** "Keeping the team small... forced us to use Claude more. Otherwise we couldn't go fast enough." One founder + swarms is the model, not a limitation to apologize for.
4. **Trust is a curve, not a toggle.** "Everyone was reading every single permission request... these days a huge portion just auto-accept. Claude has earned their trust." Build the graduation mechanism (section 3.10), don't just build the gate.
5. **Build for the next model.** "You have to build something that works 20 or 30 percent of the time now, so that when the next model comes out, it works 80 percent." Wire every seam even where today's reliability is partial; gate honestly; the capability curve does the rest.
6. **Primitives beat features.** "If it can read, edit, and run bash, it can do anything." Cadence's primitives are: signal, decision, contract, mission, outcome, learning. Every closure below strengthens a primitive, not a one-off feature.
7. **The product outgrows its founding idea.** The USP is the decision layer (knowing WHAT to build is the expensive thing now; building it is commoditized). Everything else exists to feed and prove that layer.

---

## 2. Ground truth (verified 2026-07-07, do not re-audit, extend)

- Board: 285/292 strict (97.6%). The 7 open rows are gated (SANDBOX on Cloudflare container bindings, BYO-P5 remainder, DSN-05 Figma OAuth, CMD H2 at 70%, OBS-PORT tail) or deferred. **The remaining work is not rows; it is seams.**
- All canonical surfaces passed the overnight dim-17/DetailKit pass; tree green; 2403 tests.
- OpenHands delegate (`delegate.openhands`) is live-verified end to end twice on Railway (founder-run, 2026-07-01). The BuildDriver seam (BD-1..6) is designed but deferred.
- The learning keystone shipped (RF-01..03: outcome-weighted retrieval + feedback writeback), but compounding is thin: outcomes are read as a ranking signal, not yet distilled into pushed insight.
- Flagged migrations from the overnight pass are the known schema gaps: `stage_events` (the most repeated flag), `agent_approvals` snooze + `mission_id`, decision alternatives-considered + cited-by, learning attribution, LOOP-PROVE outcome-seal persistence, non-trace incidents.
- Today's brief renders but the founder's verdict stands: "a data dump rather than insightful information," and "not properly segregated."
- Ambient autonomy exists as crons + triggers (event reactor, ambient sense, ambient trigger, foresight watch). There is **no standing-goal layer**: nothing lets the user state an objective and have the swarm keep working toward it across days.

---

## 3. The closure spec: stage by stage, each with its DONE-WHEN oracle

Work the stages roughly in the order below (dependencies noted). Each stage lists: what exists, the gap, the build, and the oracle. Ship each stage's oracle as a real test or a demonstrated live run, never a claim.

### 3.0 Foundations first (Day 0) ✅ CLOSED 2026-07-07 (oracle met live: a real click wrote opportunity backlog->now to stage_events in production and the Stage history block rendered it; migration applied; commit c7eecba7 deployed)

**Build:** the `stage_events` migration (one lightweight table: `entity_type`, `entity_id`, `from_stage`, `to_stage`, `actor` (human/agent slug), `at`, `workspace_id`, RLS-aware) plus a write on every stage transition across specs, missions, opportunities, decisions. Then the small flagged migrations: `agent_approvals` snooze/defer + `mission_id`; decision `alternatives_considered` + cited-by counter; learning attribution; LOOP-PROVE outcome-seal persistence; `trace_id`-less incidents.
**Why first:** every later stage's "how did this move through the pipeline" proof reads from this table, and the Brain's compounding (3.8) needs transition history as a learning signal.
**DONE-WHEN:** every stage change anywhere in the app writes a `stage_events` row; the per-entity timeline renders from real rows; all flagged migrations from the overnight pass are landed or explicitly founder-gated.

### 3.1 SENSE (Discover): signals flow in without a human

**Exists:** ingest, normalize, tag, auto-cluster (AMBIENT-SENSE), webhook ingest, demo feed.
**Gap:** breadth is demo-fed; at least one real external source must flow live for the demo week (the highest-value first connector is GitHub, already the ruling).
**Build:** finish one real connector end to end (GitHub App: issues + release + star/traffic signals into the signal ontology). OAuth registration itself is founder-gated (section 6); everything up to the credential must be complete so the founder pastes a secret and it lives.
**DONE-WHEN:** a real external event (e.g. a new GitHub issue on a bound repo) lands as a signal, is auto-tagged, and joins/forms a cluster with zero human action, and the trail is visible (SIG trace ref, `stage_events`).

### 3.2 DECIDE: the opportunity pipeline ranks, red-teams, and self-initiates

**Exists:** auto-clustering into opportunities, deterministic ICE re-rank (DEC-RANK), bet designations (FROZEN terminology), the Critic red-team, decision cards, ambient triggers.
**Gap:** the decide stage is the USP and it must _prove_ its judgment loop: every ranked bet should carry its evidence trail, its Critic counter-argument, and its precedent ("last time we reasoned this way, here is what happened"), fed by the now-shipped outcome-weighted retrieval.
**Build:** (a) wire the Ambient Precedent recall into the decision card as a first-class "what happened last time" block backed by real `learnings` rows; (b) record `alternatives_considered` on every decision (the new column from 3.0) so the Brain can later learn from paths not taken; (c) verify the ambient trigger genuinely self-originates a re-rank when a cluster crosses threshold (live-run it).
**DONE-WHEN:** opening any decision shows evidence, Critic verdict, precedent, and alternatives, all from real rows; a threshold-crossing cluster demonstrably self-initiates a Decide mission with no human start.

### 3.3 DEFINE: the ARD replaces the PRD as the primary artifact (answering "why is it still PRD?")

**Exists:** the Outcome Contract (CNV-01/02), the published ARD standard (`/ard`, CNV-03, export/import, MCP `get_ard`), oracle-classified acceptance clauses. The founder is right that the surface still says "PRD" while the canon (v12) already ruled the ARD is the dispatch contract.
**Build:** promote the ARD to the user-facing primary. The route/DB identifiers stay (`prds` table, per the Studio-rename precedent: legacy internal identifiers are never migrated), but the artifact users author, review, and dispatch is the **Spec whose compiled form is the ARD**: agent-authored, human-judged-by-deltas (the v12 inversion), every requirement shipping its oracle. Concretely: the draft flow leads with the contract (not free prose), the dispatch payload IS the ARD, and the copy says spec/ARD, not PRD.
**DONE-WHEN:** creating a spec from an opportunity produces a contract-first artifact with oracles per clause; dispatching to Build sends the ARD as the machine contract; no user-facing surface says "PRD."

### 3.4 DESIGN: the third leg becomes a real station (product capability, NOT Cadence styling)

**Exists:** design memory as standing decisions (DSN-01), flow-before-screens (DSN-03), scaffold persistence + speculative prep (AGT-03), design-contract-rides-build (DSN-04 native half).
**Gap:** design is not yet a _station in the pipeline_ the way Decide and Build are; it runs as scattered functions.
**Build:** make Design a first-class stage between Define and Build: spec approved → flow generated → scaffold generated against the workspace's design memory → a single design gate (approve/reject, which writes back into design memory as taste learning) → then Build dispatch includes the approved scaffold + tokens in the ARD payload. The `stage_events` table records the design transition like any other.
**DONE-WHEN:** a spec demonstrably cannot reach Build without passing the design stage (or the workspace explicitly configuring the stage off); an approve/reject at the design gate writes a taste learning; the dispatched ARD carries the design contract.

### 3.5 BUILD: the engine question answered, both build shapes closed

**The OpenHands ruling stands, strengthened.** Is OpenHands the right call? Yes, as the first owned premium engine: it is MIT, self-hostable, already deployed on Railway, and live-verified twice. The _structural_ answer to "is there something better" is the BuildDriver seam: promote **BD-1 only** this week (extract the `BuildDriver` interface, wrap the native loop as the "native" adapter and OpenHands as the second), so the engine question becomes a config choice forever instead of a rebuild. Do NOT build the Claude-Agent-SDK/Devin/Cursor adapters this week (BD-3+ stays founder-gated).
**The two build shapes, both must work:**

- **Feature-add to an existing repo (the primary demo path):** ARD dispatch → branch created via RepoProvider → engine builds on the branch → changeset lands as a real PR with per-hunk curation → CI-green + eval-regression gates hold the merge → merge on approval. Most of this spine exists (I1/I2/I3, J1/J2); this week's job is to run it end to end as ONE motion and fix every seam that breaks.
- **New build from zero (the "it made an app" demo moment):** ARD dispatch with no bound repo → provision a fresh repo via RepoProvider (template scaffold) → engine builds → deploy to a live URL (3.7). If repo-provisioning is not yet real, build it; it is the one genuinely new piece in this stage.
**Git/SCM discipline for agent-written code:** every mission = one branch; commits carry the mission trace ref and a WHY; the PR body links the ARD and the decision; merge only through the gate. This is already the house pattern; enforce it in the driver, not in prompts.
**DONE-WHEN:** both shapes run live: (a) a feature-add mission goes spec → PR → gated merge with zero human keyboard time except the approval click; (b) a new-build mission goes spec → fresh repo → deployed URL. Each run's full trail (branch, commits, PR, gates) is visible from the mission.

### 3.6 TEST: the oracle loop is the autonomy license

**Exists:** oracle-classified clauses compile into a per-mission test plan (JNY-03); CI-green gate; eval-regression gate; self-correct-on-red-CI is emergent via MergeBlocked.
**Build:** close the self-correction loop deliberately: red CI → the engine reads the failure → stages a fix → re-runs, bounded by a retry budget, all without a human. Where the SANDBOX row is still gated on Cloudflare container bindings, use the honest fallback (CI as the oracle runner + Deno preview) and say so; do not fake a sandbox.
**DONE-WHEN:** a deliberately-broken test injected into a mission demonstrably triggers autonomous diagnose-fix-rerun to green within the retry budget, with every attempt on the trust ledger.

### 3.7 SHIP: merge is not the end; a live URL is

**Exists:** Deno Deploy capability (BYO-P5b, founder picked Deno over Cloudflare), release notes (K1), launch kit + launch plan (JNY-04).
**Gap:** the founder's exact words: "how does it go and land on the real application... that part is not yet figured out."
**Build:** wire merge → auto-deploy to a preview URL → a single promote-to-production gate (human click, recorded as an approval). For the new-build shape, first deploy creates the app; for feature-add, deploy updates it. Release notes + the launch plan attach to the shipped artifact automatically. The 30-day outcome window (JNY-04) arms on ship.
**DONE-WHEN:** the demo can walk merge → preview URL → promote → production URL without leaving Cadence, and the ship writes its `stage_events` row + arms its outcome check.

### 3.8 LEARN: outcomes close the loop and the system gets measurably smarter

**Exists:** outcome attribution breadth (RF-01), outcome-weighted retrieval (RF-02), retrieval feedback writeback (RF-03), trust-arc blocking on missed outcomes (RF-06), calibration on foresight.
**Build:** (a) predicted-vs-actual outcome reviews as a real scheduled motion (the LRN-02 shape): when an outcome window closes, the system drafts the review, scores the original bet designation against reality, and writes the learning with attribution (the new column from 3.0); (b) a **compounding pass**: a scheduled job that distills accumulated learnings into standing decisions/playbooks when a pattern repeats (3 same-shaped learnings → a proposed standing rule, human-confirmed), so memory gets _smarter_, not just bigger.
**DONE-WHEN:** an expired outcome window demonstrably produces a drafted review + a scored prediction; a repeated pattern demonstrably produces a proposed playbook; the Gauntlet's memory-lift metric (MOAT-METRIC) reflects the new rows.

### 3.9 BRAIN: the memory OS pushes, not just stores ✅ ORACLE MET LIVE 2026-07-08 (seeded a missed outcome against the rank-1 best bet on production; the Brain's derive-tick autonomously pushed a `bet_contradiction` insight into Today's "Needs your judgment" lane with a working "Re-rank the queue" one-click that navigated to Decide and settled the insight to `acted`)

**Exists:** the typed bi-temporal graph, supersession engine, outcome-weighted recall, the graph surface, object cards.
**Gap (founder):** "how does the agent know what insights to pass on to the user": the Brain answers questions but does not _volunteer_.
**Build:** an insight-push channel: the highest-signal Brain events (a supersession that flips a live decision's ground, a precedent that contradicts a bet currently ranked "best bet", a calibration miss on a watched assumption) surface as items in Today's "needs your judgment" lane (3.11) with one-click actions, throttled hard (max 2 to 3 a day, digest the rest). This is the v12 detect-investigate-recommend doctrine, pointed at the PM.
**DONE-WHEN:** seeding a contradicting outcome against a currently-ranked bet demonstrably produces a pushed insight in Today with a working one-click action, and the throttle provably caps the volume.

### 3.10 AUTONOMY: goal mode, loop mode, and the trust ramp (the "agentic-first" proof)

This is the founder's "how do we bring Claude Code's loop/goal mode into PM" ask, and the week's signature capability.
**Build three things:**

- **Goal mode (standing objectives):** a first-class `goals` object: the user states an outcome ("grow activation 15% this quarter", "ship the mobile onboarding revamp"), and the swarm continuously works it: watching signals against it, proposing opportunities into Decide, drafting specs, advancing missions, reporting progress. Powered by the existing cron + event-reactor spine; the goal is the standing prompt the ambient layer re-plans against. HITL stays exactly at the existing gates (decision, design, merge, promote).
- **Loop mode (bounded recurring missions):** "re-run competitor sweep weekly", "re-score the opportunity pipeline nightly", "review expired outcomes daily" as user-visible recurring missions with run history, cost per run, and a pause switch. Most of these already run as hidden crons; promote them to governed, user-owned loops.
- **The trust ramp (the Cat Wu curve, made mechanical):** per tool + agent, after N clean approvals the system _proposes_ graduating `review` → `confirm` → `auto` (never silently flips; the proposal itself is an approval item; RF-06's missed-outcome blocker already guards the downside). Ship the proposal mechanism.
**DONE-WHEN:** a goal created in the demo demonstrably spawns its first proposed opportunity without a human start; a loop shows its run history and cost; a trust-graduation proposal demonstrably appears after the Nth clean approval and takes effect only on acceptance.

### 3.11 PLATFORM TRUTH: Today, Engine Room, Trust Ledger, Settings/Admin, pricing ◐ TODAY FOUR-LANE ORACLE MET LIVE 2026-07-08 (production Today renders exactly four segregated lanes from real rows: Needs-your-judgment [the pushed insight], What-the-swarm-did [5 stage-event moves], At-risk/watch [honest-empty], Shipped-and-what-it-cost [9 outcomes, avg $0.08/outcome, real verdicts]; the founder's "data dump / not segregated" verdict is resolved). Ledger unbroken-chain renders in code; demo data thin (rich-seed item).

- **Today (founder: "not properly segregated"):** re-cut Today's content model into exactly four lanes: **Needs your judgment** (gates + pushed insights, the only ember), **What the swarm did** (since you last looked, grouped by goal/mission), **At risk / watch** (foresight + calibration), **Shipped and what it cost** (outcomes + cost-per-outcome). This is an information-architecture change (what is computed and grouped), not a restyle.
- **Engine Room:** the governance panels are wired to real data (done); ensure every number a user will see traces (spend, loop health, drift, evals). Reskin stays deferred per the velocity ruling.
- **Trust Ledger:** with `stage_events` + outcome seals landed (3.0), the ledger should walk an unbroken chain for any mission: signal → decision → contract → design gate → build → test attempts → merge → deploy → outcome. Verify the chain renders complete; fix any gap in the receipts, since this IS the moat made visible.
- **Settings/Admin/pricing:** no new scope. Verify the admin console, workspace/tenancy, and the dormant credit engine are launch-safe (metering stays OFF unless the founder flips it; pricing page renders from the catalog; go-live remains founder-config-only per the standing ruling).
**DONE-WHEN:** Today renders the four lanes from real data; a mission's full chain walks end to end on the Trust Ledger with zero missing links.

### 3.12 PRODUCTION SHIP: open the doors to real consumers

This stage is what separates "great demo" from "shipped product," and it is mandatory.
**Build/verify:**

- **The cold-start path:** a brand-new user signs up (real signup, not the demo accounts), lands in an empty workspace, and reaches first value without a guide: connect a source (or start from the intent bar), get a first clustered signal set or a first drafted opportunity, and be shown the one next action at every step. Empty states must DO something (offer the action), not just say something. This is functionality, not styling.
- **Multi-tenant safety under strangers:** RLS posture verified via the Supabase advisors (zero criticals), the cross-tenant write classes already fixed stay fixed (regression tests exist), rate/cost guards armed for unknown users (the owner spend caps + per-workspace budgets shipped in WM; verify they bind for a fresh workspace), auth edge cases (verify email, reset, join-workspace) live-tested.
- **A minimal failure-detection floor:** the full AFD initiative stays founder-gated, but shipping to consumers blind is not acceptable. Inside the existing observability facade seam, land the minimal floor: server-side error capture to a store the founder can read, a health endpoint, and an uptime ping. No vendor SDK outside `src/lib/observability/` per the standing rule.
- **Production config truth:** all crons registered and ticking in the production DB (the delegate-poll-tick class of incident must not recur); all migrations applied; env/secrets verified present in prod; the published app URL serves the current build.
**DONE-WHEN:** a fresh account created on the production URL by someone with zero context completes signup → first value → first governed action unassisted, and the founder can see errors if any part of that path breaks.

### 3.13 THE FELT JOURNEY: excite, surprise, and let them SEE it (capability, not styling)

The founder's test, in his words: "if I come, how does the user journey look? How does it excite me? How does it surprise me? How can I see it?" Claude Code's history names the same beats: Boris watching Robert's screen ("it's doing my coding"), Austin Ray's first five minutes ("this is going to fundamentally change everything"). These are capability moments, and this mission must land at least three of them inside a new user's FIRST session, all real, never canned:

- **Excite (it is DOING it, in front of you):** within minutes of connecting a source or stating an intent, the user watches agents visibly working on THEIR data in real time: signals clustering live, an opportunity forming, a spec drafting itself, with the working agents and their progress visible as it happens (the existing loop-progress and fleet machinery, pointed at the first session).
- **Surprise (it pushed back / it already knew):** the first unprompted moment: the Critic counter-arguing the user's own first idea with evidence, or a precedent surfacing ("teams that shipped this shape saw X"), or a pushed insight arriving in Today that the user never asked for. The surprise IS the decision layer proving it thinks.
- **See it (the glass engine):** one click from any artifact walks the visible chain of what the machine did and why (the Trust Ledger trail, the mission's live cockpit, the Brain's graph neighborhood for a decision). The user never has to trust a claim; they can always watch the machinery.

**DONE-WHEN:** a first-session recording (agent-driven, fresh account, production) demonstrably contains all three beats with zero seeded shortcuts, and each beat is reachable by an obvious action a stranger would naturally take.

---

## 4. The closure order (continuous, not calendar)

No day-by-day plan. Work is continuous; each numbered seam below is closed FULLY (oracle met, gates green, pushed) before the next begins. The week is the deadline, not the schedule.

1. **Foundations:** 3.0 migrations + `stage_events` writes everywhere. Unblocks every later proof.
2. **The spine, as one motion:** 3.5 Build (BD-1 seam + both build shapes) + 3.6 Test + 3.7 Ship, run continuously until a real spec goes to a real deployed URL. Highest risk, highest value; it goes first after foundations.
3. **The loop closes:** 3.8 Learn + 3.9 Brain push + 3.2 Decide precedent wiring. The moat, working.
4. **Autonomy:** 3.10 goal mode + loop mode + trust ramp; then 3.3 ARD promotion; then 3.4 design station.
5. **Platform truth:** 3.11 (Today's four lanes, Engine Room traceability, the unbroken ledger chain) + 3.1 connector to the founder-gated credential boundary.
6. **Production ship:** 3.12 cold-start + tenant safety + failure floor + config truth, and 3.13 the felt journey.
7. **The terminal run:** an agent drives section 7's walkthrough on a fresh production account; every failure is a defect queue; fix, rerun, repeat until clean; founder applies gated inputs (section 6); a final fresh-account run comes back clean; the doors open.

---

## 5. Guardrails (the short non-negotiable list; everything else yields to rule 8's autonomy grant)

- No UI/UX polish, no restyling, no new design passes on Cadence's own surfaces. (Founder, twice.)
- No fabricated data, ever. Honest gates over fake demos.
- Frozen terminology stays frozen (bet designations; ember = the one needs-a-human accent; no em or en dashes anywhere, authored or generated).
- Monetization/billing stays config-gated; do not touch go-live.
- Migrations: timestamped, RLS-aware, through `supabase/migrations/`, hook-checked. Live-DB facts via Lovable/Supabase MCP, never guessed.
- Chokepoint files (`loop.server.ts`, trust, `runtime.server.ts`) and every migration get an adversarial review before merge; nothing else does (token economy, rule zero).
- The closed documentation loop is SUSPENDED for this mission (rule zero) and repaid in one post-mission batch pass: SSOT section 0, the dashboard, `plan.md` section 4, feature docs, and the decisions log all catch up in a single session after section 7 runs clean.

---

## 6. Founder-gated inputs (the human's week, kept short)

The swarm wires everything up TO these boundaries; the founder supplies:

1. **GitHub App registration** (id/slug/secret) → activates the 3.1 connector + tightens the 3.5 repo flows.
2. **Confirm the OpenHands Railway endpoint + key are still live** (they were on 2026-07-01) → 3.5's premium engine path.
3. **Cloudflare container bindings** (if the real SANDBOX is wanted for the demo; otherwise the honest CI fallback stands).
4. **Slack bot token** (optional: activates the stakeholder write-back for the demo).
5. **Publish + apply migrations** on each Lovable push that carries schema (Day 0 especially).
6. **Ratify the ARD promotion** (3.3) and the design-station gate default (3.4 on-by-default vs opt-in).
7. **The launch monetization posture** (3.12): free at launch with metering off, or flip the credit engine live (needs your Stripe keys). The engine is built and dormant; this is a config decision, not build work.
8. **The name call** (section 8) - only if wanted before launch.

**Autonomy-grant ledger (rule 8 one-liners, reconciled post-mission):**
- 2026-07-07 seam 2: one-motion consent - an approved Outcome Contract lifts studio.commit + studio.pr.open to auto (loop.server.ts resolveToolMode); the merge gate stays review-pinned; supersedes the HIGH_RISK_MIN_CONFIRM floor for exactly those two tools under contract approval.
- 2026-07-07 seam 2: studio.fix.commit (new bounded CI-fix appender) follows the arc dial instead of the high-risk floor; safety lives in the tool (pr_open-only + fix budget); enables the autonomous red-CI self-correction loop.

**Live founder-gated additions discovered during the build:**
- 9. **Apply migration `20260707210000_seam2_build_spine.sql`** (fix budget, build_driver, ci tool seeds, ci-poll-tick cron) before the seam-2 push deploys.
- 10. **DENO_DEPLOY_ACCESS_TOKEN in the Lovable/worker env** (it exists in the local .env; the preview/promote deploy path gates honestly on it in production).
- 11. **Lovable auto-deploy looks STUCK (flagged 2026-07-08 ~00:30 IST):** the served bundle hash has not changed across the seam-2, seam-3, and lane SW-4/SW-5 pushes; production is still serving the pre-seam-2 build. Check the Lovable build/deploy log and re-trigger; every seam's live oracle is blocked on this.
- 12. **Apply migrations `20260708091000_seam3_insight_push.sql` + `20260708093000_seam3_playbook_proposals.sql`** (both dormant-by-design until applied; the push channel and the compounding pass turn on when they land).
- 13. ~~Apply the four SW-4 migrations~~ **CLOSED (live-verified 2026-07-08, anon REST probe, second pass after the founder's manual apply): all four are on the live DB. `goals` (+ `opportunities.goal_id`), `trust_graduation_proposals`, `agent_tool_modes`, `loops`/`loop_runs`, and the `design_gate_status`/`design_stage_enabled` columns all answer 200.** Goal mode, the trust ramp, loop mode, and the design-station gate are live end to end (the goal-tick/loop-tick pg_cron registrations ride the same migration files, so they applied with them).

---

## 7. The acceptance walkthrough (this is the mission's terminal oracle)

The mission is DONE when a **brand-new consumer account on the production app** can perform this live, unrehearsed, unassisted. The founder's presentation is this same walkthrough; if a step needs the demo accounts or a seeded shortcut to work, that step is a defect.

0. **Sign up fresh** on the production URL, land in an empty workspace, and reach first value (a first signal set or drafted opportunity) with the product itself pointing to the next action at every step.
1. Open **Today**: four clean lanes; one item in "Needs your judgment" is a pushed Brain insight with a precedent.
2. Show **Discover**: a real external signal (GitHub) that arrived today, auto-clustered.
3. Open **Decide**: the ranked pipeline; open the best bet; show evidence, Critic counter-argument, precedent ("last time, here is what happened"), alternatives considered.
4. One click: **draft the spec**. The contract (ARD) is agent-authored; the founder judges deltas, not prose. Every clause has its oracle.
5. The **design gate**: flow + scaffold generated against design memory; approve (a taste learning is written).
6. **Dispatch to Build**: watch the mission take a branch, build, open a PR. Inject a failing test; watch it self-correct to green. Approve the merge.
7. **Ship**: preview URL → promote → production URL, without leaving Cadence. Release notes + launch plan attach themselves.
8. Open the **Trust Ledger**: walk the unbroken chain from the morning's signal to the deployed URL.
9. Open a **Goal** created on Day 4: show what the swarm did toward it overnight with no human start, and this week's cost-per-outcome.
10. Show the **trust ramp**: the system proposing an autonomy graduation it has earned.

Every step that cannot run is a defect to fix, not a caveat to script around.

---

## 8. The /goal string (paste this to Fable, verbatim)

The goal command carries a size limit, so the full spec lives in this file and the goal string is the pointer plus the non-negotiables. Paste exactly this:

> Execute docs/planning/mission-demo-week.md end to end. Ship Cadence to real end consumers within the week: consumer-grade, enterprise-grade, live on production, a stranger can sign up and run the full loop unassisted. BUILD ONLY: all documentation, design polish, and strategy logging deferred to one post-mission batch pass; token-lean (no re-audits, scoped worker prompts, adversarial review only on chokepoints and migrations). Work continuously, no calendar plan: close one seam FULLY (oracle met, gates green, pushed) before the next, in the doc's section 4 order, swarming with parallel agents WITHIN the active seam. The seams (doc section 3): stage_events foundations; Decide precedent + alternatives; ARD as the primary spec artifact; the design station gate; BuildDriver BD-1 seam with both build shapes (feature-add spec to PR to gated merge, and new-build spec to fresh repo to deployed URL); autonomous test self-correction to green; merge to preview to promote-to-production inside Cadence; outcome reviews + compounding learnings; Brain insight push into Today; goal mode + loop mode + trust-ramp graduation; Today re-cut into four lanes; unbroken Trust Ledger chain; production cold-start, tenant safety, failure-detection floor; and the felt first-session journey (excite / surprise / see-it beats, all real). Gate every cycle on tsc + build + test, never leave the tree red, push origin main, real data only, zero UI/UX polish. Wire founder-gated items to their boundary and list them in the doc's section 6 instead of blocking. Founder grant: full authority to supersede any doctrine, design principle, or strategy rule that blocks the right build call (log one line in the doc's section 6 ledger); correctness gates, real-data honesty, and tenant safety stay non-negotiable. The goal is met only when a brand-new account on the production app completes the section 7 walkthrough, signup to shipped URL, unassisted.

If the command rejects that length, the minimal fallback is:

> Execute docs/planning/mission-demo-week.md fully: build-only, token-lean; close the section-3 seams one after another in section-4 order, swarming within each; gates green every cycle; done only when a fresh consumer account on production completes the section-7 walkthrough unassisted.

---

## 9. Naming (LAST, founder-only, zero build time) --> Founder is not happy with any of the recommendations here below, so please work on it at the last thing. but you can also think while working if you come across something new words somethign randoma dn hooky, we can take this activity at the last. 

Per the founder: a fresh product name is welcome ("Cadence" is taken), but this is the final activity, acted on only at the end, and only by the founder. The prior rename brief already recommends **Selvedge** (`loom/brand/rename-brief.md`, the woven self-finished edge: the loop that seals itself). Fresh candidates in the same spirit, all needing a trademark/domain check before any commitment:

- **Warpline** - the threads a loom holds under tension; the through-line every decision hangs on.
- **Keelson** - the spine that ties a ship's keel to its frame; the structural memory under the vessel.
- **Northloop** - the loop that always points somewhere; plain, ownable, .com-plausible.
- **Quillon** - coined (the crossguard of a blade); defensible, brandable, meaning-light.
- **Tacksman** - the one who decides when to change tack; judgment as the product.

Recommendation if forced today: keep presenting as Cadence for the demo week; a rename two days before a presentation is risk with no upside. Decide the name after the demo lands.

---

_Closure rule: when this mission completes, fold its results into SOURCE-OF-TRUTH section 0, mark this doc CLOSED at the top exactly like the overnight-pass handoff, and log the week's decisions in `session-decisions.md`._

**Live-oracle findings (2026-07-08, seams 3+5 driving):**
- 13. **DEFECT FIXED (migration `20260708100000`): empty agent roster on signup.** handle_new_user (2026-06-17 rebuild) stopped seeding public.agents, so a fresh signup + the demo account had no 'builder' agent and "Send to Build" threw "Studio agent not found in your roster". Restored the seed + backfilled agent-less profiles. FOUNDER: apply this migration; it unblocks cold-start (3.12) and the build-spine oracle (3.5).
- 14. **DESIGN CALL surfaced: the Brain's insight-push is gated behind `workspaces.auto_sense_enabled`** (it rides derive-tick's workspace selection). A user who hasn't opted into ambient signal-clustering still never gets their Brain's high-signal judgment pushes. Consider decoupling the push channel from the sense opt-in. For the oracle, ambient sense was enabled on the demo workspace so the next derive-tick fires the push.
- 15. **Trust Ledger chain (3.11 deliverable B) now walks fully** in code: receipts carry build/deploy blocks, clickable evidence edges, the proving learning, per-record StageTimeline, and mission-scoped links. The demo data itself is thin (no changeset/deployment rows on the sample mission yet) - a DEMO-SEED-RICH item, not a code gap.

**Live-oracle findings (2026-07-08, SW-7 terminal run, lane3 - first full section-7 drive on production, demo account):**
- 16. **Step-by-step scorecard:** step 1 four lanes ✓ / pushed-insight-with-precedent absent (judgment lane 0 calls - derive-tick cadence + finding 14; verify after the next tick). Step 2 auto-clustering ✓ (7 ranked themes) / NO GitHub signal - root cause confirmed on the Engine Room glance: "No sources connected to this workspace yet". Step 3 pipeline + best-bet ✓ / precedent + alternatives were MISSING on the bet sheet - **DEFECT FIXED** (`c485875a`): `getOpportunityJudgment` (read-only precedent recall + considered-against-the-queue) + two honest sheet blocks; live after the next publish. Step 8 the mission-chain walk IS LIVE on production ✓ but all three demo missions read all-pending (finding 15's DEMO-SEED-RICH; a real step 4-7 run would light one). Steps 9/10: the Goals + Loops surfaces are live on /plan ✓ but the demo workspace has no goal and no loop, so nothing overnight to show. Steps 4-7 not driven this run (see 17).
- 17. **FOUNDER (blocking the remaining oracle):** (a) **publish HEAD** - the step-3 judgment fix and everything since `c5dd59b5` is on main but not live; (b) **connect a GitHub source to the demo workspace** (Engine Room → Open connections) - unblocks step 2 (signal today) AND steps 6-7 (the build spine needs a bound repo); (c) **set one standing Goal + one Loop on the demo workspace** (or approve an agent doing it) so step 9 has an overnight trail; (d) step 0 (fresh-signup cold start) still needs one virgin-account run - migration 20260708100000 (finding 13) must be live first.
- 18. **Console noise on the login page:** a stale refresh-token 400 (AuthApiError) fires on logged-out visits from a prior session's storage. Cosmetic (login renders fine, a truly fresh browser never sees it), but the demo machine should visit once and re-login before the presentation.
- 19. **Seam-2 spine oracle driven live (goal session), reaches the same repo boundary as finding 17b:** dispatch WORKS end to end - "Add a /health endpoint..." created mission MIS·98247F and the builder agent RAN with no "Studio agent not found" error, validating the roster fix (13) in the live flow. Found + fixed a SECOND roster gap lane3's run did not hit: the demo user's TOOL roster was missing the build tools (had only ci.logs + studio.fix.commit), so the agent hallucinated tool names (`ls`, `github.repo.contents`) and halted; re-seeded via `seed_studio_tools` RPC, so repo.tree/read + studio.stage/commit/pr.* are now present. This makes the demo/sample-seed roster incompleteness a two-part DEMO-SEED item (agents AND tools). The remaining wall is exactly finding 17b: no bound repo, so the code-write leg hits the honest NOT_CONNECTED credential boundary. Everything up to that credential is wired and functional.

**Live-oracle findings (2026-07-08, SW-7 second drive, lane3 - post-publish + GitHub bound, findings 17a-c CLEARED):**
- 20. **Findings 17a-c all cleared and verified live:** publish confirmed (the step-3 judgment blocks render on the bet sheet); GitHub bound (Engine Room: ROHITGAJARAJ/TEST-PROJECT-CADENCE · CONNECTED). Step 4 DRIVEN: Draft-spec produced PRD·EBA796 from the best bet, agent-authored with citations. Step 9 SEEDED live: standing goal "Lift bank-link activation completion 15% this quarter" ACTIVE + Competitor-sweep loop ACTIVE (first run completed with an honest nothing-to-brief + run history + $0 cost).
- 21. **DEFECT FOUND + CLEARED: the demo account held 2 credits vs a 32-credit draft projection** - the SW-6 cost guard fired correctly and blocked the whole action chain at step 4. Granted 500 via Admin → People (reason on the grant ledger). FOUNDER: the demo/presentation account needs a standing credit provision, or the walkthrough dies at step 4 for every fresh grader - a third DEMO-SEED part (agents, tools, credits).
- 22. **DEFECT FOUND: goal creation has no idempotency guard** - a double submission created two identical ACTIVE goals (one now paused). A dedupe on (workspace, normalized title, active-status) belongs in the goals fn.
- 23. **DEFECT FIXED (`91f7402f`): /plan/spec/$id rendered the Plan list, not the spec editor** - the LOOM W2 session (e9ef7d14, interrupted at its session limit) moved Plan to the index position but never deleted the old parent route; a parent with no Outlet swallows every child, so Send to Build / contract tabs / the full editor were unreachable product-wide. Stale route deleted. NEEDS PUBLISH.
- 24. **DEFECT FIXED (`15abc7d8`, chokepoint edit under the section-8 grant): the unknown-tool corrective now restates the valid catalog** (or says "(none enabled)" so the agent finalizes honestly) - the recovery half of finding 19's dead-mission loop: even with the roster re-seeded, any future tool-blind run self-corrects instead of inventing five names and dying. NEEDS PUBLISH. Related presentation defect, still open: the Build missions LIST showed the dead MIS·98247F as "SHIPPED · FINISHED" while its detail honestly says BLOCKED/HALTED - the list chip lies about a failed mission.

**Seam-2 spine oracle, FULL live drive 2026-07-08 (goal session, after all migrations applied + repo bound + published):**
- 25. **The build spine is proven end to end on REAL infrastructure, blocked only on one GitHub App permission (extends lane3's finding 20 past step 4 into the actual code-write).** With the roster + tools fixed and `RohitGajaraj/Test-Project-Cadence` bound, mission MIS·706BA8 ran and: (1) called repo.tree + repo.read against the real repo; (2) hit a studio.stage arg error (missing per-change `op`) and **self-corrected autonomously** ("I will correct the studio.stage call by including the required 'op' field") - mission 3.6's self-correction demonstrated live; (3) staged 2 REAL files (health.json create +96, index.html update +306/-106) on the bound repo; (4) reached studio.commit, which failed with a precise, honest error: **the GitHub App/integration needs 'Contents: Write'** on the repo (it has read - which is why repo.tree/read worked). build_driver stamped 'native' (BD-1 seam confirmed). FOUNDER: grant the Cadence GitHub App **Contents: Write** on Test-Project-Cadence (App Permissions, or re-install with write) - that single grant unblocks commit -> PR -> CI -> gated merge -> Deno preview -> promote. Everything up to the write is wired, functional, and self-correcting; "claim never outruns wiring" - the code is correct, the credential is read-only.
- 26. **Minor real defect (non-blocking): the builder's first studio.stage call omits the required per-change `op` field** (schema wants 'create'|'update'|'delete'). The agent self-corrects on the injected error every time, so it costs one wasted step, not the run. Worth tightening the studio.stage tool description or defaulting op='update' to save the round-trip.

**Live-oracle findings (2026-07-08, SW-7 third drive, lane3 - concurrent with the goal session's drive above; only the non-overlapping items):**
- 27. **The step-1 judgment flow is proven live end to end:** the rerun's studio.stage/commit gates surfaced as Calls on Today (the featured Call, tool/model/spend metadata, honest consequence line) and were answered with the designed keyboard flow ("A approves") - queue advanced, hero re-rendered. The GitHub 403 then landed exactly at the goal session's finding-25 boundary.
- 28. **DEFECT FIXED (`7f257571`): the hero read "One call need your judgment today."** - singular verb now pinned by test. NEEDS PUBLISH. Two smaller open items from the same screen: the My-day strip flashed "FOCUS DIDN'T LOAD · RETRY" (transient load failure worth a look), and finding-24's list-chip lie (a dead mission shown SHIPPED · FINISHED) still stands.
