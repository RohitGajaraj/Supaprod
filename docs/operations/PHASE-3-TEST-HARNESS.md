# PHASE 3: Test Harness — Acceptance Query Execution Plan

**Goal:** The moment code deploys, run the narrowest autonomous loop (sense → learn) end-to-end and verify acceptance query returns > 0.

## Test Track Setup

**What to do immediately after deployment:**

1. **Create a test workspace** (or use existing test workspace)
   - Workspace must be seeded with empty tables (no prior track interference)
   - RLS scoped to user running test

2. **Ingest a real signal** into `/api/public/ingest-signals`
   ```
   POST /api/public/ingest-signals
   Content-Type: application/json
   
   {
     "workspace_id": "test-ws-uuid",
     "signals": [
       {
         "title": "Test signal 1",
         "content": "This is a real signal testing the fold fix",
         "source_kind": "manual"
       }
     ]
   }
   ```

3. **Let sense station run** (autonomous crew: researcher, discovery-scout, namer)
   - Monitor `spine_tracks` for track creation
   - Verify `entry_station = 'sense'` and `station = 'sense'` (newly created track at sense)

4. **Drive the track** through full sense → learn loop
   ```
   POST /api/private/track/{trackId}/drive-now
   Body: { "origin": "press" }
   ```

5. **Poll acceptance query** every 5 seconds until it returns > 0
   ```sql
   SELECT id, entry_station, station, title, hold_reason 
   FROM spine_tracks 
   WHERE entry_station='sense' AND station='learn' AND waived='[]'
   LIMIT 1;
   ```

## What to Watch For

| Stage | Indicator | What breaks here |
| --- | --- | --- |
| **Sense** | Track enters at sense, adds 1+ `spine_crew` rows | Crew doesn't spawn, track stuck at sense |
| **Discover** | Track advances to discover, creates 1+ `insights` rows | Restatement fold still broken (ids=[]) |
| **Decide** | Track advances to decide, creates `decision` row | Decide station not wired to write decisions |
| **Plan** | Track advances to plan, creates `specification` row | Plan crew fails silently |
| **Design** | Track advances to design, creates `prototype` artifact | Design gate stuck on human-only check |
| **Build** | Track advances to build, creates `changeset` row | Builder not responding or gate closed |
| **Ship** | Track advances to ship, deployment gate checks | Release.publish not wired or missing |
| **Learn** | Track reaches learn, creates `learning` row with verdict | Verdict not flowing back to forecast |

## Live Monitoring

**Browser-side (founder watches on `/track/{trackId}`):**
- Character should show state changes: thinking → working → asking → done
- RunRouteHeader shows position advancing through seven stations
- TrackActivity transcript updates in real-time
- ArtifactPane shows artifacts appearing at each station

**SQL queries (backend verification):**
- Track row advances: `station` column changes from 'sense' to 'discover', etc.
- Crew rows create and complete: `spine_crew` status goes 'assigned' → 'working' → 'done'
- Artifacts write: `track_artifacts` grows with one row per station output
- Hold reasons clear: `spine_tracks.hold_reason` becomes NULL when crew completes

## Success Criteria

✅ **Minimal success:** Acceptance query returns 1 row
✅ **Full success:** Founder watches row 0→1 on `/track/test-track-id` while query polls alongside
✅ **Verified:** Character animation, transcript updates, artifacts render in real-time

## Post-Deployment Checklist

- [ ] Lovable re-authed and deployment complete
- [ ] Test workspace created with RLS access
- [ ] Signal ingested via webhook
- [ ] Track entry confirmed (`spine_tracks` row exists)
- [ ] `driveTrackNow` executed
- [ ] Acceptance query polled (expect 0 or 1)
- [ ] Founder watches on `/track/test-track-id`
- [ ] Character shows thinking/working/done states
- [ ] Transcript updates in real-time
- [ ] Seven stations all produce artifacts
- [ ] Accept query returns > 0 ✅

## If Acceptance Query Stays 0

**Diagnose by station:**
1. Check `spine_tracks.station` — where is the track stuck?
2. Check `spine_tracks.hold_reason` — why is it held?
3. Check `spine_crew` — which crew didn't complete?
4. Read `error_events` for that workspace — what threw?
5. Check fold logic: `signal_restatement` for signal IDs returned
6. Verify S0-001 verification not blocking: `spine_tracks.hold_reason = 'self-check-failed'`?

If stuck at **Discover**, check: `SELECT * FROM signal_restatement WHERE workspace_id = ?` — is the fold returning IDs?
