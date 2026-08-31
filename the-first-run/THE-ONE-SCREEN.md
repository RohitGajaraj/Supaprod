# The one screen — the whole product, station by station

> _MAIN LANE, 2026-08-25. The architecture. Governed by `RULINGS.md`; R-13 killed the station widget
> and made the left pane a transcript. This is what LANE 0 and LANE 1 are building toward._

## The shape

**One screen. The person never navigates.**

```
┌────────────────────────────────┬──────────────────────────────────────┐
│  LEFT — YOU INTERACT           │  RIGHT — YOU SEE, AND YOU ACT        │
│                                │                                      │
│  · what the agent just did     │  · the thing that exists RIGHT NOW   │
│  · what it produced, inline    │  · rendered as itself, not as a list │
│  · the handoff between agents  │  · every control that changes it     │
│  · the one question, in place  │    sits ON it                        │
│                                │                                      │
│  [ the composer ]              │  [ version · export · share ]        │
└────────────────────────────────┴──────────────────────────────────────┘
   footer:  what the agent may do right now  ·  Stop
```

**Left is append-only and moves.** Newest last, the live entry still ticking. It is a transcript, not
a progress bar — R-13, and the reason is that a route which waives and reopens stations cannot honestly
be drawn as a bar.

**Right is the current truth and it is always actionable.** If a person can see it, they can change
it. A read-only right pane is the briefing dashboard we rejected.

**The footer carries MODE, not position.** *"Working on its own · will ask before it ships"* and a
Stop that always works. Never "step 3 of 7".

---

## The journey, station by station

Each row is: what the person sees appear on the **right**, and what they can **do** to it there.

### 1 · Discover  *(`sense`)*
**Right pane:** signals arriving as cards — the actual text of each, its source, when it landed — then
**visibly grouping into themes** as clustering runs. The grouping animating is the single most
convincing thing in the whole product, because it is the machine finding a pattern in front of you.
**Actions on it:** keep / discard a signal · rename a theme · *"this one matters most"*.
**Left says:** *"Read 14 signals from 3 sources. Two describe the same thing."*

### 2 · Decide  *(`decide`)*
**Right pane:** the decision as it is written — the call, what it rests on, what was weighed against
it. Then the part that is ours alone: **the forecast, as a live editable field.** *"I expect checkout
abandonment below 22%, and we will know by 1 September."*
**Actions:** edit the claim, the observable, the date · accept · *"no, here is what I actually think"*.
**This is the commitment moment.** It is the one thing that cannot be reconstructed later, so it is
the one moment the run deliberately slows down and shows its work.

### 3 · Plan  *(`define`)*
**Right pane:** the spec, section by section, appearing as written — problem, scope, **non-goals**,
acceptance. Non-goals get equal weight, because the design critic later halts on them.
**Actions:** edit a section in place · *"redo this one"* · mark a line as a non-goal.

### 4 · Design  *(`design`)*
**Right pane:** the surface brief, and where a prototype exists, **the prototype itself in a frame**,
not a link to one.
**Actions:** approve · send one instruction back (*"the empty state is wrong"*) without restarting.

### 5 · Build  *(`build`)*
**Right pane:** **the diff**, file by file, as it is written. Below it the checks, each with its own
state and clock — the Emergent pattern, and the one place a checklist is honest because a check run
is fixed-length and mandatory.
**Actions:** approve the PR · request a change · stop.

### 6 · Ship  *(`ship`)*
**Right pane:** the deploy steps with a live clock, then what actually went out and where.
**Actions:** hold · roll back.
**Known gap, and it is architectural:** `ship` has never written a track-member row, and
`release.publish` — the one tool correctly gated to `review` — **has never fired.**

> **CORRECTED TWICE ON 2026-08-31, and the second correction is the one to read.** The original said
> *"`deployments` holds 42 successful ones… So shipping happens and the spine does not see it. **The
> bridge is one write, not a redesign.**"* I replaced that with *"only 14 are real, and the newest is
> 51 days old"*. **That was also wrong, and S1 caught it within the hour by noticing our two numbers
> disagreed by eight days on the same table.**
>
> **THERE ARE TWO `is_sample` FLAGS ON THIS JOIN PATH AND THEY NEVER BOTH CLEAR.** `deployments` has
> its own, and it joins to `workspaces.is_sample`. Grouped by both — 42 rows, measured 2026-08-31:
>
> | `deployments.is_sample` | `workspaces.is_sample` | rows | newest `deployed_at` | newest `created_at` | with a changeset |
> | --- | --- | --- | --- | --- | --- |
> | false | **true** | 14 | 2026-07-10 | 2026-07-10 | 14 |
> | **true** | false | 4 | 2026-07-18 | 2026-07-18 | 1 |
> | **true** | **true** | 24 | **2026-07-18** | **2026-08-07** | 6 |
>
> **There is no `(false, false)` row.** My 14 are all on demo workspaces — the ones `track-tick.ts:85`
> deliberately skips — and S1's 4 are all flagged on the row itself.
>
> **AND THE TABLE CARRIES TWO DATES BECAUSE WE THEN GOT THE DATE WRONG THE SAME WAY (S1, same hour).**
> I quoted `created_at` and said 2026-08-07; S1 quoted `deployed_at` and said 2026-07-18. Both are
> that group's true maximum. **`created_at` is when we wrote a row ABOUT a deploy; `deployed_at` is
> the deploy** — and only the second answers *"when did we last ship"*. Measured: **20 of those 24
> rows have `created_at` LATER than `deployed_at`**, so somebody seeded demo data in August and dated
> it to July. `deployed_at` is null on none of the 42, so this is not a null-handling artifact.
> **Nothing shipped in August. By `deployed_at` the record stops at 2026-07-18, and at 2026-07-10 for
> anything not flagged sample on its own row.**
>
> **THE DEFENSIBLE LINE, and nothing softer: 42 deployment rows. ZERO are non-sample by both flags.
> 21 of 42 carry a changeset. 0 are reachable from any track.** Not "14 real and stale", not "4 real".
> **Nothing has shipped for real, ever, on this record** — there is no date to be 51 days past,
> because there is no qualifying row to carry one.
>
> *"Shipping happens and the spine does not see it"* is a plumbing gap a single write closes.
> ***"Nothing has ever shipped for real"* is a different problem and a much bigger one, and the bridge
> write does not fix it.** A lane reading either earlier line would conclude Ship is one row away from
> working. Found by S1 while building the Ship pane, who reported it rather than building around it —
> and who noted the consequence for their own surface: with no join from a track to a deployment, the
> pane cannot honestly say more than *"Ship filed no release"*.
>
> **THE RULE THIS EARNS, because a wrong number three times in one hour is a process defect, not bad
> luck: when a table carries more than one `is_sample` on its join path, a count of "how much is real"
> must clear EVERY flag and SAY WHICH ONES IT CLEARED — and when it carries more than one timestamp,
> the sentence must SAY WHICH DATE IT QUOTED.** Reaching for whichever flag is nearest is how two
> careful readers got 14 and 4 for the same question; reaching for the nearest date is how the same
> two then got 07-18 and 08-07, on the same rows, in the same hour. It is the sibling of the default-as-data rule
> in `SESSION-0-CONDUCTOR.md`: **a column that silently decides what counts as real will decide it
> differently for every author who does not know it is there.**

### 7 · Learn  *(`learn`)* — **the payoff, and the reason to come back**
**Right pane:** *"You said abandonment would drop below 22%. It is 24.1%. **You were wrong.**"* Beside
it, what the system now believes differently, and which future decision it will warn on.
**Actions:** agree · disagree with the grade and say why · reopen.
**It arrives on its own, on the horizon date.** The person does not go and look for it. **Nothing in
this product has ever reached here.**

---

## The things that are not stations, and where they live

**None of them are destinations. Every one of them is reached from the run.**

| Today | Becomes |
| --- | --- |
| **Brain** — a page you visit | **A line inside the run, before the decision**: *"Last time you shipped against an inactive telemetry source, it stalled at Design."* The brain earns its place by interrupting a mistake, not by being browsable. It stays future-tense until one forecast is graded (R-06) |
| **Engine Room / Guardrails / Govern / Boundary** — four routes for one concept | **The footer, and one settings page.** The footer says what the agent may do right now; the page is where you widen or narrow it. **This is the mandate** — see below |
| **Approvals** — a queue with 90 dead requests | **Gone as a destination.** The ask appears in the run, in front of the call it blocks, answerable with one control, and one answer covers the class. `/approvals` survives only as the overflow for things you skipped |
| **Memory** | Not a page. It is what makes the Brain line above appear |
| **Connectors / Integrations** | **Reached at the moment they are needed.** Discover finding nothing says *"I have no sources for this. Connect one?"* — inline, with the connect control right there. Never a shelf you browse first |
| **Skills** | What the agents already use. A person does not manage them; they see which one acted, in the transcript |
| **Projects** | A filter over runs, not a container you must create first. Antigravity required one, measured it, and shipped the bypass |
| **Settings** | Everything above that is genuinely configuration, in one place, reached rarely |

## The mandate — where Engine Room actually goes, and the strategic bet

**The angle `FRONTIER-BRIEF.md` §4 argues for, and I am adopting it as direction.** Developers use AI
in ~60% of their work and can fully delegate only 0–20%. **That 40-point gap is what we sell into.**

**The agent gets a stated authority** — a spend ceiling, a blast radius, a tool set, an expiry — acts
inside it without asking, and comes back with what it did, what it cost, and what it expected to be
true. **The forecast stops being the pitch and becomes the mechanism by which the authority widens or
narrows.**

**We have already built the engine and never plugged it in:** `resolveApprovalPolicy`
(**zero callers**, and its own header says *"a long approvals queue is a policy failure to surface,
not a workload to render"*), `autonomy-policy.ts`, spend and token caps on `agent_runs`, escalation
state on `agent_approvals`, and a four-rung trust arc. **120 of 323 approvals have real human answers**
— so unlike the empty record the brief assumed, there is something to widen on.

**On screen this is one sentence in the footer and one page behind it.** Not a governance console.

## Done

**A person types one sentence and, without navigating anywhere, watches the work carried from the
first station to the last — answering at most one question, asked in place — and is told whether it
did what it was supposed to do.**
