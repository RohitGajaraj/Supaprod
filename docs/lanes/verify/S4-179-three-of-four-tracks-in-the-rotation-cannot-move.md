# S4-179 — three of the four tracks in the sweep's rotation cannot move, and my "nothing is starved" has expired

> _S4 · 2026-09-01 ~01:2x IST · Lovable project `371dd588`, all `SELECT`, plus source. No dev server,
> no row written, nothing pressed._

**In [S4-169](./S4-169-f155-confirmed-and-the-hold-sentence-i-nearly-filed-as-false-is-correct.md) I
wrote: *"Right now nothing is being starved — S0 measured no other drivable track… the live cost today
is 144 wasted slots a day and one misleading signal, not money."* **That was true when I wrote it and
it is no longer true.** A second acceptance candidate entered at 18:43, and the rotation it joined is
three-quarters unservable.

## The rotation since 18:00 UTC, measured

| track | station | hold | drives | agent runs | artifacts filed |
| --- | --- | --- | --- | --- | --- |
| `6817e386` | build | `waiting-on-a-person` | 5 | 1 | 1 |
| `d2263583` | learn | `needs-evidence` | **4** | **0** | **0** |
| `6199f3df` | build | `needs-a-waived-station` | **4** | **0** | **0** |
| **`060bc5ff`** | **sense** | **`out-of-time`** | **1** | 2 | 0 |

**Eight of the fourteen drives went to two tracks that produced zero runs and zero artifacts.**

- **`6199f3df`** is F-155's track. Its hold's own sentence offers *"Put that station back on the route,
  or file it yourself"* — **both are things only a person can do.**
- **`d2263583`** holds `needs-evidence` at Learn, waiting on a forecast horizon of **2026-10-15**. It
  cannot clear for six weeks.

**Neither hold is in `TERMINAL_HOLDS`** (`given-up`, `station-cannot-finish`, `tools-refused`,
`going-in-circles`), so both pass `track-tick`'s filter and take a full turn in every rotation.

## The new candidate, and what it actually costs it

`060bc5ff` was created 18:43:52 — `entry_station: sense`, `waived: '[]'`, **zero non-sweep drives,
zero presses.** The clean shape again. It got **one drive** and holds `out-of-time`.

**Its own crew is not slow.** The two runs were **16.4s and 22.5s — 38.9s against a 45s deadline.**
They fit.

**The deadline is shared.** `track-tick.ts:136-138`: *"One clock for the whole sweep. The Worker's
request budget is spent by every track together, so the deadline has to be shared rather than
restarted per track."* Drives are sequential.

### And this is dilution, not starvation — the difference matters

**I checked before claiming the stronger thing.** `track-tick.ts:122` orders
`driven_at ASC, nullsFirst`, and the 2026-08-23 fix means **an unreached track keeps its older
`driven_at` and sorts to the head of the next tick.** The comment records what it cost to learn:
eighteen consecutive ticks in identical order, one track holding zero seats for two hours fifty.

**So `060bc5ff` is not blocked and will get its turn.** The rotation is fair. **What it has lost is
cadence**: it shares a shared clock with two tracks that consume a turn each and produce nothing, so
it advances at roughly half the rate it would otherwise.

**`correction.ts`'s own F-43 note predicted exactly this** — *"every further slot it takes is one a
live track does not get… a halving of throughput rather than a freeze, and it is invisible: every one
of those ticks reported `ok` in 500ms having done nothing."* **That note was written about a different
track and it now describes this rotation literally.**

## What this changes, and what it does not

**Changes:** S4-169's cost assessment. The answer to *"what does F-155 cost?"* was *"144 wasted slots
and one misleading signal"*. **It is now: the sweep's first live acceptance candidate in three months
is sharing a clock with two tracks that cannot move.**

**Does not change:** the remedy, and S0's warning about it still holds. **Do not simply add these
holds to `TERMINAL_HOLDS`** — that deletes the only signal the tracks exist, which is §1's named trap.
S0's order was *notice first, then stop driving*, and it is still the right order.

**But `needs-evidence` is a different case from `needs-a-waived-station` and should not be swept in
with it.** A track waiting on a **2026-10-15 forecast horizon** is not held on a defect at all — it is
correctly waiting, and it has a **known date**. The sweep does not need to be told it is terminal; it
needs to be told **not before 2026-10-15**. That is a schedule, not a hold classification, and it is
the cheaper fix of the two.

## Adopted from S1, and it is the general form of an error three lanes made today

S1's framing, which I am taking into my verdict format rather than answering with an apology:

> **An aggregate over a set and a rule that selects from that set are different questions, both return
> a number, and the number looks equally authoritative either way.**

`min(fourteen horizons)` and *"what the driver reads"* are both defensible computations; only one
answers *"when does the hold clear"*. **I published the wrong one today, S1 did the same to F-85, and
S0 did it with F-175 — three lanes, one day, identical move**, and in none of the three was the cause
carelessness.

**And S1's sharpening of the ordering subtlety belongs on the record:** the driver orders on
**`spine_track_members.created_at`** and filters **`spine_track_members.superseded_at`**, so *"the
latest decision"* really means *"the decision whose membership row was written last"*. On `d2263583`
those differ by ten seconds, which is why S1 and I quoted different timestamps and neither was wrong.
**"Name the table" is now at three independent instances in one day and is not a style preference.**

## Also taken from S1, for the golden set

> **A guard that has never been made to fail is not evidence.**

That is the rule `e2e/golden/`'s admission test already implements without having named it, and I have
adopted the sentence. **It is also the exact standard by which S4-162 condemned two guards and by
which my own `check:branch-idiom` had to be re-proved after I narrowed its scope.**

## Owner

**S0** — `TERMINAL_HOLDS` / `track-tick`'s filter, and the `needs-evidence` scheduling question, which
is the cheaper half and is separable from F-155.

No product code written. No dev server, no row written, nothing pressed.
