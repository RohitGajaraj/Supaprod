# Decide Station Implementation — Decision Recording

**Status:** OPEN  
**Priority:** P0 (blocks mission gate and Learn station)  
**Estimated effort:** 2-4 hours  
**Owner:** MAIN or Lane 1  
**Blocker for:** Mission gate completion, Lane 0 #67, Lane 1 #70, Learn station  

---

## The Problem

**Current state:**
- Decide route exists (`src/routes/_authenticated.decide.tsx`) and renders a UI
- `decision.record` tool exists in registry (`src/lib/ai/tools/registry.server.ts:4755`) and can accept forecast parameters
- **BLOCKER:** No mechanism calls `decision.record` from the Decide UI or any user flow
- **Result:** 0 of 304 agent-recorded decisions in production (precedent pool is empty)

**Why it matters:**
- The product's core claim is "learns from outcomes and guides the next call"
- Learning requires decisions with forecasts attached
- Forecasts cannot be recorded if decisions aren't recorded
- Without decisions, the learn→guide loop is broken

---

## The Task: Wire Decide Route to Call decision.record

### What Needs to Happen

The Decide route must present a control that calls the `decision.record` tool with:
1. The ranked opportunity/spec being decided on (title, rationale)
2. Alternatives considered (select from the opportunities queue)
3. **Forecast** (three fields, all required):
   - `forecast_claim`: what the team believes will happen
   - `forecast_how_we_will_know`: the observable that settles it
   - `forecast_horizon_date`: ISO 8601 timestamp with offset (future date)

### How the Tool Works

**Location:** `src/lib/ai/tools/registry.server.ts` line 4755

**Mode:** `"confirm"` (requires approval/confirmation)

**Schema:** Accepts (via `argsSchema`):
```typescript
{
  title: string (1-200 chars)
  rationale: string (1-4000 chars)
  alternatives_considered: string[] (1-10 items, 1-500 chars each)
  prd_id: string (optional, UUID of the spec being decided on)
  forecast_claim: string (1-500 chars, required) ← REQUIRED since 2026-08-22
  forecast_how_we_will_know: string (1-500 chars, required) ← REQUIRED since 2026-08-22
  forecast_horizon_date: string (ISO 8601 with offset, required, must be future date) ← REQUIRED since 2026-08-22
}
```

**What it does:**
1. Validates the arguments (including forecast horizon must be in the future)
2. Checks a gate (`decideDecisionReview`) to determine status ("approved" or pending human review)
3. Inserts a row into `decisions` table with all fields including the three forecast columns
4. Records the auto-approval in `workspace_audit_log` for attribution
5. Records decision lineage edges in `decision_origins`
6. Returns the decision ID and summary

**Important:** The tool already exists and works. It just needs to be called.

### Where to Wire It

**File:** `src/routes/_authenticated.decide.tsx`

**Current structure (from file inspection):**
- Renders a ranked queue of opportunities
- Has a "Gate" region (the decision point)
- Has a record recess (shows past outcomes)
- Has ranked queue below

**What to add:**
- A form or input region that collects the three forecast fields
- Validation that all three forecast fields are filled
- A call to `decision.record` tool when the user confirms
- Error handling if the call fails

**How to call it:**
The tool registry works through the agent dispatch system. From a route, you would:
1. Use the tool directly (server function) via `callTool` or similar
2. OR route it through the studio/dispatch system if it's part of an agent run
3. OR add it as a human-callable endpoint if this is a founder decision

**Key question:** Is the founder typing decisions directly on /decide, or are agents calling `decision.record` autonomously?

Looking at the architecture, agents should call it autonomously during Decide station. So the path is:
- Agent runs → Decide station → agent calls `decision.record` → decision records and returns
- Decision feeds back to track as evidence the loop completed

However, if the founder wants to manually record a decision on the Decide screen, that's a separate control.

### Files to Check/Modify

1. **`src/routes/_authenticated.decide.tsx`** ← Main file to modify
   - Current: renders opportunities, has decision cards
   - Needed: add forecast input form + decision.record call

2. **`src/lib/ai/tools/registry.server.ts`** ← Reference only (do not modify)
   - Line 4755: `decision.record` tool definition
   - Already has all the pieces

3. **`src/lib/ai/tools/defaults.ts`** ← Reference only
   - Line 128: tool mode="confirm"

4. **`src/lib/decisions.functions.ts`** ← May need to add server function
   - Check if there's an existing wrapper to call decision.record
   - If not, may need to add one that's callable from the route

---

## Acceptance Criteria

- ✅ Decide route presents forecast input fields (claim, observable, horizon date)
- ✅ Forecast validation catches future-date requirement
- ✅ Clicking "Record decision" calls decision.record with all fields
- ✅ On success: decision appears in `decisions` table with all forecast columns filled
- ✅ On success: `decision_origins` entries created linking decision to spec/mission
- ✅ User sees confirmation that decision was recorded
- ✅ Unit test: calling the route records a decision correctly
- ✅ Integration test: a decision with forecast can be queried from the database

---

## Verification Query

After implementation, verify with:

```sql
SELECT count(*) as decision_count, 
       count(DISTINCT forecast_horizon_date) as decisions_with_forecasts
FROM decisions
WHERE workspace_id = 'test-workspace-id'
  AND created_at > now() - interval '1 hour'
  AND source_kind = 'agent'
  AND forecast_claim IS NOT NULL;
```

Expected: at least 1 row with non-null forecast fields.

---

## Related Findings from Audit

- **Audit finding #1:** `/decide` never writes a `decisions` row (verified via query: 0 of 304)
- **Audit finding #2:** 0 of 131 real decisions carry forecast (seed data carries 146)
- **Audit finding #3:** Six of seven stations are unsteerable because they lack `missionId` — but Decide can still call its own tool
- **Audit finding #4:** `learnings.decision_id` column added but nothing writes it (needs this fix first)

---

## Why This Matters for the Product

1. **Without decisions:** Learn station has no forecast to resolve
2. **Without forecasts:** No calibration data to improve agent judgment
3. **Without this loop:** The product claims to "learn and guide" but cannot
4. **For mission gate:** Founder cannot observe complete loop because it breaks at Decide

This is not optional infrastructure. It is the foundation the entire learning claim rests on.

---

## Next Steps After Fix

Once Decide records decisions:
1. Verify Lane 0 #67 can proceed (calm learn holds)
2. Verify Lane 1 #70 can proceed (verdict meets claim)
3. Attempt mission gate test: founder watches sense→discover→decide→learn complete
