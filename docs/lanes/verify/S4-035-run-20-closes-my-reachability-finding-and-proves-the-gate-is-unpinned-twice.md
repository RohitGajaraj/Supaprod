# S4-035 · RUN-20 closes my reachability finding, and independently proves the gate problem twice

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _S4, 2026-08-26, verified against `origin/lane/run` @ `51711630e`, **pre-merge**. Two separate
> results: one of my own findings is resolved, and a second, larger one is strengthened by evidence
> I did not go looking for._

---

## 1 · `S4-023` is resolved on `lane/run`. Gaps #5, #6 and #12 now have a door.

`S4-023` found that `rewindTrackTo`, `submitStationByHand` and `paste-back.ts` had **zero callers
anywhere in `src/`** outside their own tests, and concluded the gaps were not closed because nobody
could press them.

**RUN-20 mounts them, and the chain reaches a real route:**

```
origin/lane/run:src/components/track/TakeOver.tsx:40   import { rewindTrackTo, submitStationByHand … }
                                              :49-50   useServerFn(rewindTrackTo) / useServerFn(submitStationByHand)
origin/lane/run:src/components/track/TrackRun.tsx:927  {track ? <TakeOver trackId={trackId} track={track} /> : null}
origin/lane/run:src/routes/_authenticated.track.$trackId.tsx:233  <TrackRunLeft …>
```

Rendered, not merely imported — I checked that specifically, because it is the distinction the
original finding turned on.

**Status is now "wired, unmerged, and half-unseen", which is a real upgrade and not a completion.**
S1's own log says so before I could:

> *"HONEST LIMIT: the undo button and the paste field themselves are test-proven (7 tests) but their
> live render is UNCONFIRMED — no open track in this workspace stands past its first step, and the
> workspace is out of AI credits, so none can advance."*

**That sentence is the behaviour R-11 exists to produce, and it is worth naming as loudly as a
defect would be.** The commit title is *"the steer proof reported honestly rather than upgraded"*,
and the temptation it resisted — a builder marking its own unit proven because the tests are green —
is exactly what has cost this repo weeks before. I have nothing to add to it and would not have
caught the limit myself without a database.

Two things S1 also did that the operating model asks for and rarely gets: `CHECKED FIRST` names
`previousStation` in `spine/route.ts` as already existing and already skipping waived steps (*"deriving
from `AGENT_STATION_ORDER` would have been the bug"*), and six Meridian primitives reused with
nothing new drawn. Adoption up, inventory flat.

**So: `S4-023`'s finding stands as written for `main`, and is CLOSED on `lane/run` when it merges.**
The remaining gap is a live render nobody has seen, which needs credits and a track past its first
step, not code.

---

## 2 · The gate is unpinned, and this is the second independent instance

This one I was not looking for.

RUN-20 reports: **"full suite 11,640 pass / 0 fail"**.

`lane/run` still carries the failing lines:

```
$ git show origin/lane/run:src/components/ui/button.test.tsx | grep -c 'defineProperty(import.meta.env'
4
```

Those are the four lines `S4-022` proved fail deterministically on **bun 1.4.0**, because in bun
`import.meta.env` *is* `process.env`, and bun's `process.env` rejects a data descriptor that is not
`configurable && writable && enumerable`. The tests supply `configurable` alone.

**So on bun 1.4.0 that tree must produce two failures, and S1 reports zero.**

**Neither report is dishonest, and that is the whole point.** `S4-022` documented the same
disagreement between S0's *"11,691 tests 0 fail"* and my *"11,631 pass / 2 fail"* on an identical
tree. This is the second instance, from a third session, and it upgrades the finding:

> **It is not that one session's number is wrong. It is that no session in this repo can compare a
> gate result with any other session's, because nothing pins the runtime** — no `engines` field, no
> `packageManager` field, no `.bun-version`, no `.tool-versions`.

Three sessions, three counts (11,691 / 11,640 / 11,634), and the differences are a mix of genuinely
different trees and genuinely different interpreters, with **no way to tell which from the numbers
alone.** That is a broken instrument, and "gates green" is the sentence every unit in this repo ends
with.

**The ask has not changed and is now twice as well evidenced** (`coordination/requests/S4/verdicts-021-022-two-things-for-S0.md`):
pin the runtime, and have every buildlog line say which `bun` produced its number. Four lines in
`button.test.tsx` fix the symptom; the pin fixes the class.

---

## Verdict

- **`S4-023` — resolved on `lane/run`**, standing on `main` until it merges. Callers exist and reach
  a mounted route. The live render of two controls remains unseen, by S1's own honest account.
- **`S4-022` — CONFIRMED a second time, independently, and widened.** Not a disagreement between two
  sessions; a repo where gate results are not comparable at all.
