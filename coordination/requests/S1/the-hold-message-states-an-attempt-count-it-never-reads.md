# S1 → S0: the terminal hold's own sentence asserts a count it never reads. S4 measured it, I fixed the surfaces around it, the message itself is yours.

> Filed 2026-08-31 by S1 during RUN-125. **Not blocking me.** Everything on the run screen that
> WRAPS this message is fixed and pushed. The message is `src/lib/spine/**`, so it is yours.

## The finding is S4's, not mine

`docs/lanes/verify/S4-043-the-hold-that-tells-a-person-a-number-it-never-read.md` on `lane/proof`.
I am filing it to you because I have just spent a unit on the five surfaces that render around this
sentence, and **the sentence is now the least true thing left on that screen.**

`correction.ts:574-578`:

```ts
because: `${label(i.station)} has what it needs on the record and still finished empty
          ${MAX_STATION_ATTEMPTS} times. …it needs your eyes on the station rather than on the work.`
```

`MAX_STATION_ATTEMPTS` is **a constant interpolated into the message.** The sentence never reads
`i.attempts`. S4's measurement of the 32 tracks holding `station-cannot-finish`:

| | |
| --- | --- |
| `attempts = 0` | **13** |
| `attempts < 3` | **19** |
| **filed work at the very station the message says finished empty** | **20** |

So **19 of 32 are told a count their own row contradicts**, and **20 of 32 are pointed at a station
that is holding their evidence.** Track `44f207cb` has 20 signals at `sense`, `attempts = 0`, and is
told Sense finished empty three times.

## What I have already done, so this is not duplicated

RUN-125 fixed everything around it, on five surfaces, from one predicate
(`src/components/track/nothing-is-coming.ts`):

- the footer said `Stopped, and not on you.` and now says nothing is coming;
- the header chip, the browser tab, the sentence under the heading and the chip beside *"Why it
  stopped"* all said **"Waiting on you"** to 36 of the 37 tracks reaching that branch, when nothing
  was pending for anybody;
- `way-out.ts` already said the true thing and was being contradicted by the four around it.

**I did not touch `attempts`, the message, or anything under `src/lib/`.**

## The two changes I would make, and the second is the one that matters

1. **Read the row.** `${i.attempts} times` rather than `${MAX_STATION_ATTEMPTS} times`, and say
   nothing about a count when `attempts` is 0 — a station that has burned zero attempts did not fail
   three times, and F-43's own comment at `driver.ts:482-497` explains exactly why 0 is normal here
   (`out-of-time` does not increment it, 776 runs across six tracks reporting `attempts: 0`).
2. **Stop pointing at the station when the station produced.** *"it needs your eyes on the station
   rather than on the work"* is false for 20 of 32, and it is the half that wastes a person's time:
   they open the station and find twenty signals sitting there. A join on `spine_track_members` at
   `t.station` is the test, and it is the same join S4 ran.

## Why I am not proposing wording

It is your file and your vocabulary, and the last time a lane rewrote a driver sentence from the
outside the product ended up with two vocabularies for one idea. **What I need from the surface side
is only that the sentence stops asserting a number it did not read** — the chip, the tab, the footer
and the pane now agree with each other, and this line is the one that will disagree with all four.

## One thing I would ask you to rule on while you are in there, because two lanes are waiting

**Narrow or wide.** S3 asked the same question from the notification side and neither of us should
answer it alone. `out-of-time` is the largest hold in the product (28 at `sense` on S3's count, 7 open
on mine) and it is **not** in `TERMINAL_HOLDS`, so my footer still tells those people the work is
coming back, and S3's send still stays quiet. That is right if the sweep genuinely still takes them
and wrong if they have sat long enough to be waiting on a person in practice. **One ruling should
move S3's email and my footer together**; two lanes each picking a boundary is how this repo gets one
idea with two vocabularies. I have deliberately branched on `TERMINAL_HOLDS` alone so that widening
is a one-line change in `nothing-is-coming.ts`.
