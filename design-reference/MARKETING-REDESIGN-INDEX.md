# Public Marketing Site Redesign — Index & Navigation

**Delivery date:** 2026-07-18  
**Status:** Design & specification complete; implementation ready  
**Start here:** Read this file top-to-bottom, then jump to the relevant doc for your role.

---

## Quick Links by Role

### Builder / Developer (starting implementation now)
1. **Start:** [`docs/Growth Strategy/marketing-site-build-checklist.md`](../../MARKETING-SITE-BUILD-CHECKLIST.md) (read top to bottom; commit-by-commit guide)
2. **Reference:** [`2026-07-18-pricing-redesign-spec.md`](./tempo-v5/applied/2026-07-18-pricing-redesign-spec.md) (keep open; prescriptive detail)
3. **Template:** [`src/routes/product.tsx`](../../src/routes/product.tsx) (live example; adapt for /features and /use-cases)
4. **Law:** [`docs/design/archive/tempo-v5.md`](../../DESIGN-TEMPO.md) (read first for 30 min; the base contract)

**Next steps:**
- Commit 1: SectionAlternate + FramedVisual components (8–10 hours)
- Commit 2–7: Pricing page redesign (12–15 hours)
- Commit 8–10: Showcase pages /product, /features, /use-cases (12–14 hours)
- Commit 11: Proof pages continuity check (2–3 hours)
- Commit 12: Responsive QA + founder visual pass (6–8 hours)

**Estimated total:** 40–50 hours, 12 commits, 1 founder QA pass.

---

### Founder / Reviewer (design approval & visual QA)
1. **Skim:** [`MARKETING-SITE-REDESIGN-SUMMARY.md`](../../design-reference/MARKETING-SITE-REDESIGN-SUMMARY.md) (5 min; what's shipping)
2. **Wait for:** Responsive screenshots at end of phase 1 (3 breakpoints: 320px, 768px, 1280px)
3. **Provide feedback:** One pass; builder fixes, re-shares, ships with your sign-off
4. **Reference:** [`2026-07-18-marketing-site-expansion.md`](./tempo-v5/applied/2026-07-18-marketing-site-expansion.md) § 13 (founder taste rules; if anything looks off, check here)

**Timeline:** Phase 1 ships in 2–3 days of build time (EOW target). You'll see screens mid-week for QA.

---

### Designer / Future Agent (understanding decisions + maintaining consistency)
1. **Read in order:**
   - [`docs/design/archive/tempo-v5.md`](../../DESIGN-TEMPO.md) (30 min) — the law
   - [`2026-07-15-landing-v2-ink-and-starfield.md`](./tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md) (45 min) — the precedent
   - [`2026-07-18-marketing-site-expansion.md`](./tempo-v5/applied/2026-07-18-marketing-site-expansion.md) (45 min) — strategy + patterns
   - [`2026-07-18-pricing-redesign-spec.md`](./tempo-v5/applied/2026-07-18-pricing-redesign-spec.md) (skim for reference)
2. **Understand:** Every design decision is documented with reasoning (section-by-section in the docs)
3. **Never:** Override Tempo law; all extensions are explicitly called out
4. **Future work:** Section 6 of expansion doc has gated patterns (customer showcases, brand shader, journey film) with unlock conditions

---

## Document Inventory

### High-Level (Start Here)

| Document | Path | Audience | Read Time | Purpose |
| --- | --- | --- | --- | --- |
| **This file** | `design-reference/MARKETING-REDESIGN-INDEX.md` | Everyone | 5 min | Navigation & role-based starting points |
| **Delivery Summary** | `docs/planning/archive/rebuild-2026-07-18/delivery-summary.md` | Everyone | 10 min | What was delivered, autonomy decisions, success criteria |
| **Marketing Redesign Summary** | `design-reference/MARKETING-SITE-REDESIGN-SUMMARY.md` | Founder, Designer, Builder | 15 min | Executive overview: surfaces, components, phase roadmap |

### Strategy & Specification

| Document | Path | Audience | Read Time | Purpose |
| --- | --- | --- | --- | --- |
| **Marketing Site Expansion** | `design-reference/tempo-v5/applied/2026-07-18-marketing-site-expansion.md` | Designer, Builder | 45 min | Full strategy: scope, design system, patterns, responsive, accessibility, implementation roadmap, founder taste rules |
| **Pricing Redesign Spec** | `design-reference/tempo-v5/applied/2026-07-18-pricing-redesign-spec.md` | Builder | 60 min (keep open) | Prescriptive detail: every element defined (color, size, spacing, behavior, hover state, responsive breakpoints) |

### Implementation & Building

| Document | Path | Audience | Read Time | Purpose |
| --- | --- | --- | --- | --- |
| **Builder Checklist** | `docs/Growth Strategy/marketing-site-build-checklist.md` | Builder | 30 min upfront, ongoing | Commit-by-commit guide: 12 commits, phase breakdown, verification checklist, escalation paths |

### Reference (Keep Handy)

| Document | Path | Audience | Reference Time | Purpose |
| --- | --- | --- | --- | --- |
| **DESIGN-TEMPO.md** | `docs/design/archive/tempo-v5.md` | Builder, Designer | 30 min initial | The law: colors, typography, materials, spacing, motion, theme, focus states |
| **Landing v2 Applied** | `design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md` | Builder, Designer | 45 min initial | The precedent: what landed v2 shipped, composition grammar, founder decisions |
| **Vercel Playbook** | `design-reference/tempo-v5/research/vercel-composition-playbook.md` | Designer | 30 min initial | Composition patterns, craft rules, waiting list (gated features with unlock conditions) |

### Components (Code)

| Component | Path | Status | Used By |
| --- | --- | --- | --- |
| **SectionAlternate** | `src/components/landing/SectionAlternate.tsx` | DONE | `/product`, `/features`, `/use-cases` showcase sections |
| **FramedVisual** | `src/components/landing/FramedVisual.tsx` | DONE | Frame wrappers for all screenshots |
| **/product page** | `src/routes/product.tsx` | DONE (template) | Reference for similar pages; adapt for /features and /use-cases |

---

## Read Order (Depends on Your Role)

### If you're building right now:
```
DESIGN-TEMPO.md (30 min)
  ↓
2026-07-15-landing-applied.md (45 min)
  ↓
2026-07-18-expansion.md (45 min)
  ↓
MARKETING-SITE-BUILD-CHECKLIST.md (start coding!)
  ↓
2026-07-18-pricing-spec.md (keep open as reference)
```

### If you're reviewing visually:
```
MARKETING-SITE-REDESIGN-SUMMARY.md (5 min)
  ↓
Wait for builder to share screenshots (mid-week)
  ↓
One QA pass; feedback → fix → re-share → sign-off
```

### If you're maintaining/extending later:
```
DESIGN-TEMPO.md (30 min)
  ↓
2026-07-15-landing-applied.md (45 min)
  ↓
2026-07-18-expansion.md (45 min)
  ↓
Reference the applicable section when making decisions
```

---

## Key Concepts (TL;DR)

### The Design System
**Ink-and-starfield theme** (inherited from landing v2, applies everywhere):
- Canvas: `#0a0a0a` (dark-first)
- Cards: `#0d0d0e` (opaque)
- Chromatic: ember (human action), blue (agent state), gold (memory)
- Typography: Geist Sans (UI) + Mono (metadata) + Pixel (heroes only)

### The Composition Pattern
**SectionAlternate** (reusable unit for all showcase sections):
- Headline: Geist Pixel, 64px, one line
- Body: Geist Sans, 16px, zinc-400, max 240 chars
- Visual: FramedVisual (#0d0d0e frame, edge-light glow on hover)
- Capabilities: 4 mono items, uppercase, hover to ember
- Sides alternate: odd index = text left, even index = text right

### The Responsive Approach
- **Desktop (1280px+):** 4-column grids, full spacing rhythm
- **Tablet (768px–1279px):** 2-column grids, 50% spacing
- **Mobile (<768px):** 1-column stack, no horizontal scroll, 50% spacing

### The Founder Taste Rules (11 Meta-Patterns)
1. One sentence per line; no wrapped headlines
2. Congestion is a defect; sections breathe
3. Text never sits on visible texture (use `.cap-scrim` or opaque cards)
4. Subtext stays short (two lines max)
5. Alternation and out-of-the-box placement matter
6. Everything hoverable should react
7. Animation must be scoped and legible
8. Copy clarity > category words
9. Numbers are live only (no mocks)
10. Scarcity/FOMO copy sharpened (within truth)
11. Social proof gated (count floor 2,000)

(Full detail: expansion doc § 13)

---

## Blocked / Deferred Features (Phase 2)

These are NOT omitted; they're blocked on specific unlock conditions:

| Feature | Gate | Unlock Condition | Ref |
| --- | --- | --- | --- |
| Customer showcase sections | Claims law | 5+ beta customers grant logo/screenshot permission | Playbook § 6.1 |
| Brand shader (generative) | Strategic | Rename decision; brand identity settled | Playbook § 6.5 |
| Journey film (cinematic) | Founder bandwidth | Dedicated video session | Playbook § 6.7 |
| Learn/onboarding pages | Product stability | Docs stable; founder approves narrative | Expansion doc § 6 |

**Pickup instructions documented in Vercel playbook section 6 and expansion doc section 14.**

---

## Success Criteria (Phase 1 Done When)

- ✓ All pages load with ink-and-starfield theme
- ✓ `/product`, `/features`, `/use-cases` render correctly
- ✓ `/pricing` renders hero + toggle + 4 tiers + matrix + FAQ
- ✓ Monthly/annual toggle updates prices live
- ✓ Responsive: 320px, 768px, 1280px tested; no horizontal scroll
- ✓ Accessibility: WCAG AAA contrast, focus rings, keyboard nav, screen reader
- ✓ Copy: zero banned words, all numbers live
- ✓ Performance: Lighthouse 90+, Core Web Vitals green
- ✓ Founder visual QA: one pass, all feedback resolved, sign-off

**Estimated completion:** 2–3 days of build time (EOW target).

---

## Questions? Escalation Path

1. **"Where is X defined?"** → Use Ctrl+F in the spec docs (they're comprehensive)
2. **"What color/spacing/font?"** → DESIGN-TEMPO.md has the law
3. **"Am I overthinking this?"** → Probably; ship fast, iterate on feedback
4. **"Does this match founder taste?"** → Check expansion doc § 13 (11 taste rules)
5. **"Is this blocked or deferred?"** → See "Blocked / Deferred Features" table above
6. **"What's the next step?"** → Check MARKETING-SITE-BUILD-CHECKLIST.md for your phase

---

## Quick Facts

- **Delivery:** 7 files (3 docs, 2 components, 2 guides)
- **Effort:** ~40–50 hours of build time (12 commits)
- **Build mode:** Build-only active (no plan updates, just ship)
- **Founder QA:** One pass at end of phase 1
- **Vercel baseline:** Adopted pattern (alternating showcases) + adapted for Supaprod identity (Pixel, three-voice, starfield)
- **Claims law:** Zero customer logos (blocked); zero mocked numbers (all live)
- **Autonomy rule:** Every decision traces back to existing law (Tempo, landing v2, founder taste)

---

**Created:** 2026-07-18  
**Last updated:** 2026-07-18  
**Ownership:** Founder sign-off required before builder starts phase 1  
**Next review:** Post-implementation visual QA (mid-week target)

---

**Start building. Ask if blocked. Ship phase 1 by Friday.**
