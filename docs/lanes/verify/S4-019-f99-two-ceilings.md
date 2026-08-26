# S4-018 · F-99 — the spine has two ceilings and only one had a door

> _Verified 2026-08-26 by S4 on `lane/proof` at `c569d7c89` / `b69656851`._

## The finding

**The spine has TWO ceilings, but only ONE had a door:**

1. `MAX_STATION_ATTEMPTS = 3` — bounds a station that FILES NOTHING (attempts incremented on self-check failure / produced-nothing).
2. `MAX_STATION_DRIVES = 12` (F-43) — bounds a station dispatched FOREVER WITHOUT CONVERGING. `out-of-time` deliberately costs no attempt, so attempts=0 forever while drives accumulate.

**Both ceilings are right.** The defect: **only attempts had a door (the retry/resume path).** `retryStation` reset attempts AND left `station_drives` alone. So a person's release cleared the hold, let the track be driven once, tripped F-43's ceiling, and re-held as `going-in-circles` (terminal) within one tick — the documented recovery path did not exist for the second ceiling.

## The evidence

Measured on live DB: two tracks released by hand at 40 and 29 drives both re-held as `going-in-circles` within ten minutes. Every open track on a sweep-drivable workspace was already past 12 drives (81, 63, 53, 42, 40, 29). The documented way to recover work **could not recover any of it** — the hold cleared, the board showed progress, and it was terminal again before anyone looked twice.

This explains **why there are 73 tracks and zero sense→learn**: tracks accumulate drives, cross 12, and no control brings them back.

## The fix

A person's release clears the ceiling (`station_drives = 0`). The automatic escalation-resume in `driver.server.ts` **deliberately does NOT** — it grants one clean run but preserves the drive count so the ceiling still exists. A track that was genuinely stuck converges; a track that was just paused recovers cleanly.

## The proof (F-99 proven)

Track `8391835f` (design, unopened-notification-setting) was released at 16:08 UTC with `station_drives=0` (the fix). The 16:10 sweep drove it — it did NOT trip `going-in-circles`, `station_drives` went 0→1, and it filed a **new prototype at 16:10:47** — its first artifact since 2026-08-25 05:41, **over 34 hours ago**. It now holds `out-of-time` (resumable, no attempt cost), so it drives again next tick.

Before this fix that track was permanently terminal: release cleared its hold, next drive tripped F-43's ceiling, re-held as `going-in-circles` within ten minutes. Measured twice on two tracks at 40 and 29 drives.

## Connection to F-76

The same track already carried 27 artifacts including 2 prototype rows at design — exactly the kind F-76's broken self-check could not see (it asked for `design_memory`). So F-76 blinded the check, the track was sent back and back until it crossed 12 drives. Two findings, one story.

## Verdict

**CONFIRMED statically** — the code shows two ceilings with one door, the live measurement confirms 73 terminal tracks, and the first recovered track (8391835f) filed its first artifact in 34 hours. The fix is structural: split the ceiling, give the second one its door.