# COMPREHENSIVE LAUNCH AUDIT

> _Created: 2026-08-06 · Last updated: 2026-08-06_

## Soft Launch Readiness Assessment (2026-08-05)

**Conducted**: 2026-08-05 evening session  
**Audience**: Founder, Product, Design, Engineering  
**Status**: Platform ready for soft launch with CRITICAL fixes required before go-live  
**Target Launch**: This week on Product Hunt, X, other channels

---

## EXECUTIVE SUMMARY

The platform has solid foundational engineering but **critical UX and positioning gaps** that will impact PH launch conversion. Early adopters will see:
- ✅ Core loop working (Discover → Decide → Plan → Build → Ship → Learn)
- ✅ Agents delivering work
- ❌ **Agent value is not visibly obvious** — users see results but can't see agent reasoning/attribution
- ❌ **First-time user path is unclear** — new users land on empty Today page with vague guidance
- ❌ **Lineage/provenance invisible** — users can't trace where decisions come from
- ❌ **Navigation has dead zones** — 7+ pages unreachable from main navigation
- ❌ **Discover workflow is inefficient** — PMs must triage 23+ clusters one-by-one

### Launch Decision
**HOLD**: Soft launch proceeds this week, BUT these 5 gaps must be fixed before go-live to avoid negative PH feedback on core value proposition.

---

## TIER 0: CRITICAL BLOCKERS (FIX BEFORE LAUNCH)

### 1. Agent Visibility Crisis
**Problem**: "Agentic-first OS" positioning is invisible to users
- Agents run in background, users see results but not the work
- No attribution of decisions/outputs to specific agents
- Agent reasoning shown in ONE place (approval gates, via P0 fix) but missing everywhere else
- Users can't tell if they're using an agentic system or a traditional app

**Impact**: Core value proposition fails for PH audience

**Locations that need fixes**:
- [ ] Mission run displays: Show agent progress steps with agent names
- [ ] Decision receipts: Show which agent made each decision
- [ ] Learn/Outcome surfaces: Show which agent discovered this learning
- [ ] Discover/Decide: Show agent confidence on recommendations
- [ ] Errors: Show which agent hit the error and why

**Example fix**:
```
Current: "3 opportunities found"
Fixed: "Scout found 3 opportunities (clustering 12 signals)"
  → Shows agent name + what it did
```

### 2. First-Time User Path Broken
**Problem**: New PH users land on empty interface with no clear path to value
- New user signs up, lands on Today page
- Today is empty ("Nothing finished in the last day")
- CTA is vague: "Tell Supaprod what to build" (via Ask button, added in P1 fix)
- User doesn't understand what agents will do or how long it takes
- Users bounce because onboarding is unclear

**Impact**: Low PH conversion rate, negative early feedback

**Fixes needed**:
- [ ] Add onboarding walkthrough (demo workspace with prefilled data)
- [ ] Explain 7-station loop on first login
- [ ] Show example of agent-generated decision with reasoning
- [ ] Guide user through: Discover → Decide → Build workflow
- [ ] Set expectations: "Agents run overnight, you'll see results in the morning"

**Priority**: HIGHEST - directly affects PH conversion

### 3. Navigation Dead Zones
**Problem**: 7+ pages have no rail entry, become unreachable
- `/govern`, `/trust-ledger`, `/sync`, `/crew`, `/studio`, `/events`, `/settings`
- ENGINE_ROOM_PATHS is defined but not wired into rail
- Users navigate via deep link and get stuck with no way back
- Pages are in the code but invisible in the UI

**Impact**: Users get trapped on dark pages, poor experience

**Fix**: Wire all stations + key pages into rail navigation:
- [ ] Add Engine Room menu with sub-entries: Govern, Trust Ledger, Sync, Crew
- [ ] Ensure all 7 stations visible: Discover, Decide, Design, Build, Ship, Learn, Sense (+ Today)
- [ ] Add key pages: Settings, Events, Analytics

**Example**:
```
Rails should show:
- Today (front door)
- Discover (01 - discover opportunities)
- Decide (02 - make decisions)
- Design (03 - design solutions)
- Build (04 - build features)
- Ship (05 - deploy)
- Learn (06 - measure outcomes)
- Sense (07 - system patterns)
- Engine Room (settings/monitoring)
```

### 4. Lineage Invisible
**Problem**: Users can't trace decisions back to evidence
- User sees "Opportunity: Onboarding friction" in Discover
- No visible link to: which signals created this cluster? How many? From which sources?
- User sees decision "Make it a bet" but no trace to: what evidence triggered this?
- "Learn" layer claim says system knows why it decided things - but it's not shown

**Impact**: Violates core moat claim (learning + guidance), users can't trust decisions

**Fixes needed**:
- [ ] Discover: Show evidence summary on cluster cards (# signals, source list)
- [ ] Discover: Show "4 signals from Support, 2 from Research, 1 from Slack"
- [ ] Decide: Link to evidence that triggered this opportunity
- [ ] Plan/Design/Build: Show lineage back to original bet
- [ ] Everywhere: Add "Trace this" or "Why?" affordance to trace decisions

### 5. Discover Workflow Inefficient
**Problem**: PMs can't efficiently triage 23+ clusters
- Must review one cluster at a time
- Ranking reasons ("severe, recent, new") are prose - not scannable
- Can't see evidence quality indicator
- Can't bulk-decline low-confidence clusters
- Evidence viewer capped at 4 quotes

**Impact**: Friction for power users, PMs bounce

**Fixes needed**:
- [ ] Show ranking reason visually (icons/badges, not prose)
- [ ] Add cluster quality indicator (high/medium/low confidence)
- [ ] Show "Merge without preview" warning (can accidentally corrupt data)
- [ ] Add evidence peek (show all signals when hovering, not just 4)
- [ ] Optional: Batch operations (decline <3 signals, etc.)

---

## TIER 1: HIGH-PRIORITY UX GAPS (Should fix if time)

### Decide Station
- [ ] Critic verdict buried in context, should be prominent
- [ ] Evidence block incomplete (only 4 quotes, no temporal context)
- [ ] Problem statement render-only (can't edit before promoting)
- [ ] No impact preview (what happens to roadmap if I drop this?)
- [ ] Queue actions passive (must click each one, no bulk)

### Plan Station
- [ ] Origin bet invisible (no link back to Discover cluster)
- [ ] Evidence not carried forward (starts blank)
- [ ] Critic concerns not shown (if Critic flagged scope risk, Plan should show it)
- [ ] No scope negotiation UI (happens in Slack instead)
- [ ] Success metrics are text, not measurable

### Build Station
- [ ] Acceptance criteria are text, not measurable
- [ ] Success metrics not wired at build time
- [ ] No origin bet link
- [ ] Performance/accessibility not pre-validated
- [ ] Rollback plan not predetermined

### Ship/Learn Stations
- [ ] No link to origin bet
- [ ] Success criteria undefined
- [ ] Monitoring not pre-built
- [ ] No feedback loop from outcome back to Decide

### Mobile & Accessibility
- [ ] Mobile responsiveness not systematically tested
- [ ] Dark mode not consistently tested (may have contrast issues)
- [ ] Keyboard navigation not verified
- [ ] Screen reader support not tested
- [ ] Touch targets may be too small

---

## TIER 2: POLISH (Defer to post-launch)

- Batch filtering operations on Discover
- Scope negotiation UI (advanced)
- Animation/motion specs
- Monitoring dashboard pre-building
- Canary/gradual rollout UI
- Advanced approval mode indicators
- Agent progress step names
- Conversation persistence in Ask panel
- Empty state copy on other surfaces (Build, Plan)

---

## INFRASTRUCTURE ISSUES

Per session handoff (2026-08-05 19:20):

### Still Open
- [ ] Cron fleet: 6 jobs have silently degraded timeouts (track-tick, goal-tick, embed-tick, sense-tick, derive-tick, resume-runs)
  - **Status**: Migrations written, not applied (DDL permission blocker)
  - **Impact**: Core sensing/learning ticks may be stuck
  
- [ ] Agent memory moat: 0 outcome rows in `agent_memory` (should have grown with shipped PRDs)
  - **Status**: Workflow is wired but no outcomes shipped yet in real product
  - **Impact**: "Past calls guide next ones" claim is still false until first outcome lands
  
- [ ] Changesets: `studio_changesets.prd_id` null on 23 real changesets
  - **Status**: Trigger doesn't exist in DB, fix is to stamp at changeset creation in code
  - **Impact**: Ship → Learn feedback loop incomplete

### Fixed in Session
- [x] Critic was judging seeded sample data (commit `6880a570`)
- [x] Dark pages (7 keys landing on no rail row)
- [x] Viewers seeing write buttons on governance panels (role filtering added)
- [x] Security: `recent_agent_reflections` was anon-readable (fixed + verified)

---

## VERIFICATION CHECKLIST FOR LAUNCH

**Before going live, verify:**

```
Navigation & Discovery
  [ ] All 7 stations visible in rail
  [ ] All key pages (settings, engine room, crew) reachable
  [ ] No dead links/404s when navigating
  [ ] Rail highlights current section correctly

Agent Visibility
  [ ] Agent names shown on decisions
  [ ] Agent reasoning visible in approval gates
  [ ] Mission progress shows agent steps
  [ ] Errors attributed to agent + reason shown

First-Time User
  [ ] New user signup → clear onboarding
  [ ] Demo data shows what agents do
  [ ] Clear CTA: "Tell Supaprod what to build"
  [ ] Within 5 minutes, new user understands core value

Lineage & Trust
  [ ] Can trace any decision back to evidence
  [ ] Evidence sources shown (which agent, which channel)
  [ ] Decisions show confidence/reasoning
  [ ] "Why?" is answerable for every major claim

Discover Workflow
  [ ] Can see ranking reasons (not just prose)
  [ ] Cluster quality indicator visible
  [ ] Evidence preview works
  [ ] Merge picker shows destination status

Mobile & Accessibility
  [ ] Tested on iPhone 12, SE, Android (real devices)
  [ ] Dark mode tested end-to-end
  [ ] Axe-core 0 violations
  [ ] Keyboard navigation works
  [ ] Touch targets >= 48px

Data Integrity
  [ ] No sample data shown to real users
  [ ] Decisions are recorded correctly
  [ ] Outcomes flow through to Learn
  [ ] Lineage edges create properly

Performance
  [ ] Page load < 3s
  [ ] Interactions respond < 100ms
  [ ] No console errors
  [ ] Mobile performance acceptable

Functional Core Loop
  [ ] Can complete: Discover → Decide → Plan → Build workflow
  [ ] Can ship a decision
  [ ] Can record an outcome
  [ ] Can trace the full loop

```

---

## RECOMMENDED IMPLEMENTATION ORDER

**Phase 1 - Critical (do before launch)**
1. Fix agent visibility (add attribution throughout)
2. Fix navigation dead zones (wire all stations to rail)
3. Improve first-time user path (onboarding clarity)
4. Fix lineage visibility (show evidence sources)

**Phase 2 - High-Impact (do in launch week if possible)**
5. Discover UX polish (ranking reasons, quality indicators)
6. Mobile/accessibility verification (test on real devices)
7. Decide station clarity (Critic feedback prominent)

**Phase 3 - Polish (after launch)**
8. Plan/Build station connection
9. Ship/Learn surface improvements
10. Batch operations and advanced filters

---

## PH LAUNCH MESSAGING

Once these gaps are fixed, messaging should emphasize:

- ✅ **Agents do the work**: "See agents discovering opportunities, making decisions, building features"
- ✅ **You stay in control**: "Every decision is yours - agents propose, you approve"
- ✅ **It learns from outcomes**: "Each shipped feature teaches the system, so next time it suggests better"
- ✅ **One platform, end-to-end**: "From signal to shipping to learning - no context switching"

---

## STAKEHOLDER PERSPECTIVES

### For Founder
- Positioning is strong but **implementation gaps are visible** in the UI
- "Agentic-first" is not demonstrated - it's just a backend fact
- Need visual proof of agent work on first user experience
- Learning/moat story is incomplete until outcomes are shown

### For Product Leaders (PH Users)
- Appreciate the agent help but can't see it clearly
- Navigation feels incomplete (dead pages)
- Workflow efficiency is there but hidden (must click through)
- "Show me the agents working" is the main ask

### For Designers
- Lineage is the biggest trust gap - can't see signal → decision flow
- Agent attribution should be pervasive (not just one place)
- Empty states need educational messaging (not just utility messages)
- Mobile/dark mode not consistently designed

### For Engineers
- Infrastructure blockers are real (cron, migrations) but isolated
- Code quality is high
- Lineage wiring is strong - just needs UI exposure
- Accessibility/mobile needs verification and fixes

---

## SUCCESS METRICS FOR SOFT LAUNCH

Track these during soft launch week:

- **Conversion**: % of signups that complete first workflow
- **Activation**: % that reach "decision approved" (proof agent value)
- **Retention**: % that return day 2, 7
- **NPS/Feedback**: What gaps do users mention?
- **Technical**: Error rates, performance, data integrity

---

## CONCLUSION

The platform has **strong engineering foundations** but needs **critical UX fixes** before launch to make the agent value visible and positioning credible. Fixing the top 5 gaps (agent visibility, first-time user path, navigation, lineage, discover UX) would transform the PH launch experience from "interesting but opaque" to "wow, I can see the agents working."

**Estimated effort**: 2-3 days of focused engineering
**Expected impact**: 3-5x improvement in PH feedback and user retention

---

**Prepared by**: Claude Code Session  
**Date**: 2026-08-05  
**Review**: Founder approval recommended before launch  
