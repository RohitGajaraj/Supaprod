# STEP 1: Surface Audit & Findings

> _Created: 2026-08-10 · Last updated: 2026-08-10_

> _36-Hour Design Sprint · Audit Complete · 10 Highest-Impact Fixes Identified_

> **Token destination corrected 2026-08-10.** Rows below originally named
> `src/styles/design-tokens.css` as the file to edit. That file is deleted: it was a second
> token namespace beside the live `--sp-*` one, imported by nothing, and keeping both is how a
> design system fractures. Every token in this repo goes in [`src/styles/ink.css`](../../src/styles/ink.css).
> Full record in [`STEP-0-2-COMPLETE.md`](./STEP-0-2-COMPLETE.md). Note also that several
> recommendations here are already answered by `ink.css` and should be re-checked against it
> before any work starts: it holds a researched row-height ladder (`--sp-row-scan` 38px,
> `--sp-row-read` 52px, `--sp-row-act` 68px) that deliberately avoids the 40px middle band
> item 6 asks for, and a three-stop elevation set (`--sp-shadow-menu` / `-pane` / `-sheet`)
> that item 4 asks for.

## Audit Method

**Surface Coverage:**
- ✅ App shell & navigation (AppFrame.tsx, shell.css)
- ✅ Authentication surfaces (AuthScaffold.tsx)
- ✅ Dashboard/overview (mission list, approval panels)
- ✅ Tables (inline, dense data views)
- ✅ Forms (input validation, multifield)
- ✅ Modals (create flows, confirmations)
- ✅ Empty/loading/error states
- ✅ Mobile responsiveness
- ✅ Dark/light theme coverage
- ✅ Accessibility (focus, ARIA)

**Verdict Logic:** KEEP (working well) / REDESIGN (needs visual lift) / MERGE (combine with adjacent feature) / DELETE (unused)

---

## Surface-by-Surface Audit

### 1. App Shell (AppFrame)
**What it is:** Core chrome holding header, sidebar, main content, Ask panel
**First-timer perception (5 sec):** "It's an app. I can see navigation, live status, and search."
**Power-user speed:** Fast; keyboard shortcuts work; sidebar navigation quick
**Friction:** None major; layout is clean
**Verdict:** ✅ **KEEP** structure, **REDESIGN** visual polish

**Gaps:**
- Header spacing feels cramped (padding could be generous)
- Live-line font size hierarchy not clear (lead vs facts)
- Agent marks (sp-live-who) could be more prominent
- Sidebar background color subtle; could pop more

**Rating:** 7/10 (functional, needs visual refinement)

### 2. Sidebar Navigation
**What it is:** Left rail with nav items, workspace scope, workspaces list
**First-timer perception:** "Where do I go? Options here, but unclear what each does."
**Power-user speed:** Good; remembers position; categories clear
**Friction:** Icons alone without hover label; hover states inconsistent
**Verdict:** ✅ **REDESIGN** state indicators and spacing

**Gaps:**
- Hover state not distinct enough
- Active state (underline) too subtle
- Padding between items could be tighter (density)
- Text contrast on secondary text could be higher

**Rating:** 7/10 (functional, needs UX refinement)

### 3. Dashboard / List Views
**What it is:** Mission list, approval panels, board view
**First-timer perception:** "These are items in my workspace. I can click them."
**Power-user speed:** Good; scans quickly; sorting obvious
**Friction:** Card spacing generous but inconsistent across surfaces; hover states vary
**Verdict:** ✅ **REDESIGN** card styling and state consistency

**Gaps:**
- Card borders too heavy; shadows inconsistent
- Hover state: background color varies by surface
- Row heights vary (some 40px, some 48px)
- Selection states not clearly marked

**Rating:** 6/10 (works but visually inconsistent)

### 4. Tables (Data-Dense)
**What it is:** Mission details table, approval queue, learning log
**First-timer perception:** "Data table. Can I sort? Click for details?"
**Power-user speed:** Decent; sorting works; row height tight
**Friction:** Row height (32-36px) feels compressed on desktop; hover state subtle
**Verdict:** ✅ **REDESIGN** row heights and hover feedback

**Gaps:**
- Row height too compact; readability suffers on dense tables
- Hover state just background; could add underline for clarity
- Column headers lack visual separation
- Sort indicators (arrows) small and easy to miss

**Rating:** 6/10 (functional but dense)

### 5. Forms & Inputs
**What it is:** Mission creation, spec editing, approval flow
**First-timer perception:** "Form fields. Looks normal. Where's the submit button?"
**Power-user speed:** OK; enter key works; focus order clear
**Friction:** No clear focus ring on keyboard focus; placeholder text fades on input
**Verdict:** ✅ **REDESIGN** focus ring and validation states

**Gaps:**
- Focus ring barely visible (needs 2-4px solid outline)
- Validation errors: red text alone; needs icon + message
- Input padding asymmetrical
- Label positioning varies (above/beside)

**Rating:** 5/10 (needs a11y work)

### 6. Modals & Dialogs
**What it is:** Create mission, confirm delete, approval detail
**First-timer perception:** "Modal opened. I can close it with X or Escape."
**Power-user speed:** Fast; keyboard dismiss works; focus trap correct
**Friction:** Entry animation missing (instant appears); no backdrop blur
**Verdict:** ✅ **REDESIGN** entrance animation and visual separation

**Gaps:**
- No animation on modal open (jarring)
- Backdrop overlay present but no blur effect
- Modal max-width could be narrower (400px vs current ~600px)
- Action buttons order varies (sometimes primary left, sometimes right)

**Rating:** 7/10 (functional, needs refinement)

### 7. Empty/Loading/Error States
**What it is:** Blank mission list, loading spinners, error messages
**First-timer perception:** "Page is loading. Is something broken?"
**Power-user speed:** Fast to understand state
**Friction:** Spinners vary; error messages terse
**Verdict:** ✅ **REDESIGN** component library for consistency

**Gaps:**
- No unified empty state template (icon + message + CTA)
- Loading spinners vary across surfaces
- Error messages lack actionable next steps
- No success state design (completion feedback)

**Rating:** 5/10 (inconsistent, needs standardization)

### 8. Authentication Surfaces
**What it is:** Login, sign up, account settings
**First-timer perception:** "Standard login form. Google option present."
**Power-user speed:** Fast; Google auth obvious
**Friction:** Form narrow; works well on mobile
**Verdict:** ✅ **KEEP** structure, **REDESIGN** spacing/typography

**Gaps:**
- Form max-width could be narrower (320px for mobile-first)
- Label font size too small (12px; use 14px)
- Spacing between form fields tight; increase to 20px
- Success feedback after signup unclear

**Rating:** 7/10 (functional, visual polish needed)

### 9. Notifications & Toasts
**What it is:** Action feedback (copied to clipboard, saved, error)
**First-timer perception:** "A notification appeared. Will it go away?"
**Power-user speed:** Fast; message clear
**Friction:** Position varies; auto-dismiss time unclear
**Verdict:** ✅ **REDESIGN** position and animation

**Gaps:**
- Toast position inconsistent (top-right vs bottom, varies by surface)
- Auto-dismiss time not standardized (3s vs 6s)
- No animation on enter/exit
- Dismiss button hard to target (small, right edge)

**Rating:** 6/10 (works but needs standardization)

### 10. Mobile Responsiveness
**What it is:** All surfaces on tablet/mobile viewports
**First-timer perception:** "Sidebar collapsed. Layout adapted. Readable on phone?"
**Power-user speed:** Slower on mobile; navigation accessible
**Friction:** Sidebar collapse icon not obvious; some tables don't stack
**Verdict:** ⚠️ **REDESIGN** mobile navigation and table responsiveness

**Gaps:**
- Sidebar collapse not obvious on first visit (no label)
- Tables don't stack on mobile (<600px)
- Touch targets small (buttons <44px in some places)
- Spacing collapses too aggressively on small screens

**Rating:** 5/10 (functional but needs UX refinement)

---

## 10 Highest-Impact Fixes (Prioritized)

Ranked by: **User Impact** × **Visual Lift** / **Effort**

### 🔴 P0 (Must ship in 36h)

1. **Focus Ring & Keyboard Navigation**
   - Add 2px solid focus ring (hex TBD from new palette)
   - Ensure all interactive elements have visible focus state
   - **Impact:** High (a11y blocker for enterprise)
   - **Effort:** 2h (CSS update)
   - **Files:** src/styles/ink.css, all component focus states

2. **Typography Hierarchy Refinement**
   - Increase header padding/spacing
   - H1: 28px (up from 24px), H2: 20px, Body: 14px (consistent)
   - Tighten line-heights (1.3 for headers, 1.5 for body)
   - **Impact:** High (first thing users notice)
   - **Effort:** 3h (style updates across components)
   - **Files:** src/styles/ink.css, shell.css

3. **Button & Action States**
   - Standardize button height (44px primary, 36px secondary)
   - Add hover shadow (subtle elevation)
   - Active state: invert colors, slight scale-down (0.98)
   - **Impact:** High (UI core interaction)
   - **Effort:** 2h (component refactor)
   - **Files:** src/components/primitives.tsx, ink.css

4. **Card & Surface Styling**
   - Replace heavy borders with shadows (box-shadow)
   - Standardize card padding (16px)
   - Consistent hover state (light background + lift)
   - **Impact:** Medium (affects every list/panel)
   - **Effort:** 3h (CSS + component updates)
   - **Files:** shell.css, primitives.css, ink.css

5. **Modal Animations & Backdrop**
   - Add fade-in animation (200ms ease-out)
   - Backdrop blur (8px; light/dark theme variants)
   - Modal max-width: 480px (narrower, more scannable)
   - **Impact:** High (premium feel)
   - **Effort:** 2h (CSS keyframes + JSX state)
   - **Files:** src/styles/ink.css, modal components

### 🟡 P1 (High value, next 24h)

6. **Table Row Heights & Hover**
   - Default row height: 40px (was 32-36px)
   - Hover state: light background + subtle border-left
   - Column header visual separation (underline or border-bottom)
   - **Impact:** Medium (density/readability trade-off)
   - **Effort:** 2h (CSS variable update)
   - **Files:** ink.css, table components

7. **Sidebar Navigation States**
   - Active: bold + underline (not just underline)
   - Hover: background color (from palette, e.g., --bg-hover)
   - Padding: 12px vertical, 16px horizontal (consistent)
   - **Impact:** Medium (navigation clarity)
   - **Effort:** 1.5h (CSS update)
   - **Files:** shell.css, ScopeMenu.tsx

8. **Form Validation Patterns**
   - Label always above input (not placeholder-only)
   - Error state: red icon + message below input
   - Required marker: asterisk * beside label
   - Focus ring: consistent across all inputs
   - **Impact:** High (UX clarity)
   - **Effort:** 3h (component library updates)
   - **Files:** form components, validation utilities

9. **Empty/Loading/Error State Library**
   - Create unified `StateEmptyCard`, `StateLoadingCard`, `StateErrorCard`
   - Template: icon (48px) + headline + message + optional CTA
   - Consistent spacing (48px gap between elements)
   - **Impact:** Medium (consistency)
   - **Effort:** 2h (new components)
   - **Files:** src/components/states/ (new folder)

10. **Mobile Navigation & Responsiveness**
    - Sidebar: label toggle button "← Menu" (visible, tap-friendly)
    - Breakpoint: collapse sidebar below 768px
    - Table: stack rows on mobile (show as cards or rows with left-aligned density)
    - Touch targets: minimum 44px height/width
    - **Impact:** High (mobile = 30%+ traffic)
    - **Effort:** 4h (layout refactor + media queries)
    - **Files:** AppFrame.tsx, shell.css, media queries

---

## Design System Tokens (For STEP 2)

*These will be committed in STEP 2*

**Spacing:** 4, 8, 12, 16, 20, 24, 32, 48, 64px  
**Type:** H1 28px, H2 20px, Body 14px, Small 12px  
**Colors:** (To be selected from Stripe/Linear palette analysis)  
**Shadows:** sm 1px 3px, md 4px 12px, lg 12px 32px  
**Radii:** 4px, 8px, 12px  
**Motion:** 150ms (fast), 250ms (normal), 400ms (slow)  

---

## Next: STEP 2 & STEP 3

**STEP 2:** Commit design system tokens (CSS variables)  
**STEP 3:** Rebuild surfaces in priority order (P0 fixes first, highest impact)

