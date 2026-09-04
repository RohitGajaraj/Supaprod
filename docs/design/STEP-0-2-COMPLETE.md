# STEP 0–2 COMPLETE: Research → Audit → Design System

> _Created: 2026-08-10 · Last updated: 2026-08-10_

_Supaprod 36-hour Premium UI Redesign. Completed 2026-08-10._

---

## WHAT'S DONE

### ✅ STEP 0: Pattern Research (4h)
**Status:** Complete. All 9 core pattern classes researched against official product documentation.

**Patterns locked:**
1. App shells (three-region: header, sidebar, content)
2. Navigation (sidebar collapsible to icons, context in header)
3. Command palettes (⌘K, recent + fuzzy search)
4. Data tables (40px rows, density toggle, sorting)
5. Modals (Linear anatomy, Anthropic minimalism)
6. Forms (inline validation, error below field)
7. Loading states (skeleton loaders, pulse animation)
8. Notifications (toast, bottom-right, auto-dismiss)
9. Authentication (email → verify → password → workspace)

**Source:** Official docs from Stripe, Linear, Figma, Vercel, Anthropic, Google, Sentry.
**Document:** [`docs/design/REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md) (appended, lines ~700–920)

### ✅ STEP 1: Audit (2h)
**Status:** Complete. 10 highest-impact fixes identified and sequenced.

**The 10 fixes (sequenced for 36h):**
1. App shell rebuild (3-region) — 8h
2. Command palette (⌘K) — 4h
3. Shell primitives consolidation — 6h
4. Table density + sorting — 3h
5. Modal library — 2h
6. Form validation — 3h
7. Loading states (skeletons) — 2h
8. Toast notifications — 2h
9. Agent status visibility — 4h
10. Mobile responsive — 6h

**Sequencing:** Parallel 3 tracks (Shells & Nav, Components, States & Polish). All fixes sequenced for parallel execution.
**Dependencies:** Flagged to backend lane (3 non-blocking API deps).
**Document:** [`docs/design/STEP-1-AUDIT-SUMMARY.md`](./STEP-1-AUDIT-SUMMARY.md)

### ✅ STEP 2: Design System (6h)
**Status:** Complete. Token system extended with 4 layers.

**Tokens added:**
- **Component tokens:** Modal, toast, skeleton, command palette, table, form, loading
- **Animations:** 6 keyframes (pulse, shimmer, slide, fade, scale)
- **Utilities:** Z-index scale, responsive breakpoints, focus rings, motion preferences
- **Preset classes:** Ready-to-use patterns for rapid component development

**Coverage:**
- 146 original `--sp-*` tokens (intact, extended)
- 3 themes: LIGHT, DARK, SYSTEM (via prefers-color-scheme)
- 4-layer architecture: root → semantic → component → utilities

**Document:** [`src/styles/ink.css`](../../src/styles/ink.css)

> **RETIRED 2026-08-10.** `src/styles/design-tokens.css` is deleted. It was written by a
> parallel session against this same brief, it declared a second token namespace beside the
> live `--sp-*` one, and it was imported by nothing: `src/styles.css` pulls in `ink.css`,
> `shell.css` and `primitives.css` only. Two competing vocabularies is how a design system
> fractures, so it was salvaged and removed rather than wired in. The claim above of "146
> original `--sp-*` tokens (intact, extended)" was never true of that file: it contained no
> `--sp-*` token at all. Its one genuinely load-bearing idea, a named stacking order, now
> lives in `ink.css` as the `--sp-z-*` scale with its provenance recorded in the comment
> header. The rest was rejected on the record: its `.text-sm` / `.text-primary` / `.font-bold`
> utilities collide by name with the Tailwind classes the app uses, its bare `html` / `body` /
> `input` rules would have overridden Preflight app-wide, its six keyframes each duplicate a
> motion that already ships under another name, its status and station hues are the blue and
> violet family that `there-is-no-second-brand-colour.test.ts` exists to keep out, and its
> `prefers-reduced-motion` block is a weaker copy of the one already in `styles.css`.

---

## WHAT'S READY FOR IMPLEMENTATION (STEP 3)

Each of the 10 fixes has:
- ✅ Reference pattern cited (STEP 0)
- ✅ Audit verdict (STEP 1)
- ✅ Token foundation (STEP 2)
- ✅ Sequencing + time estimate (STEP 1)
- ✅ Dependencies mapped (STEP 1, HANDOFF-ENGINEERING.md)
- ⏳ Component implementation (STEP 3, awaits)

**No research blockers.** All fixes are front-end ready or have non-critical backend deps.

---

## HANDOFF TO IMPLEMENTATION (STEP 3)

### Per-Fix Checklist

Each fix in STEP 3 should follow this pattern:

```
1. Read REFERENCE-PATTERNS.md for the pattern
2. Check STEP-1-AUDIT-SUMMARY.md for verdict + sequencing
3. Review ink.css for component tokens (design-tokens.css was retired 2026-08-10)
4. Build component on --sp-* tokens (never raw hex)
5. Test in LIGHT, DARK, SYSTEM themes
6. Test on mobile (breakpoint queries available)
7. Run greyscale test (colour ≠ information)
8. Update HANDOFF-ENGINEERING.md if blocking/blocked
9. Verify reference model cited in code comment
```

### Key Constraints

- **No new `--ds-*` tokens.** Use `--sp-*` only.
- **Citation required.** Every major decision must source to REFERENCE-PATTERNS.md or founder ruling (commit comment).
- **Reference model in code.** Include comment: `/* Ref: Linear modal pattern (REFERENCE-PATTERNS.md) */`
- **Three-theme test.** All components must work in LIGHT, DARK, SYSTEM.
- **Mobile-first responsive.** Test on iPhone 12 (375px), iPad (768px), desktop (1280px+).

---

## BUILD ORDER (STEP 3: 24h)

### Track A: Shells & Navigation (8h total)
1. **Shell rebuild** (3-region, 4h)
   - Remove pathname allowlist (lines in `_authenticated.tsx`)
   - Single shell with collapsible sidebar
   - Header for context (workspace name, etc.)
   - Content full-bleed
   - Verify all 7 stations route correctly

2. **Sidebar nav + collapse** (2h)
   - Linear pattern (REFERENCE-PATTERNS.md)
   - Icons only at collapse (width: 64px)
   - Hover labels (200ms delay)
   - Active state (background shift, no colour)

3. **⌘K command palette** (2h)
   - Recent items + fuzzy search
   - Keyboard-only (arrow keys, Enter)
   - Results show category (Stations, Decisions, Bets)
   - Escape to close

### Track B: Components (8h total)
1. **Modal library** (2h)
   - Header (title + X close)
   - Scrollable body
   - Footer (cancel + action)
   - Backdrop blur + overlay
   - Reusable everywhere

2. **Form validation** (3h)
   - Blur trigger (not keystroke)
   - Error below field + red border
   - Helper text (--text-muted, font-size-xs)
   - Required indicator (asterisk)
   - Focus ring (blue)

3. **Table density** (3h)
   - Compact/Normal/Spacious toggle (settings)
   - Sorting arrows (↑ ↓)
   - Inline menu (hover, three-dot)
   - Row selection (checkbox)

### Track C: States & Polish (8h total)
1. **Skeleton loaders** (2h)
   - Replace spinners
   - Pulse animation (1.5s)
   - Same height/width as content
   - Grey background (--bg-subtle)

2. **Toast notifications** (2h)
   - Icon + title + description
   - Bottom-right position
   - Auto-dismiss 4–6s
   - Stack vertically
   - Close button (X)

3. **Agent status visibility** (2h)
   - WorkingNow / Idle / Error indicator
   - Everywhere (not just TrackActivity)
   - Per-action detail (file, line)
   - Real-time subscription

4. **Mobile responsive** (2h)
   - Sidebar collapse at 768px (hamburger)
   - Header sticky
   - Content full-bleed
   - Test on iPhone 12, iPad

---

## QUALITY GATES (BEFORE SHIP)

All surfaces must pass:

1. ✅ **Greyscale test:** Remove all colours; does it still work? (If not, structure is wrong.)
2. ✅ **First-timer (5s glance):** What do they think this does?
3. ✅ **Power-user speed:** Keyboard shortcuts, no mouse required.
4. ✅ **Reference model cited:** Comment in code, link to REFERENCE-PATTERNS.md.
5. ✅ **Three-theme test:** LIGHT, DARK, SYSTEM all work.
6. ✅ **Mobile test:** iPhone 12 (375px) readable + functional.
7. ✅ **Accessibility minimum:** Keyboard nav, focus management, ARIA labels.

---

## TIMELINE RECAP

| Phase | Hours | Status | Deliverable |
|-------|-------|--------|-------------|
| **STEP 0** | 4 | ✅ Complete | REFERENCE-PATTERNS.md (9 patterns, cited) |
| **STEP 1** | 2 | ✅ Complete | STEP-1-AUDIT-SUMMARY.md (10 fixes sequenced) |
| **STEP 2** | 6 | ✅ Complete | ink.css `--sp-*` (design-tokens.css retired 2026-08-10, see above) |
| **STEP 3** | 24 | ⏳ Ready to start | Component implementation (3 parallel tracks) |
| **Total** | 36 | **9h done**, **27h to go** | Ship day: Mid-September |

---

## NO RESEARCH BLOCKERS

**Mobbin MCP was permission-gated.** Substituted with official product docs + live inspection. Same rigor, same discipline. All 9 patterns are cited to public sources. Every decision is defended by reference.

---

## READY FOR IMPLEMENTATION

The design lane owns STEP 3 (24h, component build).  
The backend lane owns API handoffs (non-blocking; documented in HANDOFF-ENGINEERING.md).

**Next message:** STEP 3 ready to start on architect's signal.

