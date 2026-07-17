# Marketing Site Expansion: Vercel Ultra-Premium Standard Applied

> _Created: 2026-07-18 · Status: **APPLIED RECORD & IMPLEMENTATION GUIDE**. This document records autonomous design decisions for the public marketing site expansion beyond the landing page (v2, shipped 2026-07-15). Every decision below follows [`DESIGN-TEMPO.md`](../../../DESIGN-TEMPO.md) and [`2026-07-15-landing-v2-ink-and-starfield.md`](./2026-07-15-landing-v2-ink-and-starfield.md) as the law; differentiators and rationale are stated once here, then implemented consistently across all pages._
>
> **Interlinks:** [`DESIGN-TEMPO.md`](../../../DESIGN-TEMPO.md) · [`2026-07-15-landing-v2-ink-and-starfield.md`](./2026-07-15-landing-v2-ink-and-starfield.md) (the prior applied record; this builds on it) · [`../research/vercel-composition-playbook.md`](../research/vercel-composition-playbook.md) (section 6 has the pickup instructions) · [`docs/pitch/one-pager.md`](../../../docs/pitch/one-pager.md) (canonical copy) · [`docs/planning/landing-page-v2-plan.md`](../../../docs/planning/landing-page-v2-plan.md) (claims law).

---

## 1. Scope: What ships in this phase

The landing page (v2) is complete and premium. This expansion adds four surface types:

| Surface                     | Routes                             | Status          | Priority | Notes                                                                                       |
| --------------------------- | ---------------------------------- | --------------- | -------- | ------------------------------------------------------------------------------------------- |
| **Pricing page redesign**    | `/pricing`                         | Exists (old)    | 1        | Needs ink-and-starfield theme + Vercel showcase grammar; 4 tiers + feature matrix           |
| **Proof/Trust pages**        | `/proof`, `/d/$slug`, `/t/$slug`   | Exists (legacy) | 1        | Already themed; verify continuity with landing backdrop + narrative copy alignment          |
| **Feature showcase pages**   | `/product`, `/features`, `/use-cases` | New             | 2        | Vercel-style alternating sections; named capability + screenshot + mono spec list           |
| **Learn/Getting started**    | `/getting-started`, `/docs`        | New             | 3        | Public-facing onboarding; hero + step-by-step flow; low interactivity; markdown content    |
| **Company/About**            | `/about`                           | New (optional)  | 4        | Founder mission + transparency; the honest-zero approach applied to company positioning    |

---

## 2. Design system continuity: ink-and-starfield everywhere

Every public page uses **`PUBLIC_INK_THEME`** + `LandingBackdrop` (implemented in `src/components/landing/inkTheme.ts` and `LandingBackdrop.tsx`).

### Canvas (inherited from landing v2)

| Element                           | Value                              | Rule                                          |
| --------------------------------- | ---------------------------------- | --------------------------------------------- |
| Page background                  | `#0a0a0a`                         | Dark-first, never light                       |
| Cards / framed content            | `#0d0d0e`                         | Opaque, blocks grid bleed                     |
| Raised surfaces                   | `#18181b`                         | Subtle lift for interactive states            |
| Primary text                      | `#f4f4f5` (zinc-100)               | High contrast on dark                         |
| Secondary text                    | `#a1a1aa` (zinc-400)               | Body copy readability                         |
| Muted / kicker                    | `#71717a` (zinc-600)               | Metadata, timestamps, captions                |
| Backdrop (grid + starfield)       | Fixed, parallax, faint opacity     | All pages; grid 48px fine / 240px coarse      |
| Hairlines / dividers              | `rgba(255,255,255,0.07-0.10)`     | Ink-colored strokes only                      |

### Chromatic system (inherited)

| Color         | Value    | Job                                                          |
| ------------- | -------- | ------------------------------------------------------------ |
| **Ember**     | `#FF6B2C` | Human voice: CTAs (one per view), gates, focus ring, hovers  |
| **Machine**   | `#6cb0f5` | Agent voice: status badges, working states, live indicators  |
| **Memory**    | `#E8B44C` | Memory trail only (banned from text/headings per 2026-07-15) |
| **Success**   | `#4ac26b` | Pass/complete states                                         |
| **Failure**   | `#e5534b` | Error/failed states                                          |
| **Caution**   | `#d9a13c` | Building/in-progress states                                 |

---

## 3. Typography rules (Geist trio, inherited)

- **Geist Sans** — all interface copy, body text, navigation, form labels
- **Geist Mono** — metadata, timestamps, kickers, spec lists (12px uppercase, `letter-spacing: 0.12em`)
- **Geist Pixel Square** — **page hero titles ONLY** (one per page), USP moments, brand statements

**Zero deviation:** no sub-faces, no Google Fonts, no system fonts. Self-hosted only (`/public/fonts/geist/`).

---

## 4. The composition grammar: the reusable section unit

Every marketing page section follows the **Vercel-inspired alternating showcase pattern**, adapted for Cadence:

### Section structure (left/right alternate)

```
┌─────────────────────────────────────────────────────────────────┐
│  [ODD SECTIONS: Text LEFT, Visual RIGHT]                        │
│                                                                 │
│  ╔═══════════════════════════╗        ╔═══════════════════════╗│
│  ║ Capability headline       ║        ║                       ║│
│  ║ (Geist Pixel, 64px)       ║        ║ Framed visual         ║│
│  ║                           ║        ║ (screenshot / replay) ║│
│  ║ One paragraph body text   ║        ║                       ║│
│  ║ (zinc-400, max 200 chars) ║        ║ (#0d0d0e frame,       ║│
│  ║                           ║        ║  1px border, subtle   ║│
│  ║ MONO SPEC LIST:           ║        ║  edge-light on hover) ║│
│  ║ LIVE COUNTERS             ║        ║                       ║│
│  ║ HUMAN GATES               ║        ║                       ║│
│  ║ OUTCOME GRADING           ║        ║                       ║║
│  ║ PRECEDENT MEMORY          ║        ║                       ║║
│  ╚═══════════════════════════╝        ╚═══════════════════════╝│
│                                                                 │
│  [EVEN SECTIONS: Visual LEFT, Text RIGHT]                      │
│  (structure mirrors, sides swap)                               │
└─────────────────────────────────────────────────────────────────┘
```

### Component rules

1. **Headline:** Geist Pixel Square, 64px, white, one line (no wrap; use `textWrap: balance` if break is necessary, never mid-word). One sentence maximum. Capability focus: "Decide faster" not "How we help you decide."
2. **Body copy:** Geist Sans, 16px, zinc-400, max 240 chars (two lines). Plain English, no jargon without escape. Mention the agent job + the human gate that stays.
3. **Frame visual:** `#0d0d0e` base, 1px `rgba(255,255,255,0.10)` border, `border-radius: 12px`, aspect 16:10 or 4:3 depending on content. On hover: toggle opacity of `.replay-frame::after` pseudo-element (pre-rendered glow, never animate box-shadow).
4. **Mono spec list:** Geist Mono, 12px, uppercase, `letter-spacing: 0.12em`, zinc-500 base, hover to `#FF6B2C`. Four items (never fewer, never more than six). Each item is a capability the section demonstrates.
5. **Spacing rhythm:** `py-32` between sections (128px), `px-24` horizontal padding (96px), `gap-24` between text and visual (96px).

---

## 5. Pricing page redesign

Current: four-column grid with feature matrix. New: **Vercel-premium alt hero + tier cards + feature comparison**.

### Structure

1. **Header** (hero section, 64px from top)
   - Eyebrow: `PRICING` (12px mono, zinc-600, uppercase)
   - Headline: `Simple pricing. No surprises.` (Geist Pixel, 64px, one line)
   - Subheading: Geist Sans, 16px, zinc-400, max 120 chars (one line ideal, two acceptable)
   - CTA button: Ember, 14px, "Start free"

2. **Toggle section** (monthly/annual, aligned right)
   - Label: "Bill annually" (zinc-400)
   - Toggle switch (Geist Labs component style, ember on active)
   - Badge: "Save 20%" (amber/gold, small, appears on toggle when annual selected)

3. **Tier cards** (4 columns, responsive: 1 on mobile, 2 tablet, 4 desktop)
   - Each card: `#0d0d0e` base, 12px border-radius, 1px border `rgba(255,255,255,0.10)`
   - Icon (lucide, 20px, zinc-500)
   - Tier name (Sans, 16px, white)
   - Price (Geist Pixel numerals for the dollar amount; accent color if tier is "most popular")
   - "/month or /year" (zinc-600, 12px)
   - Description (zinc-400, 12px, one line)
   - CTA button per tier (gray `default` for standard; ember for "most popular")
   - Feature list (12px bullet list, green checkmark for included, gray checkmark for not)
   - Connector icons: the inline SVG chip row (GitHub, Linear, Notion, Jira, Google Docs)
   - Write-back badge: "write-back" label appears on tier row where applicable

4. **Feature matrix** (below cards)
   - Two-column layout: feature name left, tier checkmarks right (4 columns)
   - Monumental negative space above (py-48)
   - No borders inside the matrix; only hairlines (rgba) between groups
   - Header row: tier names repeated (right-aligned, zinc-600)
   - Feature rows: feature name (left, zinc-300), checkbox glyphs (centered, green/gray)
   - Feature groups separated by subtle section gaps (py-12 between groups)

5. **FAQ section** (below matrix)
   - Eyebrow: "Questions?" (zinc-600, 12px mono)
   - Headline: `Everything you need to know` (Geist Pixel, 48px)
   - 6–8 questions, accordion style (click to expand)
   - Accordion chevron (right, gray, rotates on open)
   - Answer text: Geist Sans, 14px, zinc-400, can include inline code (mono) or links (ember)

### Key decisions (autonomous)

1. **No "popular" badge text** — instead, subtly lift the "most popular" tier (add `border-color: rgba(255,107,44,0.2)` and a faint glow on hover). The founder's "restraint budget" rules.
2. **Credit tiers per card retained** — the current design shows a dropdown per tier for credit selection (e.g., "Free: 1,000 credits/month"). Keep it; it's honest product design, not bloat.
3. **Annual discount messaging** — "Save 20%" appears on the toggle itself, not in card copy. One message, once, prominent.
4. **Pricing truth law** — every number is LIVE (pulled from `CREDIT_DROPDOWN_TIERS` and `priceForCredits` at render time). No mocks, no out-of-date copy.
5. **CTA routing** — "Start free" in header → `/signup`; tier CTAs → `/signup?tier=<name>`; "Talk to sales" (enterprise only) → open Calendly or email form in a sheet.

---

## 6. Product/features showcase pages (`/product`, `/features`, `/use-cases`)

### Page 1: `/product` — the holistic overview

**Purpose:** Show the six-station loop end-to-end without deep-diving into any one step.

**Structure:**
- Hero (same as landing, or a simplified version: headline + subheading + CTA)
- Six alternating showcase sections, one per station:
  1. **Discover** — signal fabric + theme clustering (visual: screenshot of the Brain interface, dimmed 15%)
  2. **Decide** — ranked bets + Critic teardowns (visual: decision card trace)
  3. **Define** — PRD generation + acceptance oracles (visual: PRD with lineage tree)
  4. **Build** — agent-driven spec-to-PR (visual: mission trace with CI/merge gates)
  5. **Ship** — deployment + launch packs (visual: changelog + stakeholder pack)
  6. **Learn** — outcome windows + playbook generation (visual: outcome ledger card + memory write)
- Each section uses the alternating grammar (text left/right, visual center/right)
- Close section: "Ready to run your loop?" (CTA to start free)
- FAQ: common questions about the full lifecycle

### Page 2: `/features` — deep-dive on 3–4 hero capabilities

**Purpose:** Let power users and prospects see the specific differentiators (ledger, autonomy by track record, outcome reinforcement).

**Structure:**
- Hero
- Three feature showcase sections:
  1. **The outcome ledger** — receipts, auditability, the moat
  2. **Earned autonomy** — trust ramp by track record, non-overridable gates
  3. **Self-improving judgment** — outcome-ranked playbooks, workspace learning
- Each section: capability headline (Pixel) + problem statement + the mechanism (how Cadence solves it) + what users get
- Closing: "See how other teams use Cadence" (link to `/use-cases`)

### Page 3: `/use-cases` — vertical/role-based stories

**Purpose:** Help prospects see themselves in Cadence.

**Structure:**
- Hero: "Built for every step of the product loop"
- Four use-case cards (2 × 2 grid, or 1 × 4 on mobile):
  1. **The founding PM** — "One person, 20 agents, one ledger"
  2. **The product org** — "Cross-team decisions, one record"
  3. **The design + build handoff** — "Specs that stick, output that matches"
  4. **The post-launch team** — "Learn what worked, rank the next bet"
- Each card: title + 2-line description + "Read the story" link → detailed page or modal
- OR: alternate format — one use-case per showcase section (6–8 sections, alternating), each with a real-ish (anonymized) case story

### Key decisions

1. **No customer logos yet** (claims law) — use role/scenario names instead ("The founding PM", "The scaling org")
2. **Screenshots are real or honest mocks** — never fabricated UI that doesn't exist in the product
3. **Copy links everything back to the core value** (outcome ledger, autonomy, learning) — avoid generic "helps you collaborate" language
4. **CTA on every section:** "Learn more" → scroll to the next section or jump to `/pricing`

---

## 7. Trust & proof pages (continuity audit)

These exist (`/proof`, `/d/$slug`, `/t/$slug`, `/p/teardown`) and already carry the ink theme. Verify:

1. **`/proof`** — the public Trust Ledger. Needs: headline (Geist Pixel, 64px), subheading, the live ledger table/cards, footer CTA.
2. **`/d/$slug`** — a public decision record share. Needs: card layout (framed, opaque base), lineage visualization, the three-voice trace legend, CTA back to waitlist.
3. **`/t/$slug`** — a public teardown share. Needs: teardown body, risk callouts, hypothesis cards, outcome links.
4. **`/p/teardown`** — the public Critic teardown (no signup required). Needs: the full treatment (already in code; verify ink theme applied).

**Action:** Apply `PUBLIC_INK_THEME` to all four if not already applied; verify backdrop loads; test on mobile.

---

## 8. Learn/onboarding pages (future, gates on content)

Not shipped in this phase; unlocks when:
- The product docs are stable (no major restructuring)
- The founder approves a learning narrative (how to structure the "getting started" flow)
- Design partner beta cohort has provided feedback on what they needed to learn

**Placeholder structure:**
- `/getting-started` — seven-step flow (Discover → Decide → Define → Build → Ship → Learn → Iterate), one page per step, low-interactivity, embedded product screenshots
- `/docs` — static markdown documentation (Geist Mono for code blocks, Sans for prose)
- Both pages: ink-and-starfield theme, one primary CTA (to log in and try), breadcrumb navigation

---

## 9. Implementation roadmap (BUILD-ONLY MODE)

| Phase | Routes                  | Components                              | Effort | Gate/owner |
| ----- | ----------------------- | --------------------------------------- | ------ | ---------- |
| 1     | `/pricing` redesign     | PricingPage + PricingCard + FeatureRow | 6h     | None       |
| 2     | `/product` showcase     | ProductPage + SectionAlternate + Visual | 8h     | Copy gate  |
| 3     | `/features`             | FeaturesPage + FeatureHero              | 6h     | Copy gate  |
| 4     | `/use-cases`            | UseCasePage + CaseCard                  | 6h     | Copy gate  |
| 5     | Trust page continuity   | Verify inkTheme applied; fix if needed  | 2h     | QA only    |
| 6     | Responsive QA           | Mobile / tablet / desktop screenshots   | 4h     | Visual QA  |

**BUILD-ONLY MODE active:** no plan.md updates, no feature docs, no brand-feed captures during this phase. The six-component commit carries the WHY; git history is the log.

---

## 10. Copy guidelines: the landing voice applied

All pages use the copy ruleset from [`2026-07-15-landing-v2-ink-and-starfield.md`](./2026-07-15-landing-v2-ink-and-starfield.md) § 5 (vocabulary + claims rulings):

- **NEVER:** "chatbot", "copilot", "operating system" (vague), competitor names, "early access", "cohort", borrowed-brand analogies
- **SANCTIONED:** "second brain", "agents that ship real code" (with qualifier), insider vocabulary WITH plain-words escape, "A product team of agents, answerable to you"
- **NUMBERING:** live counters only (pulled from DB at render time); labeled replays; mocks labeled clearly
- **TIMESTAMPS:** believable only (not "3 minutes", which "makes no logical sense")
- **SOCIAL PROOF:** live counters only if >= 2,000 users; before then, omit the number, never fake it

Every page headline is a USP headline, not a category headline. "Decide faster" not "How we help you decide."

---

## 11. Responsive design rules (inherited from landing v2)

- **Mobile first:** 320px breakpoint tested
- **Tablet:** 768px, stack 4-column grids to 2 × 2
- **Desktop:** 1280px, full 4-column
- **Max-width:** 1280px content, centered with `px-24` gutters
- **Touch targets:** buttons 44px min height, tappable links 40px min height
- **Grid:** 48px fine / 240px coarse on desktop; fade grid opacity at mobile breakpoints (50% of desktop)

---

## 12. Accessibility (non-negotiable, inherited from contract)

- **Color contrast:** WCAG AAA (7:1) on all text
- **Focus rings:** visible, double-ring (ink gap + ember outer)
- **Keyboard nav:** all interactive elements reachable via Tab; form fields have associated labels
- **Motion:** `prefers-reduced-motion` resolves animations to their end state (no flashing, no seizure risk)
- **Alt text:** every image, screenshot, and visual carries semantic alt text (describe the action or outcome, not just "screenshot")
- **Semantic HTML:** headings in order, buttons are `<button>`, links are `<a>`, lists are `<ul>`/`<ol>`
- **ARIA:** use only where native HTML doesn't suffice (modals, comboboxes); never aria-label on visible text

---

## 13. Founder taste rules (observed, 2026-07-15)

_These are meta-patterns observed during the landing v2 session that carry forward:_

1. **One sentence per line in display lockups; wrapped headlines read broken to him.** Use `textWrap: balance` or explicit `<br/>` and test at every breakpoint.
2. **Congestion is a defect.** Ask for air above/below dense elements; sections breathe with `py-32`/`py-40` rhythm.
3. **Text never sits on visible texture.** The grid/orbit crossing behind type is "not readable." Use `.cap-scrim` or opaque card bases (`#0d0d0e`).
4. **Subtext stays short (two lines max)** and never carries specifics the visual should own (timestamps in the trace, not the caption).
5. **Alternation and out-of-the-box placement matter.** Text left/right alternates readably; novel motion scopes to the smallest unit (one-word typing, not whole sentences).
6. **Everything hoverable should react; dead hovers are missed details.** Ember is the default hover for keywords and lists.
7. **Animation must be scoped and legible.** Movement is felt, not watched; glows are white (never colored); mark revolves very slowly (150–180s).
8. **Copy clarity:** vague category words are banned ("operating system," bare "AI"); qualify with concrete objects ("agents that ship real code"); problem statements must land the USP in the same breath.
9. **Scarcity/FOMO copy sharpened until "users feel they're missing out,"** within truth. Numbers are from live data only.

---

## 14. File structure & implementation checklist

New/modified files:

```
src/components/landing/
  ├── [EXISTING] Hero.tsx
  ├── [EXISTING] LandingBackdrop.tsx
  ├── [EXISTING] inkTheme.ts
  ├── [NEW] SectionAlternate.tsx ← reusable section unit (text + visual, alternating sides)
  ├── [NEW] CapabilityList.tsx ← mono spec list (emoji/icon, text, hover to ember)
  ├── [NEW] FramedVisual.tsx ← screenshot/replay wrapper (#0d0d0e, border, edge light)

src/components/pricing/
  ├── [NEW] PricingPage.tsx (rename from /pricing route or refactor)
  ├── [NEW] PricingCard.tsx
  ├── [NEW] FeatureMatrix.tsx
  ├── [NEW] PricingFAQ.tsx

src/components/product/
  ├── [NEW] ProductPage.tsx
  ├── [NEW] FeaturesPage.tsx
  ├── [NEW] UseCasesPage.tsx
  ├── [NEW] CaseCard.tsx

src/routes/
  ├── [MODIFY] /pricing.tsx (extend with redesigned structure)
  ├── [NEW] /product.tsx (new route)
  ├── [NEW] /features.tsx (new route)
  ├── [NEW] /use-cases.tsx (new route)
  ├── [VERIFY] /proof.tsx, /d.$slug.tsx, /t.$slug.tsx (apply ink theme)

design-reference/tempo-v5/applied/
  └── [THIS FILE] 2026-07-18-marketing-site-expansion.md
```

---

## 15. Success criteria (verification before done)

- [ ] All public pages load with `PUBLIC_INK_THEME` + `LandingBackdrop` (grid + starfield visible)
- [ ] Pricing page: 4 tiers render, feature matrix loads, toggle updates prices live
- [ ] Product/Features/UseCases pages: sections alternate text/visual correctly, Geist Pixel headlines render
- [ ] Mobile responsiveness: tested on 320px, 768px, 1280px; text readable, no horizontal scroll
- [ ] Accessibility: WCAG AAA on all text, focus rings visible, keyboard nav works, alt text present
- [ ] Copy audit: zero "chatbot"/"copilot"/"operating system", all numbers live (not mocked)
- [ ] Performance: pages load in <2s on Lighthouse, Core Web Vitals green
- [ ] Founder visual QA: one pass-through per page; any notes acted on and re-QA'd

---

## 16. The one law

**Inspiration, never mimicry.** Cadence's differentiators stay visible:

- **Geist Pixel Square** (Vercel uses Sans for headlines; we use Pixel for ours)
- **Seven-petal epitrochoid mark** (different logo, ours is branded)
- **Three-voice chromatic grammar** (agent blue / human ember / memory gold — they don't have this)
- **Starfield + engineering grid** (their canvas is plain; ours breathes)
- **The three-station loop** (our moat, our story, not theirs)

Every adoption of Vercel's patterns flows through these. When in doubt, choose the Cadence-distinctive option.

---

## 17. Next session handoff (if continuing)

If this phase is done and the founder wants phase 2:

1. **In-product landing patterns** — port the starfield + three-voice trace grammar into the app (Today hero, empty states, mission traces)
2. **Customer showcase sections** (6.1 in the Vercel playbook) — unlocks when 5+ beta customers grant logo/screenshot permission
3. **The brand shader / generative hero asset** (6.5) — build once, reuse across site hero, OG image, launch video, tickets
4. **The journey film** — cinematic trace playback (~90 seconds) for social/email
5. **Public landing skill** (`cadence-design` → `cadence-landing-skills`) — agent-friendly instructions for future updates

---

## 18. Files referenced (for future readers)

- `DESIGN-TEMPO.md` — the base contract
- `2026-07-15-landing-v2-ink-and-starfield.md` — the prior applied record
- `vercel-composition-playbook.md` — the reference study
- `docs/pitch/one-pager.md` — canonical outward copy
- `docs/planning/landing-page-v2-plan.md` — claims law + strategy
- `src/lib/landing.functions.ts` — live counter logic
- `src/components/landing/inkTheme.ts` — `PUBLIC_INK_THEME` definition
