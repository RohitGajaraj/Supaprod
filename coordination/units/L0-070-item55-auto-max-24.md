# UNIT L0-070 — item 55: the leg budget mirrors the route it walks

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #55 (P0, ruled by MAIN) · **Date:** 2026-08-25

`AUTO_MAX` 8 → 24 in `TrackRun.tsx`, mirroring `FOREGROUND_MAX_SEATS`, because
a route is ~21 seats and a foreground window buys about one — 8 stopped before
halfway. The cap-reached sentence renders the constant directly
(`It walked every automatic leg (24)…`), so message and bound cannot drift.
The $5 track cap already bounds what those legs can spend.

Gates: `tsc` 0 · component suite 0 fail · eslint clean · no dev server.
Live proof rides the next grounded walk (LANE 1's harness from unit 073).
