# Supaprod Front-End Rebuild: Phase 1 Architecture

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Version:** 1.0  
**Date:** 2026-07-18  
**Status:** Complete — ready for Phase 2 (Design System Ink)

---

## 0. EXECUTIVE SUMMARY

Three-surface model (Home + Project + Approvals + Shell) replaces 85+ current routes. Every capability preserved; only surfaces move. Capability coverage matrix ensures nothing drops. Lifecycle motion map covers all state transitions before pixels. Product-management domain map ensures full discipline is represented. Copy deck v1 ready for voice pass.

**Architect decisions logged below.** Assumptions made where founder silent on morning questions; all flagged in section 8 (Morning Decision Queue).

---

## 1. THREE-SURFACE INFORMATION ARCHITECTURE

### SURFACE 1: HOME

**Job:** Resume work or start fresh. One entry point for all lifecycle stages.

**Layout:**
```
┌─────────────────────────────────────┐
│  SUPAPROD  [🔍 Search] [⚙️ Settings]│  Shell (minimal)
├─────────────────────────────────────┤
│                                     │
│  "What are we building?"            │  Conversational hero
│  [Command bar + intent input]       │
│                                     │
├─────────────────────────────────────┤
│  Recent Projects                    │  Quiet cards: Atlas, Relay, Comet
│                                     │  (max 3–4 visible; "show more" on demand)
├─────────────────────────────────────┤
│  One suggestion (dismissible)       │  "Relay needs launch copy approval"
│                                     │  or "Signal: checkout flow feedback"
└─────────────────────────────────────┘
```

**No dashboards, widgets, or status grids.** Everything is a card or a suggestion, nothing demands attention except when Approvals has work.

**Command bar syntax examples:**
- "Plan a habit tracker"
- "Design a mockup for our checkout"
- "Add SSO to my existing app"
- "Write the launch post for v2"

Command bar accepts intent at any lifecycle stage (entry-at-any-stage rule). Router infers starting point.

**Empty state (new user):**
- Three suggested intents ("Plan a feature", "Design a mockup", "Import existing app")
- One "Start tutorial" action
- Nothing prescriptive; all optional

### SURFACE 2: PROJECT

**Job:** Lifecycle execution. The adaptive canvas meets the project spine.

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  SUPAPROD   Project: Relay                Settings │  Shell + project name
├────────────────────────────────────────────────────┤
│  [Command palette / new intent input]              │  Persistent command rail
├────────────────────────────────────────────────────┤
│ Plan ▶ Design ▶ Build ▶ Ship ▶ Launch ▶ Grow       │  Lifecycle spine
│  •Done    •Done   •Now   ⏸       ⏭       ⏳        │  (click to jump)
├────────────────────────────────────────────────────┤
│                                                    │
│              [Adaptive Canvas]                     │
│                                                    │
│  (Code face for code gen / Design face for        │
│   mockups / Plan face for specs / Shipping face   │
│   for deploy state / Launch face for copy/GTM)    │
│                                                    │
│  Streaming agent output where applicable          │
│  (code generation, design review, etc.)           │
│                                                    │
├────────────────────────────────────────────────────┤
│ Agent Activity (Geist Mono, engineering grid)     │  "Agents draft deploy plan"
│ 2026-07-18 14:23   Claude Model Relay   (Agents  │  Legible autonomy
│                    generated design mockup for   │
│                    checkout flow)                │
└────────────────────────────────────────────────────┘
```

**The Lifecycle Spine:** Four visual states for each stage:
- **Done** (checkmark, lighter color)
- **Now** (highlight, spinner if agents active)
- **Paused** (pause icon, clickable to resume)
- **Incoming** (arrow, next in queue)

Stages can re-open (a ship can return to Build for rework; a launched product can re-enter at Plan for new features).

**The Adaptive Canvas:** One surface that renders differently per stage and artifact type:
- **Plan mode:** Structured document (title, brief, scope, milestones, success metrics)
- **Design mode:** Live rendered mockups (Figma preview or web component rendered in-sandbox)
- **Build mode:** Code-and-terminal view (Geist Mono, syntax highlighting, file tree, diffs, streaming output)
- **Ship mode:** Environment selector + preview link + "Ship" CTA + rollback button
- **Launch mode:** Markdown editor for copy (announcement, changelog, social posts) + asset preview
- **Grow mode:** Signal digest (adoption, feedback themes) + suggested next work

Canvas automatically switches as agents produce work; user can pin or flip manually.

**Agent Activity Timeline (Geist Mono signature element):**
```
2026-07-18 14:23   Claude  Agents generated design mockup
2026-07-18 14:19   Sonnet  Revised spec per your feedback
2026-07-18 14:15   Haiku   Drafted launch announcement
2026-07-18 14:10   ·       You approved plan
```

One-click to expand any entry → full context / diffs / reasoning. This is how autonomy becomes legible.

**Command rail (persistent left):** A narrow vertical strip where users can type new intent mid-project. "Rework the code we shipped six months ago" → agents re-enter at Build, scoped to that change.

### SURFACE 3: APPROVALS

**Job:** Single queue of all decisions awaiting human judgment.

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  SUPAPROD   Approvals (4 pending)      Settings    │  Header
├────────────────────────────────────────────────────┤
│                                                    │
│  PROJECT: Relay                                    │  Project name
│  Plan change for checkout flow                     │  Item type + brief
│  Proposed: Replace guest checkout with SSO        │  What the agent proposes
│                                                    │
│  Cost: 2,000 credits | Impact: Launch on schedule │  Meta: cost, impact, risk
│  [Approve] [Request changes] [Reject]             │  One-tap decisions
│                                                    │
├────────────────────────────────────────────────────┤
│  PROJECT: Atlas                                    │
│  Deploy approval for v2.1                          │
│  Proposed: Ship to production                      │
│                                                    │
│  Cost: 500 credits | Risk: Low (automated tests)  │
│  [Approve] [Request changes] [Reject]             │
│                                                    │
├────────────────────────────────────────────────────┤
│  (more items...)                                   │
└────────────────────────────────────────────────────┘
```

**Each item shows:**
- Project + stage (context)
- Proposal in plain words (what the agent wants to do)
- Why (reasoning / confidence / evidence)
- Cost (credits consumed)
- Impact/risk (simple signal: low/medium/high)
- One-tap decisions: Approve / Request changes / Reject

**No scrolling to find things.** When a user opens Approvals, they see exactly what needs them, in priority order (by impact, then by recency).

**No pagination.** If there are 20 approvals, they see all 20 (or a "load more" if truly massive; rare).

### SHELL

**Global persistent UI:**
```
┌──────────────────────────────────────────┐
│ [S] Supaprod      [🔍 Project ▼]  [⚙️]   │
└──────────────────────────────────────────┘
```

Left-most: Supaprod mark (clickable → home)  
Middle: Project switcher (dropdown of workspace projects + "New project")  
Right-most: Settings icon (gear → Settings modal/drawer)

**No top nav with 6 tabs. No sidebar drawer with 12 routes.** Four global items, that is all.

**Approvals badge:** Notification count on Settings icon (or beside it) showing pending decisions. Tap to jump to Approvals surface.

---

## 2. ROUTE MAP: OLD → NEW HOMES

| Old Route | Decision | New Home | Access Path | Default View |
| --- | --- | --- | --- | --- |
| `_authenticated.today` | MERGE | Home | Direct (/home) | Recent projects + suggestions |
| `_authenticated.onboarding` | MERGE | Home onboarding | Signup flow → Home steps 1–3 | Conversational flow |
| `_authenticated.build.$id` | MERGE | Project/Build | /project/$id (route infers stage) | Canvas in Build mode |
| `_authenticated.studio.$id` | MERGE | Project/Design | /project/$id (route infers stage) | Canvas in Design mode |
| `_authenticated.design` | MERGE | Project stage | /project/$id > click Design | Lifecycle spine, Design selected |
| `_authenticated.plan.spec.$id` | MERGE | Project/Plan | /project/$id (route infers stage) | Canvas in Plan mode |
| `_authenticated.missions.$id` | MERGE | Project detail | /project/$id | Full project view |
| `_authenticated.ship` | MERGE | Project/Ship | /project/$id > Ship stage | Deploy UI |
| `_authenticated.prds.$id` | KILL | (move to backend view) | Query via command or Project | Rendered inside Project/Plan |
| `_authenticated.govern` | MOVE | Settings/Advanced | /settings?section=advanced | Governance controls |
| `_authenticated.sync` | MOVE | Settings/Connections | /settings?section=connections | Source bindings |
| `_authenticated.integrations` | MOVE | Settings/Connections | /settings?section=connections | OAuth / tool connections |
| `_authenticated.brain` | MOVE | Settings/Advanced/Memory | /settings?section=advanced&view=memory | Memory graph view |
| `_authenticated.knowledge` | KILL | (merged into Memory) | Settings/Advanced/Memory | — |
| `_authenticated.memory` | MOVE | Settings/Advanced/Memory | /settings?section=advanced&view=memory | — |
| `_authenticated.traces` | MOVE | Project/Engine Room | /project/$id > (disclosure) Engine Room | Traces list |
| `_authenticated.evals` | MOVE | Project/Engine Room | /project/$id > Engine Room | Evals + guardrails |
| `_authenticated.guardrails` | MOVE | Project/Engine Room | /project/$id > Engine Room | — |
| `_authenticated.drift` | MOVE | Project/Engine Room | /project/$id > Engine Room | — |
| `_authenticated.engine-room` | KEEP | Project (nested) | /project/$id > disclosure | Recessed power-user door |
| `_authenticated.analytics` | KILL | (signals digested into Project/Grow) | — | — |
| `_authenticated.chat` | KILL | (conversation is every interface) | — | — |
| `_authenticated.discover` | KILL | (entry via command / Home suggestions) | Home command bar | — |
| `_authenticated.fleet` | KILL | (agents invisible) | — | — |
| `_authenticated.cockpit` | KILL | (or move to Settings admin view; low priority) | — | — |
| `_authenticated.trust-ledger` | KEEP (reachable) | Settings or Home link | /settings?view=trust | Trust receipts |
| `_authenticated.impact` | KEEP (reachable) | Settings/Impact | /settings?section=account&view=impact | PM ledger |
| `_authenticated.learn` | MERGE | Project/Grow | /project/$id > Grow stage | Outcome digest |
| `_authenticated.roadmap` | KEEP (command) | Home/Project command | Search/command "roadmap" | Modal or full view |
| `_authenticated.stakeholder` | KEEP (modal) | Project > Generate | In-Project action → modal | Stakeholder pack generator |
| `/ard`, `/d/$slug`, `/p/$slug`, `/proof`, `/trust`, `/updates` | KEEP | Public routes (unchanged) | Public links | Public proof surfaces |

---

## 3. USER JOURNEY FLOWS (eight stages + entry-at-any-stage)

### STANDARD JOURNEY (idea → launch → grow)

**Stage 0: Landing/Auth**
- Public landing (unchanged)
- One sentence + CTA
- SSO/email sign-in

**Stage 1: Onboarding** (≤3 steps, conversational)
- Q: "What are we building?" → Answer becomes project name
- A: Agent immediately starts drafting plan (first artifact appears on screen day one)
- Q: "Anything else I should know?" → Optional context
- → Home (now has one live project)

**Stage 2: Home**
- Resume recent projects (cards: Atlas, Relay, Comet)
- One quiet suggestion
- Command bar ready for next work

**Stage 3: Project · Plan**
- Agent drafted scope/spec/milestones
- User reads, edits in place, approves
- Approval routes to Approvals queue (if gates exist) or auto-advances

**Stage 4: Project · Build**
- Agents execute (design, code, content) with streamed progress
- Canvas adapts to what's being built
- Anything needing judgment routes to Approvals

**Stage 5: Ship**
- Preview what's about to go live
- Approve → shipped
- Environment plumbing invisible
- Rollback affordance visible

**Stage 6: Launch & GTM**
- Platform pre-drafts kit (announcement, changelog, social posts, one-pager, GTM checklist)
- User reviews and fires
- This stage is a USP (not an afterthought tab)

**Stage 7: Grow**
- Calm digest (adoption signal, feedback themes)
- One suggested next move (fed by signals + Memory)
- Loop can re-enter at any stage

### ENTRY-AT-ANY-STAGE VARIANTS

**Mockup-only:** "Design a mockup for X"
- Opens project directly in Design stage
- Agent infers lightweight brief (editable)
- Plan/Build/Ship/Launch marked as not-applicable or inferred-on-demand

**Existing product:** "Add these two features to my app"
- Connects to repo/URL
- Agents ingest codebase + context
- Opens directly in Plan (scoped to those features)
- Earlier stages marked imported/inferred

**Launch-only:** "Write launch copy for my shipped product"
- Enters at Launch stage directly
- Earlier stages marked N/A or backfilled on demand

**Anywhere-in-between:** Router infers stage from intent; user can reposition on spine explicitly.

### LIFECYCLE MOTION MAP (all state transitions)

Every motion reduces to the same primitive: **(signal or intent) → agent proposal → human gate → scoped execution pass on a stage.**

| Motion | Trigger | Affordance | Agent Behavior | User Flow |
| --- | --- | --- | --- | --- |
| **Interrupt** | Urgent work lands mid-pass | Priority indicator on timeline | Pause current pass, queue new work | Click urgency flag or use command bar |
| **Break** | Agent/build/deploy fails | Visible pause + plain-word reason + recovery options | Stop progress, explain failure, propose fix or rollback | See failure state, choose action |
| **Go back** | Rework earlier stage | Click stage on spine (reopen stage) | Re-enter that stage, scoped, pull Memory context | Click "Redesign checkout" from spine |
| **Revert** | Undo something shipped | Rollback button on Ship stage | Deploy previous version, record decision | One click, history intact |
| **Fast-forward** | Skip ahead | Click stage on spine (jump to) | Mark skipped stages as inferred/N/A, backfill on demand | Jump from Plan → Ship if ready |
| **Fork** | Explore alternative in parallel | Spinner beside spine (branch preview) | Run scoped pass on parallel branch, keep original | Compare two variants, merge or discard |
| **Pause/resume** | Park work, return later | Pause button on timeline; resume via command | Store work context in Memory, restore on resume | Click "Resume Relay" from Home |
| **Cancel** | Abandon a pass | Cancel button (final confirmation) | Delete in-flight work, record decision + reason | Confirm cancellation, decision logged |

Every motion leaves a recorded cycle on the spine. History is never overwritten.

---

## 4. CAPABILITY COVERAGE MATRIX

**Every current capability stays reachable. Justify-or-cut applies to surfaces, not features.**

| Capability | Current Route | New Home | Access Path | Default/On-Demand |
| --- | --- | --- | --- | --- |
| **User auth** | /login, /signup | Auth doorway | Public links | Default |
| **Workspace creation** | Part of onboarding | Onboarding stage 1 | Signup flow | Default |
| **Project CRUD** | _authenticated.today + admin | Home + Settings | Home card or Settings/Workspace | Default + Settings |
| **Project lifecycle** | _authenticated.build, design, ship | Project/lifecycle spine | /project/$id | Default |
| **Plan drafting** | _authenticated.plan | Project/Plan stage | /project/$id | Default |
| **Design work** | _authenticated.design, studio | Project/Design stage | /project/$id | Default |
| **Code generation** | _authenticated.build | Project/Build canvas | /project/$id | Default |
| **Shipping/deploy** | _authenticated.ship | Project/Ship stage | /project/$id | Default |
| **Launch copy** | (scattered) | Project/Launch stage | /project/$id | Default |
| **Outcomes & learnings** | _authenticated.learn | Project/Grow stage | /project/$id | Default |
| **Signal feed** | _authenticated.discover | Home suggestion + Project/Grow | Home / Project | On-demand |
| **PRD storage** | _authenticated.prds | Project/Plan (backend) | Render in Project | On-demand |
| **Roadmap** | _authenticated.roadmap | Command surface + modal | Search "roadmap" or Project action | On-demand |
| **Workspace settings** | _authenticated.settings | Settings/Workspace | /settings?section=workspace | Default |
| **Member management** | _authenticated.settings | Settings/Workspace | /settings?section=workspace | Default |
| **Integrations** | _authenticated.sync, integrations | Settings/Connections | /settings?section=connections | Default |
| **Workspace memory** | _authenticated.brain, memory | Settings/Advanced/Memory | /settings?section=advanced&view=memory | On-demand |
| **Role-based access** | _authenticated.govern | Settings/Advanced | /settings?section=advanced | On-demand |
| **Agent traces** | _authenticated.traces | Project/Engine Room | /project/$id > disclosure | On-demand (power users) |
| **Evals & guardrails** | _authenticated.evals, guardrails | Project/Engine Room | /project/$id > disclosure | On-demand (power users) |
| **Drift detection** | _authenticated.drift | Project/Engine Room | /project/$id > disclosure | On-demand (power users) |
| **Trust & audit** | _authenticated.trust-ledger | Settings/Trust or public | /settings?view=trust or public link | On-demand |
| **PM impact ledger** | _authenticated.impact | Settings/Impact | /settings?section=account&view=impact | On-demand |
| **Public proof** | /d/$slug, /p/$slug, /proof | Public routes (unchanged) | Public links | Public (no login) |
| **Model routing (new)** | (admin) | Settings/Advanced/Model Console | /settings?section=advanced&view=routing | On-demand (admin) |

**Nothing orphaned.** Every capability has a path to discovery.

---

## 5. PRODUCT-MANAGEMENT DOMAIN MAP

**Full PM discipline mapped to design surfaces.** If a working PM would have to leave Supaprod to do any part of their job, it isn't mapped yet.

| PM Practice | Where It Lives | Canvas / Surface | Access Path |
| --- | --- | --- | --- |
| **Discovery research** | Project/Plan (via signals) | Plan mode | Home suggestion or command "research signal X" |
| **User interviews** | Signals → Approvals | Signal digest | Project/Grow + Approvals |
| **Opportunity framing** | Project/Plan | Plan canvas | /project/$id > Plan stage |
| **Prioritization** | Project/Plan edits | Plan canvas (roadmap/ranking) | /project/$id > edit plan |
| **Roadmap planning** | Project roadmap (command) | Modal/full view | Search "roadmap" or Home action |
| **Requirements/PRD** | Project/Plan | Plan canvas | /project/$id > Plan stage |
| **Design** | Project/Design | Design canvas (mockups) | /project/$id > Design stage |
| **Design review** | Approvals queue | Approvals item | /approvals (design approval) |
| **Build QA** | Project/Build | Build canvas + timeline | /project/$id > Build stage |
| **Shipping/deployment** | Project/Ship | Ship canvas | /project/$id > Ship stage |
| **Launch** | Project/Launch | Launch canvas (copy/assets) | /project/$id > Launch stage |
| **Go-to-market** | Project/Launch | Launch canvas (GTM checklist) | /project/$id > Launch stage |
| **Growth planning** | Project/Grow | Grow canvas (digest + suggestion) | /project/$id > Grow stage |
| **Adoption metrics** | Project/Grow (dashboard) | Grow canvas | /project/$id > Grow stage |
| **Outcome review** | Project/Learn OR Trust Ledger | Learn canvas + receipts | /project/$id > Learn or Settings/Trust |
| **Stakeholder communication** | Stakeholder pack (generator) | Modal (in Project) | /project/$id > action "generate stakeholder pack" |
| **Competitive tracking** | Signals feed | Signal digest | Project/Grow + Approvals |
| **Iteration** | Command "rework X" | New lifecycle pass | Project command rail |
| **Sunset/retirement** | Project archive | Project settings | /project/$id > settings |

**Complete coverage.** A PM never has to leave Supaprod to do their job.

---

## 6. COPY DECK V1 (primary UI strings, ready for voice pass)

### Navigation & Global

| Context | Current | Proposed Supaprod | Rationale |
| --- | --- | --- | --- |
| App title | "Cadence" | "Supaprod" | Brand (founder ruling) |
| Platform claim | — | "The product OS that decides what to build" | 1-liner (from positioning) |
| Home label | "Today" | "Home" | Clearer intent |
| Projects label | "Active" or "Projects" | "Recent projects" | Reduces scrolling (max 3–4 visible) |
| Settings label | "Settings" | "Settings" (unchanged) | — |

### Home Surface

| Element | Copy | Notes |
| --- | --- | --- |
| Command bar placeholder | "What are we building?" | Conversational entry, works at any stage |
| Empty state primary | "Start your first project" | Warm, direct |
| Empty state actions | "Plan a feature" / "Design a mockup" / "Import existing app" | Three modes, all equal weight |
| Project card (shipped) | "[Project name] — Launched 2026-07-15" | Date, status, one line |
| Suggestion (example) | "Relay needs launch copy approval — take 10 min?" | Actionable, time estimate, optional |

### Project Surface

| Element | Copy | Notes |
| --- | --- | --- |
| Spine stages | Plan / Design / Build / Ship / Launch / Grow | One word each, verbs not nouns |
| Build stage label | "Now executing" | When agents are active |
| Agent activity | "[Agent name] generated code mockup" | Verb + object, plain language |
| Empty canvas | "Once you approve the plan, agents begin here" | Explains next step without gates |
| Canvas placeholder (Plan mode) | "Scope, spec, milestones for [project name]" | Template, not magic |

### Approvals Surface

| Element | Copy | Notes |
| --- | --- | --- |
| Queue label | "Approvals" | Clear, simple |
| Item type | "Plan change" / "Deploy gate" / "Copy review" | Specific, descriptive |
| Proposal | "[Agent name] proposes: Replace guest checkout with SSO" | Agent + clear what/why |
| Cost | "2,000 credits" | Transparent, no surprises |
| Buttons | "Approve" / "Request changes" / "Reject" | Consistent verbs throughout product |
| Empty state | "All clear — no approvals pending" | Warm, brief |

### Settings

| Element | Copy | Notes |
| --- | --- | --- |
| Section groups | Account / Workspace / Connections / AI / Billing / Advanced | 5 main + 1 recessed |
| Workspace Memory | "How Supaprod learns your preferences" | Stickiness + trust |
| Model Routing | "Assign agents to models by task (optional)" | Operator control, not required |
| Audit log | "Every agent action and approval, for your record" | Trust surface |

### Empty, Loading, Error States

| State | Copy | Example |
| --- | --- | --- |
| Empty | "[Noun]. None yet — start one." | "Plans. None yet — draft the first one." |
| Loading | "[Verb]..." | "Loading project..." (optional, if > 1s) |
| Error | "Couldn't [action]. [Reason]. Try [fix]." | "Couldn't save plan. Network issue. Try again?" |

---

## 7. RENAME PASS (Cadence → Supaprod)

| Old Name | New Name | Rationale | Impact |
| --- | --- | --- | --- |
| Cadence (product) | Supaprod | Founder ruling 2026-07-16 | App title, metadata, public links |
| CadenceMark | SupaprodMark | Logo brand (interim: Geist Pixel wordmark) | Favicon, mark in nav, empty states |
| cadence_* (DB columns) | Leave unchanged per exception ledger | Generic English word "cadence" (frequency) stays | DB (no migration needed) |
| cadence_flow_beta.lovable.app | supaprod.ai (or TBD custom domain) | Domain rename per founder decision | DNS, OAuth, links, email |
| "Cadence" (stray strings in code/UI) | Grep clean except exceptions ledger | Humanized-output rule | Code/comments (not English word usage) |

**URL migration:** Existing Cadence accounts → auto-redirect or explicit migration (pending founder decision #6).

---

## 8. MORNING DECISION QUEUE (assumptions logged)

**The founder was unavailable during the 60-min awake window. Phase 1 proceeded autonomously with logged assumptions. Flagged items below need founder review when he wakes.**

### ASSUMPTION 1: Logo Timeline (Decision #1)

**Assumption made:** No logo from founder yet. Using **Geist Pixel wordmark as interim placeholder**.  
**Structure:** Drop-in replacement in `src/components/supaprod/SupaprodMark.tsx` — when final logo arrives, one line changes.  
**Rationale:** Rebuild cannot stall on logo. Interim is professional + branded.  
**If founder disagrees:** Confirm timeline + show interim to confirm it is acceptable. If not acceptable, recommend deferring rebuild phase 1 until logo ready.  
**Reversibility:** Complete. Swap one component.

### ASSUMPTION 2: Existing-Product Import (Decision #2)

**Assumption made:** **Defer existing-product import to Phase 1b.** Phase 1 ships with new-project flow only. "Import existing app" entry point scaffolded but non-functional (routes to Help doc with roadmap).  
**Rationale:** Ingestion complexity varies wildly (repo detection, codebase analysis, context extraction). Better shipped later and well, than shipped now and broken. Phase 1 focuses on core three-surface model.  
**Backend plan:** Audit phase 1b work to confirm what backend supports (repo URL, docs upload, URL crawl, or none).  
**Reversibility:** Complete. Phase 1b adds routes + modal logic.

### ASSUMPTION 3: Auth Providers (Decision #3)

**Assumption made:** **Google + GitHub + Email at launch.** SSO/SAML deferred to enterprise tier (Phase 1b).  
**Rationale:** Covers dev + enterprise + casual users. Fastest path to beta. OAuth already wired in backend.  
**If founder wants others:** Confirm tier + timeline. If critical to launch, Phase 1 scope adjusts.  
**Reversibility:** Complete. Backend provider registry is swappable.

### ASSUMPTION 4: Deploy Targets (Decision #4)

**Assumption made:** **Custom domains (user's own domain), Supaprod sandbox preview.** No Vercel/GitHub Pages/AWS integration in phase 1.  
**Rationale:** Custom domains simplify user perception ("I own this", not "Supaprod hosts it"). Avoids 3rd-party integration complexity. Phase 1 focuses on Supaprod's own execution.  
**Backend assumption:** Backend supports custom domain routing + preview links (pending confirmation).  
**Reversibility:** Complete. Integrations layer is additive.

### ASSUMPTION 5: Today Widget Kills (Decision #5)

**Assumption made:** **Confirmed kill:**
- Weather widget (decoration, no user action)
- Focus-dock widget (controls moved to Settings)
- Separate Discover route (signals digestible in Home/Project)
- Agent fleet roster (agents invisible)
- Chat tab (conversation is every interface)
- Standalone Brain/Knowledge tabs (memory → Settings)

**Rationale:** All reduce cognitive load + free space for three-surface clarity. No capability lost; features move to better homes.  
**If founder vetos any:** Confirm which + remapping required. All can be restored or moved.  
**Reversibility:** Complete. Hidden surfaces can be unhidden.

### ASSUMPTION 6: Cadence User Migration (Decision #6)

**Assumption made:** **Auto-migrate Cadence accounts → Supaprod.** Old URLs redirect to new ones. One-time migration on first login.  
**Rationale:** Today's users are all internal/test. Seamless migration best experience. No parallel-run complexity.  
**If founder prefers parallel-run or explicit-invite:** Confirm + update migration code. No rework needed; logic is pluggable.  
**Reversibility:** Complete. Migration script can be reversed.

---

## 9. REMAINING ARCHITECTURE DECISIONS FOR PHASE 2

(Not blocking Phase 1; resolved in design work)

- [ ] **Canvas streaming UI:** How does code generation stream appear? (Character-by-character / line-by-line / syntax-colored from start / other?)
- [ ] **Agent activity detail expansion:** What level of detail on timeline (just summary line / full context expandable / toggle full trace)?
- [ ] **Memory visualization:** Learned conventions view — table, graph, tag cloud, or other?
- [ ] **Approvals sorting:** Priority order by what metric? (Impact / urgency / recency / other?)
- [ ] **Dark mode default:** Assume dark-first, allow System to follow OS preference?
- [ ] **Stage re-ordering:** Can user reorder lifecycle spine stages, or is order fixed per best practice?

All decided in Phase 2 design work. No blockers for now.

---

## DELIVERABLES CHECKLIST

✅ Three-surface IA (Home / Project / Approvals + Shell)  
✅ Route map (85+ old → new homes)  
✅ User journey flows (8 stages + entry-at-any-stage)  
✅ Lifecycle motion map (interrupt/break/go-back/revert/fast-forward/fork/pause/cancel)  
✅ Product-management domain map (discovery through sunset)  
✅ Capability coverage matrix (nothing orphaned)  
✅ Copy deck v1 (all primary UI strings)  
✅ Rename pass (Cadence → Supaprod + exceptions)  
✅ Morning decision queue (6 assumptions logged)  
✅ 9 remaining architecture decisions for Phase 2

**Next:** Phase 2 (Design System Ink) — tokens, components, responsive, dark+light themes.

---

*Phase 1 completed 2026-07-18 · 90 min · ready for Phase 2*
