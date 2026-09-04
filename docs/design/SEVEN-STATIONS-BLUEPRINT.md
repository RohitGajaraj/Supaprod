# The Seven Stations: End-to-End Loop Blueprint

> _Created: 2026-08-01 · Last updated: 2026-08-22_

> **INCOMPLETE AND PRE-MERIDIAN, 2026-08-22.** Its own header records only Discover and Decide as complete. It predates Meridian. For current station thinking read [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md) §5, which traces every station end to end.

## Complete User Journey from Signal to Outcome

> **Purpose**: Show how the seven stations chain together in the lived experience of a product team. Each audit (Discover, Decide, Plan, Design, Build, Ship, Learn) must justify itself on its own merits AND as part of the continuous loop. This document shows both.
>
> **Completed audits**: Discover ✅, Decide ✅  
> **Pending**: Plan, Design, Build, Ship, Learn (follow the same pattern)

---

## The Loop at a Glance

```
┌─→ DISCOVER (triage signals) ──→ DECIDE (judge bet) ──→ PLAN (write spec) ┐
│                                                                           │
│   Agents: Scout, Critic               Agents: Critic, Team Lead          │
│   User: "What patterns are real?"     User: "Should we build this?"     │
└─ LEARN (record outcome) ← SHIP (release) ← BUILD (code) ← DESIGN (wireframe) ← PLAN
    Agents: Learn                        Agents: Scribe, Architect          Agents: Designer, Chief of Staff

        ↑                 ↓
   [Feed outcomes                    [Feed signals
    back to ranking]                  forward to design]
```

**The continuous loop:**
- Signals push in from outside (Sense is dormant, waiting for connectors)
- Clusters surface patterns (Discover auto-reads)
- PM settles each pattern (Decide with Critic's red-team)
- Teams specify and design (Plan/Design in parallel or series)
- Ship runs the work (Build and Ship push to prod)
- Learn records what happened (outcome is fact)
- Outcomes re-score future bets (loop closes)

---

## The Seven Stations: Role, User, Design Lens, Key Gaps

### 1. DISCOVER — Signal Triage
**Role in loop**: Filter noise, identify patterns, prepare ranked clusters for judgment  
**User**: Product Lead / PM (individual contributor)  
**Entry point**: Signals land from connectors OR PM manually captures ("What did you hear?")  
**Exit point**: Ranked clusters ready for judgment  
**Agents**: Scout (reads for patterns), Researcher (optional, reads qualitative feedback)  
**User job**: One: **triage signals into patterns** (keep/merge/decline)  

**What's RIGHT**:
- One question at a time (triage mindset)
- Brain ranking (severity × recency × novelty)
- Evidence travels (shows 4 quotes, says "and N more")
- Capture is simple (paste 1 or 20 lines)
- Record shows prior outcomes (closed loop)

**Critical gaps**:
- No cluster quality badge (is this noise or signal?)
- Ranking reason invisible (why #2, not #3?)
- Merge without preview (bet status unknown)
- Evidence capped at 4 (can't spot-check quality)
- Bulk operations missing (death by a thousand clicks)

**Priority 1 build** (gates launch):
- Quality badge + ranking reason tags
- Evidence full viewer + per-signal remove
- Merge picker shows bet status + impact
- Editable summary with regenerate
- Filter bar + bulk operations

**Current audit status**: ✅ Complete (discover-station-audit.md + discover-prototype-specs.md)

---

### 2. DECIDE — Bet Judgment with Red-Team
**Role in loop**: Settle high-risk bets with Critic red-team, prepare for handoff to Plan  
**User**: Product Lead / PM (individual contributor) + VP/Head of Product (approver)  
**Entry point**: Ranked clusters from Discover (now called opportunities/bets)  
**Exit point**: Approved bets ready for spec/design work  
**Agents**: Critic (red-teams contradictions), Strategist (priority reranking)  
**User job**: One: **settle one ranked bet** (yes → spec, no → drop, maybe → park)  

**What's RIGHT**:
- One question, one call (no browsing)
- Critic verdict is visible + linked to full review
- Record speaks at decision moment (precedent with outcomes)
- Three terminal verbs (k/c/x keys, fast)
- Evidence travels (4 quotes + lineage viewer)
- Auto-rescore on outcomes (rank updates on its own)

**Critical gaps**:
- No bet quality badge (is this strong enough to design?)
- Ranking reason is prose (hard to scan 23 bets)
- Critic verdict small (should be prominent)
- Problem statement static (can't refine)
- No impact preview (what happens if I drop?)
- Evidence incomplete (no source breakdown, staleness)
- No approval workflow (implies solo decision)
- No decision thread (others' reasoning hidden)

**Priority 1 build** (gates launch):
- Bet quality badge + ranking reason tags
- Evidence with source breakdown + recency
- Editable problem + Regenerate
- Impact preview for actions
- Decision thread (who decided what, when, why)
- Link to full Critic review

**Current audit status**: ✅ Complete (decide-station-audit.md)

---

### 3. PLAN — Specification & Scope
**Role in loop**: Turn approved bets into detailed, scoped specs for design/build  
**User**: Product Lead / PM + Scribe (if org has one)  
**Entry point**: Approved bets from Decide (status = "design" or "build ready")  
**Exit point**: Specs with acceptance criteria, scope boundaries, success metrics  
**Agents**: Chief of Staff (if one exists), Scribe (drafts specs from cluster evidence)  
**User job**: **Turn a bet into a spec** with defined scope, constraints, success metrics  

**What's missing** (audit not yet written):
- Connection to cluster evidence (what signals led to this scope?)
- Connection to Critic's concerns (spec should address them)
- Scope negotiation (PM vs Design vs Engineering feasibility)
- Reference to precedent specs (similar bets, how did they scope?)
- Success metric definition (how will we know if this worked?)
- Cross-impact visibility (does this conflict with other in-flight bets?)
- Handoff clarity (who owns design? who owns build? timeline?)

**Key audit questions**:
- How does a spec know it came from THIS bet and not some random request?
- If Critic said "scope too broad," how does the PM refine the scope here?
- If we shipped a similar spec before, can we see what we learned?
- Is there a "spec vs design spec" distinction, or are they the same?

**Design audit scheduled**: Plan-station-audit.md (TBD)

---

### 4. DESIGN — Wireframes, Prototypes, UX Flow
**Role in loop**: Turn specs into designs (wireframes, prototypes, user flows)  
**User**: Designer / Design Lead  
**Entry point**: Specs from Plan (user-facing requirements)  
**Exit point**: Design docs, component specs, handoff to Build  
**Agents**: None directly (design is human-led, agents provide feedback)  
**User job**: **Turn a spec into a design** with interaction patterns, component specs, states  

**What's missing** (audit not yet written):
- Visual connection to the original bet (why are we designing this?)
- Constraints from Critic (edge cases, risk areas)
- Reference designs (similar products, proven patterns)
- Accessibility by default (WCAG 2.2 requirements embedded)
- Token usage (design system consistency, not custom styles)
- Feedback loop from Build (design gets remixed if build finds issues)
- Design review process (who approves the design?)
- Handoff clarity (component specs, CSS, states, animations)

**Key audit questions**:
- Is there a design-phase-approval gate, or does design go straight to build?
- How does a designer see the original customer feedback that led to the bet?
- If a designer finds "this won't work," does feedback go back to Decide?
- What's the relationship between design and the reference products (Sentry, Linear)?

**Design audit scheduled**: Design-station-audit.md (TBD)

---

### 5. BUILD — Implementation & QA
**Role in loop**: Turn designs into working code, tested and deployed ready  
**User**: Engineer / Engineering Lead  
**Entry point**: Designs + specs from Design/Plan  
**Exit point**: Code tested, ready for Ship (prod deploy)  
**Agents**: None directly (engineering is human-led, code review is peer-driven)  
**User job**: **Turn a design into working, tested code** that meets acceptance criteria  

**What's missing** (audit not yet written):
- Connection to original bet (why are we building this?)
- Feedback loop when build finds issues (remand to design/plan)
- Capacity visibility (how much runway before this blocks other builds?)
- Risk assessment (shipping this has what downside risk?)
- Testing strategy by requirement (which acceptance criteria need which tests?)
- Rollback plan (if this breaks, what do we do?)
- Telemetry planned (what metrics will we measure post-ship?)

**Key audit questions**:
- Does an engineer see the original customer feedback or just the spec?
- If build finds "this is too complex, can we simplify," who decides?
- Is there a build-phase-approval gate before Ship, or is Ship automatic?
- How does an engineer know this build is part of the continuous loop vs. a one-off request?

**Design audit scheduled**: Build-station-audit.md (TBD)

---

### 6. SHIP — Release & Monitoring
**Role in loop**: Deploy working code to production, monitor for issues, run rollback if needed  
**User**: DevOps / Release Engineer / On-Call Engineer  
**Entry point**: Tested code from Build  
**Exit point**: Code live in production, monitoring active, rollback ready  
**Agents**: Scribe (if one exists, logs the ship event)  
**User job**: **Ship code safely** with monitoring, rollback plan, and stakeholder comms  

**What's missing** (audit not yet written):
- Ship announcement (who needs to know? customers, support team, PMs?)
- Monitoring & alerts setup (what metrics, what thresholds?)
- Rollback readiness (can we undo in 5 minutes? 30?)
- Success criteria confirmation (does this ship meet the original bet's success metrics?)
- Issue triage SLA (if bugs appear, response time?)
- Outcome recording trigger (when does Learn officially start?)

**Key audit questions**:
- Does a release engineer see the original bet + success metrics, or just the code?
- If a ship breaks something, does feedback go to Design/Plan/Decide for re-evaluation?
- Is there a Ship-phase-approval gate, or automatic on green tests?
- When exactly does the outcome-recording clock start (at deploy or at monitoring time)?

**Design audit scheduled**: Ship-station-audit.md (TBD)

---

### 7. LEARN — Outcome Recording & Feedback
**Role in loop**: Record what happened (usage, impact, issues), feed outcomes back to ranking  
**User**: Data Analyst / PM / On-Call / Ops (whoever monitors)  
**Entry point**: Shipped code + monitoring data + customer feedback  
**Exit point**: Recorded outcomes (verdict: validated/missed/mixed), decision graph updated  
**Agents**: Learn (reviews outcomes, scores them, stores them)  
**User job**: **Record what happened** and let it re-score the ranking of future bets  

**What's missing** (audit not yet written):
- Outcome definition per bet (what counts as "validated"? what's success?)
- Outcome recording workflow (who records it? how? when? in what form?)
- Feedback loop to Decide (ranking re-scores automatically, but does the PM see why?)
- Feedback loop to Design/Plan (did we scope it right? learn for next time)
- Closed-loop evidence (if this bet validated, show it in Discover/Decide for similar bets)
- Learning extraction (what did we learn about this customer segment? this feature type?)
- Memory compaction (as outcomes pile up, what patterns emerge about our judgment?)

**Key audit questions**:
- Who records outcomes, and how? (Automated metrics? Manual PM judgment? Both?)
- If a shipped bet is validated, how does that evidence surface in Discover for similar patterns?
- If a shipped bet was missed, what feedback goes back to Decide (rank lower? why? what was wrong?)
- Does the Learn station show the original bet + decision + outcome on one screen (accountability)?

**Design audit scheduled**: Learn-station-audit.md (TBD)

---

## Cross-Station Insights: What Each Audit Must Show

### The "Why We Did This" Thread (end-to-end)
Every station audit should be able to answer: **"If I'm in this station, how do I know why I'm here?"**

- **Discover**: "This is a signal because a customer said it / a metric moved / a competitor announced it"
- **Decide**: "We're judging this bet because it's the strongest pattern we've seen"
- **Plan**: "We're speccing this because we decided yes, and here's what the Critic said to watch out for"
- **Design**: "We're designing this because the spec calls for it, and we need to handle these edge cases"
- **Build**: "We're building this because the design is ready, and here's what success looks like"
- **Ship**: "We're shipping this because tests passed, and here's the monitoring plan"
- **Learn**: "We're recording this outcome to close the loop and help future decisions"

**Missing in current product**: Almost every station loses the origin story. A designer doesn't see the customer feedback. An engineer doesn't see the Critic's concerns. An outcomes reviewer doesn't see the original bet title.

**Fix across all audits**: Every station must show:
1. The origin bet/signal (as a breadcrumb or full card)
2. The decision/reasoning that got us here (what was the Gate that decided this?)
3. The constraints/concerns from prior stations (Critic said X, Design said Y)
4. The success criteria we're working toward (not just the immediate output)

### The "Loop Integrity" Checkpoint (per audit)
Every station audit should identify:
1. **Upward linkage** (what comes before me, and am I connected to it?)
2. **Downward linkage** (what comes after me, and do I prep it properly?)
3. **Feedback loop** (if something downstream breaks, does it come back to me?)
4. **Evidence preservation** (do I keep the signals/reasoning that led to this stage?)

**Example**: Decide's audit found:
- ✅ Upward: Discover feeds ranked clusters (good connection)
- ❌ Downward: Plan should get approved bets, but no signal of "what's approved" (missing)
- ⚠️ Feedback: If Design finds scope is wrong, does it go back to Decide? (unclear)
- ✅ Evidence: Critic's review is stored and linked (good)

---

## The Information Flow (What Gets Passed Forward)

### Discover → Decide
```
✓ Cluster title, summary, evidence (4 quotes + lineage)
✓ Signal count + source diversity
✓ Cluster score (severity × recency × novelty)
✓ Precedent (prior similar clusters)
✗ MISSING: Quality/confidence badge (is cluster good?)
✗ MISSING: Full evidence list (only 4 quotes visible)
✗ MISSING: Source health (which connectors are healthy?)
```

### Decide → Plan
```
✓ Bet title, problem statement, Critic review
✓ Evidence (4 quotes + lineage)
✓ Ranking score
✗ MISSING: Explicit approval status ("this is approved to go to Plan")
✗ MISSING: Constraints from Critic ("watch for X, Y, Z")
✗ MISSING: Success criteria (how will we know if this worked?)
```

### Plan → Design
```
✓ Spec document (requirements, acceptance criteria)
✗ MISSING: Original bet title + problem statement
✗ MISSING: Customer evidence / customer quotes
✗ MISSING: Constraints from Critic
✗ MISSING: Reference designs (similar products handled this how?)
```

### Design → Build
```
✓ Design document (components, states, interactions)
✗ MISSING: Original bet + customer feedback
✗ MISSING: Success metrics (what are we measuring?)
✗ MISSING: Known risks (what could go wrong?)
✗ MISSING: Rollback plan if this breaks something
```

### Build → Ship
```
✓ Tested code (ready for deploy)
✗ MISSING: Original bet + success criteria
✗ MISSING: Monitoring/telemetry plan
✗ MISSING: Rollback procedure
```

### Ship → Learn
```
✓ Deployed code running in production
✓ Monitoring active
✗ MISSING: Success criteria for outcome recording
✗ MISSING: Original bet title / decision / problem
✗ MISSING: How to record outcome (manual? automated? both?)
```

### Learn → Discover (loop closure)
```
✓ Outcomes recorded (verdict: validated/missed/mixed)
✓ Re-scores ranking automatically
✗ MISSING: Evidence of outcome in future Discover clusters
✗ MISSING: Learning summary (what did we learn about this customer segment?)
```

---

## Audit Order & Implementation Sequence

### Phase 1: Foundation (gates the loop launch)
1. ✅ **Discover audit** — Complete (prioritize quality badge + ranking reason tags + evidence viewer + bulk ops)
2. ✅ **Decide audit** — Complete (prioritize quality badge + ranking reason tags + evidence breakdown + impact preview)
3. **Plan audit** — Pending (scope spec-writing workflow, connection to bet/evidence, cross-impact visibility)
4. **Design audit** — Pending (wireframe workflow, component specs, accessibility, design review gate)

### Phase 2: Through-line (build the loop)
5. **Build audit** — Pending (testing workflow, feedback loop for complexity, deployment readiness)
6. **Ship audit** — Pending (deployment workflow, monitoring setup, rollback readiness)
7. **Learn audit** — Pending (outcome recording, verdict scoring, feedback to Discover/Decide)

### Phase 3: Loop Closure (verify end-to-end)
- Verify information flow across all seven stations (origin bet visible everywhere)
- Verify feedback loops work (downstream issues route back to relevant station)
- Verify evidence preservation (no signal/reasoning is lost)
- Verify team accountability (every decision is recorded with who, when, why)

---

## Reference Products & Patterns to Lift (The Proven-Pattern Rule)

### Issue triage (Sentry issue stream)
- Signals group into issues
- Volume + distinct users separate
- Cluster quality is visible (cohesion, recency concentration)
- Most common outcome: merge/group similar issues
- ✓ We adapted this for Discover (KEEP)

### Priority queue (Linear triage inbox)
- One item in focus, queue visible
- Digit keys for quick disposition
- Ranking by priority + recency
- Bulk triage and filtering
- ✓ We adapted this for Decide (KEEP)

### Spec management (Jira/Notion)
- Requirements linked to epic/story/issue
- Acceptance criteria + metadata
- Review/approval gate before work starts
- Feedback loop if work finds issues
- ✗ We haven't lifted this for Plan (NEED)

### Design system (Figma/Storybook)
- Component library + design tokens
- Interaction patterns documented
- Review/approval before handoff
- Version history + rollback capability
- ✗ We haven't lifted this for Design (NEED)

### Release management (GitHub Releases, Deploy tooling)
- Deploy checklist + approvals
- Health monitoring + alerts
- Rollback procedure documented
- Ship announcement + comms
- ✗ We haven't lifted this for Ship (NEED)

### Outcome tracking (Analytics dashboards, post-mortems)
- Metric dashboard (user metrics, business metrics, system health)
- Outcome recording form (what happened, why, lessons)
- Linked to original decision (traceability)
- Learning extraction (patterns in outcomes)
- ✗ We haven't lifted this for Learn (NEED)

---

## Success Criteria for the Full Loop

### By station:
1. **Discover**: Triage 10 clusters in <5 min, spot quality issues before promotion
2. **Decide**: Settle 10 bets in <5 min, Critic feedback changes outcome >30% of time
3. **Plan**: Write spec in <1 hour, spec addresses Critic concerns
4. **Design**: Create design spec in <4 hours, passes accessibility audit
5. **Build**: Code passes tests + design review, ships within sprint
6. **Ship**: Deploy with zero downtime, monitoring active within 2 min of deploy
7. **Learn**: Record outcome within 48h of ship, outcome re-scores ranking

### Cross-station (loop integrity):
1. **Origin visibility**: Every worker can see why they're building this (customer feedback or metric)
2. **Decision traceability**: Every decision (approve/reject/defer) is on the record with who/when/why
3. **Feedback routing**: Issues downstream (design too complex, build blocked) route back to prior station
4. **Evidence preservation**: No signal/reasoning is lost as the bet moves through the loop
5. **Outcome closure**: Shipped bets are scored on real metrics, not project completion
6. **Loop re-entry**: Outcomes inform future Discover (similar patterns are ranked higher if validated before)

---

## Next Steps

1. **Complete remaining audits** (Plan, Design, Build, Ship, Learn) using the same structure:
   - Executive summary (strengths + gaps)
   - Deep dive per element
   - Enterprise workflows
   - Information architecture gaps
   - Loop lens (what's missing for integrity)
   - Full implementation specs
   - Build order + priority

2. **Implement Priority 1 for Discover** (gates the audit's usefulness):
   - Quality badge + ranking reason tags
   - Evidence full viewer
   - Bulk operations + filters
   - Editable summary

3. **Implement Priority 1 for Decide** (gates the audit's usefulness):
   - Quality badge + ranking reason tags
   - Evidence breakdown by source + recency
   - Editable problem statement
   - Impact preview for actions

4. **Verify loop integrity** across all seven stations:
   - Origin bet visible in every station
   - Decision trail preserved
   - Feedback loops routed correctly
   - Evidence never lost

---

## Appendix: Station Checklist for Audits (Template)

Every station audit should answer:

- [ ] **Who is here and why?** (user persona, entry point, exit point)
- [ ] **One thing it exists for?** (single purpose, never "browse" or "admin")
- [ ] **What's RIGHT that we must keep?** (3-5 things the design got right)
- [ ] **What's MISSING?** (3-5 critical gaps from power-user lens)
- [ ] **Why each element?** (justify from human/agent/designer perspective)
- [ ] **What's the Enterprise move?** (bulk ops? approval gates? evidence preservation?)
- [ ] **Loop integrity check:** (upward linkage? downward linkage? feedback routes? evidence preserved?)
- [ ] **Reference models** (what product did we adapt from?)
- [ ] **Spec per component** (before/after layouts, detailed component specs)
- [ ] **Build order** (P1/P2/P3, what gates the launch)
- [ ] **Success metrics** (how do we know this station is good?)

---

## Conclusion

The seven-station product is a **continuous loop**: signals → patterns → decisions → specs → designs → code → releases → outcomes → (back to scoring signals).

**What we have now**:
- ✅ Discover works (one question, triage mindset)
- ✅ Decide works (one call, Critic red-team)
- ⚠️ Plan/Design/Build/Ship are human-led with no special loop support
- ✗ Learn exists but is not wired as loop closure

**What the audits reveal**:
- Information gets lost as a bet moves through stations
- Feedback loops are broken (downstream issues don't route back)
- Evidence preservation is inconsistent
- Decision trail is not visible end-to-end

**What the builds (P1 for each station) will fix**:
- Origin bet visible everywhere (breadcrumb + title)
- Decision trail preserved and linked
- Feedback routed back to prior station
- Evidence never lost (can always ask "where did this come from?")
- Outcome recorded + loops back to ranking

This is the moat: not the loop itself (anyone can build a waterfall), but the decision-and-outcome record that makes the loop **continuously smarter about your product**.
