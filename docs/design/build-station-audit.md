# Design Audit: Build Station

> _Created: 2026-08-01 · Last updated: 2026-08-01_

## Implementation & QA — From Power-User & Enterprise Lens

> **Context**: Build is where designs (from Design) become working, tested code ready for Ship. The Engineer's job is ONE: **implement the design + acceptance criteria + success metrics, with testing that proves it works**.
>
> **Session**: 2026-08-01 Design Phase · Conducted from: head-of-digital-product lens (Stripe / Google / Vercel precedent)

---

## Executive Summary: What Build Must Know

### The Build Contract
- **IN**: Design file + component specs + acceptance criteria + success metrics + Build estimate
- **OUT**: Tested code (all acceptance criteria pass) + monitoring wired (Learn can measure outcomes) + rollback plan ready
- **BACK TO**: Plan (if scope is unrealistic) · Design (if achievable/not achievable changes) · Ship (when ready)
- **TO Learn**: Success metrics instrumented (automated queries ready)

### Critical Gaps (Make Build Blindfolded)

1. **No visible connection to origin bet** — Engineer implements feature with no link to "this came from customer feedback asking for X"
2. **Acceptance criteria are text, not measurable** — "Usable form" vs "all fields validate before submit" (text ambiguity)
3. **Success metrics not wired at build time** — Build adds event logging manually (inconsistent, late, forgotten)
4. **Design constraints not pre-validated** — Engineer builds complex animation, finds "doesn't work on older phones" late
5. **No rollback plan** — Ship date chosen, but rollback procedure not predetermined
6. **Monitoring not pre-wired** — Ship team discovers "we can't measure this metric because the event wasn't logged"
7. **Performance targets not measured during build** — Ship finds "Lighthouse is 65, we promised 80"
8. **Accessibility not tested during build** — Ship finds "keyboard nav broken" after QA signed off
9. **Dark mode not tested end-to-end** — Ship finds "dark mode button broken on mobile"
10. **No feedback loop to Plan** — If estimate is wrong mid-build, no escalation path

---

## Part 1: What Build Station Must Show

### A. Build Header & Origin

**Needed**:
```
💻 Building: "Onboarding flow needs friction reduction"
   [Link to Design file: figma.com/...]
   [Link to Plan spec: plan-567890]
   [Link to Decide bet: opp-23456]
   
Build acceptance criteria (from Plan):
☐ Progress bar visible after step 1
☐ Personalization field by step 2
☐ Success page personalized
☐ Signup time < 2 min
☐ Mobile responsive
☐ WCAG AA compliant
☐ Keyboard navigation end-to-end

Success metrics to instrument (from Plan):
📊 Primary: Signup completion rate (baseline 75% → target 85%)
   Event: "signup_completed"
   Learn query: Count(events where event='signup_completed') / Count(events where event='signup_started')
   
📊 Secondary: Signup time median (baseline 5m → target 2m)
   Event: "signup_completed" with duration timestamp
   Learn query: Percentile(duration, 50th) from signup events

🔴 Guardrails: Signup starts, support tickets, error rate
   Events: "signup_started", support ticket ingestion, "signup_error"

Build estimate: 2 weeks (from Design: "achievable in 2 weeks")
Sprint capacity: Check [team has 2 weeks available]
Estimate confidence: ☑ Confirmed ☐ At risk (reason: [text])

Timeline: Sprint starting [date], ship target [date]
Owner: [Engineer name]
Reviewer: [Tech lead]
```

### B. Build Acceptance Criteria (Executable)

**Needed**:
```
AC 1: Progress bar visible after step 1
  Implementation: 
    - Render <ProgressBar steps={5} current={1} /> on step 2 screen
    - Use design system component (shadcn Progress + sp-bg-blue token)
  Testing:
    - Screenshot: Progress bar shows "1 of 5" after step 1 → PASS
    - Mobile 375px: Progress bar visible (no horizontal scroll) → PASS
    - Dark mode: Progress bar visible in both themes → PASS
    - Keyboard: Tab to progress bar → NOT focusable (correct) → PASS
  Success: All tests pass before code review

AC 2: Personalization field by step 2
  Implementation:
    - Add name + role select on step 2
    - Use form validation: name required (min 2 chars), role required
    - Show error message if validation fails
  Testing:
    - Form submit with empty name → Shows "Name is required" → PASS
    - Form submit with name (valid) → Proceeds to step 3 → PASS
    - Role required: Can't skip role selection → PASS
    - Mobile: Form fields accessible at 375px (no truncation) → PASS
    - Keyboard: Tab through Name → Role → Submit (no skips) → PASS
  Success: All tests pass before code review

[Continue for all 8 acceptance criteria...]

QA Sign-off required: ☐ QA engineer confirms all AC pass
Before code review: NO CODE REVIEW until QA sign-off
```

### C. Performance & Accessibility Build Targets

**Needed**:
```
Performance targets (measured during build):
  📊 Lighthouse score: >= 80 (mobile), >= 90 (desktop)
     Tool: Google Lighthouse (npm run lighthouse)
     Target: Measured before deploy
  📊 Load time (95th %ile): < 3 sec (same network as production)
     Tool: WebPageTest or built-in perf tools
     Target: Measured before deploy
  📊 Mobile on 3G: Signup flow < 8 sec (vs. 5G measured time)
     Tool: Device throttling (Network: Slow 3G)
     Target: Measured before deploy

Accessibility testing (during build):
  ♿ Automated: axe-core scan (0 violations)
    Tool: npm run a11y:scan
    Target: Run before code review
  ♿ Manual: Keyboard nav end-to-end (Tab/Shift+Tab through all steps)
    Test: Form completable without mouse
    Target: Before QA sign-off
  ♿ Manual: Screen reader (NVDA or VoiceOver)
    Test: All form labels announced, steps announced
    Target: Before ship (can skip if high confidence from automated)
  ♿ Contrast: WCAG AA verified (4.5:1 normal, 3:1 large)
    Tool: WebAIM or Sentry (if integrated)
    Target: Before code review

Dark mode testing:
  🌙 Light mode: All screens tested
  🌙 Dark mode: All screens tested (both themes side-by-side)
  🌙 Token usage: Verify no hardcoded colors (grep for #, rgb, etc.)
  🌙 Tested on device: Real iPhone + Android (not just simulator)
  
Mobile testing:
  📱 iPhone 12 (390px): Primary test device
  📱 iPhone SE (375px): Responsive test
  📱 Android (480px): Responsive test
  📱 Tablet (768px): If in scope
  📱 Real device (not just simulator): Before QA sign-off

Testing matrix (engineer completes before code review):
  [ ] AC 1 on iPhone 12 light
  [ ] AC 1 on iPhone 12 dark
  [ ] AC 1 on iPhone SE
  [ ] AC 2 on iPhone 12 light
  [... etc for all AC × all devices]
  [ ] Keyboard nav end-to-end
  [ ] axe-core 0 violations
  [ ] Lighthouse >= 80
  [ ] Load time < 3 sec
```

### D. Build Monitoring Instrumentation

**Needed**:
```
Events to log (for Learn to measure success metrics):

Event 1: signup_started
  When: User clicks "Create account" on welcome screen
  Data: {
    timestamp: ISO8601,
    user_id: string,
    device: 'mobile' | 'desktop',
    source: string (referrer),
    session_id: string
  }
  Logged by: trackEvent('signup_started', data)
  Learn uses: Count this event in denominator for completion rate

Event 2: signup_step_1_completed
  When: User fills email, clicks next
  Data: {
    timestamp: ISO8601,
    user_id: string,
    duration_ms: number (time from signup_started)
  }
  Learn uses: Track step-by-step funnel (where users abandon)

Event 3: signup_step_2_completed
  When: User fills name + role, clicks next
  Data: { timestamp, user_id, duration_ms, role: string }
  Learn uses: Funnel metric, role distribution analysis

Event 4: signup_completed
  When: User finishes onboarding, lands on dashboard
  Data: {
    timestamp: ISO8601,
    user_id: string,
    total_duration_ms: number (signup_started to completion),
    completed_steps: number (of 5)
  }
  Learn uses: Completion rate (primary metric), time to complete (secondary)

Event 5: signup_error
  When: Form validation fails, API error, network error
  Data: {
    timestamp: ISO8601,
    user_id: string (if available),
    error_type: 'validation' | 'api' | 'network',
    error_message: string,
    step: number (which step failed)
  }
  Learn uses: Error rate monitoring (guardrail metric), debugging

Event 6: signup_abandoned
  When: User closes page or navigates away mid-signup
  Data: {
    timestamp: ISO8601,
    user_id: string,
    step_at_abandon: number,
    duration_ms: number
  }
  Learn uses: Funnel metric (where do users drop off?)

Verification (engineer confirms before ship):
  ☐ All events are logged (manual test + QA verification)
  ☐ Event data is correct (timestamps, user_id, etc.)
  ☐ No PII in events (no passwords, credit cards, etc.)
  ☐ Events are queryable in analytics backend
  ☐ Learn team has pre-written queries (don't discover on launch day)
```

### E. Rollback Plan (Predetermined)

**Needed**:
```
Rollback decision criteria (auto-rollback if):
  🔴 Signup starts drop > 20% compared to baseline
  🔴 Error rate on signup > 0.5% (1 error per 200 requests)
  🔴 Page load time 95th %ile > 5 sec (was 3 sec target)
  🔴 Database CPU > 90% sustained for 5+ minutes
  🔴 Any critical bug reported (security, data loss, etc.)

Rollback procedure:
  1. On-call engineer receives alert
  2. Checks: Is metric actually out of bounds? (false alarm check)
  3. Decides: Rollback? Or investigate first?
     - If obviously broken: AUTO-ROLLBACK (don't wait)
     - If unclear: PAGE manager/PM (5 min decision window)
  4. Execute rollback:
     - Git revert [commit hash]
     - Deploy to staging (verify it works)
     - Deploy to production
     - Verify metrics recovering
  5. Communicate: Notify Product + Support within 5 min of rollback
  6. Post-rollback: Debug & plan re-launch (don't rush back to broken code)

Rollback time target: < 15 minutes (same-day rollback, no waiting)

Pre-deployment checklist:
  ☐ Rollback procedure tested (git revert works, deploy succeeds)
  ☐ Monitoring alerts configured (auto-page if metrics breach)
  ☐ On-call engineer briefed (knows criteria, knows procedure)
  ☐ Comms template ready (message to send to Product/Support)
```

### F. Build Escalation (if estimate is wrong)

**Needed**:
```
Mid-build escalation (if AC not achievable in estimate):

Example: "AC 2 is harder than expected, estimate slips from 2 weeks to 3"

Escalation process:
  1. Engineer flags: "ESTIMATE_RISK" on build status
  2. Reason: "Personalization component integration complex (API not ready)"
  3. Options presented:
     [ A ] Slip ship date by 1 week
     [ B ] Cut personalization from v1 (defer to v2)
     [ C ] Add +1 engineer for 1 week
  4. PM decides (within 24h):
     - [ A ] → Update ship date, notify stakeholders
     - [ B ] → Update Plan spec (remove from AC), Plan PM approves
     - [ C ] → Resource approval, add engineer
  5. Record decision in build audit log (permanent trail)
  6. Continue with confirmed scope

Escalation SLA: Respond within 24h (no prolonged blocking)
```

---

## Part 2: Enterprise Build Workflows

### Workflow 1: "Is the acceptance criteria clear enough to build?" (Gap: AC clarity)

**Current**: Engineer starts coding, discovers "AC says 'form validation' but doesn't say when to show error"

**Better**:
1. Before sprint starts, engineer reads AC
2. Engineer asks Plan/Design clarifications (structured form)
3. AC is refined or clarified
4. Sprint starts with unambiguous AC

**Design spec**: Add "AC review" gate before sprint (Engineer reviews AC, flags ambiguity)

### Workflow 2: "Success metrics aren't instrumented" (Gap: Monitoring pre-wired)

**Current**: Ship date approached, developer realizes "we didn't log the events Learn needs"

**Better**:
1. At start of build, engineer receives "events to log" from Plan
2. Engineer instruments those events as part of AC
3. QA verifies events are logged correctly
4. Ship goes out with monitoring ready

**Design spec**: Success metrics include exact event specs (what to log, when, what data)

### Workflow 3: "This breaks old phones" (Gap: Constraint validation)

**Current**: Build finishes, QA discovers "animations don't work on iOS 12"

**Better**:
1. Design specifies constraints ("iOS 12+ supported")
2. Engineer tests on iOS 12 during build (not QA surprise)
3. Resolve before code review

**Design spec**: Browser/device constraints from Design are test requirements

---

## Part 3: Loop Integrity for Build

### Information Flow IN to Build
```
✓ Design file (Figma, current)
✓ Acceptance criteria (from Plan)
✓ Success metrics (from Plan)
✗ MISSING: Origin bet (why are we building this? what customer need?)
✗ MISSING: Constraints (iOS 12 support? 3G mobile? dark mode must-have?)
✗ MISSING: Rollback plan predetermined
```

### Information Flow OUT from Build
```
✓ Working code (tested, all AC pass)
✓ Monitoring events logged
✗ MISSING: Build feedback to Plan/Design (estimate risk, feasibility issues)
✗ MISSING: Testing evidence (screenshots, test results)
```

### Information Flow to Ship/Learn
```
✗ MISSING: Success metrics explicitly instrumented (documented where Learn can find them)
✗ MISSING: Rollback plan documented (not discovered during incident)
✗ MISSING: Monitoring alert thresholds pre-configured
```

---

## Part 4: Success Metrics for Build

1. **Estimate accuracy** — Slips <= 10% (current: 30-40%)
2. **Acceptance criteria pass rate** — 100% AC pass before code review (current: 85-90%)
3. **QA defect rate** — < 2 defects per release (current: 5-8)
4. **Accessibility compliance** — 0 WCAG AA violations (current: 2-4)
5. **Performance met** — Lighthouse >= 80 on deploy (current: varies)
6. **Monitoring ready** — Learn can measure metrics on ship day (current: missing event logs)

---

## Summary: What Build Must Do

**Build's job**: Implement designs + acceptance criteria + success metrics into tested, monitored, rollback-ready code.

**What's missing now**: No visible connection to bet/design/plan context. Acceptance criteria are text (ambiguous). Success metrics not pre-wired. Rollback plan not predetermined.

**What will fix it** (P1 build):
- Build header with origin bet + design + plan links
- Structured AC with executable tests
- Success metrics with exact event logging specs
- Performance/accessibility targets measured during build
- Rollback plan predetermined + tested
- Escalation path for estimate risks
- QA sign-off checklist (all AC pass before code review)

Next: Ship station audit (how code goes to production).
