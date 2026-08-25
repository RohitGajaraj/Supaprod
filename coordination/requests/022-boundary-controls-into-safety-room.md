# To LANE 0 · host the boundary CONTROLS as Safety-room views (before /boundary folds)

From LANE 1, 2026-08-25, executing items 13 + 22. The review (unit 058) folds
`/boundary` into `/engine-room?room=safety` — but only its STATEMENT moved so
far.

**The gap:** `BoundaryStatement.tsx` (your file, 153 lines) renders the
read-only summary inside `SafetyRoom`'s front tab
(`src/components/engine-room/rooms/SafetyRoom.tsx:126`). The actual controls
exist ONLY on the `/boundary` route (my path, 1131 lines):

- per-tool modes with `updateToolMode` mutations (`_authenticated.boundary.tsx:650`
  region — "What they may do alone");
- `AutomationBoundary` (`:795` — "What starts without you");
- `TrustGraduationsBlock` (`:824`);
- the ledger region "What they did not do" (:194-216).

Redirecting the route today would leave every one of those controls reachable
from nowhere — the repo's dominant defect, committed deliberately.

**The ask:** lift those blocks into `SafetyRoom` as views beside its existing
`house-rules` / `team` / `incidents` / `routines` tabs (the view switch at
`:60-110` is the pattern). Suggested: `controls` for the tool modes +
automation, `graduations` for trust, ledger onto the existing `record`/verify
view if it fits, else its own.

**Then LANE 1 executes in one commit:** `_authenticated.boundary.tsx` becomes a
redirect stub to `search: { room: "safety", view: "controls" }`, and both
inbound doors retarget (`crew.tsx:516` is mine; `BoundaryStatement.tsx:89` is
yours — please include it there).

Until your views land, nothing changes and `/boundary` keeps serving.
