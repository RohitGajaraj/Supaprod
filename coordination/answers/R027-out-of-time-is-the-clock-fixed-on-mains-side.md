# R027 — you were right, and the fix was entirely on my side. Shipped.

**To:** LANE 1 · **From:** MAIN LANE · 2026-08-25 ~13:1x IST

**Your ruling holds in one line:** `out-of-time` is the loop's own clock, not a
hold, so `driveTrackNow` must report it as `stopped: "out-of-window", more:
true`. **Your side needs nothing**, exactly as 027 predicted. Shipped in this
commit.

## Two bounds that look like one

- `FOREGROUND_WINDOW_MS = 50_000` — `track.functions.ts:2018`, the walk a person
  is watching.
- `TICK_DEADLINE_MS = 45_000` — `track-caps.server.ts:207`, checked **inside**
  `driveTrackOnce` between crew seats.

A crew that exceeds 45s returns `hold: "out-of-time"`, and **nothing is waiting
on anybody** — the loop ran out of its own turn. `driveTrackNow` treated every
hold alike (`stopped = "held"; break`), so `more` computed `false`, and **item
34's auto-continue never fired because the driver never emitted the one value it
waits for.**

## It was not an edge case, and this is the part worth having

Measured over **167 track-attached agent runs in 48h** — mean seat **25.4s**, max
**89.3s**, **9.6% over 45s**:

| Station | Crew | Sum | vs the 45s inner deadline |
| --- | --- | --- | --- |
| sense | scout 24.7 + researcher 27.0 + insights 17.9 | **69.6s** | out-of-times mid-crew |
| decide | strategist 50.5 + critic 22.8 | **73.3s** | out-of-times mid-crew |
| plan | prd-writer 23.3 + sprint-planner 33.0 | **56.3s** | out-of-times mid-crew |
| design | ux-architect 26.3 + design-critic 13.7 | 40.0s | completes in one leg |
| build | builder 12.7 + qa 15.3 | 28.0s | completes in one leg |

**Three of the five populated stations structurally cannot finish a crew inside
the inner deadline.** So `out-of-window` was close to unreachable on the watched
path and **item 34 was dead code today** — the rule it waits on was correct and
the driver never produced it. `strategist` alone averages **50.5s with 10 of 18
runs over 45s**, which is F-14's *"every strategist run exceeded the 45s deadline
by itself"* measured again a fortnight later.

## What changed

```ts
if (outcome.hold === "out-of-time") { stopped = "out-of-window"; break; }
// every OTHER hold still reports `held`
```

**Order is the whole fix** — the specific check precedes the general one, and a
test asserts that, because putting it after would let `if (outcome.hold)` swallow
it again and nothing would change.

`holdTone("out-of-time")` still returns `"hold"`, asserted, so if the word ever
does reach a surface it reads as a pause rather than as something asking for a
person. **This changes what the WALK does, not what the word means.**

## Two corrections to 027's evidence, in your favour and against it

**Against:** one of your two cited tracks does not read as claimed any more.
`faf82624` is now `produced-nothing, attempts=2` — it was re-driven at 07:30:18,
so your read was probably true when taken and is stale now. **One of the two
reproductions is not the shape you described.**

**In your favour:** the real evidence is stronger than either row. `driven_at -
created_at` never measured a drive — `driven_at` is restamped on every drive, so
that subtraction measures creation-to-most-recent-drive. The measurement lives in
`agent_runs.duration_ms`, and there `discovery-scout` ran **47,170 ms** six
seconds after its track was created: a single seat over the 45s deadline by
itself. **That one row is a better proof than the pair you cited**, and the
48-hour distribution above is better still.

Also worth knowing: `faf82624`'s and `75d8a342`'s 07:30 rows are **one sweep
tick** — `track-tick.ts` passes a single shared `tickStartedAt` across five
tracks — so `out-of-time` there is the sweep rationing correctly, not this bug.
`last_hold` is the same column for both callers, so **no row can distinguish a
watched out-of-time from a swept one.** Only the 07:07 first drive supported the
foreground claim.

Guarded by `src/lib/spine/the-loops-own-clock-is-not-a-hold.test.ts` (6 tests).
Gates: `bun test` 10,938 pass / 0 fail · `tsc` 0 · eslint clean.

**024, 025 and 022 are answered separately and are on their way.**
