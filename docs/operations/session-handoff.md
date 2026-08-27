# S3 handoff, 2026-08-28 ~00:30 UTC

**Lane `lane/platform`, 32 commits U-111 to U-141, all pushed, all gated.** The tree is clean and
every unit is coherent on its own. Nothing is half-landed.

## THE ONE PATTERN WORTH CARRYING FORWARD

**Unreachable finished work is the most common defect on these surfaces.** More common than wrong
logic, and INVISIBLE TO EVERY GATE: it typechecks, it lints, it builds, its tests pass. Seven
instances in one night, each a capability wired end to end with no way in:

| What was finished | What was missing | Unit |
| --- | --- | --- |
| `BoundaryTool.chosen` (S0 shipped the field) | nothing read it | U-125 |
| `MessageMetaFooter`, the only caller of `submitFeedback` | mounted nowhere, so **nothing in the product can rate a recall** | U-137 |
| `AutoChip`, 32 lines | never drawn, so **166 of 369 decisions read as hand-raised** | U-138 |
| `OutcomeHistory`, 188 lines | built for a tab it never reached | U-140 |
| `data-motion`, 8 CSS rules + a MutationObserver | **nothing in `src/` ever wrote it** | U-141 |
| `AskInPlace`, 176 lines | S1's mounts, still open | — |
| `LiveTicker` | S2's top bar, still open | — |

S4 has now gated the class (`bun run check:unreachable`, baseline 141 server functions / 80
components, fails on an increase).

**ONE THING THE NEXT SESSION MUST NOT RE-INVESTIGATE, AND MUST NOT TRUST AT FACE VALUE.** That
detector counts a component orphaned when no STATIC import names it. It does not see
`React.lazy(() => import("…"))`. I checked ten of the components it lists — `ApprovalsPanel` (5
callers), `CompoundingPanel` (7), `ArtifactsView` (4), `AgentRosterPanel`, `IncidentsPanel`,
`SelfImprovementPanel` (2 each), `SupportSignalsPanel`, `EvalCalibrationPanel`, `EvidenceRule`,
`PairMark` (1 each) — and **every one is mounted**, most through a lazy import in a route. The 80 is
therefore an upper bound, not a work list. The ratchet is still worth keeping (it cannot regress),
but do not go mounting things off that output without grepping for the name first. Fixing the
detector to follow `import(` belongs to S4, who owns `e2e/`.

## What changed that a person can see

- **Boundary / Guardrails, `src/components/governance/BoundaryControls.tsx`** — rebuilt around one
  question: *what can these agents do without asking me.* Posture headline, then where the crew
  stands, then three regions each stating the SET-vs-RUNNING disagreement in words
  (`Set to Ask first, and it does not: …`), then what your answers changed, then the ceiling and the
  kill switch. Six new pure modules with guards: `ceiling-reality.ts`, `gates-nobody-answered.ts`,
  `what-they-actually-did.ts`, `where-the-crew-stands.ts`, `who-chose-this.ts`,
  `guardrail-silence.ts`.
- **`getBoundary` now buckets on what a tool RUNS AS, not what it is set to** — it composes the seed
  with the arc dial and the safety floors through `resolveToolMode`, which is what the loop does. A
  row set to `confirm` on a `trusted` arc runs as `auto`, and the screen used to file it under "asks
  first". 96 of 97 `agent_tools` rows run as `auto`.
- **Three-state discipline everywhere** — `false` is not `null`, absent is never claimed as false, a
  failed read never renders as zero. Four panels used to say the record was empty when the read had
  failed (U-120).
- **Tap targets** — 44px floors across the home page, `/product`, the legal footers and the failed-room
  control. The footer link's target is a centred `::after` overlay because it sits inline in prose and
  cannot reflow the row.
- **Motion** — Settings › Appearance now carries the switch the whole product was already obeying.
  It can only ever AGREE with an operating-system reduced-motion preference, never override it.
- **`bun run typecheck:tests`** — no test file in this repo had ever been typechecked. Two of mine
  were not testing anything (U-131) and six fixtures were not the shape the product returns (U-132).
  Deliberately NOT gated: 414 errors remain, visible and drivable.

## OPEN, and why I did not take them

Each needs an owner who was offline, and each is one small change:

1. **`Door` is 56×21 inline in prose** (`src/components/meridian/`). `CONTROL_SHAPE` already gives
   every `Action` a 44px floor below `md`; `Door` never got it. The remedy is the `::after` overlay
   from U-135, which is already shared in `src/styles/public-legibility.css`.
2. **`ReadFailed` repeats the shell's session sentence and adds a second door.** `AppFrame` already
   states the rule: the shell says it once, above everything. Same directory as (1).
3. **Nothing mounts a recall-rating control.** `MessageMetaFooter` and `submitFeedback` both work;
   the surfaces that would carry "did this help" are S1's. Until one does, the Brain's 77-of-12,531
   rated count is what was rated before the control was taken out, and U-139 says exactly that on
   screen rather than implying the rest were unhelpful.

## Do not re-measure these

`guardrail_hits` stop dead on 2026-07-25 and S4 showed most are PLANTED (7,225 sample-workspace rows
sharing a microsecond a month apart). Spend ceiling is $10 on all 21 workspaces against a max single
run of $0.142. `mission_token_cap` is NULL on all 2,570 runs with **no resolver and no caller**. 92
of 324 approvals expired unanswered. 133 of 135 learnings have a NULL `decision_id`. One
`user_notification_preferences` row against 16 profiles (U-134).
---

# S2 · MISSION CONTROL handoff, 2026-08-28 ~05:20 IST

**Branch `lane/control`, pushed at `e4361662b`, tree clean, 0/0 with origin. No dev server of
mine; port 8080 is free as far as I am concerned.** Closed on the founder's instruction relayed
by S0, mid-unit, with the unit finished rather than abandoned.

## DONE this session, last first

- **`e4361662b` The rail carries the working crew, on every surface.**
  SPEC-MULTIPLAYER-PRESENCE §3.4, the largest item my brief names me owner of.
  `RailCrew` mounts once in `AppFrame` between the nav and `.sp-railfoot`, so the answer to
  "who is working and on what" is the same on every surface. Pure derivation in
  `src/components/shell/rail-crew.ts` (newest anchor per agent), 18 tests across two files.
  It shares `queryKey: ["presence", "anchors", workspaceId]` with `OverlapNote`, so the board's
  collision marks and this stack are two renderings of one fetch and cannot disagree.
- Before it, 31 units on this lane, all gated: the board no longer states more than its reads
  support (false all-clears, capped-read counts, cross-scope numbers, restatement), every
  `SlowRead` in the product offers a way out after 15s, and the poll helper backs off on failure.

## OPEN, and it is mine

- **§3.1 the cursor layer and §3.2 the shared-object indicator are NOT BUILT.** §3.3 the
  collision mark exists but only on the board, via `today/OverlapNote.tsx`; the spec puts it
  app-wide in the shell. §3.4 is now built, so the remaining three are the whole gap.
- **The empty-workspace path has never been verified in a browser**, after three attempts that
  each failed on my instrument rather than the product. Draining server-fn responses does not
  work: every function has its own shape and a generic drain leaves the page at ~841 characters
  of nothing. The honest instrument is a genuinely empty workspace, i.e. a second account.
  `quietMorning`, `CrewPulseNote` and now `RailCrew`'s quiet state are pinned by unit tests only.
- **The fold is still the founder's call, not mine.** At 1440x900 the first Approve sits at
  946px. Every remedy costs something real; the analysis is in `docs/lanes/log/S2.md`.

## FOR S0 AND S1 — a swallow that makes a failure indistinguishable from calm

`getWorkspaceAnchors` (`src/lib/approvals-queue.functions.ts`, around line 1947) catches a failed
`agent_runs` read and **returns `{ anchors: [], collisions: [], unknowableRuns: 0 }` rather than
throwing**. So `isError` never goes true, and one branch is reached by both "nobody is working"
and "we could not find out". That is why `RailCrew`'s quiet state is a DOOR to `/start` and not a
sentence: a sentence there would be a false all-clear on a dead feed. Fix it at the source and the
door can become the honest sentence the spec asks for. **Do not "fix" the component instead.**

## FOR S4 — §3.4 is built, and here is what to point your standing check at

Your check is that no presence mark exists which cannot be traced to a row. `RailCrew` cannot
break it structurally, not carefully: `getWorkspaceAnchors` filters `agent_runs` to the live
statuses and joins `tool_calls` only to those runs' traces, so every mark drawn IS a live run.
Runs with no `trace_id` are counted, never drawn ("N more are running and not saying what"),
because dropping them would undercount the crew on the one control that answers "how many".

## DO NOT RE-INVESTIGATE

- **Em dashes.** 0 in user-facing strings across 1175 non-test source files, 0 visible text nodes
  on the rendered board. Closed.
- **Meridian adoption.** 49 of 49 components have an importer. Closed.
- **`missions` has no subject key** (full column list checked). Duplicate detection matches on
  title as a floor. If a real subject relation lands, the title matching GOES rather than
  becoming a fallback.
- **A growing test-failure count on an unchanged tree is a machine report, not a test report.**
  I watched 2 -> 7 -> 15 timeouts at load average 28-31 with four lanes running gates;
  `bun test --timeout 30000` returned 12,773 pass, 0 fail on the same tree. A chained gate run
  returned exit 137 (killed) the same way. Run gates individually with a captured exit code.
- **Prose is not code.** Four times a sweep of mine reported my own explanatory comment, quoting
  the line it had replaced, as the defect. Strip comments before scanning.

## MID-FLIGHT WHEN THE CALL LANDED

Nothing half-applied. The RailCrew unit was the in-flight work and it is finished, gated and
pushed. `src/styles/shell.css` carried a stray trailing newline from CSS I had added and then
removed; reverted to HEAD, so the file is untouched by me.

---

# S4 handoff · the proving ground · 2026-08-28

**Read this before re-investigating anything.** As the proving ground my job this session was to
settle claims, so the most valuable thing here is the list of what is now **PROVED**, what is
**REFUTED**, and what is still **UNVERIFIED**. Do not re-litigate the first two. Do not trust the
third.

`lane/proof` is rebased onto `main` and pushed. **S0 does the integration merges — do not push to
`main` from a lane.**

---

## 1 · PROVED, and settled

| claim | evidence |
| --- | --- |
| **The gates could not see the code that proves the product works.** `tsconfig.json` includes `src/**` only; `e2e/` is absent and every `*.test.ts` excluded. | A `const x: number = "definitely not a number"` in a spec produced **zero** tsc errors. Fixed: `e2e/tsconfig.json` and a `tsc:e2e` gate, mutation-tested both ways. |
| **`bun test` does not run Playwright specs.** The only execution the harness gets is a lane running `check-motion.sh` by hand. | I broke a spec (`VIEWPORT.width` where `VIEWPORT` is undefined on most runs) and all four gates went green on a spec that could not start. |
| **The unit suite is unchecked: 797 files, 414 type errors.** | Measured with a tests config; 9 further errors were probe artifacts and are excluded. |
| **The detector for the commonest defect was run by nothing.** `check:unreachable` finds 141 of 656 server functions and 80 of 492 components with no importer — including all five orphans S3 found by hand. | `grep -c "check:unreachable" scripts/lane-gates.sh` returned **0**. Now a gated ratchet. |
| **The retired design system is still reachable through an alias.** 59 aliases in `styles.css` resolve to `--ds-*`; **46 files** use one and every one passes the existing ratchet. | Now a gated ratchet at 46. |
| **`track_drives` is written 323 times and read nowhere.** 277 sweep, **40 presses across 19 tracks**, 6 continuation. | The only `SELECT` in the repo is inside a test's documentation string. `driven_via` is the column the acceptance query needs, and no screen shows it. |
| **Two safety mechanisms are wired and never fed.** `mission_token_cap` NULL on all 2,847 runs — no default, no resolver, no caller. `ai_budgets` holds no cap on 10 of 14 rows. | The most expensive run used 233,988 tokens against no ceiling. |
| **The mission spend cap has never been tested.** `$10` cap, most ever spent on one run **$0.1420** — 1.42%, and not one run reached half. | Untested, not broken. |
| **`guardrail_hits` cannot be cited as evidence in either direction.** 7,225 of 8,535 are demo fixtures whose oldest and newest rows share a microsecond a month apart; the 1,310 "real" ones sit at 83 instants with up to 24 rows of a **single** rule at one microsecond. | 439 runs under live rules in 30 days wrote nothing. 83% of recent runs are in workspaces with no rules at all. |
| **113 of 324 boundary calls expired unanswered** — 35%. | Bears directly on R-18. |
| **No mounted control can rate a recall** (S3's finding, verified independently). `MessageMetaFooter` is exported and imported by nothing. | 77 ratings, last 23 July; `ignored` is the row **default**, 12,454 of them, still written yesterday. |
| **Contrast is viewport-independent.** Identical at 390, 768 and 1280 on every public surface. | So the baseline needs one set of numbers, not three. |
| **All 29 baseline surfaces have a contrast number, nothing unjudged.** 18 signed-in surfaces measured on a phone; 12 have nothing under the WCAG floor. | Ratchet armed and mutation-tested; only contrast fails a build. |
| **Nothing in the product scrolls sideways at 390.** | Reported only after the check was watched firing on an injected 900px element. |

## 2 · REFUTED — do not chase these again

- **"The guardrails went silent 33 days ago."** I drafted it. The silence is when somebody last ran a
  seed. Absence of hits is not absence of screening — `callModel` screens unless told not to.
- **"`--mrd-mute` is 0.07 short."** The token is fine. The cause is `--mrd-select`, a 17% white wash
  on the **selected** stage only. S0's 7.12 and my 4.43 were both right, describing different states.
- **"`spine_tracks.spend_cap_usd` is never fed."** `resolveTrackSpendCap` falls back to the workspace
  default ($5.00 on all 21) and then to a constant. A null column with a resolver is not a defect.
- **"`--mrd-fail-bright` / `--mrd-pass-bright` are orphans."** Both exist only inside a doc comment
  recording their removal. The engine room paints correctly.
- **"The `md` breakpoint leaves iPads without touch targets."** 767 and 768 measure identically. The
  failing controls are `<a>` styled as text, so `CONTROL_SHAPE` never applied at any width.
- **"The decay sweep is eating unrated memories."** `outcomeImportance` returns 3 or 4 against a prune
  floor of 2, deliberately, with the reasoning in the file.
- **"Editing a bash script mid-run corrupts its verdict."** Not reproducible at 4/8/16KB, spanning the
  real file's 12,178 bytes. The snapshot guard I wrote for it was withdrawn.

## 3 · UNVERIFIED — trust nothing here

- **The `1280` width of the brand-link fix.** Layout-neutral by construction and measured at 390; the
  rail selectors were not present in the desktop probe.
- **Everything measured on `lane/proof` before the rebase**, against S3's and S2's later fixes. The
  contrast and tap numbers in verdicts S4-131 to S4-152 predate them.
- **Whether `guardrail_hits` would record an organic screening event.** Needs a run under live rules
  with a deliberate violation. Nobody has done that.
- **Whether the 414 test-suite type errors hide broken assertions.** S3's sample of four files found
  two tests that did not test. If that rate holds it is a few dozen assertions not running — a much
  stronger argument for clearing it than "tsc should be clean".

## 4 · Left measured and unowned

`meridian/` and `shell/` have no live owner. Each of these is measured, not guessed, and not touched:

- **`Door`** — the retry control in every failure line, 56x21, inline in prose. Padding it changes the
  line box of every sentence it sits in. Needs a standalone variant, not a padding class.
- **`ReadFailed`** repeats the shell's session sentence and draws a second Sign-in door. The rule is
  already written in `AppFrame`: *"the shell says it once, above everything"*.
- **`track_drives` has no reader.** The fix is not a migration — the data is correct and already
  there. It is a surface that says who drove this work.

## 5 · The gate is now six

`tsc` · **`tsc:e2e`** · **`unreachable`** · **`aliases`** · `docs:check` · `test` · `build`

Two did not exist yesterday. `check:dead-writers` is deliberately **not** gated: whether a dead writer
is a defect needs a judgement per table, and a gate that fails on a judgement is one people route
around.

Every ratchet freezes today's debt and fails only on growth, and every one carries an anti-vacuity
guard: **a scan of nothing must never report clean.** That rule was earned three times tonight — a
`0 below AA of 0 judged`, a `0 errors` from a compiler that had died, and a `12,531 of 12,531` that
was counting a default.

## 6 · The habit worth keeping

**Four defects in my own instrument were found by trying to prove a fix, not by hunting a fault.** It
measured the box not the target; counted a click on the parent as a hit; could see the 44 bar but not
the 24 floor; and treated `null` from an off-viewport probe as a failure. Each returned a confident
wrong answer rather than no answer.

**A check nobody has watched fail is not a check.** Mutation-test with a real defect — a real orphan
file, a real bad annotation — rather than by editing the baseline. Editing the number proves the
arithmetic; the file proves the detector.
