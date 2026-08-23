# STATUS — written by MAIN LANE only

LANE 1 reads this and never writes it. See [`README.md`](./README.md).

**Session opened:** 2026-08-23 · overnight run
**MAIN LANE:** Claude Code (database, deploys, Mobbin, verification)
**LANE 1:** opencode / OX Alpha (building)
**Last updated:** 2026-08-23 14:45 IST

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
branch `parallel/lane-0-fresh`, pushing with `git push origin HEAD:main`. Each lane now has its own paste-ready prompt file, so nothing has to be extracted from a longer
document:

| Paste | Into |
| --- | --- |
| [`PROMPT-main-lane.md`](./PROMPT-main-lane.md) | Claude Code |
| [`PROMPT-lane-1.md`](./PROMPT-lane-1.md) | the LANE 1 opencode session |
| [`PROMPT-lane-0.md`](./PROMPT-lane-0.md) | a second opencode session |

`README.md` remains the shared protocol the three point back at.

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

**RECOVERED 12:33.** LANE 1 pushed `e9ce0fb25` — the request file itself, committed at last.
That is its first push since 09:26 and it confirms the session is alive rather than hung. The
answer it needs has been sitting in [`001`](./answers/001-meridian-gap-spacing-stops.md) since
11:43, so **LANE 1's very next action is `git pull --rebase origin main`**; the ruling is
already written and it is still holding 76 call sites it no longer needs to hold.

Worth naming, because it changes how a quiet lane should be read: the request landing on `main`
is not the question being asked, it is the question finally becoming *visible*. It was asked at
03:20. Nine hours of that gap was a file sitting on a disk nobody was looking at. Liveness was
never the problem and a liveness check would never have found it.

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
| [`UL0-002`](./answers/UL0-002-accepted-and-do-not-delete-loom-press.md) | **LANE 0 accepted, and a RULING it must read.** `loom-press` is LIVE, not inert: `data-obsidian` is on `<html>` for the whole authenticated tree and the class carries a 44px WCAG AAA touch minimum. **Do not delete it.** Also: Meridian's own controls were 32px, so every port was shrinking a tap target. Fixed. |
| [`R002`](./answers/R002-route-the-definition-layer-lane-0-half.md) | **ROUTED to LANE 0.** Census re-measured and exact: 114 ds-uses, 43 ember readers, 27 material classes, all on LANE 0 paths, zero on LANE 1's consumer surfaces. Unlocks ~380 markers, the largest Wave 1 win left. |
| [`U003`](./answers/U003-ink-css-verified-and-the-guard-got-stronger.md) | LANE 1 unit 003 accepted. 44 tokens deleted, zero live `var()` reads. Its guard change is **strictly stronger**, not weakened. |
| [`002`](./answers/002-styles-css-verified-and-your-open-question-answered.md) | **LANE 1's unit 002 ACCEPTED.** Deletion of 12 dead classes independently confirmed safe, ratchet down 9 with no count risen, ember alias checked against the founder's brand ruling and it holds. Its open question is answered: ember and you **cannot** diverge. |
| [`M13`](./answers/M13-leading-snug-is-not-meridians-snug.md) | **BOTH LANES, BEFORE YOUR NEXT PORT.** `leading-snug` is Tailwind's 1.375, not Meridian's 1.5, and `leading-tight` is 1.25 not 1.15. **138 bare Tailwind leadings sit in your directories** and are in no guard. Convert as you port, same commit. |
| [`M12`](./answers/M12-the-retrieval-index-can-return-one-row.md) | **`match_rag_chunks` can return at most ONE row, database-wide.** 16 of 17 `rag_chunks` have a NULL embedding and the reader excludes those; nothing written since 2026-08-09. Also corrects two columns that lie about loop health. **Neither lane's job — do not stop porting for it.** |
| [`M08`](./answers/M08-meridian-has-text-roles-now-use-them.md) | **READ BEFORE PORTING ANY SURFACE.** Meridian has five TEXT ROLES now: eyebrow, title, subtitle, copy, meta. Stop assembling size + weight + colour by hand. |
| [`U000`](./answers/U000-reading-notes-and-plan.md) | Verifies unit 000. Accepted. Corrects "14 steps" to **13**, "113 tokens" to **107**, and flags a route count with no query. |
| [`M07`](./answers/M07-tiered-buttons-already-exist-and-are-half-adopted.md) | **REFUTES ranked win #2.** Tiered buttons already exist: `ActionVariant = default \| primary \| quiet \| destructive`, plus `Approve` as its own component. **Do not build a `Button`.** The defect is that **451 of 954 controls bypass them**. |

## MERIDIAN, 13:30 — THE LEADING FAMILY THAT WAS DOCUMENTED AND NEVER BUILT

`meridian.css` has told authors since before this run that
*"`text-mrd-base leading-mrd-body` composes and neither surprises the other"*. **No
`leading-mrd-*` utility had ever existed**, and `--mrd-lh-body` is not in the family either, which
is tight / snug / prose / mono. An author who read the rule and obeyed it emitted no rule at all
and silently inherited the parent's leading.

**The reason it had to exist is a name collision that was costing air.** Tailwind's `leading-snug`
is **1.375**; Meridian's `--mrd-lh-snug` is **1.5**. Tailwind's `leading-tight` is **1.25**;
Meridian's is **1.15**. Six components sat on the first and four on the second, all reading as
though they were on scale.

**The snug half is the founder's complaint with a number on it.** `--mrd-lh-snug` carries its own
reason: *"was 1.4; the reference's air lives here"*. It was raised deliberately to stop rows
reading as stuck together, and those six components were rendering at **1.375, tighter than the
1.4 that ruling replaced**. They had gone backwards past the starting point.

| what landed | commit |
| --- | --- |
| `leading-mrd-tight / snug / prose / mono` built, stale comment corrected | `b7d2c4021` |
| 31 sites moved onto the scale, 6 hand-written literals snapped to their token | `b7d2c4021` |
| A guard that resolves each class through `meridian.css` to its number, proven by injection | `b7d2c4021` |
| `Line`'s wrapped `sub` stops inheriting a leading measured for the row's box | `45af3ef12` |

**Three leadings stay off scale on purpose**, each listed in the guard with its reason.
`leading-[1.4]` on `Line`'s container is measured (46.9px down to 40.9px) and is **not to be
rounded**. `leading-[18px]` keeps a textarea's caret on its text. `leading-none` has one caller and
does not earn a token, under the same second-caller rule that answered `REQ-001`.

Gates on the merged tree: `tsc` 0 · **10,637 pass / 0 fail** · `lint` 0 · `docs:check` 0 · ratchet
untouched at 2,868 (none of this is a retired marker, so the ratchet is correctly blind to it,
which is the same blindness [`M04`](./answers/M04-the-ratchet-cannot-see-the-founders-pain-point.md)
recorded).

## LANE 1'S UNIT 002 IS VERIFIED AND ACCEPTED, 14:05

`ba0dbecec` deleted ~150 lines of dead paint from `src/styles.css` and aliased every `--ember`
definition to Meridian's `--mrd-you`. Checked on the merged tree, against reality:

| what the unit claimed | what I measured |
| --- | --- |
| 12 classes have zero consumers | **confirmed**, 0 live across 1,138 non-test files, plus no dynamic construction |
| ratchet 2,868 to 2,859 | **confirmed**, and no count anywhere rose |
| ember is value-identical to you | **confirmed, and more thorough than claimed**: all FOUR definitions aliased, no literal left |
| gates green | **confirmed on the merge**: `tsc` 0, 10,637 pass / 0 fail, `docs:check` 0 |

**The founder's brand ruling was the one that needed checking rather than accepting**, since
aliasing `--ember` to the interaction hue sounds like brand and accent sharing a token. It holds:
`--brand-mark-ember` and `--brand-mark-gold` are theme-invariant literals declared once, no mark
token reads `--ember`, and the file carries its own instruction not to couple them.

**A scan of mine said fifteen classes were still referenced and it was wrong**, six of them in
`.tsx`. Every hit was inside a comment describing that surface's own history. Recorded in the
answer because a token match cannot tell a class attribute from a sentence about a class, and the
next person to verify a deletion here will reach for exactly that scan.

## DEPLOY LANDED AND IS VERIFIED LIVE, 14:02

The Meridian leading work is on `supaprod.ai`, confirmed with three controls rather than one:
`leading-mrd-snug` present, `leading-[1.625]` gone, and a control string proving the fetch and
search work at all.

**It took two deploy calls and the first one reported success while serving stale assets.**
`latest_commit_sha` matched my commit AND the call returned `ready`, and the bundle being served
was still older than that commit. So the rule in [`M06`](./answers/M06-the-deploy-path-is-proven-and-here-is-how.md)
needs strengthening: *matching the sha and reading `ready` are both necessary and neither is
sufficient.* The only test that settled it was a string that had to **disappear**, anchored to a
commit with `git grep` rather than to memory. An "is the new thing there?" check cannot tell a
stale deploy from a broken change, and it reads as the latter, which is how a correct change gets
reverted.

**Measured on the live bundle, before and after:**

| | before | after |
| --- | --- | --- |
| distinct `.leading-*` rules shipped | 24 | 25 |
| of those, resolving through a Meridian token | **0** | **4** |
| arbitrary ratio values | 16 | 13 |

The rule count went UP by one, and that is the honest number: four named rules arrived while three
arbitrary values died. What changed is not the count but that four of them now resolve through the
scale. The remaining 13 arbitrary values are the **138 sites on the lanes' paths**, and they do not
move until the lanes move them. See [`M13`](./answers/M13-leading-snug-is-not-meridians-snug.md).

## THE RATCHET IS FALLING, AND ALL THREE LANES ARE PRODUCING

```
2868  start of day
 -9   LANE 1 unit 002    styles.css dead rules + ember alias
-10   LANE 0 unit L0-002 MissionOrchestratorDetail onto Meridian tiers
-49   LANE 1 unit 003    ink.css collapses onto Meridian
====
2800  merged tree, 219 files
```

Gates on the merged tree with all three lanes in it: `tsc` **0** · `bun test` **10,643 pass /
0 fail** across 630 files · `docs:check` **0**.

## A DEFECT IN MERIDIAN THAT ONLY A LANE'S CORRECT WORK COULD EXPOSE

`CONTROL_SHAPE` was `inline-flex h-8`, a fixed **32px with no mobile branch**, so every tiered
control was a 32px tap target on a phone. The retired `.loom-press` gives native buttons **44px**
under 768px, the WCAG 2.1 AAA target size, and it is still live because `data-obsidian` sits on
`<html>` for the whole authenticated tree.

**So moving a control onto Meridian's tiers was shrinking its tap target** — and both lanes are
doing that right now on MAIN LANE's own instruction (M07, M10). LANE 0 moved nine controls that
way in one file, correctly, against a design system that was wrong underneath them.

Meridian had already argued the case against itself: it defends the decision bar's 44px in its own
words, *"44px is the smallest square a finger reliably hits"*. Rows got the floor. **The things a
finger lands on did not.** Fixed in `17130d7c2`, desktop untouched, guarded and proven by
injection.

This is the founder's instruction working exactly as he framed it: a flaw in the system becomes
platform-wide the moment lanes port onto it faithfully.

## Open requests

**None outstanding.** `REQ-001` arrived on `main` at 12:33 having been written at 03:20, and was
already answered at 11:43 once its worktree was read directly. Nothing is waiting on MAIN LANE.

| Request | Raised | Landed on main | Answered | Verdict |
| --- | --- | --- | --- | --- |
| [`001`](./requests/001-meridian-gap-spacing-stops.md) | 03:20 | **12:33** | 11:43 | ruled — no new stops, all eight snap |

## FOR THE FOUNDER: the retrieval index holds one usable row

Measured 12:52 today through the Lovable MCP. `rag_chunks` is the corpus the brain layer reaches
when it needs something that was written down. It holds **17 rows, of which one is retrievable**;
the other 16 carry a NULL embedding and `match_rag_chunks` excludes those by design. Nothing has
been written to it since **2026-08-09**, and no `prd`, `doc`, `note`, `signal` or `meeting` chunk
has ever existed in it — every row is a `finding`.

**This is not a leak and not a fire.** Live loop spend is about $0.94 over fourteen hours. Nothing
is burning and nothing throws; retrieval just comes back nearly empty and every caller degrades
quietly, which is why two weeks passed without it surfacing.

**It matters because it sits beside the evidence question rather than inside it.** M02 found the
critic correctly refusing to pass Decide because 902 of 1,418 signals are agent-authored with no
source link. M12 is a second, independent reason evidence cannot be assembled: the index that
would supply it has one usable row. **Answering the signal-linking question alone would not give
the critic more to read.** Both need to move.

The strongest single piece of evidence is an old comment being still true: `discovery.functions.ts`
recorded "16 rows and every one is source_kind 'finding'" on 2026-08-06. It reads 17 today. The
corpus indexer has never once succeeded in seventeen days, and it is currently being killed before
it can report on roughly seven of every eight runs.

Full working, every query re-runnable, in
[`M12`](./answers/M12-the-retrieval-index-can-return-one-row.md).

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

- ~~`src/lib/sources/sink.server.ts:275` claims `restated_count` does not exist and the counter
  is inert.~~ **FIXED 2026-08-23 16:4x, main lane.** Both claims were false and the comment now
  carries the query that proves it. Re-verified against production before editing: `column_exists`
  1, `rpc_exists` 1, `rows_nonzero` **30** (max 10, of 1,435 signals). **The "seven non-zero
  counts" written here was stale** - it is 30, and the SQL is in the file so the next reader
  re-runs it rather than trusting a sentence.
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
