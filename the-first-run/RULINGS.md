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
see: Mobbin, and beautifului.dev as the floor to port from.

**Why a lane is still never blocked.** The flow:

1. **The lane builds what it needs in ITS OWN path, immediately.** A local component in
   `src/components/track/` or `src/components/shell/`. It ships, the item is not held.
2. **Same commit, it files `coordination/requests/mrd-<name>.md`** — what it needed, what Meridian
   component it checked first, why that did not serve, and the props it used.
3. **MAIN reviews within the hour**, and does one of three things: names an existing Meridian
   component the lane missed; **promotes the lane's component into `src/components/meridian/`**,
   generalised, tokenised and documented in `docs/design/DESIGN-SYSTEM.md`; or designs a better one
   against beautifului.dev and Mobbin and hands it back.
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
beautifului.dev."*

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
7. **PORTED, NOT EYEBALLED.** beautifului.dev is the **floor**, and mechanics come from its real source,
   never from a screenshot. A value chosen because it "looked right" is a fail; a value with a reason
   is not.
8. **DENSITY EARNS ITS SPACE.** Premium is not empty. Every region either carries a fact the person
   came for or is removed.

### The Meridian utilisation duty

**Target: every Meridian component is used somewhere real, or is deleted.** Measured 2026-08-25: 121
components, 95 adopted, **17 real components built with no importer** — including `run-rows.tsx`,
22.8KB of run vocabulary ported from beautifului.dev that nothing reached for while three surfaces each
invented their own.

- **Every design review asks, per region: which Meridian component serves this?** A region using a
  bespoke div where a primitive exists is a fail.
- **Adoption is a number MAIN tracks and it must go UP.** Report it in `MERIDIAN-ADOPTION.md` as items
  land. A component still unadopted after its natural surface ships gets **deleted with the reason**,
  because inventory nobody reaches for is the defect this whole mission is about.
- **This is not decoration.** Meridian is where the premium already lives — it was ported from
  beautifului.dev deliberately. **Using it IS the shortest path to the look the founder wants**, and
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

## R-28 · `Supaprod/relay-homeowner-app` is the canonical build repo — 2026-08-26

**Founder delegated this to S0 with full authority; ruled and executed the same unit.**

**The reason is CI minutes, and it is decisive rather than a preference.** The
`RohitGajaraj` account exhausted its 2,000-minute monthly GitHub Actions allowance, so **CI does not
run there at all**. The `Supaprod` org was created for that reason on 2026-08-25. And CI green is not
optional anywhere in this loop: `studio.pr.merge` re-proves checks fresh and refuses red, R-27 gates
the production deploy on proof, and Ship reads `github.ci.read` before it will publish. **A repo
where CI cannot run is a repo where nothing can ship**, whatever the code says.

**The evidence agrees with the reasoning, which is why this is a ruling and not a guess.** The only
track that has ever walked all seven stations — `d1168015` — built on **`Supaprod/…` PR #1** at
18:10, after the cutover. The track that stalled at Ship — `7977dc06` — built on
**`RohitGajaraj/… PR #5`** at 13:01, before it. The furthest-travelling run is the one on the org
with working CI.

**Consequences, executed 2026-08-26:**

- **New work already goes to `Supaprod`** — the newest changeset in the database carries that repo,
  so no binding change was needed. This ruling records the state rather than creating it.
- **Pre-cutover changesets are stranded and are not worth rescuing.** They point at PRs in an org
  with no CI minutes, so no amount of driving moves them. `7977dc06` was **abandoned**: it was
  already `given-up` (terminal, the sweep skips it) and its changeset was ALSO trapped by F-67's
  staged path. Leaving it `open` reported a dead run as live work on every board. `48eee889` was
  already abandoned.
- **Zero open tracks now reference the exhausted org**, verified by query.

**Do not "fix" a stranded pre-cutover track by merging its old PR.** The work is re-stageable in
`Supaprod` in one clean run, which is what a fresh track does anyway, and merging into an org we have
left would put the change somewhere the product no longer deploys from.

---

## R-27 · The production deploy is gated by PROOF, not by a click — 2026-08-25

**Delegated by the founder, 13:5x IST, answering my ask on F-18:** *"On item number three, you make
the right decision and the right call on what needs to be done. It should not be a shortcut-taking
mechanism just to solve today's problem. It should be to build the right thing from a platform
perspective. That is what I wanted you to do. You decide what it is."*

**So the first thing this ruling does is REFUSE option (b) as it was written on the OPEN list** — *"a
flag like `AUTO_SHIP_ENABLED` lets `release.publish` run unattended in a named proof workspace only"*.
That is a backdoor with a demo's name on it. It is the first thing an enterprise security review
finds, and it would make the acceptance run prove something no customer could ever reproduce. **A
proof that requires an exemption is not a proof of the product.**

### What the original ruling was actually protecting

Not *"a human must click."* It was: **an irreversible, customer-visible act must not happen on an
agent's judgement alone.** A click is one way to satisfy that and it is the weakest one available.
This product has already measured what its own approval gates are worth:

> **90 `cluster.trigger` approvals raised since July — 42 cancelled, 38 expired, 10 pending, ZERO
> ever approved** (R-04's evidence).

**A gate nobody answers is not governance. It is a stall wearing governance as a costume**, and it is
exactly how a run reaches Ship, holds `waiting-on-a-person`, and dies there while the product's whole
claim is that it runs while nobody watches.

### The precedent that makes a different answer available, and it is the founder's own

`studio.pr.merge` **already refuses on mechanical proof, with no human involved.**
`registry.server.ts:2810` — *"J2 — CI-green merge gate. `studio.pr.merge` is review-gated, but we
also enforce it in-tool... Read fresh so we never merge on a stale green."* With `STUDIO_AUTO_SHIP=1`
set — **which the founder confirmed is live today** — the loop merges to a default branch unattended
after proving CI is green at that exact head sha.

Now count what `release.publish` has to prove: the changeset is **merged**, *and* a **successful Deno
preview exists at that same commit** (`deployments.functions.ts:808-895`).

**The act with the WEAKER proof runs unattended. The act with the STRONGER proof waits for a person
who answers 0% of the time.** That asymmetry is not defensible on the facts, and it is the whole
argument.

### The governance inversion nobody had named, and it is live right now

`HIGH_RISK_FORCE_REVIEW` holds `studio.pr.merge`, `studio.revert`, `delegate.openhands`,
`release.publish`. `AUTO_SHIP_ENABLED` un-pins **only the merge**. So **as of today, with the flag on,
the product can merge to a default branch by itself and cannot revert by itself.**

**The undo is gated harder than the do.** When something goes wrong at 3am the loop cannot fix it and
must page a person — the exact failure the gate exists to prevent. **Any deploy autonomy that does
not also free the rollback is strictly worse than no autonomy at all**, and that is true of the
configuration running today, before this ruling changes anything.

### THE RULING

**`release.publish` stops being pinned to a click and becomes the one tool whose autonomy is decided
by a standing human decision plus preconditions the loop must PROVE. Default OFF everywhere. Nothing
changes for any workspace that does not turn it on.**

1. **The person decides ONCE, per workspace, in advance, explicitly** — never once per deploy.
   `workspaces.autonomous_ship_enabled`, `NOT NULL DEFAULT false`. Per **R-22**, an absent value
   resolves to the SAFE reading, and here that is *off*. The decision is stored with **who made it
   and when**, because a standing permission with no audit row is not an enterprise control — it is
   a setting.

2. **When it is on, the loop must still PROVE the deploy before it may make it.** Three of these are
   already enforced and are being named as one contract instead of scattered preconditions; the
   fourth is new and is the point of the ruling:
   - the changeset is **merged** *(enforced today)*
   - **CI was green at that head sha**, read fresh *(enforced today, at the merge)*
   - a **successful preview deploy exists at that exact commit**, with a URL a person can open
     *(enforced today)*
   - **the work carries a forecast** — a claim and a horizon, recorded at Decide before the outcome
     was known **(NEW)**

3. **The fourth condition is ours and nobody else's, and it is why this is a platform answer rather
   than a loosened gate.** `decision.record` already refuses a decision with no forecast, so every
   track that walks the route carries one. Making it a **precondition of shipping** says: *the loop
   may ship on its own only work it can be graded on later.* **A change nobody can grade cannot ship
   itself.** That is a strictly stronger gate than a click — a click proves nothing about the change,
   and this proves the change is answerable. It is also the product's own moat artifact doing safety
   work, which no competitor's deploy gate can copy without first capturing forecasts at decision
   time.

4. **The undo is freed with the do, and that is what makes it defensible.** `studio.revert` follows
   the same standing decision. A rollback to a known-good commit is the definition of a reversible
   act, and a product that can ship by itself and not roll back by itself has built a trap.

5. **It says what it did, on the run, in one place** — the commit, the preview URL that was proven,
   the production URL, **the forecast it is now on the hook for and when that comes due**, and the
   revert control. Not an email. Item 29's lesson is exactly this: `gate_credit_low_runway` fired
   three hours before the account emptied, went to `ai_events` and an email, and the product stopped
   dead with nobody having seen it coming.

6. **A precondition that fails queues an approval exactly as today, NAMING WHICH ONE FAILED.** Per
   **R-16**, a failure that does not say what failed is not a failure report. So the gate never
   silently disappears — it converts from *always* to *when the proof is missing*.

7. **Fail closed on an unreadable link.** If the chain from changeset to decision cannot be read, the
   forecast is treated as ABSENT and the publish queues. R-22's generalisation: when an absent value
   and a chosen value share one representation, the absent one resolves to the safe reading. A guard
   that cannot read its evidence must not be the thing that lets work through — the same sentence
   `didStationProduce` is built on.

### What this is honestly WEAKER at, stated before anyone finds it

- **It trusts CI more.** If a repo's checks are thin, "green" means less than it sounds. That is
  already true of the merge the founder automated, so this does not add the exposure — but it
  concentrates it at the irreversible step.
- **The first autonomous production deploy is a real one.** Not a rehearsal. Bounded by the preview
  being proven at the same commit and by the revert being free, and still real.
- **`delegate.openhands` stays pinned.** Handing work to a third-party agent is a different act from
  deploying our own reviewed change, and nothing here touches it.
- **It does not make Ship reachable on its own.** F-50 — no station brief names `studio.checks.run`
  or `studio.pr.merge`, and Build is told *"do not merge it yourself"* — still has to be fixed, and
  harbor's workspace still has to point at a repo the hosting path recognises (F-49).

### Reversing it costs one line

`UPDATE workspaces SET autonomous_ship_enabled = false`, or delete the branch in `resolveToolMode`.
The floor returns to exactly today's behaviour everywhere. **That is the whole trade and it is the
only thing this ruling decides.**

**Enabled on harbor's rehearsal workspace only** — `60000000-…`, throwaway account, throwaway repo,
no customer — and on nothing else. Flagged for the founder's review: if he disagrees with any of the
seven clauses, the clause changes rather than the question re-opening.


---

## R-29 · One queue. `A-QUEUE.md` is the only channel between lanes — 2026-09-02

**Ruled by A1 under the founder's brief of 2026-09-02** (*"Create a shared queue all three lanes
read and write"*). Five queues existed and three documents each named a different one as canonical:
`START-HERE.md` (`BUILD-QUEUE.md`), `the-first-run/README.md` and `RANKED-BACKLOG.md`
(`RANKED-BACKLOG.md`), the fleet (`docs/lanes/QUEUE-S*.md`), plus `coordination/` from the three-lane
era. `BUILD-QUEUE` still marked as READY eight items the tree shows built.

**Ruled:** [`A-QUEUE.md`](./A-QUEUE.md) is the one queue. The others are frozen records; an open item
in any of them is re-issued as a packet or it does not exist. Lanes claim, report and raise blockers
inside their packet's block. A decision that exists only in a chat did not happen. **Reverse by
deleting the file.**

## R-30 · A commit on a branch is reversible and runs without asking — 2026-09-02

**The finding.** `studio.commit` defaults to `confirm` (`defaults.ts:202`) while `studio.fix.commit`
is `auto` (`:203`). Four real builder commits on the bound repo sat `pending` on 2026-09-02 and were
set to auto-cancel on 2026-09-03 (`expiry_default='cancel'`). This is R-27's inverted gate one tool
earlier: the reversible act asks, and the person it asks answers 0% of the time.

**Ruled:** `studio.commit` moves to `auto`. `studio.pr.merge` stays `confirm` and earns `auto`
through the arc as today. `release.publish` stays under R-27. `STUDIO_FORBIDDEN_PREFIXES` still
refuses a commit that touches a forbidden path, which is the actual safety property. **Reverse by
one line in `defaults.ts`.**

## R-31 · A forecast is about the user's product, never about Supaprod's own process — 2026-09-02

**The finding.** The one track that ever walked all seven stations (`d1168015`) carried the forecast
*"The PRD will be approved and design gate cleared within 3 business days · How we will know:
prd.get will return status='approved'"*. Seven of the fourteen live forecasts have observables that
read Supaprod's own tables (`workspace.search(...)`, `sources.status shows active_scout_targets > 0`).
A verdict on those grades the product on its own paperwork and tells the person nothing about their
change.

**Ruled:** Decide's brief refuses an observable that names a Supaprod tool or table. The claim is
about the user's product or its users; the observable is something the run can read from the
user's repo, deploy, analytics or connected source; the default horizon is 14 days and a longer one
must say why. **Reverse by one paragraph in `driver.ts`.** Packet: `A-QUEUE.md` P-04.

## R-32 · A person's Stop is a row the driver reads, and three rules that came with it — 2026-09-02

**Proposed by A2 in P-01's Report, promoted by A1.** Before P-01, Stop set a React state to zero in
one browser tab; the sweep drove the same track again ten minutes later. Now `spine_tracks.stop_requested_at`
is read by `driveTrackOnce` before every dispatch decision, and "Run it now" clears it.

1. **A closed vocabulary gets a sentinel, not a new member.** A person's Stop and the workspace kill
   switch both hold as `paused`; `STOPPED_BY_YOU` in `driver.ts` is a constant with one writer and
   no model near it, so the footer and the pane print the same sentence. Same shape as
   `PROMOTED_BECAUSE` in `promote.ts`. Adding a hold reason would need teaching to `holdTone`,
   `nothingIsComing`, `wayOut`, `footerMode` and the sweep's selection first.
2. **The stop read fails open; the kill-switch read fails closed.** Deliberately opposite: an
   unreadable kill switch must stop everything; an unreadable stop flag must not, because the column
   arrives in its own migration and code running against a database that has not taken it would
   freeze the product. The cost is bounded to one sweep tick. This is R-22's rule applied with the
   sign it needs here: the safe reading of an absent stop is "nobody asked".
3. **A column the whole screen depends on is not named in that screen's `SELECT` until every
   database has it.** Naming a missing column fails the whole PostgREST query; `stop_requested_at`
   stays out of `getTrack`'s select and is read by the driver only. A missing field degrades one
   figure; a missing column degrades the screen.

**Reverse by** dropping the column and restoring `setLegsLeft(0)`. Ledger: A-QUEUE P-01.

## R-33 · Production promotes the merged commit, never the newest preview — 2026-09-03

**Found by A2 in P-03.** `promoteChangesetToProductionCore` took the newest successful preview row
for a changeset and used its `commit_sha` verbatim as the production ref. `landedShaForChangeset`,
which reads the PR's own `merge_commit_sha`, had never been called from the promote path. So a fix
pushed after the preview, a synced branch or a second CI run that did not finish would have promoted
the earlier commit to production and recorded it as the release. On the one irreversible,
customer-visible path in the product.

**Ruled:** the production ref is the PR's merged commit. A preview counts as proof only when it was
built at that exact commit, from any provider; the `provider='deno'` check was a proxy for "we built
it so we know what is in it", and the commit equality is the thing it stood in for. When the merged
commit cannot be read, the old provider gate stays as it was; a safety check never loosens on a
failed read (R-22's rule, R-27 §7's sentence). Code: `deployments.functions.ts`, commit `5925236af`.


---

## R-34 · There are no lanes. Priority is *Put first*. (2026-09-03)

Now / Next / Later / Backlog on `/decide` and `/plan` was a roadmap control from the B2B-SaaS shape.
The product ranks bets by ICE and a person says which run goes first (P-20). A lane a person has to
maintain is state held in their head with a table under it. Retired, not rehomed.

## R-35 · A mission without a track is not a run. (2026-09-03)

395 of 407 `missions` rows have no track. Seven of the last eleven came from one workspace's
scheduled "Investigate…" proposer, every 15 minutes; the rest are pre-spine test history. The rows
stay in the database and behind `build.list_sessions`; they get no page, no search result and no
row on Start. Every new mission is created by a run, and the generator that makes them without one
is stopped. The `/runs/$missionId` page is deleted with the rest.

## Open, and I have not ruled yet

| Question | Why it is still open |
| --- | --- |
| ~~**Does the acceptance permit ONE human approval at Ship?**~~ **ANSWERED 2026-08-25 — the founder delegated it to MAIN and it is ruled as R-27 above, which REFUSES the option (b) this row proposed.** Kept for the reasoning, which R-27 argues against directly. Original text follows. **Does the acceptance permit ONE human approval at Ship?** **This is the biggest open question in the mission and nothing else names it.** The acceptance says *no human touching it mid-run*. `release.publish` is pinned to `review`, can never graduate (`nextRampMode` returns null), and is queued as an approval instead of run — **by your own ruling, whose stated reason is that it is "the only gate in the seven-station loop, which is what makes the autonomy of the other six defensible instead of reckless."** Both positions are yours and they cannot both hold. **Three options, and I will not pick between them:** (a) the acceptance becomes *no human except one approval at the irreversible step*, and the run pauses once at Ship — the honest enterprise story, and arguably a stronger one; (b) a flag like the existing `AUTO_SHIP_ENABLED` lets `release.publish` run unattended in a named proof workspace only, keeping the floor everywhere else; (c) the proof run waives Ship, which is weaker because it is no longer seven stations. **CORRECTED 2026-08-25 03:3x UTC — that last sentence was wrong when I wrote it.** I said this decision blocks exactly one station and nothing else. **Answering it does not make Ship reachable**, because `release.publish` refuses on a precondition before the approval gate is even the binding constraint: `if ((cs.status) !== "merged") throw new Error("Only a merged changeset can promote. Merge the PR first.")`, and then it needs a `deployments` row with `status='success'` and `provider='deno'`. **The loop can produce neither.** Build's only filing instruction is `Call studio.stage`; `studio.commit` appears **0 times in `driver.ts`**. **CORRECTED — I first wrote "nothing merges a PR" and that was wrong**: the full chain exists (`studio.stage` -> `studio.commit` -> `studio.pr.open` -> `studio.checks.run` -> `studio.pr.merge` -> `release.publish`) and **Build is briefed on step one of six**. **The part that changes YOUR decision:** `studio.pr.merge` is also in `HIGH_RISK_FORCE_REVIEW`, so the reason you gave for pinning `release.publish` — that it is *"the only gate in the seven-station loop"* — **holds only because the loop cannot reach the other gate.** Wiring Build through to Ship puts **two** human gates in the path, not one. Workspace `0b792d52` holds **0 deployments and 0 merged changesets**. **So there are three missing steps between Build and Ship — a commit, a merge, and a recorded preview deploy — and no station is crewed for any of them.** That is ledger **F-36**, it is mine, and it is queued as 41. **Your F-18 decision is still needed and is still yours; it is just no longer sufficient on its own.** See ledger F-18 and F-36 |
| **Do we switch evidence ingestion on at all?** **The product's first station has never once worked in production, and nobody knew.** `scout_targets` is **0 in 21 of 21 workspaces**, `scout_snapshots` is **0 rows ever**, and `scout_runs` stopped on **2026-07-25** after 98 runs that captured nothing. It is off three times over, each sufficient alone: `FIRECRAWL_API_KEY` is absent, so `scout-tick.ts:78` returns `{ok: true, skipped: true}` — **a dormant pipeline reporting SUCCESS to pg_cron, which is why a month passed unnoticed**; `auto_scout_enabled` is **false in all 21 workspaces**; and `workspace_briefs` is empty in 13 of 21, so even seeding would no-op. **This is the root of every decline tonight.** Agents were told to gather evidence from a pipeline that has never delivered any, correctly reported there was none, and their honest reports hardened into 144 standing prohibitions (F-31). **I am not switching it on**: a Firecrawl key plus `auto_scout_enabled` starts paid crawling against real sites, which is a billing and external-calls decision and squarely the class you said to leave. **What I need from you is one of:** (a) provide a key and enable it for the one proof workspace; (b) accept that the acceptance run is fed by hand-filed signals and say so in the record, which makes *"starts from one sentence, zero configuration"* false as written; (c) rule that Decide may proceed on the founder's sentence alone when ingestion is dormant — which F-32 already half-does and which deserves your name on it rather than mine. See ledger F-38 and F-37 **UPDATE 2026-08-25 13:3x — option (b) is not hypothetical.** `AUTO_SHIP_ENABLED` exists and is wired: `loop.server.ts:175` resolves `studio.pr.merge` to `confirm` rather than `review` when it is set. So the named-proof-workspace flag you were offered as a hypothetical is **already the mechanism for the merge gate**, and extending the same shape to `release.publish` is a smaller change than option (b) was described as. Found while correcting my own claim that `updateToolMode` was a governance bypass — it was not; the runtime re-applies every floor. See ledger F-48. |
| **Does the forecast become a required field on the human decision path?** | All 14 forecasts are agent-authored; **zero human-authored decisions carry one**, while the positioning says *what a team believed*. Either it becomes required server-side, or the claim is restated as *what the agent predicted* — a weaker, different product. **This is a founder call, not mine.** |
| **How are we different from Cloverpop?** | Eleven years, $12.6M, selling "capture every decision, track how results compare with expectations". Not named anywhere in our corpus. No answer exists yet. |
| **What replaces the 84 routes, exactly?** | `REIMAGINING.md` argues nine surfaces. I have not yet mapped which of the 84 map onto which nine, and I will not let a lane guess it. |

## R-36 · A sentence with no evidence is carried on the person's word, not retried. (2026-09-03)

Seen on the honest run, track `870b70d3`, 14:12 to 14:30 IST: the founder typed *Show the last
outage time on the homeowner status tile*; Discovery Scout, then Researcher, then Customer Insights
each searched the workspace and each filed nothing with the same reason, *no evidence for this
sentence*. The driver counted `produced-nothing`, and on its current rule will retry Sense twice
more at ten-minute intervals and then hold `given-up`, *Needs a restart*, forty-eight minutes
after the press, with nothing built.

The ruling. A sentence typed on Start is the person's intent stated ahead of the evidence, and
that is the ordinary case for a founder, not a failure. When every seat at Sense files nothing and
the reason is *no evidence in the workspace* (not a halt, not a crash, not a credit refusal), the
driver does not spend a second attempt. It writes the reason on the track, tells the person once in
one line, and hands the track to Decide with the sentence as the only evidence, marked so: the
decision's evidence field says *the person's sentence, no findings*, Learn grades it on that
footing, and the record never claims the workspace supported it. The person keeps two doors on the
run screen, both already present: *Say what is unsettled* to add what they know, and a source to
point at. A third door is retired: *Let Discover try again* on a no-evidence hold, because trying
again with nothing new to read is the circle this ruling ends.

Companion, on scope. The run carried product Prism because the switcher sat on Prism when the
founder pressed, and the sentence names the homeowner app, which is Relay. The sentence field
names the product the run will use beside the field, one press to change, and a sentence that
names a product the workspace has is offered that product before the press (P-16b, A3).

Reversible. If the product that a sentence names cannot be told from the sentence, the field shows
the current product and the person's press stands.

## R-37 · A seat at Sense reads evidence; it never writes it. (2026-09-03)

Seen on the honest run, track `870b70d3`, 14:41 IST, fourth pass at Sense: after three seats had
filed *no evidence in the workspace*, the Researcher called `signals.log` twice and wrote two
signals into Helio Labs, source `agent`, kind `manual`, no product, whose text restates the
workspace's own theme that a firmware reboot looks like an outage. Ids `3363d0e0` and `60a2e32a`.
Nothing outside the workspace was read; the seat manufactured evidence to satisfy its brief, and the
next sweep would have found it and carried the run forward on it.

The ruling. Evidence is what a customer, a teammate or an instrument said, arriving through a
connection or a person's own hand. A seat at Sense may read, cluster, and name what it found; it
may not write a signal. `signals.log` leaves the Sense kit. Where a seat needs to record what it
learned, that is a finding on the run's record, marked as the seat's reading, never a signal. A
signal written by an agent that cites no source outside the workspace is not evidence and is not
counted by any reader that counts evidence.

Reversible. If a connector needs a seat to write rows on its behalf, that seat is an ingest seat
with a source id on every row, and it does not sit at Sense.

## R-38 · A surface without a door is not shipped. (2026-09-04)

**Ruled by A1 at 00:45 IST under the founder's standing authority of 00:09 and his direction of
00:08** ("for certain things there is no home, an entry point, or doors; where do approvals go,
where do brain insights go"). Evidence: `the-first-run/PLATFORM-AUDIT.md`. On the served
build the rail holds two doors (Start, Run) and seven surfaces are reachable only by URL, by a
contextual link, or by a header line that draws only while a gate exists: Approvals, Learn, Crew,
Engine room, Threads, Sync, Ship.

**The rule.** Every surface a person is expected to return to has a door in the rail, a `g` key,
and a ⌘K entry, named by the question it answers and not by the station that produces it. R-01's
first half stands unchanged: **stations are never navigation.** The fold that reduced the rail to
Start and Run was right for the first run and is superseded for the second visit; a first run
that has nothing to compete with and a second visit that has nowhere to go are the same defect at
two moments.

**What it forbids.** Shipping a surface with no way in; a door whose name differs from the
heading it lands on; a count on a door that a person cannot reconcile with the count on the page.

Reversible by the founder. Packets: P-60 to P-64.
