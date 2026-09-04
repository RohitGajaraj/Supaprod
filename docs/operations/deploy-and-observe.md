# Mission Gate Completion Checklist — Deploy and Observe

> _Created: 2026-08-26 · Last updated: 2026-08-26_

**Status:** Code ready, pushed to origin/main. Awaiting founder deployment and observation.

**Commits ready:**
- `0e11661dc`: F-AUTONOMOUS (2) — decision.record mode='confirm' → 'auto'
- `5326d7d53`: Session update with fix documentation

---

## What Changed
Single change in `src/lib/ai/tools/defaults.ts` (line 128):
```diff
- "decision.record": { mode: "confirm", enabled: true, label: "Record a decision" },
+ "decision.record": { mode: "auto", enabled: true, label: "Record a decision" },
```

This unblocks the Decide station, enabling the full autonomous loop:
sense → discover → decide → learn

---

## Deployment Steps (5 minutes)

1. **Open Lovable editor** for Supaprod project
2. **Re-authenticate** if prompted (MCP token expired on 2026-08-25)
3. **Trigger GitHub sync** to pull the latest commits
4. **Deploy** to production (https://supaprod.lovable.app)
5. **Verify** deployment succeeded (check status indicator)

---

## Observation Steps (10 minutes)

**Navigate to:** https://supaprod.lovable.app/start

**Create a track:**
1. Type a work statement: e.g., "Review Q3 performance and identify improvement areas"
2. Click "Run it now"

**Watch for (5-10 minutes):**
1. **Sense station:** Agent files signals from workspace
2. **Discover station:** Signals cluster into themes (2-3 themes)
3. **Decide station:** Agent records a decision with forecast
   - Should see decision title, rationale, forecast claim, horizon date
4. **Learn station:** (May not complete in first 10min depending on forecast horizon)

**Real-time indicators:**
- Run progress bar advances through stations
- Agent presence character ("Supa") shows working state
- Transcript shows each step (signal filed, theme created, decision recorded)

---

## Verification Queries (Production DB)

After deployment, run these to confirm:

```sql
-- Check recent tracks entering sense with autonomous progress
SELECT id, station, created_at, updated_at 
FROM spine_tracks 
WHERE entry_station='sense' 
  AND created_at > now() - interval '5 min'
ORDER BY created_at DESC;
-- Expected: entries → sense → discover → decide

-- Check if decisions are being recorded
SELECT COUNT(*) FROM decisions 
WHERE created_at > now() - interval '5 min';
-- Expected: >0 (previously 0)

-- Check if forecasts are captured
SELECT COUNT(*) FROM decisions 
WHERE forecast_claim IS NOT NULL 
  AND created_at > now() - interval '5 min';
-- Expected: >0 (previously 0)

-- Check if precedent pool is populated
SELECT COUNT(*) FROM agent_memory 
WHERE kind='outcome' 
  AND created_at > now() - interval '5 min';
-- Expected: >0 (previously 0)
```

---

## Success Criteria

**Mission gate is MET when:**
- [ ] Founder navigates to /start
- [ ] Founder submits a work statement
- [ ] Founder clicks "Run it now"
- [ ] Founder watches track progress through sense → discover → decide → learn
- [ ] All four stations produce artifacts (signals, themes, decision with forecast, outcome)
- [ ] No human touches the track mid-run

**Stretch goal:** Two consecutive tracks complete end-to-end without stalls.

---

## Rollback (if needed)

If production issues arise, revert to the previous decision.record setting:
```bash
git revert 0e11661dc
git push origin main
# Redeploy from Lovable
```

---

## What This Proves

This observation demonstrates:
1. **Autonomous signal discovery** (Sense works)
2. **Evidence clustering** (Discover works)
3. **Decision recording with forecasts** (Decide works — previously impossible)
4. **The learning loop closes** (Learn can grade what Decide recorded)

This is the first time the full loop runs end-to-end unobserved on real external input. It proves the product's core claim: "learns from what actually happened and guides the next call."

---

**Ready to observe. Code is clean, tested, committed, and pushed.**
