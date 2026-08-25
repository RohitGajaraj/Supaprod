# F-25: Parallelization Strategy Proposal

**MAIN LANE Strategic Decision**  
**Date:** 2026-08-25  
**Status:** Drafted for founder review and ruling  

---

## The Problem

Current state (measured with 2 live tracks):
- `spine.track-tick` drives up to 5 tracks sequentially under a 45-second shared deadline
- Real measure: one track consumed 64s and the other was not driven at all
- Result: each track gets ~20 minutes per station (45s deadline ÷ 2.3 seats per station × 5 inefficiency)
- Worst case: single slow track starves the others entirely

**Impact on Mission:** The unattended sweep cannot demonstrate "watchable" because only 1 track per 20 minutes is unacceptable as a user-facing feature. The foreground path (`driveTrackNow`) with auto-continue (item 34) solves the watched case but does nothing for the background sweep.

---

## Safety Constraint: Spend-Cap Checking

**The named concern from BUILD-QUEUE item 33:**
> "Sequential is deliberate — five concurrent loops would race the spend-cap check"

**What this means:**  
Each track must check against its workspace's credit ceiling *before* spending. Today this is serial:
1. Track 1 reads balance
2. Track 1 spends $X
3. Track 2 reads balance
4. Track 2 spends $Y

If serialized per-track, the check is accurate (balance is never exceeded).

If parallelized, we risk a race:
1. Track 1 reads balance: $100
2. Track 2 reads balance: $100  
3. Both think they can spend $60
4. Both spend, balance goes to -$20 (RACE CONDITION)

---

## Proposed Solution: Workspace-Level Serialization

**The idea:** Parallelize BETWEEN workspaces, keep serial WITHIN a workspace.

### How it works

1. **In `spine.track-tick`**, after fetching the sweep batch:
   - Group tracks by `workspace_id`
   - Create a task for each workspace
   - Execute workspace-tasks in parallel
   - Within each workspace-task, drive its assigned tracks sequentially

2. **Why it's safe:**
   - **Per-workspace credit checks** are still serialized (one at a time within a workspace)
   - **Cross-workspace parallelization** is safe because accounts have separate credit pools
   - **Deadline per workspace** stays fair: each workspace gets its own 45s window, not shared

3. **Benefit:**
   - Multiple workspaces run in parallel
   - Within a workspace, tracks still run in fair round-robin (LRU ordering preserved)
   - Spend-cap check remains accurate
   - No cross-workspace starving

### Example Scenario

**Before (serial):**
- Workspace A track 1: 0-45s (completes)
- Workspace B track 1: 45-90s (out of time, skipped)
- Total throughput: 1 track finished, 1 starved

**After (workspace-parallel):**
- Workspace A track 1: 0-45s (parallel with B) → completes
- Workspace B track 1: 0-45s (parallel with A) → completes
- Total throughput: 2 tracks finished, 0 starved

---

## Alternative Considered: Increase Deadline

**Proposed:** TICK_DEADLINE_MS from 45s to 60s or 90s

**Verdict:** ❌ Not primary fix

**Reasoning:**
1. Cloudflare Workers has a hard ~180s timeout (pg_net default)
2. Increasing one tick doesn't scale (100 tracks = 100 x 20min each = 33+ hours)
3. Larger deadline means longer time-to-completion for each track
4. Solves nothing if the real issue is starving

**May revisit:** Only if workspace-parallel testing shows bottlenecks at the 45s mark and we need breathing room for occasional slow stations.

---

## Alternative Considered: Concurrent Tracks Per Workspace

**Proposed:** Run 2-3 tracks in parallel within a workspace

**Verdict:** ❌ Unsafe without more work

**Reasoning:**
1. Race condition on spend-cap check (described above)
2. Would require distributed locking (complex, new failure modes)
3. Would require per-track resource budgeting (unknown how much each will spend)
4. Gain is speculative until we measure real concurrency overhead

**May revisit:** If/when we implement per-track credit pre-authorization (reserve, then spend). That is future work, not this proposal.

---

## Implementation Plan (if approved)

### Phase 1: Skeleton (low risk)
1. Extract workspace grouping logic into `groupTracksByWorkspace()`
2. Create `driveSweepForWorkspace(workspaceId, tracks[])` that runs sequential per-workspace
3. Call each via Promise.all()
4. Measure: Do 2+ workspaces actually run in parallel, or does one dominate?

### Phase 2: Fairness (if Phase 1 works)
1. If workspaces are running roughly equal time: done, no more work needed
2. If one workspace dominates: implement per-workspace deadline tracking so each gets fair wall-clock time

### Phase 3: Monitoring (after deploy)
1. Track `swept_per_tick` metric per workspace
2. Alert if any workspace is repeatedly starved
3. Revert to serial if race conditions appear (safety-first)

---

## Testing Strategy

1. **Unit tests (no DB):** grouping logic, deadline per-workspace tracking
2. **Integration tests:** Two workspaces with different track counts; verify both make progress
3. **Live test:** Seed 3 workspaces with 2-3 live tracks each; run 1 full sweep cycle; measure:
   - Did all 6-9 tracks move?
   - Did any workspace starve the others?
   - Did any track exceed credit balance?

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Race condition on spend-cap | Serialize per-workspace, parallel between workspaces |
| One workspace dominates deadline | Track per-workspace elapsed time; revert if unfair |
| Observable performance degradation | Disable parallelization at runtime via env flag |
| Database connection pool exhaustion | Monitor pg connection count; bail if > 80% pool |

---

## Criteria for Success

F-25 is met when:
1. ✅ Two concurrent workspaces both complete at least one track per tick
2. ✅ No race conditions observed in credit accounting
3. ✅ Throughput measured as `tracks_per_tick * workspaces` (e.g., 3 workspaces × 1.5 tracks/workspace = 4.5 tracks/min vs current 1)

---

## Relationship to Mission

- **Round 8 proved:** End-to-end works unattended with current serial sweep
- **F-25 enables:** Demonstrating scale (multiple concurrent customers' work)
- **Not required for:** Mission gate (already proven), founder walkthrough, or single-track demo
- **Required for:** Production readiness (multiple workspaces in parallel)

---

## Next Step

**Awaiting founder approval to proceed with Phase 1 implementation.**

If approved: Lane A can begin implementation in the next session.  
If deferred: Background sweep remains serial but functional; foreground auto-continue (item 34) solves the user-facing "watchable" problem.

---

## Appendix: Why This Matters

The narrowest provable loop (Round 8) ran **one sentence → learn in 13 minutes unattended**, with only one approval gate. That's the acceptance proof.

Showing that it scales (F-25) is the difference between:
- "This works" (proven)
- "This works at production scale" (next)

F-25 is not blocking the mission. It's the quality of life improvement for what comes after.
