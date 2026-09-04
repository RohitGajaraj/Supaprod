# S4-169 — F-155 confirmed, it costs nothing, and the hold sentence I nearly filed as false is correct

> _Created: 2026-08-31 · Last updated: 2026-08-31_

> _S4 · 2026-08-31 ~12:0x UTC · Lovable project `371dd588`, all `SELECT`, plus source. No dev server,
> no browser, no row written, nothing pressed. **S0 handed this one over with "it is yours to
> attack."**_

## The claim as made

`docs/lanes/log/S0.md` / F-155: *"I drove the loop and it is driving one thing that cannot move …
`track_drives`: 144 drives in 24h, ALL 144 on `6199f3df`, 682 total since 08-26, `updated_at` unmoved
since 08-27. Its hold is `needs-a-waived-station`, which is NOT in `TERMINAL_HOLDS` … A hold whose
stated remedy only a person can perform. The set is a list of hold NAMES; what makes a hold terminal
is whether anything the sweep can do clears it, and the two have drifted."*

## Verdict: **CONFIRMED**, every number, measured independently

| S0's claim | measured |
| --- | --- |
| 144 drives in 24h, all on one track | **144**, all `6199f3df`, and it is the **only** track driven at all |
| 682 drives total | **682** |
| every drive is the sweep | `driven_via` is `sweep` on all of them, no presses |
| hold is `needs-a-waived-station` | confirmed, and `entry_hold` on all 144 |
| that hold is not in `TERMINAL_HOLDS` | confirmed — the set is `given-up`, `station-cannot-finish`, `tools-refused`, `going-in-circles` |
| `updated_at` unmoved since 08-27 | **2026-08-27 05:30:03** |

**And S0's structural point is right.** The hold's own sentence (`driver.ts:1359`) is *"This station
needs something that a waived station was the one to file, so nothing is going to file it. **Put that
station back on the route, or file it yourself.**"* Both remedies are things only a person can do. By
S0's own criterion — *is there anything the sweep can do that clears it* — the answer is no, and it is
absent from the list that says so.

## What I can add: it costs nothing, and that changes how it should be fixed

**"Driving one thing that cannot move" is true of the drive rows and false of the spend.**

| | |
| --- | --- |
| `agent_runs` on this track, last 24h | **0** |
| `stage_events` on this track, last 24h | **0** |
| `spend_used_usd` | **$0.28128**, unmoved |
| `agent_runs` ever · `stage_events` ever · members | 26 · 3 · 3 |

**The 144 drives dispatched no agent, wrote no stage event and spent no money.** The sweep reaches
the track, reads the hold, and declines — cheaply, 144 times a day.

**This is NOT F-151's shape and should not be fixed as if it were.** F-151 wrote ~12,960 stage events
in 48 hours; this writes drive rows only. The cost is **throughput and signal**, which is exactly what
`correction.ts`'s own F-43 note predicts: *"every further slot it takes is one a live track does not
get … a halving of throughput rather than a freeze, and it is invisible: every one of those ticks
reported `ok` in 500ms having done nothing."* **That note describes this track precisely, and it was
written about a different one.**

**Right now nothing is being starved** — S0 measured no other drivable track, and I found none being
driven. So the live cost today is 144 wasted slots a day and one misleading signal, not money.

## The thing I nearly filed, and it was wrong

**I was about to file that the hold misnames its own cause. It does not, and the reason is a trap
worth writing down.**

The track's `waived` array, read straight from the row, is:

```
sense, decide, define, design      (all by: "policy")
```

**`plan` is not in it.** The hold sentence says *"**Plan** is waived on this route."* For twenty
minutes that read as a hold asserting a waiver that does not exist — the S4-043 shape, a hold telling
a person something it never read.

**It is correct.** `STATION_NEEDS.build.from` is **`define`**, and `agent-vocabulary.ts:129` gives
`define` the display name **"Plan"**. The sentence renders the label, the row stores the id, and they
are the same station.

**The repository already knows this trap and has paid for it.** `agent-vocabulary.ts:113-126` records
it happening before, in the opposite direction:

> *"…which is how the Plan receipt came to read **"Waived: sense, decide"** while the rail above it
> said Discover. `run-strip.tsx` had already worked around it with a private alias calling this 'the
> internal name', which is the tell that the vocabulary, not the surface, was wrong."*

**Anyone diffing a `waived` array against hold text is comparing ids to names and will find a defect
that is not there.** Recorded so the next session does not spend the twenty minutes I did. It is also
a live argument for §12's map: the product speaks two vocabularies for one object and only one of them
is on screen.

## One observation I am not filing

`attempts` is **3**, which is `MAX_STATION_ATTEMPTS`, and the hold is `needs-a-waived-station` rather
than `given-up`. That looks deliberate — `decideCorrection` escalates to a *specific* hold once the
ceiling is reached, and a specific hold is more useful than a generic one. **Not a defect on the
evidence I have**, and named here only so nobody reads `attempts: 3` as a second problem.

## Agreeing with S0's warning, in its own terms

S0: *"Do NOT let anyone just add it to `TERMINAL_HOLDS` — that deletes the only signal the track
exists."*

**Correct, and `correction.ts` says why in its own comment:** *"Excluding them is safe because the
exclusion is on the HOLD, not on the track. Every route back into the sweep clears the hold first."*
The exclusion mechanism is sound; what is missing is anything that **notices**. A track held for five
days on a hold only a person can clear, with nothing on any surface saying so, is
[S4-153](./S4-153-the-record-of-what-agents-did-is-written-and-never-read.md)'s shape — the record is
written faithfully and read by nothing. **Notice first, then stop driving**, which is S0's own order
and it is the right one.

## Blocked: the falsifiable test cannot run yet, and it is not waiting on the deploy

S0 asked me to run it the moment F-153/F-154 serve. **It cannot run, for a reason upstream of the
deploy.** The test needs a *newly dispatched* fix run to inspect, and a dispatch requires
`fix_attempts` reset on the two changesets. **S0 reports its permission layer refused that write and
has escalated to the founder.** I cannot do it either — my own brief forbids database writes, and
doing it on S0's behalf would route around a refusal that is the user's to lift.

**So the test is blocked on the founder, not on S0 and not on me**, and the two approvals `016b0ada`
and `50747388` stay pending. Recorded here rather than left as silence, because a test nobody says is
blocked reads as a test that passed.

**And the deploy marker cannot answer it either.** `curl … llms.txt` still returns 1, but that is the
*previous* deploy's marker; F-153 and F-154 are server-side and no static asset moves for them. **This
is S0's own lesson from this morning, and it applies to the check I was about to run**: verify by bytes
only when the bytes are downstream of what changed. For these two the only honest instrument is a
dispatched run's `repo.read` args.

No product code. No dev server. No approval answered, nothing pressed, no row written.
