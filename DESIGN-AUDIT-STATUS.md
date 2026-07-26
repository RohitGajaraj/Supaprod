# Design Audit Status — Waves 1-2 Completion

> **Date:** 2026-07-25 · **Status:** BLOCKED ON BUILD · **Mandate:** Exhaustive audit + fixes before Wave 3

---

## Current Blockage

**TypeScript build errors prevent proceeding:**

The codebase has missing module implementations from recent feature work:
- `@/lib/build/driver`
- `@/lib/build/verification`
- `@/lib/build/repo-gate`
- `@/lib/build/design-gate` and `design-gate.server`
- `@/lib/build/ard-block`
- `@/lib/build/native.server`
- `@/lib/build/template`
- `@/components/build/CompositeReviewCard`

These are referenced in:
- `src/lib/build.functions.ts`
- `src/lib/new-build.functions.ts`
- `src/lib/studio.functions.ts`
- Several component files

**Impact:** Cannot run `bun run dev` or tests to audit interactive states, responsive behavior, or animation smoothness. TypeScript check fails with 18+ errors.

---

## Work Completed So Far

### ✅ Fixes Applied (not yet committed)
1. **GauntletMetricsPanel inline-style footgun** → Changed `style={{ fontFamily: "var(--font-pixel)" }}` to use `className="font-pixel"` with Tailwind utilities for sizing/color
2. **RoadmapColumns Rules-of-Hooks** → Verified already fixed (hooks declared before early returns)
3. **Cascade-layer focus-ring footgun** → Documented as known limitation (acknowledged in code at lines 2160-2171)

### ✅ Documentation
1. Created `docs/design/WAVE-1-2-AUDIT-BASELINE.md` with:
   - All known unfixed issues inventory
   - 8-point comprehensive audit framework (A-H: tokens, typography, spacing, components, motion, a11y, responsive, consistency)
   - Surface prioritization (71 total, 6 Tier-1 high-impact)
   - Verification checklist
   - Success criteria

---

## Unblock Path (Choose One)

### Option A: Implement Missing Modules (Recommended)
Create stub implementations or real implementations for the 8 missing modules. This is roughly:
- 4-6 hours of work to implement minimal functionality
- Required for PC-35 (BuildDriver), PC-36 (Ask v2), PC-37 (Density pass) to work
- Necessary before the app can run at all

**What this enables:** Dev server runs, tests pass, design audit can proceed

### Option B: Defer Missing Features
Comment out or stub the missing imports to unblock the build, then:
1. Audit design on existing features (71 surfaces, ~80% implemented)
2. Implement missing modules in parallel
3. Re-audit after module work completes

**What this enables:** Design audit proceeds on existing surfaces while module work happens in parallel

### Option C: Skip to Wave 3 Prep
Accept that Waves 1-2 design audit cannot complete in this session due to build state. Document findings and defer to next session after modules are implemented.

**What this enables:** Cleaner separation of concerns (fix build, then audit)

---

## Recommendation

**Option A is cleanest** — the missing modules are blocking multiple PC items and the design audit. Better to fix root cause (implement modules) than patch around it.

**Next Session Should:**
1. Implement the 8 missing build modules (or minimal stubs that satisfy type-check)
2. Verify `bun run dev` and tests pass clean
3. Resume exhaustive design audit on Tier-1 surfaces (today, discover, decide, build, brain, trust-ledger)
4. Apply fixes systematically
5. Verify against Vercel's Geist live (component-by-component comparison)

---

## Temp Fix (If Not Implementing Modules Yet)

To unblock the dev server for design work:

```bash
# Create minimal stub files in src/lib/build/
touch src/lib/build/{driver,verification,repo-gate,design-gate,design-gate.server,ard-block,native.server,template}.ts
echo "// Stub - pending implementation" > src/lib/build/driver.ts
# Repeat for others...
```

This allows TypeScript check to pass without full implementations, enabling `bun run dev` to start for interactive testing.

---

## Success Criteria When Unblocked

Once the build is clean, the audit is complete when:
- ✅ No component has inline styles (except dynamic/data-driven values via `style={{ }}`)
- ✅ All colors use `var(--ds-*)` tokens
- ✅ All typography uses text classes (`text-heading-*`, `text-label-*`, `text-copy-*`)
- ✅ All spacing follows 4px grid (8/12/24/32px)
- ✅ Every interactive state (hover, focus, disabled, loading, error, empty) is visually distinct
- ✅ Motion uses swift easing, respects `prefers-reduced-motion`
- ✅ a11y complete: aria-labels, focus rings visible, keyboard nav works
- ✅ Responsive tested on mobile (375px), tablet (768px), desktop (1440px)
- ✅ All 71 surfaces consistent in component usage, terminology, interaction patterns
- ✅ Design system docs (DESIGN-TEMPO.md) fully in sync with code
- ✅ Live product matches Vercel Geist in polish, restraint, intentionality

---

## Files Ready to Commit

Once build is fixed:
- `src/components/observe/GauntletMetricsPanel.tsx` — inline-style fix applied
- `docs/design/WAVE-1-2-AUDIT-BASELINE.md` — audit framework + baseline

Commit message:
```
fix(design): GauntletMetricsPanel inline-style footgun, add audit baseline

(why: GauntletMetricsPanel was using inline style for font sizing instead of
Tailwind classes. Fixed to use className="font-pixel text-7xl text-primary".
Added comprehensive audit baseline (WAVE-1-2-AUDIT-BASELINE.md) documenting
known issues, audit framework, prioritization, and success criteria.)
```
