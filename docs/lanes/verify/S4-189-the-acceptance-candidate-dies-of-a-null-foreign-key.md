# S4-189 · The acceptance candidate is dying of a NULL foreign key, and the seat is right

> _Created: 2026-09-01 · Last updated: 2026-09-01_

**Measured 2026-09-01, 21:0x UTC. Lane `lane/proof`.**

## The state

`ce846e9b` — the closest the product has come to the acceptance: **five stations
of seven, every drive `via: sweep`, zero presses, zero answered approvals,
`waived='[]'`, seventy minutes unattended** — is at **`attempts = 3`**, held at
Build on `produced-nothing`. Three is the give-up ceiling.

## Why Build files nothing, in the seat's own words

The track is *"The red tile after an over-the-air reboot looks exactly like a
real outage, so a homeowner cannot tell them apart"* — a Helio Labs notification
problem. From `agent_runs.output`, the 20:40 attempt:

> The repository contains only checkout-related files (`src/checkout/`) and no
> notification system components. **The repo.tree shows 16 files total**, all
> related to checkout functionality, and repo.search found zero matches for
> notification, tile, outage, or firmware terms. … This work belongs in the main
> Relay app repository where the notification system resides, not in this
> checkout-focused repository.

The 21:00 attempt: *"This work is out of scope for the current repository."*

**That is not a failure. It is the seat being right.** It read the tree,
searched four relevant terms, found nothing, and named where the work belongs.

**And `repo.tree` is not lying to it.** S4-162 found that tool returning **zero**
paths above ~110 entries earlier today, so it was the first thing I checked. It
returned 16 and the builder reasoned from them. The tool is telling the truth,
and the truth is that the repository is the wrong one.

## Two defects, and the second is the larger

**1. `product_id` and `project_id` are both NULL on this track**, and Build
proceeded anyway against a default repository. So a track with no product
binding still reaches *a* repo, and it is one with nothing to do with the work.
**Nothing checks, before Build spends, that the repository it can see is the
repository the work is about.**

**2. A reasoned refusal is recorded as `produced-nothing` and drives to
`given-up`.** R-26 is *"a refused station is not a failed station. No retry
theatre."* This is retry theatre by the ruling's own definition: **the same
seat, given the same unchanged repository, was asked the same question three
times and gave the same answer three times.** Nothing changed between attempts,
so attempts 2 and 3 could not have succeeded.

`produced-nothing`'s own comment says it is *"nearly always a tool the agent
could not reach or a brief it satisfied in prose."* This is a third thing, and it
wants a different hold: the station is not stuck, **the binding is wrong**, and
that is a question for a person rather than a retry.

**The consequence is not abstract.** The run that would have proven R-18 is one
tick from being given up, and it will die for a configuration fault while
behaving correctly throughout.

## The rotation, predicted and tested

At **20:50** the tick served **one** track — `2fdf93b6`, created 20:44:59, never
driven, sorted to the head by `ORDER BY driven_at ASC NULLS FIRST` — and skipped
the other three, `ce846e9b` among them.

I predicted the **2026-08-23** round-robin fix would repay it on the next tick,
because `driveTrackOnce` no longer stamps `driven_at` on a track the tick could
not serve, so an unserved track keeps its older key and sorts first.

**At 21:00 all four were served.** The prediction held. That fix is now
re-verified on live data rather than resting on its original measurement, and
the 20:50 single-track tick is the deadline binding, **not** starvation.

## What that same observation says about throughput

`track-tick` is `cron.job` **68**, schedule `*/10`, active. `TICK_DEADLINE_MS` is
**45,000**. So the platform's entire station-advancing capacity is **45 seconds
in every 600 — a 7.5% duty cycle** — and the drives inside it are **sequential by
design** (*"five concurrent loops would race the cap check rather than respect
it"*), capped at `MAX_TRACKS_PER_TICK = 5`.

Measured against that: seats on this track ran **15s to 63s each, two seats per
station**, and at 20:50 **one** never-driven track consumed the whole tick
(20:50:00 → 20:51:13) with four eligible.

**So one track doing real work can consume an entire tick**, and `ce846e9b`'s own
history is the calibration: five stations in seventy minutes, two ticks each.

**This is not a defect today and it is a ceiling tomorrow.** With two live
drivable tracks it never binds. Seven stations at two ticks apiece is ~140
minutes for one track with nothing competing, and the sequential design means
that scales with the number of tracks, not with the number of workspaces. **The
number to watch is drives-per-tick against 5**, and the honest caveat is that
today's seven-day average of 1.16 is mostly *few eligible tracks*, not the
deadline binding — the 20:50 observation is the one that shows it binding, and it
is a single observation.
