# Experiment: can a track finish — 2026-08-25

> _MAIN LANE. This file is the record so the result survives the session, whichever way it goes._
> **A negative result is a finding and gets written up the same as a positive one.**
>
> **Round 1 is finished and the result is NEGATIVE.** Neither track advanced. It bought two walls,
> and the second one is the one that has been killing every run in this product's history.

---

## Round 1 — the clock hypothesis

### The hypothesis

Agents could not record a decision because **nothing told them what day it is**. `decision.record`
refuses a `forecast_horizon_date` in the past — correctly, so a fabricated horizon cannot land — and
a model reasoning from its training cutoff guessed the year, guessed low, was refused, and spent its
whole step budget guessing. One strategist run burned **68,260 tokens** saying so out loud. The
station then failed three times and the track was marked `given-up`.

**If that was the only wall, a reset track should now move past the station it died on.**

### What was changed, and when

| | |
| --- | --- |
| Fix | One line in the agent system prompt: today's date, UTC, date-only. `src/lib/ai/loop.server.ts` |
| Deployed | **Verified present in Lovable HEAD 2026-08-24 20:3x UTC** by reading the file back, not assumed |
| Reset | 2 of 5 `given-up` tracks in the only live workspace `0b792d52-82e2-43e2-adc5-8a26e5c800b4` |

```sql
UPDATE spine_tracks SET attempts = 0, last_hold = NULL, seat_cursor = 0,
       driven_at = now() - interval '1 day'
WHERE id IN ('f9e41393-7774-4b30-9368-0c2f2670acf1','c4b12e7c-2be4-4ef3-aa54-14645bf28510')
  AND workspace_id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4' AND last_hold = 'given-up';
```

**Two, not five, on purpose.** Five would cost five times the spend to learn the same thing, and if
the hypothesis is wrong I would rather find out for $0.30 than $1.50.

| Track | Station at reset | Why this one |
| --- | --- | --- |
| `f9e41393` EU Timezone Tier-1 Support Latency | `decide` | **The station the date bug actually bit.** Direct test of the fix |
| `c4b12e7c` Silent Failures via Swallowed DB Errors | `design` | **Furthest along, so the shortest path to `learn`.** Probes what is beyond `decide` |

### THE RESULT: neither advanced

Read back **2026-08-24 22:55 UTC**, six ticks after the last agent ran.

```sql
SELECT id, station, last_hold, attempts, seat_cursor, driven_at
FROM spine_tracks
WHERE id IN ('f9e41393-7774-4b30-9368-0c2f2670acf1','c4b12e7c-2be4-4ef3-aa54-14645bf28510');
```

| Track | Station | last_hold | attempts | Moved? |
| --- | --- | --- | --- | --- |
| `f9e41393` | `decide` | `given-up` | 3 | **no** |
| `c4b12e7c` | `design` | `given-up` | 3 | **no** |

**Against the experiment's own table that reads: _"Neither advances → the clock was not the wall, or
not the only one. Re-open the autopsy."_** So the autopsy was re-opened, and it found two walls.

> **A WARNING FOR WHOEVER READS THIS NEXT, because it nearly reversed the finding.** The database is
> UTC and this session was working in IST. `driven_at 2026-08-24 22:50` looked like *yesterday* and
> was in fact **four minutes ago**. Read as yesterday, the evidence says "the reset never applied and
> nothing has run since"; read correctly, it says "the reset applied, the tracks ran six times, and
> they failed again." Those are opposite conclusions from one column. **Stamp `now()` into every
> query here.**

---

## Wall 1 — the clock fix was real, and it was not sufficient

The fix worked where it was aimed. The strategist recorded a decision on every one of its three
runs, each with a forecast, which is the exact call it could not make before:

```sql
SELECT id, left(title,60) AS title, created_at FROM decisions
WHERE created_at > '2026-08-24 20:00:00+00' ORDER BY created_at DESC;
```

| id | title | created_at |
| --- | --- | --- |
| `7b43fd8e` | Decline 'EU Timezone Tier-1 Support Latency' workstream | 21:20:37 |
| `e67ae002` | Decline 'EU Timezone Tier-1 Support Latency' workstream pend… | 21:01:08 |
| `eec7780d` | Decline 'EU Timezone Tier-1 Support Latency' workstream pend… | 20:41:17 |

All three attached to the track as members of the `decide` station. **F-01 is confirmed fixed by
behaviour, not by reading the file back.** It was simply never the only wall.

---

## Wall 2 — THE CLOCK SPLIT THE CREW AND THE DRIVER CALLED THE STATION EMPTY

**This is the finding. It is the mechanical reason no track has ever finished.**

The seat cursor, shipped 2026-08-22, fixed the SPENDING half of a crew cut short by the tick
deadline: the next tick resumes at the seat still owed instead of paying for the first seat again.
It left the VERDICT half broken. The tick that **finishes** a resumed crew judges the station on its
own harvest — `attached`, what the seats in *that* tick filed. So a crew whose producing seat ran in
the earlier tick and whose checking seat runs in the later one reads as *"ran cleanly, filed
nothing"*. That is `produced-nothing`, it counts an attempt, and three of them is `given-up`.

Decide's crew is `strategist` then `critic`. `strategist` produces; `critic` checks and files
nothing by design.

```sql
SELECT agent_slug, status, duration_ms, created_at
FROM agent_runs WHERE track_id = 'f9e41393-7774-4b30-9368-0c2f2670acf1'
  AND created_at > '2026-08-24 20:00:00+00' ORDER BY created_at;
```

| Tick | Seat | Ran | Filed | Driver's verdict |
| --- | --- | --- | --- | --- |
| 20:40 | strategist | **53.7s** | decision `eec7780d` at 20:41:28 | out-of-time, seat_cursor → 1, no attempt |
| 20:50 | critic | 21.0s | nothing (correctly) | **produced-nothing, attempt 1** |
| 21:00 | strategist | **42.7s** | decision `e67ae002` at 21:01:18 | out-of-time, seat_cursor → 1, no attempt |
| 21:10 | critic | 15.6s | nothing | **produced-nothing, attempt 2** |
| 21:20 | strategist | **41.6s** | decision `7b43fd8e` at 21:20:46 | out-of-time, seat_cursor → 1, no attempt |
| 21:30 | critic | 18.9s | nothing | **produced-nothing, attempt 3 → given-up** |

**The station did its job three times, filed three decisions, and the driver called it empty three
times and gave up on it.** `spine_track_members` holds every one of those rows, at `decide`,
attributed to `decision.record`:

```sql
SELECT artifact_kind, station, count(*) FROM spine_track_members
WHERE track_id = 'f9e41393-7774-4b30-9368-0c2f2670acf1' GROUP BY 1,2;
-- signal/sense 9 · theme/sense 7 · task/sense 1 · decision/decide 4
```

**The split was structural, not unlucky.** Every strategist run exceeded the 45s deadline *on its
own*, so that crew could never once have reached its second seat inside one tick. A slow first seat
makes this permanent for any multi-seat station.

**Scale, measured the same minute:**

```sql
SELECT station, last_hold, count(*) FROM spine_tracks GROUP BY 1,2 ORDER BY 3 DESC;
```

**23 of 59 tracks were sitting on `out-of-time`** — 18 at `sense`, 5 at `design`. Every one of them
is a candidate for exactly this.

### The fix

Commit `5d0780bdb`. `didStationProduce` in `src/lib/spine/driver.ts`, wired in `driver.server.ts`.

- The ordinary path is **unchanged**: a crew that ran whole in one tick and filed nothing is still
  `produced-nothing`, and costs no extra query.
- A **resumed** crew consults the record, scoped to **this station and this arrival** — never the
  track's whole history, or a station could advance on an artifact a previous visit produced, which
  is the progress-the-work-did-not-buy that this rule exists to refuse.
- An unreadable trail answers **no**. A guard that cannot read its evidence must not be the thing
  that advances work.
- 8 tests in `a-crew-split-by-the-clock-still-filed-its-work.test.ts`, including the guards in the
  loosening direction. `tsc` 0 · `bun test` **10,654 pass / 0 fail** · eslint clean on touched files.

---

## Wall 3 — the design station could not read the id it was handed

Track `c4b12e7c` at `design` failed differently, and it is F-02 caught in the act. Three ux-architect
runs, all the same answer:

> *"The PRD ID for 'Silent Failures via Swallowed Database and API Errors' is redacted and could not
> be located in the workspace. `design.draft` requires a valid, unredacted UUID to proceed."*

The design-critic run at 20:40 shows the shredded id verbatim in its own output:

> *"…the spec explicitly lists 'Developing dashboards or alerts for these errors' as a non-goal (PRD
> id `[REDACTED:pii]e-4f49-b5b2-12f21e858042`)"*

The real row is `55688633-679e-4f49-b5b2-12f21e858042`. `floor-pii-phone` ate `55688633-679` — eight
digits, a hyphen, three digits, which is a phone shape. **The guardrail meant to protect a person
from a leaked phone number was severing the handoff between stations**, which is the one thing this
product exists to do.

**The boundary fix (F-02) is in the repo and was NOT deployed while these runs happened.** The
strategist's 21:20 output carries a clean, unredacted `7b43fd8e-5078-47fc-936c-1b98cc4f2ff2`, so the
deploy landed between 21:00 and 21:20 UTC. Every redacted observation above is from before it.
**That track has not been re-driven since the fix went live, so wall 3 is fixed-but-unproven.**

---

## What the agents got RIGHT, which is worth saying

Both tracks failed on machinery, not on judgement. The strategist declined the work and said exactly
why: `active_scout_targets = 0`, no Zendesk tickets, no verbatim quotes, no SLA references. It
refused to build on synthetic signals and recorded the decline **with a forecast** — *"if we restore
Zendesk ingestion, ≥3 verbatim EU Tier-1 tickets will appear within 7 days"*. The critic red-teamed
it and upheld it. That is the loop working.

**It also means neither of these two tracks could ever have reached `learn`**, whatever the driver
did: their subject is a workspace with no telemetry, and the honest verdict on both is *decline*.
**Re-driving them is not the proof.** The proof needs a fresh track, entered at `sense`, on work the
evidence in that workspace can actually support.

---

## Status

- [x] Fix deployed and verified in Lovable HEAD (F-01, the clock)
- [x] Two tracks reset
- [x] First tick observed
- [x] Movement or no movement recorded with SQL — **no movement, both tracks**
- [x] Result written up — negative, and it bought the crew-split defect
- [ ] Wall 2 fix (`5d0780bdb`) live in Lovable HEAD — pushed 2026-08-24 22:5x UTC, awaiting sync
- [ ] **Round 2: a fresh track from one sentence, driven in the foreground, walked to `learn`**

---

## Round 2 — the plan, and why it is shaped this way

**Not another reset.** Round 1 proved the two live `given-up` tracks are unwinnable on their merits.

**Not the ten-minute tick.** With a multi-seat crew and a 45s shared deadline, a station now costs
two ticks; seven stations is over two hours of wall clock. The acceptance says a person can *watch it
happen on one screen*, and nobody watches a two-hour bar. `driveTrackNow`
(`src/lib/spine/track.functions.ts`) exists precisely for this: a foreground walk with a fresh clock
per seat, so the crew is never split in the first place. **Wall 2's fix is what makes the unwatched
tick path correct; the foreground path is what makes the watched run possible.** Both are needed and
they are not alternatives.

The run to prove: one sentence in, zero configuration, `/track/:id`, seven stations, a verdict at
`learn` naming what was predicted against what happened. Track id, SQL and screenshot land here.
