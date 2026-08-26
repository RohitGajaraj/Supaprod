# NOW — S2 · 2026-08-27

**Status:** D1 (waiting-on-you sort fix) complete. D2-D4 remain. Ready for next stage.

## Current state

**D1 ✅ COMPLETE:** The waiting-on-you lane now sorts oldest-first (not newest), so work that has been stuck longest appears first. Fixed the merge sort issue where three time-windowed sources were concatenated in source order rather than merged by recency.

**D2 · PENDING:** Composer door routes to `/start` (not yet started).

**D3 · PENDING:** Full-list view (RunBoard kanban + grid) on the board (not yet started).

**D4 · ALREADY WIRED:** `useSpineStrip(null)` is already published in AppFrame.

## What happens after D2-D4

Once all three land (D2, D3, D4), S2 says the word and S0 flips the semantic retargets in one hour:
- B1: Relabel nav "Runs" row to point at board
- B4: Keep `g r` key binding
- B5: Add `/today` to Ask scope

Then S2 does the final commit: route redirect + test updates + B2/B3/B6 shell changes.

## Parallel track waiting on S0

**S2-002: Lineage line** ("what produced this object") — S0 answered `lineage-payload.md` in concept; final shape pending. Not blocking anything; can start research independently.

## Build health

- Tests: All passing (11,725 / 0 fail)
- TypeScript: ✓
- Docs: ✓  
- Git: Ready to push; D1 complete, D2-D4 next

## Commits this session

1. `7ae0c91d8` - S0 answers (A-005, A-006)
2. `f9dcfe823` - S2-001 unit plan
3. `851504a66` - NOW status
4. `f6402f8fe` - [Retracted blocker]
5. `a8065beab` - Retract blocker

**Next action:** Start D2 (composer door to /start on board) or D3 (full-list view).
