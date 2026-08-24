# THE FIRST RUN — Build Status

**Last updated: 2026-08-25 12:30z · MAIN LANE**

## Mission Objective
> One track walks all seven stations, on demand, on a real workspace, watchable live, forecast captured before Build and graded after Ship, at one URL that can be revisited.

## Completed Units

### M-A: POST /api/tracks ✅
- Create a track from one sentence of intent
- Zero configuration (defaults workspace from auth, product = null)
- Bearer token auth, scoped to user
- File: `src/routes/api/tracks.ts`
- Status: Ready for LANE 1 to build on-ramp
- Commit: ba23bafbe

### M-B: POST /api/tracks/:id/drive ✅
- Foreground walk without tick's 45s deadline
- Loops driveTrackOnce until route complete or gate blocks
- Returns track state + complete drive history
- Bearer token auth, scoped to user  
- File: `src/routes/api/tracks/$trackId.drive.ts`
- Status: Ready for live foreground runs
- Commit: ba23bafbe

### M-C: GET /api/tracks/:id/stream ✅
- SSE endpoint publishing station transitions
- Reuses ask-sse.ts contract with station field
- Event shape documented in MISSION.md (scroll to bottom)
- Drives track in background, streams live events
- File: `src/routes/api/tracks/$trackId.stream.ts`
- Status: Ready for L0-B and L1-B consumption
- Commit: ba23bafbe

## In Progress

### L0-A: TrackRun stub (🚀 UNBLOCKER)
- Status: Waiting for LANE 0 to push
- Blocks: L1-A, then all downstream work
- Promise: `src/components/track/TrackRun.tsx` exports `TrackRun({ trackId })`
- Target: Both lanes proceed in parallel after this lands

### L1-A: Route mount
- Status: Waiting for L0-A
- Mounts: `src/routes/_authenticated.track.$trackId.tsx`
- Imports: TrackRun stub from L0-A
- Unblocks: L0-B and L1-B

### L0-B: TrackRun fill
- Status: Blocked on L1-A
- Implements: TrackRun consumes M-C SSE stream
- Renders: RunMap in "live" mode, RunTimeline, ToolStream
- Awaits: L1-A route mount + M-C endpoint (M-C is ready ✅)

### L1-B: On-ramp box
- Status: Blocked on L1-A
- Implements: One intent box calling M-A `/api/tracks`
- Navigates: To `/track/:id` on success
- Awaits: L1-A route mount + M-A endpoint (M-A is ready ✅)

## Pending

### M-D: Moat proof (forecast capture + grade)
- Status: Awaiting founder database access
- Requirement: `decision.record` fires on real workspace + `learning.record` verifies grade
- Measurement: SQL query to confirm 0→1 forecasts captured
- Blocker: Requires Lovable MCP authentication
- Request filed: M0-001 in coordination/requests/

### M-E: Integration & acceptance
- Status: Pending until L0/L1 lanes complete
- Scope: Audit both lanes' pushes, answer all requests, keep this file current
- Success: All six acceptance criteria met (see MISSION.md)

## Build Gates
- TypeScript: ✅ Pass (0 errors, M-A/B/C all type-safe)
- Tests: ✅ Pass (10,613 pass, 3 pre-existing fail)
- Lint: ✅ Pass (all three endpoints clean)
- Humanization: ✅ Clean
- Docs: ⏳ Pending docs:check on full work

## Wiring Order Status
1. L0-A stub → **WAITING FOR L0 PUSH**
2. L1-A route → Blocked on L0-A
3. M-A/B/C endpoints → ✅ **COMPLETE & PUSHED**
4. L0-B fill → Blocked on L1-A
5. L1-B on-ramp → Blocked on L1-A
6. M-C moat proof → Blocked on founder database access + L0/L1 completion

## Notes for Building Lanes

**L0-A is the critical path.** Push the TrackRun stub first (can be one line: `export function TrackRun({ trackId }) { return null; }`). This unblocks L1-A, and then all four units proceed in parallel.

**M-A/M-B/M-C are 100% ready.** Both lanes can start their implementation knowing:
- M-A creates tracks, defaults workspace
- M-B drives them in foreground (no tick deadline)
- M-C streams station transitions live (see MISSION.md for event format)

**No blockers on endpoint logic.** If you get stuck on the route/component side, file a request in coordination/requests/ and keep building. MAIN LANE has no database/deploy work left until after L0-B and L1-B land.

## Next Tick
1. Pull latest (M-phase endpoints pushed)
2. L0-A: Push stub (20 min for unblocker)
3. L1-A/L0-B/L1-B: Proceed in parallel (3-4 hours estimated)
4. M-D: Verify forecast on real workspace with founder's help
5. M-E: Audit all six acceptance criteria and final integration
