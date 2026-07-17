# Pricing Page Redesign Specification

> _Created: 2026-07-18 · Status: **IMPLEMENTATION SPEC**. This document specifies the exact changes to `/pricing` to match the Vercel ultra-premium standard and Supaprod's ink-and-starfield theme. Every measurement, color, spacing, and interactive behavior is prescriptive. Implementation checklist at section 10._

---

## 1. Current state audit

**File:** `src/routes/pricing.tsx`

Current structure (as of 2026-07-18):
- Page title: "PLG · public /pricing page (4-tier model, 2026-06-27)"
- Grid: 4-column tier cards (Free / Pro / Business / Enterprise)
- Monthly/annual toggle at page level
- Feature matrix below cards
- Connector logo chips per tier (GitHub, Linear, Notion, Jira, Google Docs)
- Credit dropdown per tier

**Design debt:**
- No hero section (eyebrow, headline, subheading)
- Uses old Ember Editorial palette (not ink-and-starfield)
- No backdrop (grid + starfield)
- Cards lack the premium frame treatment (#0d0d0e, border, edge light)
- No FAQ section
- Copy doesn't follow v13/v7 positioning ("Pricing" is category, not USP)

---

## 2. New structure (full page flow)

```
┌────────────────────────────────────────────────────────────┐
│ HEADER                                                     │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ [EYEBROW] PRICING (mono, zinc-600, 12px)            │  │
│ │ [HEADLINE] Simple pricing. No surprises. (Pixel, 64) │  │
│ │ [SUBHEADING] Pick a tier, pick your credits. Scale   │  │
│ │ when you're ready. (Sans, 16px, zinc-400)            │  │
│ │ [CTA] Start free (ember button, py-80 below)         │  │
│ └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│ TOGGLE SECTION (right-aligned)                             │
│ □ Bill annually                   [TOGGLE] Save 20% →      │
├────────────────────────────────────────────────────────────┤
│ TIER CARDS (4 columns, responsive: 1→2→4)                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ ⚡ Free  │ │ 👤 Pro   │ │ 👥 Team  │ │ 🏢 Ent.  │       │
│ │ $0/mo    │ │ $29/mo   │ │ $99/mo   │ │ Custom   │       │
│ │ ...      │ │ ...      │ │ (popular)│ │ ...      │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├────────────────────────────────────────────────────────────┤
│ FEATURE MATRIX (two-column: feature left, tiers right)     │
│ Feature Name         │ Free │ Pro │ Team │ Enterprise       │
│ ──────────────────────────────────────────────────────────  │
│ Missions             │  ✓   │  ✓  │  ✓   │  ✓              │
│ ...                  │      │     │      │                 │
├────────────────────────────────────────────────────────────┤
│ FAQ SECTION                                                │
│ [Q] Can I change tiers?                                    │
│ [A] Yes. Changes apply to your next billing period...      │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Header section

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Eyebrow + headline + subheading, centered, max-width 800px  │
│ CTA button below the copy, aligned center                   │
│ py-120 top, py-80 bottom                                    │
└─────────────────────────────────────────────────────────────┘
```

### Elements

#### Eyebrow
- **Text:** `PRICING` (uppercase)
- **Font:** Geist Mono, 12px, weight 500
- **Letter-spacing:** 0.12em
- **Color:** zinc-600 (`#71717a`)
- **Margin-bottom:** 12px

#### Headline
- **Text:** `Simple pricing. No surprises.`
- **Font:** Geist Pixel Square, 64px, weight 400
- **Line-height:** 1.1
- **Color:** white (`#f4f4f5`)
- **Wrapping:** one line (use `textWrap: balance` or test breakpoints)
- **Margin-bottom:** 16px

#### Subheading
- **Text:** `Pick a tier, pick your credits. Scale when you're ready. Every gate stays in your hands.`
- **Font:** Geist Sans, 16px, weight 400
- **Line-height:** 1.6
- **Color:** zinc-400 (`#a1a1aa`)
- **Max-width:** 520px (centered)
- **Margin-bottom:** 40px

#### CTA Button
- **Text:** `Start free`
- **Background:** ember (`#FF6B2C`)
- **Text color:** ink (`#0a0a0a`)
- **Padding:** 12px 24px
- **Font:** Geist Sans, 14px, weight 500
- **Border-radius:** 6px
- **Hover:** background → `#ff8344` (lighter ember)
- **Focus:** double-ring (ink gap + ember outer) per Tempo law
- **Cursor:** pointer
- **On click:** navigate to `/signup` (or open signup modal if in-page)

---

## 4. Toggle section

### Positioning
- Right-aligned, inside a container with `maxWidth: 1280px` and `px-96` (96px padding)
- Baseline: 24px margin-top (above the tier cards)

### Layout

```
┌─────────────────────────────────────────────────────────┐
│                                 [Label] [Toggle] [Badge] │
└─────────────────────────────────────────────────────────┘
```

### Elements

#### Label
- **Text:** `Bill annually`
- **Font:** Geist Sans, 14px, weight 400
- **Color:** zinc-400 (`#a1a1aa`)
- **Margin-right:** 12px

#### Toggle Switch
- **Component:** shadcn/ui Switch (or equivalent)
- **State on:** checked (annual selected)
- **Thumb color (on):** ember (`#FF6B2C`)
- **Track color (on):** `rgba(255,107,44,0.2)` (ember with 20% opacity)
- **Track color (off):** `rgba(255,255,255,0.10)` (subtle hairline)
- **Size:** default (24px height)
- **Margin-right:** 12px

#### Badge
- **Text:** `Save 20%`
- **Visibility:** only appears when toggle is ON (annual selected)
- **Font:** Geist Sans, 12px, weight 600
- **Color:** amber (`#d9a13c` — "Build amber" from the 2026-07-15 ruling)
- **Animation:** fade in 200ms when toggle flips; fade out 200ms when off
- **Margin-left:** auto (self-closes to the right edge)

**Behavior:**
- Toggle value controls: tier prices update live, badge shows/hides, feature matrix prices update
- No page reload; all changes via React state

---

## 5. Tier cards section

### Layout
- 4-column grid on desktop (1280px+)
- 2-column grid on tablet (768px–1279px)
- 1-column stack on mobile (< 768px)
- Gap: 24px (between cards)
- Container: `maxWidth: 1280px`, `px-96` (96px padding)
- Margin-top: 48px (below toggle)
- Margin-bottom: 80px (above feature matrix)

### Card anatomy (per tier)

```
┌─────────────────────────────────┐
│ [ICON] Tier Name                │  icon: lucide (20px, zinc-500)
│ $XX/month or /year              │  price: Pixel numerals (36px), accent if popular
│ "Up to X missions/month"         │  description: Sans, 12px, zinc-400
│                                 │
│ [CTA BUTTON]                    │  gray default or ember if popular
│                                 │
│ [CONNECTORS ROW]                │  inline SVG chips
│                                 │
│ Features:                       │  12px sans, zinc-400
│ ✓ Feature 1                     │
│ ✓ Feature 2                     │
│ ✗ Feature 3                     │
│ ...                             │
└─────────────────────────────────┘
```

### Card styling
- **Base:** `#0d0d0e`
- **Border:** 1px `rgba(255,255,255,0.10)`
- **Border-radius:** 12px
- **Padding:** 32px (interior content spacing)
- **Shadow:** none (no box-shadow; the border is the elevation)
- **Hover state:** border color → `rgba(255,107,44,0.2)` (subtle ember tint, for "popular" cards only)

### Popular tier indicator (Team tier)
- **Visual:** border color shifts to `rgba(255,107,44,0.2)` on hover (never static highlight per restraint budget)
- **Badge:** no text badge ("most popular" is banned vocabulary); instead, the border glow communicates it
- **Button:** ember background (vs. gray for other tiers)
- **Price color:** ember for the dollar amount (e.g., `<span style={{ color: "#FF6B2C" }}>$99</span>/month`)
- **Layout:** center card in the grid (offset by CSS if needed) OR keep in order but visually lift via micro-scale (1.02×) on hover

### Tier elements

#### Icon + Name row
- Icon: lucide component (20px, stroke-width 1.5, color zinc-500)
- Name: Geist Sans, 16px, weight 500, white
- Layout: flexbox, gap 12px, center-aligned vertically

#### Price
- **Large numeral:** Geist Pixel (for the digits only), 36px, weight 400, white (or ember for popular)
- **Unit:** Geist Sans, 12px, zinc-400, same line: "/month or /year"
- **Annual footnote:** "Billed annually" (12px, zinc-600, italic) appears ONLY on annual toggle

#### Description
- **Text:** "Up to X missions/month" or similar
- **Font:** Geist Sans, 12px, weight 400, color zinc-400
- **Margin-top:** 12px

#### CTA Button
- **Standard tiers:** gray button (`--ds-gray-1000` text on background)
  - Background: `#18181b` (raised)
  - Border: 1px `rgba(255,255,255,0.10)`
  - Text: zinc-100
  - Hover: background → `#252529`
- **Popular tier (Team):** ember button
  - Background: `#FF6B2C`
  - Text: ink (`#0a0a0a`)
  - Hover: background → `#ff8344`
- **Enterprise tier:** variant (see below)
- **Font:** Geist Sans, 14px, weight 500
- **Padding:** 12px 24px
- **Border-radius:** 6px
- **Width:** 100% (fill card width)
- **On click:** navigate to `/signup?tier=<name>` or open a contact form

#### Enterprise button
- **Text:** `Contact sales` (vs. "Start free")
- **Behavior:** opens a modal or sheet with an email form / Calendly embed
- **Styling:** same as standard tiers (gray)

#### Connector chips row
- Inline SVG logos (22px square, small, simple-icons style)
- Chip styling: background is connector brand color, gap 5px
- Always shows: GitHub, Linear, Notion, Jira, Google Docs
- Plus: "+ more" text (10px, zinc-500)
- Writeack badge: appears on tiers that support write-back (Notion, GitHub, Linear; gray background, border)
- Margin-top: 16px

#### Feature checklist
- **Header:** `Features` (12px mono, uppercase, zinc-500), margin-bottom 12px
- **Items:** one per line
  - ✓ (green check, 16px, `#4ac26b`) if included
  - ✗ (gray check, 16px, `#52525b`) if NOT included
  - Text: Geist Sans, 12px, zinc-300, margin-left 8px
  - Line-height: 1.8 (breathing room)
- **Example format:**
  ```
  Features
  ✓ Missions (limit varies by tier)
  ✓ Live decision record
  ✓ Outcome windows
  ✓ Public teardown
  ✗ Team collaboration tools
  ```

---

## 6. Feature matrix section

### Positioning
- Full width, `maxWidth: 1280px`, centered, `px-96` padding
- Margin-top: 80px (monumental negative space above)
- Margin-bottom: 80px

### Layout
- **Two-column grid on desktop:** feature name (left, 40% width) + checkboxes (right, 60% width, 4 columns for tiers)
- **Responsive:** stack to single column on mobile (feature left, checks stack below)
- **No borders:** only hairlines (`rgba(255,255,255,0.05)`) between feature groups
- **Row height:** 48px per item, `display: flex`, `alignItems: center`

### Header row (sticky or fixed on scroll — optional, at baseline)
- Repeat tier names (Free, Pro, Team, Enterprise)
- Font: Geist Mono, 12px, weight 500, color zinc-600
- Right-aligned in each column
- Slightly dimmer background (optional: `rgba(255,255,255,0.02)` on hover to show columns)

### Feature rows
- **Feature name (left):** Geist Sans, 14px, weight 400, color zinc-300
- **Check columns (right):** centered, 4 equal-width columns
  - ✓ glyph: green (`#4ac26b`), 16px
  - ✗ glyph: gray (`#52525b`), 16px
  - Both: centered via flexbox
- **Grouping:** related features grouped with subtle gaps (py-12 between groups)
  - Example groups: Missions · Decisions · Builds · Deployments · Outcomes · Transparency

### Example matrix structure

```
                    │ Free  │ Pro   │ Team  │ Enterprise
────────────────────┼───────┼───────┼───────┼───────────
Missions            │   ✓   │  ✓    │  ✓    │   ✓
Live counters       │   ✓   │  ✓    │  ✓    │   ✓
────────────────────┼───────┼───────┼───────┼───────────
Decision records    │   ✗   │  ✓    │  ✓    │   ✓
Outcome windows     │   ✗   │  ✓    │  ✓    │   ✓
────────────────────┼───────┼───────┼───────┼───────────
Public teardowns    │   ✓   │  ✓    │  ✓    │   ✓
Trust ledger        │   ✗   │  ✗    │  ✓    │   ✓
────────────────────┼───────┼───────┼───────┼───────────
Team members        │   1   │  1    │  ∞    │   ∞
Custom integrations │   ✗   │  ✗    │  ✗    │   ✓
```

---

## 7. FAQ section

### Positioning
- Full width, `maxWidth: 1280px`, centered, `px-96` padding
- Margin-top: 80px

### Header
- **Eyebrow:** "Common questions" (12px mono, zinc-600)
- **Headline:** `Everything you need to know` (Geist Pixel, 48px, white)
- Margin-bottom: 48px

### Accordion items
- **Questions:** 6–8 items (not 20+; keep it concise)
- **Layout:** Accordion component (Radix / shadcn/ui)
- **Item trigger (closed state):**
  - Chevron: right-pointing (zinc-500, 16px, rotates 90° on open)
  - Question text: Geist Sans, 14px, weight 500, color white
  - Hover: chevron color → ember
  - Cursor: pointer
  - Padding: 16px vertical, 0 horizontal
  - Bottom border: 1px `rgba(255,255,255,0.05)`
- **Item trigger (open state):**
  - Chevron rotates 90° (down-pointing)
  - No color change
- **Answer content:**
  - Geist Sans, 14px, weight 400, color zinc-400
  - Line-height: 1.8
  - Max-width: 800px
  - Padding: 16px bottom (before next question)
  - Can include: inline `<code>` tags (Geist Mono, 12px, zinc-300, light background `#18181b`), links (ember), emphasis (`<strong>`)

### Example FAQ

```
Q: Can I change my tier during the month?
A: Yes. Changes apply at the next billing cycle...

Q: What's included in the "free" tier?
A: One workspace, live missions, decision records (limited to 5)...

Q: Do you offer annual discounts?
A: Yes, 20% off when you select "Bill annually"...

Q: Can I use Supaprod with BYOK (bring your own key)?
A: Enterprise plans include BYOK for Claude, Anthropic...

Q: What if I need more team members?
A: Team and Enterprise tiers support unlimited members...

Q: Do you offer a free trial?
A: The Free tier is a permanent free tier, no expiry...
```

---

## 8. Responsive breakpoints & rules

### Desktop (1280px+)
- 4-column tier grid
- 4-column feature matrix
- 96px left/right padding
- Header at 64px, other headings at 48px

### Tablet (768px–1279px)
- 2-column tier grid
- Feature matrix: 2 tiers per row (need to reflow; alternative: single-column with horizontal scroll)
- 48px left/right padding
- Heading sizes reduced to 48px / 36px
- Toggle section: may wrap to two lines on smallest tablets

### Mobile (< 768px)
- 1-column tier stack
- Feature matrix: single-column, feature name + checks stacked (checks scroll horizontally with overflow-x: auto if needed, OR cards showing 2 tiers at a time)
- 24px left/right padding
- Heading sizes: 48px headline / 32px secondary
- All padding reduced: py-40 between major sections
- Grid backdrop opacity: 50% (or fade out entirely for performance)

**No horizontal scroll on mobile:** verify all elements fit within viewport width minus gutters.

---

## 9. Copy (source: [`docs/pitch/one-pager.md`](../../../docs/pitch/one-pager.md))

All copy on `/pricing` must follow the v13 positioning (locked 2026-07-15):

- **Zero:** "chatbot", "copilot", "operating system", competitor names, "early access"
- **Sanctioned:** "agents that ship real code" (with qualifier), "second brain", insider vocabulary with plain-words escape
- **Tone:** clear, honest, product-focused (not marketing-speak)
- **Numbers:** live only (pulled from `CREDIT_DROPDOWN_TIERS` and `priceForCredits` at render time)

**Example correct copy:** "Up to 100 missions/month" (live value) vs. ❌ "Unlimited missions" (aspirational) or ❌ "Get started building" (vague).

---

## 10. Implementation checklist

### Phase 1: Structure + styling (6–8 hours)

- [ ] Create new component: `PricingHeader.tsx` (eyebrow, headline, subheading, CTA)
- [ ] Create new component: `BillToggle.tsx` (monthly/annual switch + save badge)
- [ ] Create new component: `PricingCard.tsx` (card template for each tier)
- [ ] Create new component: `FeatureMatrix.tsx` (table/grid layout)
- [ ] Create new component: `PricingFAQ.tsx` (accordion with 6–8 questions)
- [ ] Refactor `/pricing.tsx` to use `LandingBackdrop` + `PUBLIC_INK_THEME`
- [ ] Update `/pricing.tsx` to assemble: Header → Toggle → Cards → Matrix → FAQ
- [ ] Add `<style>` block with focus ring CSS (double-ring, ink + ember)

### Phase 2: Responsive + polish (4–6 hours)

- [ ] Test mobile (320px, 375px, 414px)
- [ ] Test tablet (768px, 1024px)
- [ ] Test desktop (1280px, 1440px, 1920px)
- [ ] Verify no horizontal scroll on mobile
- [ ] Grid backdrop opacity at breakpoints
- [ ] All headings are one-line at intended breakpoint (use `textWrap: balance`)
- [ ] Focus rings visible on all interactive elements
- [ ] Hover states work (buttons, toggle, FAQ items)

### Phase 3: Live data + integration (2–4 hours)

- [ ] Verify `CREDIT_DROPDOWN_TIERS` renders correctly
- [ ] Verify `priceForCredits()` updates on monthly/annual toggle
- [ ] Verify feature matrix checks match tier entitlements (from `planPresentation`)
- [ ] Verify CTA buttons route to `/signup` or `/signup?tier=<name>`
- [ ] Enterprise "Contact sales" opens Calendly / email form
- [ ] No static mocks; all numbers are live pulls

### Phase 4: Accessibility + SEO (2–3 hours)

- [ ] WCAG AAA contrast (all text on dark backgrounds)
- [ ] Focus rings visible and correct (double-ring per Tempo)
- [ ] Keyboard navigation: Tab through all buttons, toggle, accordion
- [ ] Screen reader: headings have semantic hierarchy, buttons have aria-labels, accordion uses aria-expanded
- [ ] Alt text: N/A (no images), but icon descriptions if needed
- [ ] Meta: title, description, OG tags updated
- [ ] Structured data (optional): Schema.org PricingInfo

### Phase 5: Founder QA (ongoing)

- [ ] One full page review (visual + copy + interactivity)
- [ ] Address feedback (color, spacing, copy, interaction)
- [ ] Re-QA changed items
- [ ] Ship when founder sign-off

---

## 11. Files to create/modify

```
src/components/pricing/
  ├── [NEW] PricingHeader.tsx
  ├── [NEW] BillToggle.tsx
  ├── [NEW] PricingCard.tsx
  ├── [NEW] FeatureMatrix.tsx
  └── [NEW] PricingFAQ.tsx

src/routes/
  └── [MODIFY] pricing.tsx

design-reference/tempo-v5/applied/
  └── [THIS FILE] 2026-07-18-pricing-redesign-spec.md
```

---

## 12. Success criteria

- Pricing page loads with ink-and-starfield theme (grid + starfield visible)
- 4 tiers render with all elements (icon, price, description, CTA, connectors, features)
- Monthly/annual toggle updates prices live + shows/hides "Save 20%" badge
- Feature matrix displays with correct checks for each tier
- FAQ accordion opens/closes smoothly, answers readable
- Mobile: no horizontal scroll, all text readable, single-column layout
- Accessibility: WCAG AAA contrast, focus rings visible, keyboard nav works
- Founder visual QA passes (one round, no major revisions)
- Copy audit: zero banned words, all numbers live

---

## 13. Notes for the developer

1. **Color variables:** use `var(--ds-gray-*)`, `var(--ds-blue-*)`, etc. from `PUBLIC_INK_THEME` (defined in `src/components/landing/inkTheme.ts`). Never hard-code hex values except for the three-voice palette (ember, machine blue, memory gold).

2. **Hover states:** toggle opacity of pre-rendered glows (::after pseudo), never animate box-shadow.

3. **No box-shadow on cards.** Elevation is communicated by the border and (optional) opacity-toggled inner glow on hover.

4. **Geist fonts:** all three (Sans, Mono, Pixel) self-hosted at `/public/fonts/geist/`. Verify `@font-face` declarations in `src/styles.css` or `tokens/fonts.css`.

5. **Responsive: stack grids at 768px.** Use CSS Grid with `@media (max-width: 768px)` to change `grid-template-columns`.

6. **Build-only mode:** no plan.md updates, no docs, no brand-feed. Commit message: one line WHY, cite this spec file.

7. **Next designer:** read [`DESIGN-TEMPO.md`](../../../DESIGN-TEMPO.md), [`2026-07-15-landing-v2-ink-and-starfield.md`](./2026-07-15-landing-v2-ink-and-starfield.md), and this file in order before deviating from spec.
