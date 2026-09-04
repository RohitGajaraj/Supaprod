# STEP 0: Premium UI/UX Research Brief

> _Created: 2026-08-10 · Last updated: 2026-08-10_

> _36-Hour Design Sprint · Research Complete · Ready for STEP 1 Audit & STEP 2 System_

---

## Executive

This research extracts design patterns from:
- **Live product audit** (current Supaprod surface analysis)
- **Reference products** (Stripe, Linear, Figma, Canva, Vercel, Anthropic Google, OpenAI)
- **Design principles** (premium SaaS visual hierarchy, interaction patterns)

**Conclusion:** Current design is well-structured but **lacks visual premium finesse**. Surfaces work but don't *delight*. Fixes: precise typography, generous spacing, refined color, smooth motion, consistent density.

---

## Pattern Classes Extracted

### 1. App Shell & Navigation
**What premium products do:**
- Minimal chrome (Stripe, Linear)
- Clear visual hierarchy (logo/scope/actions)
- Persistent but unobtrusive sidebar
- Live status integrated, not separate
- Keyboard shortcuts discoverable but hidden

**Our current state:** ✅ Structure solid (AppFrame.tsx is well-thought); ❌ Visual hierarchy needs polish
**Decision:** Keep structure, refine spacing/typography/color contrast

### 2. Sidebar Navigation
**Premium pattern:**
- 236px width (Linear, Figma precedent)
- Clear category grouping
- Icon + label (not icon-only)
- Active state: underline or background
- Hover: subtle background, no color change
- Scrollable within region

**Our need:** Add visual hierarchy between sections, improve state indicators

### 3. Top Navigation Bar
**Premium pattern:**
- Left: logo/scope
- Center: live status (what's happening right now)
- Right: search/help/account (3-4 actions max)
- Background: clean, single-color
- Height: 56px (Vercel, Linear)

**Our need:** Tighten spacing, reduce visual noise in live-line area

### 4. Command Palette
**Premium pattern (Linear, VSCode):**
- Appears at top-center
- Fuzzy search
- Category grouping
- Keyboard-first design
- Keyboard shortcut hints
- Icon indicators for action type

**Our need:** Ensure keyboard navigation, add visual indicators

### 5. Dashboard/Overview Screens
**Premium pattern:**
- Grid of cards (3-4 column on desktop)
- Consistent card height / aspect ratio
- White space between cards
- Light dividers, not heavy borders
- Status indicators use color sparingly

**Our need:** Standardize card spacing, review color usage

### 6. Data-Dense Tables
**Premium pattern (Linear, Stripe, Figma):**
- Compact row height (40px default, 32px dense)
- Subtle hover state (light background, no border)
- Column dividers subtle/absent
- Sort indicators clear (arrow up/down)
- Selection checkbox on hover, not always visible
- Zebra striping absent (white space enough)

**Our need:** Tighten row heights, refine hover states, simplify visual style

### 7. Forms & Input Patterns
**Premium pattern:**
- Large tap targets (44px minimum)
- Clear focus ring (outline or shadow, 2-4px)
- Label always visible (above input, not placeholder)
- Validation: color + icon + message (not color alone)
- Disabled: reduce opacity, don't remove color
- Helper text: small, subtle color

**Our need:** Ensure focus rings pass AA, add clear validation patterns

### 8. Modals & Dialogs
**Premium pattern:**
- Animated entrance (fade + subtle scale)
- Backdrop blur or overlay (dark, ~0.5 opacity)
- Modal max-width 500px (keeps content scannable)
- Rounded corners (8-12px)
- Clear close button (X, top-right or ESC key)
- Actions: primary CTA bottom-right

**Our need:** Standardize modal entry animations, ensure consistent sizing

### 9. Empty/Loading/Error States
**Premium pattern:**
- Empty: icon + message + CTA
- Loading: spinner + brief message (not "loading...")
- Error: icon + error message + retry/dismiss
- All states: use existing design system colors/typography

**Our need:** Create consistent state component library

### 10. Tooltips & Microcopy
**Premium pattern:**
- Tooltips: appear on hover/focus, disappear on blur
- Microcopy: clear, short, action-oriented
- No jargon (avoid "click here")

### 11. Notifications/Toasts
**Premium pattern:**
- Max 3 simultaneous (stack or replace)
- Auto-dismiss after 4-6 seconds
- Manual dismiss button always visible
- Color: success (green), error (red), warning (amber), info (blue)
- Position: top-right (most products)

### 12. Authentication Surfaces
**Premium pattern:**
- Minimal form (email + password, one at a time)
- Social auth option (Google) prominent
- Links: "Forgot password?", "Sign up" small and subtle
- Form width: max 380px (narrow, focused)
- Spacing: generous (breathing room)

---

## Design Decisions: What We Adopt, What We Reject

| Pattern | Adopt | Reject | Rationale |
|---------|-------|--------|-----------|
| Sidebar width 236px | ✅ | | Proven at Linear, Figma; good balance |
| Top bar height 56px | ✅ | | Standard, leaves room for live status |
| Table row height 40px | ✅ | | Default; offer 32px compact mode |
| Modal max-width 500px | ✅ | | Keeps content scannable |
| Tooltip on hover | ✅ | | But also on keyboard focus |
| Toast auto-dismiss 6s | ✅ | | Long enough to read, not annoying |
| Heavy card borders | | ✅ | Use shadow instead (cleaner) |
| Zebra striping tables | | ✅ | White space + light hover enough |
| Placeholder labels | | ✅ | Use explicit labels above inputs |
| Icon-only sidebar | | ✅ | Always show label + icon (clarity) |

---

## Color & Typography Decisions

**Type Scale:**
- H1: 28px (page headlines)
- H2: 20px (section headers)
- Body: 14px (default)
- Small: 12px (metadata, labels)
- Mono: 13px (code, data)

**Color Palette:**
- Primary action: `#FF6B2C` (existing ember)
- Text primary: `#0a0a0a`
- Text muted: `#60584a`
- Borders: `rgba(0,0,0,0.12)` light / `rgba(255,255,255,0.15)` dark
- Success: `#10b981`
- Error: `#ef4444`
- Warning: `#f59e0b`

**Spacing Grid:**
- 4px, 8px, 12px, 16px, 24px, 32px, 48px
- Use multiples for consistency

---

## 10 Highest-Impact Fixes (STEP 1 Audit Output)

*(To be populated after STEP 1 audit completes)*

1. (TBD)
2. (TBD)
3. (TBD)
4. (TBD)
5. (TBD)
6. (TBD)
7. (TBD)
8. (TBD)
9. (TBD)
10. (TBD)

---

## References

Reference products analyzed (without Mobbin due to permission gate):
- **Stripe** — Payment UI, forms, tables
- **Linear** — Issue tracking, navigation, density
- **Figma** — Design tool UI, modals, inspector panels
- **Vercel** — Dashboard, deployment UX
- **Anthropic** — Claude UI patterns
- **Google** — Material Design principles applied
- **OpenAI** — ChatGPT UI, clean/minimal aesthetic

---

## Next: STEP 1 Audit

Audit findings will identify the 10 highest-impact fixes, prioritized by:
1. **User impact** (what users see most)
2. **Lift** (improvement magnitude)
3. **Effort** (time to implement)

