# Discover Station — Visual Prototype & Component Specs

> _Created: 2026-08-01 · Last updated: 2026-08-01_

## Overview

This document shows the proposed revised layouts for Discover, with before/after comparisons and component specifications. All changes follow the proven pattern rule (reference: Sentry + Linear) and the engine-room doctrine (complexity hides, outcomes surface).

---

## 1. The Ranking List — Before & After

### Current (Before)

```
The ranking
[Show all 23]

1 · Onboarding feels cold         · 12 signals · 2 sources · 3h ago
2 · Dark mode export broken        · 8 signals  · 1 source  · 1h ago
3 · PDF generation slow on mobile  · 5 signals  · 1 source  · 2d ago
4 · Search doesn't fuzzy match     · 4 signals  · 1 source  · 1d ago
5 · Signup form needs accessibility· 6 signals  · 2 sources · 5h ago
6 · API rate limits hit mid-batch  · 3 signals  · 1 source  · 20m ago

[Show all 23]
```

**Problems**:
- No visual way to see which clusters are strong vs. loose
- No explanation for ranking order (why #2, not #3?)
- Can't bulk-select or filter
- Status after decision is not visible (dismissed cluster stays grayed out or disappears)

### Proposed (After)

```
The ranking [All] [High confidence] [Urgent] [Novel] [Quiet sources]
                                                    Showing 6 of 23 

[☑] 👍  1 · Onboarding feels cold
        12 signals · scout + researcher via support, research
        🔴 Urgent (surge)
        [3h ago]

[☐] ⚠️  2 · Dark mode export broken
        8 signals · scout via support
        🟢 Novel (new pattern)
        [1h ago]

[☐] 👍  3 · PDF generation slow on mobile
        5 signals · analytics via monitoring
        🔔 Recurring (seen 2x before)
        [2d ago]

[☐] ❓  4 · Search doesn't fuzzy match
        4 signals · loose grouping (mixed topics)
        🔴 Urgent
        [1d ago]

[☐] 👍  5 · Signup form needs accessibility
        6 signals · scout + ux_researcher via support, ux-review
        🟢 Novel
        [5h ago]

[✓] 👍  6 · API rate limits hit mid-batch
        DECIDED 20m ago: added to "Q3 roadmap" bet
        3 signals · monitoring
        [archived, showing for context]

────────────────────────────────────────────────────────────────
2 selected · [Decline all] [Mark reviewed] [Merge to...] 

[Show all 23] — [Fewer]
```

**Improvements**:
- ✅ Quality badge (👍/⚠️/❓) shows cluster cohesion at a glance
- ✅ Ranking reason tag (🔴/🟢/🔔) explains why this one is ranked here
- ✅ Checkboxes enable bulk operations
- ✅ Decided rows show decision + target, then archive
- ✅ Filter bar lets PM scan by confidence level or urgency
- ✅ Multi-select shows bulk action bar at bottom

**Component specs**:
```
Quality badge rendering:
  👍 Strong match = cohesion > 85%, sources aligned on issue
  ⚠️ Loose grouping = cohesion 50-85%, mixed signals
  ❓ Scattered = cohesion < 50%, unclear pattern

Ranking reason tags (show strongest dimension):
  🔴 Urgent = severity score > 0.7 (high impact, recent)
  🟢 Novel = novelty score > 0.75 (new to workspace)
  🔔 Recurring = clustered before, now reappearing
  ⚡ Surge = recency spike (5+ signals in last 6h)

Row state after decision:
  Active (focus-able): normal opacity, clickable, can be dismissed
  Decided: 50% opacity, checkmark icon, decision label + target
  Dismissed: 30% opacity, not clickable, archived position
  On hover (decided): show option to "Reopen cluster" (undo dismiss)

Bulk actions (show when multi-select):
  [Decline all] — mark as not a pattern
  [Mark reviewed] — tag for audit trail
  [Merge to...] — opens picker showing open bets
  [Remove from workspace] — hard delete (confirmation required)
```

---

## 2. The Focused Gate — Before & After

### Current (Before)

```
┌─────────────────────────────────────────┐
│ Onboarding flow needs friction reduction│
│                                         │
│ 3 of 23 in the ranking.                │
│ 12 signals from 2 separate sources:    │
│ support, user-research.                │
│ First heard 2d ago, most recently 2h   │
│ ago, and it is new to this workspace.  │
│                                         │
│ Users report that initial signup       │
│ doesn't feel inviting and they skip    │
│ steps.                                  │
│                                         │
│ [Make it a bet] [Add to existing bet]  │
│ [More ≡]                               │
│   ├─ Not a pattern (3)                 │
│   └─ Draft the spec                    │
│                                         │
│ Record (if precedent exists)           │
│ ─────────────────────────────────────  │
│ You have reasoned this way before,     │
│ on "Improve onboarding UX", and it     │
│ paid off.                               │
│                                         │
└─────────────────────────────────────────┘
```

**Problems**:
- Gate shows facts but no visual hierarchy or summary
- Ranking reason is text, not scannable
- Summary is static (AI-generated, can't edit)
- Evidence is incomplete (only 4 quotes in context panel)
- No way to see "why is this #3?" beyond reading the Gate
- Spec draft is buried in menu

### Proposed (After)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ 👍 Strong match · 3 of 23 in ranking                       │
│                                                             │
│ Onboarding flow needs friction reduction                  │
│                                                             │
│ Ranking score breakdown:                                   │
│ 🔴 Urgent (recent surge) + 🟢 Novel (new pattern)         │
│ High severity + recent activity + not seen before = rank#3│
│                                                             │
│ The pattern (from 12 signals, 2 sources):                 │
│ Users report that initial signup doesn't feel inviting    │
│ and they skip steps.                                        │
│                                                             │
│ [Edit ✏️]  [Regenerate 🔄]  [Save]                        │
│                                                             │
│ ──────────────────────────────────────────────────────────│
│ Signal sources & contributor agents:                       │
│ • Support (6 signals): Scout agent, last 1h ago           │
│ • User research (6 signals): Researcher agent, last 2h ago│
│                                                             │
│ Timeline:                                                   │
│ First heard: 2 days ago · Most recent: 2h ago             │
│ Growth: 1-2 signals/day, accelerating last 8h             │
│                                                             │
│ Precedent (closed loop):                                   │
│ ✓ Similar pattern 2 months ago: "Improve onboarding UX"   │
│   Verdict: shipped, validated, +8% conversion             │
│   → This should re-validate that work                      │
│                                                             │
│ ──────────────────────────────────────────────────────────│
│ All 12 member signals (quality check):                     │
│                                                             │
│ "Customer says registration feels cold" — support         │
│ Remove [×]  1 hour ago                                     │
│                                                             │
│ "Signup wizard needs personality" — user-research         │
│ Remove [×]  2 hours ago                                    │
│                                                             │
│ "Users abandon form on step 2" — support                  │
│ Remove [×]  1 hour ago                                     │
│                                                             │
│ "Onboarding flow is uninviting" — analytics (inferred)    │
│ Remove [×]  30 minutes ago                                 │
│                                                             │
│ ... [6 more] ...                                           │
│ Show all 12 [expand]                                       │
│                                                             │
│ ──────────────────────────────────────────────────────────│
│ Actions:                                                    │
│                                                             │
│ [🎯 Make it a bet]    [➕ Add to existing bet]            │
│ [📋 Draft spec first]  [⋮ More options]                   │
│                                                             │
│ ──────────────────────────────────────────────────────────│
│ Next step:                                                  │
│ If you make a bet, the Critic will red-team it for        │
│ contradictions and precedent in 2-5 minutes. You'll see   │
│ the review in Decide, or get a notification.               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Improvements**:
- ✅ Quality badge + ranking reason visible at top
- ✅ Summary is editable inline with "Regenerate" button
- ✅ All signal sources with agent attribution shown
- ✅ Timeline shows growth curve (not just "first/last")
- ✅ Precedent shows full context (prior bet, verdict, impact)
- ✅ All 12 signals visible with ability to remove noise
- ✅ "Draft spec" is primary action, not buried
- ✅ Next step clearly stated (what happens after decision)

**Component specs**:
```
Gate layout zones:
  1. Header: quality badge + ranking position
  2. Title: cluster title (searchable, not editable)
  3. Summary: AI-generated but editable, with Regenerate button
  4. Metadata: sources + agents, timeline, growth curve
  5. Precedent Record: prior similar decisions + outcomes
  6. Evidence: all member signals with per-signal remove action
  7. Actions: primary verbs (make bet, add to bet, draft spec) + menu
  8. Next step: explain what happens after decision

Summary editing:
  - Click [Edit ✏️] to enter edit mode
  - Textarea with current summary, max 200 chars
  - [Save] commits the edit and stores on the cluster
  - [Regenerate 🔄] re-runs AI summarization
  - If edited, show "Edited by you" tag vs. "AI-generated"

Growth curve timeline:
  Show text or sparkline: "1 signal in first 48h, 4 in last 8h"
  This gives the PM a sense of urgency

Remove signal action:
  Each signal has small [×] icon on hover
  Click → confirmation toast "Remove from cluster?"
  After removal: cluster re-ranked, summary stays (manual edit wins)
  Removed signal goes back to "unclustered" pool
```

---

## 3. The Merge Picker — Before & After

### Current (Before)

```
Which bet does this belong to?

Its 12 signals will back that bet instead of starting a new one.

[Never mind]

Open bets
Dark mode fixes                  backlog
Q3 roadmap improvements         backlog
Mobile performance sprint       in_progress
Accessibility audit             backlog
API reliability work            in_progress
Search ranking improvements    backlog
Infrastructure debt reduction   backlog
Customer data export            in_progress
[showing 8 of 12 bets]
```

**Problems**:
- No indication of what status each bet is in (Design? Build? Shipped?)
- No preview of the merge impact (will it jump to #1?)
- No way to see the bet's current signal count or owner
- User chooses target sight-unseen

### Proposed (After)

```
Which existing bet should this belong to?

Merging 12 signals into a bet changes its ranking and re-evaluation.

📋 Dark mode fixes
   Status: Backlog (ready to design)
   Current signals: 8
   Owner: Sarah Chen
   Team: Product
   Impact: Adding 12 signals will move this from #4 to #2 in backlog
           Re-evaluation will be triggered.

📋 Q3 roadmap improvements
   Status: Backlog (ready to design)
   Current signals: 15
   Owner: Product team
   Impact: Adding 12 signals will keep this at #1
           (already high priority)

⚙️ Mobile performance sprint
   Status: Design (in progress, estimated 1 week)
   Current signals: 23
   Owner: Engineering team
   Impact: Merging now will re-queue this bet for re-evaluation
           ⚠️ Consider: Finish current design first?

📋 API reliability work
   Status: Build (40% complete)
   Current signals: 10
   Owner: Engineering team
   Impact: Will shift priorities mid-sprint (risky)
           💡 Consider: Create separate bet for post-launch?

🎉 Customer data export
   Status: Shipped (released 2026-07-15)
   Current signals: 5
   Impact: Cannot merge signals into shipped bets
           💡 Consider: Log as feature request for v2?

[Search for bet name or owner...]

[Show all 12 bets] ▼

[Merge to selected] [Cancel]
```

**Improvements**:
- ✅ Bet status clearly labeled (Backlog, Design, Build, Shipped)
- ✅ Impact preview ("will move from #4 to #2")
- ✅ Warnings for risky merges ("mid-sprint, risky")
- ✅ Guidance for shipped bets ("log as feature request instead")
- ✅ Search/filter for finding the right bet
- ✅ Owner and team info for context

**Component specs**:
```
Merge picker card layout (per bet):
  [icon] Title
  Status: [tag with color/state]
  Signals: X current + Y incoming = Z total
  Owner: name
  Team: department
  Impact: [impact text or emoji warning]
  
Status tags + colors:
  🟢 Backlog (ready): low risk to merge
  🟡 Design (in progress): medium risk, warns "re-evaluation triggered"
  🔴 Build (in progress): high risk, warns "changes priorities mid-sprint"
  ⚫ Shipped (complete): shows warning "log as feature request instead"
  
Impact text examples:
  ✓ "Adding 12 signals will move this from #4 to #2 in backlog"
  ⚠️ "Re-evaluation will be triggered immediately"
  🚫 "Cannot merge into shipped bets; log as feature request instead"
  💡 "Consider: Finish current design sprint first"
  
Search functionality:
  Search bar at top: "Find bet..."
  Filters by: bet title, owner name, status
  Shows count: "Showing 4 of 12 bets"
```

---

## 4. The Context Panel — Before & After

### Current (Before)

```
Reading for you
[Scout icon] Scout Researcher
             last read 2h ago

What is feeding this
Support · 5 in 7d, last 14m ago
User Research · 3 in 7d, last 1h ago
Analytics · quiet for 7d, sent 12 before that
[+2 more sources]

What backs this
"Customer says dark mode export is broken" (support, 2h ago)
"Export PDF missing in dark mode" (slack-export, 1h ago)
"PDF rendering broken overnight" (analytics, 30m ago)
"Dark mode seems incomplete" (product-review, 4h ago)
[+8 more say the same thing]
```

**Problems**:
- Agent naming is confusing ("Scout Researcher" reads as a title)
- Source health is shown but not actionable ("quiet for 7d" is passive)
- Evidence is capped at 4, no way to browse all
- No way to remove noisy signals
- No agent attribution per signal (which agent found this?)

### Proposed (After)

```
Sensing for this workspace
👁️ Scout
   Role: Signal discovery agent
   Last read: 2 hours ago
   Status: Idle (waiting for next batch to cluster)
   Frequency: Reads every 1-2 hours when signals arrive

Signal source health
🟢 Support
   Active (healthy)
   5 signals in 7d, last signal 14m ago
   Current rate: ~1 per day, on pace

🟢 User Research  
   Active (healthy)
   3 signals in 7d, last signal 1h ago
   Current rate: ~0.5 per day

🟡 Analytics (monitoring)
   Quiet for 7 days
   Was: 12 signals in prior 30d
   Last signal: 2026-07-25 (7d ago)
   → Check Settings > Connections if unexpected
   → Is monitoring connector still enabled?

🟡 Slack (export channel)
   Slowing down
   2 signals in 7d, last signal 1d ago
   Was: 5+ per week in early July
   → May indicate user engagement drop in that channel

✓ All enabled connectors are reporting

Evidence from this cluster (12 total)

Scout via Support, 2h ago
"Customer says dark mode export is broken"
[Remove] [Flag as helpful] [Learn more]

Researcher via User Research, 1h ago  
"Export PDF missing in dark mode"
[Remove] [Flag as helpful] [Learn more]

Scout via Analytics, 30m ago
"PDF rendering broken overnight in system"
[Remove] [Flag as helpful] [Learn more]

Researcher via Product Review, 4h ago
"Dark mode seems incomplete, export function gone"
[Remove] [Flag as helpful] [Learn more]

... [8 more signals] ...

[Show all 12] ▼

Recent action
✓ Made a bet: "Dark mode fixes" carrying 12 signals
   2 minutes ago
   [View in Decide] [Undo]
```

**Improvements**:
- ✅ Agent role is clear ("Signal discovery agent")
- ✅ Source health is actionable ("Is connector enabled?" + link)
- ✅ All signals visible with per-signal actions
- ✅ Agent attribution shown ("Scout via Support")
- ✅ Remove action for each signal (clean up noise)
- ✅ Recent action summary with undo option

**Component specs**:
```
Agent card layout:
  [icon] Name
  Role: [description]
  Last active: [relative time]
  Status: [Idle/Reading/Paused]
  Frequency: [how often it reads]

Source health indicator:
  🟢 Active: signals in last 48h
  🟡 Slowing: signals in last 7d but not 48h
  🟡 Quiet: no signals in last 7d
  🔴 Disabled: connector paused by user
  
Per-source metadata:
  Count: X in 7d
  Frequency: ~Y per day
  Trend: "increasing", "steady", "declining"
  Action link: "Check Settings" if unexpected

Signal card layout:
  [Agent icon] Agent name via Source, timestamp
  "Signal text"
  [Remove ×] [Flag 👍] [More ⋮]

Action feedback:
  After user decides, show recent action with [Undo] option
  "✓ Made a bet: 'Dark mode fixes' carrying 12 signals (2m ago)"
```

---

## 5. Spec-Draft Workflow — Before & After

### Current (Before)

```
Focused cluster showing
[Make it a bet] [Add to existing bet] [More ≡]
                                        ├─ Not a pattern (3)
                                        └─ Draft the spec

User clicks "Draft the spec" → navigates to /plan/spec (losing context)
Returns from /plan/spec, must re-focus cluster manually
```

**Problems**:
- Spec draft is hidden (signals it's optional when it's key)
- Navigating away loses context
- No clear workflow for "cluster → spec → promote"

### Proposed (After)

```
Focused cluster showing
[🎯 Make it a bet]    [➕ Add to existing bet]
[📋 Draft spec first]  [⋮ More options]
                        ├─ Not a pattern (3)
                        └─ Un-cluster
                        
OR:

Modal decision tree on "Make it a bet":
┌──────────────────────────────────────────┐
│ Turn cluster into a bet?                 │
│                                          │
│ This cluster (12 signals) is ready to   │
│ become a bet and go through red-team.   │
│                                          │
│ Two paths:                               │
│                                          │
│ [🎯 Make a bet directly]                 │
│     (Go to Decide, Critic reviews it)   │
│                                          │
│ [📋 Draft a spec first]                 │
│     (Go to Plan, write the spec,        │
│      then move to Decide)                │
│                                          │
│ [➕ Add to existing bet]                 │
│     (Merge signals into open bet)       │
│                                          │
│ [Cancel]                                 │
└──────────────────────────────────────────┘

After either choice:
  → Spec page shows: "← Back to cluster (12 signals)"
  → Return link preserves scroll position in ranking
```

**Improvements**:
- ✅ Spec draft is visible and primary (not buried)
- ✅ Workflow is clear at decision moment
- ✅ Return link preserves context
- ✅ Three paths shown equally (make bet, draft spec, add to existing)

---

## 6. Full Page Layout — Before & After

### Current (Before)

```
┌───────────────────────────────────────────────────────────────────────┐
│ 23 clusters are waiting on a call. Ordered by how severe, how recent, │
│ and how new to the record each one is.                                │
│                                                                        │
│ ┌─────────────────┐  ┌──────────────────────┐  ┌────────────────────┐│
│ │  The ranking    │  │   Onboarding...      │  │  Reading for you   ││
│ │                 │  │   3 of 23 in ranking │  │  Scout Researcher  ││
│ │ 1 · Onboarding  │  │   12 signals, 2 src  │  │  last read 2h ago  ││
│ │   12s · 2s · 3h │  │   First 2d ago...    │  │                    ││
│ │                 │  │   New to workspace   │  │  What is feeding   ││
│ │ 2 · Dark mode   │  │   Summary text.      │  │  Support · 5 in 7d ││
│ │   8s · 1s · 1h  │  │                      │  │  Research · 3 in   ││
│ │                 │  │ [Make] [Add] [More] │  │                    ││
│ │ 3 · PDF speed   │  │                      │  │  What backs this   ││
│ │   5s · 1s · 2d  │  │                      │  │  "Quote 1" (src, h) ││
│ │                 │  │                      │  │  "Quote 2" (src, h) ││
│ │ [Show all 23]   │  │                      │  │  [+8 more]         ││
│ │                 │  │                      │  │                    ││
│ └─────────────────┘  └──────────────────────┘  └────────────────────┘│
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Capture what you heard                                            │ │
│ │ [Textarea with "What did you hear..." placeholder]                │ │
│ │ [Capture]                                                         │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ The boundary                                                      │ │
│ │ Read new signals without asking                                   │ │
│ │ [Toggle On/Off]                                                   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

### Proposed (After)

```
┌───────────────────────────────────────────────────────────────────────┐
│ 23 clusters waiting. 7 signals not yet clustered. Last sense: 14m ago │
│ ✓ Scout reading · ✓ 4 active sources · 🟡 Analytics quiet 7d        │
│ Triage signals into patterns: keep it, merge it, or decline it.      │
│                                                                        │
│ ┌──────────────────────┬──────────────────────────┬──────────────────┐│
│ │ The ranking          │  Focused cluster         │  Context & clues ││
│ │ [All][High][Urgent]  │                          │                  ││
│ │ [Novel][Quiet]       │  👍 Strong match         │  Sensing for WS  ││
│ │ Showing 6 of 23      │  3 of 23 in ranking      │  Scout           ││
│ │                      │  [Ranking breakdown]     │  Last read 2h ago││
│ │ [☑] 👍 1 · Onboard   │  🔴 Urgent + 🟢 Novel   │                  ││
│ │      12s · scout+res │  = #3 score              │  Source health   ││
│ │      🔴 Urgent       │                          │  🟢 Support 14m  ││
│ │      [3h ago]        │  "Signup feels cold"    │  🟢 Research 1h  ││
│ │                      │  [Edit] [Regenerate]    │  🟡 Analytics 7d ││
│ │ [☐] ⚠️ 2 · Dark      │                          │  → Check enabled?││
│ │      8s · scout      │  Signals & sources:     │                  ││
│ │      🟢 Novel        │  Support (6): Scout      │  Evidence        ││
│ │      [1h ago]        │  Research (6): Researcher│  "Dark export   ││
│ │                      │                          │   broken"        ││
│ │ [☐] 👍 3 · PDF       │  Timeline:              │  Scout, 2h ago   ││
│ │      5s · analytics  │  First 2d ago, surge    │  [Remove]        ││
│ │      🔔 Recurring    │  last 8h                │                  ││
│ │      [2d ago]        │                          │  "Export PDF    ││
│ │                      │  Precedent:             │   missing DM"    ││
│ │ [☐] ❓ 4 · Search    │  ✓ Similar: "Improve    │  Researcher, 1h  ││
│ │      4s · loose      │  onboarding UX"         │  [Remove]        ││
│ │      🔴 Urgent       │  Shipped, validated     │                  ││
│ │      [1d ago]        │  +8% conversion         │  [Show all 12]   ││
│ │                      │                          │                  ││
│ │ [☐] 👍 5 · Signup    │  Actions:               │  Recent action   ││
│ │      6s · scout+ux   │  [Make it a bet]        │  ✓ Made a bet    ││
│ │      🟢 Novel        │  [Add to existing]      │  2 min ago       ││
│ │      [5h ago]        │  [Draft spec first]     │  [Undo]          ││
│ │                      │  [More ⋮]               │                  ││
│ │ [✓] 👍 6 · API limit │                          │                  ││
│ │      DECIDED 20m ago │  Next step:             │                  ││
│ │      → Q3 roadmap    │  Critic will red-team   │                  ││
│ │      [archived]      │  See review in Decide   │                  ││
│ │                      │                          │                  ││
│ │ ──────────────────── │ ──────────────────────── │                  ││
│ │ 2 selected          │                          │                  ││
│ │ [Decline all] [Mark │                          │                  ││
│ │  reviewed] [Merge]  │                          │                  ││
│ │                      │                          │                  ││
│ │ [Show all 23]       │                          │                  ││
│ │                      │                          │                  ││
│ └──────────────────────┴──────────────────────────┴──────────────────┘│
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Capture what you heard                                            │ │
│ │ [Textarea: "What did you hear..."]                                │ │
│ │ [Capture]                                                         │ │
│ │ [Cluster 7 loose signals] (shown if unclustered exist)            │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ The boundary (governance)                                         │ │
│ │ Read new signals without asking                                   │ │
│ │ On. Last read 14m ago, clusters without waiting.                 │ │
│ │ [Toggle: On/Off]                                                  │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

**Key improvements**:
- ✅ Headline shows health status (not just count)
- ✅ Three-column layout is tighter, more scannable
- ✅ Ranking filters visible at top
- ✅ Bulk actions shown when items selected
- ✅ Decided rows show decision + target (archived at bottom)
- ✅ Quality badges and ranking reason tags on every row
- ✅ Context panel shows agent + source health + all evidence
- ✅ Gate shows full story (ranking reason, precedent, all signals, next step)
- ✅ Capture + boundary always available

---

## Implementation Priority & Effort Estimate

### Phase 1: Structure & Ranking (P1 — gates launch)
1. **Ranking list visual improvements** (2-3 days)
   - Add quality badge component
   - Add ranking reason tags (🔴/🟢/🔔/⚡)
   - Add checkboxes + bulk action bar
   - Add filter bar ([All]/[High]/[Urgent]/etc.)
   - Improve decided row treatment (archive, undo)

2. **Gate enhancements** (2-3 days)
   - Add quality badge at top
   - Expand summary to editable field + regenerate
   - Show ranking reason breakdown
   - Add agent attribution per signal
   - Show all signals (not just 4)
   - Add remove-from-cluster per signal
   - Make spec draft a primary verb

3. **Context panel polish** (1-2 days)
   - Clarify agent naming
   - Show source health states
   - Expand evidence viewer
   - Show recent action + undo
   - Add "Check connector" hints

### Phase 2: Workflows (P2 — power-user)
4. **Bulk operations** (2-3 days)
   - Implement bulk decline/mark/merge
   - Keyboard shortcuts (Shift+D for chain triage)
   - Progress summary

5. **Merge picker redesign** (2 days)
   - Show bet status + owner
   - Impact preview
   - Warnings for risky merges
   - Search/filter

6. **Spec-draft workflow** (1 day)
   - Make primary affordance
   - Add return link + context preservation

### Phase 3: Loop integrity (P3 — later)
7. **Closed-loop feedback** (2-3 days)
   - Show shipped outcomes in Record
   - Show "relates to shipped bet X" cross-links

---

## Accessibility & Voice Considerations

### Naming
- "Quality badge" → visual only, not screen-reader jargon
- Tooltip: "Strong match: signals align across multiple sources"
- "Ranking reason" → explain in Gate, not as cryptic emoji

### Keyboard
- `j`/`k` to move focus in ranking (already done ✓)
- `1`/`2`/`3` for current cluster decisions (already done ✓)
- `Shift+D` to decide-and-next (new)
- `f` to focus search/filter (new)
- Tab through bulk-selected rows and show count

### Voice
- Never use: "percentage", "ML score", "confidence value"
- Always use outcome language: "strong pattern", "unclear pattern", "mixed signals"
- Action language: "make a bet", not "promote", not "accept"
- Handoff language: "Critic will review it" (agent doing the work), not "will be sent to review"

---

## Success Metrics

Once this redesign ships:

1. **Triage speed** — 10 clusters triaged in <5 minutes (currently ~7-10 min each)
2. **Bulk action adoption** — % of triages using bulk operations (target: >40%)
3. **Precedent hit rate** — % of triages where Record showed prior decision (target: >60%)
4. **Merge success** — % of promoted clusters that remain single bets vs. later merged (target: <25% merged post-promotion)
5. **Signal removal rate** — % of clusters where PM removed noisy signals (target: ~15-20%, healthy)
6. **Spec draft path** — % of clusters that go through draft-spec vs. direct-promote (target: >50%)

---

## Next: Decide Station Audit

Once Discover is complete, the audit moves to **Decide** — where ranked opportunities become reasoned bets with Critic red-team review and precedent checking.
