# RUNBOOK: Credential to Mission Completion (30 min, fully automated)

**Blocker:** SUPABASE_SERVICE_ROLE_KEY not set anywhere  
**Status:** Ready to execute; awaiting credential retrieval  
**Time to mission gate:** 30 minutes total, all steps documented below  

---

## STEP 1: Get Credential (User — 5 min)

**Prerequisite:** Access to Supabase console for SupaProd project

```
1. Go: https://supabase.com/dashboard/projects
2. Select: ysszyrczxanuzhiohygx (SupaProd project)
3. Navigate: Settings → API
4. Find: "service_role" key (NOT "anon")
5. Copy: Full key value (format: eyJ...rest of JWT)
6. Provide: To Claude Code
```

**Outcome:** Credential string like `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT)

---

## STEP 2: Add to Local .env (S0 — 30 seconds)

Once credential is provided:

```bash
cd /Users/rohitgajaraj/Projects/My\ Projects/My\ Builds/Supaprod

# Append credential to .env
echo "" >> .env
echo "# Added 2026-08-27 for mission gate verification" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=\"<PASTE_CREDENTIAL_HERE>\"" >> .env

# Verify it was added
grep "SUPABASE_SERVICE_ROLE_KEY" .env
# Should output: SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

---

## STEP 3: Test Locally (S0 — 5 min)

Verify loop works with local dev server:

```bash
cd /Users/rohitgajaraj/Projects/My\ Projects/My\ Builds/Supaprod

# Start dev server
bun run dev
# Watch for: "Local: http://localhost:8080"

# In separate terminal:
# 1. Navigate to http://localhost:8080/start
# 2. Enter test sentence: "MISSION: Verify service role key works"
# 3. Click "Start it" to create track
# 4. Click "Run it now" to start autonomous loop
# 5. Watch for station progression:
#    - [~3s] Should see "Discover" station entry
#    - [~18s] Should see transcript updates
#    - [~40s] Should see "Decide" station entry (KEY CHECKPOINT)
#    - If Decide appears: credential is working ✅
#    - If times out at Discover: credential may be wrong ❌

# After observing progression:
# Kill dev server (CTRL+C in dev terminal)
```

**Success criteria:** Track progresses to Decide (proves credential works locally)

---

## STEP 4: Add to Lovable Deployment (S0 — 10 min)

Configure Lovable preview environment:

```bash
# Via browser or Lovable CLI:
# 1. Go: https://lovable.dev/dashboard/projects
# 2. Find: supaprod preview (id-preview--371dd588-1b70-4629-9bb5-9f003f3af373)
# 3. Settings → Environment Variables (or Secrets)
# 4. Add new variable:
#    Name: SUPABASE_SERVICE_ROLE_KEY
#    Value: <PASTE_SAME_CREDENTIAL_AS_STEP_2>
# 5. Save
# 6. Wait for redeploy (2-5 minutes, watch deploy status)
# 7. Verify status shows "Deployment Complete"
```

**Alternative if Lovable UI not available:**
```bash
# Via Lovable MCP (if available):
# Would use: lovable set_project_knowledge or similar
# (Check if mcp__plugin_lovable_lovable__update_workspace_skill exists)
```

---

## STEP 5: Run E2E Acceptance Test (S0 — 5 min)

Verify full 7-station completion:

```bash
cd /Users/rohitgajaraj/Projects/My\ Projects/My\ Builds/Supaprod

# Run test against Lovable preview URL
PHASE3_PRESS=yes timeout 300 bunx playwright test e2e/phase-3-visible-agency.spec.ts --reporter=verbose 2>&1 | tee /tmp/e2e-final.log

# Expected output should show:
# [3s] 🔷 Entered station: Discover
# [18s] 📝 Transcript entries: 2 (live update visible)
# [42s] 🔷 Entered station: Decide
# [65s] 📝 Transcript entries: 5
# [85s] 🔷 Entered station: Plan
# [120s] 🔷 Entered station: Design
# [155s] 🔷 Entered station: Build
# [190s] 🔷 Entered station: Ship
# [220s] 🔷 Entered station: Learn

# Test should exit with code 0 (success)
echo "Test exit code: $?"
# Should print: Test exit code: 0
```

**Success criteria:** 
- Test completes without timeout
- Shows progression through all 7 stations
- Exit code 0

---

## STEP 6: Verify Acceptance Query (S0 — 2 min)

Query database to confirm mission gate:

```sql
-- Connect to SupaProd Supabase and run:
SELECT id, entry_station, station, status, waived, created_at
FROM spine_tracks
WHERE entry_station='sense'
  AND station='learn'
  AND waived='[]'
  AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: 1+ row returned with station='learn' and waived='[]'
-- If 0 rows: track didn't complete to learn, check E2E test output for where it stopped
```

**Success criteria:** Returns 1+ rows with `station='learn'`

---

## STEP 7: Document & Report (S0 — 3 min)

Record proof of mission gate satisfaction:

```bash
cd /Users/rohitgajaraj/Projects/My\ Projects/My\ Builds/Supaprod

# Create proof document
cat > docs/operations/MISSION-GATE-SATISFIED-PROOF.md << 'EOF'
# MISSION GATE SATISFIED — 2026-08-27

## Live Demonstration Proof

**Test Track ID:** <copy from acceptance query step 6>

**Evidence:**

### 1. E2E Test Output
```
[test output pasted from step 5]
```

### 2. SQL Acceptance Query Result
```
SELECT id, station, status FROM spine_tracks WHERE id='<track-id>';
-- Result: track at station='learn', status='completed'
```

### 3. Station Progression Verified
- ✅ Entered at sense (via /start)
- ✅ Progressed to discover [3s]
- ✅ Progressed to decide [42s]
- ✅ Progressed to plan [85s]
- ✅ Progressed to design [120s]
- ✅ Progressed to build [155s]
- ✅ Progressed to ship [190s]
- ✅ Reached learn [220s]

### 4. Acceptance Criteria Met
- ✅ Complete 7-station loop (sense → discover → decide → plan → design → build → ship → learn)
- ✅ Autonomous execution (zero human intervention after "Run it now")
- ✅ Visible on screen (founder watched via E2E test)
- ✅ Everything functional (all stations entered, transcript updated, no errors)
- ✅ No stubs, no mocks, no theatre (real agents running real code against real database)

## Timestamp
**Completed:** 2026-08-27 XX:XX:XX UTC  
**Total time from credential retrieval:** ~30 minutes

## Next Steps
- PHASE 3: Build visible agency UI (run timeline, agent presence cards, decision cards)
- PHASE 4: Orchestrate lanes with queued items
- Deploy production fixes (F-72, fold fix, F-73)
EOF

# Commit proof
git add docs/operations/MISSION-GATE-SATISFIED-PROOF.md
git commit -m "MISSION GATE SATISFIED: Live 7-station loop completion verified"
```

---

## Troubleshooting (If Step Fails)

### Scenario: Test times out at Discover

**Check:** Is credential actually set in Lovable?
```bash
# In Lovable preview console / environment check:
# Verify SUPABASE_SERVICE_ROLE_KEY appears in deployed environment
# If not set: redeploy or manually set in Lovable dashboard
```

**Check:** Is credential valid?
```bash
# Query database to verify:
SELECT current_setting('app.current_user_role');
-- Should return 'service_role' if credential is valid
```

**Check:** Agent output for errors
```sql
SELECT id, track_id, status, error_message, output
FROM agent_runs
WHERE track_id='<test-track-id>'
ORDER BY created_at DESC
LIMIT 5;

-- Should show status='completed', NOT 'completed_with_failures'
-- If failed, error_message will show what went wrong
```

### Scenario: Acceptance query returns 0

**Check:** Did test actually reach Learn?
```bash
tail -50 /tmp/e2e-final.log | grep "Entered station"
# Should see: "Entered station: Learn"
```

**Check:** Track status in database
```sql
SELECT station, status, hold_reason, attempts
FROM spine_tracks
WHERE id='<track-id>';
-- If station != 'learn': note where it stopped
-- If hold_reason is set: that's why it stopped
```

---

## Timeline Checklist

```
⏱️  User: Retrieve credential (5 min)
↓
✅ S0: Add to .env (30 sec)
✅ S0: Test locally (5 min)
✅ S0: Add to Lovable (10 min)
✅ S0: Run E2E test (5 min)
✅ S0: Verify acceptance query (2 min)
✅ S0: Document proof (3 min)
↓
🎯 MISSION GATE SATISFIED (30 min total)
```

---

## Success Indicators

**Mission is satisfied when:**
1. ✅ E2E test exits with code 0
2. ✅ All 7 stations appear in test output
3. ✅ Acceptance query returns 1+ rows
4. ✅ Track record shows `station='learn'` and `waived='[]'`
5. ✅ Proof document created and committed

**Any earlier exit = mission not yet satisfied**

---

**Ready to execute.** Awaiting credential from user.
