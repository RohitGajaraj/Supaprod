# S4-186 · The sweep neglects nothing, and the live population is two

> _Created: 2026-09-01 · Last updated: 2026-09-01_

**Measured 2026-09-01, ~02:5x IST / 20:4x UTC. Lane `lane/proof`.**

## What I nearly published, and why I did not

Reading the hold distribution I found **64 tracks whose last drive was between
five and ten days ago, none driven in 24 hours**:

| hold | tracks | driven in 24h | freshest | median age |
| --- | --- | --- | --- | --- |
| `station-cannot-finish` | 36 | 0 | 6d 11h | 10d 08h |
| `out-of-time` | 28 | 0 | 5d 06h | 6d 06h |
| `produced-nothing` | 14 | 2 | 34s | 6d 06h |
| `needs-evidence` | 13 | 1 | 11m | 10d 09h |

The driver says of `out-of-time`, in its own words at `driver.ts:526`:

> OURS, NOT THE STATION'S. … it never counts as an attempt and never looks like
> a failure: **the next tick picks the track up exactly where this one left it.**

Twenty-eight tracks carrying that hold, none picked up in a day, the freshest
five days stale. The sweep orders `driven_at ASC nullsFirst`, so a five-day-old
track sorts to the **head** of the queue, not the tail. That reads as: the
promise in the comment is false for the whole population, and 28 tracks are
silently parked behind a hold whose own line says it will try again — with no
person to notify either, because `footer-mode.ts:191` lists `out-of-time` among
the holds no person is required for.

**It is false, and one query killed it.** Splitting by `status` and
`workspaces.is_sample`:

- `out-of-time` 28 = **21 `status='abandoned'`** + **7 in sample workspaces**.
- `produced-nothing` 14 = 13 abandoned + 1 open non-sample (driven 1m ago).
- `needs-evidence` 13 = 11 sample + 1 abandoned + 1 open non-sample (11m ago).
- `station-cannot-finish` 36 = **in `TERMINAL_HOLDS`** (`correction.ts:262`),
  excluded by design.

`.eq("status","open")` at `track-tick.ts:99` and `sampleWorkspaceIds` account
for **every single one**. Not one track is neglected. The comment is right and
my reading was wrong.

**Sixth time today that checking has caught me before publishing.** The shape is
the same one S0 corrected me on with the signals pool: I read a property of the
FILTER as a property of the POPULATION. A stale `driven_at` on an excluded row
is not evidence the sweep is failing to drive it; it is evidence the sweep
stopped touching it, which is what exclusion means.

## The finding that survives, and it is bigger

Of roughly a hundred held tracks: **36 terminal, 34 abandoned, 18 sample.**

**Exactly two are open, non-sample and drivable, and both were driven within
the last twelve minutes.**

That reframes the acceptance problem. It is not that the loop repeatedly fails
to close — it is that **almost every track ever created was abandoned or hit a
terminal hold, and the live population the sweep can work on is two.** The sweep
is not the bottleneck. The sweep is idle for lack of anything to drive.

## Standing question 1 · Is the acceptance met

**No. The honest query returns 0.** The mechanism this pass, named:

`ce846e9b` is held at **Build** with **`produced-nothing`**, at 5 of 7 stations,
`waived='[]'`, **zero presses, zero answered approvals** — still unattended, so
R-18 is intact and it is the loop stopping itself, not a person stopping it.

**It is not the credit misread `correction.ts:289` warns about.** Every run on
the track is `completed` or `completed_with_failures` with `halted_reason` null,
`credits_refunded` false, and real spend. The builder ran twice and filed
nothing twice:

| at | seat | steps | duration | status |
| --- | --- | --- | --- | --- |
| 20:30 | builder | 4 | 24.5s | completed |
| 20:30 | qa | 7 | 35.0s | completed |
| 20:40 | builder | 2 | 15.2s | completed |
| 20:40 | qa | 3 | 23.5s | completed |

**The retry did less work than the attempt it retried** — half the steps,
two-thirds the time.

**And I checked whether that is a law before saying it was.** It is not.
Corpus-wide over 30 days, by attempt number:

| attempt | runs | avg steps | avg tokens | avg duration |
| --- | --- | --- | --- | --- |
| 1 | 420 | 3.28 | 29,020 | 30.0s |
| 2 | 282 | 3.21 | 27,989 | 20.9s |
| 3 | 212 | 2.96 | 27,437 | 14.6s |
| 4 | 150 | 3.41 | 31,025 | 15.5s |
| 5 | 122 | 3.39 | 30,708 | 17.6s |

**Steps are flat.** So "retries get weaker" is a property of `ce846e9b`, not of
the loop, and I am not filing it as one. What IS corpus-wide is that **duration
falls 51% from attempt 1 to attempt 3 at a flat step count** — the same amount
of work, done in half the wall clock. That is worth an owner's eye and it is not
a defect I can name from here.

## One more thing on this track, unprompted by any query

Four of its nine runs are **`completed_with_failures`**: strategist (decide),
prd-writer (define), ux-architect and design-critic (design). The track advanced
past all four. So "it walked five stations unattended" is true, and "the work at
those five stations was clean" is **not** — and the drive log cannot tell you
that, because a drive records the transition and not the health of the run
behind it.

Every station also took two ticks: one `out-of-time` (the Worker's wall clock,
benign and correctly modelled) and one that ran. Seventy minutes to five
stations is that, not slowness in the seats.
