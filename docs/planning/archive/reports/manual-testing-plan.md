# Wave 1-2 Manual Testing & Verification Plan

> _Created: 2026-08-03 · Last updated: 2026-08-03_

## Executive Summary
Code-level audits are complete (95% quality). This document specifies the manual runtime testing required to validate production readiness across all user-visible interactions.

## Test Environment Setup
- **Host**: macOS (target: VoiceOver a11y testing)
- **Browsers**: Chrome (primary), Safari (fallback)
- **Tools**: Browser DevTools (Responsive Design Mode), Accessibility Inspector
- **Reference**: https://vercel.com (compare visual patterns)
- **Test Flow**: Login → Create/Edit → Review → Publish

## Phase 1: Responsive Design Validation

### 1.1 Mobile (375px width)
**Test Points**:
- [ ] Navigation hamburger menu opens/closes smoothly
- [ ] Card components stack vertically
- [ ] Form inputs expand to full width
- [ ] Buttons are thumb-friendly (min 44px height)
- [ ] Text remains readable (no cutoff)
- [ ] Images scale proportionally
- [ ] Modals are full-width or centered with padding
- [ ] Dropdowns don't overflow viewport

**Acceptance Criteria**:
- All text readable without pinch-zoom
- Touch targets ≥44px
- No horizontal scroll
- Typography hierarchy preserved

### 1.2 Tablet (768px width)  
**Test Points**:
- [ ] Two-column layouts appear
- [ ] Sidebar visible or collapsible
- [ ] Form fields arranged appropriately
- [ ] Table/list columns readable
- [ ] Modal positioned centrally

**Acceptance Criteria**:
- All content accessible without scroll
- No unsightly gaps or alignment issues
- Consistent spacing

### 1.3 Desktop (1440px width)
**Test Points**:
- [ ] Full three-column layouts render
- [ ] Whitespace is balanced
- [ ] Line lengths are readable (<120 chars recommended)
- [ ] Sidebar + main + rail layout balanced
- [ ] Hover effects visible and smooth

**Acceptance Criteria**:
- Content properly constrained
- No excessively long lines
- Spacing follows 4px grid

---

## Phase 2: Interactive State Testing

### 2.1 Button States
**Test Flows**:
1. **Default button**
   - [ ] Rest state: gray neutral
   - [ ] Hover: brightness increase smooth (150ms transition)
   - [ ] Active: slightly darker, scale 0.97
   - [ ] Disabled: 50% opacity, no cursor
   - [ ] Focus: outline ring visible

2. **Accent (Ember) button**
   - [ ] Rest state: ember color (#FF6B2C)
   - [ ] Hover: brightness-110 (brighter orange)
   - [ ] Active: brightness-95 (darker orange)
   - [ ] Disabled: 50% opacity
   - [ ] Focus: outline ring visible

3. **Secondary button**
   - [ ] Rest: raised gray surface
   - [ ] Hover: slightly darker gray
   - [ ] Active: darker still
   - [ ] Disabled: 50% opacity

4. **Tertiary/Ghost button**
   - [ ] Rest: transparent
   - [ ] Hover: light gray background
   - [ ] Active: darker gray background
   - [ ] Disabled: 50% opacity

5. **Link button**
   - [ ] Rest: blue text, underline-offset-4
   - [ ] Hover: darker blue, underline appears
   - [ ] Active: brightest blue
   - [ ] Disabled: 50% opacity

**Acceptance Criteria**:
- All transitions are smooth (no jank)
- Colors match Tempo spec
- Timing is consistent (150ms)

### 2.2 Form Input States
**Test Flows**:
1. **Text input**
   - [ ] Empty: placeholder visible
   - [ ] Focus: border color changes, focus ring appears
   - [ ] Filled: value visible, clean appearance
   - [ ] Disabled: gray appearance, no input
   - [ ] Error: red border, error message below
   - [ ] Readonly: appears filled but no cursor

2. **Select dropdown**
   - [ ] Rest: shows selected value
   - [ ] Focus: focus ring appears
   - [ ] Click: dropdown opens with animation
   - [ ] Hover options: highlight changes
   - [ ] Select: value updates, dropdown closes
   - [ ] Keyboard: arrow keys work, Enter selects

3. **Checkbox**
   - [ ] Rest: empty box
   - [ ] Hover: subtle background change
   - [ ] Focus: focus ring visible
   - [ ] Checked: checkmark appears, filled
   - [ ] Disabled: 50% opacity, no interaction

4. **Radio button**
   - [ ] Rest: empty circle
   - [ ] Hover: subtle background
   - [ ] Focus: focus ring visible
   - [ ] Selected: dot in center, filled
   - [ ] Disabled: 50% opacity

**Acceptance Criteria**:
- All states visually distinct
- Focus indicators always visible
- Error states clearly marked
- Transitions smooth (150ms)

### 2.3 Modal/Dialog States
**Test Flows**:
1. **Opening**
   - [ ] Backdrop appears with fade
   - [ ] Modal slides in or fades in
   - [ ] Focus moves to modal (first focusable element)
   - [ ] Scroll disabled on body

2. **Interaction**
   - [ ] Can tab through modal content
   - [ ] Cannot tab outside modal (trap)
   - [ ] Escape key closes modal
   - [ ] Click outside (if clickable) closes modal
   - [ ] Form submission works within modal

3. **Closing**
   - [ ] Modal fades out smoothly
   - [ ] Focus returns to trigger button
   - [ ] Body scroll restored
   - [ ] No visual artifacts

**Acceptance Criteria**:
- Focus trap works correctly
- Animations are smooth
- Keyboard navigation complete
- Escape closes correctly

### 2.4 Dropdown/Menu States
**Test Flows**:
1. **Opening**
   - [ ] Click opens menu
   - [ ] Arrow keys navigate options
   - [ ] First option highlighted
   - [ ] Menu positions correctly (doesn't overflow)

2. **Navigation**
   - [ ] Up/Down arrow keys work
   - [ ] Enter selects option
   - [ ] Escape closes menu
   - [ ] Focus trap works

3. **Closing**
   - [ ] Selection updates value
   - [ ] Menu closes smoothly
   - [ ] Focus returns to trigger

**Acceptance Criteria**:
- All keyboard shortcuts work
- Menu doesn't overlap viewport edges
- Smooth animations

---

## Phase 3: Loading & Error States

### 3.1 Loading Indicators
**Test Points**:
- [ ] Spinners rotate smoothly
- [ ] Loading text appears
- [ ] Button shows loading state with spinner
- [ ] Skeleton screens appear while loading
- [ ] Transitions to loaded state smoothly

**Acceptance Criteria**:
- Spinners are smooth (no stuttering)
- Loading state is clear
- Transition to loaded is instant

### 3.2 Error States
**Test Points**:
- [ ] Error messages appear clearly
- [ ] Input fields show red border
- [ ] Toast notifications appear
- [ ] Error icon is visible
- [ ] Message explains the issue

**Acceptance Criteria**:
- Error is unmistakable
- Message is helpful
- Can recover from error

### 3.3 Empty States
**Test Points**:
- [ ] Empty state icon visible
- [ ] Headline in Geist Pixel font
- [ ] Body text in Geist Sans
- [ ] Call-to-action button present
- [ ] Centered, visually balanced

**Acceptance Criteria**:
- Typography correct (Pixel/Sans)
- Visually appealing
- Action is clear

---

## Phase 4: Accessibility Testing

### 4.1 Screen Reader Testing (macOS VoiceOver)
**Test Flow**:
1. **Startup**
   - [ ] Cmd+F5: VoiceOver on
   - [ ] Page announces correctly
   - [ ] Heading hierarchy makes sense

2. **Navigation**
   - [ ] Tab key moves through items in logical order
   - [ ] Focus indicator visible after each tab
   - [ ] Buttons announce correctly ("Button, [label]")
   - [ ] Form fields announce labels ("Text field, [label]")
   - [ ] Links announce as "Link, [text]"

3. **Forms**
   - [ ] Label associated with input
   - [ ] Error announced when present
   - [ ] Required fields indicated
   - [ ] Placeholder read correctly

4. **Complex Components**
   - [ ] Modals announce role ("Dialog")
   - [ ] Menus announce items and current selection
   - [ ] Dropdowns announce expanded/collapsed state
   - [ ] Tables have proper headers

**Acceptance Criteria**:
- All interactive elements keyboard accessible
- Labels clearly associated
- Errors announced
- Complex widgets have proper roles

### 4.2 Keyboard Navigation
**Test Flows**:
1. **Tab order**
   - [ ] Tab navigates all focusable elements
   - [ ] Shift+Tab reverses order
   - [ ] Order matches visual hierarchy
   - [ ] No focus trap except modals

2. **Shortcuts**
   - [ ] Enter activates buttons
   - [ ] Space activates checkboxes
   - [ ] Arrow keys navigate selects/menus
   - [ ] Escape closes modals/menus

**Acceptance Criteria**:
- Complete keyboard navigation possible
- Shortcuts are intuitive
- Focus visible at all times

### 4.3 Color Contrast
**Test Points**:
- [ ] Text on backgrounds: ≥4.5:1 (AA standard)
- [ ] Large text: ≥3:1
- [ ] Button text on colored backgrounds: ≥4.5:1
- [ ] Focus rings: ≥3:1 against background

**Tools**: Browser DevTools Color Contrast Checker

**Acceptance Criteria**:
- All text meets WCAG AA standard
- No reliance on color alone

---

## Phase 5: Animation & Motion

### 5.1 Transition Timing
**Test Points**:
- [ ] All transitions take 150ms (except special cases)
- [ ] Easing appears smooth (ease-out, ease-in-out)
- [ ] No jank or stuttering
- [ ] Animations are responsive to interaction

**Acceptance Criteria**:
- Consistent timing across component
- Smooth, natural feel
- No dropped frames

### 5.2 Entrance/Exit Animations
**Test Points**:
- [ ] Modals fade in/slide in smoothly
- [ ] Dropdowns expand with animation
- [ ] Toasts slide in from corner
- [ ] Pages load with smooth transitions
- [ ] Skeleton screens fade to content

**Acceptance Criteria**:
- Animations enhance UX (not detract)
- No laggy animations
- Timing feels natural

---

## Phase 6: Cross-Browser Validation

### 6.1 Browser Compatibility
**Browsers to Test**:
- [ ] Chrome (latest)
- [ ] Safari (latest)  
- [ ] Firefox (latest)
- [ ] Edge (latest)

**Test Areas**:
- [ ] Layout renders identically
- [ ] Colors display consistently
- [ ] Animations run smoothly
- [ ] Focus indicators visible
- [ ] Form controls work

**Acceptance Criteria**:
- No layout breaks
- Consistent user experience
- All functionality works

### 6.2 Mobile Browser Testing
**Browsers**:
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet (Android)

**Test Areas**:
- [ ] Touch targets are adequate
- [ ] Viewport scaling correct
- [ ] No zoom required
- [ ] Bottom nav reachable
- [ ] Form input not covered by keyboard

**Acceptance Criteria**:
- Mobile experience is smooth
- No pinch-zoom required
- Touch interaction is intuitive

---

## Summary

**Estimated Testing Time**: 4-6 hours
**Pass/Fail Criteria**: All phases must pass before Wave 3

**If Issues Found**:
1. Document with screenshot
2. Link to component in codebase
3. Note severity (Critical/High/Medium/Low)
4. Fix, rebuild, re-test

---

