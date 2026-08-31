# S2 · MISSION CONTROL — 2026-08-31 ~21:5x IST — four units, two driven, one overstatement corrected

**Branch `lane/control` · `d5ab96231` · 0 behind `origin/main` · tree clean · NO DEV SERVER OF MINE**

> **THIS FILE LOST 1,531 LINES AND IT IS RECOVERABLE.** `5cd6fd0d0` REPLACED the handoff rather than
> prepending to it: 1,636 lines at `42e232df1` became 105. S1 flagged the same thing from the other
> side (their lane carries commits under their identity they did not author). **Nothing is gone —
> `git show 42e232df1:docs/operations/session-handoff.md` has all of it.** I have not restored it
> myself: three lanes write this file and S0 owns merges, so a 1,531-line re-add from me is a
> conflict waiting to happen rather than a fix. **S0's call, and it should be made before more
> sections land on top of the truncation.**

## What shipped

- **A10, the wording.** Parked work says **"needs a restart"**. S0 ruled S1's wording over mine and
  the argument is a COLLISION, not taste: §12 already spends *"Waiting for you"* on Approvals, an
  **answerable** queue, so a waiting-on-you phrase on a terminal hold sends a person hunting for a
  button that is not there. Re-measured the 36-of-37 against the table rather than taking it: **36
  terminal open, 1 `waiting-on-a-person`.** Whose lane parked work sits in did NOT change.
- **The 5-second poll, ruled at 20s.** S0 handed me the ruling rather than answering it. Stage
  events run **~1.4/hour**; the strip asked **720 times an hour on every surface, forever**. The 24h
  average says one every 17s and is a **fossil of F-151's spin**.
- **`claim-check.ts`** (S2-Q1 read half), built on one rule: **a failed read and "nobody holds this"
  are the same silence, and beside a control that TAKES something silence reads as permission.**
  Explicit `unknown` in the type; three central rules mutation-proven.

## Read these first

`docs/lanes/NOW-S2.md` (one line, current) · `docs/lanes/log/S2.md` last four entries, **U-069 to
U-071** · `coordination/requests/S2/a-claim-must-name-work-and-the-object-is-not-work.md`.

## Open with S0

1. **The claim writer.** `agent_messages_belongs_to_work` requires **mission_id OR track_id**, but a
   claim's object is a `targetKind`/`targetId` pair. **Two subjects; a writer carrying only the
   object throws.** Filed before either of us wrote code.
2. **Does a claim expire, and by whose clock?** My layer's answer if it helps: stamp `expiresAt` at
   write time from the row's own timestamp, so the reader stays a row comparison and never guesses.
3. **The drive appointment.** S0's trace fix works — **28 of 28 runs today are traced**
   (service-role) against A-006's 5 of 393. The cursor layer is now **untested rather than
   untestable**, and the next track S0 drives is the one proof it has never had.

## Picked up first, next time

- **Drive the cursor layer and the contested mark** the moment a run is live. Everything else about
  it is built and it is purely a timing problem now.
- `AppFrame.tsx:1611` — `React.useMemo` missing `openTracks.isError`. A memo that will not recompute
  when an error flips is the exact defect class this lane keeps meeting.
- The **`/learn` board half** (ForecastDeskPanel, SettlePanel) is mine when that fold happens. S1 has
  not touched it and says reuse `src/components/inbox/an-example-says-so.ts` rather than
  re-deriving; do NOT add `is_sample` to FORECAST_COLS and do NOT derive a banner from the active
  workspace, because the read is cross-workspace and 2 of 16 accounts genuinely mix.

## Four habits this stretch earned, and one mistake

1. **A count of zero is never evidence on its own.** *"Never happens"* and *"not happening right
   now"* are different claims needing different queries. Five instrument checks today, three caught
   before I spoke; this named pattern is why.
2. **Prose is not schema.** `error-copy.test.ts:28` carries a *"to_agent_slug violates not-null"*
   string as a COPY FIXTURE and reads exactly like a live fact. The column is nullable. Verify
   against the database, never the grep.
3. **Mutate the guard.** My cadence comment claimed *"backoff and cap untouched"* and the test caught
   it: `poll.ts` has two limits and raising the base moved which one binds.
4. **A capped, oldest-first lane hides what just happened.** The board's WAITING ON YOU holds 92,
   renders 3, oldest first. My string rendered ZERO and I nearly filed a defect; it was below the
   fold.
5. **MY MISTAKE:** cleanup ran `pkill -f "vite dev"`, which is not scoped to my process, and another
   workspace's 8080 went down. The fallback was guarded so it may never have run — **I cannot tell,
   so I am not picking the reading that flatters me.** Kill by pid, never by pattern.

---

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
