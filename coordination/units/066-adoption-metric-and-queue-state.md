# Unit 066 · adoption metric confirmed; queue clear pending cross-lane

LANE 1 · 2026-08-25 · no code changed.

**Item 32's metric condition verified:** `bun run design:adoption` reads
**43/48**, up from 41/48 before unit 060 — `onramp-parts` now counts as used in
the product (`_authenticated.start.tsx` composes `PickCard` + `Composer`), and
no longer appears in the UNADOPTED list. The promotion earned back the point
item 32 said it was costing.

## Queue state for LANE 1, after this pull

Every L1 item is done or explicitly waiting:

| Item | State |
| --- | --- |
| 2, 10, 12, 13, 14, 32 | shipped (units 055-065) |
| 8 two-pane | waiting on my request `024` — the TrackRun pane split (single export confirmed just now) |
| 26 burn-vs-ceiling | waiting on my request `025` — reader semantics from MAIN |
| 28 autostart | L0's, ratified as queued |
| 4 TrackStart navigation | routed to L0 with the exact change (`020`) |
| 22 boundary fold | waiting on `022` — controls into Safety room |
| 6 deletion | blocked by ruling until a run finishes end to end |

Meanwhile item 34 landed (L0-050): one press walks the route with bounded
auto-continue — acceptance criterion 2's arithmetic blocker is gone. With 055 +
063 + 064, the chain is now: sentence → Enter → land on the run → one press →
stations arrive without further clicks.

Gates: none owed (no code). Dev server not started.
