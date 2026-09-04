# Design Audit: Decide Station

> _Created: 2026-08-01 · Last updated: 2026-08-01_

## From Power-User & Enterprise Product Lens

> **Context**: Decide is where ranked opportunities become reasoned bets with Critic red-team review and precedent checking. The PM's job here is ONE: settle the strongest bet with the account's own record in front of them. This audit evaluates the current surface against what a serious product leader needs to make confident, accountable decisions end-to-end.
>
> **Session**: 2026-08-01 Design Phase · Conducted from: head-of-digital-product lens (Vercel / Stripe / Google design precedent)
>
> **Note**: Decide is more mature than Discover (it has one question, shows precedent, has working verbs). This audit focuses on what's MISSING to make it enterprise-complete.

---

## Executive Summary: Strengths & Gaps

### ✅ What Decide Gets Right

1. **One question, one call** — The focused bet is the only thing that matters; queue is supportive context
2. **The Record speaks at the moment of decision** — Prior similar decisions with outcomes appear right when the PM needs them (not buried in Engine Room)
3. **The Critic red-team is visible** — Shows verdict + confidence, named by agent
4. **Three terminal verbs** (`k`/`c`/`x` keys) — Draft spec, challenge, drop (fast, keyboard-driven)
5. **Evidence travels with it** — Shows 4 quotes, says "and N more," has a lineage viewer button
6. **Queue ranking is stable** — Selected bet stays in list, shows ratio (3 of 23)
7. **Precedent linking** — Shows what the record says about similar bets + outcomes
8. **Auto-rescore on outcomes** — Queue re-ranks when new data lands; user sees "re-ranked 2m ago"

### ⚠️ What reads as incomplete or missing

1. **No cluster quality/confidence indicator** — The queue shows ranking position but no sense of "is this a strong opportunity or risky?"
2. **Ranking reason is text, not scannable** — "High severity, recent surge, not seen before" is in prose under "Why it ranks here," requires reading
3. **Critic verdict is buried in context** — Shows "Critic says 'validated' at 87% confidence" but no visual scannability in the queue
4. **Status menu is one click away** — "Draft spec", "Challenge it", "Drop it" are verbs, but "Park it", "Rescope it", "Archive it" are hidden in a status menu
5. **No impact preview for decisions** — "If I drop this, what happens to the roadmap/team capacity/other bets?"
6. **Problem statement is render-only** — AI-generated problem shown but can't be refined/edited before moving to Plan
7. **The evidence block is incomplete** — Shows 4 quotes but doesn't show:
   - Which signals are STRONGEST (confidence/priority per signal?)
   - Which sources contributed (all from support? split across 3 channels?)
   - Whether evidence is RECENT or STALE (1 signal 6 months ago, 3 signals last week?)
8. **No way to add signals manually** — A PM might say "we also heard X from a customer call" but can't add it here
9. **Queue actions are passive** — Must click each bet to take action; no bulk operations
10. **No view of what others decided** — "Last decided by: Chief PM" shown, but no link to their reasoning or comment thread
11. **Rescore explanation is weak** — "Re-ranked 2m ago off a recorded outcome" but no visibility into what outcome triggered it
12. **No approval workflow** — Implies the PM decides alone, but in real organizations there's often "need approval from VP before dropping"
13. **Moved to status has no preview** — Moving a bet to "Design" has no way to see what that means (estimated sprint? handoff to designer?)

---

## Part 1: Deep Dive — What Each Element Should Communicate

### A. The Headline & Scoring Context (top of page)

**Current**: "23 bets ranked, strongest first. Re-ranked 2m ago, on its own, off a recorded outcome."

**What it needs to say** (power-user reading):
- Count of bets in queue (✓)
- What triggers re-ranking (outcome data, new signals) (✓)
- When the last re-rank happened (✓)
- BUT missing: How confident is the ranking? (all bets solidly different, or are top 3 within noise of each other?)

**Spec**: Add a small note: "Ranking confidence: high" or "some bets are close in score" to help the PM understand whether position #2 is clearly second or interchangeable with #1.

---

### B. The Ranked Queue (left column or scrollable block)

**Current**:
```
1 · Onboarding flow needs redesign · validated · 3 of 23
2 · Dark mode export broken · not reviewed yet · 2 of 23
3 · PDF generation slow on mobile · mixed result · 1 of 23
```

**What's missing**:

1. **No visual confidence/strength indicator on the bet**
   - A PM scanning 23 bets has no way to spot "which ones are solid vs. risky?"
   - Critic verdict helps (validated/pending/missed) but doesn't show bet QUALITY itself
   - Better: show a small confidence badge or gradient color showing bet robustness
   - Candidate: a small dot or bar under the title that shows signal count + source diversity

2. **Ranking reason is invisible**
   - Position #3 vs #4: why is one above the other?
   - Current Gate explains in prose ("high severity + recent surge") but the queue doesn't hint
   - Better: show a small tag per bet in the queue: "🔴 urgent" or "🆕 new bet" or "✓ validated"
   - This makes the ranking legible without showing percentages

3. **Critic verdict is small**
   - Shows "validated" or "not reviewed" but very small
   - For a power-user who trusts the Critic as a second opinion, verdict should be prominent
   - Better: show Critic verdict as a colored badge or pill: "🟢 Validated" / "🟡 Needs Review" / "🔴 Mixed"

4. **No quick action affordances**
   - Must click → opens Gate → then press `k`/`c`/`x` to act
   - For a PM triaging 23 bets, this is slow
   - Better: show keyboard shortcut hints on hover: "[k] spec [c] challenge [x] drop"
   - Or: quick-action icons next to each bet (spec, challenge, drop, menu)

5. **Status after decision is missing**
   - A user drops bet #5, then scrolls back up
   - The list still shows it, but nothing visually indicates it's dropped/done
   - Better: When a bet is archived/dropped/moved, fade it with a label or remove it immediately
   - Show a summary: "23 bets: 5 decided, 18 waiting"

6. **No filter or search**
   - A PM with 23 bets might want to see "only pending Critic review" or "only new bets"
   - Currently must scan all 23 or hide the list
   - Better: add a filter bar: [All] [Pending review] [Validated] [Needs work] [My decisions]

7. **No bulk action affordance**
   - Zero way to "mark all 'validated' bets as ready for design" or "drop all older than 30d"
   - Better: checkboxes on rows + bulk menu ("Move all to...", "Archive all", etc.)
   - This is enterprise-grade operator tool

**Spec**:
```
[Queue row layout revision]
- Add small visual badge/dot to show bet strength/confidence
- Add small tag showing rank reason or Critic verdict (🟢 Validated, 🟡 Needs review, 🔴 Mixed)
- Show keyboard shortcuts on hover: "[k] spec [c] challenge [x] drop"
- Fade or remove row immediately after decision, with confirmation
- Add filter bar: [All] [Pending review] [Validated] [Needs work] [Older than 30d]
- Add checkboxes; selected bets show bulk actions: "Move to...", "Archive all", "Mark reviewed"
```

---

### C. The Focused Gate (center column)

**Current state**:
```
[Onboarding flow needs redesign]

3 of 23 in the ranking.
Users need a warmer, more inviting signup experience that doesn't feel corporate.
Critic says the scope might be too broad and the metric unclear.

[Draft spec (k)] [Challenge it (c)] [Drop (x)]
```

**What's missing**:

1. **No bet quality/confidence badge**
   - The Gate shows facts but no sense of "is this a strong bet to invest in?"
   - Better: add a badge showing bet strength ("🟩 Solid bet" / "🟨 Risky" / "🟥 Needs work")
   - Based on: signal count, source diversity, Critic confidence, precedent outcome

2. **Ranking reason is prose, not visual**
   - Current: "High severity, recent surge, not seen before" (text)
   - Better: visual breakdown showing which dimension ranks it high
   - Candidate: a small chart or inline breakdown: "🔴 Urgent (recent surge) + 🟢 Novel (new pattern) = #3"

3. **Problem statement is static**
   - The problem "Users need warmer signup" is AI-generated but unchangeable
   - A PM might think it needs refinement before moving to Plan
   - Better: make problem editable inline with "Regenerate" button
   - Store the edited version so it travels to Plan/Spec

4. **Critic summary might be incomplete**
   - Shows "Critic says scope is too broad and metric is unclear"
   - But no link to the full Critic review or reasoning
   - Better: make summary clickable → opens full review with evidence
   - Or: add a "Read full review" link to the Critic's work

5. **No impact preview for decisions**
   - Pressing `k` (draft spec) has no preview of what happens next
   - "If I draft this, how much work? What's the timeline? Who owns it?"
   - Better: show brief next-step preview: "Drafting will create a spec in Plan. Next: handoff to Design (est. 1 week). Owner: TBD."

6. **Evidence is capped and incomplete**
   - Shows 4 quotes ("and N more")
   - But doesn't show: Are these signals fresh or stale? From diverse sources or all from support?
   - Better: add an evidence view showing all signals with:
     - Recency (1 week old vs. 6 months)
     - Source (split by support/research/analytics)
     - Strength/priority (customer complaint vs. nice-to-have)
   - Let PM spot-check quality before committing to a spec

7. **No way to add or refine evidence**
   - A PM might say "we also heard X in the user interview" but can't add it
   - Better: show an "Add evidence" button (pulls from recent signals or manual entry)
   - This lets the PM strengthen the case before spec

8. **No approval workflow**
   - Implies the PM can drop a major bet alone
   - But in real orgs: "drop requires VP sign-off" or "design phase needs design lead approval"
   - This is governance, belongs in Engine Room settings, but should show here
   - Better: show a gate/note if this decision requires approval ("⚠️ Dropping requires VP approval")

9. **Moved to status has no preview**
   - `[Draft spec]` → creates spec and navigates away
   - But no way to preview what "Design" or "Build" phase actually means
   - Better: show status options as a menu with brief descriptions:
     - "Backlog (ready)" → not started, queued
     - "Design (in progress)" → actively designing, est. 1 week
     - "Build (in progress)" → implementation started, ~2 weeks
     - "Shipped" → live, tracking outcomes
     - "Parked" → decision made, not now
     - "Dropped" → rejected, archived

**Spec**:
```
[Gate revision]
- Add bet quality badge ("🟩 Solid" / "🟨 Risky" / "🟥 Needs work")
- Add ranking reason explainer ("Urgent (🔴) + Novel (🟢) = #3")
- Make problem editable inline with "Regenerate" button
- Add link/button to full Critic review ("Read Critic's full reasoning")
- Show impact preview for next step ("Drafting creates spec in Plan, est. 1 week, owner TBD")
- Add "Evidence" tab showing all member signals with recency + source + strength
- Add "Add evidence" button to manually add signals/customer calls
- Show governance gate if applicable ("⚠️ Dropping requires VP approval")
- Show status options as menu with descriptions and impact
```

---

### D. The Context Panel (right column)

**Current**:
```
Who has touched it
Critic (mark)  says "validate at 87% confidence"
Strategist (mark) recorded the last call on it

Why it ranks here
High severity + recent surge + not seen before = #3 in the ranking.
Reads as a "feature request".

What this resembles
The record has been here before, on "Improve signup UX".

What people actually said
"Signup needs warmth" (support, 2h ago)
"Onboarding feels corporate" (research, 1h ago)
"Customers skip personalization" (support, 1h ago)
[+8 more said the same thing]

What backs it
12 signals in the record · ICE 8.3
[View the evidence]
```

**What's missing**:

1. **Agent touching history is one level deep**
   - Shows "Critic says validated" and "Strategist recorded last call"
   - But doesn't show: when? (2h ago? 2 days?) or "is there a thread?"
   - Better: show timestamps and make it clickable → opens a thread view
   - Candidate: "Critic reviewed 2h ago (87% confident). Strategist moved to Design 1h ago. [View thread]"

2. **Precedent link is read-only**
   - Shows "Record has been here before, on 'Improve signup UX'"
   - But no way to jump to that bet and see what happened
   - Better: make the title a deep-link to that bet
   - Or: show outcome summary inline: "...on 'Improve signup UX', shipped, validated, +8% conversion."

3. **Evidence block shows quotes but not diversity**
   - 4 quotes from support/research, says "8 more"
   - But doesn't show: are those 8 from the same 2 sources? Or spread across 5?
   - Better: break evidence down: "Support (7), Research (3), Analytics (2)"
   - Show recency too: "1 signal 2w ago, 11 signals this week"

4. **ICE score is shown but not explained**
   - Shows "ICE 8.3" (Impact, Confidence, Ease from product management)
   - But no explanation of what 8.3 means or how it was calculated
   - Better: show ICE as a breakdown: "Impact 8/10 · Confidence 8/10 · Ease 8/10 = score 8.3"
   - Or: explain briefly: "ICE 8.3 (high impact, high confidence, high ease)"

5. **No way to refine signals**
   - The 4 quotes might include 1 that's not quite right
   - No way to remove it without going to Engine Room
   - Better: add a small "X" or "Remove" icon on each quote
   - Allow PM to refine evidence quality right here

6. **No view of source quality**
   - Shows "support, research, analytics"
   - But doesn't show: are these sources healthy/active? Or is support connector paused?
   - Better: show source health: "🟢 Support (active)" vs "🟡 Analytics (quiet 7d)"

7. **No link to the Critic's actual reasoning**
   - Shows "Critic says scope is broad" (from the summary)
   - But the full red-team work (the prompt, the reasoning, the contradictions found) is hidden
   - Better: show "View Critic's full review" link → opens Critic's work
   - This is trust and transparency

**Spec**:
```
[Context panel revision]
- Show agent touches with timestamps and thread link: "Critic reviewed 2h ago, Strategist moved 1h ago [Thread]"
- Make precedent title a deep-link to that bet with outcome summary
- Break evidence down by source + recency: "Support (7, latest 2h) · Research (3, latest 1d) · Analytics (2, 1w old)"
- Explain ICE breakdown: "Impact 8 · Confidence 8 · Ease 8 = score 8.3"
- Add "X" remove icon on each quote (refine evidence)
- Show source health status: "🟢 Support active · 🟡 Analytics quiet 7d"
- Add "View Critic's full review" link (full reasoning, not summary)
```

---

## Part 2: Enterprise Workflows & Missing Paths

### Workflow 1: "Is this bet strong enough to design?" (Gap: Quality signals)

**Current**:
- Queue shows position and Critic verdict
- Gate shows facts (signals, problem, Critic summary)
- But no holistic "strength of bet" signal

**User need**:
- A PM wants to know: "Should I invest a week of design work or wait for more evidence?"
- Current surface: must read all evidence to judge

**Design spec**:
- Add a bet quality badge combining: (1) signal count + diversity, (2) Critic confidence, (3) precedent outcome
- Render as a visual state: "🟩 Solid" (all good), "🟨 Proceed with caution" (weak signals or Critic concerns), "🟥 Needs more evidence"
- Explain briefly in context: "Solid: 12 signals from 3 sources, Critic confident, similar past bets validated"

---

### Workflow 2: "What happens if I drop this?" (Gap: Impact preview)

**Current**:
- `[Drop]` button fires the action with no preview
- Only consequence shown is: "Dropped." + toast

**User need**:
- "If I drop this, does it affect other bets? Does the team need notice? What's the record impact?"
- Current surface: must know the domain to understand consequences

**Design spec**:
- Add a confirmation modal that shows impact:
  - "Dropping will archive this from the queue. Its signals stay on record, and future outcomes will still update the decision-graph."
  - "This bet was linked to Q3 roadmap. Unlinking will... [show any cross-impacts]"
  - Show who should be notified: "Team lead, VP of Product"
- Make this configurable in Engine Room (governance rules)

---

### Workflow 3: "The Critic found contradictions, what do I do?" (Gap: Remediation path)

**Current**:
- Critic summary shows "scope unclear" or "contradicts prior work"
- But no path to "fix this and re-review" or "acknowledge and proceed anyway"

**User need**:
- Red-team feedback isn't always "don't do this," sometimes it's "refine before you build"
- Need a workflow: acknowledge feedback → refine problem/scope → ask Critic to re-review → proceed

**Design spec**:
- On Critic summary, show options:
  - "Refine the problem" → edit problem statement → [Ask Critic to re-review]
  - "I understand the risk and proceed anyway" → acknowledge with reason → move to Design
  - "Park this, revisit later" → move to Parked status
- Store the acknowledgment on the record (transparency for team)

---

### Workflow 4: "Approve this bet as a team" (Gap: HITL approval)

**Current**:
- Implies single-person decision (the PM)
- But real organizations need multi-sign-off (design lead, VP, engineering lead)

**User need**:
- "This bet needs 3 approvals before it goes to Design"
- "Who approved this? When? Did they leave reasoning?"

**Design spec**:
- Add an approval row below Critic: "Approvals needed: Design lead, VP"
- Show approval status: "🟢 Design lead approved 2h ago" / "🟡 VP pending" / "🔴 Engineering lead rejected"
- Show reasoning per approver (one sentence or comment)
- This is a governance setting in Engine Room, visible here

---

## Part 3: Information Architecture & Missing Layers

### Layer 1: "What is the purpose of THIS screen?" (Gap: Mental model)

**Current**: No statement of purpose beyond the queue.

**What should be stated**:
Decide is where you **settle ranked bets with evidence**. The Critic red-teams each bet for contradictions and blind spots. Your job here is one call: yes (move to design), no (drop), or gather more (park). The record shows what happened last time the team reasoned this way.

**Design spec**:
- Add a one-line subtitle: "Settle ranked bets with evidence."
- Add a help icon with a 3-sentence blurb explaining the workflow

---

### Layer 2: "How do I know the ranking is good?" (Gap: Confidence in order)

**Current**:
- Queue shows positions (1 of 23)
- No explanation of whether positions are stable or whether #2 could flip with #3

**What should be stated**:
- The top 3 bets are close in score (within 5%) — decision order matters
- Or: the top bet is clearly stronger (20% ahead of #2)

**Design spec**:
- Add a scoring detail for the focused bet: "Rank score: 8.7/10. Gap to #2: 0.3pts (stable)."
- Or: visual indicator "🟢 Clear leader" vs "🟡 Could flip" vs "🔴 cluster of similar bets"
- This helps the PM understand if position matters

---

### Layer 3: "What did other decision-makers think?" (Gap: Visibility)

**Current**:
- Shows "Strategist moved this to Design 1h ago"
- No link to their reasoning or other comments

**What should be stated**:
- "Strategist moved to Design because: high validation rate + user demand. Read her note."
- Decision trail visible to the team

**Design spec**:
- Make the agent touch show a snippet of their reasoning: "Strategist moved to Design because: validated pattern + strong user demand"
- Clickable to open full reasoning/comment
- Build a thread view for bets (like GitHub issues)

---

## Part 4: The Seven-Station Lens

### How Decide fits the loop:

**Discover** (cluster signals) → **Decide** (judge bet + red-team) → **Plan** (write spec) → **Design** (wireframe) → **Build** (code) → **Ship** (release) → **Learn** (outcome)

- **Decide's job**: filter low-confidence bets, red-team high-risk bets, prepare for handoff to Plan
- **From Discover**: ranked clusters (now called opportunities/bets)
- **To Plan/Design**: approved bets ready for spec/wireframe work
- **From Plan/Design**: feedback ("scope is too broad", "this overlaps with other work")
- **Loop closure**: outcomes from Learn re-score bets (new evidence moves ranking)

**What's missing in Decide for loop closure**:
1. No way to see "this bet is now shipping, tracking outcome" (requires Learn visibility)
2. No bidirectional link to specs in Plan (if spec changes, bet should re-evaluate)
3. No feedback loop from Design ("we tried this, it won't work") — should retrigger Critic

**Design spec for loop integrity**:
- Show shipping status in the queue: "🟢 Shipped 3 days ago, tracking outcome"
- Link to the spec/design in Plan: "View the spec we wrote for this"
- Show outcome updates in real-time: "This bet's +8% conversion was recorded; queue re-ranked automatically"

---

## Part 5: Design Specification — Full Implementation

### High-level structure (no major change needed):
```
[Top: Page headline + scoring context]
[Left: Ranked queue of bets (5 visible, expandable to all)]
[Center: Gate (focused bet, verbs, Critic review)]
[Right: Context panel (agent touches, evidence, precedent)]
```

### Detailed component specs:

#### A. Page Headline Revision
```
Current:
"23 bets ranked, strongest first. Re-ranked 2m ago, on its own, off a recorded outcome."

Revised:
"23 bets ranked. Strongest first. Re-ranked 2m ago off a recorded outcome.
🟢 Top 3 bets are stable (no flip risk in next 48h).
Settle one bet: yes (design), no (drop), or later (park)."
```

#### B. Queue Row Component Revision
```
Current:
1 · Onboarding flow needs redesign · validated · 3 of 23

Revised:
[Checkbox] [Strength] 1 · Onboarding flow needs redesign
                       🟩 Solid bet
                       🟢 Critic validated (87%)
                       Rank score: 8.7 (0.3pts ahead of #2)
                       [k spec] [c challenge] [x drop]
                       [3 of 23]

Strength badge: 🟩 (solid), 🟨 (risky), 🟥 (needs work)
Critic verdict: 🟢 Validated / 🟡 Needs work / 🔴 Mixed
Keyboard hints: shown on hover
Bulk selection: checkboxes when multi-select mode active
```

#### C. Gate Component Revision
```
Current:
[Bet title]
3 of 23 in the ranking.
[Problem statement]
Critic says [summary].

[Draft spec (k)] [Challenge it (c)] [Drop (x)]

Revised:
[Bet quality badge: 🟩 Solid bet]
[Bet title]

Position: 3 of 23 in ranking (rank score 8.7, 0.3pts gap to #2 = stable)
Quality: 🟩 Solid (12 signals from 3 sources, Critic confident 87%, validated 2x before)

Problem (editable):
"Users need a warmer, more inviting signup experience"
[Edit] [Save] [Regenerate]

Critic's red-team review:
"Scope might be too broad. Metrics need clarity. Past similar bets had 1-2 week design cycle."
[Read full review] [Acknowledge & proceed] [Refine then re-review]

Precedent (linked):
✓ Similar pattern 2 months ago: "Improve signup UX"
  Shipped, validated, +8% conversion
  [View that bet]

Evidence (all, with diversity breakdown):
Support (7 signals, latest 2h ago)
  "Signup needs warmth" (support, 2h ago) [remove]
  "Onboarding feels corporate" (support, 1h ago) [remove]
  ... [5 more]

Research (3 signals, latest 1d ago)
  "Customers skip personalization" (research, 1d ago) [remove]
  [2 more]

Analytics (2 signals, latest 1w ago)
  "Signup conversion down 2%" (analytics, 1w ago) [remove]
  [1 more]

Actions:
[🎯 Draft spec (k)]    [📋 Challenge it (c)]
[⏸️ Park for later]      [🔥 Drop (x)]

Next step:
Drafting spec will create a problem statement + scope in Plan.
Next: handoff to Design (est. 1 week).
Owner: TBD (assign in Plan).

Who has touched it & decisions:
Critic reviewed 2h ago, 87% confident on "validate"
Strategist moved to Design 1h ago (reason: "high priority, Critic approved")
[View decision thread]
```

#### D. Context Panel Revision
```
Current:
[Who has touched it + Critic verdict]
[Why it ranks here]
[What this resembles]
[What people actually said]
[What backs it]

Revised:
Decision history
Critic reviewed 2h ago
  Verdict: "Validated" (87% confident)
  Reason: "Well-scoped, clear metrics, doesn't contradict prior work"
  [View full review]

Strategist moved to Design 1h ago
  Reason: "High priority + team bandwidth available"
  [View her note]

[View all decisions as thread]

Why it ranks here
Position: #3 of 23
Score breakdown: Urgency (8/10) + Signal quality (8/10) + Precedent (7/10) = 8.7 overall
Gap to #2: 0.3pts (stable)
Ranking reason: "Recent surge of similar feedback + past bets on this validated + Critic approved"

What this resembles (precedent)
✓ "Improve signup UX" shipped 2 months ago
  Verdict: Validated
  Impact: +8% conversion
  [View that bet] [Compare: similarities & differences]

Evidence summary
Total: 12 signals from 3 sources

Source breakdown:
  🟢 Support (7 signals): active, latest 2h ago
  🟢 Research (3 signals): active, latest 1d ago
  🟡 Analytics (2 signals): quiet since 1w ago

Recency:
  1 week ago: 1 signal
  1 day ago: 3 signals
  Today: 8 signals (fresh)
```

---

## Part 6: Missing Workflows (Build Order)

### Priority 1 (gates the launch of Decide depth):
1. ✅ Bet quality/confidence badge (visual, not percentage)
2. ✅ Ranking reason tag or breakdown
3. ✅ Evidence shown as full set (not just 4 quotes)
4. ✅ Critic verdict visible + link to full review
5. ✅ Editable problem statement with regenerate button
6. ✅ Source diversity shown in evidence (support vs research vs analytics)

### Priority 2 (power-user polish):
7. ⬜ Bulk operations (checkboxes + bulk actions)
8. ⬜ Queue filters ([All] [Critic approved] [Needs review] [Old bets])
9. ⬜ Impact preview for decisions (what happens if I drop this?)
10. ⬜ Approval workflow (multi-sign-off gates)
11. ⬜ Decision thread view (who decided what, when, why)

### Priority 3 (loop integrity):
12. ⬜ Show shipping status in queue ("Shipped 3d ago, tracking outcome")
13. ⬜ Link to specs in Plan
14. ⬜ Outcome updates re-score automatically and show in real-time
15. ⬜ Bidirectional feedback from Design/Plan

---

## Part 7: Comparison to Reference Products

### Asana Project Portfolio (what we can adapt)
- Shows project health (on track / at risk / off track)
- Shows progress % and blocker indicators
- Shows owner and timeline
- ✓ We could show bet "health" similar to project health

### Linear Triage (what we adapted well)
- One item in focus, queue visible
- Digit keys for quick decisions
- ✓ We do this well

### Sentry Issue Management (what we missed)
- Shows issue velocity (how many new incidents per day)
- Shows "most affected users" (not just volume)
- Shows error grouping quality (is this cluster good or noisy?)
- Shows alerting rules (what triggered this to surface?)
- ✓ We could show bet "momentum" (signals per week, acceleration)
- ✓ We could show "most vocal customer" (not just count of feedback)

---

## Success Metrics

Once this redesign ships:

1. **Decision speed** — PM settles 10 bets in <5 minutes (currently ~3-5 min each)
2. **Critic impact** — % of decisions where Critic feedback changed the outcome (target: >30%)
3. **Approval efficiency** — If multi-sign-off: avg time to approval (target: <24h)
4. **Rollback rate** — % of bets moved to Design that later get un-designed (target: <5%, means Critic did job)
5. **Ranking stability** — % of bets that flip rank position week-to-week (target: top 5 stable 80%+ of time)
6. **Precedent usefulness** — % of Decide decisions where PM read the Record (target: >70%)

---

## Next: Plan & Design Station Audits

Once Decide is complete, the audit moves to **Plan** (where bets become detailed specs) and **Design** (where specs become wireframes).

The full loop chain:
Discover → Decide → **Plan** → Design → Build → Ship → Learn
