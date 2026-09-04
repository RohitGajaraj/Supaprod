# Marketing Site Redesign — Builder's Checklist

> _Created: 2026-08-03 · Last updated: 2026-08-11_

**Status:** Design & spec complete, ready for implementation  
**Phase 1 effort:** ~40 hours (pricing + product showcase + proof continuity + responsive QA)  
**Build-only mode:** Active (no docs overhead, just commit the WHY)

---

## Pre-Build Setup (1–2 hours)

- [ ] Read [`design/archive/tempo-v5.md`](../design/archive/tempo-v5.md) — the base contract (30 min)
- [ ] Read [`design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md`](../../design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md) — the landing precedent (30 min)
- [ ] Read [`design-reference/tempo-v5/applied/2026-07-18-marketing-site-expansion.md`](../../design-reference/tempo-v5/applied/2026-07-18-marketing-site-expansion.md) — strategy + patterns (30 min)
- [ ] Skim [`design-reference/tempo-v5/applied/2026-07-18-pricing-redesign-spec.md`](../../design-reference/tempo-v5/applied/2026-07-18-pricing-redesign-spec.md) — detailed specs (20 min, keep open while coding)
- [ ] Review code examples: `src/routes/product.tsx`, `src/components/landing/{SectionAlternate,FramedVisual}.tsx` (15 min)
- [ ] Verify `PUBLIC_INK_THEME` is defined in `src/components/landing/inkTheme.ts` (5 min)
- [ ] Check that `LandingBackdrop.tsx` renders grid + starfield (5 min)

**Total:** ~2 hours of reading before writing code. Worth it.

---

## Phase 1A: New Components (8–10 hours)

### [ ] Commit 1: SectionAlternate + FramedVisual

**Status:** Two new components, fully typed, ready to use.

- [ ] `src/components/landing/SectionAlternate.tsx` — DONE (commit in repo, see product.tsx for usage)
  - [ ] Verify props interface (headline, body, visual, capabilities, highlightCapability)
  - [ ] Verify alternation logic (odd/even index determines text/visual order)
  - [ ] Verify spacing (96px gap, 96px padding, 32px rhythm)
  - [ ] Verify responsive (grid-template-columns: 1fr 1fr on desktop, 1fr on mobile)
  - [ ] Verify typography (Pixel headline, Sans body, Mono caps, colors match contract)
  - [ ] Test in browser: both text-left and text-right orders render
  - [ ] Test hover: capability items (`.cap-item`) hover to ember
  - [ ] Test mobile: stack collapses to single column, no horizontal scroll
  - [ ] Test accessibility: headings semantic, text color contrast WCAG AAA

- [ ] `src/components/landing/FramedVisual.tsx` — DONE (commit in repo)
  - [ ] Verify props interface (src, alt, aspectRatio, dimmed)
  - [ ] Verify frame styling (#0d0d0e base, 1px border, 12px radius)
  - [ ] Verify hover: glow opacity toggles (never animate box-shadow)
  - [ ] Verify lazy loading (`loading="lazy"`)
  - [ ] Verify alt text present and semantic
  - [ ] Test in browser: hover state works (edge light appears)
  - [ ] Test responsive: maintains aspect ratio, no overflow

**Commit message:**
```
Add SectionAlternate and FramedVisual for marketing showcase sections

Implements Vercel-inspired alternating section pattern (text+visual, sides toggle by index) and premium frame wrapper (edge-light glow on hover, no box-shadow animation per rauno.me craft). Both fully typed, accessible, responsive. Used by /product, /features, /use-cases pages.

Ref: design-reference/tempo-v5/applied/2026-07-18-marketing-site-expansion.md § 3–4
```

---

## Phase 1B: Pricing Page Redesign (12–15 hours)

### [ ] Commit 2: PricingHeader component

- [ ] Create `src/components/pricing/PricingHeader.tsx`
  - [ ] Eyebrow: Mono, 12px, zinc-600, uppercase, 0.12em letter-spacing
  - [ ] Headline: Pixel, 64px, white, `textWrap: balance` or one line
  - [ ] Subheading: Sans, 16px, zinc-400, max 520px, centered
  - [ ] CTA button: ember, 14px, "Start free", hover to `#ff8344`
  - [ ] Spacing: py-120 top, py-80 bottom
  - [ ] Focus ring: double-ring (ink + ember)
  - [ ] Test responsive: headline sizes adjust at breakpoints
  - [ ] Verify copy matches locked v13 positioning (no banned words)

**Commit message:**
```
Add PricingHeader component for pricing page hero

Eyebrow + headline (Pixel 64px) + subheading + CTA button, centered layout. All spacing and typography follow DESIGN-TEMPO contract; copy locked from v13 positioning.
```

### [ ] Commit 3: BillToggle component

- [ ] Create `src/components/pricing/BillToggle.tsx`
  - [ ] Monthly/annual toggle (Radix or shadcn Switch)
  - [ ] "Save 20%" badge: appears only when toggle is ON
  - [ ] Badge text: amber (`#d9a13c`), 12px, weight 600
  - [ ] Fade in/out 200ms on toggle change
  - [ ] Layout: label + switch + badge, right-aligned
  - [ ] Callback: passes `isAnnual` boolean to parent
  - [ ] Test: toggle interaction, badge visibility, animation smoothness
  - [ ] Verify colors: ember active, zinc-500 inactive

**Commit message:**
```
Add BillToggle component with save badge

Monthly/annual switch with conditional "Save 20%" badge (amber, fades in/out 200ms). Callback-based, no internal price state. Right-aligned in pricing header.
```

### [ ] Commit 4: PricingCard component

- [ ] Create `src/components/pricing/PricingCard.tsx`
  - [ ] Props: tier name, icon (lucide), price, description, features array, isPopular, connectors array
  - [ ] Card base: #0d0d0e, border 1px rgba(...0.10), radius 12px, padding 32px
  - [ ] Icon + name: lucide 20px + Sans 16px, flex gap 12px
  - [ ] Price: Pixel numerals (36px, white or ember if popular) + Sans unit text
  - [ ] Description: Sans 12px, zinc-400
  - [ ] CTA button: full-width, gray (standard) or ember (popular), "Start free" or "Contact sales"
  - [ ] Connector chips: inline SVG logos, 22px, with "write-back" badge if applicable
  - [ ] Feature checklist: ✓/✗ glyphs (green/gray), Sans 12px, one per line
  - [ ] Hover: border color → `rgba(255,107,44,0.2)` (popular card only)
  - [ ] Popular tier: price in ember, button in ember, border glow on hover
  - [ ] Test: all tier variants (free, pro, team/popular, enterprise)
  - [ ] Test mobile: card stacks, button full-width readable

**Commit message:**
```
Add PricingCard component for tier display

Flexible card template: icon + name + price + features + connectors + CTA. Supports popular tier styling (ember accents, border glow on hover). Fully responsive, accessible.
```

### [ ] Commit 5: FeatureMatrix component

- [ ] Create `src/components/pricing/FeatureMatrix.tsx`
  - [ ] Props: features array (feature name + per-tier included boolean)
  - [ ] Layout: two-column desktop (40% feature name, 60% tier checks), single-column mobile
  - [ ] Feature name: Sans 14px, zinc-300, left-aligned
  - [ ] Tier checks: 4 centered columns (equal width), ✓/✗ glyphs (16px, green/gray)
  - [ ] Header row: tier names repeated, Sans Mono 12px, zinc-600, right-aligned (optional sticky)
  - [ ] Feature grouping: gaps between groups (py-12), hairline dividers `rgba(...0.05)`
  - [ ] No full-width borders; only group separators
  - [ ] Row height: 48px, flex aligned
  - [ ] Test responsive: 4-column → 2-column → 1-column + scroll
  - [ ] Test mobile: feature name + checks don't overflow
  - [ ] Verify contrast: zinc-300 on #0a0a0a is WCAG AAA

**Commit message:**
```
Add FeatureMatrix component for pricing tier comparison

Two-column grid (feature name + tier checkmarks), responsive to single-column mobile. Feature grouping with hairline dividers; no full-width borders per restraint budget.
```

### [ ] Commit 6: PricingFAQ component

- [ ] Create `src/components/pricing/PricingFAQ.tsx`
  - [ ] Accordion: Radix Accordion or shadcn/ui
  - [ ] Eyebrow: "Common questions", Mono 12px, zinc-600
  - [ ] Headline: Pixel 48px, white
  - [ ] 6–8 questions (not 20+)
  - [ ] Trigger: chevron (right, zinc-500) + question (Sans 14px, weight 500), rotates 90° on open
  - [ ] Chevron hover: color → ember
  - [ ] Answer content: Sans 14px, zinc-400, line-height 1.8
  - [ ] Answer can include: `<code>` blocks (Mono 12px), links (ember), `<strong>`
  - [ ] Borders: 1px `rgba(...0.05)` between items
  - [ ] Padding: 16px per item
  - [ ] Test: open/close animation smooth, text readable, links work
  - [ ] Test mobile: question text doesn't wrap awkwardly

**Example FAQ:**
```
Q: Can I change my tier during the month?
A: Yes. Changes apply at the next billing cycle. No prorations mid-cycle.

Q: What's included in the Free tier?
A: One workspace, up to 10 missions/month, decision records (limited to 5).

Q: Do you offer annual discounts?
A: Yes, 20% off when you select "Bill annually" in the pricing page toggle.

Q: Can I use Supaprod with BYOK?
A: Enterprise plans include BYOK for Claude via Anthropic; any model via custom integration.

Q: What if I need more team members?
A: Team and Enterprise tiers support unlimited members.

Q: Do you offer a free trial?
A: The Free tier is permanent (no time limit). Paid tiers cancel anytime.
```

**Commit message:**
```
Add PricingFAQ component with accordion pattern

6–8 questions, chevron animations, formatted answers with code/link support. All styling matches ink-and-starfield theme; text contrast WCAG AAA.
```

### [ ] Commit 7: Refactor /pricing route

- [ ] Modify `src/routes/pricing.tsx`
  - [ ] Add `LandingBackdrop` import and render at page root
  - [ ] Apply `PUBLIC_INK_THEME` to page root (either via `data-obsidian` or direct style)
  - [ ] Wrap page in `<div className="bg-[#0a0a0a] min-h-screen" data-obsidian>`
  - [ ] Add `<style>` block with focus ring CSS (double-ring: `0 0 0 2px #0a0a0a, 0 0 0 4px #FF6B2C`)
  - [ ] Assemble page: PricingHeader → BillToggle → tier cards grid → FeatureMatrix → FAQ
  - [ ] Pass monthly/annual state to cards (via BillToggle callback) and FeatureMatrix
  - [ ] Live pricing: call `priceForCredits()` with current toggle state
  - [ ] Connector chips: pass correct logos per tier
  - [ ] Feature matrix: populate from `planPresentation` entitlements
  - [ ] CTA routing: "Start free" → `/signup`; tier CTAs → `/signup?tier=<name>`; "Contact sales" → email form or Calendly
  - [ ] Metadata: update title, description, OG tags
  - [ ] Test: all interactive states work, prices update live, no 404s

**Commit message:**
```
Redesign /pricing to Vercel ultra-premium standard

Full redesign: ink-and-starfield theme + hero + monthly/annual toggle + 4-tier cards + feature matrix + FAQ. All pricing live (pulled from priceForCredits), all copy locked from v13 positioning. Responsive 4→2→1 column grids.
```

---

## Phase 1C: Product Showcase Pages (12–14 hours)

### [ ] Commit 8: /product page

**Status:** Template live at `src/routes/product.tsx` (code done, needs image paths + content review)

- [ ] Verify structure:
  - [ ] Hero section (eyebrow + headline + subheading)
  - [ ] Six SectionAlternate sections (Discover, Decide, Define, Build, Ship, Learn)
  - [ ] Close CTA section ("Ready to run your loop?")
- [ ] Replace image paths: `/images/discover.png` → real screenshot paths
  - [ ] Source: use actual product UI screenshots (or high-quality mocks if UI not screenshot-ready)
  - [ ] Dimensions: ~1400x900 px (16:10 aspect)
  - [ ] Dimmed: set `dimmed={true}` on FramedVisual to keep headlines brightest
- [ ] Verify copy:
  - [ ] All headlines are Pixel, 64px, one line (use `textWrap: balance`)
  - [ ] All body copy is Sans, 16px, zinc-400, max 240 chars
  - [ ] All capability lists: 4 uppercase mono items
  - [ ] No banned words (chatbot, copilot, operating system, etc.)
- [ ] Test responsive:
  - [ ] Mobile (320px): single column, text full-width, images readable
  - [ ] Tablet (768px): double grid (text/visual still alternate)
  - [ ] Desktop (1280px): full two-column grid
- [ ] Test interactivity:
  - [ ] Capability items hover to ember
  - [ ] FramedVisual edge-light glows on hover
  - [ ] Close CTA button hover state works
- [ ] Test accessibility:
  - [ ] All headings semantic (h1, h2)
  - [ ] All alt text present and semantic
  - [ ] Color contrast WCAG AAA
  - [ ] Focus rings visible
  - [ ] Keyboard nav works

**Commit message:**
```
Add /product page: six-station loop showcase

Hero + six SectionAlternate sections (Discover, Decide, Define, Build, Ship, Learn) + close CTA. Full responsive grid alternation, all copy locked, image paths to live screenshots. Template structure done; awaiting image assets.
```

### [ ] Commit 9: /features page

- [ ] Create `src/routes/features.tsx`
  - [ ] Hero section (eyebrow + headline + subheading)
  - [ ] Three feature showcase sections:
    1. **The track record** — evidence, auditability, moat, visual: decision card screenshot
    2. **Earned autonomy** — trust ramp by track record, non-overridable gates, visual: permissions ramp UI
    3. **Self-improving judgment** — outcome-ranked playbooks, workspace learning, visual: memory trace UI
  - [ ] Each section: headline (Pixel 64px) + body (Sans 16px) + mono spec list (4 items) + FramedVisual
  - [ ] Alternating text/visual layout (use SectionAlternate)
  - [ ] Close section: "See how other teams use Supaprod" → link to `/use-cases`
  - [ ] SEO: title, description, OG tags
  - [ ] Test responsive: mobile, tablet, desktop
  - [ ] Test accessibility: semantic headings, alt text, contrast, focus rings

**Commit message:**
```
Add /features page: three deep-dive capability showcases

Track record + earned autonomy + self-improving judgment, using SectionAlternate pattern. Real product screenshots, locked copy, full responsive design.
```

### [ ] Commit 10: /use-cases page

- [ ] Create `src/routes/use-cases.tsx`
  - [ ] Hero section
  - [ ] Four use-case cards or sections:
    1. **The founding PM** — "One person, 20 agents, one track record"
    2. **The product org** — "Cross-team decisions, one record"
    3. **The design + build handoff** — "Specs that stick, output that matches"
    4. **The post-launch team** — "Learn what worked, rank the next bet"
  - [ ] Option A: card grid (2×2 on desktop, 1 on mobile), each with title + description + "Read story" link
  - [ ] Option B: four alternating showcase sections (same pattern as /product)
  - [ ] Recommend: Option B (more premium, showcases full pattern)
  - [ ] SEO: title, description, OG tags
  - [ ] Test responsive and accessibility

**Commit message:**
```
Add /use-cases page: four role-based scenarios

Founding PM / scaling org / design+build handoff / post-launch team, using SectionAlternate pattern. Scenario-based copy (never generic "helps you collaborate"). Full responsive design.
```

---

## Phase 1D: Proof Pages Continuity (2–3 hours)

### [ ] Commit 11: Verify proof pages theming

- [ ] Check `/proof` route
  - [ ] Does it use `PUBLIC_INK_THEME` + `LandingBackdrop`?
  - [ ] If no, wrap with backdrop and theme
  - [ ] If yes, spot-check colors (canvas `#0a0a0a`, text zinc family)
  - [ ] Verify OG tags and metadata

- [ ] Check `/d/$slug` route (decision record share)
  - [ ] Same theme audit as above
  - [ ] Verify the three-voice trace legend is visible (agent blue / you ember / memory gold)
  - [ ] Verify lineage visualization uses correct colors
  - [ ] Test on mobile: card readable, legend fits

- [ ] Check `/t/$slug` route (teardown share)
  - [ ] Same theme audit
  - [ ] Verify risk callouts, hypothesis cards, outcome links
  - [ ] Test responsive

- [ ] Check `/p/teardown` (public Critic teardown)
  - [ ] Same theme audit
  - [ ] Full treatment applied

**Commit message:**
```
Verify proof pages use ink-and-starfield theme consistently

Audited /proof, /d/$slug, /t/$slug, /p/teardown for PUBLIC_INK_THEME + backdrop. All pages now speak the landing language; fixed minor theming inconsistencies.
```

---

## Phase 1E: Responsive QA & Polish (6–8 hours)

### [ ] Commit 12: Responsive screenshots + polish

- [ ] Screenshot all public pages at three breakpoints:
  - [ ] Mobile: 320px width (iPhone SE)
  - [ ] Tablet: 768px width (iPad)
  - [ ] Desktop: 1280px width (MacBook)
- [ ] Check each breakpoint:
  - [ ] No horizontal scroll
  - [ ] Text readable (font sizes not too small)
  - [ ] Images scale correctly
  - [ ] Buttons tappable (44px min height on mobile)
  - [ ] Spacing rhythm maintained (py-32, gap-24 at desktop, scales down on mobile)
  - [ ] Grid backdrop visible but not overwhelming
- [ ] Performance audit:
  - [ ] Run Lighthouse on `/` (landing), `/pricing`, `/product`
  - [ ] Target: 90+ performance score
  - [ ] Core Web Vitals: green on all metrics
  - [ ] Image optimization: lazy load, format WebP if possible
- [ ] Copy audit (final pass):
  - [ ] Grep for banned words: "chatbot", "copilot", "operating system", "cohort", "early access"
  - [ ] Grep for numbers: all must be live pulls, not mocked
  - [ ] Check headlines fit one line per founder taste rule
  - [ ] Check no text sits on visible grid/starfield (add `.cap-scrim` or opaque base if needed)
- [ ] Accessibility audit (final pass):
  - [ ] WAVE or axe DevTools scan: zero errors, <10 warnings
  - [ ] Manual keyboard nav: Tab through all pages, no focus traps
  - [ ] Manual screen reader (VoiceOver/NVDA): headings, buttons, links announced correctly
  - [ ] Color contrast: verify WCAG AAA on all text (use WebAIM tool)
  - [ ] Motion: test with `prefers-reduced-motion` enabled; animations resolve to end state
- [ ] Founder visual QA:
  - [ ] Share responsive screenshots
  - [ ] Collect feedback (color, spacing, copy, interaction)
  - [ ] Record all items in a checklist
  - [ ] Act on every item; re-test changed elements
  - [ ] Re-share with founder if major changes
  - [ ] Get explicit sign-off before shipping

**Commit message:**
```
Responsive QA and accessibility polish

Tested all pages at 320px, 768px, 1280px; verified no horizontal scroll, text readable, images scale, buttons tappable. Lighthouse scores 90+; WCAG AAA contrast verified. Copy audit: zero banned words, all numbers live. Founder visual QA: one pass, all feedback addressed, sign-off obtained.
```

---

## After Phase 1: Verification Checklist

Before closing the redesign project, verify:

- [ ] All pages load with ink-and-starfield backdrop (grid + starfield visible)
- [ ] `/product`, `/features`, `/use-cases` showcase six-station loop correctly
- [ ] `/pricing` renders hero + toggle + 4 tiers + matrix + FAQ
- [ ] Monthly/annual toggle updates prices live (no page reload)
- [ ] All CTAs route correctly (/signup, /signup?tier=X, email forms)
- [ ] Responsive: mobile (320px), tablet (768px), desktop (1280px) all tested
- [ ] Accessibility: WCAG AAA contrast, focus rings visible, keyboard nav works, screen reader friendly
- [ ] Copy: zero banned words, all numbers live (not mocked), no competitor names
- [ ] Performance: Lighthouse 90+, Core Web Vitals green
- [ ] Founder visual QA: one pass, all feedback resolved, sign-off obtained
- [ ] Git history: clean commits, each with a WHY statement

---

## Build-Only Mode Rules

**ACTIVE (founder ruling 2026-07-04):** No documentation overhead during this phase.

- [ ] Do NOT update `docs/planning/archive/build-log.md` with progress
- [ ] Do NOT update `docs/planning/SOURCE-OF-TRUTH.md`
- [ ] Do NOT update `docs/planning/SOURCE-OF-TRUTH.md`
- [ ] Do NOT write feature docs or design docs (except design-reference applied records, which are already done)
- [ ] Do NOT update brand-feed.md for social content
- [ ] Do commit WHY statements with every git commit (one line, cite the design spec)
- [ ] Do use git history as the build log

---

## Reference Documents (Keep Handy)

1. **[DESIGN-TEMPO.md](../design/archive/tempo-v5.md)** — the law (colors, typography, materials, spacing, motion)
2. **[2026-07-15 Landing Applied Record](../../design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md)** — the precedent
3. **[2026-07-18 Marketing Site Expansion](../../design-reference/tempo-v5/applied/2026-07-18-marketing-site-expansion.md)** — strategy
4. **[2026-07-18 Pricing Redesign Spec](../../design-reference/tempo-v5/applied/2026-07-18-pricing-redesign-spec.md)** — exact prescriptive detail
5. **[Vercel Playbook](../../design-reference/tempo-v5/research/vercel-composition-playbook.md)** — composition patterns and craft rules

---

## Questions? Escalation Path

1. **"Where is X defined?"** → Search the spec files (cmd+F for keywords)
2. **"What color should this be?"** → [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md). Monochrome by default; ember is rare and is NOT the default for actions; blue means agents running; green and red mean status. Tokens live in `src/styles/ink.css`.
3. **"What's the spacing rule?"** → the `--sp-space-*` tokens in `src/styles/ink.css` and the primitives in `src/components/shell/primitives.tsx`. Tempo v5 was retired 2026-07-28; do not build from it.
4. **"Does this match the founder's taste?"** → Marketing site expansion doc § 13 (founder taste rules observed)
5. **"Am I overthinking this?"** → Probably yes. Ship fast, get feedback, iterate. Founder will review; concerns surface then.

---

**Happy building. Ship phase 1 by EOW. Founder visual QA on Friday.**
