# Mission: Ship-Week Full Closure (the Fable goal)

> _Created: 2026-07-07 · Owner: founder · Executor: the next Fable session (and its swarm)_
>
> **What this is.** In one week this product SHIPS to real end consumers: a live, production, consumer-grade, enterprise-grade application that a stranger can sign up for and use unassisted. This is NOT demo preparation; a demo also happens, but the demo is just one user's walkthrough of a genuinely live product. This document is the single goal to feed that session: take Cadence from "row-complete" (the board reads 285/292) to **journey-complete and consumer-live**: every stage of the product lifecycle runs end to end, autonomously, on real data, with agent swarms doing the work and the human appearing only at judgment gates, and the whole thing open for real sign-ups. This mission supersedes the normal register pick-order for the week, exactly as the Loom mission did on 2026-07-04.
>
> **Read order before acting:** this file, then [`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md) section 0, then [`overnight-platform-pass.md`](./overnight-platform-pass.md) (the flagged-migration list), then the v12 canon ([`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md)) for the learning-loop depth model, then [`../strategy/build-driver-and-dispatch.md`](../strategy/build-driver-and-dispatch.md) for the build-engine seam. The Claude Code lessons this mission applies are logged in [`../strategy/strategic-inputs-log.md`](../strategy/strategic-inputs-log.md) (2026-07-07 entry).

---

## 0. How to run this mission (operating mode)

**Rule zero: BUILD ONLY.** Past missions of this shape burned large fractions of their budget on documentation passes, design passes, strategy entries, and re-audits, and still did not land an enterprise-grade application. This mission inverts that. Every token goes to working code and live verification. Documentation, design polish, strategy logging, and doc-loop upkeep are all DEFERRED to a single post-mission batch pass (one session, after the demo script runs clean). The only writing allowed during the mission: (a) the one-line WHY on each commit (hook-enforced, cheap), (b) ticking the per-stage progress ledger in section 3 of THIS file, (c) appending to the founder-blockers list in section 6. Nothing else. No SSOT rewrites, no dashboard prose, no feature docs, no session-decision entries until the batch pass.

1. **Continuous closure, swarm within the seam.** No day-by-day plan; the founder works continuously. Take the seams in section 4's order, close one FULLY (oracle met, gates green, pushed) before starting the next, and swarm WITHIN the active seam: parallel workers on its parts, each with a tightly scoped prompt (the stage's spec paragraph from section 3, the file list, the oracle), claiming files via the dashboard's In-Dev claim line only (one line, no prose). At most one seam of look-ahead prep is allowed, and only when the active seam is waiting on the founder.
2. **Token economy is a hard constraint (Fable budget is limited).** No re-audits of anything section 2 already states as verified. Targeted greps and partial reads over full-file reads. Never re-read the strategy canon; this file is the distillation. Adversarial review is reserved for chokepoint files and migrations only (see section 5); everything else ships on gates alone. If a worker's report exceeds a page, it is too long.
3. **Gate every cycle on correctness only:** `npx tsc --noEmit` + `bun run build` + `bun test` (the 3 known `resolveEmbedRoute` env fails are the only allowed reds). Never leave the tree red. Commit with a WHY, push `origin main`.
4. **ZERO UI/UX polish work.** Founder constraint, stated twice. This week is core functionality and platform capability only. "Design" in this mission means the design _station_ (a product capability for users, section 3.4), never restyling Cadence's own screens. If a capability needs a surface, build the plainest honest surface that the existing dim-17/DetailKit standard already provides and move on.
5. **Real data only, honest gates.** Never fabricate. Where a capability is blocked on a secret or founder call, wire it fully, gate it honestly, and add it to the founder-needs list (section 6) instead of faking or silently dropping.
6. **When blocked, flag and keep moving.** Post the blocker to section 6's live list, pick the next stage. Nothing waits idle on the founder.
7. **Verify by driving, not by claiming.** A stage's oracle is met by a live run against the real app (or a real test that exercises the seam), never by "the code looks right." The demo script in section 7 is the terminal oracle.

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

### 3.0 Foundations first (Day 0)

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

### 3.9 BRAIN: the memory OS pushes, not just stores

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

### 3.11 PLATFORM TRUTH: Today, Engine Room, Trust Ledger, Settings/Admin, pricing

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

## 5. Guardrails (standing, non-negotiable)

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

> Execute docs/planning/mission-demo-week.md end to end. Ship Cadence to real end consumers within the week: consumer-grade, enterprise-grade, live on production, a stranger can sign up and run the full loop unassisted. BUILD ONLY: all documentation, design polish, and strategy logging deferred to one post-mission batch pass; token-lean (no re-audits, scoped worker prompts, adversarial review only on chokepoints and migrations). Work continuously, no calendar plan: close one seam FULLY (oracle met, gates green, pushed) before the next, in the doc's section 4 order, swarming with parallel agents WITHIN the active seam. The seams (doc section 3): stage_events foundations; Decide precedent + alternatives; ARD as the primary spec artifact; the design station gate; BuildDriver BD-1 seam with both build shapes (feature-add spec to PR to gated merge, and new-build spec to fresh repo to deployed URL); autonomous test self-correction to green; merge to preview to promote-to-production inside Cadence; outcome reviews + compounding learnings; Brain insight push into Today; goal mode + loop mode + trust-ramp graduation; Today re-cut into four lanes; unbroken Trust Ledger chain; production cold-start, tenant safety, failure-detection floor; and the felt first-session journey (excite / surprise / see-it beats, all real). Gate every cycle on tsc + build + test, never leave the tree red, push origin main, real data only, zero UI/UX polish. Wire founder-gated items to their boundary and list them in the doc's section 6 instead of blocking. The goal is met only when a brand-new account on the production app completes the section 7 walkthrough, signup to shipped URL, unassisted.

If the command rejects that length, the minimal fallback is:

> Execute docs/planning/mission-demo-week.md fully: build-only, token-lean; close the section-3 seams one after another in section-4 order, swarming within each; gates green every cycle; done only when a fresh consumer account on production completes the section-7 walkthrough unassisted.

---

## 9. Naming (LAST, founder-only, zero build time)

Per the founder: a fresh product name is welcome ("Cadence" is taken), but this is the final activity, acted on only at the end, and only by the founder. The prior rename brief already recommends **Selvedge** (`loom/brand/rename-brief.md`, the woven self-finished edge: the loop that seals itself). Fresh candidates in the same spirit, all needing a trademark/domain check before any commitment:

- **Warpline** - the threads a loom holds under tension; the through-line every decision hangs on.
- **Keelson** - the spine that ties a ship's keel to its frame; the structural memory under the vessel.
- **Northloop** - the loop that always points somewhere; plain, ownable, .com-plausible.
- **Quillon** - coined (the crossguard of a blade); defensible, brandable, meaning-light.
- **Tacksman** - the one who decides when to change tack; judgment as the product.

Recommendation if forced today: keep presenting as Cadence for the demo week; a rename two days before a presentation is risk with no upside. Decide the name after the demo lands.

---

_Closure rule: when this mission completes, fold its results into SOURCE-OF-TRUTH section 0, mark this doc CLOSED at the top exactly like the overnight-pass handoff, and log the week's decisions in `session-decisions.md`._
