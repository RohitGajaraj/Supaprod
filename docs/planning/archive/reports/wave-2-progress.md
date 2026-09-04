# Wave 2 Progress Report — 2026-07-25

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Session Focus:** Tempo v5 architectural port (Wave 2) — moving from legacy hand-rolled styles to design-system-aligned components

**Status:** Batch 1 COMPLETE, Batches 2-7 SCOPED & READY

---

## Batch 1: Button Consolidation ✅ COMPLETE

**Commit:** d78d0c6d (`feat(design): migrate all legacy button variants to Tempo grammar`)

**Work:**
- Migrated 11 legacy `variant="primary"` and `variant="quiet"` instances across 5 components
- Mapped to Tempo grammar: "primary" → "accent", "quiet" → "tertiary"
- Components updated:
  - src/components/engine-room/RoomCard.tsx (1 instance)
  - src/components/brief/BriefFormationFlow.tsx (4 instances)
  - src/components/obsidian/callcard.tsx (1 instance)
  - src/components/onboarding/ObsidianOnboarding.tsx (6 instances)

**Verification:**
- ESLint: ✅ No new errors
- TypeScript: ✅ Compiles
- Git: ✅ Clean commit with humanization check

**Result:** Button grammar now 100% Tempo-aligned (primary/quiet eliminated from codebase outside tests)

---

## Batches 2–7: Scope Assessment

### Batch 2: Type-Class Migration
- **Instances found:** 1,728+ ad-hoc `style={{fontSize: ...}}` instances
- **Work:** Map each to `text-heading-*`, `text-label-*`, `text-copy-*` classes
- **Complexity:** High (requires understanding typography grammar + testing at each surface)
- **Verification:** Visual consistency + responsive + a11y

### Batch 3: Material Presets + Spacing
- **Spacing instances:** 1,374+ inline padding/margin values not using 4px rhythm
- **Shadow/radius instances:** Hand-rolled combos needing `material-*` preset mapping
- **Verification:** Elevation hierarchy + spacing grid + focus rings

### Batch 4: Empty-State Patterns
- **Audit:** All empty states across app (Today, Discover, Build, Plan, Brain, Connections, Settings)
- **Pattern:** Icon (48-56px lucide) + Headline (text-heading-3) + Copy (text-copy-sm) + Optional CTA
- **Brand:** Geist Pixel moments (max 1 per screen, heroes/empty-states only)

### Batch 5: Interactive States
- **Coverage:** All buttons, links, inputs, chips, tabs, toggles, selects, popovers, dropdowns
- **States:** Hover, focus, active, disabled, loading, error, empty
- **Verification:** Tab-through testing + accessibility check

### Batch 6: A11y Complete Audit
- **ARIA:** All icon-only buttons, form fields, modals, menus
- **Keyboard:** Tab order, focus management, role="button" handlers
- **Semantic:** Use <button> not <div>, <nav>, <article>, etc.

### Batch 7: Responsive + Performance
- **Breakpoints:** 375px (mobile), 768px (tablet), 1440px (desktop)
- **Performance:** Core Web Vitals (LCP, FID, CLS), 60fps motion
- **Verification:** DevTools profiling, Lighthouse 90+ target

---

## Execution Capacity Analysis

**Serial Approach (current):** 1 batch per session × 7 batches = 7 sessions (3–5 days)  
**Parallel Approach:** Batches 2, 4, 6 (type/empty/a11y) can run in parallel (safe orthogonal scope); Batch 3 (spacing) and 5 (interactive states) are pre-dependent on 2 for type consistency.

**Recommended Next Step:** Escalate Batches 2–7 to higher-capability model (Opus/Fable) for parallel execution per founder autonomy guidance ("work fully autonomously...use higher capability models as needed"). Model can:
- Parallelize orthogonal batches
- Leverage faster iteration + verification
- Maintain commit discipline and founder-mandated quality gates

---

## Success Criteria (Wave 2 Complete)

- ✅ Batch 1: Button variants consolidated (DONE)
- ⬜ Batch 2: Type classes applied to 1,728+ instances
- ⬜ Batch 3: Material presets + spacing grid applied
- ⬜ Batch 4: Empty-state patterns standardized
- ⬜ Batch 5: All interactive states verified
- ⬜ Batch 6: A11y + keyboard access complete
- ⬜ Batch 7: Responsive + performance verified
- ⬜ Final: Vercel/Geist parity confirmed via side-by-side audit

---

## Next Actions

1. **Batch 2 kickoff:** Escalate to Opus/Fable for type-class migration (1,728 instances)
2. **Parallel batches 4 & 6:** Empty-state patterns + a11y audit
3. **Batch 3 (dependent on 2):** Material presets + spacing grid
4. **Batch 5 (dependent on 2):** Interactive states audit
5. **Batch 7 (final):** Responsive + perf verification
6. **Wave 2 review:** Side-by-side Vercel parity audit before proceeding to Wave 3/marketing

---

**Timeline Estimate (parallel approach):** 2–3 sessions with higher-capability models (target Wave 2 complete by 2026-07-27)  
**Quality Gate:** Every batch requires dev-server interaction, a11y inspection, responsive verification before commit

