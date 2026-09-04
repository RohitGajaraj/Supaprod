# Design Audit: Plan Station

> _Created: 2026-08-01 · Last updated: 2026-08-01_

## Specification & Scope — From Power-User & Enterprise Lens

> **Context**: Plan is where approved bets (from Decide) become detailed, scoped specifications ready for Design/Build handoff. The PM's job here is ONE: **turn a bet with evidence into a detailed spec with acceptance criteria, constraints, success metrics, and design/build estimates**.
>
> **Session**: 2026-08-01 Design Phase · Conducted from: head-of-digital-product lens (Stripe / Google / Vercel precedent)
>
> **Current state**: Plan surface exists but is underdeveloped. No visible connection to original bet evidence. Scope negotiations happen outside the platform (Slack, email).

---

## Executive Summary: What's Right & What's Missing

### ✅ What Plan Gets (Partially) Right
1. **Spec document editing** — Can write acceptance criteria, constraints, scope
2. **Brief alignment** — Can link to related features/products (cross-impact awareness)
3. **PRD template** — Structure exists (problem, goal, user, acceptance criteria, success metrics)

### ⚠️ Critical Gaps (Make Plan Unusable Without External Tools)

1. **Origin bet is invisible** — PM writes spec with no visible link to "this came from Discover bet #47"
2. **Evidence is not carried forward** — Customer quotes from Discover don't appear in Plan; PM writes spec blind
3. **Critic's concerns are not visible** — If Critic flagged "scope too broad," Plan should show that warning, but doesn't
4. **No scope negotiation UI** — "This scope is too much for the sprint, can we cut X?" has no home; happens in Slack
5. **No cross-product impact preview** — Spec doesn't show "this overlaps with 3 other in-flight bets"
6. **Success metrics are text, not measurable** — Written as prose, no link to how Learn will record outcomes
7. **Design/Build estimate is missing** — No way to gauge "is this 1 week or 4 weeks of work?"
8. **No acceptance criteria review gate** — Spec can be written poorly and nobody catches it before handoff to Design
9. **No feedback loop from Design** — If Designer finds "this won't work," it stays stuck; no path to escalate back to Plan/Decide
10. **Agent role is invisible** — Scribe drafts specs, but user doesn't know what the agent did vs. what the human edited

---

## Part 1: What Plan Actually Needs to Do

### The Spec's Job
A spec is the **contract between what we decided (in Decide) and what we're going to build (in Design/Build)**.

**What must flow INTO Plan**:
- Approved bet from Decide (title, problem statement, evidence)
- Critic's concerns ("watch out for X", "scope might be too broad")
- Prior precedent (what did similar bets look like? how long did they take?)
- Constraints (technical, design, business: "must work on mobile", "< 1 week timeline", "on-device only")

**What gets WRITTEN in Plan**:
- Detailed problem statement (refined from Decide)
- User story (who, what, why) per use case
- Acceptance criteria (pass/fail tests, not "be inviting")
- Out-of-scope (explicitly what's NOT in this bet)
- Success metrics (how we measure "did this work")
- Design/build estimate (T-shirt size or days)
- Dependencies (what else must land first)
- Risks (what could go wrong)

**What flows OUT to Design**:
- Spec document (readable by designer, not just PM)
- Acceptance criteria linked to user stories
- Design constraints ("must work on dark mode", "accessibility WCAG 2.2")
- Reference designs (similar products handled this how?)
- Success metrics (designer knows what "good" means)

**What flows OUT to Build**:
- Same spec + technical acceptance criteria
- Estimate confirmed (is 1 week realistic?)
- Dependencies visible (what must ship before this)
- Rollback plan (if this breaks, what do we do?)

**What loops BACK to Learn**:
- Success metrics in measurable form (not "users like it" but "+8% retention")
- Outcome recording instructions (automated? manual? when?)
- Acceptance criteria linked to outcome validation (does outcome match what we spec'd?)

---

## Part 2: Deep Dive — What Each Element Should Show

### A. The Spec Header & Origin (top of page)

**Current**: Blank. No indication of which bet this spec came from.

**What it needs**:
```
🎯 Spec for: "Onboarding flow needs friction reduction" [Link to Decide]
  Bet ID: opp-23456
  Status in bet: Approved (Critic confidence: 87%)
  Evidence backing this: 12 signals from 3 sources (support, research, analytics)
  
Critic's red-team concerns:
  ⚠️ "Scope might be too broad — consider: just mobile, or just first 5 steps?"
  ⚠️ "Metrics need clarity — what's 'inviting'? Measure time to signup? Abandon rate?"
  
Prior similar bets:
  ✓ "Improve signup UX" (2 months ago) — took 1 week design, 2 weeks build, validated (+8% conversion)
  [View that spec]

Timeline goal: 1 week design + 2 weeks build (based on precedent)
Estimate confidence: Medium (similar scope to prior bet, but mobile adds complexity)
```

**Why this matters**:
- PM writes spec with the original evidence visible (not from memory)
- Designer sees Critic's concerns and scope suggestions (avoid broad misalignment later)
- Both can see "similar bet took 3 weeks, let's plan for 3-4 this time"
- Traceability: spec is explicitly linked to the decision that justified it

### B. The Problem Statement (refined from Decide)

**Current**: Can be edited but static. No "regenerate" option.

**What it needs**:
```
Problem statement (editable, AI-generated initially)
  "Users perceive signup flow as cold and corporate, causing 12% step abandonment
   in the mobile app. Evidence: support feedback (7), user research (3), analytics (2)."
  
  [Edit ✏️] [Regenerate from evidence 🔄] [Save]
  
Problem frame (helps scope):
  Who: Users on mobile during signup
  What: "Cold, corporate" feeling → what specifically? (no warmth? no progress feeling? confusing fields?)
  Impact: 12% abandonment vs. industry benchmark of 8%
  Why now: Three high-value customer exits this month cited "painful onboarding"
  
Success boundary (what solves the problem):
  ✓ Would solve: Users feel the flow is inviting and personal
  ✓ Would solve: Signup time is < 2 minutes (was 5)
  ✗ Would NOT solve: Users who don't understand the product value (different problem)
  ✗ Would NOT solve: Users on slow networks (different problem)
```

**Why this matters**:
- Problem is sharp and specific (not "make it better")
- Designer can see the SCOPE boundaries (what's in, what's out)
- Team aligns on success definition BEFORE design (avoid building the wrong thing)
- Criticisms become refinement opportunities, not surprises later

### C. The User Stories & Acceptance Criteria

**Current**: Can be written but no structure or review gate.

**What it needs**:
```
User Story 1: Mobile signup feeling
As a: New user on mobile
I want to: Feel the signup process is warm and personal, not corporate
So that: I feel welcomed and trust the product

Acceptance criteria (pass/fail tests, not fuzzy goals):
  ☐ Progress bar visible after step 1 (shows "3 of 5")
  ☐ Personalization field shown by step 2 (name, role, goal)
  ☐ Success page shows personalized message ("Hey Sarah, you're all set to...")
  ☐ Signup time < 2 min for experienced users (measured: median of 100 test users)
  ☐ Works on iPhone 12, Android 12+ (screen sizes 375px-480px)
  ☐ Passes WCAG 2.2 AA contrast ratio (all text readable)
  ☐ Keyboard navigation works end-to-end (Tab through every field)

Design review gate: ☐ Designer confirms these are achievable with current design system

Build review gate: ☐ Engineer confirms estimates: 1 week design, 2 weeks build (based on component complexity)

---

User Story 2: Completion feeling
As a: New user who finished signup
I want to: Know what to do next
So that: I don't feel lost after onboarding

Acceptance criteria (pass/fail):
  ☐ Dashboard loads within 3 sec (measured: 95th percentile)
  ☐ First 3 suggested actions visible (no scroll, above fold)
  ☐ CTA button "Start exploring" is obvious and clickable
  ☐ Mobile: button takes full width, easy tap target (48px minimum)
  
[Add more user stories...]

Out-of-scope (explicitly excluded from this bet):
  ✗ Advanced personalization (that's a separate Q3 bet)
  ✗ Email/SMS onboarding (that's Learn phase, separate track)
  ✗ Admin workflow changes (out of scope, consider future bet)
```

**Why this matters**:
- Designer has a checklist of what "done" looks like (not subjective)
- Build team can estimate story by story (and flag scope if too big)
- Learn team knows exactly how to test success (the acceptance criteria become test cases)
- Spec can't silently expand scope (everything not listed is out-of-scope)

### D. The Success Metrics (Measurable, Linked to Learn)

**Current**: Written as text, no link to how Learn will measure outcomes.

**What it needs**:
```
Success metrics (linked to Learn outcome recording):

Primary metric (must improve):
  → Signup completion rate: baseline 75%, target 85% (+10 percentage points)
    How measured: Count(completions) / Count(starts), mobile only
    Measurement window: First 30 days post-launch
    How Learn will record: Automated query to analytics table
    Owner: Product analytics team

Secondary metrics (should improve):
  → Signup time: baseline 5 min median, target 2 min median (-60%)
    How measured: time_started to time_completed, 50th percentile
    Measurement window: First 30 days
    How Learn will record: Automated query to analytics table
  
  → User survey (NPS for signup experience): baseline TBD, target > 50
    How measured: Post-signup survey to 100+ respondents
    Measurement window: Weeks 1-4 post-launch
    How Learn will record: Manual survey of cohort

Guardrail metrics (must not regress):
  → Signup start rate: must not drop below baseline (risk: new flow discourages signup clicks)
    Baseline: X starts/day
    Threshold for rollback: < 80% of baseline for 2 consecutive days
    How Learn will monitor: Daily alerts

  → Support tickets mentioning "signup": must not increase > 10% YoY
    Baseline: 50/week
    Threshold for escalation: > 55/week
    How Learn will monitor: Automated alerting

Success verdict logic (how Learn records "validated/missed/mixed"):
  → VALIDATED: Primary metric (completion rate) hits target AND no guardrail breaches
  → MIXED: Primary hits but secondary misses, OR one guardrail slight breach (< 15%)
  → MISSED: Primary misses by > 5 points, OR any guardrail major breach
  → SUPERSEDED: Rolled back before measurement window (e.g., caused critical bugs)
```

**Why this matters**:
- Designer/Build know what "good" means (not subjective)
- Learn team has explicit measurement instructions (no ambiguity)
- Outcome recording is predetermined (no judgment call on "was this validated?")
- Guardrails prevent ship of "technically correct but breaks something else"
- Loop closes: Learn's verdict feeds back to future Discover (similar bets ranked higher if validated before)

### E. Design Constraints & Handoff (to Design station)

**Current**: No structure. Designer gets spec but doesn't know what Design systems to use, accessibility must-haves, etc.

**What it needs**:
```
For the Designer (Design Station handoff):

Design system tokens & components required:
  🎨 Typography: Use Geist Sans (all UI text)
  🎨 Colors: accent color (ember #FF6B2C) max 1 spot, must pass WCAG AA contrast
  🎨 Spacing: Use 8px grid (no custom padding)
  🎨 Components: Button (primary/secondary), Form input, Progress bar
               Link to component library: [Design system Figma]

Accessibility requirements (WCAG 2.2 AA):
  ♿ Color contrast: all text >= 4.5:1 (normal), >= 3:1 (large)
  ♿ Keyboard nav: tab order visible, focus indicator visible
  ♿ Screen reader: all form labels <label> linked to inputs
  ♿ Mobile: touch targets >= 48px × 48px (button, link, input)
  ♿ Motion: animations < 3 sec, no flashing > 3 Hz (seizure safe)
  [Accessibility testing checklist attached]

Mobile-first design (primary device):
  📱 Start design for iPhone 12 (390px width)
  📱 Responsive test at: 375px (SE), 480px (large), 768px (tablet)
  📱 Portrait orientation primary (landscape secondary)

Dark mode required:
  🌙 Design works in both light and dark (system preference auto-switches)
  🌙 Use token swaps, not custom color values
  🌙 Test contrast ratios in both modes

Reference designs (how others solved similar problems):
  🔍 Stripe's account onboarding: [screenshot/link]
     Why they did X: [learning]
  🔍 Vercel's project creation: [screenshot/link]
     Why they did Y: [learning]
  🔍 Figma's editor onboarding: [screenshot/link]
     Why they did Z: [learning]

Design review gate before Build:
  ☐ Designer confirms: All acceptance criteria are achievable
  ☐ Designer confirms: Accessibility audit passed (WCAG AA)
  ☐ Designer confirms: Mobile-responsive (tested 3 breakpoints)
  ☐ Designer confirms: Dark mode works (tested both themes)
  ☐ Build estimate confirmed: 2 weeks (vs. spec estimate of 2 weeks) ✓ aligned
```

**Why this matters**:
- Designer doesn't invent (knows tokens, components, accessibility rules upfront)
- Build estimates confirmed or escalated before design starts (no surprises at handoff)
- Acceptance criteria are achievable (designer has already reviewed them as feasible)
- Reference designs prevent wheel-reinvention (we know how Stripe did it)

### F. Build Handoff (to Build station)

**Current**: No structure. Build gets design but doesn't know success metrics, rollback plan, etc.

**What it needs**:
```
For the Build Team (Build Station handoff):

Build estimate & timeline:
  ⏱️ Design refinement: 1 week (parallel with design polish)
  ⏱️ Implementation: 2 weeks
  ⏱️ QA & polish: 3 days
  ⏱️ Staging validation: 2 days
  ⏱️ Total: 3 weeks (est.) vs. 3 weeks (plan) ✓ ALIGNED
  
  Risk: "Mobile responsiveness testing could slip," mitigation: start early

Build acceptance criteria (pass/fail for QA):
  (Same as in "User Stories & Acceptance Criteria" section, but linked here for Build team)
  
  Technical acceptance (Build team owns):
  ☐ Zero console errors on all supported browsers (Chrome, Safari, Firefox)
  ☐ Mobile: tested on iPhone 12, Pixel 6 physical devices (not just simulators)
  ☐ Accessibility audit: WCAG AA, 0 violations (use axe-core automated + manual spot-check)
  ☐ Performance: Lighthouse score >= 80 (mobile), >= 90 (desktop)
  ☐ Load time: 95th percentile < 3 sec (same network conditions as production)
  ☐ Form validation: all fields reject invalid input with clear error messages
  ☐ API errors: user sees helpful message, not error code
  ☐ Dark mode: tested and works, no hardcoded colors
  ☐ Keyboard nav: full form completion without mouse
  
  Deployment readiness:
  ☐ Code review (peer + tech lead)
  ☐ All tests green (unit, integration, e2e)
  ☐ Database migrations tested (if any)
  ☐ Monitoring/alerts configured (for success metrics)
  ☐ Rollback procedure documented and tested

Rollback plan (if this breaks something):
  🔴 Rollback criteria: "Signup start rate drops > 20%" OR "Error rate > 0.5%"
  🔴 Rollback time: < 15 minutes (same-day, no waiting)
  🔴 Rollback procedure: git revert [commit], deploy, verify metrics
  🔴 Communication: notify Product + Support within 5 min of rollback decision
  🔴 Post-rollback: debug & fix, re-plan launch

Dependencies (what must ship first):
  ✓ Auth service upgrade (shipped in v2.4)
  ✓ Analytics tracking events (to be added in this sprint for signup flow)
  ⚠️ Mobile-only feature flag (must create flag before code review)

Tech stack & patterns:
  🛠️ Frontend: React, use existing signup form component from design system
  🛠️ Validation: Use form library [X], validate client + server
  🛠️ Analytics: Track events: signup_started, step_1_completed, ... signup_completed
  🛠️ Error handling: User-friendly messages, log to Sentry
  🛠️ Dark mode: Leverage existing token system (no custom colors)
```

**Why this matters**:
- Build team knows exactly what success means (not vague)
- Build estimates are pre-confirmed against design (no surprise scope)
- Rollback plan is predetermined (not figured out during incident)
- Monitoring is planned (Learn team knows where to find metrics)
- Tech stack is aligned (no "should we use X or Y" debate)

### G. The Feedback Loop Back to Plan/Decide (if Design/Build finds issues)

**Current**: No home for "this scope is unrealistic" or "we can't achieve X in 1 week"

**What it needs**:
```
Escalation paths (if Design/Build find problems):

⚠️ Design finds: "Success metric 'signup time < 2 min' is unrealistic on 3G mobile"
  Path 1: Refine metric (adjust target: < 3 min on 3G)
    Owner: Plan PM + Designer
    Approval: Decide PM (metric was their success criteria)
  Path 2: Descope feature (remove step 2 personalization if it slows signup)
    Owner: Decide PM (requires re-approval of bet scope)
    Impact: Marked on spec, recorded in decision log

🔴 Build finds: "Scope is 2 weeks work, not 1 week. 3-week sprint is too tight."
  Path: Escalate to Plan PM
    Decision: Slip launch by 1 week? OR cut a feature? OR add resources?
    Record: Estimate revision in spec, decision in audit log

🔴 Build finds: "This conflicts with other in-flight bet (search redesign). Can't ship both in same sprint."
  Path: Escalate to Decide PM (resource conflict)
    Decision: Sequence the bets? OR allocate more engineers? OR defer one?
    Record: Cross-impact marked in both specs

Spec status field (tracks lifecycle):
  🟢 DRAFT: being written by PM
  🟢 DESIGN_REVIEW: sent to Designer for feasibility check
  🟡 AWAITING_APPROVAL: awaiting Plan PM or Decide PM approval
  🟡 BUILD_ASSIGNED: Build team has reviewed, estimates confirmed
  🟢 ACTIVE: currently being built
  ✅ SHIPPED: code deployed to production
  🔄 SUPERSEDED: [reason]: replaced by new bet (e.g., "better approach discovered")
  ❌ DROPPED: [reason]: cancelled mid-way (e.g., "resource conflict")
```

**Why this matters**:
- Issues route to the right person (not stuck in Slack)
- Decisions are recorded (audit trail)
- Both Design and Build can escalate, not just PM-driven top-down
- Scope can be renegotiated or refined without restarting the whole process

---

## Part 3: Enterprise Workflows & Missing Paths

### Workflow 1: "Is this scope realistic?" (Gap: Early Design Review)

**Current**: PM writes spec alone, sends to Designer who says "too much" 2 weeks in.

**Better path**:
1. PM drafts spec with evidence
2. Designer does 30-min "feasibility spike" review (is this achievable in ~2 weeks?)
3. Designer suggests scope refinements ("move personalization to v2")
4. PM refines spec
5. Both sign off before Build even starts

**Design spec**:
- Add "Design review gate" checkbox on spec
- Designer must confirm "feasible" before Build starts
- Store designer's feedback inline on spec (not in separate Slack thread)

---

### Workflow 2: "How should we measure success?" (Gap: Success Metric Co-ownership)

**Current**: PM writes success metrics alone, Build discovers later "we can't measure X"

**Better path**:
1. PM proposes success metrics (based on evidence from Discover)
2. Analytics team reviews (can we measure this? which events exist?)
3. Learn team reviews (how do we record "validated"?)
4. All agree on metric + measurement method before Build ships

**Design spec**:
- Success metrics have a "review" stage
- Analytics + Learn can comment/refine inline
- Metric is "locked" only when all stakeholders agree

---

### Workflow 3: "What if we discover the scope is wrong mid-build?" (Gap: Scope Renegotiation)

**Current**: Build starts, discovers "we underestimated," PM is on vacation, decision stalls.

**Better path**:
1. Build flags estimate revision on spec (flag: "SCOPE RISK")
2. Plan PM gets automated notification
3. Decision choices are explicit: "slip launch 1 week", "cut feature X", "add resources"
4. Decision is recorded with owner + timestamp
5. Spec updates, Learn is notified (success metrics may change)

**Design spec**:
- Spec has a "scope renegotiation" section (appears only if flagged)
- Decisions are one-click (not open-ended discussion)
- Audit trail is permanent (can't revise history)

---

## Part 4: Loop Integrity for Plan

### Information Flow IN to Plan (from Decide)
```
✓ Bet title, problem statement
✓ Critic's concerns & confidence
✓ Evidence (4 quotes + lineage viewer)
✓ Prior precedent (similar bets, how long)
✗ MISSING: Explicit "approved" status (assumption is active, but should be explicit)
✗ MISSING: Success criteria draft (Decide should propose, Plan refines)
```

### Information Flow OUT from Plan (to Design)
```
✓ Spec document (readable)
✓ Acceptance criteria
✓ Design constraints (mobile, dark mode, accessibility)
✓ Reference designs (how similar products did it)
✗ MISSING: Success metrics clearly linked to acceptance criteria
✗ MISSING: Estimate confidence ("are we sure 2 weeks is right?")
```

### Information Flow OUT from Plan (to Build)
```
✓ Spec document
✓ Acceptance criteria
✗ MISSING: Build-specific acceptance criteria (accessibility audit, performance targets)
✗ MISSING: Rollback plan predetermined
✗ MISSING: Monitoring setup instructions for Learn
```

### Information Flow BACK to Plan (from Design/Build)
```
✗ MISSING: Designer feedback ("this is achievable" or "this needs scope cut")
✗ MISSING: Build estimate review ("your 2-week estimate is accurate" or "add 1 week")
✗ MISSING: Scope escalation ("we can't do both, pick one")
```

### Loop Closure (from Learn)
```
✗ MISSING: Outcome feedback (success metrics were hit or missed)
✗ MISSING: Lessons learned (if similar bet ships again, what did we learn?)
✗ MISSING: Evidence update (if this bet was validated, it should score higher in future Discover)
```

---

## Part 5: Design Specification — Full Implementation

### High-level structure (from current):
```
[Top: Spec header with origin bet + Critic concerns + precedent]
[Left: Problem statement + User stories + Acceptance criteria]
[Center: Success metrics + Design constraints + Build handoff]
[Right: Timeline + Dependencies + Escalation paths]
```

### Detailed Component Specs

#### A. Spec Header Revision
```
Current: Blank or minimal (just title)

Revised:
┌─────────────────────────────────────────────────────────┐
│ 🎯 Spec for: "Onboarding flow needs friction reduction" │
│    [Link to Decide]  [View Decide's full judgment]      │
│                                                          │
│ Origin bet: opp-23456 · Status: Approved 87% confident  │
│ Evidence: 12 signals (support 7, research 3, analytics 2)│
│          [View all evidence from Discover]              │
│                                                          │
│ ⚠️ Critic's concerns:                                    │
│    • Scope might be too broad (consider mobile-only)   │
│    • Metrics need clarity (define "inviting")           │
│                                                          │
│ 📊 Precedent: "Improve signup UX" shipped 2m ago       │
│    Timeline: 1w design + 2w build = 3w total           │
│    Outcome: Validated, +8% conversion                  │
│    [View that spec]                                     │
│                                                          │
│ Timeline: 1w design + 2w build (confidence: medium)    │
│ Status: [DRAFT] → [DESIGN_REVIEW] → [BUILD_ASSIGNED]  │
│         → [ACTIVE] → [SHIPPED]                          │
└─────────────────────────────────────────────────────────┘
```

#### B. User Stories & Acceptance Criteria (structured, reviewable)
```
User Story 1: Mobile signup feeling
├─ As: New user on mobile
├─ I want: Feel welcomed & trusted
├─ So that: Don't abandon signup
│
├─ Acceptance criteria (pass/fail):
│  ☐ Progress bar after step 1 (shows "3 of 5")
│  ☐ Personalization field by step 2
│  ☐ Success page personalized ("Hey [name]...")
│  ☐ Signup time < 2 min (95th %ile, 100 test users)
│  ☐ Mobile responsive (375px, 480px tested)
│  ☐ WCAG AA compliant (contrast, keyboard nav)
│
├─ Design review status: ☐ Designer: "Feasible" (checkbox)
└─ Build estimate: ☐ Engineer: "2 weeks" (confirmed)

[Add more stories...]

Out-of-scope (explicit list):
✗ Advanced personalization → Q3 separate bet
✗ Email/SMS onboarding → Learn phase, separate track
✗ Admin workflow changes → Future bet
```

#### C. Success Metrics (linked to Learn)
```
Primary: Signup completion rate
├─ Baseline: 75% → Target: 85% (+10 points)
├─ Measurement: Count(completions) / Count(starts)
├─ Window: First 30 days
├─ How Learn records: Automated query
├─ Owner: Product Analytics
└─ Pass condition: Hit target + no guardrail breach

Secondary: Signup time
├─ Baseline: 5m → Target: 2m median
├─ Measurement: 50th percentile (time_started to completion)
├─ Window: First 30 days
├─ How Learn records: Automated query

Guardrails (must not regress):
├─ Signup starts: must stay >= 80% of baseline
├─ Support tickets: must stay <= 110% of baseline
├─ Error rate: must stay < 0.5%

Success verdict (how Learn decides):
├─ VALIDATED: Primary hits + no guardrail breach
├─ MIXED: Primary hits but secondary misses
├─ MISSED: Primary misses > 5 points
└─ SUPERSEDED: Rolled back before measurement window
```

#### D. Design Constraints (for Designer handoff)
```
Design system:
├─ Typography: Geist Sans (all UI)
├─ Colors: Ember accent max (1 spot)
├─ Spacing: 8px grid (no custom padding)
└─ Components: Button, Form input, Progress bar [Link to library]

Accessibility:
├─ WCAG AA: 4.5:1 contrast (normal), 3:1 (large)
├─ Keyboard: Tab order visible, focus indicator
├─ Mobile: Touch targets >= 48px × 48px
└─ Motion: < 3 sec, no flashing > 3 Hz

Mobile-first (primary):
├─ Design for iPhone 12 (390px)
├─ Test: 375px, 480px, 768px
└─ Dark mode: Works in both themes

Reference designs (how others solved it):
├─ Stripe account onboarding: [screenshot + learning]
├─ Vercel project creation: [screenshot + learning]
└─ Figma editor onboarding: [screenshot + learning]

Design review gate: ☐ Designer confirms feasibility & accessibility
```

#### E. Build Handoff (for Build team)
```
Build acceptance criteria (QA checklist):
├─ Zero console errors
├─ Tested on iPhone 12 + Pixel 6 (physical)
├─ WCAG AA audit (axe-core + manual)
├─ Lighthouse >= 80 (mobile), >= 90 (desktop)
├─ Load time 95th %ile < 3 sec
├─ Form validation + clear error messages
├─ Dark mode tested & works
├─ Keyboard nav complete (no mouse needed)

Rollback readiness:
├─ Criteria: Signup starts drop > 20% OR error rate > 0.5%
├─ Time: < 15 minutes
├─ Procedure: [git revert, deploy, verify]
├─ Communication: Product + Support within 5 min
└─ Post-rollback: Debug & replan

Dependencies:
├─ Auth service upgrade (already shipped)
├─ Analytics events (add in this sprint)
└─ Feature flag (create before code review)

Timeline estimate: 3 weeks (Design 1w + Build 2w)
├─ Pre-confirm with Designer: ☐ Feasible?
├─ Pre-confirm with Build: ☐ 3 weeks accurate?
└─ If not: [ Escalate scope ] (document in spec)
```

#### F. Escalation & Scope Renegotiation (section appears if flagged)
```
⚠️ SCOPE_RISK flagged by: Build team, 2026-08-01

Build finding: "Estimate is 4 weeks, not 3. Personalization component is complex."

Decision options (Plan PM chooses one):
[ A ] Slip launch by 1 week (new ship date: Aug 15)
      Record: Entered spec, notify Learn of new ship date
[ B ] Cut personalization from v1, ship in v2 (later bet)
      Record: Out-of-scope updated, Plan approval re-verified
[ C ] Add +1 engineer for 2 weeks (budget escalation)
      Record: Resource request logged, awaiting approval

Decision made: [ B ] Cut personalization, ship MVP only
Date: 2026-08-01
Owner: Plan PM [name]
Recorded: ✓ Audit trail permanent

Updated spec: Out-of-scope now includes "personalization (v2 separate bet)"
Learn notified: ✓ Success metrics unchanged (completion rate target same)
Design notified: ✓ Can remove personalization component
Build notified: ✓ Scope cut, estimate now 2 weeks confirmed
```

---

## Part 6: Missing Workflows (Build Order for Plan)

### Priority 1 (gates launch of Plan station):
1. Origin bet + Critic concerns visible at top of every spec
2. Evidence carried forward (view quotes from Discover)
3. Acceptance criteria structured & reviewable (not freeform prose)
4. Success metrics linked to Learn (how to measure & record outcome)
5. Design constraints for Designer (tokens, accessibility, mobile-first)
6. Build constraints for Engineer (estimate, rollback, monitoring)
7. Escalation home (scope renegotiation if needed)

### Priority 2 (power-user polish):
8. Design review gate (Designer signs off "feasible" before Build)
9. Success metrics review (Analytics + Learn sign off before ship)
10. Cross-impact visibility (shows conflicts with other in-flight bets)
11. Spec status tracking (DRAFT → DESIGN_REVIEW → BUILD_ASSIGNED → ACTIVE → SHIPPED)
12. Feedback from Design/Build routes back inline (not in Slack)

### Priority 3 (loop integrity):
13. Outcome feedback from Learn (verdict + lessons learned)
14. Learning extraction (if similar bet ships again, what did we learn?)
15. Evidence update (if validated, should rank higher in future Discover)

---

## Part 7: Success Metrics for Plan

Once this redesign ships:

1. **Spec clarity** — No questions during Design handoff (current: 3-5 clarifications per spec)
2. **Estimate accuracy** — Build estimates hold (current: 40% overrun on average)
3. **Scope renegotiation speed** — Decisions made in < 1 hour (currently stalls in Slack for days)
4. **Design sign-off** — Designer approves feasibility before Build (current: surprises mid-build)
5. **Success metric alignment** — Learn records exactly what Plan intended (current: metrics change)
6. **Feedback loop quality** — Design/Build issues route back to Plan, resolved before ship (current: stuck)

---

## Summary: What Plan Must Do

**Plan's job**: Turn a bet with evidence into a **detailed, feasible spec** with clear handoff to Design/Build and success criteria ready for Learn.

**What's missing now**:
- No visible connection to original bet & evidence
- Scope negotiations happen outside platform (Slack, email)
- Design feasibility not pre-validated
- Success metrics not linked to measurement instructions
- Feedback from Design/Build has no home

**What will fix it** (P1 build):
- Origin bet + Critic concerns + precedent visible at top
- Evidence carried forward from Discover
- Structured acceptance criteria (not freeform)
- Success metrics with explicit Learn measurement instructions
- Design/Build constraints explicit upfront
- Escalation home for scope renegotiations
- Audit trail of all decisions & changes

Next: Design station audit (how specs become wireframes).
