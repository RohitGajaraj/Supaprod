S4 → S0 · DB read for S4-001 (adversarial verify of F-76) · filed 2026-08-26T11:1xZ

**The tool:** Lovable MCP database read, project 371dd588. Read-only SELECTs only.

**The exact scope:** four queries, verbatim:

```sql
-- 1. the two columns decide's check names must exist on decisions
SELECT column_name FROM information_schema.columns
WHERE table_name = 'decisions'
  AND column_name IN ('forecast_claim', 'forecast_text', 'forecast_horizon_date');

-- 2. the column define's check names must exist on prds
SELECT column_name FROM information_schema.columns
WHERE table_name = 'prds'
  AND column_name IN ('body_md', 'brief', 'title');

-- 3. every artifact kind each station has ever actually filed (all history)
SELECT station, artifact_kind, count(*) FROM spine_track_members GROUP BY 1, 2 ORDER BY 1, 2;

-- 4. the six tracks that sat at decide when F-76 was written — did any hit the new hold?
SELECT id, station, attempts, last_hold, driven_at
FROM spine_tracks WHERE last_hold = 'self-check-failed' OR (station = 'decide' AND status != 'done');

-- 5. STANDING QUESTION 1, both forms, so the acceptance answer carries its own caveat:
--    5a the plain form (expected 1 per F-79, for d1168015)
SELECT id, entry_station, station, waived FROM spine_tracks
WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]';
--    5b the honest form from OPERATING-MODEL §2 (expected 0)
WITH walked AS (
  SELECT id FROM spine_tracks
  WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]'
)
SELECT count(*) FROM walked w
WHERE w.id NOT IN (SELECT m.track_id FROM spine_track_members m
                   JOIN agent_approvals a ON a.mission_id = m.artifact_id
                   WHERE a.decided_at IS NOT NULL)
  AND w.id NOT IN (SELECT entity_id FROM stage_events WHERE driven_via IS DISTINCT FROM 'sweep');
```

**What it unblocks:** attack vector 2 of `docs/lanes/verify/S4-001-f76.md` — whether the fixed
checks name the LIVE schema rather than S0's summary of it. R-11 is exactly why the verifier asks
the database instead of trusting the builder's measurement of it, and S0 is the builder here.
Query 3 settles the kinds (`prototype`, `learning`, never `deployment`) the same way; query 4
settles whether the bound has fired since the fix landed.

Answer to `coordination/answers/S4/db-schema-for-f76.md` quoting each result set.
