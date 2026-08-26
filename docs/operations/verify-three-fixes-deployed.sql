-- Verification queries for three fixes deployed on 2026-08-27
-- Run these AFTER deployment to confirm fixes are live
-- Expected: All queries should return results or show fixed behavior

-- ============================================================================
-- FIX 1: F-72 — Build station refuses to hand on staged-only changeset
-- ============================================================================

-- Check that 'nothing-to-hand-on' hold reason exists (schema change)
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'HoldReason')
  AND enumlabel = 'nothing-to-hand-on';

-- Expected: 1 row with enumlabel = 'nothing-to-hand-on'
-- If 0 rows: F-72 is NOT deployed

-- ============================================================================
-- FIX 2: Fold Fix — Restatement fold returns surviving signal ID
-- ============================================================================

-- Check that restatedOnto column exists on agent_signals
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'agent_signals'
  AND column_name = 'restatedOnto';

-- Expected: 1 row with column_name = 'restatedOnto'
-- If 0 rows: Fold fix is NOT deployed

-- Optional: Check a test to see the fold working
-- (This requires signals to have been folded; may return 0 if no signals folded yet)
SELECT COUNT(*) as folded_signal_count
FROM agent_signals
WHERE workspace_id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4'
  AND "restatedOnto" IS NOT NULL
  AND created_at > now() - interval '1 hour';

-- Expected: May be 0 if no signals processed since deploy, or > 0 if fold is working

-- ============================================================================
-- FIX 3: F-73 — signals.log refuses product's own artifacts as evidence
-- ============================================================================

-- Check that namesOwnArtifact column exists on artifact tables
-- (This is a tool-level guard, may not have a schema change)
-- Instead, verify indirectly by checking recent signals.log calls

-- Query: Signals logged after deploy should NOT include product artifacts
-- as their source_kind
SELECT COUNT(*) as recent_signals
FROM agent_signals
WHERE workspace_id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4'
  AND source_kind NOT IN ('agent', 'webhook', 'manual', 'canny')
  AND created_at > now() - interval '1 hour';

-- Expected: 0 (no signals with weird source_kind should be logged)
-- If > 0: F-73 guard may not be working

-- ============================================================================
-- COMBINED: After deployment, this query should show recent activity
-- ============================================================================

SELECT
  now() as check_time,
  (SELECT COUNT(*) FROM pg_enum WHERE enumlabel = 'nothing-to-hand-on') as f72_check,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'agent_signals' AND column_name = 'restatedOnto') as fold_check,
  (SELECT COUNT(*) FROM agent_signals WHERE "restatedOnto" IS NOT NULL AND created_at > now() - interval '24 hours') as fold_activity;

-- Expected:
-- check_time: current timestamp
-- f72_check: 1 (enum exists)
-- fold_check: 1 (column exists)
-- fold_activity: >= 0 (may be 0 if no folds yet)

-- ============================================================================
-- TRACK VERIFICATION: Run this to check if acceptance is possible
-- ============================================================================

-- Current acceptance query (should be 0 before running new track)
SELECT id, entry_station, station, waived, created_at
FROM spine_tracks
WHERE entry_station = 'sense'
  AND station = 'learn'
  AND waived = '[]'
ORDER BY created_at DESC;

-- Expected: 0 rows (no completed sense→learn tracks yet)
-- After running acceptance test: Should return 1+ rows

-- ============================================================================
-- WORKSPACE HEALTH: Check if test workspace is ready
-- ============================================================================

-- Count real signals (not agent-generated notes)
SELECT COUNT(*) as real_signal_count
FROM agent_signals
WHERE workspace_id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4'
  AND source_kind != 'agent'
  AND created_at > now() - interval '30 days';

-- Expected: > 5 (should have real customer signals)
-- If 0 or very low: Workspace may need signal ingestion before test

-- Count how many tracks are open in the workspace
SELECT COUNT(*) as open_track_count
FROM spine_tracks
WHERE workspace_id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4'
  AND status NOT IN ('abandoned', 'completed')
  AND created_at > now() - interval '7 days';

-- Expected: <= 3 (to avoid sweep contention during test)
-- If > 5: Clean up old stuck tracks first

-- ============================================================================
-- FINAL: All clear? Ready for acceptance test
-- ============================================================================

-- Summary report
WITH checks AS (
  SELECT 'F-72 enum' as check_name, COUNT(*) > 0 as passed
  FROM pg_enum
  WHERE enumlabel = 'nothing-to-hand-on'

  UNION ALL

  SELECT 'Fold column' as check_name, COUNT(*) > 0 as passed
  FROM information_schema.columns
  WHERE table_name = 'agent_signals'
    AND column_name = 'restatedOnto'
)
SELECT check_name, CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END as status
FROM checks;

-- Expected: All should show PASS
-- If any show FAIL: That fix is not deployed, do not proceed with test
