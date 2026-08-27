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
