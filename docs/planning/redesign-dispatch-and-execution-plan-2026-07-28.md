# Supaprod App Redesign — Comprehensive Execution Plan
**Created: 2026-07-28 (continuation from 2026-07-24 handoff)**
**Status: Ready for dispatch**

---

## Executive Summary

The 2026-07-24 Fable session completed:
- ✅ 12 high-fidelity Round-3 HTML mockups (screens 10–19, 1b, 3b) authored and verified against §7 gates
- ✅ All 6 "missing" mockups now exist (completed 2026-07-24 ~09:00, all at ~110-130KB, meeting raised bar)
- ✅ 13 complete work-order packets with full specifications and dependency graphs
- ✅ Cross-file consistency verified against master timeline (brief §4)
- ❌ **Never dispatched.** Work orders remain unexecuted; the old 10-destination shell still owns login and surfaces.

**The problem:** Mission Control (the new design) is live in code but incomplete—it coexists with the legacy shell, making the experience feel disconnected. Users login to `/today` (legacy dashboard), not the redesigned journey.

**The opportunity:** All design work, all specifications, all dependencies are documented and ready. Implementation can start immediately using the 13 work-order packets as literal execution blueprints (no design rework needed).

---

## Part A: The Architectural Problem (Status quo)

### Two Shells, One Codebase

1. **Legacy shell** (`src/routes/_authenticated.tsx`, 10-destination loop)
   - 01 Discover … 07 Learn ⟳ (the loop)
   - Login lands here (`/today` as the entry point)
   - Still renders old surfaces inside old chrome

2. **Mission Control** (new shell, launched 2026-07-20, merged to main)
   - One persistent room per product
   - Full-width Spine + Thread + Canvas + Composer + Approvals tray
   - Entry point: `/m/$productId` (requires product context)
   - Renders surfaces on a `CanvasFace` contract (evidence → decision → spec → prototype → code → ship → digest)
   - Incomplete: old surfaces still render inside the new canvas, causing disconnect

### Why This Feels "Not Connected"

- Login pathway doesn't surface Mission Control prominently; old surfaces feel like the primary app
- Old surfaces (discovery, PRDs, roadmap, agents, traces) render inside Mission Control's canvas, but the design contract and depth mechanics aren't wired
- No guided narrative linking login to first mission (the 10-second comprehension test)
- Composer (the unified input) is wired but surfaces don't consume signals from it
- Approvals tray exists but doesn't visibly trigger agent motion (no "signature moment")

---

## Part B: The Design Deliverable (Complete, Verified)

### Round-3 Mockups (All 19 exist, 2026-07-24)

**Tier 1: Journey entry + onboarding**
- `screen-1-first-run.html` (old, baseline)
- `screen-1b-first-run-v2.html` (NEW, verified 2026-07-24)
- `screen-3-room-building.html` (old, baseline)
- `screen-3b-build-focus.html` (NEW, verified 2026-07-24)

**Tier 2: Core Mission Control room (the spine + faces)**
- `screen-10-discover-face.html` — Discover surface (intelligence + evidence + what to build next)
- `screen-11-decide-face.html` — Decide surface (decision board, gate approvals, PM as decision-maker)
- `screen-12-ship-face.html` — Ship surface (deployment, rollout, monitoring)
- `screen-13-learn-face.html` — Learn surface (outcomes, performance, post-ship analysis)

**Tier 3: Depth layer (secondary surfaces)**
- `screen-14-brain.html` — Brain (company memory, what we know, decision precedent)
- `screen-15-auth-and-account.html` — Auth + Account (sign-in, sign-out, workspace switching)

**Tier 4: Settings + Admin (depth behind one door)**
- `screen-16-settings-you-workspace.html` — Settings home (workspace config, billing, preferences)
- `screen-17-settings-connections-plan.html` — Integrations (OAuth, connector management, credentials)
- `screen-18-library.html` — Library (saved artifacts, shared work, promotion model)
- `screen-19-engine-room.html` — Engine Room (admin, agent skills, tool access, guardrails, MCP grants)

**Support + legacy**
- `screen-2-room-rest.html`, `screen-4-room-gated-tray.html`, `screen-5-journey-flow.html`, `screen-6-design-face.html`, `screen-7-agents-settings.html`, `screen-8-decision-board.html`, `screen-9-threads-home.html` (pre-R3, used for cross-file consistency baseline)

### Verification Status

- **Passed §7 gates** (incl. 6b quality, 6c color/focus, 6d brand truth)
  - Screens 11, 14, 15: full independent verify pass
  - Screens 10, 12, 13: verifier fix pass complete
  - All: cross-file consistency (timeline IDs: BET-35, DEC-19, LRN-13, REL-20 match across files)
- **Design law** (`_round3-brief.md`): §1-§7 complete; all surfaces comply
  - §6b: density parity with screen-3 (no over-simplification)
  - §6c: color aliveness, three-beat focus, every clickable names door + consequence
  - §6d: epitrochoid SVG mark (not dots), Google G (official), Pixel used sparingly (brand moments only)

---

## Part C: The Execution Blueprint (13 Work Orders, Ready to Dispatch)

### Wave 1 (Dispatch NOW, parallel, disjoint)

**WO-A: Account menu + sign-out** (S/M)
- Branch: `wo/a-account-menu`
- Scope: Workspace switcher, account menu, sign-out flow
- Files: `_authenticated.tsx` (chrome), account menu component tree
- Dependency: None (parallel first)

**WO-B: Strangler chrome-wrap** (M)
- Branch: `wo/b-strangler-wrap`
- Scope: Wrap old surfaces inside new Mission Control canvas; route /today → /m/$productId
- Files: MissionShell.tsx, CanvasFace.tsx, RoomChrome.tsx
- Dependency: None (parallel first)

**WO-BE-A: Build-engine seam** (S)
- Branch: `wo/be-a-seam`
- Scope: Wire Build surface (screen-10 equivalent) to engine output
- Dependency: None (parallel first)

**WO-BE-B: Build-engine board** (S/M)
- Branch: `wo/be-b-board`
- Scope: Build-stage board display, decision points
- Dependency: None (parallel first)

**WO-FID-1 through WO-FID-7: Functional fidelity (7 packets, per-surface)** (M each)
- Scope: One packet per major surface (Discover, Decide, Ship, Learn, Brain, Agents, Library)
- Dependency: Dispatch after mockups land (mockups now exist; can start immediately)

**WO-LAND: Public landing sweep** (M)
- Branch: `wo/land-public-landing`
- Scope: Landing page refresh (hero, nav, social proof, waitlist hook)
- Dependency: None (disjoint from app)

**WO-E: Demo ops** (M, ops only)
- Scope: Demo-repo GitHub OAuth seeding + pre-run missions
- **BLOCKER found 2026-07-24:** `approvals=0` is a blocker; DB re-seed required
- Dependency: Founder manual steps (GitHub OAuth config + mission pre-flight)

### Wave 2 (Start after Wave 1 merges)

**WO-C: Landing moment /start** (M)
- Branch: `wo/c-landing-moment`
- After: WO-B merges
- Scope: `/start` surface (first-run guidance, onboarding flow per screen-1b)

**WO-D: Rest beat** (S)
- Branch: `wo/d-rest-beat`
- After: WO-A merges
- Scope: Pulse/working-state ambient surfaces

**WO-BE-C: Build-engine face** (M)
- Branch: `wo/be-c-face`
- After: WO-A merges
- Scope: Build stage interactive preview + prototype rendering

**WO-EMBER: Restraint sweep** (M)
- Branch: `wo/ember-restraint-sweep`
- After: WO-A + WO-B merge
- Scope: Audit merged shell for restraint, density, focus consistency per §6c/§6d

**WO-NEW-1 through WO-NEW-8: Implement screens 10–19** (M/L each)
- After: Mockups committed to main (they are now)
- Per-screen implementation (Discover, Decide, Ship, Learn, Brain, Settings 1&2, Library, Engine Room)
- Each maps directly to mockup; specs in `round3-authoring-specs.js`

### Wave 3 (Final gate)

**WO-F: Integration gate** (S)
- Owner: Founder (single agent, merges in dependency order, runs full gate)
- Gate: All lanes pass; full tsc + build + test + demo script
- Only after all lanes merge to their branches and report done

---

## Part D: Why This Works (No Rework Needed)

1. **Mockups are authoritative.** Screens 10–19, 1b, 3b exist at the raised bar (verified against §7 gates). Use them as pixel-perfect specifications.

2. **Work orders carry full scope.** Each packet declares:
   - The WHY (intent, so you make micro-decisions)
   - Exact files (no guessing which to edit)
   - The mockup floor to match
   - Numbered steps (clear procedure)
   - Out-of-scope fence (so you don't improvise)
   - Acceptance checklist (done = done)
   - Verification gate (tsc + build + test + browser clicks)

3. **Dependency graph prevents collisions.** 13 packets + parallel-dispatch protocol means:
   - File ownership is exclusive; no merge conflicts
   - Sequenced packets wait explicitly (e.g., WO-C waits for WO-B to merge)
   - Lower-intelligence agent can execute with zero founder nudging
   - Integration gate (WO-F) merges in order, runs full suite

4. **Reuse of existing surfaces.** Most server-side logic (agent loop, tools, connectors, data models) already exists. Surfaces just need to call them and render results per mockup.

---

## Part E: The Implementation Strategy

### Phase 1: Set up the dispatch environment (1 day)

1. Create tracking document (per WO status matrix)
2. Verify each WO packet is readable and complete
3. Pre-stage branches for all Wave-1 lanes
4. Establish the integration agent (founder or TBD)

### Phase 2: Execute Wave 1 (3–4 days, parallel)

1. **WO-A, WO-B, WO-BE-A, WO-BE-B, WO-LAND, WO-E** run in parallel
2. Each lane:
   - `git pull origin main` (fresh)
   - Create branch per packet
   - Follow numbered steps exactly
   - Run acceptance checklist
   - Run verification gate (tsc + build + test + browser checks)
   - Push to lane branch
   - Report done (with brief note on any issues)

3. Founder manually gates WO-E (GitHub OAuth + mission pre-flight)

### Phase 3: Execute Wave 2 (2–3 days, sequential blocker resolution)

1. As each Wave-1 lane merges, unlock its Wave-2 blockers
2. Run WO-C, WO-D, WO-BE-C, WO-EMBER, WO-NEW-1..8 as ready
3. Each WO-NEW packet follows the exact same discipline (mockup → specs → code → gate)

### Phase 4: Integration gate (1 day)

1. Founder (or TBD integration agent) runs WO-F
2. Merges all lane branches to main in dependency order
3. Runs full suite: tsc + build + test + demo script
4. Confirms all surfaces wired, all journeys end-to-end, all gates visible

---

## Part F: Success Criteria

### By end of Phase 2 (Wave 1 complete):
- ✅ Login lands on redesigned first-run (screen-1b)
- ✅ Mission Control frame is the primary shell
- ✅ At least one major surface (Discover or Ship) renders per mockup
- ✅ Approvals tray is visible and functional
- ✅ Composer (unified input) is wired to at least one surface

### By end of Phase 4 (Integration complete):
- ✅ All 10 major surfaces implement per mockup (Tier 1 + Tier 2 + Tier 3 complete)
- ✅ Every journey entry point (10 gates) has clear next step
- ✅ Founder can run a complete flow (login → discover → decide → ship → learn)
- ✅ No orphaned surfaces; every route either deleted or integrated
- ✅ All surfaces pass restraint audit (§6c/§6d, density vs. screen-3)
- ✅ Cross-surface consistency verified (focus models, button grammar, voice, timing)
- ✅ Demo script runs end-to-end without human intervention

---

## Part G: Risk & Mitigation

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Coexisting shells cause merge conflicts | Medium | File ownership is exclusive per packet; WO-B (strangler) is Wave 1 first |
| Existing surfaces don't wire cleanly to Composer | Medium | WO-FID packets include wiring specifications; test on one surface first |
| Mockups don't match backend capabilities | Low | Mockups were authored with backend spec in hand; any gap is in spec |
| Demo seed data is stale | Medium | WO-E includes DB re-seed; founder gates it manually |
| Approvals tray doesn't visibly trigger agent motion | Medium | WO-EMBER (restraint sweep) specifically audits this; founder codes the signature moment |
| One lane blocks others | Low | Parallel-dispatch protocol reserves file ranges; no serialized dependencies in Wave 1 |

---

## Part H: What's Next (Founder Decision)

### Option 1: Dispatch all 13 lanes now
- **Pros:** Fastest timeline (2 weeks from start to demo-ready)
- **Cons:** Highest resource cost; requires 6–8 execution agents in parallel
- **Timeline:** Start: 2026-07-29 → Wave 1 done: 2026-08-02 → Wave 2 done: 2026-08-05 → Gate: 2026-08-06

### Option 2: Dispatch Wave 1 only, synthesize learnings, then Wave 2
- **Pros:** Catch integration issues early; refine approach on learnings
- **Cons:** Slower (3–4 weeks total); allows time for manual re-design if needed
- **Timeline:** Wave 1 start: 2026-07-29 → done: 2026-08-02 → learnings: 2026-08-03 → Wave 2: 2026-08-04 → Gate: 2026-08-07

### Option 3: Start with ONE high-value lane (WO-A or WO-B) for proof-of-concept
- **Pros:** Lowest risk; proves the packet execution model works; teaches the next lanes
- **Cons:** Highest calendar time; delays full experience
- **Timeline:** WO-A POC: 2026-07-29 → 2026-07-31 → learnings → full dispatch

**Recommendation:** Option 1 (all lanes, 2-week sprint). The packets are complete and verified; the parallel-dispatch protocol prevents collisions; founder-class agents can execute without rework.

---

## Appendices

### A. Document Map
- **Mockup floor:** `docs/planning/front-end-reimagining/mockups/_round3-brief.md` (design law, §1-§7)
- **Work orders:** `docs/planning/front-end-reimagining/work-orders/` (13 packets + README + dispatch protocol)
- **Authoring specs:** `docs/planning/front-end-reimagining/work-orders/round3-authoring-specs.js` (per-screen details)
- **Prior session:** `docs/planning/front-end-reimagining/work-orders/SESSION-HANDOFF-2026-07-24.md` (status as of handoff)
- **Implementation notes:** `docs/planning/front-end-reimagining/problem-statement.md` (founder's core test + 12 hard invariants)

### B. Code Entry Points
- **App shell:** `src/routes/_authenticated.tsx` (legacy, to be strangled)
- **Mission Control:** `src/routes/_authenticated.m.$productId.tsx` (new, to be expanded)
- **Components:** `src/components/mission/` (shell, Spine, Canvas, Composer, RoomChrome)
- **Server logic:** `src/lib/*.functions.ts` (domain-specific server-functions)
- **Surfaces:** `src/routes/_authenticated.<surface>.tsx` (one per domain; to be converted to `CanvasFace` renderers)

### C. The Parallel-Dispatch Protocol

1. **Branch naming:** `wo/<id>-<slug>` (e.g., `wo/a-account-menu`)
2. **File ownership:** Exclusive per packet; no cross-editing
3. **Sequenced blockers:** WO-C waits for WO-B merge; WO-D waits for WO-A merge
4. **Verification per lane:** `bunx tsc --noEmit && bun run build && bun test` + browser checks
5. **Integration gate:** One founder agent merges all, runs full suite, approves

### D. Definition of Done (Per Packet)

- ✅ All numbered steps completed
- ✅ Code compiles (tsc + build)
- ✅ Tests pass
- ✅ Browser checks pass (dev server, manual clicks per acceptance checklist)
- ✅ Matches mockup (visual + interaction)
- ✅ Acceptance checklist items marked complete
- ✅ Branch pushed (explicit refspec: `git push origin <branch>:main`)
- ✅ Brief status note posted (WHY the change; any issues found)

---

**Status: Ready for founder dispatch decision.**

**Next action: Founder selects Option 1, 2, or 3. Then execute WO-A/WO-B/WO-BE-A/WO-BE-B/WO-LAND/WO-E in parallel per protocol.**
