# NEXT STEPS — Credential Retrieval to Mission Gate Completion

> _Created: 2026-08-26 · Last updated: 2026-08-26_

**Blocker:** SUPABASE_SERVICE_ROLE_KEY missing (see BLOCKER-SUPABASE-CREDENTIALS-2026-08-27.md)

**Timeline once credential is provided:** ~30 minutes to mission gate completion

---

## Step 1: Retrieve Credential (User Action)

**Location:** Supabase dashboard → Project Settings → API  
**Key needed:** `service_role` (NOT `anon`)  
**Format:** Starts with `eyJ...` (JWT-like token)

After copying, share the key with Claude Code. (Note: This is a privileged credential, never commit it to git)

---

## Step 2: Add Credential and Re-Run Tests (Claude Code)

Once credential is provided:

```bash
# 1. Add to local .env
echo 'SUPABASE_SERVICE_ROLE_KEY="<paste-credential-here>"' >> .env

# 2. Start dev server to verify locally
bun run dev

# 3. Navigate to http://localhost:8080/start
# 4. Create a test track and click "Run it now"
# 5. Should see progression past Discover (look for Decide entry in ~40s)

# 6. Kill dev server (CTRL+C)

# 7. Run E2E test against local instance
PHASE3_PRESS=yes timeout 300 bunx playwright test e2e/phase-3-visible-agency.spec.ts

# Expected: Test logs should show progression through stations
# Current (broken): Timeout at Discover
# After fix: Should see [Discover → Decide → Plan → Design → Build → Ship → Learn]
```

---

## Step 3: Add to Lovable Deployment

Once local test passes:

1. **Access Lovable Cloud:** https://lovable.dev/dashboard/projects
2. **Select supaprod preview:** id-preview--371dd588-1b70-4629-9bb5-9f003f3af373
3. **Add environment variable:**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `<same-credential-as-step-2>`
4. **Save and wait for redeploy** (typically 2-5 minutes)
5. **Verify deployment:** Check that Lovable shows "Deployment Complete"

---

## Step 4: Acceptance Test (Full 7-Station Loop)

After Lovable deployment completes:

```bash
# Run E2E test against Lovable preview URL
PHASE3_PRESS=yes timeout 300 bunx playwright test e2e/phase-3-visible-agency.spec.ts

# Should log something like:
# ════════════════════════════════════════════════════════
# 🔷 PHASE 3 VISIBLE AGENCY TEST
# Goal: Founder watches autonomous loop with real-time visibility
# ════════════════════════════════════════════════════════
# 
# 📍 Step 1: Navigate to /start
#    ✓ Page loaded
# 
# 📍 Step 2: Submit test sentence
#    ✓ Typed: "PHASE 3: Verify visible agency works"
# 
# 📍 Step 3: Create track
#    ✓ Track created: <UUID>
# 
# 📍 Step 4: Start autonomous run
#    ✓ Clicked 'Run it now'
# 
# 📍 Step 5: Monitor real-time updates
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
#   [3s] 🔷 Entered station: Discover
#   [18s] 📝 Transcript entries: 2 (live update visible)
#   [42s] 🔷 Entered station: Decide
#   [65s] 📝 Transcript entries: 5
#   [85s] 🔷 Entered station: Plan
#  [120s] 🔷 Entered station: Design
#  [155s] 🔷 Entered station: Build
#  [190s] 🔷 Entered station: Ship
#  [220s] 🔷 Entered station: Learn
# 
# Expected assertions to pass:
# ✓ expect(stationsObserved.length).toBeGreaterThan(2)
# ✓ expect(transcriptEntriesMax).toBeGreaterThan(0)
```

---

## Step 5: Verify Acceptance Query

After test passes:

```sql
-- This should return > 0 rows (it currently returns 0)
SELECT id, entry_station, station, status, created_at 
FROM spine_tracks 
WHERE entry_station='sense' 
  AND station='learn' 
  AND waived='[]'
ORDER BY created_at DESC 
LIMIT 1;

-- Expected result:
-- | id                                   | entry_station | station | status    | created_at          |
-- |--------------------------------------|---------------|---------|-----------|---------------------|
-- | <track-uuid-from-e2e-test>           | sense         | learn   | completed | 2026-08-27 XX:XX:XX |
```

If this query returns > 0, **MISSION GATE IS MET** ✅

---

## Step 6: Document Proof

Create `docs/operations/FIRST-FINISH-PROOF.md`:

```markdown
# MISSION GATE SATISFIED — 2026-08-27

## Proof

**Track ID:** <track-uuid-from-sql-above>  
**Test:** PHASE 3 Visible Agency E2E Test  
**Evidence:**

1. **SQL Query Result:**
```sql
SELECT id, entry_station, station, status, created_at 
FROM spine_tracks 
WHERE id = '<track-uuid>';

-- Result: track at station='learn', status='completed'
```

2. **E2E Test Output:**
```
[timestamp] 🔷 Entered station: Learn
```

3. **Screenshot:** [Upload screenshot showing Learn station on screen]

4. **Acceptance Criteria Met:**
- ✅ Entered at sense (via /start)
- ✅ Completed all seven stations autonomously
- ✅ Founder watched on screen (via E2E test)
- ✅ No human intervention mid-run (driven entirely by sweep)
- ✅ Visible, not inferred (station headers shown, transcript updated in real-time)
```

---

## What This Unblocks

Once MISSION GATE is satisfied:

1. **PHASE 3 — Visible Agency**: Build the UI components that show agent work
   - Run timeline (when did each station start/end)
   - Agent presence card (Claude is at Design, working on X)
   - Decision cards (forecast vs outcome)
   - Steer/undo controls

2. **PHASE 4 — Orchestrate Lanes**: Set up 2+ queued items per lane
   - S1: Run timeline and presence UI components
   - S2: Visible hold reasons and retry logic
   - S3: Settings for visibility preferences
   - S4: Acceptance tests for all visible surfaces

3. **Deploy three fixes** (F-72, fold fix, F-73) now that testing works

4. **Scale to production**: Use real customer signals from Canny webhook

---

## Timeline

| Step | Owner | Time | Status |
|------|-------|------|--------|
| Retrieve credential | User | 5 min | ⏳ Awaiting |
| Add to .env & test locally | S0 | 5 min | ⏳ Blocked |
| Add to Lovable & redeploy | S0 | 10 min | ⏳ Blocked |
| Run acceptance E2E test | S0 | 5 min | ⏳ Blocked |
| Verify SQL query | S0 | 2 min | ⏳ Blocked |
| Document proof | S0 | 3 min | ⏳ Blocked |
| **TOTAL** | — | **30 min** | — |

**Expected completion:** 30 minutes after credential is provided

---

## If Tests Still Fail After Credential is Added

If E2E test still times out at Discover:

1. **Check agent_runs for errors:**
```sql
SELECT id, track_id, status, completed_at, error_message 
FROM agent_runs 
WHERE track_id = '<test-track-id>'
ORDER BY created_at DESC 
LIMIT 10;
```

2. **Check if signals were filed:**
```sql
SELECT COUNT(*), artifact_kind 
FROM spine_track_members 
WHERE track_id = '<test-track-id>'
GROUP BY artifact_kind;
```

3. **If agents still fail:** The credential may be:
   - Invalid (check Supabase console for revocation)
   - Expired
   - Not the correct service_role key
   - Wrong format

4. **If signals are filed but track doesn't advance:** There's a secondary blocker in the station handoff logic (documented but deferred: F-77, F-78)

---

**Owner:** S0 (Claude Code)  
**Blocker:** Credential retrieval (user action)  
**Next:** Execute steps above after credential is provided
