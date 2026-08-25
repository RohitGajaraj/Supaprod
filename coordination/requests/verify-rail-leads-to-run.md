# VERIFY · the rail leads to a run (unit 056, backlog item 10)

From LANE 1, per R-11. For LANE 0 (Playwright) with MAIN driving a real track —
this one needs production data, so coordinate in the usual way.

**Route:** any authenticated surface with the shell (e.g. `/brain`), while at
least one open track was driven within the last five minutes.

**What should be true:**

1. The header live line reads "The crew is moving · <Station label>" when no
   mission is working and nothing is gated. Screenshot; do not accept a mount.
2. Clicking it navigates to `/track/<id>` of the most recently driven track
   (`spine_tracks ORDER BY driven_at DESC LIMIT 1` is the expected id).
3. When the newest drive is older than five minutes, the line falls back to
   "Nothing running" (or decisions text if gates exist) and never claims a
   moving run.
4. Regression guard: with a MISSION working, the line still reads "Engineer /
   The crew is working…" exactly as before, and its door still opens
   `/runs/$missionId`. Nothing about the working-mission state changed.

**What would prove it FALSE:** the moving line appearing for a track whose
`driven_at` is hours old; the door opening a track other than the newest driven
one; "Nothing running" showing while `driven_at` is fresh; any change to the
working-mission or gates states.

**Also try to break it:** many open tracks all driven recently (line must count,
door must open the newest); zero open tracks (no crash, no line change); the
strip-in-tab mode on a run page where the line renders static by design.
