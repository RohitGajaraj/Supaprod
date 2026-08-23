# STATUS — written by MAIN LANE only

LANE 1 reads this and never writes it. See [`README.md`](./README.md).

**Session opened:** 2026-08-23 · overnight run
**MAIN LANE:** Claude Code (database, deploys, Mobbin, verification)
**LANE 1:** opencode / OX Alpha (building)
**Last updated:** 2026-08-23 12:00 IST

## Where things stand

**LANE 1 pushed its first unit at 04:40 and it is verified.** See
[`U000`](./answers/U000-reading-notes-and-plan.md). Gates green on the merged tree, ratchet
correctly untouched, no fabrication, and its `harbor@` Playwright census checked out as real
observation. Three numbers in the plan are wrong and are corrected there.

**Superseded, kept for the record:** *LANE 1 has not pushed yet, and at 04:26 that is entirely normal.* The run opened at 03:38
and LANE 1's first order is a reading and planning pass across fourteen documents plus a
Playwright walk of the surfaces, which does not commit anything until the plan is written.
`requests/` and `units/` hold only their `.gitkeep`. Nothing here is escalation-worthy until
roughly 05:30, per the protocol's one-hour rule measured from a request rather than from
silence.

MAIN LANE has not idled waiting. Six findings are filed, and a listener is armed on
`origin/main` so LANE 1's first push is picked up within a minute.

Three findings are filed and none of them needs LANE 1 to undo anything, because there is
nothing built yet. Two of them change what it should build.

**Instruments checked and working**, so none of these is a surprise at 3am:

| Instrument | State |
| --- | --- |
| Lovable database MCP | live. `spine_tracks` returns 59 rows. Two transient `499 request_cancelled` on first call, then fine. Retry once before believing it is down. |
| Lovable project + deploy | project `371dd588` is `ready`, published at `supaprod.lovable.app`, `latest_commit_sha` = `2d6ed9b89` = local `main`. In sync. |
| Mobbin MCP | authenticated, returning screens. |
| Lovable deploy | **exercised end to end at 04:23 and verified live.** Returned `pending`, completed on one call, `status: ready`. See [`M06`](./answers/M06-the-deploy-path-is-proven-and-here-is-how.md). |
| `git` through the RTK hook | **piped `git` output is unreliable here.** `git show <sha>:<path> \| python3` returned empty; the same command redirected to a file returned all 24,745 bytes. Redirect to a file, then read the file. |

## THREE LANES NOW. THE OWNERSHIP SPLIT IS BY PATH.

LANE 0 joins from 2026-08-23 11:50, in `~/Projects/My Projects/My Builds/cadence-lane-0` on
branch `parallel/lane-0-fresh`, pushing with `git push origin HEAD:main`. Its prompt is
[`LANE-0-PROMPT.md`](./LANE-0-PROMPT.md).

| Lane | Owns | Worktree |
| --- | --- | --- |
| MAIN LANE | `src/styles/meridian.css`, `src/components/meridian/**` | `Supaprod` (main) |
| LANE 1 | `src/styles/**` except meridian.css, `src/components/shell/**`, `src/routes/**` | `cadence-lane-1` |
| **LANE 0** | **`src/components/**` except `meridian/` and `shell/`** | `cadence-lane-0` |

**LANE 0 prefixes its requests and units `L0-`** so the two lanes' counters cannot collide.

## WHY LANE 1 LOOKED STUCK, AND IT WAS NOT SLOWNESS

Diagnosed 11:41 after the founder reported it stalled. **It had been blocked for eight hours on
a request it never pushed.** `coordination/requests/001-meridian-gap-spacing-stops.md` sat
untracked in its worktree, written around 03:20, never committed, so no pull could show it to
anyone. It was found by listing that worktree directly rather than through the channel.

It was also **11 commits behind**, so the ruling it needed, which landed at `cc72ca439` at 09:53,
had never reached it. It was correctly holding 76 call sites the whole time.

Answered in [`001`](./answers/001-meridian-gap-spacing-stops.md): no new stops, all eight snap.
**Both lanes: push a request the moment you write it, and pull far more often than feels
necessary.** This is the exact failure the protocol's first paragraph was written about.

## OWNERSHIP CHANGE, 05:10 — MAIN LANE NOW HOLDS MERIDIAN ITSELF

**Founder instruction, this session.** MAIN LANE is no longer verification-only. It is fixing
the design system itself, and his reasoning is why this is urgent rather than parallel:

> "on lane 1, open code is building, and if it takes literally the meridian design system, then
> the entire system on the platform would be of this non-perfect design."

**LANE 1: do not edit these paths until STATUS.md says they are released.**

```
src/styles/meridian.css
src/components/meridian/**
```

**You keep everything else** — surfaces, routes, station work, the waves in your plan. Porting a
surface TO Meridian is still yours. Changing what Meridian IS, is mine, starting now.

**Why this does not stall you.** Waves 1 and 3 in your plan act on `styles.css`,
`primitives.css`, `ink.css` and the route files, none of which are on that list. If a port you
are doing needs a Meridian component changed, **file a `meridian-gap` request and keep moving**;
do not edit it yourself, because I am editing those files right now and two writers on one file
is how main broke on 2026-08-22.

**Founder-named defects being worked, confirmed on disk:**

1. `NeedsSetup` renders four text levels at 17 / 13-or-14 / 12.5 / 12px, the bottom two sharing
   one colour, so they are indistinguishable. Its body line carries **`text-[13px]` and
   `text-mrd-prose` (14px) on the same element**, so its size is decided by CSS order.
2. Agent-at-work wears saturated azure while `LoadingState` says the same thing achromatically.
   One fact, two treatments.
3. `AgentStatusIndicator` is the component `LoadingState` was written to replace and still ships:
   `animate-pulse` (a Tailwind default, not a Meridian motion token), hard-coded 12px and 10px,
   and no elapsed figure, which is the precise failure `LoadingState`'s docstring names.
4. Dialog's title was `text-[14px]` sitting above a 14px body. Weight was the only thing
   separating a dialog's title from its message.

**All four are fixed, plus the systemic cause behind them.** Landed in `0e267390b`,
`971645bf2`, `6521b2cf0`, each with gates green on the merged tree:

| measure, across the 47 Meridian components | before | after |
| --- | --- | --- |
| hard-coded `text-[Npx]` | 259 | **157** |
| elements declaring `font-size` twice | 57 | **0** |
| headings at or below body size | 9 of 16 | **0** |
| Tailwind default animations | 1 | **0** |

**The finding that explains the founder's complaint mechanically:** every `@utility text-mrd-*`
rule is emitted AFTER every arbitrary `text-[Npx]` rule, so on an element carrying both, the
utility wins and the typed size is thrown away. 35 deliberate sizes were never reaching the
screen; a 10.5px mono label, an 11px figure and a 12.5px control label all rendered at a flat
14px. That is hierarchy the authors wrote and the system deleted.

## A SECOND WRITER TOUCHED MAIN LANE'S FILES AT 04:28

Recorded because the protocol exists to prevent exactly this, and because LANE 1 should not
assume `answers/` has one author.

`9cca7ba18` committed `STATUS.md` and all six `M*` answer files. It is
**`Co-Authored-By: Claude Haiku 4.5`**, which is not this session, and it ran in **this same
checkout**. The content it committed was correct: those were MAIN LANE's own uncommitted edits
sitting in the working tree, which that session staged and pushed under its own message.

**No damage this time, and the mechanism is the dangerous part.** A second process staging
files in a shared checkout is how `main` broke on 2026-08-22: a commit staged by filename swept
up another lane's half-finished deletion. Here the edits happened to be complete. Had the
timing differed by thirty seconds, a half-applied `sed` across seven files would have shipped.

**What is confirmed alive**, checked by process rather than assumed:

| Process | PID | Started | Working directory |
| --- | --- | --- | --- |
| `opencode` (LANE 1) | 3303 | **03:46:05** | this repo |
| `claude` (MAIN LANE) | 4693 | 03:47:59 | this repo |

**LANE 1 is running and has been for 44 minutes.** It has pushed nothing because its first
order is a reading and planning pass that commits nothing until the plan is written. That is
the brief working as intended, not a stall.

## Answer files with no request: the `M<NN>` range

Proactive findings are written as `answers/M<NN>-<slug>.md`. They answer no request, so they
are kept out of the `<NNN>` range and can never collide with the answer to a request LANE 1
files. Read them like any other answer.

| File | What it says |
| --- | --- |
| [`M01`](./answers/M01-ratchet-header-total-is-stale.md) | The ratchet's headline total is stale by 6, and the guard is per-file, not a total. **Read before your first port.** |
| [`M02`](./answers/M02-the-loop-is-alive-and-blocked-on-evidence.md) | The loop is alive but no real track has ever passed Decide. 63.6% of signals are agent-authored with no source link, and the critic is correctly rejecting them. **Do not build a surface that shows a signal count as evidence strength.** |
| [`M03`](./answers/M03-migrations-verified-and-two-dead-artifacts.md) | All seven unrecorded migrations verified applied. Two artifacts describe themselves wrongly: the sink's restatement comment and `agent_runs.attempt`. **Trust the live database over any comment or count.** |
| [`M04`](./answers/M04-the-ratchet-cannot-see-the-founders-pain-point.md) | **The most useful file here.** The ratchet is blind to Tailwind type sizes, so it cannot see the founder's number one pain point. 480 hard-coded sizes exist and 457 of them re-type a step that already exists. Corrects three numbers in the brief. **Read before WAVE 1.** |
| [`M05`](./answers/M05-the-founders-test-run-against-the-live-site.md) | The founder's test measured on the deployed site. `/pricing` renders 107 pieces of text in 23 treatments; `/demo` manages 16 in 7 and is your reference. Carries the re-runnable measurement. |
| [`M06`](./answers/M06-the-deploy-path-is-proven-and-here-is-how.md) | Deploy exercised end to end on a docs-only change. `pending` is not a deployment, the published host redirects, and every live check needs a negative control. **Read before filing your first `deploy` request.** |
| [`M10`](./answers/M10-the-untiered-controls-are-yours-and-here-is-the-real-number.md) | **Corrects M07's 451 to 337.** A raw `<button>` inside Meridian is usually the primitive's own implementation and should not have been counted. The real gap is 337 on your surfaces, ranked by file. |
| [`M08`](./answers/M08-meridian-has-text-roles-now-use-them.md) | **READ BEFORE PORTING ANY SURFACE.** Meridian has five TEXT ROLES now: eyebrow, title, subtitle, copy, meta. Stop assembling size + weight + colour by hand. |
| [`U000`](./answers/U000-reading-notes-and-plan.md) | Verifies unit 000. Accepted. Corrects "14 steps" to **13**, "113 tokens" to **107**, and flags a route count with no query. |
| [`M07`](./answers/M07-tiered-buttons-already-exist-and-are-half-adopted.md) | **REFUTES ranked win #2.** Tiered buttons already exist: `ActionVariant = default \| primary \| quiet \| destructive`, plus `Approve` as its own component. **Do not build a `Button`.** The defect is that **451 of 954 controls bypass them**. |

## Open requests

None.

## FOR THE FOUNDER: the health signal is lying about the critic

Twelve hours: **42 runs `completed_with_failures`, 3 tool calls actually failed.** The status is
written on STEP failure, not tool failure, and it is covering two unrelated things.

**Strategist is genuinely burning budget**: failing runs sit at step 5.5 against 1.0 for its
successes, five times the tokens, roughly ten times the cost per run. That is the expensive one.

**The critic is not failing at all.** Its "failed" runs die at step 1.9 and its successes at 2.0
on the same tokens, and reading their output shows complete, correct verdicts: *"The halt
decision stands unchallenged and is correct... zero such evidence exists across all sources."*
It is 92% "failed" over twelve hours and it is the one component behaving correctly.

**The risk is that this reads correctly and sends someone to fix the critic**, and fixing the
critic means making it stop refusing, which lets the loop run on invented evidence at speed.
Full working in [`M11`](./answers/M11-the-health-signal-is-lying-about-the-one-agent-that-works.md).

## FOR THE FOUNDER: a decision that is now unblocked

`agent-first-reimagining-index.md` says the cold-start promotion flag "stays off everywhere
**until the sink can tell a restatement from a signal**."

**It can now.** The restatement fold shipped 2026-08-22 16:42Z; 654 of 656 duplicate signal rows
predate it and the hours since show zero new ones (`M02`). The flag is still `false` on all 21
workspaces. **The stated precondition is met and nothing has moved.** Re-enabling costs money
and changes loop behaviour, so it waits for you. Neither lane will act on it.

## Refuted claims LANE 1 must act on

Nothing refuted. Three numbers corrected in [`U000`](./answers/U000-reading-notes-and-plan.md),
all inside `agent-first-reimagining-plan.md`, none requiring a rebuild:

- **"each of the 14 steps"** -> there are **13**. `--mrd-t-body` was renamed to `--mrd-t-base` on
  2026-08-21. Matters because Wave 2's contract gives every step a row.
- **"Meridian's 113 tokens"** -> disk says **107**, or 167 with bridge aliases. The document says
  88 and is stale. 113 matches nothing.
- **"58 authenticated routes carry redirects or guards"** -> inside my range (49 narrow, 68 broad)
  but carries no query, so it cannot be re-checked.

**One claim refuted outright**, in [`M07`](./answers/M07-tiered-buttons-already-exist-and-are-half-adopted.md):

- **"the missing primitives: visibly-tiered buttons (founder-named defect)"** -> **not missing.**
  `ActionVariant` has carried `default | primary | quiet | destructive` since before this run, and
  `Approve` is a separate component for controls that unblock. **Building a `Button` would be the
  fifth button vocabulary in this repo and a regression.** The real defect is adoption: 451 of 954
  controls are hand-rolled `<button>` or retired `<Button>` and have no tier at all.

**Two claims MAIN LANE refuted against itself**, recorded so neither gets raised again:

- *"The `design` station has been starved for 34 hours."* False. All six tracks there are in
  sample workspaces and are excluded from the tick on purpose. Real open work is five tracks,
  all driven within the last 45 minutes.
- *"The de-duplication fold is broken, 656 duplicate signals."* False. 654 of the 656 predate
  the fold landing at 2026-08-22 16:42Z, and the five hours since show zero new duplicates.
  The fold works in production. The historical rows remain and still inflate cited counts.

## For MAIN LANE to fix once LANE 1 has pushed and gone quiet

Product code, so it waits on the protocol rather than racing LANE 1 for the file:

- `src/lib/sources/sink.server.ts:275` claims `restated_count` does not exist and the counter
  is inert. Both are false now; the column, the RPC and seven non-zero counts are live.
- `agent_runs.attempt` is set on 6 rows of 2,225 and nothing has written it in two days.
  Either it gets a writer or it should stop being offered to readers.
- 654 historical duplicate signal rows still inflate the counts agents cite. Folding them is
  irreversible, so it is a founder call, not mine.

## Gates, last run by MAIN LANE on the merged tree

At `2d6ed9b89`, each gate its own command, nothing piped.

| Gate | Result | When |
| --- | --- | --- |
| `bunx tsc --noEmit` | exit 0 | 2026-08-23 03:50 |
| `bun test` | 10,626 pass / 0 fail · 10,709 across 627 files · exit 0 | 2026-08-23 03:52 |
| `bun run docs:check` | exit 0 | 2026-08-23 04:32 |
| Meridian ratchet | **3,170** occurrences / 222 files | 2026-08-23 03:54 |
| Rival type-scale refs (second metric, see `M04`) | **873** across 171 files | 2026-08-23 04:14 |
| Controls bypassing the tiers, on surfaces (see `M10`) | **337** of 808 | 2026-08-23 11:30 |
| Live type treatments, `/pricing` (see `M05`) | 23 treatments / 107 text nodes | 2026-08-23 04:20 |
| Live type treatments, `/` landing | 27 treatments / 246 nodes / 16 raw `rgb()` | 2026-08-23 04:20 |
| Live type treatments, `/demo` **(the floor to beat)** | **7 treatments / 16 nodes** | 2026-08-23 04:20 |

**The ratchet needs a second number beside it.** It counts retired vocabulary and raw colour.
It does NOT count Tailwind type sizes, so it cannot move when the founder's number one
complaint is fixed, and a good night's work on hierarchy can read as flat. `M04` sets the
second metric at **873** and gives the one command that measures it.

**The ratchet is still the headline metric, and it must only ever go down.** Two corrections
to how it was stated when this file was opened, both detailed in
[`M01`](./answers/M01-ratchet-header-total-is-stale.md):

- **The number is 3,170, not 3,176.** The baseline's own `totalOccurrences` header says
  3,176 and disagrees with its own `files` block, which sums to 3,170. The header was left
  behind by a hand-edit in `f07d39c33`. The guard is unaffected and the header self-corrects
  the first time anyone runs `bun run design:ratchet`.
- **The guard is per-file and per-marker, not a total.** Debt cannot be traded between
  files: a change that drops 40 in one file and adds 3 in another fails, even though the
  total fell. And *reducing* debt turns the suite red on purpose until the baseline is
  re-frozen with `bun run design:ratchet` in the same commit as the port.
