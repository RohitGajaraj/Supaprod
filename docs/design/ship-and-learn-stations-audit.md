# Design Audits: Ship & Learn Stations

> _Created: 2026-08-01 · Last updated: 2026-08-01_

## Deployment, Monitoring & Outcome Recording — From Power-User & Enterprise Lens

---

# SHIP STATION — Deployment & Monitoring

## Executive Summary

**The Ship Contract**:
- **IN**: Tested code + monitoring configured + rollback plan + success metrics
- **OUT**: Code live in production, monitoring active, alerting configured, team notified
- **BACK TO**: Build (if critical bugs) · Learn (when stable, start outcome measurement)
- **TO Learn**: Deployment event logged, monitoring dashboards live

## Critical Gaps (Make Ship Blindfolded)

1. **No link to origin bet** — Ops team ships code with no idea why they're shipping it
2. **Success metrics not monitored** — Ship succeeds, but nobody watching the metrics that matter
3. **Rollback alert criteria not pre-determined** — Ship breaks, team debates 30 min before deciding to rollback
4. **Monitoring dashboards not pre-built** — Ship day: "how do we see Lighthouse score? where's the query?"
5. **Stale deployment checklist** — Generic checklist (database, cache, etc.) doesn't match THIS ship
6. **Communication template missing** — Ship breaks, unclear who to notify or how
7. **Canary/gradual rollout not planned** — Ship 100% to all users, breaks, rollback takes 15 min
8. **Learn start time unclear** — Is outcome measurement starting at deploy? At 1h stable? At 24h?
9. **Incident response not predetermined** — Ship breaks, on-call scrambles, no playbook
10. **Ship success criteria undefined** — Ship happens, nobody knows if it "worked"

## What Ship Station Must Show

### A. Deployment Header & Origin

```
🚀 Shipping: "Onboarding flow needs friction reduction"
   [Link to Build: commit 7a3f2c9]
   [Link to Plan spec: plan-567890]
   [Link to Decide bet: opp-23456]

Deployment checklist (pre-ship):
  ☐ Code deployed to staging, tested (Build team confirmed)
  ☐ Monitoring dashboards live (queries tested on staging data)
  ☐ Alerts configured (thresholds from Plan)
  ☐ Rollback procedure tested (git revert works)
  ☐ Communication template ready (Product, Support, etc.)
  ☐ On-call engineer briefed (knows criteria, knows playbook)
  ☐ Success metrics defined (how do we know this shipped well?)

Rollout strategy:
  [ ] 100% immediate (all users at once)
  [ ] Canary (5% → 25% → 100% over 1h)
  [ ] Blue-green (0 downtime cutover)

Timeline: Planned deployment [date] [time], target <15 min deploy time

Ship owner: [Ops/DevOps engineer]
Approver: [VP Eng or on-call lead]
Comms owner: [Product/Support lead]
```

### B. Pre-Ship Verification

```
Ship readiness checklist:
  ☐ Build: All AC pass, 0 known bugs
  ☐ Performance: Lighthouse >= 80 (mobile), >= 90 (desktop)
  ☐ Accessibility: axe-core 0 violations, keyboard nav tested
  ☐ Dark mode: Both themes tested on real devices
  ☐ Mobile: iPhone 12, SE, Android all tested
  ☐ Monitoring: Events logging verified on staging
  ☐ Alerts: All thresholds configured + tested
  ☐ Rollback: Procedure tested, on-call trained
  ☐ Communication: Template ready, reviewers assigned
  ☐ Success criteria: Defined (what does success look like?)

Nothing deploys without all checkboxes checked.
```

### C. Monitoring Setup (Pre-Built, Not Manual)

```
Monitoring dashboards (pre-built on staging, copied to prod on ship):

Dashboard 1: Key metrics (real-time)
  📊 Signup completion rate (live counter: X% this hour)
  📊 Signup time median (live: X min, trended vs. 2h/24h)
  📊 Error rate (live: X%, alert if > 0.5%)
  📊 Page load time 95th %ile (live: X sec, alert if > 3 sec)
  📊 Support tickets (live: X tickets this hour, alert if spike)

Dashboard 2: Guardrails (must not regress)
  🔴 Signup starts (baseline: X/day, alert if < Y)
  🔴 Database CPU (alert if > 90% sustained)
  🔴 API errors (alert if > 0.5%)

Dashboard 3: Deployment info (metadata)
  ⏱️ Deploy time: [timestamp], deployed by [name]
  ⏱️ Code version: [commit hash], shipped from [branch]
  ⏱️ Rollback ready: [procedure link]
  ⏱️ Success criteria met: [yes/no, timestamp]

Queries pre-tested on staging:
  ☐ Completion rate query runs (responds < 2 sec)
  ☐ Time median query runs (responds < 2 sec)
  ☐ Error rate query runs (responds < 2 sec)
  ☐ Guardrail queries run (responds < 2 sec)
```

### D. Rollback Procedure (Predetermined)

```
Auto-rollback triggers (no deliberation needed):
  🔴 Completion rate drops > 20% from baseline
  🔴 Error rate > 0.5% for 5+ min
  🔴 Page load 95th %ile > 5 sec for 5+ min
  🔴 Database CPU > 95% sustained
  🔴 Any P0 incident (security, data loss)

Manual rollback decision (within 5 min):
  On-call checks: Is metric actually breached? (not false alarm)
  Decision: Rollback immediately OR investigate first
  If rollback: Execute procedure (< 15 min total)
  If investigate: Set timer (don't debug > 15 min, just rollback)

Rollback execution:
  1. git revert [commit hash]
  2. Test on staging (deploy succeeds)
  3. Deploy to production
  4. Verify metrics recovering (within 5 min of rollback)
  5. Alert product: "Rolled back at [time], reason: [metric breach]"

Post-rollback:
  - Don't re-deploy same code same day (debug first)
  - Debug report: What broke, why, how to fix
  - Plan re-launch: Same ship checklist, different code

Ship success verdict:
  ✅ SUCCESS: Metrics stable 1h post-deploy, no alerts, no rollback
  ⚠️ PARTIAL: Metrics met but minor issues (handled post-launch)
  🔴 FAILURE: Rolled back within 1h
```

### E. Communication & Handoff to Learn

```
Deployment notification (sent immediately on deploy):
  To: Product, Support, Leadership
  Message template:
    "🚀 Shipped: Onboarding flow redesign
     ⏱️ Deploy time: [time]
     👥 Affected users: [scope]
     📊 Success metrics: [link to dashboard]
     🔴 Rollback criteria: [summarized]
     📞 On-call: [name/phone]
     
     Learn will record outcome starting [time + offset].
     Stable check: [time for stability check]"

Handoff to Learn:
  ☐ Monitoring dashboards linked in Learn
  ☐ Success metrics explicitly named (Learn knows what to query)
  ☐ Measurement window defined ("First 24 hours", "First week")
  ☐ Outcome recording instructions pre-loaded (Learn won't guess)
  ☐ Rollback event triggers outcome: SUPERSEDED verdict
  ☐ Guardrail breach logs: Issue for Build/Design to debug

Learn start time:
  Option 1: Immediate (start measuring as soon as deploy succeeds)
  Option 2: After 1h stable (give system time to settle)
  Option 3: After 24h stable (let real-world traffic come in)
  [Choose based on metric type]

Learn receives:
  ✓ Code version deployed
  ✓ Deploy timestamp
  ✓ Success metric queries (pre-written)
  ✓ Expected baseline & target (for comparison)
  ✓ Guardrail thresholds (for health monitoring)
```

---

# LEARN STATION — Outcome Recording & Loop Closure

## Executive Summary

**The Learn Contract**:
- **IN**: Deployed code + success metrics + measurement window + guardrails + rollback info
- **OUT**: Recorded outcome (verdict: validated/missed/mixed/superseded) + lessons learned
- **BACK TO**: Discover (loop closure: outcomes re-score future clusters) · Decide (rank updates) · Plan/Design/Build (lessons learned)
- **LOOP**: Evidence → Decision → Implementation → Outcome → Evidence (feedback loop completes)

## Critical Gaps (Make Outcome Recording Guesswork)

1. **No measurement instructions** — Learn team guesses "did this metric meet target?"
2. **Success criteria undefined** — "Did the outcome validate the bet?" depends on... what?
3. **Measurement window vague** — Is Learn measuring 1 week? 1 month? Until next season?
4. **Automated queries missing** — Manual hand-calculation of outcomes (error-prone, slow)
5. **Guardrail breaches not escalated** — Ship works but guardrails breach (regression hidden)
6. **Outcome feedback not routed** — Learn records outcome, but Plan/Discover don't see it
7. **Lessons extraction missing** — Outcome recorded, but "what did we learn?" is never captured
8. **Loop closure broken** — Outcome doesn't feed back to future Discover (next similar cluster isn't ranked higher)
9. **Precedent not updated** — Design/Plan have "prior similar bet" links, but don't see new outcome
10. **Decision reversal pathway missing** — If outcome is "missed", what triggers re-evaluation?

## What Learn Station Must Show

### A. Learn Header & Outcome Recording Setup

```
📊 Recording outcome for: "Onboarding flow needs friction reduction"
   [Link to Decide bet: opp-23456]
   [Link to Ship: deployed 2026-08-05]

Measurement window: First 24 hours post-ship (Aug 5 midnight → Aug 6 midnight)
Measurement started: 2026-08-05 00:15 UTC (15 min post-deploy for stability)

Success criteria (from Plan):
  Primary: Signup completion rate 75% → 85% (must hit for VALIDATED)
  Secondary: Signup time 5m → 2m (nice-to-have)
  Guardrails: Signup starts >= 80% baseline, support <= 110% baseline, error < 0.5%

Measurement queries (pre-written, already tested):
  ☐ Completion rate: SELECT COUNT(*) WHERE event='signup_completed' / COUNT(*) WHERE event='signup_started'
  ☐ Time median: SELECT PERCENTILE(duration_ms, 50) FROM signup_events
  ☐ Error rate: SELECT COUNT(*) WHERE event='signup_error' / COUNT(*) WHERE event='*'
  ☐ Signup starts trend: COUNT(*) WHERE event='signup_started' COMPARE baseline

Outcome verdict logic (predetermined):
  If primary metric (completion) >= target AND guardrails OK
    → VALIDATED (this bet paid off)
  Else if primary >= 80% of target AND minor guardrail breach (< 15%)
    → MIXED (partial success, learn from it)
  Else if primary < 80% of target OR major guardrail breach
    → MISSED (didn't work, needs re-evaluation)
  If rolled back within 1h
    → SUPERSEDED (never got to measure, technical issue)
```

### B. Outcome Measurement Status (Real-Time)

```
⏱️ Measurement window: Aug 5 00:15 → Aug 6 00:15 (in progress, 6h elapsed)

Current metrics (as of now):
  Primary: Signup completion rate
    Current: 81% (vs. baseline 75%, target 85%)
    Status: ⚠️ Above baseline (+6 points), below target (-4 points)
    Trajectory: Trend is flat (not improving over last 2h)
    
  Secondary: Signup time
    Current: 2.4m median (vs. baseline 5m, target 2m)
    Status: ⚠️ Nearly at target, close enough
    Trajectory: Trend improving (down from 2.8m 2h ago)
    
  Guardrails:
    Signup starts: 95% of baseline (PASS, threshold is 80%)
    Support tickets: 105% of baseline (PASS, threshold is 110%)
    Error rate: 0.28% (PASS, threshold is 0.5%)
    
Preliminary verdict (at 6h, not final):
  If measurements hold: MIXED (primary below target but guardrails OK)
  If completion climbs to 85% in next 18h: VALIDATED
  If error rate spikes: Re-evaluate
  
Learn recommendation (not final):
  "Completion rate is close but not quite there. Launch was clean (guardrails 
   OK). Suggest: (1) Continue monitoring full 24h for final verdict, (2) If MIXED:
   investigate what blocked the last 4 points (was it mobile? specific step?),
   (3) Consider follow-up bet to push completion higher."
```

### C. Outcome Recording (Final)

```
✅ FINAL OUTCOME RECORDED: 2026-08-06 00:15 UTC

Verdict: MIXED (met 80% of primary target, guardrails OK)

Primary metric: Signup completion rate
  Baseline: 75%
  Target: 85%
  Actual: 81% (+6 points vs. baseline, -4 vs. target)
  Confidence: HIGH (measured from 12,500 signup events)
  
Secondary metric: Signup time
  Baseline: 5m median
  Target: 2m median
  Actual: 2.1m median (nearly hit target)
  Confidence: HIGH

Guardrails: ALL PASS
  Signup starts: 96% of baseline (threshold 80%) ✅
  Support tickets: 104% of baseline (threshold 110%) ✅
  Error rate: 0.31% (threshold 0.5%) ✅

Lessons learned (extracted from outcome):
  1. Signup completion improved (+6 points) shows design changes help
  2. But final 4 points still missing — investigate blockers:
     - Device: Mobile completion (78%) vs Desktop (87%) — mobile gap exists
     - Step: Personalization step has highest abandon rate (15% vs. others 5%)
     - Insight: Personalization field needs refinement for mobile
  
  3. Time improvement is strong — smooth flow achieved
  
  4. Guardrails all healthy — no regression, no new bugs
  
  5. Recommendation for next bet: 
     "Follow-up bet: 'Personalization field mobile-friendly redesign'
      Link this outcome as precedent (it's blocking the final completion points)"

Cross-impact assessment:
  ✓ No negative impact on related features (search, settings, etc.)
  ✓ No performance degradation (Lighthouse still 82+)
  ✓ No accessibility issues found post-launch (0 support tickets)
```

### D. Feedback Loop Back to Discover/Decide/Plan

```
Outcome linked to future bets:

Discover impact (next time similar pattern appears):
  New cluster: "Mobile personalization flow is slow"
  
  Learn says: "Related outcome (Aug 2026):
    Prior bet 'Onboarding redesign' was mixed: completion +6 points.
    Blocker: Mobile personalization had 15% abandon rate.
    Recommendation: Next personalization bet should focus on mobile UX."
  
  This outcome evidence should RANK HIGHER similar-to-mobile clusters
  (if validated-outcome exists for similar pattern, boost its score)

Decide impact (if follow-up bet proposed):
  New bet: "Mobile personalization field UX improvement"
  
  Learn provides: "Precedent outcome (linked): Prior bet on onboarding.
    Completion rate was limited by mobile personalization.
    This bet directly addresses the blocker.
    Expect: Completion rate 81% → 87% if this ships.
    Confidence: Medium (blocked blocker, but other unknowns remain)."

Plan impact (spec writing):
  New spec references: "Related outcome: Prior onboarding bet showed
    15% abandon on personalization step (mobile).
    Success criteria: Personalization completion > 90% on mobile.
    Reference: [Prior bet link, outcome data]"

Build impact (implementation context):
  New build inherits: "This bet fixes blocker from prior outcome.
    Tested on: iPhone SE (375px) — the device with highest abandon.
    Success metric: personalization_step_completion rate on mobile."
```

### E. Outcome Status Tracking (Audit Trail)

```
Decision: MIXED (outcome recorded, bet doesn't get retried)
  
  But: Learning extracted, influences ranking of FUTURE related clusters
  
  If verdict had been MISSED:
    Decision: Schedule re-evaluation
      "Completion rate missed target. Recommend:
       (1) Analyze why (was it the design? the copy? mobile-specific?)
       (2) Option A: Small follow-up bet to fix root cause
       (3) Option B: Different approach entirely
       (4) Set re-eval date: [60 days later]"
    
    Re-eval options in Discover:
      [ ] Create new bet "Fix personalization mobile UX" (follow-up)
      [ ] Create new bet "Alt approach: Streamlined signup" (pivot)
      [ ] Archive bet: "Deprioritize, focus on other initiatives"

  If verdict had been VALIDATED:
    Decision: Success (repeat if similar pattern appears)
      "This approach works. If similar pattern appears in Discover,
       rank it higher (precedent: this exact pattern validated +8 points)."
    
    Precedent for Discover:
      New cluster matching "friction in signup" → 
        Link: "Similar bet 'Onboarding redesign' was validated previously"
        Boost score: +10% (precedent bonus)

Status recorded: 2026-08-06 02:00 UTC
Owner: [Data analyst / PM]
Approved: [VP Product]
Audit trail: Permanent (decision cannot be revised)
```

---

## Loop Closure: How Outcome Feeds Back

```
Original journey:
  1. Discover: Scout finds 12 signals → cluster "Friction in onboarding"
  2. Decide: PM settles → bet approved (87% Critic confidence)
  3. Plan: Spec written (target: +10 points completion rate)
  4. Design: UI designed (mobile-first, dark mode)
  5. Build: Code built, tested (all AC pass)
  6. Ship: Live (deploy succeeds, alerts OK)
  7. Learn: Outcome recorded (MIXED: +6 points, mobile gap remains)

Feedback loop:
  Learn → Discover (next time):
    New cluster: "Users abandoning signup on mobile, personalization step"
    
    Learn info attached:
      "Related prior outcome (MIXED, 2026-08-06):
       Onboarding redesign was validated on desktop but limited on mobile.
       Blocker: Personalization field mobile UX (15% abandon rate).
       This cluster directly addresses the blocker.
       Estimated impact: +3-5 points completion if fixed.
       Confidence: Medium (based on prior outcome)"
    
    Cluster ranking boost:
      Prior: Score 7.2/10 (median priority)
      With precedent: Score 8.1/10 (higher priority)
      Result: Moves from #12 to #6 in queue (because we know it matters)

  Learn → Plan (if follow-up bet created):
    Spec references outcome: "Prior bet showed mobile personalization blocks 4 points.
    This spec targets that specific blocker. Success criteria: mobile completion > 90%.
    Reference: [Prior bet outcome link]"
    
    Estimate informed by precedent:
      Prior bet (onboarding): 1w design + 2w build = 3w total
      This bet (mobile UX refinement): Smaller scope → 3 days design + 1w build = ~2w
      (Learn feedback informed the estimate)

Loop validation:
  ✅ Outcome feeds back to Discover (future similar clusters ranked smarter)
  ✅ Outcome feeds back to Plan (estimates informed by precedent)
  ✅ Outcome feeds back to Build (knows what worked/didn't from similar past)
  ✅ Decision trail preserved (why we chose this → what happened → what to do next)
  ✅ Loop closes (product decisions get smarter with evidence)
```

---

## Success Metrics for Learn

1. **Outcome recording timeliness** — Recorded within 24h of measurement window close (current: 5-10 days)
2. **Measurement accuracy** — Learn queries validated (current: manual calculation = errors)
3. **Feedback routing** — Outcomes appear in future Discover/Plan (current: isolated)
4. **Precedent linkage** — Similar future bets see prior outcomes (current: "history repeats")
5. **Decision reversals** — If outcome is MISSED, follow-up investigation scheduled (current: forgotten)
6. **Lessons extraction** — Lessons captured and acted on (current: "we should do X next time" never happens)

---

## Summary: The Complete Seven-Station Loop

**All 7 stations working together**:

```
DISCOVER (sense signals, cluster patterns)
    ↓ [evidence travels: quotes, sources]
DECIDE (settle bet with Critic red-team, approve)
    ↓ [decision + constraints + success criteria]
PLAN (write spec, hand to Design)
    ↓ [acceptance criteria, success metrics, design constraints]
DESIGN (create wireframes, hand to Build)
    ↓ [design file, component specs, accessibility audit]
BUILD (implement, test, hand to Ship)
    ↓ [tested code, monitoring events, rollback plan]
SHIP (deploy, monitor, hand to Learn)
    ↓ [success metrics dashboard, outcome window, guardrails]
LEARN (record outcome, feedback loops)
    ↓ [outcome verdict, lessons learned]
    ↓ [LOOP CLOSURE: outcome feeds back to future Discover decisions]
```

**What makes the loop work**:
- ✅ Origin bet visible at every station (why are we doing this?)
- ✅ Information preserved as work moves forward (evidence never lost)
- ✅ Feedback routed back (issues escalate, outcomes inform future decisions)
- ✅ Decision trail permanent (audit trail of "who decided what, when, why")
- ✅ Loop closes (outcomes feed back to ranking of future bets)

**What closes the moat gap**:
- Not just that we run the loop (anyone can build waterfall)
- But that every outcome is recorded + feeds back + makes future decisions smarter
- Decision-and-outcome record compounds (the thing competitors can't backfill)
- Tamper-evident trail proves judgment (not just models)

---

## Next Steps

All seven stations now defined with:
1. Executive gaps identified
2. What each station must show (spec'd)
3. Workflows from user lens
4. Loop integrity checkpoints
5. Success metrics
6. Build order (P1/P2/P3)

**Condition for complete platform**: User/Agent can complete entire lifecycle (Discover → Decide → Plan → Design → Build → Ship → Learn) WITHOUT stepping outside Supaprod.

**Next phase**: Implement P1 for each station, verify loop integrity, prove end-to-end closure.
