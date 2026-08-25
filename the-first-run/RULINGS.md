# Rulings — the settled calls

> _MAIN LANE writes this file. It is the tiebreaker._ **If any two documents in this repo disagree,
> this file wins.** Every ruling carries the evidence that decided it, so a lane can see why rather
> than only what. Dated so a later ruling can supersede an earlier one on the record.

---

## R-01 · The seven stations are a progress display, never a menu — 2026-08-25

**The contradiction this settles.** `BUILD-QUEUE.md` assumed station vocabulary on screen.
`REIMAGINING.md` said take it off every customer surface and cut 84 routes to 9. Both were in the
repo and a lane could not tell which governed. **That was my error, and this is the resolution.**

**Ruled:**

- **Stations are NEVER navigation.** No station in the rail, no station as a route a person browses
  to, no station name on a card face, no "Discover / Decide / Define" as doors. The learning curve of
  this product is the number of nouns in it, and a menu of seven internal stages is our org chart
  shown to a customer.
- **Stations ARE the step list inside one run.** The way `design-reference/mobbin-2026-08/emergent-live-steps.webp`
  draws a deploy: per-step state, a clock on the active step, everything ahead visibly pending. In
  that position the seven stations are the most useful thing on the screen, because they answer
  "where is my work and what happens next" without the person learning a model first.
- **The names shown are the user's, not ours.** `sense` already displays as Discover and `define` as
  Plan (`AppFrame.tsx:302-308`), and that mapping once leaked to a user as *"Waived: sense, decide"*
  under a rail saying Discover. **One vocabulary, on the display side, derived from one map.** A raw
  station slug reaching a screen is a bug.

**Why both halves are right.** A menu asks the person to learn the machine before they can use it. A
progress display teaches them the machine while it works for them. Same seven items, opposite cost.

## R-02 · We receive work, we do not hand it off — 2026-08-25

ChatPRD's document header offers `Open in → v0 · Lovable · Bolt · Magic Patterns · Replit · Linear ·
Cursor`. **We do not build that menu.**

**Evidence:** every destination on it is where the value accrues — ChatPRD makes six figures, Cursor
roughly $4B ARR. It is a product admitting its scope ends at the document. For us it would break the
only loop we have: work that leaves through an exit door never reports back, so the forecast recorded
before the work can never be graded.

**Ruled:** inbound GitHub outranks every integration on their shelf. A merged PR arrives, matches the
decision that authorised it, and on the horizon date the run reopens and says whether the change did
what it was supposed to. **One narrow outbound is permitted** — a brief with the forecast and run id
embedded, so work can be matched when it returns — and it ships only alongside the inbound half.

## R-03 · Every screen must let a person act — 2026-08-25

**Ruled:** the test every surface must pass is **can the person DO something here, or are they only
being told something?** A surface that only tells is a status panel and does not ship.

**What this rejects, by name:** the 2026-08-24 artifact *"Supaprod, Reimagined"*, whose regions were
*Needs you · At risk · What to build next · What got recorded · Nothing is running*, one of which
reads **"The crew is idle, and that is fine."** A surface whose best moment is telling you nothing is
happening has the product backwards.

## R-04 · Consent is asked in place, never queued — 2026-08-25

**Evidence:** 90 `cluster.trigger` approvals raised into `/approvals` since July — 42 cancelled, 38
expired, 10 pending, **zero ever approved.** A question that has to be found does not get answered.

**Ruled:** when a run needs a person, it asks **inside the run**, at the station that raised it, with
the consequence named and the decline path recorded. `/approvals` becomes the overflow for things
skipped, never the primary surface. A person must be able to answer the **class** of question, not
only the instance — 90 of those were the same question.

## R-05 · No mascot — 2026-08-25

**Ruled:** no character, mascot or greeting illustration that speaks on the product's behalf.

**Why:** the buyer is a person accountable for merging output they did not write. A cartoon greeting
them while an agent edits their repo reads as the product being pleased with itself, and costs
exactly the trust this product needs most. A mascot is also the hardest thing to remove later.

**What we do instead:** the register is Sentry's restrained line-art
(`design-reference/mobbin-2026-08/sentry-restrained-illustration.webp`) — small, off-palette, beside
the content rather than performing at it. **The distinctiveness budget goes into the run moving**: a
step changing state, a clock ticking, a question appearing where the work is.

## R-06 · Nothing enters positioning until a person outside this building has reached it — 2026-08-25

**Evidence:** `ThreeLayers.tsx` currently ships *"It learns, and it guides"* in the present tense
against **zero grades in production**, which the positioning canon's own §4 already bans. Four
accelerators declined a pitch led by the one claim a single SQL query falsifies in the room.

**Ruled:** a claim goes on a customer surface only when a route renders it and someone who is not the
founder has reached it. **Until one real forecast is graded, layer 03 is future tense everywhere.**

## R-07 · One ordered backlog. Pull by path, never idle — 2026-08-25

**The question.** Should the queue assign work per lane, or should whichever lane is free take the
next pending item off the top?

**Ruled: one ordered backlog, and a lane pulls the topmost unblocked item WHOSE PATH IT OWNS.**

**Why not pure pull.** The lanes are separated by path ownership and that split is load-bearing: two
writers on one prefix is what broke `main` on 2026-08-22. A free LANE 0 taking "collapse the
duplicate routes" would be writing `src/routes/**`, which is LANE 1's. Pure pull produces exactly the
failure the split exists to prevent.

**Why not fixed assignment either.** A lane that finishes its list and waits is pure waste.

**The property that makes this work:** path ownership is **disjoint**, so **no two lanes can ever
contend for the same item.** The path tag decides the owner uniquely. Claiming is therefore
ADVISORY — it tells MAIN what is in flight — and never a lock. There is no race to lose.

### The rules that follow

1. **The queue is ONE ordered list, most valuable first.** Each item carries the path it touches; that
   tag names its owner.
2. **A lane takes the topmost item it owns that is not `BLOCKED` or `WIP`.** It scans past blocked
   items rather than stopping at one.
3. **A lane never idles and never crosses a path.** Owning nothing unblocked means STANDING WORK
   (below) plus `coordination/requests/<n>-starved.md`. **A starved lane is MAIN's failure.**
4. **MAIN keeps at least three unblocked items per path stocked ahead**, in priority order.
5. **MAIN never writes an item that spans two paths.** It splits it and names the seam — the way the
   `TrackRun` stub was split from the route that mounts it, so both lanes work in parallel from the
   first minute. **A cross-path item is a MAIN bug.**
6. **Claiming is a push, not a reservation.** One line into `coordination/units/`, pushed before
   starting. Nothing waits on it and nothing breaks if it is late.

### Standing work, so no lane is ever blocked on me

**LANE 0**: find components with zero importers and either mount them or delete them with the reason
recorded — this repo's dominant defect, and there is always more of it. Then retired-token sweeps and
empty states that lie.

**LANE 1**: the route census. 84 authenticated routes, 48 pure redirects. Open one, decide keep /
redirect / delete, one commit each with the evidence. A month of honest work that never blocks.

**Neither lane invents product scope while starved.** Standing work is cleanup and wiring only.

## R-08 · What "agent-first" means here, and where stickiness actually comes from — 2026-08-25

**Founder, restating the objective:** *"How do we make a platform truly agent-first from a user lens?
How do I create more stickiness and make him feel we are solving the real pain? A user would not
appreciate a founder saying 'I have so many features' if a simple outcome is not seen."*

**Ruled, because these are two different problems and conflating them is how we got here.**

**Agent-first is a property of who does the walking.** Today the person walks and the system waits:
84 doors, and the user assembles the journey by navigating. Agent-first means **the person states an
outcome and the system carries it, consulting them only when it must.** The test is not how many
agents exist. It is: *after the first sentence, how many more times must the person act before
something useful exists?* Today that number is unbounded, because the run stops and cannot say so.
**Target: exactly one — the consent moment, asked in place.**

**Stickiness is a different property, and the honest version does NOT come from accumulation.**
The tempting answer is "the record compounds, so leaving costs you history." That answer is
contradicted by our own numbers: 14 forecasts, all agent-authored, **zero due for another twelve
days**, so nothing has compounded and nothing can for a quarter. A product that only pays after a
year of data cannot be sticky in week one, and week one is where we are.

**So stickiness has to pay on the FIRST run.** The transaction is: *you said this change would do X.
Something that did not write the change checked, and it did / did not.* That is useful the first time
it happens, needs no history, and is the one thing a coding agent structurally cannot do for itself
because it wrote the diff and cannot be its own counterparty.

**What this rejects, concretely:**

- **Feature breadth as an argument.** Connectors, agent counts and station diagrams are our org chart.
  A user does not care, and the founder is right that saying it out loud reads as a product that has
  not seen its own outcome.
- **Value that requires waiting.** Anything whose payoff needs a quarter of data does not ship as the
  headline. It can be true later; it is not the reason to start.
- **Polishing surfaces before one run finishes.** In three months no track has walked from the first
  station to the last. **Until that happens, no design work is the priority**, and any lane item that
  does not move one piece of work one step forward is deferred.

**The measure that governs the next ten days:** a person types one sentence, and without navigating
anywhere, sees the work carried to a finish and is told whether it did what it was supposed to.

## R-09 · Overnight operating rules while the founder is asleep — 2026-08-25

**In force 2026-08-25 ~02:00 until the founder returns (~8 hours).**

1. **MAIN decides on the founder's behalf**, taking the long-term platform view. A call that would
   have gone to him is made, recorded in this file with its reasoning, and flagged for review rather
   than blocking the night.
2. **Anything genuinely irreversible waits.** Deleting customer data, changing prices, sending
   anything outward, or a schema change that cannot be rolled back is documented and left.
3. **MAIN owns migrations, end to end.** Written by hand, applied **individually**, verified after
   each one. **Never handed to Lovable to apply** — it concatenates them and drops rows; the
   migration ledger has already fallen days behind the real schema more than once.
4. **MAIN builds, verifies and deploys.** Lanes do not deploy and have no database.
5. **Minor defects in lane output are MAIN's to fix, not to bounce.** A typo, a wrong token, a broken
   import, a missing null guard — fix it, note it in the unit file, move on. Round-tripping a
   five-minute fix through a lane costs an hour. **Anything structural still goes back**, because a
   lane that never sees its own defect repeats it.
6. **The night's single objective is the run that finishes.** Everything else yields to it.

## R-10 · The three lanes, and what each must know about the others — 2026-08-25

**Every lane is told this, because a lane that does not know the others exist writes as if it owns
the repo.**

| | Runs on | Does | Has | Does NOT have |
| --- | --- | --- | --- | --- |
| **MAIN LANE** | Claude Code | Directs, architects, rules, verifies, audits, owns the database, migrations and deploys, and fixes minor defects in lane output | Lovable MCP (DB), Mobbin, deploy, the founder | — |
| **LANE 0** | OX Alpha / opencode | Builds `src/components/**` except `meridian/` and `shell/` | Playwright, its skills, the repo | No DB, no Mobbin, no deploy, no founder |
| **LANE 1** | OX Alpha / opencode | Builds `src/routes/**` except `api/`, `src/components/shell/**`, `src/styles/**` except `meridian.css` | Playwright, its skills, the repo | No DB, no Mobbin, no deploy, no founder |

**What follows for a building lane:** you are not alone in this repo and you never write outside your
prefix. Anything needing the database, a deploy, a design reference you cannot see, or a founder
decision is a `coordination/requests/` file — MAIN answers in minutes, not hours. **Do not work
around a blocker by reaching into another lane's path.** That is the failure that broke `main`.

**What follows for MAIN:** two lanes stall without me, so requests are answered before new work is
started. A starved lane is my failure.

## R-11 · Verification: a lane never signs off its own work — 2026-08-25

**Ruled: the lane that built it does not get to certify it. The OTHER lane does.**

A builder cannot see its own blind spot. Every "it works" claim in this repo that later turned out
false was made by whoever wrote the thing: nine features found doing nothing in production had unit
tests asserting the defect as the contract; two sessions reported a palette working that was never
mounted; an agent committed *"M-phase complete, both lanes unblocked"* over three endpoints that
could not compile.

### The three passes, and nothing ships without all three

**Pass 1 — the builder's own gate, before push.** `bunx tsc --noEmit`, `bun test`, `bun run lint`.
**Never pipe a gate into `tail`** — it reports `tail`'s status and `main` shipped red exactly that
way. **12 test failures are pre-existing; do not claim them and do not silently fix them.**

**Pass 2 — CROSS-VERIFICATION by the other lane.** When a lane finishes an item it files
`coordination/requests/verify-<item>.md` naming: the route to open, the exact thing to look for, and
what would prove it FALSE. The other lane picks it up as a standing-work item, drives it with
Playwright, and writes `coordination/units/verified-<item>.md` with a screenshot path and a verdict.
**A verifier that only confirms is not verifying — it must state what it tried that should have
broken it.**

**Pass 3 — MAIN against production.** Only MAIN has the database and the deploy. MAIN checks the
write actually landed, in the right table, on the right workspace, with the query recorded. **A
number without its query is not evidence** — three metrics that proved this product worked were all
seed data and nobody could re-check them.

### The end-to-end pass, when the backlog's top ten are done

One person, one sentence, one run, no navigation: type intent → watch the run walk → answer the one
consent moment → see the artifact appear → reach the verdict. **Both lanes walk it independently with
Playwright and report separately.** If the two reports disagree, that disagreement is the finding.

**A mount is not a render.** An element in the tree proves the element is reached, never that the
feature exists. Screenshot it, or assert on real text.

## R-12 · The neglected surfaces get a design review before more is added to them — 2026-08-25

**Founder:** *"Settings, Brain, Engine Room, Today feel like content was dumped, or no real thought
given to why, how, what needs to be there: which colour, which components, which icon. That design
review was not done."*

**Accepted. Ruled: no surface gets more content until it has answered the five questions**, and the
answers live in the unit file, not in someone's head:

1. **Who is here, and what did they come to do?** One sentence. If it needs two, it is two surfaces.
2. **The ONE thing this surface exists for.** Everything else on it is that thing's evidence, or a
   door out of it.
3. **Keep / move / kill**, per region, with the reason. A region nobody can name a job for is killed.
4. **Which Meridian component**, by name, for each region — and which one was checked first and did
   not serve (`MERIDIAN-ADOPTION.md`). **No new component without that sentence.**
5. **Can a person DO something here** (R-03), or does it only tell them things?

**Colour, icon and mark are ruled, not chosen per surface:** one colour carries the one fact the
person came for — what is live now. Everything settled is quiet. **The brand ember stays in the logo
and never in an interaction state.** Icons come from the existing glyph sets
(`station-glyphs.tsx`, `work-glyphs.tsx`, `agent-glyphs.tsx`, `marks.tsx`) — **two of which are
themselves unadopted**, so the answer is usually "use the one that exists".

**Order, by how many people hit it:** Today → Engine Room (guardrails + approvals) → Brain →
Settings. **Today is first because it is the post-auth landing**, and backlog item 2 replaces it with
job cards anyway — so the review must happen before that, not after.

## R-13 · R-01 REVISED. The left pane is a transcript, not a station map — 2026-08-25

**This supersedes the second half of R-01. The first half stands: stations are never navigation.**

**The evidence that changed it.** Anthropic shipped the ticking checklist, measured it, and **turned
it off**: `TodoWrite` is *"Disabled by default"*, and *"Claude keeps track of multi-step work without
a written checklist, and Claude Code doesn't provide the tools that fill this list, so it stays
empty."* Across Claude Code, Codex/Symphony, Jules, Antigravity, Devin and Wispr Flow, **not one
renders a lifecycle coordinate.** Full argument: `FRONTIER-BRIEF.md` §1.

**The distinction that settles it, and it is not "steps are bad".**

| Shape | What it is | Verdict |
| --- | --- | --- |
| **A coordinate** — "step 3 of 7", a seven-row map that is always on screen | The machine's model of itself, imposed on the person. Tells you where you are in OUR process | **Killed.** This is what Anthropic removed |
| **A transcript** — an append-only stream of what the agent did, each entry carrying what it produced, the live one still moving | What actually happened, newest last. Tells you what you now HAVE | **This is what we build** |

**Why the Emergent reference does not overturn this.** Emergent draws a *deploy*: fixed length, known
in advance, every step mandatory, no branch. A seven-station product lifecycle is none of those — it
waives stations, reopens them, and skips whole stretches when work enters at Plan. **A progress bar
over a route that changes is a lie with a clock on it.**

**So, ruled:**

- **No persistent seven-row station widget.** Backlog item 5 as originally written is **cancelled**.
- **The left pane is the transcript.** `TrackActivity` already builds exactly this and already carries
  the handoff — the moment one agent gives the work to the next — which is the product's whole claim
  and is strictly more informative than a coordinate.
- **A station is named in passing, at the moment it changes**, as one line in the stream: *"Plan →
  Design. The spec is written."* It is a marker inside the transcript, never a widget beside it.
- **The footer carries MODE, not position** — what the agent is allowed to do right now, and the one
  control that changes it. Claude Code's footer says `⏵⏵ accept edits on`; it never says step 3 of 7.
- **`run-rows.tsx` is still the vocabulary** (`MERIDIAN-ADOPTION.md`) — `RunGlyph`, `RunClock`,
  `RunSubject`, `RunRail`. Those draw transcript entries perfectly. Only the seven-row map dies.

**What the person can still answer at a glance** — the question a coordinate was meant to serve:
*"what is happening now, and what do I have?"* The transcript answers both better, because it carries
the artifacts. *"How far through am I?"* is a question about our process, and it is not theirs.

## R-14 · No outreach until the loop runs. Founder's call, and it is right — 2026-08-25

**Founder, holding the design-partner kit deliberately:** *"if a product is not solid and I myself
could not see the real outcome, how would I reach out to a user... it does not make any value. Once
you get this, act and show me the real outcome."*

**Ruled, and MAIN stops recommending otherwise.** The 0-of-25 figure in `FRONTIER-BRIEF.md` §2 and
`market-validation-2026-08.md` §7.1 is **not a failure of follow-through**. Sending 25 people to a
product where no journey has ever finished spends the one asset a pre-launch company cannot rebuy —
**the first impression of 25 named people who were willing to look.**

**The gate:** outreach opens when a person can watch a run go from the first station to the last and
be told whether it worked. Not before. **`docs/pitch/design-partner-kit.md` is HELD, not late**, and
any document counting it as overdue is corrected to say so.

## R-15 · Build beside, not underneath. No `/v2` prefix — 2026-08-25

**Founder's concern, and it is the right one:** *"instead of directly going and building, can you use
a URL... we are not disturbing the main work that is sitting there. Once I verify and I am okay, we
can move to main."*

**Ruled: the safety he wants is correct, and a parallel route tree is the expensive way to buy it.**
Three different mechanisms, chosen by what the item actually is.

### 1. A NEW surface that collides with nothing → ship at its FINAL url

`/track/:trackId` is new. It does not touch `/discover`, `/plan`, `/decide` or anything else — those
files were never opened. **Nothing is being disturbed and there is nothing to protect it from.**
Putting it at `/v2/track/:id` would buy no safety and cost a rename of every link at promotion time.

### 2. A REPLACEMENT → build it at its own new url, promote with ONE redirect

The landing is the only genuinely risky item, because item 2 replaces the post-auth home.

**So: do not modify `_authenticated.today.tsx`.** Build the new landing at **`/start`**, a new route
that costs nothing and breaks nothing. `today.tsx` stays exactly as it is, reachable, unchanged.

**Promotion is one line**, and the seam already exists: `src/routes/_authenticated.tsx` already has a
`beforeLoad` that redirects (`/login`, `/onboarding`). Point it at `/start` instead of `/today`.
**Reverting is the same line.** The founder can open `/start` any time and compare it against `/today`
side by side before anything becomes the default — which is exactly what he asked for, and it also
satisfies the standing rule that a rejected design must remain something he can look at.

### 3. A DELETION → last, and only after the new path is proven

Collapsing the duplicate doors and the 48 redirect routes is the only irreversible move here.
**It happens after a run has finished end to end, never before.** Backlog item 6 moves behind items
1-4. Everything else can be undone with a revert; a deleted route with an unknown inbound link cannot.

### Why not the prefix, stated plainly

- It **doubles a route tree that already has 84 entries**, and route count IS the learning curve.
- Every internal link has to know which world it is in. Links are where this breaks silently.
- Auth and layout wrappers get duplicated, then **drift** — and drift between two copies of one
  surface is exactly the arbitrariness failure `run-rows.tsx` was written to end.
- **Promotion becomes a rewrite of every path.** Under mechanism 2 it is one redirect.
- Two live code paths mean every future fix must be made twice, and one of them will be forgotten.

**The founder's underlying requirement is fully met:** nothing existing is modified, he verifies at a
real URL before anything switches, and switching is one reversible line.

## R-16 · MAIN's full role: reviewer, approver, and the one who never stops finding gaps — 2026-08-25

**Founder, correcting my description of the job.** MAIN is not only direction, database and deploy.
Adding, and these are duties not options:

**1. REVIEW TO AN ENTERPRISE B2B STANDARD, then approve or reject.** Every lane push is reviewed
against three things, in this order: **does it serve the product goal** (a person watches the work
finish and is told whether it worked); **would it survive an enterprise buyer** — multi-tenant
isolation, an audit trail, permissions, no data crossing a workspace, a failure that says what
failed; and **does it meet the design contract**. A push that passes tests and fails any of these is
rejected with the reason. **Nothing merges on green tests alone.**

**2. FIX MINOR DEFECTS DIRECTLY. Do not route them through the queue.** A typo, a wrong token, a bad
import, a missing null guard, a copy slip — MAIN fixes it in place and notes it on the unit. **Putting
a five-minute fix in the build log costs an hour of round trip and teaches nobody anything.** Only a
*structural* defect goes back, because a lane that never sees its own structural mistake repeats it.

**3. NEVER STOP FINDING GAPS.** This is the duty most likely to be dropped, so it is stated hardest.
**The backlog is not a fixed list to burn down. It is a living queue MAIN refills continuously**,
from: driving real tracks and reading what the agents actually said; querying production for what is
written but never read; auditing surfaces against R-12's five questions; the unadopted-component
census; and every audit document in the corpus that was never actioned.

**MAIN's own honest assessment, 2026-08-25:** the 15 items in the backlog cover the run workbench and
four surfaces. **That is a slice of the platform, not the platform.** Untouched so far: onboarding and
the empty-state path, billing and plan limits, multi-tenancy and permissions, notifications, search,
error and offline states, mobile, accessibility, the admin surfaces, connector setup and failure,
data export and deletion, and the whole of Settings. **A queue that never grows is a queue that has
stopped looking.**

**The standard MAIN measures against:** the platform must be lightweight, low-friction, low
learning-curve, and worth returning to. **Every gap found is measured against "does this move one
piece of work one step forward" and dropped if it does not.**

## R-17 · Meridian: a lane is never blocked, and Meridian keeps one author — 2026-08-25

**Founder's question:** *"You say only MAIN can add to Meridian. Why? What if a lane needs one — does
it come back to you and you design it and pass it on?"*

**Yes, and the lane does not wait. Both halves matter.**

**Why Meridian keeps one author.** `run-rows.tsx` exists because `PlanCard`, `RunTimeline` and
`ToolStream` were three views of one run built by three hands, ending in three mark sizes, three
gutters, three subject sizes, and two with no time column — every one of which passed typecheck,
tests and the ratchet. **A design system with three authors becomes three design systems**, and the
drift is invisible to every automated check we have. MAIN also holds the two references a lane cannot
see: Mobbin, and beautifui.dev as the floor to port from.

**Why a lane is still never blocked.** The flow:

1. **The lane builds what it needs in ITS OWN path, immediately.** A local component in
   `src/components/track/` or `src/components/shell/`. It ships, the item is not held.
2. **Same commit, it files `coordination/requests/mrd-<name>.md`** — what it needed, what Meridian
   component it checked first, why that did not serve, and the props it used.
3. **MAIN reviews within the hour**, and does one of three things: names an existing Meridian
   component the lane missed; **promotes the lane's component into `src/components/meridian/`**,
   generalised, tokenised and documented in `docs/design/DESIGN-SYSTEM.md`; or designs a better one
   against beautifui.dev and Mobbin and hands it back.
4. **The lane swaps its local component for the Meridian one** in a follow-up unit and deletes its own.

**So the answer to "does it come back to you" is yes — but never as a blocker.** The lane keeps
moving; Meridian gains a considered primitive instead of a hurried one; and the documentation happens
once, so the next lane finds it instead of building a fourth copy.

**The one hard line:** a lane never EDITS an existing file in `src/components/meridian/`. Editing a
shared primitive changes every surface using it, and only MAIN can see all of them.

## R-18 · The acceptance criterion, stated strictly — 2026-08-25

**Founder, and this replaces every looser phrasing anywhere in this repo:**

> **One piece of work enters at the first station and completes ALL SEVEN — sense, decide, define,
> design, build, ship, learn — driven entirely by agents, with NO human touching it mid-run, and a
> person can WATCH it happen on one screen.**

**Met only when all six are true, each proven rather than asserted:**

1. A track that entered at `sense` reaches `learn`, **proven with SQL**. Never happened: 59 tracks,
   58 entered at `sense`, zero reached `learn`.
2. **No human intervention mid-run** — no unsticking, no database edit, no re-drive by hand. **A
   stall is a failure of this goal, not a step in it.**
3. **Visible while it happens** — one screen shows each station act, what it produced, and the
   handoff, without navigating anywhere.
4. **Starts from one sentence**, zero configuration.
5. **Ends with a verdict** — what was predicted, what actually happened.
6. **Evidence recorded** — SQL, track id and a screenshot in `EXPERIMENT-first-finish.md`.

**Anything short of all six is NOT done.** A run needing a nudge, a stall nobody sees, or a station
silently producing nothing each fail it. **Progress is never reported as completion.**

**Note on clause 2 and the consent moment.** R-04 requires the run to ask a person in place when it
genuinely needs one. That is not a contradiction: the acceptance run must complete **without needing
one** — the mandate (R-16 §4, `FRONTIER-BRIEF.md` §4) is what makes reversible work proceed on its
own. **If the acceptance run pauses for consent, the gate is mis-set**, and `release.publish` — the
one irreversible act, correctly gated, which has never once fired — is the only place a pause is
legitimate. Everything else pausing is the inverted gate, not governance.

## R-19 · Mobile is deferred. Accessibility is not — 2026-08-25

**Founder:** *"I'm not willing to launch a mobile application at this point. Ignore the items
relevant to that for now."*

**Ruled, and the distinction is deliberate because the gap audit covers both:**

- **DEFERRED: small-screen and responsive work.** Anything whose only justification is a phone or a
  narrow viewport is dropped from the queue. Do not build it, do not test for it.
- **NOT DEFERRED: accessibility.** Keyboard reachability, focus management, `aria-live` on anything
  that updates asynchronously, and not using colour as the only signal. **This is an enterprise
  procurement blocker, not a mobile concern** — a buyer's security and accessibility review will ask,
  and a run transcript that streams without announcing is unusable to a screen-reader user on a
  desktop. It stays in scope at full weight.

The layout must still not *break* below the Meridian breakpoint — `SPEC-LAYOUT.md`'s stacking rule
stands, because that is one line of CSS, not a mobile product.

## R-20 · The design review is a gate, and "premium" is defined so it can be failed — 2026-08-25

**Founder:** *"Along with enterprise review you need to do the DESIGN review — absolutely delivering a
premium platform. How modern, how premium, how ultra-premium. Stickiness high. And all the Meridian
components should in some form be utilised across the surfaces, because Meridian is built on
beautifui.dev."*

**Ruled: every lane push passes an ENTERPRISE review and a DESIGN review. Both are gates. Neither is
advisory.** A push that is correct and cheap-looking is rejected, exactly as one that is beautiful
and leaks tenants is rejected.

**"Premium" is not a mood. It is these eight, and a reviewer must be able to point at the failing
one.** If MAIN can fix it in place it fixes it (R-16 §2); if it is structural it goes back.

1. **RESTRAINT.** One colour carries the one fact the person came for — what is live now. Everything
   settled is quiet. **Count the accents on the surface: more than one live signal is a fail.** The
   brand ember stays in the logo and never in an interaction state.
2. **RHYTHM.** One spacing scale, one grid, optical edges aligned down the column. `run-rows.tsx`
   exists because three views of one run shipped with three mark sizes, three gutters and three
   subject sizes — **every one passing typecheck, tests and the ratchet.** Automated checks cannot
   see this; a reviewer must.
3. **TYPE.** The Meridian scale only. **A hardcoded size or weight is a fail**, not a nit — this repo
   drove hardcoded sizes 259 → 157 and the count must keep falling.
4. **MOTION THAT MEANS SOMETHING.** Enter instantly, exit gently, and only where state actually
   changed. **A raw duration is a fail**; use `--ease` / `--d-*`. Movement that decorates rather than
   reports is worse than none.
5. **THE SAD PATH IS DESIGNED.** Empty, loading, failed, held and permission-denied get the same care
   as the happy path. **An empty state that does not say what to do next is a fail.** This is where
   cheap products are exposed, and ours has four of seven stations commonly producing nothing.
6. **NO DEAD END.** Every surface offers the next action (R-03). A screen that only tells is a fail.
7. **PORTED, NOT EYEBALLED.** beautifui.dev is the **floor**, and mechanics come from its real source,
   never from a screenshot. A value chosen because it "looked right" is a fail; a value with a reason
   is not.
8. **DENSITY EARNS ITS SPACE.** Premium is not empty. Every region either carries a fact the person
   came for or is removed.

### The Meridian utilisation duty

**Target: every Meridian component is used somewhere real, or is deleted.** Measured 2026-08-25: 121
components, 95 adopted, **17 real components built with no importer** — including `run-rows.tsx`,
22.8KB of run vocabulary ported from beautifui.dev that nothing reached for while three surfaces each
invented their own.

- **Every design review asks, per region: which Meridian component serves this?** A region using a
  bespoke div where a primitive exists is a fail.
- **Adoption is a number MAIN tracks and it must go UP.** Report it in `MERIDIAN-ADOPTION.md` as items
  land. A component still unadopted after its natural surface ships gets **deleted with the reason**,
  because inventory nobody reaches for is the defect this whole mission is about.
- **This is not decoration.** Meridian is where the premium already lives — it was ported from
  beautifui.dev deliberately. **Using it IS the shortest path to the look the founder wants**, and
  reinventing beside it is how the product got three gutters for one row.

### When a lane authors a Meridian component (with R-17)

A lane builds locally and files `mrd-<name>.md`. **MAIN does not merely promote it — MAIN reviews it
hard against all eight above, and tweaks or rebuilds it before it enters `src/components/meridian/`.**
A primitive is used by every future surface, so a mediocre one is a debt charged forever. **Promotion
is where the standard is set, and it is the one review MAIN never rushes.**

## R-21 · The dev server stays off, and you stop the one you started — 2026-08-25

**Founder, repeated across sessions and now binding on all three lanes:** *"Use the dev server only
when required. Once the job is done, END it, so it does not put load on RAM and processing power and
get the system frozen or restarted."*

**This is not housekeeping. The machine has actually been driven to a restart by it**, and three
agents each leaving one running is three times the cost, on the founder's own laptop, while he is
asleep.

### The rule

1. **Do not start it to "check something".** `bunx tsc --noEmit`, `bun test` and reading the source
   answer almost everything. A dev server answers exactly one question: *what does this look like
   when rendered.*
2. **Start it only when a change genuinely must be seen in a browser** — a Playwright verification
   (R-11 pass 2), or a screenshot the acceptance requires.
3. **STOP IT THE MOMENT THAT CHECK IS DONE.** Not at the end of the unit, not at the end of the
   session — the moment the screenshot is taken. **A server left running "in case" is the failure.**
4. **Before starting one, check nothing is already listening.** Another lane may have one up, and
   three servers on one laptop is what causes the freeze. Reuse it or wait.
5. **Never background it and walk away.** If you start it in the background you own killing it, in
   the same unit, before you commit. **A unit is not finished while a server it started is alive.**
6. **If a session ends unexpectedly, the next one kills orphans first.** Check for a listening port
   before anything else and stop what you find.

**The check that makes this real:** a lane's unit file records whether it started a server and that
it stopped it. **A unit claiming a browser verification without that line is rejected on review.**

---

## R-22 · An unset ceiling is the default, never "unlimited" — 2026-08-25

**Decided by MAIN on the founder's behalf while he was away, because it is reversible and leaving it
open meant leaving the guard off for another night.** R-09 allows this; the irreversible calls stay
with him.

**The finding.** `workspaces.default_track_spend_cap_usd` shipped with no column default and was
never backfilled, so it was null in **all 21 workspaces**, and `resolveTrackSpendCap` read that null
as a workspace that had *deliberately cleared its ceiling*. **Nobody had made that decision and
nobody could: there is no surface anywhere in the product that clears it.** So the one guard that
makes the unattended story sayable has been off everywhere, for as long as the column has existed.

### The rule

**At the WORKSPACE level, an unset ceiling means the product default. It never means unlimited.**
A workspace that genuinely wants no ceiling has to say so with a number, not with an absence.

**At the TRACK level, an explicit `null` still means "no ceiling on this one".** That is a person
acting on one piece of work, in one place, and it stays. The distinction the parameter already drew
between `undefined` (nobody said) and `null` (somebody said none) was right; the column was the half
that could not tell them apart.

**This generalises, and that is why it is a ruling and not a bug fix.** Whenever an absent value and
a chosen value share one representation, **the absent one must resolve to the SAFE reading.** The
file that got this wrong had the correct principle written three paragraphs above the line that
broke it: *"failing to `null` would let a database hiccup silently remove the limit."* An unset
column is the same hazard as an unreadable one.

**Reversal costs one migration** if the founder wants workspace-level opt-out. Applied as
`20260824230000`, verified 21 of 21.

---

## R-23 · A function that lands without a door is not finished — 2026-08-25

**Six instances in three days**, which is enough to stop calling it a coincidence: `createWorkspace`,
`draftContractFromIntent` (140 lines, zero callers), `reopenForecast` (zero callers while the copy
promises it), `recordJudgment`'s unreachable forecast parameter, `ensureDefaultProduct`, and now
`decideApprovalItems` — built, tested, and referenced by **nothing but its own test**, while the
governance doctrine's headline policy offer has never had a surface.

**This repo's dominant defect is work that exists and nothing reaches.** `TrackActivity` sat unread
for 24 days. `run-rows.tsx` is 22.8KB nobody imports.

### The rule

**When a function lands, its unit file names the surface that calls it, or states why there is
none.** Not a plan to build one later. Either a caller in the same unit, or one sentence saying the
door is deliberately deferred and what carries it.

**A unit that adds an exported function and names no door is sent back on review.** This is cheap to
comply with and it is the only check that catches the defect at the moment it is created rather than
in a census three weeks later.

---

## R-24 · A mission happens INSIDE a track. They were never alternatives — 2026-08-25

**`chat.ts:1130` has deferred `startTrackCore` pending "the mission/track question — whether a chat
dispatch creates a mission, a track, or both, and which id the SSE `mission_id` frame returns."
Item 16 is blocked on it, and it is an architecture call, so it is mine (R-09).**

**The question contains a false choice, and the code already answers it.**

- A **track** is *"the one object that walks all seven stations"*: identity, intent, and route. Its
  own header says what it owns — *"this is one piece of work, and here is its address."*
- A **mission** is Build's container. `driveTrackOnce` opens one **at Build and nowhere else**,
  because *"Build is the one station whose tool refuses without a mission"*, and six of the seven
  stations dispatch with `missionId = null`. `spine_track_members` then files the mission as a member
  **at the `build` station**, exactly like a prototype at `design` or a decision at `decide`.

**So a mission is an artifact of one station of a track.** Asking whether a dispatch creates "a
mission or a track" is asking whether writing a document creates a paragraph or a document.

### The ruling

1. **A chat dispatch that is a piece of work creates a TRACK.** Through `startTrackCore`, with the
   route the plan gate already had a person confirm.
2. **The mission is not created by the dispatch.** It is opened by the Build station if and when the
   work reaches Build, which is what already happens for every driver-run track.
3. **The SSE frame returns the TRACK id as the work's identity.** `mission_id` stays on the frame and
   keeps meaning what it has always meant — the Build container — and is null until Build opens one.
   A surface that wants to follow the work follows the track.
4. **A dispatch that is NOT a piece of work — a question, a lookup, a one-shot — creates neither.**
   That is a chat turn, and turning every question into a track is how 59 tracks become 5,000.

**Why this is the answer and not a preference.** The alternative — dispatch creates a mission and a
track is promoted from it later — is the shape the product has today, and it is what F-04 measures:
the app-wide box says *"What should we build?"*, files a mission, and the run workbench cannot see
it. **The mission/track question is not open; it was answered by whoever wrote the Build ternary and
never written down.**

### Until item 16 is built

The interim in the queue stands and is now unambiguous: **`AskDock` must stop saying "What should we
build?" while it opens a chat.** That copy promises the loop and delivers a conversation. Its file is
`src/components/**`, so the change is LANE 0's; the ruling is mine.

---

## R-26 · A station that was REFUSED is not a station that failed — 2026-08-25

**Taken on the founder's behalf while away. Reversible: delete the hold and the two set entries.**

**The rule.** When a station files nothing *because a tool refused it*, that is a different fact from
a station that ran and did its job badly, and the two may not share a hold. A refusal costs no
attempt, triggers no correction, names the tool and the message, and stops the sweep from
re-dispatching it.

**Why it needed deciding rather than queueing.** All eight hold reasons described the WORK — filed
nothing, filed the wrong thing, ran long, ran out of money. **None could say the tools are down.** So
on 2026-08-25 a GitHub 401 was filed as `produced-nothing`, whose line to a person reads *"This
station ran but filed nothing... **It will try again.**"* It tried three times, and at the ceiling
`decideCorrection` did exactly what it is built to do — *"the fix may live at an earlier station"* —
and sent track `8391835f` from `build` back to `define`. **The work it discarded was correct**: a
faithful spec, six well-scoped tasks and a real prototype. Rewriting them could not have opened
GitHub. This is R-16's *"a failure that names what failed"* applied to the one place it was missing.

**The one judgement inside it, which is the part worth your eye.** `tools-refused` is **terminal for
the sweep**, alongside `given-up` and `station-cannot-finish` — but for a different reason than
either. Those two are terminal because neither asked for anything. This one asks loudly, for a
working credential. It is terminal because `RESUMABLE_HOLDS` resumes by re-checking whether an ask
has been met, and *"is GitHub reachable again"* can only be answered by dispatching a paid run. **A
resumable version would spend an agent every tick to be told no.** So a person reconnects it and
starts the work again, and the hold line says that in those words rather than promising a retry.

**Reverse it if** you would rather burn a run per tick to get automatic recovery. That is the whole
trade and it is the only thing this ruling decides.

**Deliberately narrow.** Only errors that mean the door was locked count — 401, 403, unauthorised,
forbidden, bad credentials, permission denied, expired token, not set, not configured, setup pending.
A validation error, a not-found or a bad argument is still the station's problem. **And an approval a
person DENIED is not a refusal**: that is the governance floor working, and it already has
`waiting-on-a-person`. Widening this list would let a real defect hide behind a hold that says "not
your fault", and the attempts ceiling would stop protecting anything.

Ledger **F-41**. Code: `refusedTool` in `driver.ts`, the branch in `driver.server.ts`,
`TERMINAL_HOLDS` in `correction.ts`, guarded by `a-refused-station-is-not-a-failed-one.test.ts`.

## R-25 · The forecast is written at Decide, so a route without Decide has no moat — 2026-08-25

**Asked by LANE 1 as REQ-2. Granted on the principle, refused as written, and landed on two of the
three shapes.**

**The argument.** `decision.record` writes the forecast and refuses a decision that has none. It is
the only tool that writes one. So a route that waives Decide **structurally cannot capture the thing
the positioning canon calls the moat** — *what a team believed would happen, recorded before the
outcome was known*. Four of the five shapes waived it, which left the moat reachable from one card in
five. A contradiction between the route model and the canon is not a preference to be balanced; one
of them is wrong, and it is the route model.

### The ruling

1. **`existing-feature` and `under-the-hood` keep Decide, and their entry moves to it.** Discovery
   stays waived on both: the problem really is already known. What Decide does on these shapes is not
   re-litigate whether to build — it states what we expect and when we will know.
2. **`incident-fix` keeps its waiver.** A break does not need a business case. LANE 1 argued this and
   they are right. It stays the one card that honestly carries "nothing is being forecast on this".
3. **`interface-change` keeps its waiver, and this is a REFUSAL, not an oversight.** Plan is waived
   there, so Decide would hand a decision straight to Design, which needs a **spec**.
   `STATION_NEEDS.design` wants a `prd`; a decision does not satisfy it. Every such track would file
   a good decision, fail the handoff, hold `nothing-to-hand-on` three times, and escalate
   `needs-a-waived-station` because the station that files the missing spec is off its own route.
   **It would break the shape rather than improve it.** Giving that shape a forecast means un-waiving
   Plan as well, which contradicts that waiver's own reason and turns the shortest route in the
   product into a six-station one. That is a bigger call and it is not being made in passing.

### The trap in it, worth its own line

**Dropping a station from a `waive` list does nothing on its own.** `validateRoute` requires the
entry to be ON the path and does **not** require it to be first. Un-waiving Decide on a shape that
enters at Plan leaves Decide sitting *behind* the entry, where `nextStation` never looks — visible in
the route, never run, reachable only as a correction target. **The entry has to move with the
waiver.** REQ-2 asked for three lines; it was six, in three files, plus five tests.

---

## Open, and I have not ruled yet

| Question | Why it is still open |
| --- | --- |
| **Does the acceptance permit ONE human approval at Ship?** **This is the biggest open question in the mission and nothing else names it.** The acceptance says *no human touching it mid-run*. `release.publish` is pinned to `review`, can never graduate (`nextRampMode` returns null), and is queued as an approval instead of run — **by your own ruling, whose stated reason is that it is "the only gate in the seven-station loop, which is what makes the autonomy of the other six defensible instead of reckless."** Both positions are yours and they cannot both hold. **Three options, and I will not pick between them:** (a) the acceptance becomes *no human except one approval at the irreversible step*, and the run pauses once at Ship — the honest enterprise story, and arguably a stronger one; (b) a flag like the existing `AUTO_SHIP_ENABLED` lets `release.publish` run unattended in a named proof workspace only, keeping the floor everywhere else; (c) the proof run waives Ship, which is weaker because it is no longer seven stations. **CORRECTED 2026-08-25 03:3x UTC — that last sentence was wrong when I wrote it.** I said this decision blocks exactly one station and nothing else. **Answering it does not make Ship reachable**, because `release.publish` refuses on a precondition before the approval gate is even the binding constraint: `if ((cs.status) !== "merged") throw new Error("Only a merged changeset can promote. Merge the PR first.")`, and then it needs a `deployments` row with `status='success'` and `provider='deno'`. **The loop can produce neither.** Build's only filing instruction is `Call studio.stage`; `studio.commit` appears **0 times in `driver.ts`**. **CORRECTED — I first wrote "nothing merges a PR" and that was wrong**: the full chain exists (`studio.stage` -> `studio.commit` -> `studio.pr.open` -> `studio.checks.run` -> `studio.pr.merge` -> `release.publish`) and **Build is briefed on step one of six**. **The part that changes YOUR decision:** `studio.pr.merge` is also in `HIGH_RISK_FORCE_REVIEW`, so the reason you gave for pinning `release.publish` — that it is *"the only gate in the seven-station loop"* — **holds only because the loop cannot reach the other gate.** Wiring Build through to Ship puts **two** human gates in the path, not one. Workspace `0b792d52` holds **0 deployments and 0 merged changesets**. **So there are three missing steps between Build and Ship — a commit, a merge, and a recorded preview deploy — and no station is crewed for any of them.** That is ledger **F-36**, it is mine, and it is queued as 41. **Your F-18 decision is still needed and is still yours; it is just no longer sufficient on its own.** See ledger F-18 and F-36 |
| **Do we switch evidence ingestion on at all?** **The product's first station has never once worked in production, and nobody knew.** `scout_targets` is **0 in 21 of 21 workspaces**, `scout_snapshots` is **0 rows ever**, and `scout_runs` stopped on **2026-07-25** after 98 runs that captured nothing. It is off three times over, each sufficient alone: `FIRECRAWL_API_KEY` is absent, so `scout-tick.ts:78` returns `{ok: true, skipped: true}` — **a dormant pipeline reporting SUCCESS to pg_cron, which is why a month passed unnoticed**; `auto_scout_enabled` is **false in all 21 workspaces**; and `workspace_briefs` is empty in 13 of 21, so even seeding would no-op. **This is the root of every decline tonight.** Agents were told to gather evidence from a pipeline that has never delivered any, correctly reported there was none, and their honest reports hardened into 144 standing prohibitions (F-31). **I am not switching it on**: a Firecrawl key plus `auto_scout_enabled` starts paid crawling against real sites, which is a billing and external-calls decision and squarely the class you said to leave. **What I need from you is one of:** (a) provide a key and enable it for the one proof workspace; (b) accept that the acceptance run is fed by hand-filed signals and say so in the record, which makes *"starts from one sentence, zero configuration"* false as written; (c) rule that Decide may proceed on the founder's sentence alone when ingestion is dormant — which F-32 already half-does and which deserves your name on it rather than mine. See ledger F-38 and F-37 |
| **Does the forecast become a required field on the human decision path?** | All 14 forecasts are agent-authored; **zero human-authored decisions carry one**, while the positioning says *what a team believed*. Either it becomes required server-side, or the claim is restated as *what the agent predicted* — a weaker, different product. **This is a founder call, not mine.** |
| **How are we different from Cloverpop?** | Eleven years, $12.6M, selling "capture every decision, track how results compare with expectations". Not named anywhere in our corpus. No answer exists yet. |
| **What replaces the 84 routes, exactly?** | `REIMAGINING.md` argues nine surfaces. I have not yet mapped which of the 84 map onto which nine, and I will not let a lane guess it. |
