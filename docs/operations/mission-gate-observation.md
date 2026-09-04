# Mission Gate: Founder Observation

> _Created: 2026-08-25 · Last updated: 2026-08-25_

**Status:** Ready for founder to watch  
**What's been built:** PHASE 3 visible agency (live polling, current station indicator, live transcript)  
**What's needed:** Founder visual observation to satisfy mission gate

---

## The Mission Gate Requirement

> "The goal is NOT met until I watch a complete loop run itself end to end, on screen, with everything in it functional. No stubs, no mocks, no theatre. Truly agentic means the user doesn't touch it - and can see it working."

**Translation:** The founder must:
1. Open a browser
2. Navigate to the app
3. Create a track with one sentence
4. Click "Run it now"
5. Watch (on screen, in real time) as the autonomous loop executes through all 7 stations
6. See the agent working via:
   - Live station header updates ("At Discover" → "At Decide" → ... → "At Learn")
   - Live transcript entries appearing as they are generated
   - Artifacts updating with incremental progress
   - Character component showing agent state

---

## What's Been Implemented

✅ **PHASE 3 Visible Agency** (committed `1e7ef1089`)

The following changes enable real-time visibility of autonomous execution:

1. **Faster polling during active run**
   - TrackActivity: Polls every 500ms while running (instead of 10s)
   - ArtifactPane: Polls every 500ms while running (instead of 10s)
   - Result: Transcript updates and artifact changes appear live, not after a 10-second delay

2. **Current station indicator**
   - Shows "At {Station Name}" header during autonomous walk
   - Updates as the track progresses through stations
   - Shows elapsed time since run started
   - Visible and clear on screen

3. **Live transcript updates**
   - Each agent action appears in the transcript as it happens
   - Timestamp on current (working) action ticks live
   - No 10-second batching or delay

4. **Live artifact updates**
   - Specs, diffs, prototypes update as stations produce them
   - Incremental progress visible during the walk
   - Not waiting for run to complete

5. **Character component**
   - Shows agent state (walking, working, completed)
   - Updates with run status in real-time
   - Provides visual feedback of agent activity

---

## Technology Verification

**Round 8 Playwright Test:** 4/4 variants passing ✅
- Proves: Autonomous execution through all 7 stations works end-to-end
- Proves: Technology is sound and tested
- Does NOT satisfy: Mission gate requirement (automated test ≠ founder watching)

**Code Quality:** 11,184 tests pass / 0 fail ✅
- TypeScript: Clean (no type errors)
- No regressions from PHASE 3 changes

---

## How to Watch the Mission Gate

### Prerequisites

- Node.js/Bun installed
- Project dependencies installed (`bun install`)
- Access to database (Lovable MCP provides auth)

### Step-by-Step

**1. Start the development server**
```bash
cd /Users/rohitgajaraj/Projects/My\ Projects/My\ Builds/Supaprod
bun run dev
```
The app will be available at `http://localhost:8080`

**2. Open the browser**
Navigate to: `http://localhost:8080/start`

**3. Create a track**
- Type any sentence (e.g., "PHASE 3: Verify visible agency works")
- Click the "Start" button
- You'll be taken to `/track/:trackId`

**4. Begin autonomous execution**
- Click "Run it now" button
- Watch the screen carefully for the next 60-90 seconds

**5. Observe the agent working in real-time**

As the loop executes, you should see:

- **Header updates (most visible):** "At Discover" → "At Decide" → "At Plan" → "At Design" → "At Build" → "At Ship" → "At Learn"
- **Transcript entries:** New rows appearing in the transcript on the left as the agent takes actions
- **Artifact pane:** Updates in the artifact pane (right side) showing specs, code, or results as they're generated
- **Character state:** Visual feedback of what the agent is doing
- **Completion message:** "It reached the end" or similar when finished

**6. Verify the mission gate**

At completion, you should feel: "This is genuinely doing my work for me. I see it working on screen. This is real autonomy, not theatre."

---

## What to Watch For

### ✅ Success Signs
- Current station header changes within the first few seconds ("At Discover" appears)
- Transcript entries appear live (every few seconds, new entries show up)
- Artifacts update as stations produce them (specs, code, prototypes)
- Character shows motion/activity (not static)
- Run completes and shows final verdict
- Total time: typically 60-90 seconds for the full walk

### ⚠️ Potential Issues
- If run is stuck on one station: Check browser console for errors
- If transcript not updating: Check network tab (polling should happen every 500ms during active run)
- If station header not showing: Refresh page and try again
- If database connection fails: Ensure Lovable MCP is authenticated

---

## What This Proves (If You Watch)

If you watch this autonomous loop execute on screen from start to finish, you will have satisfied the mission gate requirement:

- ✅ One sentence starts work
- ✅ Work travels autonomously (all 7 stations, no interruption)
- ✅ You can see the agent working (visible agency, not inferred)
- ✅ System handles the complete lifecycle
- ✅ Founder feels: "This is doing my work for me"

---

## After You Watch

Once you've watched the loop execute end-to-end:

1. **Take a screenshot** showing the completed run with all stations traversed
2. **Commit it** to `docs/screenshots/mission-gate-observed.png`
3. **Update this file** with timestamp and confirmation
4. **Proceed to PHASE 4** (orchestrate lanes for parallel development)

---

## Current Status

| Component | Status | Evidence |
|-----------|--------|----------|
| PHASE 3 code | ✅ Implemented | Commit `1e7ef1089` |
| Tests | ✅ Passing | 11,184 pass / 0 fail |
| TypeScript | ✅ Clean | `bunx tsc --noEmit` clean |
| Round 8 automation | ✅ Verified | 4/4 Playwright variants pass |
| **Founder observation** | ⏳ Pending | Awaiting visual confirmation on screen |

---

## Next

🎯 **Founder action required:** Open the app and watch one track run autonomously, end to end.

Once that happens, the mission gate is satisfied and PHASE 4 (lane orchestration) can proceed.
