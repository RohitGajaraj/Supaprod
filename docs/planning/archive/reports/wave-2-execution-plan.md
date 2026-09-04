# Wave 2 Execution Plan — Architectural Port to Tempo v5

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Start Date:** 2026-07-25  
**Scope:** Complete architectural migration from legacy hand-rolled styles to Tempo v5 design system across all authenticated-app components  
**Target:** Vercel/Linear/Stripe/Notion/Figma/Arc/Anthropic/Perplexity premium standard  
**Status:** In execution (replacing failed parallel-workflow approach with serial, fully-verified batches)

---

## Executive Scope

**What Wave 2 accomplishes:**
- Consolidate dual Button systems (Obsidian legacy + Tempo ui/button) into single coherent grammar
- Migrate 1374 inline padding/margin instances to 4px-rhythm design tokens
- Replace hand-rolled styles with material-* elevation presets (6 roles: base/small/medium/large on-page, tooltip/menu/modal/fullscreen above)
- Migrate all ad-hoc font-size+weight pairs to type-heading/label/copy class system
- Fix spacing grid (everything to multiples of 4px)
- Verify motion easing (swift-in/swift-out only per Tempo spec)
- Add/verify empty-state patterns (icon + headline + one-line copy)
- Complete a11y audit (aria-labels on icon-only, focus-visible on all interactive, keyboard handlers on role="button")
- Test all interactive states: hover/focus/active/disabled/loading/error/empty
- Verify responsive breakpoints and accessibility

**Impact:** ~160 component files across routes + component directories

**Testing protocol:**
- Dev server: `bun run dev` + manual inspection of every audit batch
- Component audit: Interact with each component in isolation (hover, focus, nested states, loading, error)
- A11y: VoiceOver/browser a11y inspector on every interactive element
- Responsive: Test at 375px (mobile), 768px (tablet), 1440px (desktop)
- Grayscale: Verify meaning reads without color
- Performance: Check for re-render thrashing, measure motion smoothness

---

## Batch Sequence (Highest-Impact First)

### **BATCH 1: Button Consolidation (58 files, ~163 instances)**
- **Priority:** CRITICAL — visual hierarchy controls affect every screen
- **Work:**
  - Audit Obsidian Button (`src/components/obsidian/primitives.tsx`) variants: primary/secondary/tertiary/link/quiet
  - Audit ui/Button (`src/components/ui/button.tsx`) variants: default/accent/secondary/tertiary/ghost/outline/link/destructive/warning
  - Map Obsidian variants → Tempo equivalents (primary→accent filled, secondary→neutral filled, etc.)
  - Update all 163 button instances across codebase
  - Remove Obsidian Button gradient (Loom v4 era — use solid fill per Tempo)
- **Verification:**
  - Render 10 representative screens in dev server (today, discover, build, plan, settings, admin, etc.)
  - Verify visual consistency across all button styles
  - Test focus ring (should be ember per fix)
  - Test disabled state (opacity-50 + cursor-not-allowed)
  - Test hover/active state contrast
  - Verify one accent button per screen rule holds
- **Commit:** `feat(design): consolidate button variants to Tempo grammar (163 instances, 58 files)`

### **BATCH 2: Type-Class Migration (Highest-Value Targets)**
- **Priority:** HIGH — typography appears on every surface
- **Work:**
  - Identify all ad-hoc `style={{fontSize, fontWeight, lineHeight}}` pairs
  - Replace with `text-heading-*`, `text-label-*`, `text-copy-*` Tailwind classes or var(--text-*) tokens
  - Check DESIGN-TEMPO.md §3 for type-class spec
  - Start with: page titles, card titles, labels, body copy, captions, metadata
  - Start with: 20 highest-visibility files (today, discover, build, plan, settings, admin, etc.)
- **Verification:**
  - Visual consistency check: All titles same size/weight within role
  - All labels readable at target size
  - All copy legible at small sizes
  - Heading hierarchy correct (h1/h2/h3 or semantic equivalents)
  - Responsive: type scales correctly at mobile/tablet/desktop
- **Commit:** `feat(design): migrate type to Tempo class system (Batch 2A: highest-visibility surfaces)`

### **BATCH 3: Material Preset Migration + Spacing (58 files)**
- **Priority:** HIGH — controls affordance and visual hierarchy
- **Work:**
  - Audit all component-level `style={{boxShadow, borderRadius}}` pairs
  - Replace with material-base / material-small / material-medium / material-large / material-tooltip / material-menu / material-modal / material-fullscreen classes
  - Fix spacing: All `margin/padding` values not divisible by 4px → nearest 4px multiple
  - Reference: `src/styles.css` token definitions for material-* classes
  - Prioritize: Card components, panels, modals, dropdowns, popovers
- **Verification:**
  - Open dev server, inspect computed styles on 5 representative cards/panels
  - Verify shadow depth matches role (base < small < medium < large)
  - Verify radius is consistent (8px for base, 12px for components, etc.)
  - Spacing grid inspection: All gaps divisible by 4px
  - Focus ring visibility on all interactive children
- **Commit:** `feat(design): apply material presets and 4px-rhythm spacing (Batch 3)`

### **BATCH 4: Empty-State Pattern Audit + Additions (20 files)**
- **Priority:** MEDIUM-HIGH — empty states define product personality
- **Work:**
  - Audit all empty states across app (no results, nothing built yet, no connections, etc.)
  - Reference pattern: Icon (48-56px lucide) + Headline (text-heading-3 or text-label-2) + One-line copy (text-copy-sm) + Optional CTA
  - Add missing patterns: Build index, Brain stats, Settings empty sections
  - Verify Geist Pixel brand moments (max 1 per screen, heroes/empty-states only)
- **Verification:**
  - Navigate to empty states in: Today, Discover, Build, Plan, Brain, Connections, Settings
  - Verify pattern consistency (icon + headline + copy format)
  - Verify Pixel usage is sparse (not overused)
  - Verify copy tone matches app voice (humanized, plain words, no AI fingerprints)
- **Commit:** `feat(design): standardize empty-state patterns and Geist Pixel moments`

### **BATCH 5: Interactive States Audit (Focus/Hover/Active/Disabled/Loading/Error)**
- **Priority:** MEDIUM-HIGH — interactive feedback is critical for usability
- **Work:**
  - Audit all interactive components (buttons, links, form inputs, chips, tabs, toggles, selects, popovers, dropdowns)
  - Verify hover state: background/border change + cursor change (pointer for clickable)
  - Verify focus state: focus-visible outline (ember) present on all keyboard-accessible controls
  - Verify active state: higher contrast or fill change
  - Verify disabled state: opacity-50 + cursor-not-allowed
  - Verify loading state: spinner overlay or inline spinner (match SkeletonBlock pattern)
  - Verify error state: error message (not generic "Something went wrong"), error color (#f87171 red), optional error icon
- **Verification:**
  - Open dev server, tab through every interactive element on 5 key screens
  - Verify focus rings visible and ember-colored
  - Hover over every button/link/input and verify state change
  - Disable controls and verify visual feedback
  - Test error paths: form validation, API failures, edge cases
  - Test loading: async operations (fetch, mutation)
- **Commit:** `fix(design): comprehensive interactive states audit and a11y fixes`

### **BATCH 6: Accessibility Complete Audit (ARIA, Keyboard, Screen Reader)**
- **Priority:** HIGH — accessibility is non-negotiable
- **Work:**
  - Audit all icon-only buttons: Add aria-label (e.g., "Close dialog")
  - Audit all form fields: Verify associated <label> or aria-label
  - Audit all interactive with role="button": Verify keyboard handler (onKeyDown for Enter/Space)
  - Audit all dialogs/modals: Verify role="dialog" + aria-label + focus trap
  - Audit all menus/dropdowns: Verify role="menu" + aria-labelledby/aria-label
  - Audit semantic HTML: Use <button> not <div role="button">, <nav> for navigation, <article> for cards
  - Verify tab order matches visual flow (no hidden tab stops, logical progression)
  - Verify focus management (opens modal → focus moves to modal, closes → focus returns)
- **Verification:**
  - VoiceOver / screen reader test on 5 screens
  - Tab through every screen without mouse
  - Verify all icons have labels
  - Verify no focus traps
  - Verify form submission keyboard-accessible
- **Commit:** `fix(a11y): comprehensive aria-labels, keyboard handlers, semantic HTML`

### **BATCH 7: Responsive + Performance Verification**
- **Priority:** MEDIUM — ensure product feels smooth at all breakpoints
- **Work:**
  - Test all screens at 375px (mobile), 768px (tablet), 1440px (desktop)
  - Verify no content overflow or hidden elements
  - Verify touch targets >= 48px (mobile)
  - Verify type scales appropriately at each breakpoint
  - Verify motion doesn't stutter (60fps expected, measure with DevTools)
  - Measure Core Web Vitals: LCP, FID, CLS
  - Check for unnecessary re-renders (React DevTools Profiler)
- **Verification:**
  - Browser DevTools: Toggle device emulation for mobile/tablet
  - Measure performance profile on representative user flow
  - Check Lighthouse score (target: 90+)
- **Commit:** `perf(design): responsive verification and motion smoothness`

---

## Testing Protocol (Per Batch)

**Before commit:**

1. **Compile & type check:** `tsc --noEmit`, `bun run lint`
2. **Dev server:** `bun run dev`, visual inspection of changed components
3. **Interactive audit:** Tab/click/hover through every component in batch
4. **A11y check:** VoiceOver / browser a11y inspector on a11y-critical components
5. **Responsive:** Check at 375px, 768px, 1440px
6. **Tests:** `bun run test` (verify no regressions)
7. **Comparison to live Vercel/Geist:** Manual check against reference

**After commit, before next batch:**
- Full regression test: `bun run test`
- Build check: `bun run build` (ensure production build succeeds)
- Spot checks on dependent surfaces (if button styles change, re-verify screens that use many buttons)

---

## Success Criteria for Wave 2 Complete

- ✅ All 58 Button files converted to single Tempo grammar
- ✅ Type uses class system across all surfaces (no ad-hoc font-size/weight pairs)
- ✅ All components use material-* presets (no inline box-shadow/borderRadius)
- ✅ All spacing follows 4px rhythm
- ✅ All empty states follow pattern (icon + headline + copy)
- ✅ All interactive states testable (hover, focus, active, disabled, loading, error visible)
- ✅ All icon-only elements have aria-labels
- ✅ All forms keyboard-accessible
- ✅ All screens responsive at 375px/768px/1440px
- ✅ Motion smooth and easing correct (swift only, no custom easing)
- ✅ Grayscale pass: meaning visible without color
- ✅ Vercel/Geist parity: Side-by-side comparison shows equivalent restraint, typography, color, spacing

---

## Execution Timeline

- **Batch 1 (Buttons):** 2026-07-25 (highest priority, affects all screens)
- **Batch 2 (Type):** 2026-07-25 or 2026-07-26 (parallel-safe, isolated work)
- **Batch 3 (Materials + Spacing):** 2026-07-26
- **Batch 4 (Empty States):** 2026-07-26
- **Batch 5 (Interactive States):** 2026-07-26–2026-07-27
- **Batch 6 (A11y):** 2026-07-27
- **Batch 7 (Responsive + Perf):** 2026-07-27
- **Review + Audit:** 2026-07-27–2026-07-28
- **Wave 2 Complete:** Target 2026-07-28

---

## Notes

- **Serial execution:** No parallel workflows; each batch fully verified before next batch starts
- **Founder autonomy mandate:** Making quality decisions independently; can escalate to higher-capability models if needed
- **Vercel/Geist reference:** Study live sites directly during execution, not from training memory
- **Testing is not optional:** Every batch requires dev server interaction + accessibility check + responsive test
- **Commit discipline:** Each batch is one atomic commit with clear WHY

---

**Status:** Batch 1 COMPLETE (committed d78d0c6d)  
**Progress:** 1 of 7 batches complete  
**Next:** Batch 2 (Type-class migration) in progress
