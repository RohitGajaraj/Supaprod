# PHASE 3: VISIBLE AGENCY

> _Created: 2026-08-25 · Last updated: 2026-08-25_

**Building the live agent experience (like Claude-in-Chrome)**

---

## THE PROBLEM

User clicks "Run it now" → 30 seconds of waiting → results appear.

Result: Doesn't feel like an agent is working. Feels like a slow form.

**The founder's requirement (2026-08-01):**
> "If some agents are working, there should be some scope for showing visually that this agent is what, after this particular agent it switched to next agent, this is the outcome. Something like Claude Code or Copilot or Codex... so the user knows what is happening."

**What "Claude-in-Chrome" shows:**
- Live cursor position (agent is HERE)
- Real-time transcript (agent just DID this)
- Next action queued (agent will DO this)
- User can steer/undo

---

## THE MISSION GATE REQUIRES THIS

The founder's acceptance: "I watch a complete loop run itself end to end, on screen."

The word "watch" means: see it happening in real-time, not read results afterward.

Without PHASE 3, there's nothing to watch. The loop runs in the backend invisibly.

---

## WHAT VISIBLE AGENCY LOOKS LIKE

### The Screen Layout

**Left pane: Transcript (LIVE)**
- Header: "Walking: Started 10 seconds ago"
- Current activity: "🔷 Design: Agent is generating UI mockups..."
- History (reverse chronological):
  - ✓ Sense (10s ago) - Identified 4 themes
  - ✓ Decide (8s ago) - Forecast filed
  - → Define (in progress, 2s elapsed)
- Each line is clickable: clicking reveals the artifact (spec, diff, result)

**Right pane: Current Artifact + Active Step**
- Header: "Station: Define · Step 2/3 · Time: 2s"
- Countdown clock on this station (shows time left in deadline)
- Live artifact:
  - If at Sense: Shows clustered signals appearing in real-time
  - If at Define: Shows spec being written, line by line if possible
  - If at Design: Shows prototype appearing
  - If at Build: Shows diff being generated
  - If at Ship: Shows deploy status with each step (build → test → merge → deploy)
  - If at Learn: Shows outcome vs. forecast side-by-side

**Header bar:**
- Track title
- Current status: "Walking the route (13 legs, 9 left)"
- Stop button: "Stop after this leg"
- Pause button: "Pause and steer" (lets user override next action)

---

## COMPONENT BREAKDOWN

### 1. Live Transcript Panel (Left)

**Location:** `src/components/track/LiveTranscript.tsx` (new)

**Responsibilities:**
- Polls `track_activity` table every 500ms
- Shows current station and activity
- Shows history of all stations visited
- Clickable rows reveal artifacts
- Shows elapsed time per station
- Animated progress: activity appears as it happens, not all at once

**Data source:** `track_activity` table (already has agent, station, action, result columns)

**Key detail:** This is NOT a new table. `TrackActivity` component already exists and polls this data. PHASE 3 makes it live instead of a static list shown after completion.

### 2. Active Step Indicator (Right pane header)

**Location:** `src/components/track/ActiveStepIndicator.tsx` (new)

**Responsibilities:**
- Shows current station name (Discover / Plan / Design / Code / Ship / Learn)
- Shows step progress: "Step 2 of 5"
- Shows elapsed time with clock icon
- Shows approximate time remaining (if deadline is known)
- Animated state changes (colors change as stations progress)

**Data source:** `spine_tracks.station` + computed elapsed time

### 3. Live Artifact Display (Right pane body)

**Location:** Enhance existing artifact components with live updates

**For Sense:**
- Show signals appearing in real-time as they're found
- Cluster visualization updating live

**For Define:**
- Show spec text appearing line by line
- Show key sections (Goal, Non-goals, Success metrics) appearing as they're written

**For Design:**
- Show prototype frame updating live
- Show components appearing as they're added

**For Build:**
- Show diff being generated file by file
- Show syntax highlighting appear as text writes
- Show test results appearing in real-time

**For Ship:**
- Show deploy timeline: each step with its status
- Show: build → test → merge → deploy with ✓/✗ markers
- Show live logs if available

**For Learn:**
- Show forecast vs. outcome side-by-side
- Show confidence/calibration score
- Show key learnings extracted

### 4. Control Panel (Footer)

**Location:** Enhance existing `TrackRun` component

**Capabilities:**
- **"Walking the route"** button (disabled, shows it's in motion)
- **"Stop after this leg"** button (lets user halt mid-route)
- **"Pause and steer"** button (pauses, lets user override next action)
  - Shows: "What should happen next?"
  - Options: Continue with agent decision / Skip this station / Pick different path
  - User's choice is recorded as a steering event

### 5. Polling & Real-Time Updates

**Strategy:**
- Poll `track_activity` every 500ms (same as current)
- Poll `spine_tracks` for status changes every 1s
- Use React Query's `staleTime: 500` for aggressive refetch
- Show loading state only for artifacts being generated (not transcript)

**No server-sent events or WebSockets needed** — polling is sufficient for this latency.

---

## WHAT GETS MOUNTED WHERE

**Current layout issue:** `TrackActivity` and `TrackChain` exist but are mounted AFTER the run completes.

**PHASE 3 fix:**
1. Mount `TrackActivity` (renamed to `LiveTranscript`) DURING the run
2. Mount `ActiveStepIndicator` in the right pane header
3. Enhance artifact pane to show live updates, not static snapshots
4. Keep the "Run it now" control where it is (top of left pane)

**Result:** User sees the agent working from the moment "Run it now" is clicked.

---

## ACCEPTANCE CRITERIA

PHASE 3 is complete when:

1. ✅ User clicks "Run it now"
2. ✅ Transcript shows "Walking the route..." immediately
3. ✅ Current station appears in header with live clock
4. ✅ Artifact pane shows live updates (not blank waiting for completion)
5. ✅ User can see each station's progress in the transcript
6. ✅ When a station completes, the next one starts immediately (visible transition)
7. ✅ User can click "Stop after this leg" and the walk stops
8. ✅ After walk completes, results persist (can be reviewed)

**The mission gate test:**
- Founder opens app
- Founder types one sentence
- Founder clicks "Run it now"
- Founder WATCHES (real-time) as all 7 stations complete
- Founder feels: "I can see the agent working, this is amazing"

---

## IMPLEMENTATION NOTES

### Why Components Already Exist

`TrackChain` (header: "THE DOOR THAT WAS MISSING") and `TrackActivity` were built 2026-08-01 for exactly this purpose. They are unmounted because they were built for a static "after run" view, not a live view.

PHASE 3 is NOT building new components. It's:
1. Refactoring these to work live (poll during run, not after)
2. Enhancing artifact components to show incremental updates
3. Adding visual feedback (animations, clocks, progress indicators)
4. Wiring up the polling to refresh live while run is in-flight

### Performance Considerations

- 500ms poll rate on two tables for one running track = minimal DB load
- React Query caching prevents redundant fetches
- Artifact updates are CSS/DOM changes, not full re-renders

### Accessibility

- Live region announcements: "Agent moved to Design station, generating mockups"
- Timestamp on each transcript entry (screen readers need to know when updates happened)
- Keyboard navigation: tab through transcript entries, arrow keys to navigate timeline

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| User expects "steering" but not implemented | Clear messaging: "Stop after this leg" (current) vs "Pause and steer" (future) |
| Live artifact display shows incomplete state | Always show "in progress" indicator; final version appears when complete |
| Polling lag creates stale appearance | 500ms is invisible to human perception; acceptable |
| User confused by technical jargon in transcript | Map technical terms to user language (Discover/Plan/Design/Code not sense/define/design) |

---

## BLOCKING: What PHASE 3 Needs From Earlier Phases

- ✅ **PHASE 1 (Ground Truth):** Complete - defines what exists and what's missing
- ✅ **PHASE 2 (Product Truth):** Complete - explains why visible agency matters
- ✅ **Active tracking:** `driveTrackNow()` must write to `track_activity` as it works (already does)
- ✅ **Live artifact data:** Each station must write to artifact tables live (already does)

PHASE 3 has no blockers. It can start immediately.

---

## EFFORT ESTIMATE

**If existing components are refactored (likely):** 2-3 days (Lane 0 work)

**If rebuilding from scratch (unlikely):** 5-7 days

**Critical path:**
1. Extract `TrackActivity` to work live (1 day)
2. Add `ActiveStepIndicator` component (0.5 day)
3. Enhance artifact pane for live updates (1.5 days)
4. Add "Pause and steer" (optional, Phase 3b): 1 day

---

## NEXT STEP

Once PHASE 3 is built and merged:

1. Founder opens the app
2. Types one sentence
3. WATCHES the agent work in real-time
4. Answers the mission gate question: "Is this doing my work for me?"

That's when PHASE 4 (orchestrate lanes) begins.

---

**Status:** PHASE 3 specification complete. Ready for implementation.
