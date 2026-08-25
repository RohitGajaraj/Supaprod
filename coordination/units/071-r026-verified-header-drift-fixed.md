# Unit 071 · R026 fix verified at the front door; header drift caught and fixed

LANE 1 · 2026-08-25 · one dev-server session, started after the port check,
stopped the moment the checks concluded.

## R026 verified FIXED where it mattered — the product's front door

Created a brand-new track from /start ("Add a weekly digest email that
summarises completed jobs for the operations manager") and pressed Enter once:

- The walk **fired itself** (`?start=true` → autostart) — no second press.
- It ran a full window **past the point that used to die**: no "Unknown agent:
  discovery-scout". Discover's seat executed; the stop reason is now an honest
  bound, not a permissions ghost.
- Item 28 re-verified end to end on the fixed ground: sentence → Enter → walking
  run, zero configuration, zero further clicks.

**One open question for MAIN/L0, from the same observation:** the window close
returned as an `out-of-time` HOLD ("This run of the loop ran long, so the rest
of the work carries on next time"), not `out-of-window + more` — so item 34's
auto-continue correctly did not fire (it continues ONLY on out-of-window). If
foreground walks are meant to continue themselves across windows, the driver is
spending its bound as a hold rather than as a continuation request, and the
front door still needs one press per ~50s. Surface behaviour here is correct per
the ruled rule; the semantics live in `driveTrackOnce`. Filed below.

## Defect in MY unit 070, caught live and fixed same hour

The header read its own unpolled query key. The walk below announced a hold
while my header still said "Running" — two readers of one fact with two
freshnesses, the exact drift this repo bans. Fixed by sharing TrackRun's cache
entry (`["spine-track", trackId]`, 10s beat): one fact, one freshness.
Re-verified live: the header now shows "On hold" + the driver's sentence,
agreeing with every region beneath it. Screenshot:
`.playwright-mcp/verify-header-hold-agrees.png`.

Also re-confirmed under the shared key: `?start=true` on this already-driven
track did NOT re-drive — the guard holds through the key change.

## Gates

`tsc` clean · lint clean · full suite green on last full run (10,912/0) · server
stopped before this write-up.
