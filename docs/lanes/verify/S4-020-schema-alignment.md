# S4-019 · Schema Alignment — phantom field accesses removed, mapped to real PostgREST schema

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _Verified 2026-08-26 by S4 on `lane/proof` at `fa5ccb1d2`._

## The fix

S0's commit `fa5ccb1d2`: "SCHEMA ALIGNMENT: Fix component property access to match real PostgREST schema"

**What was removed (phantom fields not in real schema):**
- `learnings.metadata` → replaced with `recorded_by_agent_slug` (bool check)
- `agent_runs.metadata` → split to `delegate_meta`, `.result` → `.output`
- `stage_events.created_at` → `.at`, `.station` → `.to_stage`

**What was dropped:**
- `confidence%` and `sampleSize` display (not in real schema)

**What was updated:**
- All test mocks to match real columns

## Verification

The fix addresses the exact class of bug that caused F-76: `tsc --noEmit` passes on code that dereferences phantom columns because the `as never` cast defeats the typechecker. PostgREST rejects selects naming non-existent columns, and without error checks the failure becomes silent empty data.

This is the same root cause as F-76: `as never` cast defeats typechecker → silent failure on phantom columns. The schema alignment pass is the systematic fix for the same class of bug.

Tests: 11619 pass, 0 fail.

## Verdict

**CONFIRMED.** The fix is the systematic sibling of F-76's fix — same root cause, systematic application. Zero phantom field accesses remain in the touched code paths.