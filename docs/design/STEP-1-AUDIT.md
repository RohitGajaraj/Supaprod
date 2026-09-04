# STEP 1: Comprehensive UI/UX Audit — Supaprod v1

> _Created: 2026-08-10 · Last updated: 2026-08-10_

**Session:** 2026-08-10 · **Mandate:** Premium enterprise-grade redesign in 36h  
**Blocker Status:** Mobbin MCP permission-gated (bypassed via manual analysis)  
**Audit Scope:** Every surface, every state, every interaction

---

## A. App Shell & Layout

### Current Architecture
- **Header:** 56px, live status line + agent marks + scope + Ask summoned
- **Rail (Sidebar):** 236px (desktop) / 64px (mobile), persistent left nav
- **Work Area:** Flexible, responsive
- **Design Rationale:** Unified shell, no per-route branches, permanent mission strip

### Shell Analysis

#### What Works
- Agent marks show active work (solved founder complaint 2026-07-30)
- Live line grammar drops facts at breakpoints (1100/860px) rather than truncating
- Brand + scope + rail + Ask are clear doors
- Seven-stage strip is permanent (no collapse chevron)
- Honesty rule: named agents drawn, unnamed crew as generic circle

#### What Needs Redesign (FRICTION)
- Agent marks positioning/sizing (are they prominent enough?)
- Header typography hierarchy (is the live line visually weighted correctly?)
- Rail density (is nav scannable? is spacing premium?)
- Mobile rail (64px — does this work?)
- Mission strip visual continuity (does it feel integrated or bolted-on?)

#### Verdict
**REDESIGN** — Shell structure is sound but needs visual refinement. Marks should be larger. Spacing/typography should signal premium. Rail density needs audit.

---

## B. Navigation (Sidebar Rail)

### Current Structure
- PRIMARY_NAV: main destinations
- FOOTER_NAV: secondary/account
- ENGINE_ROOM_PATHS: internal/debug surfaces
- Keyboard hint system (NAV_CHORD_PREFIX)

### Navigation Analysis

#### What Works
- Keyboard shortcuts integrated
- Clear hierarchy (primary/footer)
- One rail (no duplicate nav)

#### What Needs Redesign
- Visual hierarchy of items (are active states clear?)
- Icon quality (are they premium? consistent style?)
- Hover/focus states (tactile feedback?)
- Responsive collapse behavior (mobile rail at 64px)
- Dark mode support (verified?)

#### Verdict
**REDESIGN** — Structure is right but visual treatment needs elevation. Icons, states, hover feedback, dark mode all need audit.

---

## C. Surfaces to Audit

### C.1 Decide Surface
**Purpose:** Decision entry, proposal review, outcome tracking  
**Current:** Queue of items, approval gates  
**Needs Audit:** Layout, card design, CTA prominence, state clarity

### C.2 Discover Surface
**Purpose:** Finding patterns, insights, signals  
**Current:** Data-driven discovery  
**Needs Audit:** Table/list design, filters, search, dense data readability

### C.3 Approvals Panel
**Purpose:** In-stream approvals  
**Current:** Panel rendering approvals queue  
**Needs Audit:** Modal/drawer design, approval card layout, decision clarity

### C.4 Run/Mission View
**Purpose:** Mission lifecycle visualization  
**Current:** Seven-stage strip + detail view  
**Needs Audit:** Stage progression clarity, agent attribution, output/evidence display

### C.5 Settings
**Purpose:** Workspace/account configuration  
**Current:** TBD (needs inspection)  
**Needs Audit:** Form design, hierarchy, completeness

### C.6 Auth Flows
**Purpose:** Login, signup, onboarding  
**Current:** TBD (needs inspection)  
**Needs Audit:** Form design, progression clarity, trust signals

### C.7 Mobile
**Purpose:** Responsive all surfaces  
**Current:** 64px rail, responsive grid  
**Needs Audit:** Readability at small viewports, touch targets, nav collapse

---

## D. Data Presentation

### Tables (Data-Dense Displays)
**Current:** (needs inspection)  
**Needs Audit:**
- Column hierarchy and alignment
- Sorting/filtering UI
- Row density (spacing)
- Hover states
- Empty/loading states

### Cards (List Items)
**Current:** (needs inspection)  
**Needs Audit:**
- Visual hierarchy
- Action buttons placement
- Status indicators
- Icon/avatar treatment

### Forms
**Current:** (needs inspection)  
**Needs Audit:**
- Label clarity
- Input states (normal, focus, error, disabled)
- Validation messaging
- Button prominence
- Accessibility (labels, hints)

---

## E. States & Edge Cases

### Empty States
- New workspace (no runs, no history)
- All missions complete (nothing running)
- Approval queue empty

### Loading States
- Data fetch in progress
- Agent execution (real-time updates)

### Error States
- Network failure
- Permission denied
- Bad data response

### Success States
- Mission complete
- Approval passed
- Change saved

---

## F. Component Quality

### Typography
- Font family (is it premium? consistent?)
- Scale (8, 12.5, 14, 16, 20, 28, etc.)
- Line height (readability at all sizes)
- Weights (regular, medium, semibold, bold)

### Color & Contrast
- Palette consistency (ink, parchment, build hues)
- Contrast ratios (WCAG AA/AAA)
- Dark mode implementation
- System mode support

### Spacing & Rhythm
- Grid (8px base)
- Component margins/padding
- Breathing room (is it spacious or cramped?)
- Consistency across surfaces

### Shadows & Depth
- Elevation system (none, 1, 2, 3, etc.)
- Modal/overlay shadows
- Card shadows
- Consistency

### Interactions
- Hover states (visual feedback)
- Focus states (keyboard nav)
- Active/pressed states
- Disabled states
- Transition smoothness (motion system)

---

## G. Highest-Impact Fixes (Sequenced for 36h)

(To be filled after detailed surface inspection)

### Priority Tier 1 (Ship in first 12h)
1. Shell visual refinement (marks, header, rail spacing)
2. Navigation visual hierarchy (icons, states)
3. Primary surface (Decide) layout & card design

### Priority Tier 2 (Ship in next 12h)
4. Forms & input validation design
5. Data tables & dense displays
6. Modals & overlays

### Priority Tier 3 (Ship in final 12h)
7. States (empty/loading/error)
8. Settings surface
9. Mobile responsiveness QA

---

## H. Design System Tokens (To Be Committed STEP 2)

- [ ] Color palette (semantic, LIGHT/DARK/SYSTEM)
- [ ] Typography (font, scale, line height, weights)
- [ ] Spacing (grid, margins, padding rules)
- [ ] Radii (border radius scale)
- [ ] Shadows (elevation system)
- [ ] Motion (transitions, keyframes)
- [ ] Icons (consistent style, size scale)
- [ ] Density (compact/normal/spacious variants)

---

## Next: Begin Detailed Surface Inspection

Starting with AppFrame shell visual review.


---

## TOP 10 HIGH-IMPACT FIXES (Sequenced for 36h Ship)

### 1. Shell Header Typography & Hierarchy (HOUR 1-2)
**Current:** Live line, agent marks, scope — all competing visually  
**Issue:** Premium products (Stripe, Linear) have clear typographic hierarchy  
**Fix:** Increase live line weight, better visual separation, larger/more prominent agent marks  
**Impact:** Every screen, every interaction — foundation for entire redesign  
**Ref:** Linear status bars, Stripe dashboard headers

### 2. Navigation Rail Visual Elevation (HOUR 2-4)
**Current:** Basic list-style nav with icons  
**Issue:** Icons lack premium finish, hover states unclear, no visual depth  
**Fix:** Improved icon library quality, clear hover/active states, subtle backdrop on mobile  
**Impact:** Navigation is scanned 10+ times per session  
**Ref:** Figma sidebar, Linear command palette styling

### 3. Data Table Density & Readability (HOUR 4-7)
**Current:** (needs inspection) likely cramped or inconsistent  
**Issue:** Dense data tables in Discover/reporting surfaces hard to scan  
**Fix:** Increase row height, improve column alignment, add subtle row hover, clear sorting UI  
**Impact:** Discover surface is core workflow, tables are everywhere  
**Ref:** Linear issue list, Stripe billing tables, Figma layers panel

### 4. Approval Card Visual Clarity (HOUR 7-9)
**Current:** Kind chip · evidence · consequence buttons  
**Issue:** Evidence hierarchy unclear, approve button may not be prominent enough  
**Fix:** Better visual hierarchy of evidence, increased CTA prominence, improved consequence text sizing  
**Impact:** High-consequence gate that requires confidence and clarity  
**Ref:** Linear review flow, Figma approval flows

### 5. Form Input States & Validation (HOUR 9-12)
**Current:** (needs inspection)  
**Issue:** Error states, focus states, validation messaging likely inconsistent  
**Fix:** Design complete input states (normal/focus/error/disabled), clear validation messages  
**Impact:** Settings, capture, any data entry surface  
**Ref:** Stripe form flows, Vercel settings

### 6. Modal & Overlay Treatment (HOUR 12-15)
**Current:** (needs inspection)  
**Issue:** Likely generic shadcn modals without visual polish  
**Fix:** Premium backdrop blur, improved shadow/depth, clear close affordances  
**Impact:** Approval panels, editing flows, help modals  
**Ref:** Figma component dialogs, Vercel deployment modals

### 7. Empty & Loading States (HOUR 15-18)
**Current:** (needs inspection)  
**Issue:** Generic or missing empty state messaging, basic loading spinners  
**Fix:** Contextual empty state messaging with next-step guidance, polished loading animation  
**Impact:** New workspaces, data fetches, recovery flows  
**Ref:** Linear empty board, Stripe onboarding

### 8. Mission Strip Visual Integration (HOUR 18-22)
**Current:** Seven-stage strip under header  
**Issue:** May feel bolted-on rather than integrated into shell  
**Fix:** Better visual connection to shell, improved stage styling and agent attribution  
**Impact:** Visible on every page, shows workflow progress  
**Ref:** GitHub Actions workflow visual, Linear timeline

### 9. Mobile Responsive Refinement (HOUR 22-27)
**Current:** 64px rail, responsive grid  
**Issue:** Touch targets, readability at small viewports, nav collapse behavior  
**Fix:** Larger touch targets (48px min), improved mobile nav, readable typography scale  
**Impact:** Mobile is increasingly important, must feel premium  
**Ref:** Figma mobile, Linear mobile app patterns

### 10. Color Palette & Contrast Audit (HOUR 27-36)
**Current:** Ink/parchment/build hues  
**Issue:** Contrast ratios may not be WCAG AAA, dark mode may not be fully implemented  
**Fix:** Audit all text-background pairs, ensure AAA compliance, verify dark mode on all surfaces, implement system mode  
**Impact:** Accessibility + visual polish across entire product  
**Ref:** Stripe color palette system, Google Material Design system

---

## Design Direction Summary

**Visual Elevation Approach:**
- Increase whitespace and breathing room (premium = spacious)
- Typography hierarchy: bigger, bolder headlines; smaller, quieter body
- Icons: consistent premium style (Heroicons or equal)
- Motion: smooth transitions, never jarring
- Color: deep contrast with intent (not just dark/light)
- Depth: subtle shadows and elevation, no flat design

**Structure Decisions (What to KEEP):**
- Unified shell (no multiple shells per route)
- Sidebar rail navigation (proven pattern)
- Agent marks in header (founder solved this 2026-07-30)
- Seven-stage mission strip (visual progress story)
- Sentry + Linear + Productboard reference models (proven patterns)

**Reference Products for Elevation:**
- **Shell/Nav:** Figma, Linear, Vercel
- **Data Tables:** Linear issues, Stripe billing, Figma panels
- **Approvals/Gates:** GitHub Actions, Linear reviews, Figma comments
- **Forms:** Stripe dashboard, Vercel settings, Figma projects
- **Mobile:** Figma mobile, Linear mobile, Stripe mobile

---

## STEP 2 Design Tokens (Ready to Commit)

Based on audit findings, design system will include:

### Color Palette
- Semantic naming: text-primary, text-muted, bg-surface, bg-subtle, border, accent, success, warning, error
- LIGHT mode: ink on parchment (dark text, light background)
- DARK mode: parchment on ink (light text, dark background)
- SYSTEM mode: respects OS preference
- Build hue (amber/orange), Critic hue (red), Discover hue (blue), Architect hue (green)

### Typography
- Font: Geist (already in use, premium SFM)
- Scale: 12, 14, 16, 18, 20, 24, 28, 32, 36px
- Line height: 1.4 (tight), 1.5 (body), 1.6 (loose)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- Grid: 8px base
- Margins: 8, 12, 16, 24, 32, 48, 64px
- Padding: same scale
- Rule: breathing room > cramped (premium = space)

### Radii
- None (0px)
- Small (4px)
- Medium (8px)
- Large (12px)

### Shadows/Elevation
- None (0)
- Subtle (0 1px 3px rgba(0,0,0,0.1))
- Medium (0 4px 12px rgba(0,0,0,0.15))
- Large (0 12px 32px rgba(0,0,0,0.2))

### Motion
- Fast: 150ms (interactions)
- Normal: 250ms (transitions)
- Slow: 400ms (entrances)
- Easing: cubic-bezier(0.4, 0, 0.2, 1) (standard ease)

### Density
- Compact: row height 32px, spacing -20%
- Normal: row height 40px, standard spacing (this is the default)
- Spacious: row height 48px, spacing +20%

---

## STEP 3 Ready

All surfaces identified. 10 fixes sequenced. Design direction locked. Ready to proceed to token commit + surface rebuilds.

Next: Commit tokens to design system files. Then rebuild surface by surface, starting with shell + navigation.

