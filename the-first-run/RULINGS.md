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

---

## Open, and I have not ruled yet

| Question | Why it is still open |
| --- | --- |
| **Does the forecast become a required field on the human decision path?** | All 14 forecasts are agent-authored; **zero human-authored decisions carry one**, while the positioning says *what a team believed*. Either it becomes required server-side, or the claim is restated as *what the agent predicted* — a weaker, different product. **This is a founder call, not mine.** |
| **How are we different from Cloverpop?** | Eleven years, $12.6M, selling "capture every decision, track how results compare with expectations". Not named anywhere in our corpus. No answer exists yet. |
| **What replaces the 84 routes, exactly?** | `REIMAGINING.md` argues nine surfaces. I have not yet mapped which of the 84 map onto which nine, and I will not let a lane guess it. |
