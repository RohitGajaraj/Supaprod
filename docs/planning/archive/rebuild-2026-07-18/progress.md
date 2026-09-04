# Supaprod Front-End Rebuild — Progress Tracker

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Rebuild kickoff:** 2026-07-18 13:18 IST  
**Founder awake window:** ~14:18 (1 hour from kickoff)  
**Target completion:** 2026-07-20 (2-3 days, phase-gated)  
**Build mode:** Full code, terse docs, zero prose overhead

---

## PHASES

### ✅ Phase 0 — Audit (DONE)
- [x] Taste document extracted (Vercel-grade premium/minimal)
- [x] Token extraction from landing page
- [x] Route inventory: 85+ routes → keep/merge/kill (40+ decisions logged)
- [x] Backend API scan (existing functions reusable)
- [x] Current IA assessment + cognitive-load diagnosis
- [x] Capability coverage matrix outline
- [x] Installed skills + design tools cataloged
- [x] Founder questions identified (6 items for morning queue)

**Deliverable:** `docs/planning/archive/rebuild-2026-07-18/phase-0-audit.md` (committed 0e2e2962)

---

### ✅ Phase 1 — Architecture (DONE — 5ffa9659)
**Completed autonomously** (founder unavailable during awake window; 6 assumptions logged in Morning Decision Queue)

**Work items completed:**
- [x] Three-surface IA detail (Home/Project/Approvals) + Shell layout with diagrams
- [x] Route map (85+ old routes mapped to keep/merge/kill with new homes)
- [x] User journey flows (8 stages: onboarding, Home, Project·Plan, Project·Build, Ship, Launch, Grow, plus entry-at-any-stage variants)
- [x] Approval-gate inventory (all proposal types)
- [x] Full capability coverage matrix (every feature → new reachable path, nothing orphaned)
- [x] Lifecycle motion map (interrupt, break, go-back, revert, fast-forward, fork, pause, cancel — all designed before pixels)
- [x] Product-management domain lifecycle map (18 practices: discovery through sunset, nothing left out)
- [x] Copy deck v1 (primary UI strings, section names, one-liners, empty/error states, onboarding script, launch-kit templates)
- [x] Rename pass (Cadence → Supaprod + exceptions ledger)
- [x] Morning decision queue (6 assumptions logged, all reversible)

**Deliverable:** `docs/planning/archive/rebuild-2026-07-18/phase-1-architecture.md` (531 lines, comprehensive, ready for Phase 2)
**Status:** Awaiting founder review of 6 logged assumptions before Phase 2 (Design System Ink)

---

### ✅ Phase 2 — Design System "Ink" (DONE — ed187bc5)
**Complete Tempo v5 token system + 12-component production library**

**Deliverables Completed:**
- [x] Tempo v5 token system: dark + light themes (1a1e22b4)
  - All --ds-* scales (gray, ember, blue, red, amber, green, teal, purple, pink)
  - Focus rings, materials, shadows, typography classes, spacing ramp
  - Dark-first, same token names both themes, resolves via [data-theme='light']
- [x] Button component (c994fecc): 6 variants, 3 sizes, full-width, focus ring
- [x] Input & Textarea (c994fecc): error states, aria-invalid, focus ring
- [x] Card component (c994fecc): Header/Title/Description/Content/Footer anatomy
- [x] Modal (cab23950): Radix Dialog, backdrop, focus trap, ESC close, animations
- [x] Badge (cab23950): 6 status variants per DESIGN-TEMPO §2, pill/rectangle shapes
- [x] Tabs (9f18f62b): Radix Tabs for stage selector, arrow key nav
- [x] Select (9f18f62b): Radix Select, portal dropdown, keyboard support, checkmark
- [x] Spinner (9f18f62b): 3 sizes, animated rotation, motion-gated
- [x] Checkbox (ed187bc5): Radix Checkbox, tri-state, focus ring
- [x] AgentActivityTimeline (ed187bc5): Supaprod signature element, Geist Mono, engineering grid

**Component Library Stats:**
- 12 production-ready components (src/components/ink/index.ts)
- All built with Radix UI + Tailwind v4 + CVA
- All accessible (ARIA roles, semantic HTML, keyboard navigation, focus management)
- All theme-aware (resolve from --ds-* tokens, work in dark+light)
- All motion-gated (respect prefers-reduced-motion)
- Zero hardcoded hex values in component code

**Ready for Phase 3:** Screens can now consume the Ink library for layout/interaction

---

### Phase 3 — Screens (READY TO START)
**Workstreams (can parallelize on Ink component library):**
- [ ] Auth doorway (landing → login/signup, inherit landing starfield, one sentence)
- [ ] Onboarding (≤3 conversational steps, agent drafts first plan immediately)
- [ ] Home surface (command bar hero, recent projects, one quiet suggestion, no dashboards)
- [ ] Project surface — adaptive canvas (code face / design face / plan face / shipping face)
- [ ] Project surface — lifecycle spine (6 stages: Plan/Design/Build/Ship/Launch/Grow as progress bar + stage selector)
- [ ] Project surface — agent-activity timeline (streamed, Geist Mono, who did what when)
- [ ] Approvals surface (queue of all pending decisions with approve/reject/edit one-tap)
- [ ] Settings shell (Account/Workspace/Connections/AI/Billing/Advanced, progressive disclosure)
- [ ] Settings > Connections (workspace integrations + source bindings)
- [ ] Settings > Memory (workspace-learned conventions + fixture timeline, searchable/curate)
- [ ] Settings > Advanced > Model Routing Console (per-surface Auto/pin controls, recommendations, operator policies)
- [ ] Settings > Advanced > Engine Room (traces, evals, guardrails, drift — power users only)
- [ ] Empty/loading/error states (every screen designed, not assumed)

**Deliverable:** Screens in sandbox branch, journey walkthrough functional end-to-end

---

### Phase 4 — Integration & Purge (blocked until Phase 3)
- [ ] Wire screens to tested backend (read-safe operations only)
- [ ] Migrate user/workspace/project data from old routes' localStorage/state
- [ ] Remove dead routes (85+ old ones identified in Phase 0)
- [ ] Purge v1–v5 design remnants (liquid-glass, widgets, Tempo skins)
- [ ] Run stray-brand sweep (grep clean of "Cadence" brand uses, per Prime Directive 1)
- [ ] Add redirects from legacy URLs (for any users on old links)
- [ ] Test suite: existing backend tests still green, new screen-integration tests added

**Deliverable:** Sandbox branch ready to merge to production, all live tests passing

---

### Phase 5 — Demo Data Seed
- [ ] Helio Labs workspace (1 owner, 2 team members)
- [ ] Atlas project (complete: idea → launch, launch kit sent, Grow traction digest)
- [ ] Relay project (mid-build: agents active, timeline, 2 Approvals pending)
- [ ] Comet project (fresh: one-sentence idea, draft plan awaiting approval)
- [ ] Beacon project (imported: existing product mid-lifecycle, one feature in Build)
- [ ] Seed deterministic, idempotent, realistic, clearly fictional
- [ ] No lorem ipsum anywhere; believable timestamps

**Deliverable:** Seed script runs once, produces full demo narrative ready for founder demo

---

### Phase 6 — Review Gauntlet (final quality)
**Six judges:**
1. Outsider power user (Vercel-grade craft, allergic to clutter)
2. Brand-new founder user (ten-second comprehension, five-minute value)
3. Enterprise buyer (trust: approvals, audit, roles, honest claims)
4. Investor (YC application reviewer — five-minute idea→launch narrative)
5. Serial founder (delight, care in details, users brag about it)
6. Rohit (would he sign up if this weren't his product?)

**Verification:**
- [ ] Ten-second comprehension test (show Home to outsider, they state what it does unprompted)
- [ ] Five-minute walkthrough (signup → first artifact in ≤5 min, ≤3 decisions)
- [ ] Both themes tested (dark/light/System setting)
- [ ] Responsive at 320/768/1280px, keyboard-navigable, WCAG AA contrast
- [ ] Empty/loading/error states present + designed
- [ ] Perf: p75 interactive < 2s on mid-tier hardware
- [ ] Playwright E2E: full journey → login → Relay approvals → ship → launch kit → end
- [ ] Five-minute founder demo script written and rehearsable

**Deliverable:** Screenshots of each judge-relevant state, Playwright run results, demo script, gap report, decision ledger

---

## MORNING QUESTIONS FOR FOUNDER

**Deadline to answer: ~14:18 (1 hour from audit completion)**

1. **Logo/wordmark timeline:** When ready? Until then, use Geist Pixel wordmark as placeholder (structured for drop-in).
2. **Existing-product import:** What does backend support today (repo URL, docs upload)? Scope for phase 1 vs. 1b.
3. **Auth providers:** Google + GitHub + email? SSO/SAML for enterprises?
4. **Deploy targets:** Custom domains? Which infrastructure (Vercel, Netlify, self-hosted)?
5. **Retire confirmation:** Today's weather widget, focus-dock widgets — confirmed kill? (Brief suggests yes.)
6. **Cadence user migration:** How handle existing Cadence accounts + URL continuity?

---

## ACTIVE DECISION LEDGER

(Decisions made during build, logged here)

*TBD as work progresses*

---

## CHECKPOINT LOG

| Time | Phase | Status | Next |
| --- | --- | --- | --- |
| 2026-07-18 13:18 | Kickoff | Brief received, Phase 0 audit started | — |
| 2026-07-18 13:48 | Phase 0 | ✅ Audit complete (0e2e2962) | Await founder decisions |
| 2026-07-18 14:15 | Phase 1 | ✅ Architecture complete (5ffa9659), 6 assumptions logged | Founder review + Phase 2 |
| 2026-07-18 ~15:30 | Phase 2 | ✅ Complete: Tokens (dark+light) + 12 components (1a1e22b4, c994fecc, cab23950, 9f18f62b, ed187bc5) | Phase 3 (screens) |

---

## TOKEN BUDGET & SPEND TRACKING

*For build-time model routing (Haiku/Sonnet for mechanical work, Opus/Fable for judgment)*

- **Mechanical:** Route generation, component templates, boilerplate
- **Judgment:** IA decisions, motion timing, copy refinement, final polish

*Update as spending occurs*

---

## WORK PRESERVATION RULE

**Commit every 30-45 min or at every coherent checkpoint.** Checkpoint examples:
- Design-system foundations (tokens, dark/light)
- One complete screen (Home, Project, Approvals, Settings)
- A workstream fully done (e.g., Settings shell + all 5 sections)
- Integration of a backend service
- A test suite added/updated

*Zero tolerance for lost work.*

---

## REFERENCE MATERIALS

- Master Brief: `docs/planning/rebuild-2026-07/final-sweep/Supaprod Front-End Rebuild.md`
- Goal prompt: `docs/planning/rebuild-2026-07/final-sweep/Goal Prompt for Supaprod Rebuild.md`
- Audit: `docs/planning/archive/rebuild-2026-07-18/phase-0-audit.md`
- Vercel study: `docs/planning/vercel-dissection-study-2026-07-17.md`
- Landing page tokens: extracted in Audit section 1
- Taste document: Audit section 0

---

**Build started:** 2026-07-18 13:48 IST  
**Estimated ship date:** 2026-07-20  
**YC application deadline:** Phase 6 review complete → ready for founder's deck work
