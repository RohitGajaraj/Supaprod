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

---

## Open, and I have not ruled yet

| Question | Why it is still open |
| --- | --- |
| **Does the forecast become a required field on the human decision path?** | All 14 forecasts are agent-authored; **zero human-authored decisions carry one**, while the positioning says *what a team believed*. Either it becomes required server-side, or the claim is restated as *what the agent predicted* — a weaker, different product. **This is a founder call, not mine.** |
| **How are we different from Cloverpop?** | Eleven years, $12.6M, selling "capture every decision, track how results compare with expectations". Not named anywhere in our corpus. No answer exists yet. |
| **What replaces the 84 routes, exactly?** | `REIMAGINING.md` argues nine surfaces. I have not yet mapped which of the 84 map onto which nine, and I will not let a lane guess it. |
