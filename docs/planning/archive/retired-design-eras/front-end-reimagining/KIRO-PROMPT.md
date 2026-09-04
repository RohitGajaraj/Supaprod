# The exact prompt to paste into Kiro (or any agent) to continue

> _Created: 2026-08-03 · Last updated: 2026-08-03_

Copy everything between the lines into the new session, from the repo root.

---

You are continuing a founder-approved, mid-flight front-end rebuild of Supaprod called Mission Control. The work lives on branch `sandbox/mission-control-v2` (already pushed to origin, HEAD at commit `5b26cfc4`). Check out that branch and never work on main.

Before doing ANYTHING, open `docs/planning/front-end-reimagining/CONTINUATION-BOARD.html` in a browser for the visual phase map (what is done, where you start), then read these in order:
1. `docs/planning/front-end-reimagining/HANDOFF.md` - the live state and your complete task list (its CONTINUATION section is your work order).
2. `docs/planning/front-end-reimagining/problem-statement.md` - the charter.
3. `docs/planning/front-end-reimagining/design-language-spec.md` - the design law. The Addenda 1.1, 1.2, 1.3 at the bottom override the body.
4. `docs/planning/front-end-reimagining/execution-plan.md`, `journey-catalog.md`, `gap-register.md`, and the two decision records `mockups/GATE-1-DECISIONS.md` and `mockups/GATE-1B-REVIEW.md`.

Phases R, M, 0, 1, and 2 are DONE, verified live, committed, and pushed. Do not redo them. Specifically, Phase 2 (the conversation layer: use-ask-stream, the Briefing, journeys-as-data, the Composer/Thread/journey chips, the single ComposerOverlay everywhere) is closed: tsc clean, 3536/3536 tests passing, and a live logged-in smoke test confirmed the Briefing renders, a typed question streams a real answer, the "Just write the PRD" journey chip lights only the Plan slice on the spine, and both shortcut keys open the same one input box on old AND new surfaces. Evidence screenshots are in `docs/planning/front-end-reimagining/build-evidence/phase2-*.png`.

**You start at Phase 3.** Read the Phase 3 section of HANDOFF.md and build exactly that: the seven CanvasFace implementations, the ApprovalsTray, the WorkingStrip, the ember-to-done signature moment, the approved app-idle starfield on its scoped surfaces, and the cost-quiet pass. I am releasing the Phase 3 hold by giving you this prompt. Then continue to Phase 4, then Phase 5, exactly as the HANDOFF specifies.

Visual references: the approved mockups in `docs/planning/front-end-reimagining/mockups/` are what each surface must look like. Open them in a browser as you build (start with `index.html`, the gallery with per-screen notes):
- `_shell-template.html` + `_shared.css` - the shell DOM and style contract (the committed MissionShell follows it).
- `screen-2-room-rest.html` - the room at rest: rest face, Briefing in the thread, receipts. Target for Phase 2/3.
- `screen-4-room-gated-tray.html` - the Approvals tray open, gate cards, keyed verdicts. Target for Phase 3.
- `screen-3-room-building.html` - the Build face (code + terminal). Target for Phase 3/4.
- `screen-5-journey-flow.html` - a journey's start and done states on the spine. Target for Phase 2/3.
- `screen-6-design-face.html` - the Design face (interactive prototype). Target for Phase 4.
- `screen-7-agents-settings.html` - the reclustered Settings + Agents group. Target for Phase 4.
- `screen-9-threads-home.html` - the Threads home. Phase 4, ONLY after I sign the concept.
- `screen-1-first-run.html` + `landing-when-you-login.html` - first-run and post-login orientation. Target for Phase 5 onboarding and the prospect state.
- `card-spec.html` - the corrected card anatomy for every card type. `starfield-variant.html` - the approved app-idle treatment. `color-v2-board.html` + `screen-8-decision-board.html` - decision records.
IMPORTANT: some rulings postdate the mockups. Where a mockup conflicts with the spec Addenda 1.1-1.3 or the committed code, the addenda and code win: chips are slate silver now (mockups still show ember chips), memory is Vellum (mockups show gold), and the card source-recognition wash is interim pending my pick.

Hard rules, non-negotiable:
- Sandbox branch only. Never touch main, production, Supabase migrations (except the Phase 5 seed function, which you show me first), or any public landing/marketing page.
- No merge to main, ever, without my explicit approval in my own words. A question is never approval.
- **Commit and push after EVERY phase before starting the next one, no exceptions.** Before moving from Phase 3 to Phase 4, and from Phase 4 to Phase 5: `bunx tsc --noEmit` clean, the relevant `bun test` scopes green, a live smoke check on what you built, then commit with a one-line WHY, push to `sandbox/mission-control-v2`, and confirm `git rev-parse HEAD` equals `git rev-parse origin/sandbox/mission-control-v2` before touching the next phase. If a phase takes a while, checkpoint-commit verified partial progress rather than sitting on uncommitted work. I need to be able to close this session at any point without losing anything.
- Before every commit: `bunx tsc --noEmit` clean and the relevant `bun test` scopes green. Dev server needs default Node 26; `bun run build` needs Node 20.20.2.
- Design law: no colored edge strips on cards, chips wear the slate `--chip-*` tokens (never ember), ember only on primary actions, memory is Vellum, machine is blue, no purple anywhere, one input box per screen, costs never shown inline (credits behind a details click only), humanized UI strings (no em dashes, no AI-sounding phrasing), every screen has exactly one primary action.
- Honesty: no UI string may claim behavior the backend does not actually perform. No feature is ever cut silently; flag anything you think should be dropped and ask me.
- Three things need MY sign-off before you build or finalize them: the card source-recognition treatment (show me 2-3 rendered options including the memory/Vellum tone), the Threads home surface, and the Artifacts naming/placement. Present, then wait.

When Phase 5's Love-Gate walkthrough passes on a fresh account, stop and hand me the running dev server for my Gate 2 review.

---
