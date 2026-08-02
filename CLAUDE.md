# CLAUDE.md - Claude Code entry point

> _Created: 2026-06-03 · Last updated: 2026-07-24_

> **Claude Code reads this file. The operating rules live in [`AGENTS.md`](./AGENTS.md) - read it first; it is the canonical, tool-agnostic manual.** This file holds only Claude-Code-specific overrides so we never duplicate (and drift) the rules.

---

> [!IMPORTANT]
> **PRODUCT NAME: SUPAPROD.** The product is **Supaprod** - lowercase `supaprod` for domains/handles/wordmark/slugs, `Supaprod` in prose, `SUPAPROD` only in trademark/legal contexts, **never** camel-case "SupaProd" (founder ruling, brand playbook). It shipped as **Cadence** from 2026-06-03 until the in-product rename executed on 2026-07-17 (brand decision founder-locked 2026-07-16; evidence chain: [`docs/pitch/naming-decision-supaprod.md`](./docs/pitch/naming-decision-supaprod.md); operational playbook: [`docs/gtm/brand-supaprod.md`](./docs/gtm/brand-supaprod.md)). `Cadence`/`cadence` as the product name is retired and must not be reintroduced anywhere (code, docs, DB, env, caches, APIs, public surfaces) - read any stray reference as equivalent to `Supaprod`/`supaprod`, with three narrow exceptions: (1) the generic English word ("release cadence", "meeting cadence", the DB `cadence` schedule-frequency column) is not the brand and is untouched; (2) historical/dated narrative describing what happened before 2026-07-17 stays accurate to what the product was called at the time; (3) a short list of internal legacy identifiers intentionally left unmigrated per this repo's established rename convention (the same one that kept `agent_slug='builder'` etc. alive across Builder→Studio→Build) - see the full ledger: [`docs/operations/rename-cadence-to-supaprod.md`](./docs/operations/rename-cadence-to-supaprod.md). A brief 2026-06-10 rename experiment to a different (unrelated, since-abandoned) brand was reverted on 2026-06-16; that earlier retired name remains equally banned and any stray token from it is also equivalent to `Supaprod`.

> [!IMPORTANT]
> **BUILDER ➔ STUDIO ➔ BUILD RENAME DISCLAIMER (2026-06-12, twice):**
> _The Builder agent/surface became **Studio** (morning), then **Build** (night, screen-9 Ember port - founder ruling). User-facing name is **Build** everywhere and the canonical routes are `/build` + `/build/$missionId` (`/studio/*` now redirects to `/build/*`, reversing the morning's mothball redirect). Legacy internal identifiers are intentionally NOT migrated across EITHER rename - `agent_slug='builder'`, `builder_file_claims`, `studio.functions.ts`, `src/components/studio/`, the `studio.*` engine tools, and `studio_changesets` are all to be read as equivalent to Build. The `CallSurface 'studio'` literal (Prompt Studio cost bucket) predates both and is unrelated. Spec: `docs/features/studio.md`._

---

## ⭐ THE CORE USP (founder-directed 2026-08-02, in session; exact wording not yet founder-reviewed) - the one claim, and the file that proves it

> **Supaprod is the agent-first operating system for product teams. It tells you what to build, builds it, ships it, checks the outcome, and remembers. Wired end to end, from signal to learning and back again.**

- **One loop, not seven tools.** Discover, Decide, Plan, Design, Build, Ship and Learn run as one governed route that agents walk unattended under boundaries a human sets in advance. A recorded outcome re-ranks the next bet rather than ending in a report.
- **Product knowledge compounds, and the RECORD is portable across people.** Every decision, the alternatives weighed against it, and what actually happened stay in the workspace record, which is membership scoped, so when a product manager leaves the next person inherits it instead of starting cold. That is the enterprise reason to buy: continuity, audit, onboarding. **Known limit, do not overstate it:** `agent_memory`, the layer that pushes past outcomes into an agent's prompt and into the Critic's precedent, is still scoped to the USER who wrote it, not the workspace. The successor inherits the record today, and not yet the compounded recall. Closing that is tracked work; until it closes, say "the record travels" and not "the memory travels".
- **Proof, not assertion.** The station-by-station, code-verified account of that loop, carrying a `file:line` for every structural claim and naming the gaps it still has, is [`docs/features/lifecycle-signal-to-learning.md`](./docs/features/lifecycle-signal-to-learning.md). Cite that file. Never claim a step of the loop the repo cannot show in code.

Works with, not against, the Investor canon and the triple-RFS positioning (the same three layers: the director, the operating system, the company brain) and the six-month-forward doctrine; it replaces none of them. This block is identical in `README.md`, `CLAUDE.md`, `AGENTS.md` and `GEMINI.md` so it cannot drift. Change all four or none.

## ⭐ Investor canon (founder-ratified 2026-07-24, the deck session)

Distilled from the investor-deck build; full artifacts at [`docs/pitch/investor-deck/`](./docs/pitch/investor-deck/README.md) (frozen deck v19, brand assets vault, usage notes). Supersedes conflicting outward-facing copy anywhere in this repo. Works with, not against, the 2026-07-22 triple-RFS positioning: same three layers, sharper words.

- **Tagline (hero, all surfaces):** "Agents that know what to build, ship it, and remember." Support line: "One agentic operating system, every call on the record." Journey kicker: `signal -> shipped -> remembered` (supersedes "Signal to shipped").
- **The three layers, always named and colored:** 01 the director (tells you what to build, marigold #e8b44c) · 02 the operating system (runs the whole lifecycle, blue) · 03 the company brain (remembers, and it guides, green).
- **The brain is never storage.** Banned framing: "where the record lives". Canon: it compounds; next time it tells you what is right, and warns before you repeat what was wrong.
- **Public launch date on every external surface: September 2026** (supersedes August / "~Aug 4" phrasing).
- **Market sizing ladder (retires the unsourced $18B TAM everywhere):** TAM $300B+/yr, the PM work budget (2.6M PMs x ~$115K loaded). SAM $2B -> $12B/yr (launch pricing to value pricing; Motion 1 Transform: 650K existing teams; Motion 2 Create: 500K new agent-native orgs by 2030). SOM ~$47M ARR (the agent-native tenth at launch pricing). Full arithmetic: deck appendix B.
- **Engine positioning: not a wrapper.** The models are interchangeable parts; the system is ours: the loop, the gates, the ledger. Our own build engine runs frontier models via API in the customer's repo. Never say we dispatch work to Cursor, Lovable, or Devin; they are the era's proof, not our subcontractors.
- **Investor-material never list:** no commit counts or feature-register numbers, no YC mentions in generic materials, self-build story implicit only (user-zero framing allowed), no "Cursor for PMs" phrasing on surfaces, employer is "Intellect, a leading BFSI technology OEM" (never "Intellect Design Arena"), founder role arc ISRO associate PM -> Infineon PM -> Intellect senior AI PM, education shows TUM only.
- **Contact canon:** founder@supaprod.ai (founder surfaces) · investors@supaprod.ai (investor relations) · linkedin.com/in/rohit-gajaraj.

## ⭐ THE SIX-MONTH-FORWARD DOCTRINE (founder ruling 2026-08-01) - binding on EVERY deliverable

> **We are not building for today's problem. Every solution is designed for where the industry
> will be six months from the current date, and it must also close the pain the user carried
> from the past.**

When a frontier lab ships a new model, or an enterprise AI vendor launches our vertical, **we
must not look like a wrapper.** Five tests, all of which every design passes before it is built:

1. **Assume the model layer commoditizes.** If one frontier release could absorb this feature,
   it is not a moat. Build the loop, the gates and the ledger _around_ the model, never the thin
   layer on top of it.
2. **Assume a large vendor ships our vertical next quarter.** What do we still have that they do
   not? The answer must be the compounding decision-and-outcome record and the closed loop. If
   it is "nothing", the design is wrong and gets redone.
3. **Agentic-first, not agent-assisted.** A surface an autonomous agent cannot run end to end
   under policy is legacy the day it ships. Human sets boundaries; agent does the work.
4. **Solve backwards and forwards.** Close the past pain, serve today's job, leave the seam for
   the six-month job.
5. **Delight is a requirement, not a finishing pass.**

State the six-month assumption and what survives a frontier launch when proposing any design.

**Companion rule (same ruling):** for each surface, research the best proven product in that
category and lift its information model and verbs outright, even close to literally. Name the
reference before building, then express it in our shipped primitives and voice. (Build ->
Cursor / Claude Code · Design -> Figma's fidelity ladder · Discover -> Sentry's issue stream +
Linear's triage inbox.)

Canonical: [`AGENTS.md`](./AGENTS.md) "THE SIX-MONTH-FORWARD DOCTRINE".

## ⭐ Governance canon (founder ruling 2026-07-29) - apply to EVERY product decision

> **Policy is set in advance and does not block. Permission is asked in the moment and does.
> Supaprod is built on policy.**

The founder's framing, quoting MuleSoft: _"AI agents don't submit change requests before they act.
They make decisions, access data, call tools, and move work forward in real time. When governance is
fragmented, the business still owns every outcome."_ And his test, which every design decision must
now pass: **_"Even human in the loop - every approval, if it passes to a human, then what is the
purpose of agents?"_**

- **The human's job is not to approve work. It is to set the boundaries, and to judge the small
  number of things that genuinely cross them.** The gate is the exception, not the loop. A product
  where a human approves each step has not automated the work, it has added a queue to it.
- **Default posture is autonomous, and the code already does this.** `loadAgentArc` returns
  `trusted` when no row exists (explicitly commented _"Founder ruling 2026-07-08 (SW-7): autonomous
  by default"_), and `resolveApprovalMode("confirm", "trusted")` returns `"auto"`. A brand-new
  workspace is autonomous on arrival, not on probation. _(An earlier draft of this section claimed
  `loop.server.ts:1103`'s `?? "confirm"` inverted the principle. That was wrong: the loop fails
  closed before that line, and the only calls reaching the fallback are control-flow tools that
  short-circuit the queue branch, so it cannot cause a single approval.)_
- **The one indefensible default, and it is live:** `mission_spend_cap_usd` is enforced fail-closed
  at `runtime.server.ts:226-238`, and **every writer passes `?? null`** (`handoff.server.ts:419`,
  `loop.server.ts:491` and `:523`), so the ceiling never fires. **There is no spend cap.** Ship a
  workspace default before telling the autonomy story, because arguing for more autonomy without a
  ceiling is the one version of this that a risk officer will refuse.
- **The machinery already exists; promote it from Settings to the centre of the product.**
  `resolveToolMode` + `toolRisk` (per-tool auto/confirm/off with hard risk floors),
  `ai/trust.server.ts` (agents earn autonomy from their record), `trust_graduation_proposals` +
  `decideTrustGraduation` (an agent proposes its own graduation), `house-rules.functions.ts`,
  `guardrail_rules`, `agent_autonomy`, `kill_switches`.
- **A long approvals queue is a policy failure to surface, not a workload to render.** The product
  should offer to remove it: _"You approved 14 of these without changes. Let Engineer do it alone?"_
- **Autonomy is paid for with evidence.** Fewer interrupts is only safe because the tamper-evident
  record proves what happened. Never trade the record for speed.
- **Four floors that no boundary may lower:** anything irreversible from inside the product (a
  production deploy, anything customers see, spend past a cap); genuine judgment with no oracle
  (which bet, what an outcome meant); a default the user never set is our choice, not their policy,
  so it must be visible and changeable; and hard risk floors stay above any earned arc.

Canonical: [`docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md`](./docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md).
It outranks the gate-centric assumption in every 2026-07-28 rebuild doctrine; the reconciliation
lives in `docs/planning/rebuild-2026-07/governance/FINAL-governance.md`.

## MANDATORY: Scan skills, agents, plugins, and MCPs before every task (non-negotiable)

**This fires before every task - code, docs, design, analysis, any action. No exceptions.**

1. Check the session reminder for the full library of available skills, agents, plugins, and MCP servers
2. Shortlist candidates across ALL types and ALL namespaces equally (skills, agents, plugins, MCPs - not just skills)
3. Invoke the best fit before acting from scratch

You do not wait for the user to ask. "Simple" tasks do not skip this. Full protocol: [`AGENTS.md`](./AGENTS.md) §2.

---

## Read order for Claude Code

-1. **`git pull origin main`** - before anything else, sync the latest from all other tools. Never work on a stale codebase. The repository is the single source of truth; this file is orientation only.

0. **[`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md)** - the ONE file to read first. Section 0 is the live cursor (what is in flight + the next picks; this folded in the old root `active-task.md` on 2026-06-19), then the build queue (section 3) and the founder pickup list (section 4). The full doc model (the map, the session loop, the new-initiative rule) is in [`AGENTS.md`](./AGENTS.md) "The Documentation Operating System".

0.5. [`Ai_Cofounder.md`](./Ai_Cofounder.md) - the **founding constitution**: co-founder operating posture, north star, agentic-first + model-agnostic (BYOK) mandates, documentation-first development. Its **Repo Concordance** section maps its 13 mandated living docs onto this repo's canon - never create those root files; update the mapped equivalents. For scope/agents/IA/sequencing, the v4 feature map (1.5) governs.

1. [`AGENTS.md`](./AGENTS.md) - pre-action protocol, engineering rules, escalation, session-friction loop, founding principles.
   1.45. **🚀 THE CURRENT CAMPAIGN (2026-07-10): [`docs/strategy/v13-proof-campaign.md`](./docs/strategy/v13-proof-campaign.md) - the Proof Campaign. The engine is finished; users, proof, and love now outrank engine depth. Launch in ~one month (demos + beta + the YC application) per the binding horizon ruling; everything after is gates, not dates. Execution bible incl. the parallel-lane protocol (Fable/Sonnet model split): [`docs/planning/v13-proof-campaign-plan.md`](./docs/planning/v13-proof-campaign-plan.md) (board group G17, rows PC-01..PC-27). When v13 and an older doc disagree on what to do NEXT, v13 wins; v11 still wins direction. THE PITCH ROOM (standing routing rule, founder 2026-07-10): [`docs/pitch/`](./docs/pitch/README.md) is the founder's single reference for ALL outward-facing positioning - the one-pager (differentiation + what we can prove, PROVEN/WIRING/ROADMAP claim tags), the Q&A bank (investor/customer/engineer objections with honest answers), the demo script (receipts on screen, the failure path rehearsed). Any session producing pitch/positioning/demo/objection/application content routes the distilled result INTO that folder in the same session - update in place, never parallel copies; cite artifacts and companies, never gurus. ⭐ THE STANDING POSITIONING (founder-ratified 2026-07-22, wins over any older positioning language): the TRIPLE-RFS INTERSECTION - Supaprod is the AI-native, agentic-first operating system for product teams, positioned at the intersection of YC's own three RFS requests: "Cursor for Product Managers" (the door - who it's for), "The AI Operating System for Companies" (the body - the closed loop), "Company Brain" (the brain - the compounding decision-and-outcome memory, the crescendo of every telling). One headline per surface, told door → body → brain, never all three at once; "company brain" is YC's phrase (quoted, attributed), never our brand identity. Canonical memo with corrected live RFS verbatims, per-surface vocabulary rules, competitor sweep, and customer-evidence rules: [`docs/pitch/repositioning-2026-07-22.md`](./docs/pitch/repositioning-2026-07-22.md).** **⭐ [`docs/strategy/v11-guiding-star.md`](./docs/strategy/v11-guiding-star.md) is the GUIDING STAR (2026-06-23) - read it for direction, moat, defense, the core-user lens, market/pricing, and the agentic build plan; its execution items (what to build next) live in the [`feature dashboard`](./docs/planning/feature-dashboard.md) (the v11 build front, ranked #1-21, each with a one-line Why). It consolidates v7 to v10 + moat.md from a code-and-live-DB-verified outsider teardown; when v11 and an older strategy doc disagree on direction, v11 wins. The older docs below remain valid for their detailed reference role. **The depth layer under v11 is [`docs/strategy/v12-self-improving-os.md`](./docs/strategy/v12-self-improving-os.md) (2026-07-02, audit-grounded): the reinforcement/learning loop, foresight + the reach channel, the operable memory OS, the design third leg, the Outcome Contract / ARD conventions, and the end-to-end journey coverage; its 32 build rows are dashboard group G15 (ranked after the G14 Obsidian port). v12 wins on those build plans; v11 wins direction.**
   1.5. [`docs/strategy/v7-agentic-product-os.md`](./docs/strategy/v7-agentic-product-os.md) - **CURRENT positioning + build canon (read first for any feature/UX/positioning work; supersedes v6, which is retained as the engine/IA + market-evidence reference)**: the Agentic Product OS umbrella (PM Chief of Staff felt entry + Decision-System moat), genuine autonomous end-to-end execution as the North Star (claim-never-outruns-wiring), the phased build, founder rulings (§10), and market evidence. **For structure / IA / surface placement and build-order, [`docs/strategy/v8-calm-front-deep-engine.md`](./docs/strategy/v8-calm-front-deep-engine.md) is the CURRENT structure/build canon (calm front + one Engine Room door; the hybrid Build spine; the 4-phase sequencing) - it operationalizes v7 and wins on structure decisions.\*_ **For what to build next, how the product should look and behave, priority, and the disjoint build lanes, [`docs/strategy/v10-master-blueprint.md`](./docs/strategy/v10-master-blueprint.md) is the CURRENT master blueprint - pick this first; its execution order (build loop, sprints, milestone gates) lives in [`docs/planning/v10_implementation-plan.md`](./docs/planning/v10_implementation-plan.md). The strategy folder's role map ([`docs/strategy/README.md`](./docs/strategy/README.md)) is the single arbiter of which doc to pick for what.** **For the launch wedge, the competitor posture (integrate / absorb / race / ignore), and the what-to-build-next priority call, [`docs/strategy/v9-decision-wedge-and-build-next.md`](./docs/strategy/v9-decision-wedge-and-build-next.md) is the CURRENT decision-lens canon (the Critic-teardown wedge; memory-as-moat from first principles; the tiered build-next plan); it wins on wedge / competitor / priority calls. v7 still wins positioning, v8 still wins structure.** **The raw brainstorm reasoning behind the canon, and the source narrative for YC / accelerator / investor applications, lives in [`docs/strategy/strategic-inputs-log.md`](./docs/strategy/strategic-inputs-log.md) (a living, append-forward log); major decisions in [`docs/strategy/session-decisions.md`](./docs/strategy/session-decisions.md). Standing rule: every strategy doc is interlinked both ways and never orphaned - a new strategic input is captured in the inputs log, distilled into the canon, and logged in decisions, in the same session.** Engine / expansion map (7 laws · 6 stations · 19-agent mesh · handoff contract · HITL gates · M1 - M5): [`docs/strategy/archive/v4-feature-map.md`](./docs/strategy/archive/v4-feature-map.md). Wedge UX detail: [`docs/strategy/archive/v5-chief-of-staff.md`](./docs/strategy/archive/v5-chief-of-staff.md). Personas: [`docs/strategy/archive/v3-positioning-cadence.md`](./docs/strategy/archive/v3-positioning-cadence.md). **For the repo model (product-level, provider-agnostic, BYO-or-managed), the calm-front autonomous Build to Ship reframe, and the all-in-one platform positioning, [`docs/strategy/byo-build-and-supaprod-cloud.md`](./docs/strategy/byo-build-and-supaprod-cloud.md) is the CURRENT spec; its phased execution (P1-P5, work items + tasks) lives in [`docs/planning/byo-build-implementation-plan.md`](./docs/planning/byo-build-implementation-plan.md) (board group G11).** **For how Supaprod actually builds (the code-gen engine dispatch layer, the twin of `RepoProvider`): [`docs/strategy/build-driver-and-dispatch.md`](./docs/strategy/build-driver-and-dispatch.md) is the build-handoff canon: the `BuildDriver` seam (native floor + owned Claude-Agent-SDK / OpenHands + BYO Devin/Codex/Cursor), the June-2026 market study, cost/white-label, and phases `BD-1..BD-6` (board group G13, founder-gated; decided 2026-06-28).** Index + archive (superseded v1/v2/v3-audit_): [`docs/strategy/README.md`](./docs/strategy/README.md).
   1.55. **Repository map & file-placement policy** - before creating ANY file, follow [`docs/README.md`](./docs/README.md) § "Repository map & file-placement policy": every new doc goes in the right subfolder and is linked from that folder's index in the same commit; nothing new at repo root or `docs/` top level; no duplicates or redirect stubs; screenshots are local-only under `docs/screenshots/`. This is the standing anti-rot rule - honor it so we never re-do a repo cleanup.
   1.58. **⭐ Design contract: read [`DESIGN-TEMPO.md`](./DESIGN-TEMPO.md) FIRST (v5 "Tempo", adopted 2026-07-10 - founder ruling). It is THE standing design contract for EVERY Supaprod surface (authenticated app AND public landing/marketing). The base derives faithfully from Vercel's Geist design system - dark-first (dark is the default; light is generated from the same tokens), the 10-scale × 10-step color role model, the materials/elevation presets, the text-heading/button/label/copy type class system, 32/36/40px controls - with Supaprod's own identity on top: the ember accent scale (`#FF6B2C` family) in the brand role, our icon/illustration/logo treatment, subtle Arc-school personality touches (one per surface max), and Supaprod-specific AI + enterprise pattern extensions (contract §9). Typography: Geist Sans = all UI, Geist Mono = technical content, Geist Pixel = brand moments only (heroes, launches, empty states, AI moments; never body copy or dense UI). Evidence + tooling: [`design-reference/tempo-v5/`](./design-reference/tempo-v5/README.md) (verbatim tokens in `tokens/`, re-implementation-grade per-component specs in `research/`, extension docs in `patterns/`); fonts self-hosted at `public/fonts/geist/` (SIL OFL). **Invoke the `supaprod-tempo` project skill first on any design task** (`.claude/skills/supaprod-tempo/`). v5 SUPERSEDES Loom v4 (`DESIGN-LOOM.md`), Obsidian v3 (`DESIGN-OBSIDIAN.md`), and the Ember Editorial landing system (`DESIGN.md`) - those files and `design-reference/obsidian-v3/` are retired history; never build new surfaces from them; the old `supaprod-design` skill is a deprecation stub. Orthogonal laws that SURVIVE v5 (see contract §10): humanized output, sharp-PM voice/plain-words buttons, the Engine-Room doctrine + IA, affordance ≠ emphasis, one primary CTA per screen, the restraint budget + grayscale test. When any other file (including older strategy/design docs) disagrees with the contract on look, feel, tokens, or component anatomy, the contract wins. **Brand identity assets:** the app/brand logo is the seven-petal **SupaprodMark** ([`src/components/supaprod/SupaprodMark.tsx`](./src/components/supaprod/SupaprodMark.tsx) - the loop spiral around an ember/gold Brain+Pulse core, unchanged geometry from the CadenceMark it was renamed from; also the animated loader `SupaprodLoader`/`AiWorking` + the theme-aware favicon, white on dark / black on light); the ready-to-upload GTM **brand kit** (logo/favicon/social in SVG+PNG + the parametric `generate.ts` + a guidelines README) lives at [`docs/Growth Strategy/branding/`](./docs/Growth%20Strategy/branding/README.md); the applied UI/UX + brand rulings (nav/labels, number tone = blue data via `PixelStat`, button `accent` grammar, hero, avatar, mark, favicon) are recorded in [`design-reference/tempo-v5/applied/2026-07-13-app-port-and-design-rulings.md`](./design-reference/tempo-v5/applied/2026-07-13-app-port-and-design-rulings.md) and the live [`UI-REVAMP-HANDOFF.md`](./UI-REVAMP-HANDOFF.md) (DONE list + the tomorrow-pickup PENDING list). **The PUBLIC LANDING + every public page it links to follow the 2026-07-15 applied record [`design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md`](./design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md) (the ink/starfield canvas, the three-voice trace grammar, the Pixel hero, all founder vocabulary + interaction rulings, and the Vercel/rauno/YC reference canon incl. future in-product candidates) - read it BEFORE touching any public page.** Its companion reference study (the Vercel homepage anatomy, extraction rules, and the waiting list of blocked patterns with unlock conditions) is [`design-reference/tempo-v5/research/vercel-composition-playbook.md`](./design-reference/tempo-v5/research/vercel-composition-playbook.md).
   1.6. [`docs/conventions/`](./docs/conventions/): durable, cross-tool rules applied automatically (rules, not guidance). **Top of the list: [`humanized-output.md`](./docs/conventions/humanized-output.md).** Zero AI fingerprints (no em/en dashes, no invisible Unicode, no AI-cliché phrasing) in BOTH what we author AND what the platform generates for users; the runtime sanitizer at the AI chokepoint is the hard gate. Plus UI chrome, voice ([`ui-voice.md`](./docs/conventions/ui-voice.md)), destructive actions, inline management, doc-closure, and the card/detail-view anatomy + design-system reference ([`design-anatomy.md`](./docs/conventions/design-anatomy.md)). **Any design work loads - FIRST - [`DESIGN-TEMPO.md`](./DESIGN-TEMPO.md) (the v5 design contract, see 1.58), then [`engine-room-doctrine.md`](./docs/conventions/engine-room-doctrine.md) (the product's first UX law: calm front, deep engine; all machinery behind one Engine Room door, revealed on demand; name the outcome not the mechanism; BYO sources via one Connect button; the Engine-Room Test + greppable `Engine-Room:` stamp gate every new surface), then [`design-context.md`](./docs/conventions/design-context.md) (Ember system + design-craft skills + the founder's reference north-stars interfacecraft.dev/devouringdetails.com + the tuned orange; motion is craft, NOT absence) and follows [`home-and-today-ia.md`](./docs/conventions/home-and-today-ia.md) (Today is not a dashboard; the surface-placement rubric for where any new panel belongs, so Today never re-clutters).**
   1.65. **Build-in-public brand system: moved to a separate PRIVATE repo** (`RohitGajaraj/build-in-public`), split out 2026-06-15 so the founder's personal brand, voice, drafts, and social tokens never live in this product repo (which may be shared). **Standing rule (one-way insight feed):** when a genuinely postable build insight surfaces here (high bar, only what would make a real social post, NOT a build log, high signal and low noise), append it to [`docs/brand-feed.md`](./docs/brand-feed.md), including a **capture cue** (the screenshot, short video, link, or handle to tag that would strengthen the eventual post). That file is the single source the build-in-public engine reads first; it defines what qualifies as postable, the voice, and the entry format - follow it when capturing. The engine then drafts in the founder's voice and auto-stages **Buffer drafts\*\* for his review (it never publishes; full plumbing in the brand repo's `how-it-works.md`). Keep it public-safe, no secrets. Never post to the founder's accounts without his explicit approval. Do not recreate `docs/brand/` in this repo.
2. [`README.md`](./README.md) - product thesis, positioning, MOAT, who it is for.
3. [`plan.md`](./plan.md) - what is built, what is planned, the milestone roadmap. Sub-feature-level scope: [`docs/planning/archive/feature-backlog.md`](docs/planning/archive/feature-backlog.md). **Current build initiative (workspace / accounts / tenancy + monetization), the cross-tool build bible:** [`docs/planning/workspace-tenancy-and-monetization-plan.md`](./docs/planning/workspace-tenancy-and-monetization-plan.md) (live board group G10 in [`docs/planning/feature-dashboard.md`](./docs/planning/feature-dashboard.md)). **💳 PRICING & BILLING - the single front door for the credit model, BYOK, model access, tiers, and the billing rail: [`docs/strategy/pricing/`](./docs/strategy/pricing/README.md). Start at [`pricing-architecture.md`](./docs/strategy/pricing/pricing-architecture.md) (the finalized end-to-end system; when it and any older pricing doc disagree, it wins once ratified).** **Moat / competition / positioning canon (lead with the decision layer; memory is one layer; YC objection Q&A):** [`docs/strategy/moat.md`](./docs/strategy/moat.md).
4. Then the doc you need: [`DESIGN-TEMPO.md`](./DESIGN-TEMPO.md) (THE design contract, all surfaces; `DESIGN-LOOM.md`/`DESIGN-OBSIDIAN.md`/`DESIGN.md` are retired history), [`architecture/`](./architecture/) (runtime · orchestration · security · data · frontend · integrations), [`docs/operations/skills.md`](./docs/operations/skills.md), [`docs/operations/subagents.md`](./docs/operations/subagents.md), [`docs/operations/tools.md`](./docs/operations/tools.md), [`docs/operations/hooks.md`](./docs/operations/hooks.md), [`docs/operations/permissions.md`](./docs/operations/permissions.md), [`docs/operations/memory.md`](./docs/operations/memory.md), [`docs/operations/commits.md`](./docs/operations/commits.md), and cross-cutting gaps in [`docs/planning/considerations.md`](./docs/planning/considerations.md).
5. **Demo accounts** (for demos / screen recordings / any flow that needs a working login): [`docs/operations/demo-credentials.md`](./docs/operations/demo-credentials.md) - two pre-provisioned logins + shared password + seeded workspace contents.

## Commands

**Bun is the package manager / runner** (`bun.lock`, `bunfig.toml`). The lingering `package-lock.json` is not canonical.

- `bun install` - deps. `bunfig.toml` enforces a 24h supply-chain guard (`minimumReleaseAge`); never add to `minimumReleaseAgeExcludes` without asking the user.
- `bun run dev` - Vite dev server (TanStack Start). Use this to verify UI changes - see [`AGENTS.md`](./AGENTS.md) §3 and [`architecture/frontend.md`](./architecture/frontend.md).
- `bun run build` / `bun run build:dev` - production / dev-mode build (Vite → Cloudflare Worker). `bun run preview` - serve the built worker.
- `bun run lint` - ESLint. `bun run format` - Prettier.
- `bun run cost:track` - capture the current Claude Code session's token spend into the `cost-tracking` namespace (consumed by the ruflo `cost-report` / `cost-optimize` skills). Wraps the ruflo-cost-tracker plugin's `track.mjs`; [`scripts/cost-track.sh`](./scripts/cost-track.sh) works around two of its bugs - its path encoder doesn't handle the spaces in this repo's path, and its memory-store omits `--upsert` so same-session re-runs fail. Run it after a chunk of work or at session end.
- `bun run cost:summary` - print a cost summary across all sessions in the `cost-tracking` namespace. Wraps the ruflo-cost-tracker plugin's `summary.mjs` with `CLI_CORE=1` for fast backend. Use to verify recorded spend or export as JSON (`bun run cost:summary -- --format json`). See [`scripts/cost-summary.sh`](./scripts/cost-summary.sh).
- DB changes go in `supabase/migrations/` as timestamped SQL (RLS-aware). Migration safety is hook-enforced - see [`docs/operations/hooks.md`](./docs/operations/hooks.md).

## Stack & architecture at a glance

- **TanStack Start** (full-stack React 19) + **Vite 7**, deployed to **Cloudflare Workers**. The SSR entry is rerouted to [`src/server.ts`](./src/server.ts), which wraps `@tanstack/react-start/server-entry` to catch h3-swallowed 500s (invisible to plain `try/catch`) and render a branded error page. Treat `src/server.ts` as load-bearing.
- **Routing** is file-based in `src/routes/`. `_authenticated.*` is the gated app shell - one route per surface (discovery, prds, roadmap, agents, traces, evals, guardrails, drift, ...). `p.$slug.tsx` = public pages; `src/routes/api/*` = server routes (`chat.ts`, the `public/*` cron hooks and ingest, the A2A card). `src/routes/routeTree.gen.ts` is generated - do not hand-edit.
- **Server logic** lives in `src/lib/*.functions.ts` - one TanStack server-function module per domain. AI/RAG code is in `src/lib/ai` and `src/lib/rag`.
- **`.server.ts` convention** - files with this suffix run in the Cloudflare Worker process only and are never bundled to the client. Importing a `.server.ts` from a client component will fail at build time. Key server-only files: `src/lib/ai/runtime.server.ts`, `src/lib/rag/*.server.ts`, `src/integrations/supabase/client.server.ts`.
- **AI runtime chokepoint** - all AI calls go through `src/lib/ai/runtime.server.ts`. It handles guardrails, cost tracking, BYO key routing, and token logging. Two variants: `callModel` (awaited JSON, used by the agent loop) and `callModelStream` (SSR streaming, used by `chat.ts`). Adding a new AI surface requires a valid `CallSurface` literal from the exported union type - don't call the AI gateway directly.
- **Agent loop** - `src/lib/ai/loop.server.ts` implements the agentic planning loop: up to 6 steps, pulls user-enabled tools from `TOOL_REGISTRY`, iterates `{thought, action}` JSON, and enforces per-tool approval modes (`auto` / `confirm` / `review`). New agentic tools go in `src/lib/ai/tools/registry.server.ts`; wire them there, not ad-hoc.
- **UI**: shadcn/ui (new-york, slate base) + Tailwind v4 + Radix; lucide icons; tiptap + monaco editors; recharts; framer-motion/motion. Aliases (`@/components`, `@/lib`, `@/hooks`, ...) defined in `components.json`.
- **Data / auth**: Supabase (`@supabase/supabase-js`, RLS migrations) + `@lovable.dev/cloud-auth-js`. Client wiring in `src/integrations/`. This backend (DB, auth, OAuth, hosting) is provisioned and managed by Lovable; read live config, schema, and data from the Lovable MCP (`mcp__lovable__*`) or the Supabase MCP (`mcp__supabase__*`), never guess. Secret values are local-first (this project's git-ignored `.env` + wrangler secrets, per the env-var split below). See the Lovable rule in [`AGENTS.md`](./AGENTS.md) §0.
- **Integrations engine**: the connector platform lives in `src/lib/connectors/` - a typed provider registry + adapters + the `resolveProviderAuth` credential chain (workspace binding → user connection → env fallback). Account-level connections UI in Settings → Connected accounts; workspace-level resource bindings on `/sync`. OAuth via the GitHub App / Lovable connector gateway; pasted keys encrypted (AES-256-GCM, service-role-only vault). `nango/` was removed 2026-05-30 - if breadth ever demands it, run Nango as a separate service.
- **Python `.venv` + `requirements.txt`** are dev tooling only - the graphify knowledge-graph indexer (tree-sitter, transformers, torch). Not part of the deployed runtime.

## Git Discipline (Non-Negotiable)

**Every git interaction - commit, push, pull, merge - requires a clear one-line WHY.** See [`docs/operations/git-discipline.md`](./docs/operations/commits.md) for the canonical cross-tool standard. Hooks enforce this.

- Use a commit skill - `gstack-ship`, `commit-commands:commit`, or similar if available. Always include the WHY in the message, not just the WHAT.
- Push with explicit refspec, always: `git push origin <branch>:main`. Bare `git push origin` pushes to the lane branch only, invisible to `main`. The one remote is `https://github.com/RohitGajaraj/Supaprod.git` (renamed from `project_cadence_v5` as part of the brand rename, 2026-07-17 - GitHub redirects the old URL, but the remote is set to the new one directly; this is the repo Lovable reads); verify with `git remote -v` if ever in doubt.
- **The post-push `sync-pcv4.sh` step is RETIRED (founder ruling 2026-07-02).** It existed for the era when `Project-Cadence-v4` was the canonical checkout (the 2026-06-26 stale-dashboard incidents); since the 2026-07-01 canonical-repo fix, this v5 folder + GitHub v5 are canonical, the legacy local v4 folder is a viewing copy nobody works in, and the mandated session-start `git pull origin main` keeps every checkout fresh. `scripts/sync-pcv4.sh` remains only as an optional manual utility until the legacy v4 folder is deleted; do not run it as part of push discipline.
- Pull with intent: `git pull - syncing latest; checking active-task.md for conflicts`

## Conventions & gotchas (so you work faster)

- **Adding a feature = two files in lockstep.** Put server logic in `src/lib/<domain>.functions.ts` (TanStack server functions), then consume it in the matching `src/routes/_authenticated.<domain>.tsx` via TanStack Query (`useQuery`/`useMutation` with `queryKey`s). Follow an existing pair (e.g. `prds` ↔ `discovery.functions.ts`/`lineage.functions.ts`) rather than inventing a new data-flow shape.
- **Ignore the "space-2"-suffixed directories** (`src/components 2`, `src/integrations 2`). They are empty macOS case-insensitive-FS duplication artifacts - never edit, import from, or `cd` into them; the real code is in `src/components` and `src/integrations`. (Background: [`AGENTS.md`](./AGENTS.md) §7.)
- **Don't hand-edit generated files**: `src/routes/routeTree.gen.ts` (regenerated by the router plugin) and migration SQL once applied.
- **Env var split** - client-side uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (Vite prefix, safe to expose in the browser bundle). Server-side uses plain `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `LOVABLE_API_KEY` (wrangler secrets, never in the client bundle). Never add a `VITE_` prefix to a secret.
- **API routes** - `src/routes/api/` files use `createFileRoute` with `server.handlers.{POST|OPTIONS}` objects, not React components (no `loader`/`component` exports). This pattern is different from all other routes - follow `chat.ts` as the reference.
- **Cost discipline.** This is a large, doc-heavy repo - read the targeted doc/file you need, not everything. Don't grep blindly when the read-order map or a `*.functions.ts` name already points you to the answer.

## Behavioral guidelines (source: AGENTS.md §4)

Before writing code: **Think. State assumptions. Surface tradeoffs.**
While coding: **Surgical changes only - every line traces to the task.**
Goals: **Minimum code. Simplicity first. Nothing speculative.**
Success: **Define success criteria upfront. Verify before declaring done.**
Velocity: **Ship features fast. Per cycle, gate on correctness only (tsc + build + tests + runtime-fatal review). BUILD-ONLY MODE is active: skip all documentation overhead, dashboard updates, feature docs, plan.md logs. Just build the code, verify it compiles and works, commit with a WHY, push.** _(Founder ruling 2026-07-04; canonical: [`AGENTS.md`](./AGENTS.md) §3.)_ _(One-time documentation catch-up ran 2026-07-10 per explicit founder exception, reconciling plan.md/SOURCE-OF-TRUTH.md/feature-dashboard.md/session-decisions.md and several planning/ops docs to current state; BUILD-ONLY MODE remains ACTIVE afterward - a single reconciliation pass, not a re-enable.)_

Full detail: [`AGENTS.md`](./AGENTS.md), section 4. These apply equally to Claude Code, Antigravity, Gemini, and Lovable.

## Observability (analytics + failure detection)

If your work touches telemetry, error capture, uptime, on-call, or the public status page: the single front-door is **[`docs/planning/analytics-and-failure-detection-plan.md`](./docs/planning/analytics-and-failure-detection-plan.md)** (AFD initiative, group G12, founder-gated). Vendor selection is decided (PostHog EU + Sentry EU + Better Stack); the façade contract is in [`docs/features/observability-facade.md`](./docs/features/observability-facade.md). Do not import vendor SDKs outside `src/lib/observability/` once AFD lands.

## The closed documentation loop (⏸️ SUSPENDED - BUILD-ONLY MODE active)

> **BUILD-ONLY MODE is ACTIVE (founder ruling 2026-07-04).** The full doc loop is PAUSED. During builds: no plan.md log, no SSOT updates, no feature docs, no brand-feed captures, no doc-closure ceremony. The ONE trace: flip the feature-dashboard row status + a one-line note when something is built. Em/en dashes in .md docs are fine (docs are not consumer-facing). Code-level humanization (source files, UI strings, generated output) still applies. Full details: [`AGENTS.md`](./AGENTS.md) §3 "BUILD-ONLY MODE". To re-enable: the founder says so.
>
> **One-time documentation catch-up (founder exception, 2026-07-10):** a single reconciliation pass brought `plan.md`, `SOURCE-OF-TRUTH.md`, `feature-dashboard.md`, `session-decisions.md`, and several planning/ops docs back to true current state. BUILD-ONLY MODE remains ACTIVE afterward - this was a single reconciliation pass, not a re-enable of the full doc loop.

## Claude-Code-specific notes

- **Skills, agents, plugins, MCP servers.** The active list appears in the session reminder - it is the source of truth; never invoke from training memory. **Before any task: scan available skills/agents/plugins/MCP, shortlist candidates across ALL namespaces, pick the best fit.** Full protocol: [`AGENTS.md`](./AGENTS.md) section 2. Selection logic: [`docs/operations/skills.md`](./docs/operations/skills.md) and [`docs/operations/subagents.md`](./docs/operations/subagents.md). **All namespaces have equal priority - no bias to any vendor.**
- **Lovable is the first checkpoint for everything; query it directly, never guess.** Supaprod was built on, is hosted on, and is published through Lovable, the live system of record for the whole project (Supabase DB, auth/OAuth, connectors, edge functions, hosting, deploys, analytics, logs, source). When you hit any gap, error, or unknown (a backend/infra/OAuth/connector/deployment fact, a data point, an error or log, an analytics number, a SQL result), check Lovable directly first via the connected **Lovable MCP** (`mcp__lovable__*`); use the **Supabase MCP** (`mcp__supabase__*`) for SQL (`execute_sql`), logs (`get_logs`), and advisors. Do not assume or fabricate. One exception, secrets and env are local-first: key secrets live in this project's git-ignored `.env` and as wrangler secrets under the env-var split below, so check local first for those. Canonical rule: the Lovable callout in [`AGENTS.md`](./AGENTS.md) section 0.
- **Commits.** Use a commit skill - scan available options (`gstack-ship`, `commit-commands:commit`). Full discipline: [`docs/operations/commits.md`](./docs/operations/commits.md).
- **Memory.** Auto-memory + project-local `.remember/`: [`docs/operations/memory.md`](./docs/operations/memory.md). **Session handoff is a PAIR - write both at milestones and before session end:** `.remember/remember.md` (untracked, owned by the `remember` plugin, which injects it at SessionStart and truncates it as it reads, so never expect to find it on disk and never commit it) and [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md) (tracked, durable, survives the read). Reading: the injected block first, the durable file if that is missing or cut off. Full rule: [`AGENTS.md`](./AGENTS.md) ⚡ standing order.
- **Tools.** Read/Edit/Write/Bash/Task conventions: [`docs/operations/tools.md`](./docs/operations/tools.md).
- **Hooks.** Claude Code hooks enforce repo invariants (commit policy, migration safety, session context). Setup and rationale: [`docs/operations/hooks.md`](./docs/operations/hooks.md).
- **Session-friction patterns** (fact-forcing gate, case-insensitive FS, `git mv` read-tracking, cost discipline) are documented once in [`AGENTS.md`](./AGENTS.md), section 7. Add to that loop, not here.

## Knowledge-graph note (graphify)

Current state (built 2026-08-01): **14,563 nodes / 29,128 edges** over all 1,872 code files (including every one of the 412 `supabase/migrations/*.sql`) plus 704 docs. There is no `ruvector.db`; that pointer was wrong and is retired.

**The markdown layer IS in git; the graph binary is not.** `graphify-out/wiki/` (1,713 articles) and `graphify-out/GRAPH_REPORT.md` are committed, because cloud and web agents cannot run the graphify CLI and markdown is the only thing they can read. `graph.json` (16 MB, rewritten in full every build), `cache/`, `manifest.json` and the HTML stay ignored, so `git pull` gives you the readable layer but never a queryable graph. Two ways to get one in a given checkout:

- **The machine-wide copy (use this first).** Registered at `~/.graphify/global-graph.json`, it is queryable from any directory on this Mac, including a fresh clone or another worktree with no `graphify-out/`: `graphify explain "<symbol>" --graph ~/.graphify/global-graph.json`. Node ids there are prefixed `supaprod::`. Refresh it after a rebuild with `graphify global add graphify-out/graph.json --as supaprod`.
- **A local build**, only if you need the HTML or wiki in that checkout. Free for code (`graphify update .`); the full doc layer costs ~$3 of Gemini (see the rebuild note below).

The HTML/wiki outputs are local-only artifacts of whichever checkout built them: `graphify-out/GRAPH_TREE.html` (the readable one at this node count), `graph.html` (force-directed, auto-aggregated to community bubbles above 5,000 nodes), `GRAPH_REPORT.md`, and `wiki/index.md`.

Query it before raw grep - it is ~206x cheaper per question than reading the corpus:

- `graphify explain "<symbol>"` - **the sharpest tool.** Exact node, source file + line, and every inbound/outbound edge. Use this when you know the name.
- `graphify query "<question>"` - BFS over the graph. Broad: a 2-hop walk routinely touches 1,000+ nodes, so pass `--budget` and prefer specific nouns over generic ones.
- `graphify affected "<symbol>"` - reverse traversal, what breaks if you change this.
- `graphify-out/wiki/index.md` - 1,712 markdown articles, one per community; the agent-crawlable entry point.
- `graphify path "<A>" "<B>"` - weakest of the set. Matching is literal substring + IDF with no synonyms, so generic words collide (asking for "Build" matches the npm `build` script in `package.json`, not the Build station). Use full symbol names or prefer `explain`.

Two honest limits: every file is truncated at **20,000 chars** before extraction, so only the head of the mega-docs (`feature-dashboard.md` is 6.45 MB) is indexed; and 26 mostly-SVG files returned no nodes.

Rebuild after code changes with **`PYTHONHASHSEED=0 graphify update .`** (AST only, no LLM, free).
**Always pin `PYTHONHASHSEED=0`**: networkx louvain iterates string-keyed sets whose order python
randomizes per process, so without the pin the clustering churns run to run, every community gets
renamed, and the 1,713 committed `wiki/` filenames all change. The removed git hook used to set
this for you; now you must. **Do this by hand;
the graph does not refresh itself.** `graphify hook install` was tried on 2026-08-01 and removed
the same day, deliberately, for two reasons: the hook writes into the SHARED `.git/hooks`, so it
applies to every worktree and every parallel session rather than just yours, and it grabs the git
index, which broke a `git rebase` mid-flight with `Unable to create index.lock` (recoverable, but
it left HEAD on the upstream tip with the local commits unapplied). It also earns nothing here,
because it compares `git-dir` against `git-common-dir` and exits 0 whenever they differ, which is
always true in a Conductor worktree. Do not reinstall it. Note also that a rebuild re-runs
clustering and renumbers communities, so hand-written community labels do not survive; the tail is
auto-named from each community's hub node. A full rebuild including the doc layer needs a Gemini key and costs ~$3: `GEMINI_API_KEY=... graphify extract . --backend gemini`. Do **not** use `--backend claude-cli`: it appends its schema to Claude Code's base agent prompt, so the model returns a plausible but wrong-schema graph that graphify discards as "hollow" - it produces nothing and burns hours.

> Everything else: [`AGENTS.md`](./AGENTS.md). Do not restate its rules here.
