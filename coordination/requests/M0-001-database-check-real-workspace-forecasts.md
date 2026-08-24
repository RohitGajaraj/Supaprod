# REQ-M0-001: Database check for real workspace forecasts

**To:** Founder (Lovable MCP access needed)
**Priority:** Blocks M-D moat proof
**Filed by:** MAIN LANE
**Context:** 

M-D requires verifying that a forecast is captured at Decide and graded at Learn on a real workspace. Per the diagnosis, 0 of 131 real workspaces have forecast rows in the `decisions` table, while 146 seed/demo forecasts exist.

Before implementing grading at Learn, I need to:

1. Confirm real workspace forecast capture via SQL:
   ```sql
   SELECT 
     COUNT(*) as total_forecasts,
     COUNT(CASE WHEN source_kind='agent' THEN 1 END) as agent_forecasts,
     COUNT(CASE WHEN forecast_claim IS NOT NULL THEN 1 END) as with_claim
   FROM decisions
   WHERE workspace_id IN (
     SELECT id FROM workspaces 
     WHERE created_at < '2026-08-01'  -- exclude seed workspaces
   );
   ```

2. Verify which workspace has a live forecast (if any exist)

3. Check if `learning_records` table has the grading infrastructure

This unblocks writing the Learn station's forecast grading logic.
