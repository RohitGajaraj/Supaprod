# Deployment and Acceptance Test Procedure — 2026-08-27

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> **Status:** Three fixes on main, ready to deploy. Lovable MCP token expires periodically; requires re-auth before deploy.
> **Mission gate:** A track enters at sense, reaches learn, driven entirely by agents (sweep or foreground), watched on screen, returns verdict.

---

## Pre-Deployment Checklist

- [ ] **Lovable MCP re-authorized** - The Lovable plugin may show "requires re-authorization" on deploy_project calls
- [ ] **Current commit verified** - Latest is `143c7680e` (PHASE 3 prep commit from this session)
- [ ] **Test suite passing** - Run `bun test` (expect 11,500+ pass, 0 fail) before deploying
- [ ] **TypeScript clean** - Run `bunx tsc --noEmit` (expect exit 0)
- [ ] **Three fixes verified in code:**
  - [ ] F-72 fix: `nothing-to-hand-on` hold reason in `/build` station
  - [ ] Fold fix: `result.ids[0] ?? result.restatedOnto[0] ?? null` in registry
  - [ ] F-73 fix: `namesOwnArtifact` guard in `signals.log` tool

---

## Deployment Steps

### 1. Re-authorize Lovable MCP (if needed)

If you see "requires re-authorization" errors:
```bash
# This opens a browser flow to re-auth the Lovable plugin
# No CLI command — the IDE will prompt
```

### 2. Trigger Deployment

```bash
# Via Lovable MCP in Claude Code:
# Send: "Deploy main to production. Verify 143c7680e is the serving bundle."
```

### 3. Post-Deploy Verification (F-59 chunk-scan)

After deployment completes, verify the three fixes are live:

```sql
-- Marker 1: F-72 check (nothing-to-hand-on)
SELECT COUNT(*) FROM pg_enum WHERE enumname = 'holdReason' 
  AND enumlabel = 'nothing-to-hand-on';
-- Expected: 1

-- Marker 2: Fold fix check (restatedOnto in tool registry)
-- This is code-based; check the Lovable editor or:
SELECT pg_sleep(1); -- Wait for bundle to activate
-- Then test via API or watch logs for "restatedOnto" mentions

-- Marker 3: F-73 check (namesOwnArtifact guard)
-- Code-based; verify in signals.log tool implementation
```

**DO NOT trust `publish_status` responses.** Three deploys on 2026-08-25 reported "completed" while production served older bundles. Only the serving-bundle scan matters.

---

## Acceptance Test Procedure

### Phase 1: Setup (Fresh Track, One Sentence)

Create a track from real, concrete customer evidence:

```sql
-- Option A: From a known Canny signal (recommended)
INSERT INTO spine_tracks (
  user_id, workspace_id, title, origin, 
  entry_station, station, path, waived, 
  created_at
) VALUES (
  '22a73000-ec30-4014-8fa7-a60363241350',  -- founder's user_id
  '0b792d52-82e2-43e2-adc5-8a26e5c800b4',  -- live test workspace
  'Add dark mode and a system-preference theme',
  'Add dark mode and a system-preference theme, because a customer asked for it in Canny on 2026-07-09 and the product ships light only.',
  'sense', 'sense',
  '["sense","decide","define","design","build","ship","learn"]'::jsonb,
  '[]'::jsonb,
  now()
);
-- Returns: track_id (copy this)
```

**Why this track:**
- Real customer evidence (Canny signal from 2026-07-09)
- Concrete enough for Design to sketch, Learn to measure
- Does NOT depend on workspace telemetry
- Executable path (no external builders needed)

### Phase 2: Foreground Drive

The acceptance run MUST use foreground drive (not the 10-minute tick):

```bash
# In the running app:
# 1. Navigate to /track/{track_id} (replace with your track ID)
# 2. Character (Supa) should show at top, initially "out of touch"
# 3. Click "Run it now" button in footer
# 4. Watch stations advance — each should show 1-2 legs per ~50s window
# 5. Auto-continue should keep running (up to AUTO_MAX = 24 legs)
# 6. Never click "Run it again" — the auto-continue handles it
```

**Critical observations:**
- Character state transitions: out-of-touch → thinking → working → asking (if gate) → working → done
- TrackActivity (left pane) updates in real-time with each agent action
- Each station should produce artifacts (right pane updates)
- Hold reasons appear if a station can't complete (retry control shows)

### Phase 3: Monitor Each Station

Expected behavior per station:

| Station | What to watch | Success indicator |
| --- | --- | --- |
| **Sense** | Incoming signals analyzed and clustered | 1+ themes created, ICE-ranked |
| **Decide** | Decision recorded with forecast | Forecast claim visible in artifact pane |
| **Define** | Spec written | Spec body readable, links to decision |
| **Design** | Prototype created | Clickable prototype in artifact pane |
| **Build** | PR opened (or changes staged) | Build report shows commits/PR link |
| **Ship** | Deployment gate (human-only unless Builder mode) | Shows as completed if your system allows auto-ship, or paused at approval |
| **Learn** | Verdict graded against forecast | Forecast vs. actual showing; calibration recorded |

**If a station holds:**
1. Read the `hold_reason` displayed below the run
2. For retryable holds (not approval gates), click "Run it again"
3. For approval gates, approve in the linked PR or merge request
4. Then resume with "Run it again"

### Phase 4: Verify Acceptance Query

While watching the run progress:

```sql
-- Poll this query every ~10 seconds
SELECT id, station, last_hold, attempts, 
       driven_via, last_driven_via,
       created_at, updated_at
FROM spine_tracks
WHERE id = '{your_track_id}';

-- Final query (when station shows 'learn' on screen):
SELECT id, entry_station, station, waived, 
       created_at, updated_at
FROM spine_tracks
WHERE entry_station = 'sense' 
  AND station = 'learn' 
  AND waived = '[]';
-- Expected: 1 row (your track_id)
```

### Phase 5: Capture Evidence

Record the proof (required by R-18 clause 6):

1. **SQL Query Result:**
   ```sql
   SELECT id, entry_station, station, waived, created_at
   FROM spine_tracks
   WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]';
   ```

2. **Track ID:** Write it down (shown in URL and SQL result)

3. **Screenshot:** Of `/track/{track_id}` showing:
   - Character at "done" state
   - TrackChain showing all seven stations as completed
   - TrackActivity showing final verdict
   - Artifact pane showing learn's verdict card (forecast vs actual)

4. **Recording location:** `docs/acceptance/FIRST-FINISH-PROOF-2026-08-27.md`

---

## Troubleshooting

### Track stuck at Sense with `produced-nothing`

**Cause:** F-19 (RAG index empty) or F-20 (sweep throughput collapse)

**Fix:** Ensure workplace has real signals:
```sql
SELECT COUNT(*) FROM agent_signals
WHERE workspace_id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4'
  AND source_kind != 'agent'  -- Count non-exhaust signals
  AND created_at > now() - interval '7 days';
-- Should be > 5. If 0 or mostly 'agent' signals, the workspace is deaf.
```

### Track stuck at Decide or later with `out-of-time`

**Cause:** Multi-seat crew split across ticks (Wall 2 from EXPERIMENT)

**Current status:** Fixed in code by `didStationProduce` (commit 5d0780bdb), should be deployed.

**Test:** The fix should NOT appear in your acceptance run because you're using foreground drive (fresh clock per seat). If it still happens:
```sql
SELECT agent_slug, status, created_at FROM agent_runs
WHERE track_id = '{your_track_id}' AND station = 'decide'
ORDER BY created_at;
-- If strategist and critic are in separate ticks, the fix may not be deployed.
```

### Approval gate blocking at Build or Ship

**Expected:** Build has human approval gate (test environment may allow auto-merge)

**If stuck:** The acceptance run MUST NOT pause at an approval unless `release.publish` is involved (irreversible act). Approve in the linked PR/MR, then resume the run.

### Character never leaves "out of touch"

**Cause:** TrackRun not mounted or character not receiving driver output

**Fix:** Reload `/track/{track_id}`; check browser console for errors

### Verdict doesn't appear at Learn

**Cause:** Forecast window not closed, or grading logic not reached

**Check:**
```sql
SELECT forecast_horizon_date, resolution, resolved_by_agent_slug
FROM decisions
WHERE id = (SELECT artifact_id FROM spine_track_members 
             WHERE track_id = '{your_track_id}' AND artifact_kind = 'decision');
-- resolution NULL means not yet graded
-- resolved_by_agent_slug NULL means human-graded (if not NULL)
```

---

## Expected Timeline

Foreground drive with AUTO_MAX=24 legs:

| Stations | Legs per station | Total legs | Time per leg | Total time |
| --- | --- | --- | --- | --- |
| 7 stations (sense→learn) | ~3 legs | ~21 legs | 30-50s | **10.5–17.5 minutes** |

Add approval wait time if gates fire. Total: **15–30 minutes of wall-clock time** for a clean run.

---

## Success Criteria (R-18)

All six must be true:

1. ✅ **Track entered at `sense` reaches `learn`** — SQL query returns 1 row
2. ✅ **No human intervention mid-run** — `driven_via` is 'sweep' or 'foreground' only, no human approval reversals
3. ✅ **Visible while happening** — Founder watches character, activity, and artifacts update on one screen
4. ✅ **Starts from one sentence** — Created from one title/origin, zero configuration
5. ✅ **Ends with verdict** — Learn station shows forecast vs. actual, calibration recorded
6. ✅ **Evidence recorded** — SQL, track ID, and screenshot documented here

---

## Post-Success Actions

If the run completes all seven stations:

1. **Document in this file** - Append `FIRST-FINISH-PROOF-2026-08-27.md` with SQL, track ID, and screenshot
2. **Reset hypothesis** - The machinery works. Note what setup was needed (signals? defaults? approvals waived?)
3. **Iterate on timing** - If total time >30min, check AUTO_MAX, station complexity, network latency
4. **Prepare for PHASE 3** - Visible agency enhancements (run timeline, progress indicators, decision cards) now ship based on this working foundation

---

## Rollback (if something breaks mid-deploy)

If production breaks after deploy:

```bash
# Lovable auto-rolls back on failed deployments
# If manual rollback needed: deploy a prior commit
# Latest known-good: d469da4d5 (The .env was on this machine...)
```

---

**Owner:** S0 (Conductor — Claude Code)  
**Deployed by:** Lovable MCP  
**Verified by:** SQL queries + screenshot  
**Next:** PHASE 3 (visible agency UI enhancements, if needed)
