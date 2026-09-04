# Wave 3 Implementation Plan — Materials & Spacing System

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Target:** Complete spacing and materials system migration to align 405+ components with Tempo v5 specification.

**Scope:** ~1,374 CSS property instances (box-shadow, padding, margin, gap) that cannot be simplified.

**Success Criteria:**
- All hardcoded padding/margin replaced with `--ds-spacing-*` or `--geist-space-*` tokens
- All box-shadow values use elevation token system
- Control heights conform to 32/36/40px spectrum
- Gap spacing uses 24px/12px/8px/32px rhythm
- Responsive clamp functions preserved (computed values stay as-is)
- Zero regressions, tsc 0, lint 0, tests pass

---

## Tempo v5 Spacing Specification (Contract §5)

### Base Unit
- **4px grid base** across all layouts and spacing.

### Spacing Ramp
- Gap rhythm: `24px` (section separator), `12px` (half), `8px` (quarter), `32px` (major section)
- Standard padding/margin scale: `4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 40px, 48px`

### Control Heights
- Small: `32px`
- Medium: `36px` (default)
- Large: `40px`

### Page Width
- Maximum content width: `1400px` (`--ds-page-width`)

### Materials (Elevation)
- Popovers: `6px` padding, `36px` row height, `6px` row radius
- Shadow tokens: `--ds-elevation-*` for shadows (cards, modals, popovers)
- No arbitrary box-shadow values; all shadows route through tokens

---

## Current State Analysis

### Existing Spacing Tokens (src/styles.css)
```css
--spacing-page-gutter: 24px;      /* ✅ Aligned to spec */
--spacing-card-pad: 16px;          /* ✅ Aligned to spec */
--spacing-control-h: (varies)      /* Needs audit */
--spacing-row-h: (varies)          /* Needs audit */
```

### Coverage Needed
- **Instances to migrate:** 4,079+ (grep: box-shadow, padding, margin, gap)
- **Components affected:** ~405 files
- **Density pass status:** PC-37 (2026-07-12) started this work; Wave 3 completes it

---

## Phase 1: Token Definition (2-3 hours)

### 1A. Spacing Token Audit
**Objective:** Map all hardcoded spacing values → standardized token names

**Task:** Grep all instances of padding, margin, gap and categorize by value:
- `4px` → `--ds-spacing-xs` (or `gap-1` in Tailwind)
- `8px` → `--ds-spacing-sm` (or `gap-2`)
- `12px` → `--ds-spacing-md` (or `gap-3`)
- `16px` → `--ds-spacing-lg` (or `gap-4`)
- `24px` → `--ds-spacing-xl` (or `gap-6`)
- `32px` → `--ds-spacing-2xl` (or `gap-8`)

**Deliverable:** Audit CSV with columns: [File, Property, Current Value, Target Token]

### 1B. Materials Token Audit
**Objective:** Standardize box-shadow values

**Task:** Identify all `box-shadow` instances and group by visual intent:
- Thin hairline (card borders) → Use border instead
- Elevation-1 (subtle shadow) → `--ds-elevation-low`
- Elevation-2 (medium shadow) → `--ds-elevation-medium`
- Elevation-3 (high shadow) → `--ds-elevation-high`

**Deliverable:** Materials token mapping + implementation guide

### 1C. Token Definition in CSS
**Objective:** Add Tempo-aligned token definitions to src/styles.css

**Implementation:**
```css
/* Spacing scale (4px base) */
--ds-spacing-xs: 4px;
--ds-spacing-sm: 8px;
--ds-spacing-md: 12px;
--ds-spacing-lg: 16px;
--ds-spacing-xl: 24px;
--ds-spacing-2xl: 32px;
--ds-spacing-3xl: 40px;
--ds-spacing-4xl: 48px;

/* Materials (elevation shadows) */
--ds-elevation-low: 0 2px 4px rgba(0, 0, 0, 0.12);
--ds-elevation-medium: 0 4px 8px rgba(0, 0, 0, 0.16);
--ds-elevation-high: 0 8px 16px rgba(0, 0, 0, 0.20);
```

---

## Phase 2: Padding & Margin Migration (4-5 hours)

### 2A. Batch 1 — High-frequency patterns
**Scope:** Components using 16px padding (card-pad standard)

**Pattern:** `padding: "16px"` → `padding: "var(--ds-spacing-lg)"` or `className="p-4"`

**Task:**
1. Find: `grep -r "16px" src/components --include="*.tsx"` in style props
2. Review component intent (card, section, container)
3. Replace with appropriate token or class
4. Verify visual consistency

**Expected instances:** ~400-600 (largest batch)

### 2B. Batch 2 — Gap spacing (layout rhythm)
**Scope:** Flexbox/grid gap values (24px, 12px, 8px, 32px)

**Pattern:** `gap: "24px"` → `gap: "var(--ds-spacing-xl)"` (section spacing)

**Task:**
1. Find: `grep -r "gap:" src/components --include="*.tsx"`
2. Categorize by intent (section, row, item)
3. Map to rhythm: `32px` (major) → `24px` (standard) → `12px` (compact) → `8px` (minimal)
4. Replace with tokens

**Expected instances:** ~200-300

### 2C. Batch 3 — Margin cleanup
**Scope:** Margin on elements (usually implies missed gap opportunity)

**Pattern:** `margin: "12px"` → Review if should be gap instead

**Task:**
1. Find: `grep -r "margin:" src/components --include="*.tsx"`
2. Audit: Is this margin serving as spacing between siblings (use gap)? Or push content away (use margin)?
3. Convert margins to gaps where appropriate, or margin tokens where needed
4. Document any special cases (scroll offset, sticky positioning, etc.)

**Expected instances:** ~150-250

---

## Phase 3: Box-Shadow & Materials (2-3 hours)

### 3A. Shadow Audit
**Task:**
1. Find: `grep -r "box-shadow" src/components --include="*.tsx"`
2. Group by visual pattern (card shadow, hover lift, focus ring, modal backdrop)
3. Map each to elevation token

**Mapping Example:**
```
Original: box-shadow: "0 1px 3px rgba(0,0,0,0.1)"
→ Mapped to: --ds-elevation-low (card subtle shadow)

Original: box-shadow: "0 4px 12px rgba(0,0,0,0.15)"
→ Mapped to: --ds-elevation-medium (card hover lift)

Original: box-shadow: "0 20px 25px rgba(0,0,0,0.2)"
→ Mapped to: --ds-elevation-high (modal shadow)
```

### 3B. Shadow Implementation
**Task:**
1. Add elevation tokens to src/styles.css (if not present)
2. Replace hardcoded box-shadow with `box-shadow: var(--ds-elevation-*)`
3. Verify visual consistency (no shadow jumps, smooth elevation progression)

**Expected instances:** ~150-200

---

## Phase 4: Control Height Standardization (1-2 hours)

### 4A. Button & Input Height Audit
**Task:**
1. Find buttons with hardcoded heights: `grep -r "height.*px" src/components --include="*.tsx"` in button contexts
2. Verify all buttons snap to 32/36/40px spectrum
3. Map: Small buttons (tags, pills) → `32px`, Standard (forms) → `36px`, Large (hero CTAs) → `40px`

### 4B. Implementation
**Task:**
1. Replace: `height: "36px"` → `height: "var(--ds-size-medium)"`
2. Update Tailwind classes: `h-9` (36px default) stays, but add token aliases
3. Verify: tsc, build, tests

**Expected instances:** ~50-100

---

## Phase 5: Responsive & Special Cases (1-2 hours)

### 5A. Clamp Functions (PRESERVE)
**Patterns that stay as-is:**
- `padding: "clamp(16px, 2vw, 32px)"` (responsive padding)
- `gap: "max(16px, calc(env(safe-area-inset-left) + 16px))"` (safe area)
- `margin: "calc(100% - 1400px) / 2"` (centering computation)

**Task:** Identify and document these; DO NOT SIMPLIFY.

**Expected instances:** ~80-120 (documented as Wave 3 exceptions)

### 5B. Vendor-specific & Animation Properties
**Patterns that stay:**
- `transition: "all 150ms var(--ds-motion-timing-swift)"`
- `@media (prefers-reduced-motion: reduce)` blocks
- Filter, transform, backdrop-filter values

**Task:** Leave unchanged; verify motion tokens are correctly referenced.

---

## Phase 6: Validation & Testing (2-3 hours)

### 6A. Code Quality Checks
1. `bun run build` — Verify build succeeds
2. `bun run lint` — ESLint, Prettier pass
3. `bun run tsc` — TypeScript strict mode (0 errors)
4. `bun test` — Unit tests pass (4650+ tests)

### 6B. Visual Regression Testing
1. Start dev server: `bun run dev`
2. Visual audit at 375px, 768px, 1440px (same as Wave 1-2)
3. Spot-check:
   - Card padding consistent (should be `var(--ds-spacing-lg)` = 16px)
   - Gap spacing rhythm maintained (24px sections, 12px rows)
   - Button heights correct (36px default)
   - No shadow jumps on hover/active states
   - Focus rings unchanged
4. Screenshot key surfaces

### 6C. Accessibility Re-check
1. Tab navigation still works (spacing changes shouldn't affect focus order)
2. Touch targets still ≥44px (if using 36px controls, verify clickable area)
3. Color contrast unchanged (spacing doesn't affect contrast)

---

## Implementation Strategy

### Lane Allocation
**Goal:** Complete Wave 3 in 12-18 hours of focused work

**Sequence:**
1. Phase 1 (Tokens): 2-3 hours — Define all tokens, audit existing code
2. Phase 2 (Padding/Margin): 4-5 hours — Largest batch, highest visual impact
3. Phase 3 (Shadows): 2-3 hours — Elevation token system
4. Phase 4 (Control Heights): 1-2 hours — Button/input standardization
5. Phase 5 (Special Cases): 1-2 hours — Document and preserve computed values
6. Phase 6 (Validation): 2-3 hours — Testing and sign-off

### Parallelization Opportunities
- Phase 1A (Padding audit) + 1B (Shadow audit) can run in parallel
- Phase 2 (Padding/Margin) + Phase 3 (Shadows) can overlap if audits are pre-done
- Phase 4 (Control Heights) is independent and can start anytime

### Dependencies
- **Blocker:** Phase 1 token definitions must complete before Phase 2 starts
- **Critical path:** Phase 1 → Phase 2 → Phase 6 (tokens → migration → testing)

---

## Success Metrics

| Metric | Target | Verification |
| --- | --- | --- |
| Spacing instances migrated | ≥90% (3600+ of 4079) | grep count before/after |
| Build success | 0 errors | `bun run build` passes |
| Lint clean | 0 warnings | `bun run lint` passes |
| TypeScript clean | 0 errors | `bun run tsc` returns 0 |
| Tests pass | 4650+ | `bun test` green |
| Visual regression check | 0 regressions | Screenshots at 3 breakpoints |
| No horizontal scroll | All breakpoints | Responsive audit |
| Control heights correct | 36px default | Manual inspection |
| Accessibility maintained | WCAG AA | Tab navigation, contrast ✅ |
| Token coverage | 100% | Audit spreadsheet |

---

## Assumptions & Risks

### Assumptions
- Computed values (clamp, calc, max) are preserved
- Tailwind class names (p-4, gap-6, etc.) are already correct
- No new design tokens needed beyond spacing + elevation

### Risks
- **Large scope:** 4079+ instances could reveal edge cases
- **Responsive clamp functions:** Some may be hard to categorize (mitigation: preserve by default)
- **Legacy spacing:** Old code may have non-standard values (mitigation: audit + document exceptions)
- **Testing gap:** Can't manually test all components (mitigation: E2E suite at 375/768/1440px)

---

## Deliverables

1. **Token definitions** — CSS additions to src/styles.css
2. **Migration audit** — CSV of all changes made
3. **Wave 3 completion report** — Test results, before/after screenshots
4. **Exception log** — All preserved values (clamp, calc, special cases)
5. **Commit history** — Git commits with clear WHY messages

---

**Estimated Total Time:** 12-18 hours  
**Status:** Ready to start  
**Blocker:** None — Wave 1-2 approved, no dependencies

