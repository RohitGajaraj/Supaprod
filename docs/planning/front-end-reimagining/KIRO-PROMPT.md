# The exact prompt to paste into Kiro (or any agent) to continue

Copy everything between the lines into the new session, from the repo root.

---

You are continuing a founder-approved, mid-flight front-end rebuild of Supaprod called Mission Control. The work lives on branch `sandbox/mission-control-v2` (already pushed to origin). Check out that branch and never work on main.

Before doing ANYTHING, read these in order:
1. `docs/planning/front-end-reimagining/HANDOFF.md` - the live state and your complete task list (its CONTINUATION section is your work order).
2. `docs/planning/front-end-reimagining/problem-statement.md` - the charter.
3. `docs/planning/front-end-reimagining/design-language-spec.md` - the design law. The Addenda 1.1, 1.2, 1.3 at the bottom override the body.
4. `docs/planning/front-end-reimagining/execution-plan.md`, `journey-catalog.md`, `gap-register.md`, and the two decision records `mockups/GATE-1-DECISIONS.md` and `mockups/GATE-1B-REVIEW.md`.

Then start with HANDOFF Step 0 (the Phase 2 state check), finish Phase 2 if needed, and proceed Phase 3, then 4, then 5, exactly as the HANDOFF specifies. I am releasing the Phase 3 hold by giving you this prompt.

Hard rules, non-negotiable:
- Sandbox branch only. Never touch main, production, Supabase migrations (except the Phase 5 seed function, which you show me first), or any public landing/marketing page.
- No merge to main, ever, without my explicit approval in my own words. A question is never approval.
- Commit and push to `sandbox/mission-control-v2` after every verified chunk, with a one-line WHY in the commit message.
- Before every commit: `bunx tsc --noEmit` clean and the relevant `bun test` scopes green. Dev server needs default Node 26; `bun run build` needs Node 20.20.2.
- Design law: no colored edge strips on cards, chips wear the slate `--chip-*` tokens (never ember), ember only on primary actions, memory is Vellum, machine is blue, no purple anywhere, one input box per screen, costs never shown inline (credits behind a details click only), humanized UI strings (no em dashes, no AI-sounding phrasing), every screen has exactly one primary action.
- Honesty: no UI string may claim behavior the backend does not actually perform. No feature is ever cut silently; flag anything you think should be dropped and ask me.
- Three things need MY sign-off before you build or finalize them: the card source-recognition treatment (show me 2-3 rendered options including the memory/Vellum tone), the Threads home surface, and the Artifacts naming/placement. Present, then wait.

When Phase 5's Love-Gate walkthrough passes on a fresh account, stop and hand me the running dev server for my Gate 2 review.

---
