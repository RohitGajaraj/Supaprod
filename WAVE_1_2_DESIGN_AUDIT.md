# Wave 1-2 Design Audit — Critical Gaps Against Vercel Standard

> **Status: ACTIVE AUDIT** (2026-07-25)
> Systematically identifying and fixing design gaps in all Wave 1-2 surfaces (Today, Discover, Decide, Plan, Design, Build, Brain, Learn, Trust Ledger, Settings).

---

## Priority 1: Critical Visual Issues (Fix First)

### 1.1 Color Palette Issues
**Current state:**
- Accent blues (--ember/#FF6B2C) used too broadly across non-critical UI
- Too many distinct colors creating visual chaos
- Shadow system too aggressive (multiple levels, inconsistent)

**Vercel standard requires:**
- Grayscale as primary UI palette
- Single accent (blue-equivalent) for CTAs, selection, critical states ONLY
- Semantic colors (red/amber/green) minimal, controlled

**Surfaces affected:** All authenticated routes
- [x] Today
- [ ] Discover
- [ ] Decide
- [ ] Plan
- [ ] Design
- [ ] Build
- [ ] Brain
- [ ] Learn
- [ ] Trust Ledger
- [ ] Settings

**Fix approach:**
1. Audit every inline `color:`, `background:`, `--ember` usage
2. Replace non-semantic colors with grayscale tokens
3. Reserve accent only for: buttons (primary), selection, success, focus rings

---

### 1.2 Typography Issues

**Current state (from Today.tsx line 176-187):**
- `fontSize: 10.5` (breaks 4px rhythm, not standard size)
- `fontSize: 13` (non-standard, should be 12 or 14)
- Hardcoded line-heights (1.5) inconsistent across components
- Geist Pixel barely used (mentioned as "barely present" in mandate)

**Vercel standard requires:**
- Type scale: 11, 12, 14, 16, 18, 24, 32, 48px only
- Line heights: 1.2 (tight), 1.4 (compact), 1.6 (readable)
- Weights: 400 (regular), 600 (semibold), 700 (bold)
- Geist Pixel on one hero per surface maximum

**Surfaces affected:** All (typography is global)
- [ ] Replace `fontSize: 10.5` → 12px
- [ ] Replace `fontSize: 13` → 14px
- [ ] Standardize line-heights
- [ ] Add Geist Pixel to 5 hero moments (Today, Discover, Decide, Learn, Brain)

---

### 1.3 Spacing Issues

**Current state (from Today.tsx line 185):**
- `gap: 12` (not on 4px grid; should be 16px)
- Hardcoded pixel values throughout components
- No consistent use of spacing tokens

**Vercel standard requires:**
- 4px base unit: 4, 8, 12, 16, 24, 32, 48, 64px
- Every spacing value must be a multiple of 4
- Use design tokens, never hardcoded px

**Surfaces affected:** All components
- [ ] Replace `gap: 12` → use token (next value is 16)
- [ ] Replace all hardcoded padding/margin → tokens
- [ ] Audit component padding (cards should be 24px, compact 16px)
- [ ] Verify section gaps are 24px or 32px, never arbitrary

---

### 1.4 Shadow/Elevation Issues

**Current state:**
- Multiple shadow levels (too many)
- Shadows on elements that should be flat
- `box-shadow` values inconsistent

**Vercel standard requires:**
- Level 0: No shadow (flat)
- Level 1: `0 2px 8px rgba(0,0,0,0.1)` (raised, interactive)
- Level 2: `0 8px 32px rgba(0,0,0,0.15)` (modal, critical)
- Texture/elevation via subtle borders, not shadows

**Fix approach:**
1. Identify all `box-shadow` usage
2. Reduce to 2-3 levels only
3. Replace aggressive shadows with subtle borders + background
4. Test readability & depth perception

---

## Priority 2: Component State Issues

### 2.1 Button States
**Current gaps:**
- Hover states unclear or missing
- Active/pressed states not distinct
- Focus rings weak or missing (accessibility gap)
- Icon spacing inconsistent

**Vercel standard:**
- Default: White bg, gray border, black text
- Hover: Light gray bg (#FAFAFA)
- Active: Darker gray (#F0F0F0)
- Focus: 2px ring, 2px offset
- Primary: Blue bg, white text → darker blue on hover

**Audit checklist:**
- [ ] Button component has all 4 states (default/hover/active/focus)
- [ ] Focus ring is 2px solid, blue, 2px offset
- [ ] Icon + text have 8px gap
- [ ] All sizes (32/40/48px) consistent

### 2.2 Input States
**Current gaps:**
- Error state styling unclear
- Focus state may not be prominent
- Placeholder text color may not be accessible

**Vercel standard:**
- Default: Gray border (#E5E5E5)
- Hover: Darker gray (#CCCCCC)
- Focus: 2px blue border + soft shadow
- Error: 2px red border
- Padding: 12px 16px (vertical × horizontal)

**Audit checklist:**
- [ ] Input default border is 1px gray
- [ ] Input focus is 2px blue + shadow
- [ ] Input error is 2px red
- [ ] Placeholder color ≥4.5:1 contrast
- [ ] All inputs 40px minimum height (44px touch target)

### 2.3 Dropdown States
**Current gaps:**
- Menu positioning unclear
- Keyboard navigation unknown
- Hover/selection states inconsistent

**Vercel standard:**
- Trigger: 40px height, gray borders
- Menu: Below/above based on space, max 400px height
- Item: 40px height, 12px 16px padding
- Hover: #F5F5F5 background
- Selected: Blue bg + white text
- Keyboard: Arrow Up/Down, Enter, Escape

**Audit checklist:**
- [ ] Dropdown trigger is 40px
- [ ] Menu items 40px with 16px padding
- [ ] Selection visible (blue bg)
- [ ] Keyboard nav works (arrows, enter, escape)
- [ ] Max 400px height with scroll

### 2.4 Modal/Dialog States
**Current gaps:**
- Focus trap unclear
- Backdrop interaction unclear
- Close button position/style unclear

**Vercel standard:**
- Backdrop: `rgba(0,0,0,0.5)` semi-transparent
- Modal: Centered, max 96px width desktop, 90% mobile
- Shadow: Level 2
- Padding: 32px
- Focus trap: Initial focus on first interactive or close
- Close: Top-right or explicit button

**Audit checklist:**
- [ ] Backdrop prevents background interaction
- [ ] Modal centered on screen
- [ ] Focus trap active (tab cycles within modal)
- [ ] Escape closes modal
- [ ] Close button position clear

---

## Priority 3: Responsive & Accessibility Issues

### 3.1 Responsive Breakpoints
**Current gaps:**
- May not have explicit 768px breakpoint
- Touch targets may be <44px
- Mobile layout may not be optimized

**Vercel standard:**
- 375px (mobile)
- 768px (tablet)
- 1440px (desktop)
- Touch targets: 44px minimum
- Mobile-first: Default styles mobile, cascade up

**Audit checklist:**
- [ ] All responsive breakpoints present
- [ ] Touch targets 44px minimum
- [ ] Mobile typography: H1 32px (vs desktop 48px)
- [ ] Mobile spacing: 16px gaps (vs desktop 24px)
- [ ] Hamburger menu on mobile, horizontal on desktop

### 3.2 Accessibility Issues
**Current gaps:**
- Focus rings may be weak
- Icon-only buttons may lack aria-labels
- Color contrast unknown
- Keyboard navigation unclear

**Vercel standard:**
- Focus: 2px ring, high contrast
- Icons: aria-label on icon-only buttons
- Contrast: WCAG AAA (7:1) body, AA (4.5:1) UI
- Keyboard: Tab order, Escape, Arrow keys where applicable

**Audit checklist:**
- [ ] All interactive elements focusable (tab)
- [ ] Focus ring visible, 2px, high contrast
- [ ] Icon-only buttons have aria-label
- [ ] Color contrast ≥4.5:1 on all text
- [ ] Modal: Focus trap + Escape close
- [ ] Form: Labels + error messages

---

## Priority 4: Motion & Transitions

### 4.1 Transition Timing
**Current gaps:**
- Transitions may be missing or too slow
- Easing may not be optimal

**Vercel standard:**
- Micro (hover/focus): 140ms
- Transitions (slide/fade): 200-300ms
- Modals: 200ms
- Easing: `cubic-bezier(0.175, 0.885, 0.32, 1.1)` (ease-out-back)

**Audit checklist:**
- [ ] Hover states have 140ms transition
- [ ] Focus states have 140ms transition
- [ ] Modal enter/exit 200ms
- [ ] Slide animations 200-300ms
- [ ] All easing consistent (ease-out-back or material)

---

## Surfaces to Audit (in order of priority)

### Core User-Facing Surfaces (Wave 1)
1. **Today** (`_authenticated.today.tsx`) — Main dashboard, highest traffic
   - Issues found: Font sizes non-standard, gap not 4px aligned, accent use broad
   - Status: [IN PROGRESS]

2. **Discover** (`_authenticated.discover.tsx`) — Signal/insight discovery
   - Status: [PENDING]

3. **Decide** (`_authenticated.decide.tsx`) — Decision making
   - Status: [PENDING]

4. **Plan** (`_authenticated.plan.index.tsx`) — PRD/spec planning
   - Status: [PENDING]

5. **Build** (`_authenticated.build.index.tsx`) — Mission execution
   - Status: [PENDING]

6. **Brain** (`_authenticated.brain.tsx`) — Knowledge/memory interface
   - Status: [PENDING]

### Secondary Surfaces (Wave 2)
7. **Learn** (`_authenticated.learn.tsx`) — Outcomes/learnings
   - Status: [PENDING]

8. **Trust Ledger** (`_authenticated.trust-ledger.tsx`) — Decision receipts
   - Status: [PENDING]

9. **Settings** (`_authenticated.settings.tsx`) — User configuration
   - Status: [PENDING]

10. **Design** (`_authenticated.design.tsx`) — Design workspace
    - Status: [PENDING]

---

## Component Library Refinement

### Buttons
**File:** `src/components/obsidian/Button.tsx`
- [ ] Verify all 6 variants (default, primary, secondary, tertiary, ghost, link)
- [ ] Verify all 3 sizes (32/40/48px)
- [ ] Verify focus ring (2px, blue, 2px offset)
- [ ] Verify hover states (140ms transition)
- [ ] Verify disabled state (grayed, no hover)

### Inputs
**File:** `src/components/obsidian/Input.tsx`
- [ ] Default border 1px gray (#E5E5E5)
- [ ] Focus border 2px blue (#0070F3)
- [ ] Error border 2px red
- [ ] Padding 12px 16px
- [ ] Minimum height 40px
- [ ] Placeholder contrast ≥4.5:1

### Cards
**File:** `src/components/obsidian/Card.tsx`
- [ ] Padding 24px (default) or 16px (compact)
- [ ] Border 1px gray (#E5E5E5)
- [ ] Border-radius 8px
- [ ] Shadow Level 1 (`0 2px 8px rgba(0,0,0,0.1)`)
- [ ] Hover shadow Level 2
- [ ] Hover transition 140ms

### Modals
**File:** `src/components/obsidian/Modal.tsx`
- [ ] Backdrop `rgba(0,0,0,0.5)`
- [ ] Modal shadow Level 2
- [ ] Focus trap active
- [ ] Escape close
- [ ] Initial focus on first interactive

---

## Testing Checklist (Exhaustive)

### Visual Testing (Per Surface)
- [ ] Hover states on all interactive elements (buttons, links, cards)
- [ ] Focus rings on all focusable elements (buttons, inputs, links)
- [ ] Active/pressed states distinct from default
- [ ] Disabled states clearly grayed
- [ ] Loading states show spinner/skeleton
- [ ] Error states show red border + error message
- [ ] Empty states render correctly (not blank)
- [ ] Success states show checkmark/green

### Responsive Testing (Per Surface)
- [ ] 375px mobile layout correct
- [ ] 768px tablet layout correct
- [ ] 1440px desktop layout correct
- [ ] Touch targets ≥44px (mobile)
- [ ] Text readable at all sizes
- [ ] Images scale correctly
- [ ] Navigation adapts (hamburger mobile, horizontal desktop)

### Accessibility Testing (Per Surface)
- [ ] All buttons/links focusable via Tab
- [ ] Focus ring visible
- [ ] Icon-only buttons have aria-labels
- [ ] Form labels present
- [ ] Error messages linked to inputs (aria-describedby)
- [ ] Color contrast ≥4.5:1
- [ ] Keyboard shortcuts work (Escape for modals, Arrow for dropdowns)
- [ ] Screen reader announces correctly (role, state, label)

### Motion Testing (Per Surface)
- [ ] Hover transitions smooth (140ms)
- [ ] Focus transitions smooth (140ms)
- [ ] Modal open/close smooth (200ms)
- [ ] Loading spinner smooth (2-4s loop)
- [ ] No janky transitions or delays

---

## Execution Plan

**Phase 1: Today Surface Refinement** (Day 1)
- [ ] Fix typography (10.5 → 12, 13 → 14)
- [ ] Fix spacing (12 → 16px, use tokens)
- [ ] Audit color usage, reduce non-semantic
- [ ] Test all states (hover, focus, active, disabled, error, loading, empty)
- [ ] Test responsive (375/768/1440)
- [ ] Test accessibility (focus, keyboard, contrast, aria)

**Phase 2: Core Surfaces (Days 2-3)**
- [ ] Discover, Decide, Plan, Build, Brain (same audit)
- [ ] Parallel fix: Component library (Button, Input, Card, Modal)

**Phase 3: Secondary Surfaces (Days 4-5)**
- [ ] Learn, Trust Ledger, Settings, Design
- [ ] Full test suite

**Phase 4: Final Polish (Days 6-7)**
- [ ] Cross-surface consistency
- [ ] Motion refinement
- [ ] Typography hierarchy verification
- [ ] Geist Pixel integration (heroes)
- [ ] Final accessibility audit

---

**Next immediate step: Refine Today surface against Vercel standard.**
