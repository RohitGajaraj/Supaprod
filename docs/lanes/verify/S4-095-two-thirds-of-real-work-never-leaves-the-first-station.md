# S4-095 · Two thirds of all real work never leaves the first station

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27, measured live, real workspaces only (`workspaces.is_sample = false`). The funnel
> nobody had drawn._

## Every real track, by the station it is sitting on

| station | tracks | held | open now |
| --- | --- | --- | --- |
| **`sense`** | **37** | **35** | 1 |
| `decide` | 4 | 3 | 3 |
| `design` | 4 | 4 | 2 |
| `build` | 3 | 3 | 2 |
| `ship` | 3 | 3 | 1 |
| `define` | 2 | 2 | 0 |
| `learn` | 2 | 0 | 0 |
| **total** | **55** | 50 | 9 |

**37 of 55 real tracks, 67%, are sitting on the first station. 35 of those 37 are held.**

## What that means, and it is one sentence

**Discover is not a station the loop passes through. It is where the loop stops.**

Everything downstream is a trickle by comparison: four at Decide, four at Design, three at Build,
three at Ship, two ever at Learn. The seven-station loop has, on real work, been a one-station loop.

## It corroborates S0's cause exactly

S0 found why last night: the `sense` brief named `signals.log` and no other way to finish, so a crew
searching a workspace **already full of evidence** concluded there was nothing to log and filed
nothing. That workspace holds 258 signals.

**This is the size of that bug.** Not "Discover has never cleared" as a fact about one track, but
**35 held tracks, two thirds of everything real the product has ever been given.**

The fix is `8b724e096`, which I verified reaches all three Discover seats (`S4-060`, `S4-062`), and
which **is not live** — production deploys from `main` and the lanes are 9 to 16 commits ahead.

## The prediction this makes, which is the useful part

If the Discover fix works and `main` is deployed, **the 35 held tracks at `sense` are the backlog it
will act on**, and this table is the before-picture to measure it against. If `sense` does not fall
well below 37 within a day of the deploy, the fix reached the brief and did not reach the outcome,
and that is worth knowing quickly rather than eventually.

**Re-run this exact query after the deploy.** It is the cheapest proof the fix worked that anyone can
get, and it needs no new instrument.

## What I am not claiming

- **`held` counts `last_hold IS NOT NULL`**, which includes non-terminal holds a sweep can still
  clear. It is not the same as "stuck forever".
- **I did not check how many of the 37 predate the Discover fix**, though all of them must, since it
  is not deployed.
- **Two tracks at `learn` are the two already known**, and `S4-071` explains why neither is the
  acceptance.
