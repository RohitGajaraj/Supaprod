# Design Audit: Discover Station

> _Created: 2026-08-01 · Last updated: 2026-08-01_

## From Power-User & Enterprise Product Lens

> **Context**: Discover is the triage desk where signals cluster into patterns and the PM decides if a pattern is a bet, noise, or weight for existing work. The reference model is Sentry's issue stream + Linear's triage inbox. This audit evaluates the current surface against what a serious product leader (VP/head of product at a B2B SaaS company) needs to make fast, confident triage calls end-to-end.
>
> **Session**: 2026-08-01 Design Phase · Conducted from: head-of-digital-product lens (Vercel / Stripe / Google design precedent)

---

## Executive Summary: What's Right & What's Missing

### ✅ What the current design nails

1. **One question at a time** (Linear split-view pattern) — the ranking stays scannable while one cluster gets full focus. This is correct.
2. **Triage verbs are digital** (1/2/3 keys) — terminal dispositions (keep/merge/decline) are fast, keyboard-driven, recorded.
3. **The Record shows up** — prior similar decisions with outcomes appear at the moment of triage, not buried in Engine Room.
4. **Brain ranking is visible** — sorted by severity × recency × novelty, not raw volume.
5. **Source coverage blocks empty surfaces** — an operator can see which connectors are feeding the desk and which went quiet.
6. **Capture is simple** — paste 1 or 20 lines, each becomes a signal. No mode selection, no metadata required.

### ⚠️ What reads as scatter or missing

1. **No cluster quality indicator** — The surface avoids confidence scores (good instinct), but leaves the user with zero mental model for "is this cluster signal or noise?"
2. **Ranking transparency is zero** — User sees "23 clusters waiting on a call" but has no way to understand WHY this one is #2 beyond the text "severe, recent, new."
3. **Merge without preview** — Picker shows open bets but not their status. Merging a cluster into a shipped bet is visually identical to merging into backlog.
4. **The evidence viewer is capped** — 4 quotes before "and N more." At triage moment, a PM might want to spot-check all 20 signals for quality before promoting.
5. **No agent provenance per signal** — The context shows "Scout reading for you" but not which agent surfaced THIS cluster's individual signals. Trust requires attribution.
6. **Spec draft is buried** — Hidden in MoreMenu, but it's a primary workflow for "cluster → spec → promote."
7. **Summary is render-only** — The AI-generated summary appears but can't be regenerated or edited before promotion.
8. **No cluster growth curve** — Zero visibility into "is this pattern accelerating or resolving?"
9. **Batch operations are missing** — 23 clusters in the ranking but only single-triage available. A PM needs a "decline all <3 signals" rule or similar.
10. **Capture discovery is weak** — Only appears after clusters exist; new users have no way to know signals can be manually added.

---

## Part 1: Deep Dive — What Each Element Should Communicate

### A. The Headline & Context Strip (top of page)

**Current**: "23 clusters are waiting on a call. Ordered by how severe, how recent, and how new to the record each one is."

**What it needs to say** (power-user reading):
- Count of clusters (✓)
- Count of raw signals not yet clustered (missing: why would I care? Answer: "should I cluster them first or keep triaging?")
- Last clustering run time (missing: is this data fresh or 3 days old?)
- If Sense agent is actively reading (✓ AgentRelay shows this)

**Audit finding**: The headline is honest but incomplete for an operator who wants to know "do I have fresh data or stale?" This matters for decision confidence.

**Spec**: Add a secondary line showing "Last reading: 14m ago" (or "No reading in progress"). Make "Cluster them now" available anytime unclustered signals exist, not just when ranking is empty.

---

### B. The Ranking List (left column or scrollable block)

**Current**: 
```
1 · Onboarding flow needs friction reduction · 12 signals · 2 sources · 3h ago
2 · PDF export broken in dark mode · 8 signals · 1 source · 1h ago
...
[Show all 23]
```

**What's missing**:

1. **No quality/confidence signal at row level**
   - A user scanning 23 rows has NO way to spot "which ones are reliably clustered vs. which ones are noise?"
   - Sentry solves this with a color (red = critical, yellow = warn, blue = info) but Supaprod explicitly avoids numeric scores
   - Better: show a subtle visual cue (gap size? row color? icon?) that says "high-confidence cluster" vs. "loose grouping"
   - Candidate: a small dot or bar under the title that shows cluster cohesion (not as a number, but as a visual)

2. **Ranking reason is invisible**
   - The Gate says "ordered by severity × recency × novelty" but a user looking at row #1 vs row #2 cannot tell WHICH dimension moved them
   - Better: show a small tag or badge per row: "⚡ urgent" or "🆕 new to us" or "🔔 recent surge"
   - This makes the ranking legible without showing percentages

3. **Status after judgment is missing**
   - A user dismisses cluster #5, then scrolls back up
   - The list still shows 6 rows but the focus has moved, and nothing visually indicates "#5 is gone now"
   - Better: when a cluster is dismissed/merged, fade it out with a small label "Dismissed" or remove it from the ranking immediately
   - This gives feedback and reduces confusion

4. **No way to filter the ranking**
   - A PM with 23 clusters might want to see "only new clusters" or "only from support tool"
   - Currently must scan all 23 or show/hide the list
   - Better: add a filter bar: [All] [New] [Recent surge] [Quiet now] [From X source]
   - This is enterprise-grade operator tool

5. **No bulk action affordance**
   - Zero way to "decline all clusters with <3 signals" or "merge all from support into backlog bet"
   - Better: checkboxes on rows + bulk menu ("Decline all selected", "Mark for review by X agent", etc.)
   - This is necessary for a desk with 20+ clusters to avoid death-by-a-thousand-clicks

**Spec**:
```
[Row layout revision]
- Add small visual badge/dot to show cluster quality/confidence (cohesion)
- Add small tag showing ranking reason ("🆕 novel", "⚡ urgent", "🔔 surge")
- Fade or remove row immediately after judgment
- Add filter bar: [All] [Novel] [Surge] [From support] [Quiet sources]
- Add checkboxes; selected rows show bulk actions: "Decline", "Mark for review", "Merge to..."
```

---

### C. The Focused Gate (center column)

**Current state**:
```
[Onboarding flow needs friction reduction]

3 of 23 in the ranking.
12 signals from 2 separate sources: support, user-research.
First heard 2d ago, most recently 2h ago, and it is new to this workspace.
Users report that initial signup doesn't feel inviting and they skip steps.

[Make it a bet] [Add to existing bet] [More ≡]
                                        ├─ Not a pattern (3)
                                        └─ Draft the spec
```

**What's missing**:

1. **No cluster quality badge**
   - The Gate shows all the facts but no summary judgment of "high confidence" vs "uncertain"
   - Sentry shows this as a state machine (unresolved/resolved/ignored)
   - Better: add a small tag or progress bar showing cluster cohesion/confidence without a percentage
   - Candidate: "👍 Strong match" / "⚠️ Loose grouping" / "❓ Mixed signals"

2. **Sources list shows activity but not agent source**
   - Shows "support, user-research" with recent count/last date
   - But doesn't show: which AGENT sourced THIS cluster's signals?
   - If Scout found 8 and Researcher found 4, the user should know
   - Better: expand sources to show agent+source pair: "Scout via support (8)", "Researcher via user-research (4)"
   - This adds trust and clarity on provenance

3. **Ranking position is shown but reason is not**
   - "3 of 23" is clear
   - But "why is this #3, not #8?" requires reading the full Gate and inferring
   - Better: add a small chart or explanation: "This one scores high because: recent activity (🔴 urgent) + new pattern (🟢 novel)"
   - Show which dimension is strongest

4. **Summary is static render-only**
   - The summary "Users report that..." is generated by AI but unchangeable
   - A PM might read it and think "that's not quite right, it's more about the visual hierarchy than the welcome tone"
   - Better: make the summary editable inline, with a "Regenerate" button
   - Store the edited version so it travels with the bet when promoted

5. **No evidence explorer**
   - The context column shows 4 quotes, then "and 8 more"
   - But there's no way to read all 12 quotes inline on the Gate
   - A serious PM wants to spot-check quality before promoting
   - Better: add an "Evidence" tab/panel on the Gate showing all member signals, with ability to delete obvious noise (e.g., "customer compliment that's not really a signal")
   - This lets the PM refine the cluster before it becomes a bet

6. **Merge has no preview**
   - Pressing "Add to existing bet" opens a picker showing open bets
   - But doesn't show: is this bet in Backlog? In Design? Already shipped?
   - Merging a cluster into a shipped bet is data corruption but the UI suggests it's the same choice as merging into backlog
   - Better: merge picker shows bet status as a tag/color: "Design / In Progress", "Backlog / Ready", "Shipped / 2024-06", etc.
   - Also: show impact ("merging will make this bet re-rank from #4 to #1 in the backlog")

7. **Spec draft is buried**
   - The workflow "cluster → draft spec → promote" is common but spec draft is in MoreMenu
   - This suggests it's rare/optional, but it's actually a primary path
   - Better: make "Draft spec" a primary affordance, alongside "Make it a bet"
   - Or: show what "Make it a bet" does (it goes to Decide, then needs a spec) so the PM understands there are two paths

8. **No way to convert a cluster to a signal**
   - A PM might look at the 12 signals and think "actually, these aren't a pattern, they're just one thing"
   - The option is decline (judgment call) but not "revert to single signal"
   - This is rare but necessary for an operator tool
   - Better: add an action "Un-cluster" or "Keep as evidence for..." (lets you pick a different cluster to merge into)

**Spec**:
```
[Gate revision]
- Add cluster quality badge ("Strong match" / "Loose grouping" / "Mixed signals")
- Expand "Sources" to show agent+source pairs with signal count
- Add ranking reason explainer ("Urgent (🔴) + Novel (🟢) = #3")
- Make summary editable inline with "Regenerate" button
- Add "Evidence" tab showing all member signals (not just 4), with ability to remove noise
- Show bet status/location on merge picker ("Backlog / Ready", "Design / In Progress", "Shipped")
- Promote "Draft spec" to primary verb or show it's the first step in "Make it a bet" flow
- Add "Un-cluster" action if needed (revert to loose grouping or merge into different cluster)
```

---

### D. The Context Panel (right column)

**Current**:
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

**What's missing**:

1. **Agent reading state is confusing**
   - "Scout Researcher" reads as a job title, not "Scout agent and Researcher agent"
   - Better: "Sensing: Scout" or show the mark/avatar more clearly
   - Or just: "Scout" (the primary agent), and if multiple agents read for this workspace, show them as a list

2. **Sources are product-focused, not operator-focused**
   - A PM cares: "is this signal coming from active sources or stale ones?"
   - The display shows: "5 in 7d" (is this good? bad? normal?)
   - Better: show source health as a state tag: "🟢 Active" / "🟡 Slowing" / "🔴 Quiet"
   - Also: add "enabled/disabled" status for each source (did the user pause the connector?)

3. **The "quiet for 7d" flag is passive**
   - Saying "quiet for 7d" is information but not actionable
   - Better: show "Last signal from support: 7d ago. Should you reconnect?"
   - Or: "Silence since 2026-07-25. Check Settings > Connections if this is unexpected."

4. **Evidence viewer is capped at 4**
   - Matching the Gate's context, but feels arbitrary
   - A PM wants to browse the evidence before deciding
   - Better: show all member signals with ability to scroll, plus a small count: "12 signals, showing all:"
   - Or: "Showing 4 of 12. View all >" (expandable inline)

5. **No way to mark a signal as "not part of this cluster"**
   - A PM might see the 4 quotes and notice "quote #2 is really about something else"
   - Currently: only delete option is via Engine Room
   - Better: add a small "Remove from cluster" icon on each quote
   - This lets the PM refine the cluster quality right here

6. **Missing: what decision the user just made**
   - After promoting a cluster or merging it, the context panel doesn't update
   - A PM might move on without seeing confirmation (the Receipt is separate)
   - Better: show the last judgment action in the context: "You made this a bet 2m ago, carrying 12 signals."

**Spec**:
```
[Context panel revision]
- Clarify "Scout" naming; show it's an agent, not a job title
- Show source health state ("🟢 Active", "🟡 Slowing", "🔴 Quiet 7d")
- Add source control hint ("Connector paused? Check Settings")
- Expand evidence view or show "All 12 >" link
- Add "Remove from cluster" icon on each quote (for noise cleanup)
- Show recent action summary ("You promoted this 2m ago")
```

---

## Part 2: Enterprise Workflows & Missing Paths

### Workflow 1: New user "What is a signal?" (Gap: Mental model)

**Current**: 
- Capture box says "What did you hear, and where from? One per line."
- No explanation of what constitutes a signal

**User need**:
- A new PM doesn't know if a signal is: a tweet, a Slack message, a customer interview quote, a metric threshold, a support ticket?
- The mental model is undefined

**Current state**: The system works, but a new user is confused

**Design spec**:
- Add a help popover or onboarding tooltip on "Capture": "A signal is one piece of feedback: a quote, a metric, a trend, or an observation. Any one fact that might be part of a larger pattern."
- Show examples in the placeholder: "e.g., 'Users report dark mode is incomplete' / 'Slack export stopped working' / 'NPS dropped 2pts this week'"
- Consider: a 30-second video showing "signal capture workflow"

---

### Workflow 2: Confidence-building "Is this noise or real?" (Gap: Quality signals)

**Current**:
- The Gate shows volume (12 signals) and sources (2)
- No quality indicator
- The noveltyClaim shows "close to something on record" but not "is this cluster good?"

**User need**:
- A PM wants to know: "Should I invest 2 hours in spec work or 10 minutes to decline this?"
- Current surface: must read all evidence to judge quality

**Design spec**:
- Add a cluster quality indicator that combines: (1) signal coherence (do all 12 signals say the same thing?), (2) recency concentration (are they spread over 2 months or clustered in 2 days?), (3) source diversity (all from one channel or multiple?)
- Render as a visual state, not a percentage: "👍 Strong pattern", "⚠️ Mixed signals", "❓ Too scattered"
- Show in the Gate, ranking row, and context panel consistently
- Explain briefly: "Strong pattern: signals align on the same issue across 2+ sources in the last 5 days"

---

### Workflow 3: The triage speed run "I have 23 clusters, I need to triage fast" (Gap: Batch operations)

**Current**:
- Must click into each cluster, review, decide
- One at a time, minimum 5 clicks per cluster (focus, scroll context, scroll evidence, click decision, refocus)

**User need**:
- Bulk actions for obvious cases: "decline all with <3 signals", "decline all older than 30d", "merge all from support into backlog bet"
- Keyboard shortcuts for common patterns

**Design spec**:
- Add ranking filters: [All] [High confidence] [Low confidence] [Recent surge] [Old & quiet]
- Add checkboxes on rows; multi-select shows bulk actions: "Decline all (5)", "Decline as duplicates", "Merge to...", "Mark reviewed"
- Add keyboard shortcuts: `j`/`k` to move focus, `1`/`2`/`3` for current cluster decisions (already done ✓), but also `Shift+D` for "decline this + next" (chaining)
- Show a summary: "23 clusters: 15 reviewed, 8 waiting"

---

### Workflow 4: The merge decision "Is this new or weight for existing?" (Gap: Bet preview)

**Current**:
- Pressing "2" opens a picker showing open bets by name and status tag (e.g., "backlog")
- No preview of what merging will do

**User need**:
- "If I merge these 12 support signals into 'Dark mode fixes', will it jump to #1 in the backlog? Is that bet already in Build?"
- The decision requires context about the target bet

**Design spec**:
- Merge picker shows: bet name, status (tag), current signal count, last update date
- On hover or expand: show bet owner, tags, and "merged signals will add 12, changing bet ranking from #4 to #1"
- Add a small link "View bet" to deep-link to that opportunity (if it exists in Decide/Plan)
- Merge Receipt: "12 signals now back 'Dark mode fixes' (was #4, now #2 in backlog)"

---

### Workflow 5: The spec-draft loop "Cluster → spec → promote" (Gap: Affordance clarity)

**Current**:
- "Draft the spec" is in MoreMenu, not visible
- It's a key path but hidden

**User need**:
- A PM wants to: cluster → review evidence → draft spec → edit it → promote
- Currently: cluster → MoreMenu → Draft spec (goes to /plan/spec, leaving Discover)
- When they return, context is lost

**Design spec**:
- Make "Draft spec" a primary button alongside "Make it a bet" (or show them as alternatives)
- Or: change "Make it a bet" to show a modal first: "Turn cluster into bet?" with options "Make a bet", "Draft spec first", "Add to existing bet"
- This way the user sees the decision tree up front
- After drafting spec in /plan/spec, show a return link: "Back to cluster (12 signals)" so they can return to the context

---

### Workflow 6: The refinement loop "This cluster has noise, how do I clean it?" (Gap: Signal-level control)

**Current**:
- Can see 4 signals in context, "and 8 more"
- No way to remove noisy signals from a cluster without Engine Room
- Dismissing the cluster removes all evidence

**User need**:
- A PM sees 12 signals grouped together but #2 and #9 don't really fit
- Need: remove them without dismissing the whole cluster or creating a manual merge

**Design spec**:
- Show all member signals in an "Evidence" view (part of the Gate or a panel)
- Each signal has a small "X" or "Remove" button (confirmation: "Remove from cluster? The signal will return to unclustered.")
- After removal, cluster is re-ranked automatically
- This refines cluster quality before promotion

---

## Part 3: Information Architecture & Missing Layers

### Layer 1: The unasked question "What is this desk for?"

**Current**: No statement of purpose.

**What should be stated**:
The Discover desk is where you **triage signals into patterns**. A pattern might be a new bet, weight for existing work, or noise. Your job here is fast judgment; the work lives elsewhere. Three calls per cluster: keep it (make a bet), merge it (add to existing), or decline it (it's not a pattern).

**Design spec**:
- Add a one-line subtitle on the page: "Triage signals into patterns."
- Add a help icon with a 3-sentence blurb explaining the workflow

---

### Layer 2: The unasked question "What happens after I decide?"

**Current**: 
- "Make it a bet" shows a Receipt: "carrying 12 signals. Critic will red-team it."
- But no visual way to see what happens next

**What should be stated**:
- Make a bet → goes to Decide → Critic red-teams it → you see Critic's reasoning
- Add to existing bet → the bet is re-ranked and re-evaluated
- Decline → logged on the record, not deleted

**Design spec**:
- Receipt should show a small decision tree or next action
- "You made this a bet. Next step: The Critic will review it in a few minutes. View progress in Decide or check back here."
- Show a link or button: "Go to Decide" or "Dismiss"

---

### Layer 3: The unasked question "How do I know if Sense is working?"

**Current**: 
- AgentRelay shows "Scout working" or "Scout idle"
- Context shows source activity ("5 in 7d")
- But no holistic signal intake health

**What should be stated**:
- Sense is working (fresh data coming in)
- Sources are healthy (recent activity from all connectors)
- Clustering quality is good (clusters are not just random groupings)

**Design spec**:
- Add a "Sense health" section at the top or in a popover: "✓ Scout reading" + "✓ 4 active sources" + "✓ Latest signals: 2m ago"
- If something is broken: "⚠️ Support connector paused. Last signal: 7d ago. Reconnect?"
- This is observable evidence that the system is working

---

## Part 4: The Seven-Station Lens

### How Discover fits the loop:

**Sense** (input, ambient) → **Discover** (triage) → **Decide** (judgment) → **Plan** (spec) → **Design** (wireframe) → **Build** (code) → **Ship** (release) → **Learn** (outcome)

- **Discover's job**: filter noise, identify patterns, prepare judgment material
- **From Sense**: raw signals, auto-clustered
- **To Decide**: ranked patterns (clusters) ready for red-team
- **From Decide**: feedback ("consider impact", "precedent says...", "try narrowing scope")
- **Loop closure**: outcomes recorded from Learn, used to score future clusters (novelty, precedent)

**What's missing in Discover for loop closure**:
1. No way to see "this cluster relates to shipped bet X" (requires querying Learn outcomes)
2. No way to show "this decision was validated" or "this was missed" inside the cluster view
3. No feedback loop visibility (did users actually want what we shipped?)

**Design spec for loop integrity**:
- Show in the Record section: "This pattern has been seen 3 times before. Last time (2 months ago): you shipped it, and it was validated. Usage increased 12%."
- This closes the loop inside Discover
- Shows precedent + outcome + impact, all at once

---

## Part 5: Design Specification — Full Implementation

### High-level structure (no change needed):
```
[Top: Page headline + health check + agent status]
[Left: Ranking list (6 visible, expandable to all)]
[Center: Gate (focused cluster, verbs, record)]
[Right: Context panel (agent, sources, evidence)]
[Bottom: Capture, boundary switch]
```

### Detailed component specs:

#### A. Page Headline Revision
```
Current:
"23 clusters are waiting on a call. Ordered by how severe, how recent, 
and how new to the record each one is."

Revised:
"23 clusters are waiting on a call. 7 signals not yet clustered.
Triage signals into patterns: keep it, merge it, or decline it.
Scout reading. Last sense run: 14m ago. 4 active sources."

[Beneath: a small health bar or icon row showing:
✓ Sense active (green) / Last read 14m ago
✓ 4 sources healthy / Support (1h), Research (2h), Analytics (quiet 7d), Slack (30m)
ⓘ "View Sense details" [link to Engine Room / Sense station status]]
```

#### B. Ranking Row Component Revision
```
Current:
1 · Title · 12 signals · 2 sources · 3h ago

Revised:
[Checkbox] [Quality badge] 1 · Title · 12 signals · 2 sources
                                                    🔴 Urgent
                                                    [3h ago]

Quality badge options: 👍 (strong match), ⚠️ (loose), ❓ (mixed)
Ranking reason tag: 🔴 Urgent, 🟢 Novel, 🔔 Surge

After judgment: fade to 50% opacity, add "✓ Dismissed" tag, show gray
Show summary: "23 clusters: 15 decided, 8 waiting"
```

#### C. Gate Component Revision
```
Current:
[Cluster title]
3 of 23 in ranking.
12 signals from 2 sources: support, user-research.
First heard 2d ago, most recently 2h ago, and it is new to this workspace.
Summary text.

[Make it a bet] [Add to existing bet] [More ≡]

Revised:
[Cluster quality badge: 👍 Strong match]
[Cluster title]

Position: 3 of 23 in ranking.
Reasoning: 🔴 Urgent (recent surge) + 🟢 Novel (new pattern) = #3 score
Volume: 12 signals from 2 sources (support, user-research)
Timeline: First heard 2d ago, most recently 2h ago
Precedent: You have reasoned this way before on "Dark mode improvements" 
          [tried last month, validated, 8% impact]
Quality: Strong match across sources

Summary (editable inline with "Regenerate" button):
[Users report onboarding flow doesn't feel inviting, causing drop-off]
[Edit] [Save] [Regenerate]

Evidence (show all 12, not just 4):
[Expandable panel with all signals, each with small X to remove]
"Customer says registration feels cold" (support, 2h ago)
"Signup wizard needs personality" (user-research, 1h ago)
...

[Make it a bet] [Add to existing bet] [Draft spec] [More ≡]
                                                    ├─ Not a pattern (3)
                                                    ├─ Un-cluster
                                                    └─ Save for later
```

#### D. Merge Picker Revision
```
Current:
[List of open bets by title and status]
"Dark mode fixes" (backlog)
"Q3 roadmap" (backlog)

Revised:
[List shows more context]
Dark mode fixes
  Status: Backlog / Ready to design
  Current signals: 8
  Owner: Sarah
  Merge impact: This will add 12 signals, moving bet from #4 to #2
  
Q3 roadmap  
  Status: Design / In progress
  Current signals: 15
  Owner: Product team
  Merge impact: Adding 12 more signals to an in-progress design
  ⚠️ Consider: Ship current work first?
  
[Merge to selected] [Cancel]
```

#### E. Receipt Revision
```
Current:
"You kept it. "Dark mode fixes" is a ranked bet, carrying 12 signals of evidence."
[Handoff to Critic]

Revised:
"You made it a bet. "Dark mode fixes" now has 12 signals of evidence."

Next step: The Critic will review it for contradictions and precedent.
  [View in Decide] [Wait for update] [Dismiss]
  
(If merged): "12 signals now back "Dark mode fixes" (moved from #4 to #2)"
  [View updated bet] [Dismiss]
```

#### F. Context Panel Revision
```
Current:
Reading for you
Scout Researcher
last read 2h ago

What is feeding this
Support · 5 in 7d, last 14m ago
User Research · 3 in 7d, last 1h ago
Analytics · quiet for 7d, sent 12 before that
[+2 more sources]

What backs this
[4 quotes]
[+8 more say the same thing]

Revised:
Sensing
👁️ Scout (discovering patterns)
   Last read: 2h ago
   Status: Idle (waiting for next batch)

Signal sources (workspace health check)
🟢 Support: 5 in last 7d, last 14m ago (active)
🟢 User Research: 3 in last 7d, last 1h ago (active)
🟡 Analytics: Quiet for 7d, sent 12 before (paused?)
    Check Settings > Connections if unexpected
🟡 Slack: 1 signal, last 10d ago (slowing)

Evidence (all 12 signals)
"Customer says onboarding feels cold" (support, Scout, 2h ago) [remove]
"Signup wizard needs more warmth" (user-research, Researcher, 1h ago) [remove]
"Users skip personalization step" (support, Scout, 1h ago) [remove]
...
[Show all] [Expand all] [Collapse]

Recent judgment
You promoted this to a bet 5m ago, carrying 12 signals.
Scout is monitoring for related signals and will notify if pattern changes.
```

---

## Part 6: Missing Workflows (Build Order)

### Priority 1 (gate the launch of Discover depth):
1. ✅ Quality/confidence indicator (visual badge, not percentage)
2. ✅ Ranking reason tag ("🔴 Urgent", "🟢 Novel")
3. ✅ Evidence full viewer (all signals, not just 4)
4. ✅ Merge picker shows target bet status
5. ✅ Editable summary with regenerate button
6. ✅ Remove-from-cluster per signal

### Priority 2 (power-user polish):
7. ⬜ Bulk operations (checkboxes + bulk actions)
8. ⬜ Ranking filters ([All] [Urgent] [Novel] [Quiet])
9. ⬜ Sense health dashboard (in headline or popover)
10. ⬜ Agent attribution per signal (show which agent found this)

### Priority 3 (loop integrity):
11. ⬜ Show shipped outcomes in Record (closed-loop feedback)
12. ⬜ "This relates to [shipped bet]" cross-link
13. ⬜ Batch keyboard shortcuts (Shift+D for decline+next)

---

## Part 7: Design Debt & Known Issues

1. **No cluster auto-merge on duplicate detection** — If two clusters are >95% similar, they should auto-merge with notification, not both rank
2. **No cluster staleness indicator** — A cluster with no new signals for 10 days looks the same as one from today
3. **No archive/snooze feature** — A PM can't say "I'll revisit this next month" without declining it
4. **No signal source mapping to agent** — Can't tell if a signal came from a webhook vs. manual vs. which agent processed it
5. **Capture box is low-discovery** — Only visible after clusters exist; new users don't know they can manually add signals
6. **No template for signal capture** — Template like "Source: [where], What: [fact], Why: [so what?]" would improve signal quality

---

## Appendix: Reference Models

### Sentry Issue Stream (what we adapted)
- Issues group events
- Volume + distinct users separate
- State machine (unresolved/resolved/ignored)
- Most common outcome: merge/group similar issues
- Timeline shows event recency
- ✓ We did this well

### Linear Triage Inbox (what we adapted)
- One issue in focus while list stays visible
- Digit keys for quick disposition (1=keep, 2=snooze, 3=done)
- Ranking by priority + date
- Ability to bulk-triage and filter
- ⚠️ We missed bulk operations and filtering

### Productboard Feature Board (what we missed)
- Most common outcome isn't "new feature", it's "this is evidence for existing feature"
- Merge/link interface is primary, not in a menu
- Feature status visible on cards (planned/in progress/shipped/on hold)
- Link preview (what does this feature do, who wants it?)
- ⚠️ We have merge but it's slow and lacks preview

---

## Metrics for "Discover is good"

1. **Triage speed** — User can decide on 10 clusters in <5 minutes (currently ~7-10 min per cluster)
2. **Merge rate** — % of promoted clusters that were later merged into existing bets (reveals if we're promoting duplicates)
3. **Precedent hit rate** — % of clusters where Record showed prior similar decision (reveals if loop is closing)
4. **Cluster quality** — % of promoted clusters that > Ship with the evidence driving the work
5. **Sense coverage** — % of time sources are active and recent (reveals integration health)

---

## Next: The Decide Station Audit

Once Discover is spec'd and built to this depth, the audit moves to Decide station (where ranked opportunities become reasoned bets with red-team review and precedent checking).
