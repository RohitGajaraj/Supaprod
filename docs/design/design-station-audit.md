# Design Audit: Design Station

> _Created: 2026-08-01 · Last updated: 2026-08-01_

## Wireframes, Prototypes & UX Flow — From Power-User & Enterprise Lens

> **Context**: Design is where specs (from Plan) become wireframes, prototypes, and component specs ready for Build handoff. The Designer's job is ONE: **turn a spec with acceptance criteria into achievable, accessible designs that Build can implement**.
>
> **Session**: 2026-08-01 Design Phase · Conducted from: head-of-digital-product lens (Figma / Vercel / Google precedent)
>
> **Current state**: No Design station exists in Supaprod. Designers work in Figma outside the platform. Specs don't link to designs. Build surprises happen ("this can't be built in 2 weeks").

---

## Executive Summary: The Missing Design Station

### What Design Must Do
A design is the **contract between what we spec'd (in Plan) and what we're going to build (in Build)**.

**What flows IN to Design**:
- Spec from Plan (acceptance criteria, constraints, success metrics)
- Reference designs (how similar products solved this)
- Design system tokens & components (Geist Sans, Geist Mono, Geist Pixel, ember accent)
- Accessibility requirements (WCAG 2.2 AA must-haves)
- Mobile-first requirement (primary breakpoint, responsive tests)
- Dark mode requirement (both themes designed, tested)

**What gets DESIGNED in Design**:
- User flows (step-by-step interaction paths)
- Wireframes (low-fidelity layout, grid-based, responsive)
- Component specs (which system components, which custom, token mapping)
- State diagrams (empty, loading, error, success states)
- Accessibility audit (contrast ratios, keyboard nav, screen reader labels)
- Animation specs (micro-interactions, transition times, easing)
- Dark mode variants (tested, no hardcoded colors)
- Design QA checklist (everything in the spec is achievable)

**What flows OUT to Build**:
- Figma link to design file (current ground truth)
- Component specs (Button states, form input states, etc.)
- Token mapping (Geist Sans 14px text → token sp-text-sm)
- Accessibility specs (focus indicators, ARIA labels, keyboard nav)
- Animation specs (duration, easing, which interactions need motion)
- Dark mode specs (which components need dark variants)
- Design QA sign-off (Designer confirms: "Build can do this in the estimate")

**What loops BACK to Plan**:
- Feasibility feedback ("the spec says 2 weeks, but this interaction design is complex, needs 3")
- Scope suggestions ("if we cut animation, we save 3 days")

**What loops to Learn**:
- Design decisions (why we chose this layout, this interaction)
- Success metric mapping (which design decisions map to which metrics?)

---

## Critical Gaps (Make Design Station Non-Existent Today)

### 1. No visible connection to spec
- Designer gets a spec document (or verbal brief)
- But no structured data linkage (spec metadata, acceptance criteria, constraints)
- Designer works in Figma (outside Supaprod), isolated from context

### 2. No design feasibility review with Plan
- Plan says "2 weeks" for design
- Designer doesn't validate "that's realistic for this interaction model"
- Build gets a design that actually needs 3 weeks → surprise overrun

### 3. No design system enforcement
- Designers can use custom colors, custom spacing, custom typography
- Build team gets 50 custom designs for "the same button"
- Accessibility audit failures because custom components weren't vetted

### 4. No dark mode by default
- Designers design for light mode only
- Build team adds dark mode retroactively (bugs, inconsistencies)
- Ship date slips

### 5. No accessibility audit
- Designers don't validate WCAG AA at design time
- Build team discovers contrast failures, keyboard nav issues at code review
- Re-design + rebuild + slip

### 6. No component spec document
- Designer has a Figma, but no specs for "Button in error state should show red icon + error text"
- Build team guesses, builds wrong, designer says "that's not what I meant"

### 7. No feedback loop to Plan/Build
- Designer finds "the spec's acceptance criteria #3 is not achievable in the estimate"
- Nowhere to escalate; designer works around it (makes bad design choices)
- Build discovers later: "this was a tradeoff we didn't know we made"

### 8. No decision traceability
- Design decisions ("why rounded corners?") are not recorded
- If a decision later causes issues ("rounded corners don't work with 1px borders"), no way to understand the original reasoning
- Replicating similar designs, team re-debates same decisions

### 9. No motion/animation specs
- Designers can imagine smooth 300ms transitions
- Build team doesn't know motion was intended
- Ships janky version, user experience suffers

### 10. No design QA before handoff
- Designer finishes design, sends to Build
- Build starts, realizes "this progress bar state is missing" or "loading state not designed"
- Design + Build both blocked until resolved

---

## Part 1: What Design Station Must Show

### A. Design Header & Linkage

**Needed**:
```
📐 Design for: "Onboarding flow needs friction reduction" [Link to Plan spec]
  Plan spec ID: plan-567890
  Acceptance criteria: [Show all 8 AC from Plan, checkable as designed]
  
Design constraints (from Plan):
  📱 Mobile-first (iPhone 12 primary, responsive to 375px)
  🌙 Dark mode required (both themes designed)
  ♿ WCAG 2.2 AA required (all text >= 4.5:1 contrast)
  🎨 Design system tokens only (Geist Sans, ember accent, 8px grid)
  
Timeline: 1 week design (per Plan estimate)
Designer feasibility review: ☐ "This is achievable in 1 week" (checkbox)
                            [If unchecked: escalate to Plan for scope cut]

Figma file: [Link to live design, auto-updating]
Status: [SKETCH] → [WIREFRAME] → [DESIGN_QA] → [DESIGN_SIGN_OFF]
```

### B. User Flows & Interaction Design

**Needed**:
```
Flow 1: First-time signup (mobile)
├─ Screen 1: Welcome → "Create account" CTA
├─ Screen 2: Email input → Validation (if invalid: show error) → "Next" CTA
├─ Screen 3: Name + role input → Validation → "Next" CTA
├─ Screen 4: Goal personalization → "Create account" CTA
├─ Screen 5: Confirmation + next steps
│
├─ Animations:
│  • Screen transitions: 300ms slide-right (easing: ease-out)
│  • Loading spinner: indeterminate, 3 sec max before timeout
│  • Error message: 200ms fade-in, shows 5 sec then fades out
│  • Success check mark: 400ms scale-in + bounce
│
├─ Dark mode: All screens have dark variants (tested, no color issues)
│
├─ Accessibility:
│  • Tab order: Email → Name → Role → Goal → Submit
│  • Focus indicator: 2px blue outline, visible on all interactive elements
│  • Error aria-label: "Email is invalid, must include @"
│  • Screen reader: "Step 2 of 5, email input required"
│  • Keyboard: Full form completable without mouse (Enter to next, Escape to cancel)
│
└─ Design QA: ☐ All acceptance criteria #1-8 are designed (checkbox)
                ☐ Dark mode tested (checkbox)
                ☐ Mobile responsive tested (375px, 480px, 768px)
                ☐ Accessibility audit passed (contrast, keyboard, screen reader)

[Add more flows: error states, edge cases, etc.]
```

### C. Component Specifications

**Needed**:
```
Component: Input field
├─ States:
│  • Default: 40px tall, 8px padding, border: 1px sp-border-default
│  • Focused: border: 2px sp-blue (focus indicator visible)
│  • Error: border: 2px sp-red, error icon visible, error message below
│  • Disabled: opacity 50%, not interactive
│
├─ Typography:
│  • Label: Geist Sans 12px, weight 500, sp-text-muted
│  • Input text: Geist Sans 14px, weight 400, sp-text-default
│  • Error message: Geist Sans 12px, sp-text-error
│
├─ Dark mode:
│  • Background swaps: light #fff → dark #111
│  • Text swaps: light #000 → dark #fff
│  • Border swaps: light sp-border-default → dark sp-border-dark
│
├─ Accessibility:
│  • Label <label htmlFor="email"> linked to input id="email"
│  • Error aria-label="Invalid email format"
│  • Required attr: aria-required="true"
│
├─ Animation:
│  • Error message fade-in: 200ms ease-out
│  • Focus ring: instant (no animation, must be immediate)
│
├─ Build implementation note:
│  "Use shadcn Input component, wrap with validation. Token mapping: borders
│   use sp-* tokens, not custom values. Test contrast at 200% zoom."
│
└─ Design sign-off: ☐ Build confirmed achievable in estimate
```

### D. Design QA Checklist (before Build handoff)

**Needed**:
```
Design QA (Designer performs before sending to Build):

Spec coverage:
☐ All 8 acceptance criteria are designed (visible in flows/screens)
☐ All error states are designed (form validation, network error, timeout)
☐ All edge cases are designed (empty state, loading, disabled)
☐ Out-of-scope items are explicitly NOT designed (and noted)

Mobile-first verification:
☐ iPhone 12 (390px) primary breakpoint designed & iterable
☐ Tested at 375px (SE, responsive works)
☐ Tested at 480px (larger phone, responsive works)
☐ Tested at 768px (tablet, layout adapts or explicitly out-of-scope)
☐ Portrait orientation is primary (landscape designed? or not needed?)

Dark mode verification:
☐ Light mode: all text >= 4.5:1 contrast (WCAG AA)
☐ Dark mode: all text >= 4.5:1 contrast (WCAG AA)
☐ No hardcoded colors (all use design system tokens)
☐ Tested both themes: text readable, no surprise color issues

Accessibility audit:
☐ Color contrast: 4.5:1 (normal text), 3:1 (large text)
  (use WebAIM contrast checker, screenshot evidence)
☐ Keyboard navigation: Tab order visible, makes sense (top to bottom)
☐ Focus indicators: 2px outline, visible on every interactive element
☐ Screen reader: Alt text on icons, labels on form fields, states announced
☐ Motion: Animations < 3 sec, no flashing > 3 Hz (seizure-safe)
☐ Mobile touch: Tap targets >= 48px (button, link, input)

Design system compliance:
☐ Typography: Only Geist Sans (UI), Geist Mono (code), Geist Pixel (brand moments max 1)
☐ Colors: Only design system tokens (sp-text-*, sp-bg-*, sp-border-*)
☐ Spacing: 8px grid (no custom 7px or 9px padding)
☐ Components: Using shadcn library (Button, Input, etc.), not custom reinvents
☐ Tokens: All color values use sp-* token names (not hardcoded #fff, #000)

Animation & motion:
☐ Transitions specified: [screen name] [duration]ms [easing]
  Example: "Email to Name screen: 300ms slide-right ease-out"
☐ Micro-interactions: specified (button hover state, loading spinner)
☐ No animation: explicitly noted where motion NOT intended
☐ Build team can implement with CSS/Tailwind (no complex physics needed)

Component specs:
☐ All components have state diagrams (default, hover, focus, active, disabled, error)
☐ Token mapping documented (which design token = which component value)
☐ Dark mode variants shown (both themes, side-by-side)
☐ Build team can implement without re-designing

Build handoff readiness:
☐ Designer confirmed: "Build can implement this in [estimate] (e.g., 2 weeks)"
☐ If not: [Escalate to Plan for scope cut] with specific reason
☐ No ambiguity: every design choice is documented (why we chose this)
☐ Figma is up-to-date (matches this design QA sign-off)

Escalation (if needed):
☐ If feasibility issue: [Escalate to Plan] with specific reason
   Example: "Mobile animations are complex, estimate should be 3 weeks not 2"
☐ If scope issue: [Escalate to Plan] suggesting cut or defer
   Example: "If we remove personalization input, design is 4 days, not 7"
```

---

## Part 2: Enterprise Workflows for Design

### Workflow 1: "Is this design achievable in the estimate?" (Gap: Feasibility review)

**Current**: Designer works solo, Build team discovers surprises.

**Better**:
1. Plan creates spec (1 week design estimate)
2. Designer does feasibility spike (1 hour): "Is 1 week realistic?"
3. Designer says "yes, achievable" or "no, need 2 weeks" or "yes, if we cut X"
4. Plan decides: slip? cut? add resources?
5. Designer proceeds with confirmed estimate

**Design spec**: Add "Designer feasibility review" gate on Plan spec (linked bidirectionally)

### Workflow 2: "Dark mode broke the design" (Gap: Dark mode by default)

**Current**: Designer designs light mode, Build adds dark mode retroactively, bugs.

**Better**:
1. Designer designs light AND dark together (not retrofit)
2. Uses design system tokens (not hardcoded colors)
3. Tests both themes at design time
4. Build team gets both themes ready to go

**Design spec**: Require dark mode variants in component specs before sign-off

### Workflow 3: "This doesn't meet accessibility requirements" (Gap: Accessibility audit)

**Current**: Designer passes design, Build discovers contrast failures, slip.

**Better**:
1. Designer audits WCAG AA at design time
2. Takes screenshot, uses WebAIM contrast checker
3. Documents: [contrast ratio, screenshots, components affected]
4. Design QA includes accessibility pass/fail checkbox
5. Build team receives design that's already A11y-verified

**Design spec**: Accessibility audit is part of Design QA checklist

### Workflow 4: "The spec acceptance criteria isn't achievable" (Gap: Feedback to Plan)

**Current**: Designer discovers issue mid-design, workarounds around it (bad design).

**Better**:
1. Designer finds "AC #5 is hard to achieve in the estimate"
2. Escalates to Plan (structured form, not Slack)
3. Plan decides: refine AC? cut feature? add time?
4. Design proceeds with confirmed scope

**Design spec**: Design has an "escalation" section (appears only if flagged)

---

## Part 3: Loop Integrity for Design

### Information Flow IN to Design (from Plan)
```
✓ Spec document (acceptance criteria, success metrics)
✓ Design constraints (mobile-first, dark mode, WCAG AA)
✓ Reference designs (how similar products solved it)
✗ MISSING: Explicit spec ID/link (should be in header)
✗ MISSING: Build estimate (so designer can validate feasibility)
```

### Information Flow OUT from Design (to Build)
```
✓ Figma file (current ground truth)
✓ Component specs (with states, tokens, dark mode)
✓ Accessibility specs (contrast ratios, keyboard nav, ARIA labels)
✗ MISSING: Build implementation notes (how to use tokens, components)
✗ MISSING: Animation specs (durations, easing)
✗ MISSING: Design QA checklist (verification that everything is achievable)
```

### Information Flow BACK to Design (from Build)
```
✗ MISSING: Build feedback (this component is hard to implement, suggests refinement)
✗ MISSING: Implementation questions (can you clarify this state?)
```

### Loop Closure (from Ship/Learn)
```
✗ MISSING: Design performance impact (if animations slow on mobile, log it)
✗ MISSING: Design accessibility issues (if dark mode breaks, log it)
✗ MISSING: Design decision validation (did the rounded corners help or hurt UX?)
```

---

## Part 4: Design Specification — Full Implementation

### High-level structure (new station):
```
[Top: Design header with spec link + constraints + feasibility review]
[Left: User flows & interaction design]
[Center: Component specifications + state diagrams]
[Right: Design QA checklist + sign-off]
```

### Detailed Component Specs

#### A. Design Station Header
```
📐 Design for: "Onboarding flow needs friction reduction"
   [Link to Plan spec: plan-567890]
   
Spec acceptance criteria (from Plan):
☐ Progress bar visible after step 1
☐ Personalization field by step 2
☐ Success page personalized
☐ Signup time < 2 min
☐ Mobile responsive (375px tested)
☐ WCAG AA compliant
☐ Keyboard navigation end-to-end

Design constraints:
📱 Mobile-first (iPhone 12 primary: 390px)
🌙 Dark mode required (light + dark both designed, tested)
♿ WCAG 2.2 AA (all text >= 4.5:1 contrast)
🎨 Geist Sans + Geist Mono only (Geist Pixel: brand moments max 1)
🔗 Design system tokens (sp-text-*, sp-bg-*, sp-border-*)

Timeline: 1 week design (per Plan estimate)

Designer feasibility review: 
☐ "This is achievable in 1 week"
☐ If NO: [Escalate to Plan] (reason: [text field])

Status: [SKETCH] → [WIREFRAME] → [DESIGN_QA] → [DESIGNER_SIGN_OFF]

Figma file: [Link to live design]
Version control: Auto-updated (commits to Figma, linked here)

Precedent reference:
✓ "Improve signup UX" (2m ago): Used 5 screens, 8 component variants
  Learning: Personalization screen caused most design complexity
  This design: [8 or fewer screens to stay within 1 week]
```

#### B. Component Specification (example)
```
Component: Step indicator (progress bar)
├─ Appearance:
│  • Width: 100% of container
│  • Height: 4px (thin line)
│  • Gap between steps: 4px (2px line, 2px gap)
│  • Completed steps: sp-bg-blue (Geist blue)
│  • Current step: sp-bg-blue + indicator circle (12px diameter)
│  • Pending steps: sp-bg-border-light (light gray)
│
├─ States:
│  • Step 1 active: [Line showing 1 of 5 filled]
│  • Step 2 active: [Line showing 2 of 5 filled]
│  • Step 5 complete: [All filled, show success checkmark]
│
├─ Typography (if labels):
│  • Labels: Geist Sans 12px 500, sp-text-muted (above or below line)
│  • Mobile: Labels hidden if space < 320px (show numbers only)
│
├─ Dark mode:
│  • Completed: sp-blue (same in both themes)
│  • Pending: sp-border-dark (changes from light gray → dark gray)
│  • Background: transparent (inherits parent)
│
├─ Accessibility:
│  • aria-label="Step 2 of 5: Email verification"
│  • aria-current="step" on current step
│  • Not a focusable element (decorative, step buttons below are focusable)
│
├─ Animation:
│  • Progress transition: smooth 300ms (css width: transition)
│  • Checkmark on complete: 400ms scale-in + bounce
│
├─ Build implementation notes:
│  "Use <div> with <span> for each step. Apply sp-* token classes.
│   Width grows with CSS transition. Avoid JavaScript animations (costly).
│   Token mapping: sp-bg-blue, sp-bg-border-light, sp-text-muted.
│   Test at 100%, 125%, 200% zoom (accessibility)."
│
└─ Designer sign-off: ☐ "Build can implement in [estimate]" (e.g., 2 days)
```

#### C. Design QA Checklist (comprehensive)
```
✓ Design QA Sign-off

[Section] Spec coverage
  ☐ All 8 acceptance criteria from Plan are designed & visible
  ☐ All error states designed (invalid email, timeout, network error)
  ☐ All edge cases designed (empty, loading, disabled, max length)
  ☐ Out-of-scope items listed & explicitly NOT designed

[Section] Mobile-first verification
  ☐ Primary design: iPhone 12 (390px), iterable on Figma
  ☐ Responsive tested: 375px (SE) → works
  ☐ Responsive tested: 480px (large) → works
  ☐ Responsive tested: 768px (tablet) → works (or explicitly not needed)
  ☐ Touch targets >= 48px all interactive elements
  ☐ Portrait primary (landscape: designed, or not needed)

[Section] Dark mode verification
  ☐ Light mode: all text ≥ 4.5:1 contrast (WebAIM screenshot evidence)
  ☐ Dark mode: all text ≥ 4.5:1 contrast (WebAIM screenshot evidence)
  ☐ No hardcoded colors in Figma (all use design tokens)
  ☐ Both themes tested side-by-side: no color surprises
  ☐ Dark mode specs documented in component details

[Section] Accessibility audit
  ☐ Contrast: 4.5:1 (normal), 3:1 (large) — all screens pass
  ☐ Keyboard nav: Tab order visible & sensible (top-to-bottom)
  ☐ Focus: 2px outline on every button, link, input — visible in both themes
  ☐ Screen reader: Labels on inputs, alt text on icons, states announced
  ☐ Motion: Animations < 3 sec, no flashing > 3 Hz, skip option obvious
  ☐ Zoom: Tested at 200% (layout doesn't break, text readable)
  ☐ Color blindness: Design readable without color alone (icons + labels)

[Section] Design system compliance
  ☐ Typography: Geist Sans (UI), Geist Mono (code) — no custom fonts
  ☐ Colors: Only sp-text-*, sp-bg-*, sp-border-* tokens (no hardcoded #fff)
  ☐ Spacing: 8px grid (all padding/margin multiples of 8)
  ☐ Components: All from shadcn library (Button, Input, etc.)
  ☐ Icons: All from lucide-react (no custom icons)
  ☐ Tokens: Figma style names match codebase token names

[Section] Animation & motion
  ☐ All transitions specified: [screen] [duration]ms [easing]
  ☐ Micro-interactions documented: [element] [state] [animation]
  ☐ No animation: explicitly noted where motion NOT intended
  ☐ Durations reasonable: 200-400ms (not too slow)
  ☐ Easing: ease-out (UI), cubic-bezier (custom)
  ☐ Build team can implement with CSS/Tailwind (no physics)

[Section] Component specifications
  ☐ All components have state diagram (default, hover, focus, active, disabled, error)
  ☐ Token mapping documented (which Geist token = which value)
  ☐ Dark mode variants shown (light + dark screenshot)
  ☐ Build team has no ambiguity (can implement without re-designing)
  ☐ Component Figma file linked (or components documented inline)

[Section] Build handoff readiness
  ☐ Figma design file is live & up-to-date
  ☐ All acceptance criteria from Plan are visible in design
  ☐ Designer confirmed: "Build can implement in [estimate]"
    [If NO: escalate to Plan with specific reason]
  ☐ Build team has a checklist (what to verify when they start)
  ☐ No ambiguity or surprises left (every design decision documented)

Escalation (if needed):
  ☐ Feasibility issue: [Escalate to Plan] — reason: [text]
    Example: "Component interactions are complex, 1 week is tight; need 2 weeks OR cut animation"
  ☐ Scope issue: [Escalate to Plan] — suggest cut/defer
    Example: "If we remove personalization step, design is 4 days not 7"
  ☐ Accessibility issue: [Resolve before sign-off]
    Example: "Dark mode contrast failed on this button; redesigned color"

Signed off by: [Designer name]
Date: [2026-08-01]
Status: ✓ READY FOR BUILD
```

---

## Part 5: Success Metrics for Design

Once this station ships:

1. **Design clarity** — No questions during Build handoff (current: 5-8 clarifications)
2. **Spec coverage** — All acceptance criteria designed & verified (current: ~80% coverage)
3. **Feasibility accuracy** — Designer estimate matches Build estimate (current: 30% misalignment)
4. **Accessibility compliance** — Ship with zero WCAG AA violations (current: 3-5 per release)
5. **Dark mode parity** — Both themes work identically (current: bugs in dark mode post-ship)
6. **Design QA effectiveness** — Zero "missed state" issues found in Build (current: 2-4 per release)

---

## Summary: What Design Must Do

**Design's job**: Turn a spec with acceptance criteria into **achievable, accessible designs** that Build can implement in the estimate, with both light and dark themes ready to go.

**What's missing now**: The entire Design station (no integration with Supaprod). Work happens in Figma, isolated from specs and build context.

**What will fix it** (P1 build):
- Design station with spec linkage (know what you're designing)
- Component specs with state diagrams (Build knows exact states)
- Design QA checklist (verify feasibility before handoff)
- Dark mode by default (both themes designed together)
- Accessibility audit (WCAG AA before Build)
- Animation specs (Build knows motion was intended)
- Escalation paths (scope issues route back to Plan)

Next: Build station audit (how designs become code).
