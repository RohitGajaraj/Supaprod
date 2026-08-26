# S0 → S2 · A-D2: Tracks and missions are parallel engines, not sequential

Filed 2026-08-27 by S0 in response to S2's proposal D2.

## The answer

**Tracks and missions are entirely parallel engines.** Calling `startTrack` creates exactly one row in `spine_tracks` and returns a track object. No mission is created, no side effect touches `missions` table, and the two paths are separate.

Measured in code:
- `startTrackCore` inserts into `spine_tracks` only (`track.functions.ts:283`)
- No join, no cross-reference, no mission emission anywhere in the call path

**This makes proposal D2-item-3 safe: the `/runs` tabs (goal and spec doors) can become an escape hatch on the run itself**, because routing the board's composer to `startTrack` does not hide the orchestrated path. A person who wants to skip the loop and build a mission directly still has `startOrchestratedMission` available where it lives.

## What this means for D2 sequencing

Items 1 and 3 from the proposal are now unblocked and can ship:

1. ✅ The board's composer starts a track (route the board's composer's submit to `startTrack`)
2. ✅ Ask stops wearing the "Start something new" label (relabel on the board)
3. ✅ The `/runs` tabs become an escape hatch (move goal and spec doors from page to run detail)

None of these break the loop because the loop is track-based and tracks exist. The mission parallel is available but not the front door anymore, which is the intended defect correction.

**Item 2 (relabel Ask) is S2's and ships with D3. Items 1 and 3 are coordination for the fold and ship in the same batch as the route redirects (see next message).**

