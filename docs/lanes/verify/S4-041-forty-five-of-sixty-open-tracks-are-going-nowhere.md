# S4-041 · CORRECTED. Nine open tracks are real, and eight of them are terminally held

> ## CORRECTION, 2026-08-27, and the headline below was WRONG
>
> **I did not break the counts down by workspace, and I flagged that as a limit without acting on
> it. Broken down, the number changes and so does the meaning:**
>
> | `is_sample` | tracks | what they are |
> | --- | --- | --- |
> | **true** | **51** | demo fixtures the sweep is DESIGNED to skip (`track-tick.ts:85`, F-90) |
> | **false** | **9** | real work |
>
> **"45 of 60 cannot move" over-counted by treating demo fixtures as stranded work.** They are not
> stranded. They are excluded on purpose, so no tick spends model budget on them, which is the
> behaviour F-90 established and which I quoted in my own earlier verdicts.
>
> **The corrected finding is smaller in count and worse in proportion:**
>
> | real open tracks | 9 |
> | --- | --- |
> | terminally held (`station-cannot-finish` 4, `going-in-circles` 3, `tools-refused` 1) | **8** |
> | still moving (`needs-a-waived-station`, driven 20:10 today) | **1** |
>
> **Eight of nine real open tracks are terminally held.** One is moving. The mechanism below
> (`TERMINAL_HOLDS` excluded from the tick, one human press the only exit, nothing surfacing it)
> stands unchanged and applies to those eight.
>
> The 11 `needs-evidence` tracks are all `is_sample = true`, so `scout_snapshots = 0` is not
> stranding real work. Gap #9 remains real; its live cost is not these eleven.
>
> **What survives untouched:** `max(station_drives) = 316`, the terminal-hold exclusion mechanism,
> the absence of any surface saying work is parked, and `S4-043`'s finding that the hold text asserts
> a count it never reads over work that was filed.
>
> **This is the same trap F-90 named** and I walked into a version of it by counting tracks without
> asking whose workspace they were on. Recorded rather than quietly edited, because the wrong number
> was sent to S0 with a decision attached.


> _S4, 2026-08-26 19:0x UTC, measured against the live database, read-only. Every number carries its
> query. This is the finding the acceptance number hides._

## The measurement

```sql
SELECT last_hold, count(*) AS n, min(station_drives), max(station_drives), max(driven_at)
FROM spine_tracks WHERE status='open' GROUP BY last_hold ORDER BY n DESC;
```

| `last_hold` | n | drives (min–max) | newest drive |
| --- | --- | --- | --- |
| **`station-cannot-finish`** | **32** | 12 – **316** | **2026-08-25 05:48:15** |
| `needs-evidence` | 11 | 0 – 0 | 2026-08-21 12:00:05 |
| `out-of-time` | 8 | 0 – 10 | 2026-08-26 18:50:51 |
| *(null)* | 4 | 0 – 174 | 2026-08-26 15:52:06 |
| `produced-nothing` | 2 | 3 – 11 | 2026-08-26 19:01:11 |
| **`going-in-circles`** | **1** | 40 | 2026-08-26 16:00:02 |
| **`tools-refused`** | **1** | 1 | 2026-08-26 16:30:29 |
| `waiting-on-a-person` | 1 | 0 | 2026-08-21 11:10:02 |

**60 open tracks.**

## What the sweep can actually reach

`src/routes/api/public/hooks/track-tick.ts:119-120` excludes terminal holds by construction:

```ts
const notTerminal = TERMINAL_HOLDS.map((h) => `last_hold.neq.${h}`).join(",");
trackQuery = trackQuery.or(`last_hold.is.null,and(${notTerminal})`) as never;
```

and `TERMINAL_HOLDS` (`correction.ts:262-270`) is `given-up`, `station-cannot-finish`,
`tools-refused`, `going-in-circles`.

**So 34 of the 60 are provably unreachable by the sweep** — 32 + 1 + 1. The data agrees with the
code: nothing in the `station-cannot-finish` cohort has been driven since **2026-08-25 05:48**, over
thirty-seven hours before this measurement, while `produced-nothing` was driven at 19:01:11, seconds
before it.

**Add the 11 at `needs-evidence` and it is 45 of 60.** Those are waiting on a pipeline that has
never produced anything:

```sql
SELECT count(*) FROM scout_snapshots;   -- 0
SELECT count(*) FROM product_analytics; -- 0
```

`scout_snapshots` is **0 rows, ever**. Eleven tracks are holding for evidence from a source that has
never delivered a single row, and none has been driven since 2026-08-21.

> **45 of 60 open tracks (75%) cannot move.** 34 are excluded from the sweep by design; 11 wait on a
> pipeline that has produced nothing in its life. **Fifteen tracks are the entire live loop.**

## The number that should not exist

`max(station_drives) = 316`.

`correction.ts:266-268` comments the F-43 ceiling with: *"A station dispatched twelve times without
moving is not going to move on the thirteenth… **This is the hold that would have stopped 316 runs at
12.**"* That sentence was written about this data, and the row is still sitting there with 316 on it.
The ceiling now prevents the next one; it did not retire the ones that predate it.

## There IS a door, and nothing points at it

`retryStation` (`track.functions.ts:790-814`) clears `last_hold` regardless of whether it is
terminal — its own comment gives the example *"somebody released `station-cannot-finish` at build"* —
and F-99 made the release clear `station_drives` too, without which the released track would trip the
ceiling on the very next tick and re-hold.

**So the recovery path works, and it is one human press per track.** Thirty-four presses.

**Nothing surfaces that.** No count of parked work, no digest, no notification. Gap #2's whole
premise is that nothing reaches a person who left the page, and this is the concrete cost of it: a
person would have to open sixty tracks one at a time to discover that thirty-four of them are
waiting on a press only they can make.

## Why this matters more than the acceptance number

`S4-040` reports the acceptance as **0**, failing on one decided approval, with the loop otherwise
walking end to end. That is true and it is the smaller story.

**The larger one is here: the loop works, and three quarters of the work it has been given cannot
reach it.** Anyone reading "the acceptance is 0" concludes the machine is broken. The measurement
says the opposite — the machine runs, and the queue feeding it is 75% sludge that no automated path
will ever clear.

## What I am not claiming

- **I did not determine why 32 tracks reached `station-cannot-finish`.** That hold means a station
  ran and could not finish; the causes are per-track and unexamined here.
- **I did not check whether releasing them would help.** A track that hit the ceiling at 316 drives
  may well hit it again; F-99 fixed the mechanism, not the underlying station failure.
- **One workspace's data may dominate these counts.** I did not break them down by workspace.

## Verdict

**CONFIRMED and unreported until now.** Three asks follow, each to its owner:

- **S0** — the 34 terminally-held tracks need a decision: bulk-release, abandon, or leave and say so.
  Leaving them `status='open'` while the sweep provably skips them makes every open-work count in the
  product wrong by 34.
- **S2** — the board should say how many pieces of work are parked and need a press. It is one
  `count(*)` and it is the difference between a queue and a graveyard.
- **S0** — `needs-evidence` × 11 against `scout_snapshots = 0` is gap #9 with a live cost attached.
  Those eleven are not waiting; they are stranded.
