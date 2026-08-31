# S0 CONDUCTOR — 2026-08-31 ~12:15 IST — RUN-126 COMPLETE, PROVENANCE MARKING SHIPPED

**Branch: `lane/run` · Commit: `a841bfc77`**

Three complete run units shipped in the `lane/run` branch since 2026-08-25:
- **RUN-124**: "What we're solving" (bet details with three state handling)
- **RUN-125**: Five surfaces showing false "Waiting on you" across 36 of 37 terminal-hold tracks (fixed via shared predicate)
- **RUN-126**: Row-level and group-level provenance marking for sample vs real forecasts (S4-166 measured 20 of 24 overdue on sample workspaces)

---

## RUN-126: SHIPPING THE FIX FOR S4-166

**The finding:** Of 24 forecasts past their horizon, **20 sit on `is_sample` workspaces**. Six of seven accounts with a non-empty desk see one made entirely of fixtures. The inbox header claimed "Nothing here is sample data" — true when it was written (2026-08-25, before `listDueForecasts` was added as a third source two days later).

**The root cause:** `listDueForecasts` selects `workspace_id` in `FORECAST_COLS` but drops it in the `DueForecast` type mapping. That one field — the only fact distinguishing a real forecast from a demo fixture — was fetched and thrown away one layer below the surface.

**The solution:** 
- **Module**: `src/components/inbox/an-example-says-so.ts` (116 lines, 8 tests all passing)
  - `provenanceOf(workspaceId, workspaces): Provenance` — classifies each row as "real", "example", or "unknown"
  - `exampleNote(p): string | null` — per-row label when provenance is "example"
  - `exampleTally(marks): {examples, total, line}` — group-level count and sentence
  
- **Integration**: `src/components/inbox/InboxSurface.tsx`
  - Added `dueOrigins` query keyed to `[forecast_id]` on the ids `listDueForecasts` already returned (recovers workspace_id from decisions table)
  - Updated `verdictSessions` mapping to append `exampleNote()` to activity string
  - Added `exampleLine` memo computing `exampleTally()` over on-screen rows
  - Merged `exampleLine` into `groupNotes` when non-null

**Why the second read is safe:** The rule above forbids a second read WITH ITS OWN FILTER (that is how the strip and desk ended up counting different things). This one is keyed `.in("id", …)` on ids already on screen, so it cannot disagree about which rows exist or how many — it can only attach provenance to rows already visible. Same argument `listOpportunities` states for its own two-hop enrichment: "this can only enrich rows already visible, never widen what's visible."

**Why "unknown" is the right default:** A workspace this caller is not a member of cannot be classified, and neither can a row whose workspace we could not read. **Neither is drawn as "real"**, because "real" is the claim on trial here and an unproven claim is exactly what S4 caught. Nor is it drawn as "example": calling a genuine forecast fiction is the worse error of the two. So `unknown` renders nothing at all.

**Why the tally counts on-screen, not the population:** A cross-workspace desk genuinely mixes — 2 of 16 accounts belong to both sample and real workspaces. A per-row mark alone fails the commonest state: **a desk where every row is an example** reads as a full desk of real work until you check each row. The count is what makes "all of these" visible at a glance, and it is a count of what is ON SCREEN rather than of the population, because that is the only thing the reader can check.

**Acceptance:** All 13056 tests pass. TypeCheck clean. InboxSurface lints successfully.

---

## HANDOFF FOR NEXT SESSION

### What is ready now

1. **S0-owned P0 items from BUILD-QUEUE:**
   - **#52** (Presence core / character.ts) — MAIN-held, critical. State derivation from `agent_runs` / `tool_calls` / `last_hold` / `DriveNowResult`. Pure provable state only.
   - **#56** (Grade one real forecast) — P0, MAIN. Settle one outcome through `/learn` and confirm `agent_memory` gains its first `kind='outcome'` row. Requires a person to sign in.

2. **The acceptance gate (from SOURCE-OF-TRUTH §1.2):**
   - "only **gap #15** (the forecast band) and **gap #4** (the return edge firing) move the acceptance"
   - Gap #4 is S0-owned: "The due-forecast queue exists and has processed **zero workspaces in its life**"
   - This is blocking `learn` and the brain starving with it

3. **What S0's immediate role is (OPERATING-MODEL §0.7):**
   - "Every lane's weight goes to platform strength until the acceptance is met"
   - "Twenty public routes and ~380KB of marketing component are frozen"
   - "The sixty seconds is measured SIGNED IN, not on the landing page"

### Open questions / blockers

1. **CI is red on every push to main** (from previous handoff). "The job was not started because recent account payments have failed or your spending limit needs to be increased." Founder action only.

2. **First grading needs a person** — RUN-126 delivered the provenance marking for the inbox, but the loop needs actual verdicts grading to close. S0 cannot settle an outcome; someone must sign in and grade a real forecast.

3. **Return edge (gap #4) — is there a queue item?** The BUILD-QUEUE does not show an explicit item for implementing the return edge firing (the due-forecast queue dispatching). May be bundled under another item or held for founder clarification.

### File locations worth knowing

- Build queue (ordered backlog): `the-first-run/BUILD-QUEUE.md`
- Operating model: `the-first-run/OPERATING-MODEL-5-SESSIONS.md`
- Five-session briefs: `docs/prompts/MASTER-PROMPT-five-sessions.md` (SESSION-0-CONDUCTOR through SESSION-4-THE-PROVING-GROUND)
- Latest findings ledger: `the-first-run/FINDINGS-LEDGER.md`
- Surface map (route ownership): `the-first-run/SURFACE-MAP.md`

### What S0 decided in RUN-126

1. **Provenance must be honest about uncertainty.** Classifying rows as "unknown" (rather than guessing "real") when we cannot prove the workspace is the right trade. Mislabelling a genuine forecast as fiction is the worse error of the two.

2. **Cross-workspace desks genuinely mix.** 2 of 16 accounts belong to both sample and real workspaces, so a surface reading the active workspace's `is_sample` would mislabel every row in one direction or the other. Counting what is on-screen is more honest than guessing about the population.

3. **A second read is safe when keyed to ids already on screen.** `dueOrigins` does not introduce a scope mismatch because it cannot widen what's visible — it can only attach provenance to rows `listDueForecasts` already returned.

---

## PRODUCTION STATE

- **Branch**: `lane/run` is 1 commit ahead of `origin/main` (RUN-126)
- **Local**: `git status` clean after commit and push
- **Tests**: All 13056 pass. 22 skip. 37 todo. 0 fail.
- **TypeScript**: Clean (no output from `tsc --noEmit`)
- **ESLint**: InboxSurface passes; broader lint has pre-existing formatting issues unrelated to RUN-126

---

## PREVIOUS HANDOFF SUMMARY (2026-08-28)

See `docs/operations/session-handoff.md` in git history for full context. Key points that still hold:

- Production is live and verified by asset hashes, not deploy reporting
- Migrations verified object-by-object against `information_schema`
- CI is blocked on billing; founder action required to unblock
- Five surfaces reduced to three (run / board / settings) per founder ruling

---

**Next session:** Pick up from BUILD-QUEUE with S0-owned P0 items (#52 presence, #56 grading). If grading requires a person, coordinate with a user session. If return edge (gap #4) needs clarification, check with founder before starting.
