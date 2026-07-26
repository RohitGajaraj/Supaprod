# Vercel Geist Design System — Comprehensive Dissection

> **Status: ACTIVE DISSECTION** (2026-07-25)
> This document is the working reference for elevating Supaprod to Vercel/premium standard. Updated continuously as Wave 1-2 audit reveals refinements needed.

---

## 1. Color Palette & Token Structure

### 1.1 Geist Color Model
Vercel uses a **strictly semantic, minimal palette**:
- **Foreground/Background**: Pure black (#000000) on pure white (#FFFFFF) as anchors
- **Grays**: 12-step grayscale (50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900)
  - Used for UI surfaces, borders, text hierarchy
  - **Law: Every gray has a purpose** (not arbitrary; each step is used, none wasted)
- **Brand**: Single accent (Vercel blue, #0070F3)
  - **Used only for**: CTAs, interactive states, selection, success
  - **Never for**: Information cards, non-critical UI, decorative elements
- **Semantic colors**: Red (error), Amber (warning), Green (success)
  - Minimal, restrained, used only where the semantic meaning is critical

### 1.2 The Restraint Law
**Vercel's core principle: If something doesn't need color, don't add it.**
- Most UI is grayscale
- Accent color is used sparingly
- Empty space and scale do the visual work, not hue

### 1.3 Material/Elevation
**Vercel uses 2-3 elevation levels, not 10+:**
- Level 0 (flat): No shadow, no lift
- Level 1 (raised): Subtle shadow `0 2px 8px rgba(0,0,0,0.1)`
- Level 2 (modal): Stronger shadow `0 8px 32px rgba(0,0,0,0.15)`
- **Texture/material indication comes from subtle gradients and borders, not shadows**

---

## 2. Typography System

### 2.1 Type Hierarchy (Vercel)
**Three font families:**
- **Geist Sans**: Primary, all UI (clean, modern, optimized for screen)
- **Geist Mono**: Code, technical content, timestamps (monospaced)
- **Geist Pixel**: Brand/hero moments only (distinctive, not overused)

### 2.2 Type Scale
Vercel's scale (in pixels):
- **Hero/H1**: 48px (one per page maximum)
- **H2**: 32px
- **H3**: 24px
- **Large body**: 18px
- **Body**: 16px
- **Small/label**: 14px
- **Caption/tiny**: 12px
- **Micro**: 11px

**Line height rhythm:**
- Headlines: 1.2 (tight, commanding)
- Body copy: 1.6 (readable, spacious)
- Labels: 1.4 (compact)

**Letter spacing:**
- Headings: -0.02em (tight)
- Body: 0 (neutral)
- Labels: 0.02em (open, breathable)

### 2.3 Weight Usage
- **700 (bold)**: Headlines only
- **600 (semibold)**: Labels, small headings, emphasis
- **500 (medium)**: Data, strong body text
- **400 (regular)**: Body copy, default
- **300 (light)**: Deemphasis, muted text

### 2.4 The Pixel Font Rule
**Geist Pixel is used for:**
- One hero moment per surface (not multiple)
- Brand identity moments (logo area, main tagline, launch announcement)
- Never: body text, dense UI, labels, repeated elements
- Constraint: Makes text harder to read at scale; used only when visual distinctiveness is the goal

---

## 3. Spacing & Layout System

### 3.1 Modular Spacing (Vercel)
**Base unit: 4px**
- 4px (1x): Micro gaps, icon spacing
- 8px (2x): Component internal padding
- 12px (3x): Small gaps between elements
- 16px (4x): Standard gap between components
- 24px (6x): Section spacing
- 32px (8x): Major section spacing
- 48px (12x): Page-level sections
- 64px (16x): Hero spacing

**Rule: Every spacing value must be a multiple of 4.**

### 3.2 Padding & Margin Consistency
**Button padding:**
- Small: 8px 12px (text-label-12)
- Medium: 12px 16px (text-label-13)
- Large: 16px 24px (text-label-14)

**Card padding:**
- Standard: 24px (all sides)
- Compact: 16px
- Dense: 12px

**Never mix units:** Use spacing tokens, never px directly in components.

### 3.3 Container Widths
- Mobile: full width with 16px margin
- Tablet (768px): 100% - 32px
- Desktop (1440px): 1200px centered with 120px gutters

---

## 4. Component Anatomy (Vercel Patterns)

### 4.1 Buttons
**States:**
- **Default**: White background, gray border, black text
- **Hover**: Light gray background (#FAFAFA)
- **Active**: Darker gray background (#F0F0F0)
- **Disabled**: Grayed out, no hover
- **Primary (CTA)**: Vercel blue background, white text
  - Hover: Darker blue (#0060E0)
  - Active: Darkest blue (#0051D5)

**Sizes:**
- Small: 32px height, 12px 16px padding
- Medium: 40px height, 16px 24px padding
- Large: 48px height, 20px 32px padding

**Icon usage:**
- Icons are 16px or 20px, centered vertically
- Gap between icon and text: 8px
- No icon-only buttons without clear context (violates accessibility)

### 4.2 Inputs
**Border:**
- Default: 1px solid #E5E5E5 (gray-200)
- Hover: 1px solid #CCCCCC (gray-300)
- Focus: 2px solid #0070F3 (blue) + soft shadow
- Error: 2px solid #FF0000 (red)

**Padding:**
- 12px 16px (vertical × horizontal)

**Label:**
- 14px, 600 weight, positioned above input
- Spacing to input: 8px

### 4.3 Cards
**Anatomy:**
- Background: White (#FFFFFF) or #FAFAFA (subtle contrast)
- Border: 1px solid #E5E5E5 (gray-200)
- Padding: 24px
- Border radius: 8px (consistent across all components)
- Shadow: `0 2px 8px rgba(0,0,0,0.1)` (level 1)

**Hover state:**
- Shadow increases to `0 8px 16px rgba(0,0,0,0.12)`
- Background lightens slightly to #F9F9F9

### 4.4 Dropdowns & Selects
**Trigger button:**
- Same styling as buttons (default state)
- Chevron icon on right
- Text alignment: left

**Menu:**
- Minimum width = trigger width
- Positioned below/above based on viewport space
- Max height: 400px with scroll
- Item height: 40px
- Item padding: 12px 16px
- Hover: #F5F5F5 background
- Selected: Blue background with white text

**Accessibility:**
- `aria-expanded` indicates open/closed
- `aria-label` on trigger
- Keyboard nav: Arrow Up/Down, Enter, Escape

### 4.5 Modals & Dialogs
**Backdrop:**
- Semi-transparent black `rgba(0,0,0,0.5)`
- Blocks interaction with background
- Closes on escape (unless blocking)

**Modal body:**
- 96px max-width at desktop, 90% mobile
- Centered on screen
- Shadow: Level 2 `0 8px 32px rgba(0,0,0,0.15)`
- Padding: 32px

**Focus trap:**
- Initial focus on first interactive element or close button
- Tab cycles within modal only
- Escape key closes (unless form has unsaved changes)

### 4.6 Notifications/Toasts
**Position:**
- Bottom-right by default
- Stack vertically with 8px gap
- Max 3 visible at once

**Anatomy:**
- Icon (16px) on left
- Text (14px body)
- Close button (16px) on right
- Padding: 12px 16px
- Border-radius: 8px

**Colors by type:**
- Success: Green border, subtle green background
- Error: Red border, subtle red background
- Info: Blue border, subtle blue background
- Warning: Amber border, subtle amber background

---

## 5. Motion & Transitions

### 5.1 Timing
**Vercel timing principles:**
- Micro-interactions (hover, focus): 140ms (swift)
- Transitions (slide, fade): 200-300ms (smooth)
- Modals (enter/exit): 200ms
- Longer animations (loader): 2-4 seconds (loop)

**Easing:**
- Interactive states: cubic-bezier(0.175, 0.885, 0.32, 1.1) (ease-out-back)
- Smooth transitions: cubic-bezier(0.4, 0, 0.2, 1) (material easing)
- Exits: cubic-bezier(0.7, 0, 1, 0.3) (quick decay)

### 5.2 Motion Types
**Hover states:**
- Scale: 1.02x (subtle growth)
- Shadow: Increase by one level
- Color: Shift to next gray step or darken
- Duration: 140ms

**Loading states:**
- Spinner or skeleton
- Spinner: 2-second loop, smooth rotate
- Skeleton: Subtle shimmer left-to-right, 1.5-second loop

**Transitions:**
- Slide-in: 200ms from off-screen
- Fade-in: 200ms from opacity 0
- Expand: 200ms height animation (not width)

---

## 6. Accessibility Standards (Vercel)

### 6.1 Color Contrast
- Body text: WCAG AAA (7:1 minimum)
- Large text (18px+): WCAG AA (4.5:1)
- UI components: WCAG AA minimum (4.5:1)

**Testing:** Use Chrome DevTools, Accessibility panel → contrast checker

### 6.2 Focus States
**All interactive elements must have:**
- 2px focus ring (solid line)
- Offset: 2px
- Color: Brand blue or high-contrast alternative
- Never removed (use `outline` not `outline: none`)

### 6.3 ARIA & Semantic HTML
- Buttons are `<button>`, links are `<a>`, not divs
- `aria-label` on icon-only buttons
- `aria-expanded` on toggles/dropdowns
- `aria-pressed` on toggle buttons
- `aria-disabled` on disabled elements
- `role="alert"` on toast notifications
- `role="status"` on live-updating content

### 6.4 Keyboard Navigation
- Tab order follows visual flow
- Focusable elements: buttons, inputs, links, etc.
- No positive tabindex (breaks natural order)
- Modal: Focus trap + Escape to close
- Dropdown: Arrow keys to navigate, Enter to select

### 6.5 Loading States
- Show loading indicator immediately (not after 200ms)
- Announce: `aria-busy="true"` or `aria-label="Loading..."`
- Skeleton screens OK if labeled appropriately

---

## 7. Responsive Design (Vercel)

### 7.1 Breakpoints
- **Mobile**: 375px to 767px
- **Tablet**: 768px to 1023px
- **Desktop**: 1440px+

**Rule: Mobile-first approach**
- Default styles = mobile
- `@media (min-width: 768px)` for tablet+
- `@media (min-width: 1440px)` for desktop

### 7.2 Typography Scaling
- Mobile H1: 32px (vs. desktop 48px)
- Mobile body: 14px (vs. desktop 16px)
- Spacing reduces on mobile (24px → 16px sections)

### 7.3 Touch Targets
- Minimum 44px height (WCAG)
- Minimum 44px width (WCAG)
- Spacing between touch targets: 8px minimum

### 7.4 Layout Changes
- Navigation: Hamburger menu on mobile, horizontal on desktop
- Grid: 1 column mobile, 2-3 column desktop
- Cards: Full width mobile, fixed width desktop
- Modals: Full width mobile (with margin), centered desktop

---

## 8. Icon System

### 8.1 Icon Standards (Vercel)
**Size:**
- 16px: Default (labels, small UI)
- 20px: Prominent (buttons, larger components)
- 24px: Hero/emphasis
- Never: 18px, 22px, etc. (use 16/20/24 grid)

**Style:**
- Stroke-based (not filled)
- 1.5px stroke width at 16px
- 2px stroke width at 20px+
- Consistent weight across set

**Color:**
- Inherit from text color (currentColor)
- Never different from adjacent text
- Opacity 0.6 for muted/disabled state

**Accessibility:**
- Icon-only buttons: `aria-label` required
- Decorative icons: `aria-hidden="true"`
- Inline icons: No additional label needed if adjacent text is present

---

## 9. Vercel's Design Laws (Synthesis)

1. **Restraint is the primary tool**: Simplify, don't add color/complexity
2. **Grays do most of the work**: Hierarchy and depth via scale, not hue
3. **One accent color**: Vercel blue, used strategically for CTAs and critical states
4. **Semantic colors only**: Red (error), Amber (warning), Green (success)
5. **Spacing is rhythm**: 4px grid, consistent gaps create visual flow
6. **Typography hierarchy**: Three weights (400/600/700), clear size steps
7. **Motion is craft**: 140-300ms, easing, purpose-driven (not ornamental)
8. **Accessibility first**: WCAG AA minimum, focus rings, keyboard nav always
9. **Responsive is default**: Mobile-first, breakpoint cascade, not afterthought
10. **No details are small**: Every pixel, shadow, weight choice is intentional

---

## 10. Application to Supaprod

### Current State (Gap Analysis)
- [ ] **Color**: Accent blues too prominent; need grayscale lift
- [ ] **Typography**: Geist Sans OK, but Geist Pixel barely used, Geist Mono sparse
- [ ] **Spacing**: Tokens exist but inconsistent application
- [ ] **Motion**: Minimal; need 140-300ms transitions
- [ ] **Components**: Shadow system too aggressive; buttons need state refinement
- [ ] **Accessibility**: Focus rings weak; some icon-only buttons missing labels
- [ ] **Responsive**: Gaps at 768px breakpoint
- [ ] **Elevation**: Material overuse; dial it back to 2-3 levels

### Wave 1-2 Audit Priority
1. **Accent color refinement** (reduce blues, semantic usage)
2. **Button & input state refinement** (hover, focus, active)
3. **Modal & dialog focus trap verification**
4. **Typography pass** (Geist Pixel integration on heroes)
5. **Spacing audit** (4px grid consistency)
6. **Motion audit** (140-300ms timing, easing)
7. **Accessibility audit** (focus, ARIA, keyboard nav)
8. **Responsive audit** (375/768/1440 breakpoints)

---

**Next step: Audit Wave 1-2 surfaces against this dissection.**
