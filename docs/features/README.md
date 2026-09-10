# docs/features/: Per-feature operator & demo guides

> _Created: 2026-06-06 · Last updated: 2026-06-19_

> Every shipped, user-facing Supaprod feature gets one canonical page here. This is the **single place** to open when running a demo, onboarding a new operator, or remembering what a feature actually does months later. Strategy and bundle plans live in [`../strategy/`](../strategy/) and [`archive/agent-ecosystem-plan.md`](./archive/agent-ecosystem-plan.md); architecture contracts live in [`../../architecture/`](../../architecture/); the build log lives in [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4. **These per-feature pages are the demo deliverable**: they consolidate, they do not invent.

## When to add a file here

Add a `docs/features/<slug>.md` page in the same commit that ships any feature that:

- adds a route, panel, or modal an operator interacts with, OR
- adds an agent capability the operator can see or approve, OR
- you would point to during a demo or sales call.

Internal-only refactors, schema-only changes, and pure infrastructure work do **not** need a feature page (they belong in `architecture/*.md` and `docs/planning/archive/build-log.md` §4 only).

## File template (every page follows this skeleton)

```text
# {F-ID} — {Feature name}

> Status · Shipped YYYY-MM-DD · Route(s) · Owner agent(s)

## What it does          (one paragraph)
## Why it exists         (one paragraph, link to plan.md §4 entry)
## Where to find it      (nav path, route, panels)
## Demo script           (≤ 90s, numbered, read-aloud)
## How it works          (tables, server fns, tools — 5–10 bullets, link architecture/*.md)
## Governance & guardrails (approval modes, RLS scope, kill-switches)
## Verification checklist (concrete "is this live and correct" steps)
## Known limits / out of scope
## Related                (plan.md entry · architecture/*.md · feature-backlog row · siblings)
```

## Index

| ID | Feature | Status | Route(s) | Doc |
| --- | --- | --- | --- | --- |
| **Lifecycle, signal to learning** | The end-to-end account of the seven stations, station by station, with a `file:line` for every structural claim · what arrives · what the human does · what the agents do unattended · tables · tools · how a recorded outcome re-ranks the next bet · the demo script · the verified gaps | ✅ **Code-verified 2026-08-02** (supersedes the unverified `docs/design/*-station-audit.md` for canon) | `/discover` · `/decide` · `/plan` · `/design` · `/build` · `/ship` · `/learn` | [`lifecycle-signal-to-learning.md`](./lifecycle-signal-to-learning.md) |
| **Spine delivers** | The seven-station loop runs on its own AND produces an artifact at every station *(⚠️ 2026-08-11: Decide's only artifact-creating agent hand threw on every call from 2026-08-01 to 2026-08-11, because the DB check constraint did not permit `source_kind='agent'`. Fixed. **The honest tense is wired and proven, not accruing.**)* · crew per station · the handoff · no advancing on silence · clusters become work · track spend ceiling · live agent activity | ✅ **Shipped + verified live 2026-08-01** (migrations applied, deployed) | every station surface · `/boundary` · `cron.cluster-tick` · `cron.track-tick` | [`spine-delivers.md`](./spine-delivers.md) |
| DBR (H1) | The Decision Brain (typed decision knowledge graph; the moat engine) | 📋 Horizon bet 2026-06-20 · TOPMOST priority | engine + Brain surface (`/chat`, `/memory`) | [`decision-brain.md`](./decision-brain.md) |
| DBR · inc 1 | Ambient Precedent (cross-platform proactive decision-precedent nudge) | 📋 Design spec 2026-06-20 (founder-approved; build next) | opportunity / spec / Critic seams (v1) | [`ambient-precedent.md`](./ambient-precedent.md) |
| CMD (H2) | The Command Canvas (NL command bar + live preview) | 📋 Horizon bet 2026-06-20 · sequenced behind H1 | `⌘K` + canvas pane | [`command-canvas.md`](./command-canvas.md) |
| SIGNAL-FABRIC | Signal Fabric & Sense Engine (outside-in + inside-out signal ingestion → "Focus on this next" → weekly strategy briefs) | ✅ Phases 0-4 shipped (Phase 4 / JNY-01 2026-07-02, lane3) | Today (`/`) · `/product?tab=signals` · `/product?tab=strategy` · `/sources` | [`signal-fabric.md`](./signal-fabric.md) |
| C4/E7 | Agent inspector (run history) | ◐ Core shipped 2026-06-18 | `/missions?tab=agents` | [`agent-inspector.md`](./agent-inspector.md) |
| P7 | Incidents log (read-only) | ✅ Shipped 2026-06-20 | `/govern?tab=incidents` | [`incidents-log.md`](./incidents-log.md) |
| M1 / LRN-01 | Support triage loop (tickets back into signals) | Shipped | Learn station | [`support-triage-loop.md`](./support-triage-loop.md) |
| SW-6 | Production ship: failure floor, tenant safety, cold start | Shipped | Ship station | [`production-ship-readiness.md`](./production-ship-readiness.md) |
| R3 | Notifications (in-app Attention feed) | ✅ Shipped 2026-06-20 | `/govern?tab=attention` | [`notifications.md`](./notifications.md) |
| U6 | Workspace data export (data portability) | ◐ Core shipped 2026-06-18 | `/settings?section=data` | [`workspace-data-export.md`](./workspace-data-export.md) |
| SUBPROC-DISCLOSURE | Sub-processor disclosure ("Where your data goes") | ◐ Backend + Settings UI shipped 2026-06-20 | `/settings?section=data` | [`subprocessor-disclosure.md`](./subprocessor-disclosure.md) |
| BRN-02 | "Where your brain lives" card (substrate, ownership, archive/delete/forget, integrity seal) | ✅ Shipped 2026-07-03 (lane 3) | `/settings?section=data` | [`where-your-brain-lives-card.md`](./where-your-brain-lives-card.md) |
| APP-HEALTH | App-level health/readiness endpoint (uptime monitors / LBs) | ◐ Endpoint shipped 2026-06-20 | `GET /api/public/health` | [`app-health.md`](./app-health.md) |
| RELIABILITY-SLO | AI-surface SLO / error budget (availability · latency · budget burn) | ◐ Backend + read fn + Missions glance shipped 2026-06-21 (lane 1) | `getReliabilitySlo`; calm glance on the Missions header | [`reliability-slo.md`](./reliability-slo.md) |
| RUNAWAY-DETECT | Runaway / loop mission detector (the inverse of the stall monitor) | ◐ Detector + read fn + Missions glance + Incidents source shipped 2026-06-21 (lane 1) | `getRunawayMissions`; Missions glance + `runaway` incidents in `/govern?tab=incidents` | [`runaway-detection.md`](./runaway-detection.md) |
| EVAL-COVERAGE | Eval-coverage scorer (which AI surfaces have an eval guard) | ◐ Scorer + read fn + Evals banner shipped 2026-06-21 (lane 1) | `getEvalCoverage`; coverage banner on `/govern?tab=evals` | [`eval-coverage.md`](./eval-coverage.md) |
| FND-0.7 | Prompt-injection defense (learned classifier + hard quarantine over untrusted RAG) | ◐ Classifier + quarantine seam + RAG wiring shipped 2026-06-21 (lane 3) | runtime only; `classifyInjection` / `quarantineUntrusted` behind the RAG retriever | [`injection-defense.md`](./injection-defense.md) |
| FND-0.5 | Agent blast-radius limits (per-tool risk tier + allow-list pre-filter) | ◐ Blast-radius model + `filterToolsByRisk` primitive + approval-card chip shipped 2026-06-21 (lane 1) | `toolRisk`/`filterToolsByRisk`; "High blast radius" chip on the approval card | [`agent-blast-radius.md`](./agent-blast-radius.md) |
| SANDBOX | Build / execution spine (`ExecProvider` seam + GitHub Actions $0 CI floor) | ◐ Seam + $0 CI workflow shipped 2026-06-21 (lane 3); paid microVM adapter founder-spend-gated | runtime/infra only; `resolveExecProvider` + `.github/workflows/ci.yml` | [`sandbox-spine.md`](./sandbox-spine.md) |
| D4 | Mission cancellation (per-mission brake) | ◐ Cancellation shipped 2026-06-18 | `/missions/$id` | [`mission-cancellation.md`](./mission-cancellation.md) |
| O1 | Provenance ("why is this on the roadmap?") | ◐ Provenance shipped 2026-06-18 | `/product?opp=` | [`roadmap-provenance.md`](./roadmap-provenance.md) |
| LCH-01 | Launch-kit drafting (changelog/blog/email/social/docs) | ◐ Drafting shipped 2026-06-18 | `/build/$missionId` Changes | [`launch-kit-drafting.md`](./launch-kit-drafting.md) |
| PLG | Memory-retention upgrade nudge (free 30-day window) | ✅ Shipped 2026-06-22 (Lane 1) | Today (`/`) | [`plg-memory-retention-nudge.md`](./plg-memory-retention-nudge.md) |
| F3 | Continuous discovery feed (always-fresh + per-product) | ◐ Per-product clustering shipped 2026-06-18 | `/product?tab=signals` | [`continuous-discovery-feed.md`](./continuous-discovery-feed.md) |
| F-AGENT-1 | Orchestrator + multi-agent missions | ✅ Shipped 2026-06-06 | `/missions`, `/missions/$id` | [`orchestrator-and-missions.md`](./orchestrator-and-missions.md) |
| F-AGENT-2 | Persistent agent memory + self-reflection + trust auto-advance | ✅ Shipped 2026-06-06 | `/agents` | [`agent-memory-and-reflection.md`](./agent-memory-and-reflection.md) |
| F-AGENT-3 | Event reactor + auto-pipelines | ✅ Shipped 2026-06-06 | `/governance` (Auto-pipelines · Reactor activity) | [`event-reactor-and-pipelines.md`](./event-reactor-and-pipelines.md) |
| F-AGENT-4 | Swarm HUD | ✅ Shipped 2026-06-06 | `/swarm` | [`swarm-hud.md`](./swarm-hud.md) |
| F-V6-SHARE | Shareable decision links (the viral loop) | ✅ Shipped 2026-06-14 | `/d/$slug` (public) | [`shareable-links.md`](./shareable-links.md) |
| M-C | Pricing, plans & entitlements (monetization foundation) | 🔨 Foundation built 2026-06-16 (migration pending sync; Stripe keys pending) | `/settings?section=billing` | [`pricing.md`](./pricing.md) |
| M-C-DB-HYGIENE | Billing/admin migration hygiene (app_settings replay · SQL↔TS tier-limit drift guard · RLS review) | ✅ Closed 2026-06-22 (Lane 1) | (migrations + tests) | [`billing-db-hygiene.md`](./billing-db-hygiene.md) |
| Credit go-live | Credit metering engine taken live + verified end-to-end (backfill → arm → debit) | ✅ Metering ON 2026-06-22 (Lane 1, build-phase) | `/admin` · Settings → Credits | [`credit-engine-golive.md`](./credit-engine-golive.md) |
| Stripe key-readiness | The Stripe checkout/subscription/top-up/voucher layer audited + made code-complete; 3 buildable blockers fixed; founder last-mile key-plug-in checklist | ◐ Code-complete + key-ready 2026-06-22 (Lane 2); no live keys yet | webhook + checkout + Settings Plan/Credits | [`stripe-keyready.md`](./stripe-keyready.md) |
| H1 | PRD → engineering task-graph (the Planner step) | ✅ Shipped 2026-06-14 | `/prds/$id` | [`task-graph.md`](./task-graph.md) |
| Bundle 9 | Builder agent · PR · CI loop · file-claim conflict guard | ✅ Slice 1 2026-06-04 · Slices 2 + 3 2026-06-06 | `/build`, `/prds/$id`, `/missions/$id` | [`archive/bundle-9-builder.md`](./archive/bundle-9-builder.md) |
| v6 P1 | The Loop Runs Itself · auto-advance · hop retry · adaptive budget · memory_refs | ✅ Shipped 2026-06-14 (migrations pending sync) | `/missions`, `/missions/$id`, `/swarm` | [`loop-runs-itself.md`](./loop-runs-itself.md) |
| v6 P3 T2 | The Gauntlet · acceptance rate · autonomy ratio · ritual retention | ✅ Shipped 2026-06-14 (ritual_sessions migration pending sync) | `/govern?tab=gauntlet` | [`gauntlet-metrics.md`](./gauntlet-metrics.md) |
| M-B | Compounding-memory view (the moat made visible) | ✅ Shipped 2026-06-14 | `/memory` | [`compounding-memory-view.md`](./compounding-memory-view.md) |
| OPS-01 | Flow mode (ambient calm-state: soundscape + focus timer + quieting) | ✅ Shipped 2026-06-16 | Chrome (`AppShell` footer) | [`flow-mode.md`](./flow-mode.md) |
| WEDGE | Critic-teardown first-run (the launch wedge) | ✅ Shipped 2026-06-17 | Today (cold-start) | [`wedge.md`](./wedge.md) |
| F-SHARE-TEARDOWN | Shareable Critic-teardown links (the viral loop) | ✅ Shipped 2026-06-17 (migration pending sync) | `/t/$slug` (public) | [`shareable-links.md`](./shareable-links.md) |
| W6 | Persona onboarding tracks (Solo / Founding PM / Tech Founder) | ✅ Shipped 2026-06-17 (live-verify on next publish) | `/onboarding` | [`onboarding-tracks.md`](./onboarding-tracks.md) |
| SAMPLE-SEED | Sample workspace seed (Prism + Trellis two-product showcase; per-signup Layer A + demo reseed) | ✅ Authored 2026-07-05 (Kiro); apply via Lovable + flip `SAMPLE_WORKSPACE_ENABLED` for Layer A | demo accounts · every new signup's "Sample workspace" | [`sample-workspace-seed.md`](./sample-workspace-seed.md) |
| ENG-06 | Cost per outcome (calm-front chip + Engine Room unit-economics) | ◐ B1+B3 built 2026-06-17 (tsc/lint/build green; live-verify on next publish; B2 deferred) | Today · `/govern?tab=analytics` | [`cost-per-outcome.md`](./cost-per-outcome.md) |
| F-AGENTS-MENTIONABLE | @-mention an agent in chat to dispatch it directly | ✅ Shipped 2026-06-18 (server cycle 19 commit; composer picker + case-insensitive parse cycle 21; live-verify on next publish) | `/chat` (Ask) | [`agents-mentionable.md`](./agents-mentionable.md) |
| LIFECYCLE | Build->Ship lifecycle gap map (audit + capture model + build plan) | 📋 Audit 2026-06-18 (no code yet; founder review pending) | n/a (planning doc) | [`planning/archive/reports/lifecycle-gap-map.md`](../planning/archive/reports/lifecycle-gap-map.md) |
| WM | Workspaces, accounts & tenancy + monetization (initiative) | 📋 Plan 2026-06-19 (build pending; board G10) | Settings · workspace switcher | [`workspaces.md`](./workspaces.md) |
| F-BRAIN | Brain: Perplexity-grade research + the brain, one surface | ✅ Shipped | `/chat` (Threads) | [`brain.md`](./brain.md) |
| F-STUDIO | Studio → Build: the in-platform development engine | ✅ Code landed 2026-06-12 (migration pending Lovable sync) | `/build`, `/build/$missionId` | [`build-engine.md`](./build-engine.md) |
| F-CRITIC-AGENT | Critic agent (adversarial red-team on opportunities + PRDs) | ✅ Shipped | Opportunities · `/prds/$id` (verdict cards) | [`critic-agent.md`](./critic-agent.md) |
| F-SCRIBE-CITATIONS | Scribe RAG citations (inline evidence in generated PRDs) | ✅ Shipped | `/prds/$id` (Citations card) | [`prd-rag-citations.md`](./prd-rag-citations.md) |
| WEB-ACCESS | Web access for agents (governed Firecrawl tool set) | ✅ Shipped | Agent tools (search · map · fetch · crawl) | [`web-access.md`](./web-access.md) |
| C6 | Agent trust score & autonomy dial | ✅ Shipped | `/agents` | [`trust-and-autonomy.md`](./trust-and-autonomy.md) |
| OBS-PORT | Obsidian v3 port (all app surfaces to the v3 design system; per-ID verify manual) | 🔨 In progress (OBS-01 ✅ 2026-07-02) | All authenticated surfaces | [`archive/obsidian-v3-port.md`](./archive/obsidian-v3-port.md) |
| BUNDLE-4 | Agent-to-agent (A2A) handoff (E1→E5, multi-agent missions) | ✅ Shipped | `/missions`, `/missions/$id` | [`a2a-handoff.md`](./a2a-handoff.md) |
| BUNDLE-6 | GitHub issue approval flow (lifecycle close to the eng system of record) | ✅ Shipped | `/prds` (Send to issue gate) | [`github-issue-approval-flow.md`](./github-issue-approval-flow.md) |
| PRF-01 | The proof surface (moat metrics panel, composed for investor diligence) | ✅ Shipped 2026-07-02 | `/admin/proof` | [`proof-surface.md`](./proof-surface.md) |
| O1 / BRN-01 | Knowledge-graph explorer + the operable brain (object-card actions, contradiction hotspots, compounding strip) | ✅ Shipped 2026-07-02 | `/knowledge?tab=graph` | [`knowledge-graph-explorer.md`](./knowledge-graph-explorer.md) |
| F-V5-INGEST-WEBHOOK | Public continuous-ingest webhook door | ✅ Shipped 2026-06-11 (rate limiting 2026-06-16) | Public `/api/public/ingest` endpoint | [`ingest-webhook.md`](./ingest-webhook.md) |
| Q1-MCP | Read-only Model Context Protocol (MCP) server | ◐ Phases 1-3 shipped 2026-06-17 (Phase 4 future) | MCP server · Settings (token UI) | [`mcp-server-readonly.md`](./mcp-server-readonly.md) |
| AUTH | Authentication flows (sign in / up / recover / session) | ✅ Shipped | `/login`, `/signup` | [`auth-flows.md`](./auth-flows.md) |
| AFD | Analytics & Failure Detection (PostHog EU + Sentry EU + Better Stack + in-house views) | 📋 Plan 2026-06-25 (build pending; board G12, founder-gated) | `/admin/ai-costs` · `/admin/incidents` · `/admin/observability` · `status.supaprod.app` | [`analytics-and-failure-detection.md`](./analytics-and-failure-detection.md) · façade [`observability-facade.md`](./observability-facade.md) |
| MA-1 | Model-agnostic AI backend (any provider via base_url + key) + Perplexity-style capability routing + Auto mode | ✅ Engine shipped 2026-06-30 (Lane 2) | chokepoint · `ModelSwitcher` · `/settings?section=ai` | [`model-agnostic.md`](./model-agnostic.md) |
| CNV-01 | The Outcome Contract type + dual projection (typed spec alongside the narrative) | ✅ Shipped 2026-07-02 (Lane 3) | `/prds/$id` (Contract tab) | [`outcome-contract.md`](./outcome-contract.md) |
| CNV-04 | Agent-authored contracts (one-line intent → drafted Outcome Contract) | ✅ Shipped 2026-07-03 (Lane 3) | `/plan` (Specs tab composer) → `/prds/$id?tab=contract` | [`outcome-contract.md`](./outcome-contract.md#cnv-04-agent-authored-contracts-the-friction-killer-v12-sec-73) |
| RF-04 | House-rules distillation (weekly steward pass -> approval-gated, supersedable operating rules injected at the chokepoint) | ✅ Shipped 2026-07-03 (Lane 2) | `/govern?tab=house-rules` · `/api/public/hooks/house-rules-tick` | [`house-rules.md`](./house-rules.md) |
| CNV-02 | The requirement-to-oracle compiler (acceptance criteria → eval cases / CI / UAT / watched assumptions) | ✅ Shipped 2026-07-03 (Lane 3) | `/prds/$id?tab=contract` (Compile oracles), `/evals`, `/today` | [`outcome-contract.md`](./outcome-contract.md#cnv-02-the-requirement-to-oracle-compiler-v12-sec-72) |
| JNY-03 | The test station (per-mission acceptance test plan, verdict recorded onto the decision) | ✅ Shipped 2026-07-03 (Lane 3) | Build mission slide-over (`/build/$missionId`) | [`test-station.md`](./test-station.md) |
| JNY-05 | The ambient stakeholder loop (scheduled, audience-tuned digest + Slack write-back) | ✅ Shipped 2026-07-03 (email leg + Slack write-back); founder-gated to go fully live on a real Slack bot token/OAuth client | `/settings?section=notifications` + `/sources` | [`stakeholder-digest.md`](./stakeholder-digest.md) |
| RF-05 | Playbook selection by win rate (mission-plan-time station->playbook binding + auto-recorded playbook_runs) | ✅ Shipped 2026-07-03 (Lane 2) | engine-only, rides `mission.plan` | [`playbook-selection.md`](./playbook-selection.md) |
| DSN-01 | Design memory (workspace design language as standing, supersedable decisions; binds into DEF-04 scaffolds) | ✅ Shipped 2026-07-03 (Lane 1) | `/knowledge?tab=design` · PRD detail (DEF-04 panel) | [`design-memory.md`](./design-memory.md) |
| CNV-03 | The ARD (publishing the Outcome Contract as a versioned public standard: schema, spec page, MCP `get_ard`, export/import) | ✅ Shipped 2026-07-03 (Lane 4) | `/ard` · `/api/public/ard/schema` · `/prds/$id?tab=contract` (Export/Import ARD) | [`outcome-contract.md`](./outcome-contract.md#cnv-03-the-ard-publishing-the-outcome-contract-as-a-standard-v12-sec-74) |
| FS-01 / FS-04 | Foresight generators + calibration; risk composed into the Today brief and InsightRail | ✅ Shipped 2026-07-02 / 2026-07-03 (Lane 4) | `/today` | [`foresight-generators.md`](./foresight-generators.md) |
| DSN-04 | The design contract rides into Build (design memory + flow graph fold into the mission goal; a lightweight return-side parity check) | ✅ Shipped 2026-07-03 (Lane 4) | dispatch-time only, no route | [`design-contract-rides-build.md`](./design-contract-rides-build.md) |
| AGT-03 | Speculative reversible prep (background design-scaffold pre-staging while a contract is reviewed) | ✅ Shipped 2026-07-03 | `/prds/$id` (Design mockup panel) | [`speculative-prep.md`](./speculative-prep.md) |
| AGT-02 | Consent scopes (plan-level approval: an approved contract pre-consents its reversible tool calls) | ✅ Shipped 2026-07-03 (Lane 1) | engine only, rides `executeLoop` | [`consent-scopes.md`](./consent-scopes.md) |
| AGT-01 | Structured-output protocol upgrade (native provider tool-calling, dormant behind `AGENT_NATIVE_TOOLCALLING`) | ✅ Built + tested 2026-07-03 (Lane 1); activation is the founder's own flag flip | engine only, rides `executeLoop` | [`agent-native-toolcalling.md`](./agent-native-toolcalling.md) |
| RF-07 | Eval-driven prompt optimization (weekly steward pass mines graded eval failures, drafts a revised prompt version, human publishes) | ✅ Shipped 2026-07-03 (Lane 1) | Settings → Prompts · `/api/public/hooks/prompt-optimize-tick` | [`prompt-optimization.md`](./prompt-optimization.md) |
| DEC-RANK | Deterministic opportunity ranking + best bet (fixed tie-break chain; rank on the card; single #1 with rationale + next action) | ✅ Shipped 2026-07-07 | `/discover` (opportunity queue + detail sheet) | [`opportunity-ranking.md`](./opportunity-ranking.md) |
| TODAY | The daily ritual (app home): triage Calls queue, brief spotlight, My day, what-changed, the machine now; every Call + learning is click-to-open via DetailKit with trace refs (MIS/PRD/OPP/ASM/LRN), timestamps, status, provenance | ◐ Live, dim 17 pass 2026-07-07 (Kiro) | `/today` | [`today.md`](./today.md) |
| AUDIT-ID | Verifiable audit id + one-click lineage (every entity id is a clickable trace tag that opens its verifiable trail; mission ids also render the full trust chain; Ask detects a named id) | ✅ Shipped 2026-07-13 | every entity chip app-wide + Ask (global lineage sheet, no route) | [`audit-id-lineage.md`](./audit-id-lineage.md) |

## Rules

1. **Consolidate, don't restate.** A feature page links to its `docs/planning/archive/build-log.md` §4 entry and architecture bullet, and it doesn't duplicate them. If you find yourself rewriting an architectural contract here, move it to `architecture/*.md` and link.
2. **Stay demo-ready.** The Demo script section must be runnable end-to-end on the seeded demo workspace (`demo@redcadence.app`). If a step breaks, fix the page in the same commit you fix the feature.
3. **One source of "How to use / verify".** The detailed walkthrough lives here. `docs/planning/SOURCE-OF-TRUTH.md` rows link to this page rather than duplicating the checklist.
4. **Update the index above** whenever you add a page. A page that isn't in the index is invisible.

## Related

- [`../README.md`](../README.md), parent docs index
- [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md), live status board and per-feature register
- [`../planning/archive/feature-backlog.md`](../planning/archive/feature-backlog.md), archived ledger (superseded 2026-06-24)
- [`archive/agent-ecosystem-plan.md`](./archive/agent-ecosystem-plan.md), F-AGENT-1→4 bundle strategy
- [`agent-experience.md`](./agent-experience.md), the agent roster model, faces, identity, and the relay (the "19 vs 6" resolution, built on the F-AGENT-1→4 substrate)
- [`signal-fabric.md`](./signal-fabric.md), the Signal Fabric & Sense Engine, outside-in + inside-out signal ingestion → "Focus on this next" (Phase 0 keystone shipped)
- [`../../architecture/orchestration.md`](../../architecture/orchestration.md), agent orchestration contract
- [`../conventions/design-anatomy.md`](../conventions/design-anatomy.md), the design anatomy + system reference behind the feature surfaces (card + detail-view anatomy, trace-ref registry, ranking/designation logic, color + naming), the long-form reference behind the DESIGN-LOOM dim 17 contract
- [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4, active build log
