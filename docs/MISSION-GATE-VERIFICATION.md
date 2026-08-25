# Mission Gate Verification Plan

**Status**: Fix deployed, awaiting verification  
**Date**: 2026-08-25 17:48 IST  
**Commits**: f326faeb0, 96fc5c8c2

## What Changed
The define station was blocking ALL tracks with "produced-nothing" hold because:
- Instructions said to use `brief` parameter ONLY when "Decide was waived"
- Live tracks (from proposals) have NO opportunity_id, even if Decide wasn't waived  
- Without alternative, prd.draft would fail silently

**Fix Applied**: Updated both FILE_IT[define] and prd-writer CREW_ROLE to state:
> "Call prd.draft with opportunity_id if available, otherwise construct and pass brief. You must pass one or the other."

## Verification Checklist

### Pre-Test
- [ ] Lovable has deployed commits f326faeb0 or later
- [ ] Production application running
- [ ] Harbor workspace (60000000-0000-4000-8000-000000000000) accessible

### The Test
Create a fresh track and monitor its progression:

1. **Entry** (`/start`): Navigate to onramp, create new work item
2. **Sense→Decide**: Track should pass through without stuck holds (existing functionality)
3. **Define Station** (THE TEST): 
   - Track enters define station
   - prd-writer calls prd.draft with brief (because no opportunity_id available)
   - spec is created and attached to track
   - ✓ If successful: `spine_track_members` shows 'prd' kind artifact
   - ✗ If failed: track stuck at define with last_hold = "produced-nothing"
4. **Design→Build→Ship**: Auto-continuation carries through these stations (Item 34 already implemented)
5. **Learn**: Track reaches final station, loop is complete

### Success Criteria
- [ ] Track progresses: sense → decide → define → design → build → ship → learn
- [ ] Each station creates artifacts without "produced-nothing" holds
- [ ] Auto-continuation works (no manual clicks needed after initial creation)
- [ ] Complete loop takes 2-5 minutes total
- [ ] Screenshot/recording shows the full progression

### Evidence Required for Mission Gate
A **screenshot** showing:
1. TrackRun component displaying the track
2. TrackChain visualization with all 7 stations marked complete
3. Final station (Learn) reached and displayed
4. Timestamp showing real-world execution (not just code)

## Rollback Plan
If test fails with "produced-nothing" at define:
- Revert to commit 12f4b72a5 (previous deployment)
- Define station fix did not work as expected
- Investigate: Did Lovable deploy? Is cache preventing new code from running?

## Next Steps
1. Verify Lovable has deployed (check production build date)
2. Create test track via UI
3. Watch it progress through all 7 stations with auto-continuation
4. Document completion with screenshot
5. Declare mission gate MET or identify remaining blocker
