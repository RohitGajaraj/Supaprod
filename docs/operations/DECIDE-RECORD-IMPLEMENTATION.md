# Implementation Task: Decide Station Must Call decision.record

**Priority:** P0 · Mission-gate blocker  
**Scope:** Add 1-3 tool invocation in Decide station  
**Owner:** MAIN (requires loop.server.ts expertise)  
**ETA:** 1-2 hours after location identified

---

## What's Broken

Decide station never writes decisions to the database. This blocks:
- Learn station (nothing to grade)
- Forecast capture (none recorded)
- Precedent pool (0 outcome rows ever written)
- Full mission loop (sense→discover→**decide**→learn)

## Root Cause

- Tool `decision.record` exists ✅ (`src/lib/ai/tools/registry.server.ts`)
- Tool is fully specified with forecast parameters ✅
- Schema supports all 11 forecast columns ✅
- **Agent loop never calls it** ❌

## Evidence

Database query (production):
```sql
SELECT COUNT(*) FROM spine_tracks WHERE station='decide';
-- Result: 1 (reached, then stopped, never recorded decision)

SELECT COUNT(*) FROM decisions;
-- Result: 304 (only IDs, no forecasts)

SELECT COUNT(*) FROM agent_memory WHERE kind='outcome';
-- Result: 0 (precedent pool completely empty)
```

## What Needs to Happen

1. **Locate** the Decide station agent dispatch in loop (likely around line 1355 where `callModel` is called)
2. **Identify** where the decision is drafted/formatted before the loop advances
3. **Insert** a `decision.record` tool call with:
   - `title`: The decision being made
   - `rationale`: Why this choice vs alternatives
   - `alternatives_considered`: What was weighed and rejected
   - `forecast_claim`: What we predict will happen
   - `forecast_how_we_will_know`: Observable that settles the claim
   - `forecast_horizon_date`: When to check (ISO 8601)
   - `prd_id`: Link to spec if one exists (optional)
4. **Wait** for tool result containing decision ID
5. **Record** that ID on the track
6. **Advance** to Learn station

## Constraints

- Must use existing `callModel` chokepoint (no new AI calls)
- Must respect `decision.record`'s refusal rules:
  - Rejects decisions with no forecast
  - Rejects decisions with no alternatives weighed
  - Rejects forecasts with past horizons
- Must not loop forever (already has MAX_STATION_ATTEMPTS guard)

## Verification

Once implemented:
```sql
SELECT COUNT(*) FROM spine_tracks WHERE station='decide';
-- Should advance to: 2+ (now progressing to learn)

SELECT COUNT(*) FROM decisions WHERE forecast_claim IS NOT NULL;
-- Should advance to: 50+ (forecasts now recorded)

SELECT COUNT(*) FROM agent_memory WHERE kind='outcome';
-- Should advance to: 5+ (learn station scoring them)
```

## Known Good Patterns

- `callModel` invocation: `src/lib/ai/loop.server.ts:1355`
- Tool registry call pattern: `src/lib/ai/tools/orchestrator.server.ts`
- Schema: `migrations/20260810180000_the_forecast_is_the_part_that_cannot_be_rebuilt.sql`

## Why This Matters

This single addition unblocks the entire learning loop. Without it, the product cannot demonstrate its core claim ("learns from what actually happened"). With it, a single track can walk all 7 stations unobserved, from sense through learn, recording its own evidence and grading its own forecast.

This is the **narrowest path to mission gate completion.**

---

**Blocker mapped. Ready for implementation once founder approves or next session is ready.**
