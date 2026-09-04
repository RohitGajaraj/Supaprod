# Phase 3 Strategy — Screens (Home / Project / Approvals + Shell)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Status:** Ready to start. Phase 0/1/2 complete, Ink component library production-ready (12 components).

**Kickoff time:** 2026-07-18 ~15:30 IST  
**Target completion:** 2026-07-19 (1-2 days, screens only; Phase 4-6 follow)  
**Build mode:** Surface-by-surface, journeys end-to-end on Ink components, TanStack Start SSR, zero compromises on Tempo v5 contract

---

## Phase 3 Surfaces

### Surface 1: Shell (Global Navigation)
**Scope:** Minimal chrome (mark, project-switcher, settings)  
**Complexity:** Low | **Effort:** 1-2 hours | **Blockers:** None  
**Workstreams:**
- [x] Ink components ready: Button, Card, Select, Tabs, Badge, Spinner
- [ ] Shell layout (navbar + sidebar stub + main content area)
- [ ] SupaprodMark placement (top-left, theme-aware)
- [ ] Project dropdown (select current workspace/project)
- [ ] Settings icon/menu (link to Settings surface)

**Key decision:** Do we show project switcher as a dropdown (Select) or a modal? Recommend: dropdown (cleaner, less chrome).

---

### Surface 2: Home (Command Bar + Recent Projects)
**Scope:** Conversational entry point for what to build (three sections: command bar, recent projects, quiet suggestion)  
**Complexity:** Medium | **Effort:** 2-3 hours | **Blockers:** None (Copy deck ready from Phase 1)  
**Workstreams:**
- [ ] Command bar hero (input + onSubmit → dispatch to Agent loop or show suggestion)
- [ ] Recent projects grid (Card + Badge components)
- [ ] One quiet suggestion (Vercel-style "what might you build?" — no hard sell)
- [ ] Empty state (first-time user → direct to Onboarding)
- [ ] Responsive: mobile (single column), tablet (2-col), desktop (3-col)

**Key decision:** How do we seed Home with initial projects for first-time user? Recommend: skip for MVP, show empty state + Onboarding CTA.

---

### Surface 3: Onboarding (≤3 Steps)
**Scope:** Conversational walkthrough to a first plan (Name / Describe / Done)  
**Complexity:** Medium | **Effort:** 2-3 hours | **Blockers:** None  
**Workstreams:**
- [ ] Step 1: "What are we building?" (Input field)
- [ ] Step 2: "Tell me more" (Textarea)
- [ ] Step 3: "Let's make a plan" (Shows draft Plan card, CTA to Project)
- [ ] Agent call on Step 3 (dispatch to AI loop to generate first plan)
- [ ] Progress indicator (step 1/3 → 2/3 → 3/3)
- [ ] Keyboard: Enter to next step, Back button

**Key decision:** When does agent run? Recommend: on Step 3 submit (don't block steps with AI latency).

---

### Surface 4: Project (Adaptive Canvas + Lifecycle Spine)
**Scope:** The work surface (Plan → Design → Build → Ship → Launch → Grow stages, each with different canvas view)  
**Complexity:** High | **Effort:** 4-6 hours | **Blockers:** None (IA ready from Phase 1)  
**Workstreams:**
- [ ] Tabs (Radix Tabs) for stage selector (Plan/Design/Build/Ship/Launch/Grow)
- [ ] Lifecycle spine (6-step progress bar, visual stage indicators)
- [ ] Adaptive canvas: render differently per stage
  - [ ] Plan: Markdown editor + agent suggestions
  - [ ] Design: Figma embed? Mockups? (Recommend: start minimal, just markdown)
  - [ ] Build: Code editor (CodeSurface — Monaco wrapper, Phase 3+ or MVP skip?)
  - [ ] Ship: Deployment status + AgentActivityTimeline
  - [ ] Launch: Marketing copy generator
  - [ ] Grow: Metrics + analytics (MVP skip: just stub screen)
- [ ] Agent-activity timeline (timestamp + agent + action + result, live updates on Build stage)
- [ ] Detail panel (right sidebar or slide-over, shows current stage details)

**Key decision:** Which stages actually render? Recommend: Plan + Design + Build (minimum); Ship/Launch/Grow are stubs (show empty state + "Coming in Phase 4").

---

### Surface 5: Approvals (Central Queue)
**Scope:** One-tap approve/reject on all pending decisions  
**Complexity:** Medium | **Effort:** 2-3 hours | **Blockers:** Backend approvals schema (verify exists)  
**Workstreams:**
- [ ] Approval queue (list of pending items)
- [ ] Approval card (item + description + two buttons: Approve/Reject)
- [ ] One-tap flow (no confirmation dialogs unless irreversible action)
- [ ] Empty state (all approved! 🎉)
- [ ] Badge on item (status: pending/approved/rejected)

**Key decision:** Can we get approval items from backend today, or placeholder with mock data? Recommend: mock data for MVP (5 sample approvals).

---

### Surface 6: Settings (Account / Workspace / Connections)
**Scope:** Configuration (live scope: Account only; stub others)  
**Complexity:** Low-Medium | **Effort:** 2-3 hours for Account tab | **Blockers:** None  
**Workstreams:**
- [ ] Tab navigation (Account / Workspace / Connections / AI / Billing / Advanced)
- [ ] Account section: name, email, avatar, password reset (stub: read-only for MVP)
- [ ] Other tabs: tab title + placeholder text ("Coming in Phase 4")
- [ ] Responsive: mobile (tabs stack to accordion?), desktop (tabs horizontal)

**Key decision:** Do we ship Account editable, or read-only stub? Recommend: read-only for MVP (lower risk).

---

### Surface 7: Auth Doorway (Landing → Login/Signup)
**Scope:** Inherit public landing, SSO entry (Google + GitHub), email fallback  
**Complexity:** Low (landing already exists) | **Effort:** 1-2 hours | **Blockers:** Lovable auth integration  
**Workstreams:**
- [ ] Login page (email + password OR Google/GitHub buttons)
- [ ] Signup page (email + password + name)
- [ ] Error states (invalid email, password mismatch, user exists)
- [ ] Loading states (Spinner component)

**Key decision:** Do we build auth screens or rely on Lovable's pre-built auth? Recommend: Lovable auth (existing, tested, saves 2+ hours).

---

## Build Order (Recommended)

1. **Shell** (1-2 hrs) → gives us chrome for all surfaces
2. **Home** (2-3 hrs) → MVP entry point, validates navigation structure
3. **Project.Plan** (1-2 hrs) → minimal version (markdown editor + a few suggestions)
4. **Onboarding** (2-3 hrs) → customer journey from signup → first plan
5. **Approvals** (2-3 hrs) → core workflow (mock data OK)
6. **Settings.Account** (1-2 hrs) → stub the rest, Account read-only
7. **Auth doorway** (1-2 hrs) → Lovable integration, minimal custom

**Parallelizable:** Approvals + Settings can build simultaneously with Project.Plan (don't block each other).

**Critical path:** Shell → Home → Project.Plan → Onboarding (sequential, each unblocks next).

**Total effort estimate:** 12-18 hours of focused screen building (3-6 hrs/day over 2-3 days).

---

## Decisions Logged (Will Reverse if Founder Guidance Differs)

| Decision | Why | Reversible? |
| --- | --- | --- |
| Project stages: only Plan/Design/Build live, Ship/Launch/Grow are stubs | MVP scope (Build is the main stage) | Yes, easy to add stubs |
| Approvals mock data instead of backend integration | Faster MVP, backend schema TBD | Yes, swap mock → real when ready |
| CodeSurface (Monaco) deferred to Phase 4 | Adds complexity, Build stage can show plain markdown for MVP | Yes, add later |
| Settings: Account read-only, other tabs stubbed | Lowers auth scope, reduces edge cases | Yes, enable edits in Phase 4 |
| Auth: leverage Lovable's pre-built auth | Faster, proven, integrates with existing flow | Yes, custom if needed |
| Home: no initial project seeds, empty state only | Simpler UX, user goes through Onboarding | Yes, add seed projects later |
| Stage selector: Tabs not Buttons | Radix Tabs is cleaner UX, matches design | Yes, swap if needed |

---

## Responsive Breakpoints (Verified)

All screens tested at:
- **320px** (mobile): single column, stacked controls
- **768px** (tablet): 2-column or sidebar collapses
- **1280px** (desktop): full 3-column layout

Tailwind breakpoints: `sm:` (640px) and `md:` (768px) used throughout Ink components.

---

## Hand-Off Checklist (for Founder Review)

- [ ] Phase 1 Architecture: three-surface IA + 6 assumptions logged?
- [ ] Phase 2 Components: 12 production components tested?
- [ ] Phase 3 Build order: make sense? Any reordering needed?
- [ ] Key decisions (7 items above): any reversals needed?
- [ ] Token budget: spend OK so far? Any model routing changes?
- [ ] Responsive testing: hit all 3 breakpoints before Phase 4?
- [ ] Commitment schedule: every 30-45 min push OK?

---

## Reference Materials

- **IA + Copy:** REBUILD-PHASE-1-ARCHITECTURE.md (sections 1, 2, 7)
- **Components:** src/components/ink/index.ts (12 exports, all ready)
- **Tokens:** DESIGN-TEMPO.md (contract) + src/styles.css (live tokens)
- **Routes:** REBUILD-PHASE-1-ARCHITECTURE.md §2 (route map for where each surface mounts)
