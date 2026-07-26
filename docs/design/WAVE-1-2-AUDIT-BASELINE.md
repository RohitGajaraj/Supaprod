# Waves 1-2 Exhaustive Audit Baseline

> **Status: IN PROGRESS — Systematic audit to production-grade Vercel standard**
> **Created:** 2026-07-25 · **Mandate:** Every screen, flow, component, animation, typography, spacing, icon, behavior must be audited and fixed before Wave 3 starts.

---

## Known Unfixed Issues (from transcript + prior sessions)

### 1. GauntletMetricsPanel Inline-Style Footgun
- **File:** `src/components/observe/GauntletMetricsPanel.tsx:144-145`
- **Issue:** Pixel moment added via raw `style={{ fontFamily: "var(--font-pixel)" }}` instead of Tailwind class
- **Status:** ❌ UNFIXED (agent added footgun; should be `className="font-pixel"`)
- **Impact:** Breaks established pattern; Tailwind class version used elsewhere
- **Fix:** Replace inline style with `className="font-pixel"`

### 2. RoadmapColumns Rules-of-Hooks Violation
- **File:** `src/components/plan/RoadmapColumns.tsx`
- **Issue:** Pre-existing Rules-of-Hooks violation in code
- **Status:** ❌ UNFIXED (found during QA, not addressed)
- **Impact:** React warning, potential hook execution bugs
- **Fix:** Refactor to follow hooks rules

### 3. Cascade-Layer Focus-Ring Footgun (Global)
- **File:** `src/styles.css:1980` (unlayered global rule)
- **Issue:** Global `:focus-visible { outline: 2px solid var(--focus-ring) }` always overrides component-level Tailwind utilities per CSS Cascade Layers spec
- **Status:** ⚠️ DOCUMENTED but not systematically resolved
- **Impact:** Focus ring color cannot be overridden at component level; source of truth is the `--focus-ring` token only
- **Evidence:** Empirical verification showed button with `focus-visible:outline-[var(--glacier)]` still rendered `--focus-ring` color (ember)
- **Fix:** Remove component-level focus-ring overrides; ensure `--focus-ring` token is the single source of truth

### 4. Em/En Dash Violations (Humanized Output)
- **Files:** 14 files across components and routes
- **Issue:** New comment text added with em/en dashes (AI fingerprint)
- **Status:** ✅ FIXED (Python script replaced with plain punctuation in wave 1 humanization pass)
- **Remaining Check:** Verify no new dashes have been introduced since then

---

## Audit Framework

For each surface, verify systematically:

### A. Design Tokens & Color
- [ ] All colors use `var(--ds-*)` tokens, no hex literals
- [ ] Glacier/blue used ONLY for: hyperlinks, live/running status, active machine state, named status chips
- [ ] Ember used ONLY for: one primary CTA per screen, brand moments, active states
- [ ] No decorative use of chromatic color (no ambient washes, no glows)
- [ ] Grayscale test passes (desaturate to grayscale, is affordance still clear?)

### B. Typography
- [ ] Text classes used: `text-heading-*`, `text-label-*`, `text-copy-*` (with `-mono` variants where needed)
- [ ] Never ad-hoc `font-size`/`font-weight` — always class-based
- [ ] Geist Pixel explicitly present in brand moments (heroes, empty states, AI moments) — not absent
- [ ] No over-use of Pixel (should be rare, intentional moments)
- [ ] Line height + letter spacing consistent per text class

### C. Spacing & Grid
- [ ] Base 4px grid (8/12/24/32px rhythm) observed
- [ ] Controls on 32/36/40px heights
- [ ] Padding/margin consistent: use spacing tokens, no magic numbers
- [ ] Vertical rhythm: elements stack predictably

### D. Components & States
- [ ] Interactive states: hover, focus, disabled, loading, error all present + visible
- [ ] Focus ring: visible (2px, `--focus-ring` color), offset correct, never invisible
- [ ] Loading states: not blank, shows progress/spinner
- [ ] Empty states: honest, explains what's empty, next step clear
- [ ] Error states: human-readable message, actionable, not jargon
- [ ] Dropdowns: open/close smooth, nested items clear, keyboard nav works
- [ ] Forms: inputs clearly focused, labels visible, validation clear

### E. Motion & Animation
- [ ] Easing: swift `cubic-bezier(.175,.885,.32,1.1)` on all transitions
- [ ] Duration: 300ms overlays, 200ms popovers, ≤200ms micro-interactions
- [ ] Respects `prefers-reduced-motion` (no motion if user has it set)
- [ ] No jank: 60fps, GPU-accelerated where needed

### F. Accessibility
- [ ] aria-label on all unlabeled interactive elements
- [ ] aria-hidden on decorative elements (Skeleton component shimmer, spinners, etc.)
- [ ] Focus order logical (tab through, it flows)
- [ ] Color not the only signal (text + icon + position for status)
- [ ] Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI components (WCAG AA)
- [ ] Keyboard nav: all interactive elements accessible via Tab/Enter/Esc/Arrow keys

### G. Responsive Behavior
- [ ] Mobile (375px): readable, tappable, no horizontal scroll
- [ ] Tablet (768px): layout adapts, still cohesive
- [ ] Desktop (1440px): breathing room, no overwhelming width
- [ ] Images/icons scale proportionally
- [ ] Touch targets ≥ 44px on mobile

### H. Consistency
- [ ] Same component looks identical across all surfaces
- [ ] Same pattern (e.g., card anatomy) used everywhere
- [ ] Same terminology (not "Mission" in one place, "Goal" in another)
- [ ] Same interaction pattern (modals, popovers, inline edits all consistent)

---

## Reference: Vercel Geist Study

**To dissect:**
1. https://vercel.com/geist/introduction — design system details
2. https://vercel.com/font — Geist typography
3. https://vercel.com/ — live implementation (button hover states, card elevations, color usage, spacing rhythm, motion)

---

## Success Criteria

✅ **Wave 1-2 is production-grade when:**
1. All 3 known unfixed footguns are resolved
2. Every surface passes the 8-point audit framework (A-H)
3. Chrome DevTools inspection shows clean, token-based styling
4. All interactive states (hover, focus, loading, error, empty) are visually distinct and accessible
5. Typography, spacing, and motion are consistent across all 71 surfaces
6. Design system docs fully in sync
7. Live product matches Vercel's Geist polish and restraint

**Wave 3 starts only after this is complete.**
