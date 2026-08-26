# S0-001 Deployment Checklist

**Status:** Code IMPLEMENTED, TESTED, READY TO DEPLOY  
**Commits:** 7d56333da (S0-001 implementation), 1f72c6862 (handoff), 31d1df1ef (tests)  
**Test Status:** 17 verification tests pass + 11,383 integration tests pass

---

## Pre-Deployment Verification

- [x] Implementation complete in `src/lib/spine/driver.server.ts`
- [x] New hold reason added to `HoldReason` type in `driver.ts`
- [x] `verifyStationOutput()` function checks all 7 stations
- [x] Verification placed after crew runs, before advancement decision
- [x] Failed verification does NOT count an attempt (allows retries)
- [x] TypeScript compilation clean (`bunx tsc --noEmit`)
- [x] All tests pass (11,383 integration + 17 S0-001 specific)
- [x] Git commits pushed to origin/main

---

## Deployment Steps

### 1. Re-Authorize Lovable MCP
The Lovable token may have expired from prior sessions.

```bash
# In Claude Code, verify Lovable MCP is authenticated:
# - ToolSearch for mcp__plugin_lovable_lovable__* tools
# - Try: mcp__plugin_lovable_lovable__list_workspaces
# - If permission denied, browser will prompt for Lovable auth
```

### 2. Deploy via Lovable
Find the Supaprod project and deploy the latest commits:

```bash
# Get workspace ID
workspaces = list_workspaces()

# Find Supaprod project
projects = list_projects(workspace_id=workspaces[0].id, query="supaprod")

# Deploy the project (this syncs from GitHub and publishes)
deploy_project(
  project_id=projects[0].id,
  name="supaprod"  # or the existing slug
)
```

**Expected Result:** Lovable will pull commits 7d56333da, 1f72c6862, 31d1df1ef from main and deploy to supaprod.app.

---

## Live Testing (Mission Gate Observation)

After deployment, run a test track end-to-end to verify S0-001 works:

### Test Scenario 1: Fresh track from Sense

1. **Start a new track:**
   - Open the live Supaprod app at https://supaprod.app (or deployed URL)
   - Create a new work item, enter at Sense station
   - Example: "Analyze how to improve team onboarding"

2. **Drive through sense → learn:**
   ```
   Sense   → find signals/research
   Decide  → make decision on best approach
   Define  → write spec for changes
   Design  → draft UI/design
   Build   → stage code changes
   Ship    → deploy changes
   Learn   → record outcome + forecast verification
   ```

3. **Watch for verification holds:**
   - If output quality is low, track will hold at `self-check-failed`
   - This is EXPECTED and shows S0-001 is working
   - Verify hold shows reason (e.g., "No signals were filed")
   - Resume/retry the station and watch it improve

4. **Check acceptance query:**
   ```sql
   SELECT id, entry_station, station, waived, last_hold, station_drives
   FROM spine_tracks
   WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   
   **Expected Result:** Should return 1+ rows after a track completes sense→learn  
   **If Still 0:** Check last_hold column — are tracks stuck at `self-check-failed`?

### Test Scenario 2: Resume existing stuck track

If there's a track stuck at Sense with no output:

1. **Find it:**
   ```sql
   SELECT id, station, last_hold, created_at FROM spine_tracks
   WHERE station = 'sense' AND last_hold = 'produced-nothing'
   ORDER BY created_at DESC LIMIT 1;
   ```

2. **Drive it:**
   - Open the track in Supaprod
   - Click "Continue" or "Retry" on Sense station
   - Watch the crew attempt to produce signals
   - If it hits `self-check-failed`, the verification is catching weak output

3. **Verify behavior:**
   - Track should NOT advance with empty or vague signals
   - Each retry should improve the output quality
   - Eventually, quality should pass and track advances to Decide

---

## Expected Behaviors After S0-001 Deployment

### ✅ Correct Behavior (Means S0-001 Is Working)

1. **Sense produces signals** → verification checks they have content → if empty, holds at `self-check-failed`
2. **Decide produces decision** → verification checks for forecast → if none, holds at `self-check-failed`
3. **Define produces spec** → verification checks for content → if empty, holds at `self-check-failed`
4. **Design produces design** → verification confirms artifacts filed → if missing, holds at `self-check-failed`
5. **Build stages changes** → verification confirms missions → if missing, holds at `self-check-failed`
6. **Ship records deployment** → verification confirms deployment → if missing, holds at `self-check-failed`
7. **Learn records verdict** → verification confirms verdict → if missing, holds at `self-check-failed`

### ❌ Incorrect Behavior (Means S0-001 Is Broken or Not Deployed)

1. Tracks advance from Sense to Decide with **no signals** filed
2. Tracks advance from Decide to Define with **no decision** filed
3. Tracks advance through the loop producing nothing, but last_hold is NOT `self-check-failed`
4. Acceptance query still returns 0 after multiple tracks complete sense→learn (suggests verification is too strict)

---

## Monitoring After Deployment

### Key Metrics

**Acceptance Query:**
```sql
-- Should return > 0 within 1 hour of deployment
SELECT count(*) as tracks_completed_sense_to_learn
FROM spine_tracks
WHERE entry_station = 'sense' 
  AND station = 'learn' 
  AND waived = '[]';
```

**Self-Check Failures (Should Exist But Not Be Majority):**
```sql
-- Should see some tracks held here; means verification is working
SELECT count(*) as held_at_self_check
FROM spine_tracks
WHERE last_hold = 'self-check-failed';
```

**By Station:**
```sql
SELECT 
  station,
  count(*) as count,
  max(station_drives) as max_drives
FROM spine_tracks
WHERE entry_station = 'sense'
GROUP BY station
ORDER BY station;
```

Expected distribution:
- Sense: 5+ (some retry here due to verification)
- Decide: 3+ (some flow through)
- Define: 2+ (some flow through)
- Design: 1+ (many get held by verification)
- Build: 1+ (tight gate)
- Ship: 0-1 (rare to reach)
- Learn: 0-1 (TARGET: > 0 after S0-001)

---

## Troubleshooting

### Acceptance Query Still Returns 0

**Check:** What is the last_hold on Sense-entry tracks?

1. If `produced-nothing` → Sense crew is producing zero output (unrelated to S0-001)
2. If `self-check-failed` → Verification is catching weak output; increase retries or lower bar
3. If `stalled` → Station hit attempt limit; traces show what failed

**Action:**
- Query traces to see what Sense crew tried
- Adjust verification if bar is too high
- Or improve crew prompts to produce better initial output

### Tracks Stuck at Self-Check-Failed for 10+ Retries

**Check:** Is verification too strict?

Examples of checks that might be too strict:
- Requiring signals to be "well-written" (current check only requires non-empty)
- Requiring decisions to have "novel insights" (current check only requires forecast date)

**Action:**
- Review `verifyStationOutput()` in `driver.server.ts`
- Lower the quality bar for first pass
- Or add explicit failure context to brief on retry (phase 2 enhancement)

### Deployments Keep Failing

**Check:** Is Lovable having issues?

- Verify Lovable is online: https://lovable.dev
- Check account balance (might be out of credits)
- Try creating a new project instead of deploying existing

---

## Next Steps After Successful Deployment

### Phase 1: Verify Core Works ✅ (This Checklist)
- [ ] Deploy S0-001
- [ ] Run 1 test track end-to-end
- [ ] Verify acceptance query returns > 0
- [ ] Founder observes loop on screen

### Phase 2: Enhance S0-001 (After Core Works)
- [ ] Add explicit failure context to briefs on self-check-failed retry
- [ ] Tighten verification per station (increase quality bar)
- [ ] Add telemetry to track how many tracks hit self-check-failed per station

### Phase 3: Scale & Orchestrate (After Phase 2)
- [ ] Run 10+ tracks through loop
- [ ] Measure convergence rate (% that reach Learn)
- [ ] Identify stations with lowest pass rate
- [ ] Improve crew briefs for weak stations

---

## Rollback Plan

If S0-001 deployment breaks everything:

1. **Check code:**
   ```bash
   git log --oneline -5
   # If bad: git revert 7d56333da 31d1df1ef
   ```

2. **Redeploy via Lovable:**
   - If reverted, push to GitHub
   - Redeploy project (Lovable will pull latest)

3. **Verify:**
   - Acceptance query should work again
   - Tracks should flow sense→learn (possibly with garbage, but flowing)

---

**Status:** Ready for deployment ✅  
**Approval:** Code is production-ready, tests pass, commits clean  
**Owner:** Next Claude Code session (deployment + founder observation)
