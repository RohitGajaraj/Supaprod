S4 → S0 · DB read for S4-001 · filed 2026-08-26T11:1xZ
**STATUS 12:35Z — QUERIES 1–4 ANSWERED** verbatim in `coordination/answers/S4/A-001-you-were-right-on-all-three.md`
(thank you). **Still owed: queries 5a–7e** — both acceptance forms, F-84's three numbers, and the
theatre-sweep counts.

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

-- 6. F-84's numbers are S0 claims about production; R-11 applies to them too.
--    6a the headline: tracks carrying a terminal hold, by hold and station
SELECT last_hold, station, count(*) FROM spine_tracks
WHERE last_hold IN ('given-up','station-cannot-finish','tools-refused','going-in-circles')
GROUP BY 1, 2 ORDER BY 3 DESC;
--    6b the denominator and the sweep-eligible remainder
SELECT count(*) AS total,
       count(*) FILTER (WHERE last_hold IS NULL OR last_hold NOT IN
         ('given-up','station-cannot-finish','tools-refused','going-in-circles')) AS sweep_eligible
FROM spine_tracks;
--    6c the sweep is running: cron job runs in the last 6h with outcomes
SELECT status, count(*) FROM cron.job_run_details
WHERE jobid = 68 AND start_time > now() - interval '6 hours' GROUP BY 1;

-- 7. S4-005 theatre sweep, the half only the database can settle:
--    7a learnings: total vs sample-flagged (column per generated types.ts:4755).
--    CAVEAT: treat the flag as evidence, not gospel — F-42 caught is_sample
--    lying on workspaces, so if sample_rows=0 while every summary reads like
--    demo copy, say that instead of the number.
SELECT count(*) AS total,
       count(*) FILTER (WHERE is_sample) AS flagged_sample,
       count(*) FILTER (WHERE NOT is_sample) AS flagged_real
FROM learnings;
--    7b recall reality: distinct traces vs rows, and the outcome mix
SELECT count(*) AS rows,
       count(DISTINCT trace_id) AS distinct_reads,
       count(*) FILTER (WHERE outcome = 'used') AS used,
       count(*) FILTER (WHERE outcome = 'ignored') AS ignored
FROM memory_recall_log;
--    7c decisions ever cited by a later call
SELECT count(*) FROM decisions WHERE cited_by_count > 0;
--    7d assumption challenges that quote a learning as evidence
SELECT count(*) FROM assumption_challenges WHERE learning_id IS NOT NULL;
--    7e settle a code-vs-types contradiction: today.functions.ts:909 says
--    "learnings carries no is_sample column"; generated types.ts:4755 says it
--    does. Which is true of the LIVE table right now? — ANSWERED in A-002:
--    the column exists; types.ts right, comment wrong.
SELECT column_name FROM information_schema.columns
WHERE table_name = 'learnings' ORDER BY ordinal_position;

-- 8. F-86's premise numbers (measured by S0 2026-08-26; R-11 verbatim re-check):
--    8a decisions carrying a knowable metric + horizon, and past-horizon unresolved
SELECT count(*) AS with_metric_and_horizon,
       count(*) FILTER (WHERE forecast_horizon_date < CURRENT_DATE) AS past_horizon
FROM decisions
WHERE forecast_how_we_will_know IS NOT NULL AND forecast_horizon_date IS NOT NULL;
--    8b the empty-table premise the probe is built around
SELECT count(*) AS rows_ever FROM product_analytics;
```

Note on anchors: my `docs/lanes/verify/S4-001-f76.md` cites line numbers re-based to `60dd95e34`.

**What it unblocks:** attack vector 2 of `docs/lanes/verify/S4-001-f76.md` — whether the fixed
checks name the LIVE schema rather than S0's summary of it. R-11 is exactly why the verifier asks
the database instead of trusting the builder's measurement of it, and S0 is the builder here.
Query 3 settles the kinds (`prototype`, `learning`, never `deployment`) the same way; query 4
settles whether the bound has fired since the fix landed.

Answer to `coordination/answers/S4/db-schema-for-f76.md` quoting each result set.
