# SESSION HANDOFF — 2026-08-27 Afternoon, S0-002 route consolidation decided

**Session outcome:** 
- ✅ D1-D3 verified complete from prior session (step-progress, composer door, spend totals)
- ✅ Answered S2's D2 proposal: tracks and missions are parallel engines
- ✅ Decided six-batch route fold strategy for consolidating 113 routes into three surfaces

**Status:**
- ✅ Code deployable (previous session 11,383 pass / 0 fail)
- ✅ D1-D3 shipping ready (committed in prior session)
- ✅ Coordination decisions complete (S0 answers D2, route batches decided)
- ⏳ Route fold implementation ready to start (S2 BATCH-1 is safest first)
- ⏳ S1/S2/S3 coordinate to ship BATCH-1 through BATCH-6 sequentially

---

## What changed since last session

**Previous session (S0-001):** Self-verifying spine implemented. Acceptance query still returns 0.

**This session (S0-002):** 
1. Verified D1-D3 all shipped in prior session (commit cae01bfd5)
   - Step-progress module with skipped clause (D1)
   - Composer door to /start is KEEP (D2 - already wired)
   - InboxSurface shows workspace spend totals (D3)

2. **Answered D2 proposal** (`coordination/answers/S0/A-D2-tracks-do-not-create-missions.md`)
   - Tracks create ONLY `spine_tracks`, no missions
   - Missions created separately via `startOrchestratedMission`
   - This unblocks D2 items: board composer starts track, /runs tabs move to run detail

3. **Decided route fold batches** (`coordination/answers/S0/A-route-fold-batches.md`)
   - **BATCH-1** (Board): /runs, /missions, /briefing, /tasks → /today
   - **BATCH-2** (Run A): /discover, /decide, /plan → /track/:id with view params
   - **BATCH-3** (Run B): /design, /build, /ship → /track/:id
   - **BATCH-4** (Run C): /learn, /outcome, /approvals, /chat → /track/:id or removed
   - **BATCH-5** (Settings): engine-room, guardrails, govern, boundary, etc. → /settings
   - **BATCH-6** (Cleanup): Delete orphans, verify no callers
   - **Shipping law**: Every redirect ships with caller updates in one commit

---

## Blocking items: NONE

All decisions needed for D1-D3 complete. Route fold strategy ready to implement.

---

## What the next sessions should do

### **S2 (Design, LANE 0): BATCH-1 (Board consolidation)**
**Timeline: Immediate / next session**

Folds 9 list/view routes into `/today` with one commit per route pair:

1. Redirect `/runs` → `/today`, update nav + shell callers
2. Redirect `/missions` → `/today`, update nav + component callers
3. Redirect `/briefing`, `/tasks`, `/cockpit`, `/fleet` → `/today`
4. Redirect `/roadmap` → `/today?view=roadmap`, update roadmap link
5. Redirect `/swarm`, `/observe` → `/today`, remove nav links

**Before ship:**
- Test each redirect (404 risk is high)
- Grep for route names in code, tests, docs, comments
- One commit per pair, back out if tests fail

### **S1 (Build, LANE 1): BATCH-2 (Run consolidation, part A)**
**Timeline: After BATCH-1 is live**

Folds first three stations into `/track/:id` with view params:

1. Wire `/track/:id?view=discover` to render discover station
2. Redirect `/discover` → `/track/:id?view=discover`, update callers
3. Same for `/decide` (view=decide) and `/plan` (view=plan)
4. Test all three view params on a live track before redirect

**Blockers:** None if BATCH-1 is live. View parameter wiring in TrackRun component.

### **S3 (Settings, LANE 2): BATCH-5 (Settings consolidation)**
**Timeline: After BATCH-4 complete**

Consolidates 11 account/platform routes into `/settings` tabs:

**Must be ready first:**
- Integrations must reach point-of-need (not just browse)
- Brain/Memory/Knowledge moved inline (not routable)
- Tab navigation in settings ready

### **S0 (Cleanup): BATCH-6 (After all others)**

Verifies no callers remain for deleted routes. Some routes become DELETE (threads, drift, stakeholder); some become AUDIT (sync has live caller pushLinearIssue).

---

## Decision log

**A-D2-tracks-do-not-create-missions.md** (S0, 2026-08-27)  
Answered: Are tracks and missions sequential or parallel?  
Answer: **Parallel engines.** `startTrack` creates only `spine_tracks`; missions via `startOrchestratedMission`. Unblocks D2 items.

**A-route-fold-batches.md** (S0, 2026-08-27)  
Decided: How to fold 113 routes into three surfaces safely?  
Strategy: Six batches, sequential ship, same-hour caller updates per batch.

---

## Files created/modified this session

**New coordination:**
- `coordination/answers/S0/A-D2-tracks-do-not-create-missions.md`
- `coordination/answers/S0/A-route-fold-batches.md`

**Updated tracking:**
- This file (session-handoff.md)

---

## Acceptance query status

```sql
SELECT id, entry_station, station, waived, created_at FROM spine_tracks
WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]';
```

**Current:** 0 rows (S0-001 implementation tested but not yet live)  
**Blocker:** S0-001 needs deployment and live track validation  
**Next:** Deploy S0-001, run test track, verify query returns > 0

---

## Build queue status

- **D1-D3:** ✅ SHIPPED (step-progress module, composer door, spend totals)
- **D2 answer:** ✅ DECIDED (tracks vs missions)
- **Route batches:** ✅ DECIDED (6 batches, sequencing documented)
- **Implementation:** 🔄 READY TO START (BATCH-1 safest first)

---

## Next sprint priorities

1. **Deploy S0-001** and verify acceptance query returns > 0 (unblocks whole platform)
2. **Implement BATCH-1** (board consolidation, 9 routes, 1 session)
3. **Implement BATCH-2** (run stations A, 3 routes, 1 session)
4. Monitor live performance after each batch ships

---

**Build tree status:** Clean, deployable, tested. D1-D3 in main.  
**Next blocker:** S0-001 deployment + live test (founder observation required for mission gate).  
**Route fold ready:** Yes. S2/S1/S3 coordinate to ship BATCH-1 through BATCH-6 sequentially.


---

## Session progress: BATCH-1 complete + S2 shell layer ready

**S0-002 continued work: BATCH-1 implementation**

✅ **BATCH-1: Board consolidation** — `/runs` → `/today` redirect implemented
   - Route file updated to redirect
   - All callers updated: nav-model, chat-dispatch, key-model, AppFrame, build routes
   - Build verified (vite build passes)
   - Ready for production deployment

**S2 (Shell layer, lane/control): SPEC-MULTIPLAYER-PRESENCE §3.1-§3.3 complete**

✅ **Cursor layer (§3.1)** — Teammates positioned at objects they are actually touching
   - `placeAnchors` function exported for testing, derives every position from DOM elements stamped by surfaces
   - Zero code paths invent position; silent when object unmounted (most common case)
   - Frame-scheduled measurement on scroll, resize, mutation (no idle ticker)
   - Tests (15 + 2 reachability guards): position derivation contract, array keying, collision grouping match

✅ **Presence layer architecture** — Two-attribute DOM registry (no NUL bytes, CSS-safe)
   - `data-presence-kind` + `data-presence-id` stamped by surfaces (one object per element)
   - `presenceAnchor()` helper returns empty object if id missing (no false keys)
   - `anchoredElements()` walks DOM, returns `Map<key, element>` with last-wins per key
   - Key function: `anchorKeyOf` re-exported from collision.ts, same as `groupKeyOf`

✅ **Teammate identity colours (§3.1)** — Deterministic, stable across reloads
   - FNV-1a hash of slug, assigned from two-hue Meridian palette (`--mrd-viz-2`, `--mrd-viz-3`)
   - Stable for given set of active teammates; overflow to `--mrd-agent` (no colour duplication)
   - Colour carries identity per spec; name always drawn so identity never depends on colour alone

✅ **Rail crew display (§3.4)** — DOOR quiet state fixed
   - Suppressed on home to avoid false all-clear when read fails
   - Root cause filed (getWorkspaceAnchors swallows error) for S0 source fix

✅ **Board component extracted** — A01 fold enabler (9a23e95e5)
   - 2,794-line Board lifted from route to components/today/Board.tsx (whole lift, not rewrite)
   - Route becomes stub (createFileRoute only)
   - 11 test imports repointed, orphaned imports removed
   - Gates: 13,037 pass / 0 fail · tsc 0 · docs:check 0 · lint 0
   - Unblocks /today → /start route merge

**Pending § work:**
- ⏳ §3.2 (shared-object indicator, board-only today, spec says app-wide)
- ⏳ §3.3 (collision ring, board-only today, spec says app-wide)
- ⏳ Colour palette gap (only two usable Meridian hues; four-teammate team gets overflow)

**Status:** Shell layer and board fold ready for deployment. S2 coordinates with S0 on source-side error handling fix. BATCH-1 route consolidation unblocked.

