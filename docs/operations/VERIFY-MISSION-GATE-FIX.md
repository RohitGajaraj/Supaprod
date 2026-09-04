# Verifying Mission Gate Fix (2026-08-26)

> _Created: 2026-08-25 · Last updated: 2026-08-25_

**Change:** `signals.log` mode changed from "confirm" to "auto"  
**Date:** 2026-08-26  
**Commit:** See AUDIT.md for link  
**Goal:** Verify that autonomous tracks can now progress past the sense station

---

## Test Plan: End-to-End Autonomous Loop

### Prerequisites
- [ ] Deploy latest code with signals.log fix
- [ ] Dev server running: `bun run dev`
- [ ] Access to `/start` page at http://localhost:8080/start

### Scenario 1: Watch Auto-Driven Track (Recommended - 5-10 min)

**Setup:**
1. Test track d1168015 (created earlier) is ready in Helio Labs workspace
2. Cron will drive it on the next tick (runs every few minutes)

**Steps:**
1. Query database for test track status:
   ```sql
   SELECT id, station, status, driven_at, attempts
   FROM spine_tracks 
   WHERE id = 'd1168015-05fb-4d6e-82b2-d80bdf7f5ff8';
   ```

2. Wait for track-tick to run (up to 5 minutes)

3. Monitor progress:
   ```sql
   -- Should show signals being filed by sense agents
   SELECT COUNT(*) as signal_count 
   FROM spine_track_members 
   WHERE track_id = 'd1168015-05fb-4d6e-82b2-d80bdf7f5ff8'
   AND artifact_kind = 'signal';
   
   -- Should show agent runs for sense station
   SELECT agent_slug, status, COUNT(*) 
   FROM agent_runs 
   WHERE track_id = 'd1168015-05fb-4d6e-82b2-d80bdf7f5ff8'
   GROUP BY agent_slug, status;
   ```

4. Expected progression:
   - Sense: discovery-scout and researcher file signals (signals.log calls now succeed)
   - After signals filed: driver advances to Decide station
   - Decide: strategist calls decision.record (queues for approval if needed)
   - If no gated tools block: track progresses through Define → Design → Build
   - Build→Ship: requires human approval at merge gate (expected)
   - Ship→Learn: automatic after merge completes

**Success criteria:**
- Track moves from sense to decide station
- Signals are filed (spine_track_members shows artifact_kind='signal')
- Agent runs complete without blocking on signals.log

---

### Scenario 2: Manual Browser Test (Alternative - 10-15 min)

**Setup:**
1. Dev server running
2. Navigate to http://localhost:8080/start

**Steps:**
1. Type a test sentence (e.g., "Improve user onboarding flow")
2. Click "Start" button to create track
3. Click "Run it now" button
4. Observe for 2-5 minutes:
   - Station header should change: "At Discover" → "At Decide"
   - Transcript should show agent messages
   - Character should show activity state
   - Artifacts should appear in the pane

**Success criteria:**
- Station header updates to at least "At Decide"
- Live transcript shows agent work
- No visible error messages about signals.log approval
- UI remains responsive during run

---

### Scenario 3: Query-Based Verification (Quickest - 2 min)

**Steps:**
1. Create new track or use existing test track
2. Run SQL query:
   ```sql
   SELECT 
     id,
     station,
     status,
     last_hold,
     (SELECT COUNT(*) FROM spine_track_members 
      WHERE track_id = spine_tracks.id) as total_artifacts,
     (SELECT COUNT(*) FROM spine_track_members 
      WHERE track_id = spine_tracks.id 
      AND artifact_kind = 'signal') as signal_count,
     (SELECT COUNT(*) FROM agent_runs
      WHERE track_id = spine_tracks.id
      AND status = 'completed') as completed_runs
   FROM spine_tracks
   WHERE id = '[test-track-id]';
   ```

3. Check results:
   - `station`: Should be >= 'decide' (not stuck at 'sense')
   - `signal_count`: Should be > 0 (signals were filed)
   - `total_artifacts`: Should be > 0 (work was completed)
   - `last_hold`: Should be NULL or a legitimate hold (not 'produced-nothing')

**Success criteria:**
- `signal_count > 0` proves sense agents filed signals via signals.log
- `station >= 'decide'` proves driver advanced past sense
- No "produced-nothing" hold at sense

---

## Expected Behaviors After Fix

### ✅ Signals.log now works autonomously
- Agents call it without waiting for approval
- Signals are filed immediately
- Sense station completes and artifacts are recorded

### ⏳ Possible gates further down the pipeline
- `decision.record` still requires "confirm" (human approval) - expected
- `design.draft` still requires "confirm" - expected
- These gates are intentional (represent actual judgments)
- Track will queue for approval at these points, not stall

### ❌ If sense station STILL doesn't progress
Check:
1. Is fix deployed? (verify signals.log is mode="auto" in live code)
2. Are there other gating tools we missed? (check agent_approvals table)
3. Is there a hold preventing the track from being driven? (check spine_tracks.last_hold)
4. Are agents crashing? (check agent_runs.status for errors)

---

## Rollback Plan

If the fix causes issues:
1. Revert commit: `git revert [signals.log-fix-commit]`
2. Redeploy
3. Investigation: Check agent_runs logs for why auto-mode is failing

---

## Success Outcome

Once verified:
1. Founder can watch end-to-end autonomous loop on `/start`
2. Mission gate requirement satisfied: "watch a complete loop run itself end to end, on screen"
3. Proceed to PHASE 2 (PRODUCT-TRUTH.md) and beyond

---

**Owner:** Claude Code  
**Verification method:** Pick Scenario 1 (auto-driven, no manual work) or Scenario 3 (quickest query check)  
**Expected time to verify:** 5-15 minutes
