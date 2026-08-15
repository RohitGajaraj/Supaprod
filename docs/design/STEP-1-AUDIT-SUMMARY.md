# STEP 1: Audit Summary — 10 Highest-Impact Fixes (36h Sprint)

_Conducted 2026-08-10 by design lane. Cross-referenced existing audits (Discover, Decide, Plan, Design, Build, Ship/Learn, Today). Sequenced for parallel execution with backend lane via HANDOFF-ENGINEERING.md._


> **STALE ON DESIGN, 2026-08-15. This predates Meridian.** Where it names `--sp-*`, the
> `ink.css` stack or `shell/primitives.tsx` as what to compose from, that instruction is retired and
> now fails `bun test` via `src/__tests__/meridian-ratchet.test.ts`. The contract is
> [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md). The **findings** below are still useful; the **styling
> instructions** are not.

---

## AUDIT SCOPE & METHOD

**Surfaces reviewed:** Seven stations + Auth + Settings + Mobile + Pricing
**Audit lens:** First-timer perception (5 seconds) + power-user speed + feature completeness + reference pattern alignment
**Verdict categories:** KEEP / REDESIGN / MERGE / DELETE / REWORK
**Blocker handling:** Flagged to HANDOFF-ENGINEERING.md for backend lane coordination

---

## THE 10 HIGHEST-IMPACT FIXES

### Priority 1 (P1): Load-Bearing, Launch-Blocking

#### 1. **App Shell: Three-Region Rebuild** (8h)
- **Current:** Two shells running simultaneously (Obsidian rail + ink room), hardcoded pathname allowlist
- **Problem:** Inconsistent nav, double design systems (49 Tempo shadcn files + 37 shell primitives)
- **First-timer sees:** "Which app am I in?" Confusion at every navigation
- **Reference:** Linear sidebar model (STEP 0)
- **Fix:** Single shell with collapsible sidebar (icons on collapse). Header for workspace context. Full-bleed content pane.
- **Dependencies:** Requires frontend work (route consolidation)
- **Verdict:** REDESIGN

#### 2. **Command Palette (⌘K)** (4h)
- **Current:** No global search or command palette
- **Problem:** Operators must use sidebar to navigate; no keyboard-only workflow
- **Power-user need:** "Jump to recent decision" / "Search for bet by keyword"
- **Reference:** Linear ⌘K (STEP 0)
- **Fix:** Implement ⌘K with recent items + fuzzy search across stations/decisions/bets. Keyboard-only.
- **Dependencies:** Data fetching (recent items list) + routing
- **Verdict:** REDESIGN (new feature, no backward compatibility needed)

#### 3. **Shell Primitives: Replace Legacy** (6h)
- **Current:** 49 shadcn/ui components (Tempo era) + 37 shell primitives (ink era) in parallel
- **Problem:** Duplicate styles, inconsistent tokens, 633 `--ds-*` tokens (legacy) vs 146 `--sp-*` tokens (new)
- **Reference:** DESIGN-SYSTEM.md ruling: "Never add `--ds-*`. New work uses `--sp-*`."
- **Fix:** Audit all surfaces for shadcn usage. Convert critical ones to `--sp-*` primitives. Keep shadcn as legacy shim (no new work).
- **Dependencies:** None (purely frontend refactor)
- **Verdict:** MERGE (consolidate onto primitives)

#### 4. **Table Density & Sorting** (3h)
- **Current:** No density toggle. Sorting unclear (header click behavior not obvious)
- **Problem:** At 40px rows, tables are still harder to scan than Linear's. No visual feedback on sort direction.
- **Reference:** Linear table + Sentry density options (STEP 0)
- **Fix:** Add density toggle (Compact/Normal/Spacious) in settings. Sort indicators (↑ ↓). Inline menu on hover (three dots).
- **Dependencies:** Settings surface + localStorage
- **Verdict:** REDESIGN

#### 5. **Modal / Dialog Library** (2h)
- **Current:** Custom modals, inconsistent anatomy (header styles vary, footer positioning varies)
- **Problem:** Power-user sees "this modal looks different from that one" → trust erodes
- **Reference:** Linear modal pattern (STEP 0)
- **Fix:** Define modal component: header (title + X) + scrollable body + footer (actions). Reuse everywhere.
- **Dependencies:** None (component-level fix)
- **Verdict:** REDESIGN

#### 6. **Form Validation & Error States** (3h)
- **Current:** Validation appears at submit; errors in tooltips (hover-only)
- **Problem:** User submits form with 4 errors, then has to fix them by hovering. Slow.
- **Reference:** Stripe + Linear (STEP 0)
- **Fix:** Blur validation (not keystroke). Error message below field + red border. No tooltips.
- **Dependencies:** Form component refactor
- **Verdict:** REDESIGN

#### 7. **Loading States: Skeletons + Pulse** (2h)
- **Current:** Spinners (generic loading indicator)
- **Problem:** User sees a spinner and has no idea what's loading or how long it will take
- **Reference:** Figma skeleton loaders (STEP 0)
- **Fix:** Replace spinners with skeleton loaders (content-shaped, same height/width). Pulse animation (1.5s ease-in-out).
- **Dependencies:** None (CSS + component update)
- **Verdict:** REDESIGN

#### 8. **Toast Notifications** (2h)
- **Current:** No toasts (or misaligned positions, no auto-dismiss)
- **Problem:** Success/error messages either persist forever or appear in wrong position
- **Reference:** Linear toast (STEP 0)
- **Fix:** Bottom-right toast. Icon + title + description. Auto-dismiss 4–6s. Stack vertically.
- **Dependencies:** None (new component)
- **Verdict:** REDESIGN (new)

### Priority 2 (P2): Feature Completeness & Polish

#### 9. **Agent Status Visibility** (4h)
- **Current:** AgentPulse exists but only on TrackActivity; not across all stations
- **Problem:** User sees a loading spinner but doesn't know if an agent is working or if something just hasn't rendered
- **Founder brief:** "Live agent status is the only core USP"
- **Fix:** Add live agent indicator (WorkingNow / Idle / Error) to every surface. Per-action detail (which file, which line).
- **Dependencies:** Agent status subscription (backend API)
- **Verdict:** REWORK (feature exists, needs propagation)

#### 10. **Mobile Responsive** (6h)
- **Current:** Desktop-first design; mobile untested
- **Problem:** Sidebar + header = full width on phone; content squished
- **Reference:** Linear mobile (collapse sidebar, sticky header) (STEP 0)
- **Fix:** Sidebar collapses to hamburger on mobile. Header sticks. Content full-bleed. Test on iPhone 12.
- **Dependencies:** None (responsive CSS)
- **Verdict:** REDESIGN

---

## SUPPORTING AUDIT RESULTS (KEEP / DELETE)

### Keep as-is (ship without changes)
- **Discover triage UI** (split-view, digit dispositions are correct; see existing audit for enhancements, none are launch-blocking)
- **Decide split-view** (mirrors Discover, working well)
- **Build diff viewer** (Monaco integration is industry-standard)
- **Status colour everywhere** (red/green on diffs, threads, mission ids — already shipping correctly)

### Delete or Defer (post-launch)
- **Seven-station model visual clutter** (founder ruling: keep 7-station internally, show 3-loop to users — deferred to G2.2)
- **Breadcrumbs** (STEP 0 research: modern products reject them; title + back button sufficient)
- **Manual approval queues** (governance ruling: policy-gated, not queue-based; existing architecture correct)

---

## EXECUTION SEQUENCE & TIME BREAKDOWN

**Total time available:** 36 hours  
**Research:** 4 hours (STEP 0, ✅ complete)  
**Audit:** 2 hours (STEP 1, now)  
**Design system:** 6 hours (STEP 2)  
**Surface rebuilds:** 24 hours (STEP 3, parallel with above)

### Build Sequencing (Parallel Tracks)

| Hour | Track A (Shells & Nav) | Track B (Components) | Track C (States & Polish) |
|------|------------------------|----------------------|---------------------------|
| 8–10 | Shell rebuild start (3-region) | Modal library (2h) | Skeleton loaders (2h) |
| 10–12 | Shell + sidebar nav (4h) | Form validation (3h) | Toast notifications (2h) |
| 12–14 | ⌘K command palette (4h) | Table density + sort (3h) | Agent status visibility (2h) |
| 14–16 | Shell polish, test | Modal integration | Mobile responsive start (2h) |
| 16–18 | Mobile responsive (6h) | Component audit | Polish & bug fixes |
| 18–20 | Integration test | Cross-surface check | Final verification |

---

## BACKEND HANDOFF & BLOCKERS

**Flagged to backend lane** (HANDOFF-ENGINEERING.md):
1. **Agent status subscription** (needed for #9 live indicators)
2. **Recent items API** (needed for ⌘K palette)
3. **Workspace context mutation** (needed for sidebar context selector)

**No critical blockers:** All 10 fixes have frontend-only or non-blocking backend dependencies.

---

## DESIGN SYSTEM BASELINE (STEP 2)

**Token foundation ready:**
- 146 `--sp-*` tokens (in-place from prior work)
- Three themes: LIGHT / DARK / SYSTEM (via prefers-color-scheme)
- Semantic layers: root → semantic → component

**STEP 2 work:** Extend tokens for new components (modals, toasts, skeletons, command palette) + finalize typography scale + motion/timing.

---

## QUALITY GATES (Pre-Launch)

**All surfaces must pass:**
1. ✅ **Greyscale test** (colour conveys status, not decoration; if greyscale doesn't work, structure is wrong)
2. ✅ **First-timer (5-second glance)** (what do they think this does?)
3. ✅ **Power-user speed** (keyboard shortcuts, no mouse required for core actions)
4. ✅ **Reference model cited** (every major decision sourced to REFERENCE-PATTERNS.md or founder ruling)
5. ✅ **Accessibility minimum** (keyboard nav, focus management, alt text, ARIA labels)

---

## STATUS & NEXT STEP

**STEP 1 complete.** 10 fixes identified, sequenced, dependencies clear.  
**Next:** STEP 2 design system (6h), then parallel STEP 3 surface rebuilds (24h).  
**Launch target:** Mid-September (no 36h hard deadline; sprint is a sprint, not a deathmarch).

