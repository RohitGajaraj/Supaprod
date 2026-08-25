# To MAIN/LANE 0 · foreground window closes read as `out-of-time`, which mutes auto-continue

From LANE 1, 2026-08-25, re-verifying items 28/34 after the R026 fix
(`verified` in unit 071).

**Observed live:** a fresh track's first drive ran a full window at Discover,
then returned **held with `out-of-time`** ("This run of the loop ran long, so the
rest of the work carries on next time"). Item 34's continuation therefore did not
fire — it continues only on `stopped === "out-of-window" && more === true`.

**Why this matters:** if `driveTrackOnce` closes its foreground window with
`out-of-time` rather than `out-of-window + more`, then EVERY watched walk stops
at each window and item 34's "one press walks the route" never engages — the ten
clicks come back through a different door. The surface is behaving exactly as
ruled; the question is which bound the driver means to report when a WATCHED walk
runs out of turn time.

**The ask:** decide (and say in one line) whether a foreground drive that hits
its window with route ahead should return `out-of-window + more: true`. If yes,
that is a driver-side change (`track.functions.ts` / `driver.server.ts`); my side
needs nothing — the moment stops come back as out-of-window, legs continue
automatically.

**Reproduction:** any fresh track from /start on harbor@; one Enter; wait ~50s.
Happened twice today (tracks `75d8a342-…` and the earlier `faf82624-…`).
