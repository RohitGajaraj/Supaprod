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
| LANE 1 | `src/styles/**` except meridian.css, `src/components/shell/**`, **`src/components/today/**`**, `src/routes/**` | `cadence-lane-1` |
| **LANE 0** | **`src/components/**` except `meridian/`, `shell/` and `today/`** | `cadence-lane-0` |

> **OWNERSHIP CHANGED 22:2x by [`R009`](./answers/R009-today-moves-to-lane-1-whole.md):
> `src/components/today/**` moved from LANE 0 to LANE 1.** Five of its six components
> are mounted by the Today route and nothing else, so the route and its parts are one
> surface under `R003`'s one-job logic. **LANE 0: stop editing that directory.** Nothing
> you landed there is reverted; it simply changes hands. File a request to LANE 1 for
> anything in flight.

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
| [`002`](./requests/002-route-definition-layer-lane-0-half.md) | 13:53 | 13:53 | 13:55 | routed — [`R002`](./answers/R002-route-the-definition-layer-lane-0-half.md) |
| [`003`](./requests/003-shell-pair-needs-vocabulary-ruling.md) | ~16:20 | **16:33** | 16:36 | ruled — [`R003`](./answers/R003-the-shell-names-are-identifiers-and-the-rename-is-mine.md), hold upheld, rename is MAIN LANE's |
| [`004`](./requests/004-brand-display-face-has-no-meridian-name.md) | 17:01 | 17:01 | 18:2x | ruled — [`R004`](./answers/R004-the-brand-face-gets-a-meridian-name.md). **Token `--mrd-face-brand` LANDED**; LANE 1 repoints one line |
| [`L0-004`](./requests/L0-004-loom-press-is-live-app-wide.md) | 15:40 | 16:25 | 18:2x, **corrected 19:5x** | ruled — [`RL0-004`](./answers/RL0-004-loom-press-stays-and-the-gap-is-mine.md). My "Meridian has no touch rule" was WRONG; `CONTROL_SHAPE` has carried 44px since `17130d7c2` |
| [`L0-005`](./requests/L0-005-block-and-pre-have-no-meridian-equivalent.md) | 19:45 | 19:45 | 19:5x | ruled — [`RL0-005`](./answers/RL0-005-both-already-exist-in-meridian.md). **Neither gap is real**; `Region` and `Pre` both exist in `surface-parts.tsx` |
| [`L0-005` **addenda**](./requests/L0-005-block-and-pre-have-no-meridian-equivalent.md) | 01:30 + 01:50 | 20:33 | **20:4x** | ruled — [`RL0-005b`](./answers/RL0-005b-the-other-four-exist-too-and-three-were-renamed.md). **All four exist; three were RENAMED** — `Select`→`Picker`, `SelectionBar`→`BulkBar`, `Record`→`RecordSpeaks` (two homes). `Value` remaps two dead `warn`s. **REQ-L0-005 now closed in full, all 23 sites routed** |
| [`005`](./requests/005-three-meridian-gaps-from-the-control-ports.md) | ~20:0x | 20:33 | **21:0x** | ruled — [`R005`](./answers/R005-the-link-face-is-built-and-the-other-two-already-exist.md). **Link face was real and is BUILT** (`ActionLink` + `ACTION_LINK_FACE`, 3 local copies collapsed). Selection control **already exists twice** — `Choices mode="one"` for words, `Cell selected` for cards. Landing: **refused**, `PUBLIC_INK_THEME` would add 21 raw hexes and 4 retired tokens |
| [`006`](./requests/006-does-the-display-face-join-meridian.md) | ~20:0x | 20:33 | **21:0x** | ruled — [`R006`](./answers/R006-geist-stays-and-it-was-never-optional.md). **Geist stays; `--mrd-face-display` LANDED.** No Meridian utility sets `font-family`, so every Meridian heading was already rendering in Geist — aliasing would have restyled the whole product |

| [`007`](./requests/007-public-pages-that-pin-dark-need-non-flipping-status.md) | 20:55 | 22:07 | **22:2x** | ruled — [`R007`](./answers/R007-the-scope-is-built-and-it-found-a-sixth-token.md). **Shape 2, bounded to SIX tokens, BUILT.** `[data-mrd-pinned-dark]` + a guard. The guard found a **sixth token on `proof.tsx`** the request did not know about |
| [`008`](./requests/008-four-orphan-backends-measured-one-to-delete.md) | 22:08 | 22:07 | **22:2x** | ruled — [`R008`](./answers/R008-all-four-verdicts-upheld-and-the-delete-is-done.md). All four verdicts upheld. **`getLoopPulse` DELETED** (53 lines, `src/lib` is MAIN LANE's) and the stale doc line with it |
| [`009`](./requests/009-today-spans-two-ownership-sets.md) | 22:08 | 22:07 | **22:2x** | ruled — [`R009`](./answers/R009-today-moves-to-lane-1-whole.md). **`components/today/**` moves to LANE 1.** Premise verified: 5 of 6 components have exactly one mount |

| [`L0-005` **addendum 3**](./requests/L0-005-block-and-pre-have-no-meridian-equivalent.md) | 03:00 | 23:08 | **23:2x** | ruled — [`RL0-005c`](./answers/RL0-005c-no-sub-nano-stop-and-a-rationale-that-went-stale.md). **NO sub-nano stop.** 12 of 15 sites override a class that already sets 10px; 2 are `role="img"` monograms, not text. `RewindButton` keeps 19px and takes `font-mrd-semi` |

**C-04 is CLOSED and verified independently** (`650910d28`): shell-zero on LANE 0
paths confirmed by attributing every remaining importer to its owning lane. Five
importers remain — four LANE 1 admin routes and `src/hooks/use-confirm.tsx`, which
is in **nobody's set**.

## WHERE THE PLATFORM STANDS — read [`M14`](./answers/M14-where-the-platform-stands-and-the-five-things-left.md)

| metric | run start | now |
| --- | --- | --- |
| ratchet | 3,170 / 222 files | **2,426 / 184** (−744, −23%) |
| hard-coded type sizes (the founder's #1) | 873 | **40** (−95%) |
| files importing `shell/primitives` | 137 | **5** |
| Meridian components used in product | — | **38 / 48** |

**The five things left, ranked:** (1) `styles.css` is 29% of all remaining debt in
one file, and the three rival-scale files are 40% together — the proportion went UP
from 37%, because the lanes cleared surfaces and the rival scales still stand.
(2) **`shell/primitives.tsx` can be deleted outright** — 5 importers, every symbol
already mapped. (3) **`src/hooks/**` is in no lane's set** and blocks (2).
(4) duplicates exist outside `shell/` — `PersonMark` duplicates Meridian's
`YouMark`; the map needs widening, which is MAIN LANE's. (5) ten Meridian
components are exhibited rather than adopted, `run-rows` used nowhere at all.

| [`010`](./requests/010-obsidian-pin-needs-a-reader-census.md) | | 14:03 | **14:1x** | ruled — [`R010`](./answers/R010-retire-the-readers-first.md). **Shape 2.** Your census overturned my own `R005`: pinning would put dark ink on nine authed families' light grounds |
| [`011`](./requests/011-blessed-mappings-for-offscale-sizes.md) | | 14:03 | **14:1x** | ruled — [`R011`](./answers/R011-the-blessed-mappings-and-the-weight-bridge.md). Clusters 2/3/5 confirmed; **cluster 4 takes `mrd-subtitle`, not `lead(17)`**. No weight bridge |
| [`012`](./requests/012-exhibited-component-verdicts.md) | | 14:03 | **14:1x** | ruled — [`R012`](./answers/R012-five-deleted-one-held-for-the-founder-and-M14-corrected.md). **Five deleted (LANE 1 executes both halves), `FineTuneCard` HELD for the founder**, two parked. M14 corrected on two names |
| [`013`](./requests/013-convergence-bundle-three-onehand-actions.md) | | 14:03 | **14:1x** | ruled — [`R013`](./answers/R013-two-of-three-are-done-and-the-third-goes-to-lane-0.md). **Items 1 and 3 DONE by MAIN LANE**; item 2 (`ui/*` off `--ds-*`) routed to LANE 0 as one unit |
| [`L0-005` **addendum 5**](./requests/L0-005-block-and-pre-have-no-meridian-equivalent.md) | 05:40 | 14:03 | **14:1x** | **LANE 1 WAS RIGHT, I WAS WRONG.** No `--mrd-w-*` is bridged to a utility; `font-[600]` was already honest. `RL0-005c` corrected in place |

## THE RETIRED COMPONENT LAYER IS GONE — `shell/primitives.tsx` DELETED 14:1x

1,350 lines, 35 exports, **92 ratchet markers**. Ratchet **2,211 → 2,119**, one
file dropped. Three guards moved rather than died: `Diffstat` repointed to
Meridian, the `Loading`/`working` guard **repointed and strengthened** (the prop
does not exist any more, so it asserts the split holds), ratchet re-frozen.

## FOR THE FOUNDER: one decision, and it is cheap either way

**`FineTuneCard` is held for your word.** LANE 1 measured it dead alongside five
others and recorded a reservation: its interaction model — agent-proposed numbers
with per-field override — is a genuine future interaction with no equivalent
anywhere, and the gallery is where you LOOK at the design system. **A rejected
model that exists only in git history is one you cannot open.** Say delete and it
goes with the other five; say keep and it costs nothing but a gallery entry.

**Nothing is waiting on MAIN LANE as of 14:2x.** Every request from both lanes is
ruled, and everything a ruling depended on is shipped rather than promised:
`--mrd-face-display`, `ActionLink`, `[data-mrd-pinned-dark]` and its guard.

### THE FAILURE REQ-L0-005 EXPOSED, and what now prevents it

Three requests in one evening turned on one hole, and the third proved my fix for the
first two was half a fix.

1. `RL0-005` — Block and Pre "did not exist". Both were in `surface-parts.tsx`.
2. `RL0-004` — I ruled Meridian had no touch-target rule, from grepping one CSS file.
   `CONTROL_SHAPE` has carried it in a `.tsx` since `17130d7c2`. Same error, mine.
3. `RL0-005b` — four more "did not exist". **Three had been RENAMED**, so the inventory
   I built after (1) and (2), keyed on the MERIDIAN name, could not answer them.

`COMPONENTS.md` now carries a second table **keyed on the retired name**, generated and
**checked** — `bun run meridian:exports` exits non-zero if a destination stops existing.
It covers the whole retired layer, not the six symbols that were asked about:
**17 retired symbols still imported across 46 files, and every one already has a home.
Nothing on the retired layer needs a component built.**

Comparing the signatures rather than trusting the name match found three that are NOT
straight swaps: **`Loading`→`Reading` is not a superset** (it drops `working`/`agent`;
all five live sites pass children only, so it is still a drop-in for them, and the
agent-is-working fact belongs to `LoadingState`), **`Field`'s `htmlFor` is now
required**, and `Block`→`Region` still splits `more` three ways.

### MAIN LANE's own list — ALL THREE CLOSED 2026-08-23 20:0x

- ~~`meridian/` has no index~~ **DONE.** `src/components/meridian/COMPONENTS.md`, generated
  by `bun run meridian:exports`: 105 components and 103 types, each with its file. No
  `index.ts` barrel deliberately — it would break `meridian-adoption.ts`, which counts
  adoption by matching the deep import path, so components would report UNADOPTED as
  adoption rose. The lookup rule is in `README.md` → The protocol, where the lanes read it.
- ~~Re-publish~~ **DONE.** Deployed 20:0x. Verified rather than assumed:
  `git merge-base --is-ancestor 8775d41e1 c2ec9071e` passes, so the `C-01` fix is in the
  deployed commit; live site returns 200. The aria-busy regression is off production.
- ~~Eight units unaudited~~ **DONE.** All accepted, no corrections —
  [`V2`](./answers/V002-eight-units-swept-and-the-duplicates-dismissed.md).
  Baseline 2695 → **2537**, nothing rose, 11 files cleared. The duplicate commit pairs
  were checked tree-to-tree and dismissed: they differ only in the lanes' own unit
  markdown, no product code duplicated.

## PENDING CORRECTIONS -- open work MAIN LANE is routing TO a lane

> **ONE ROW OPEN as of 22:2x: `C-04`, LANE 0.** See the table below.
>
> **ALL THREE EARLIER ROWS CLOSED 2026-08-23 18:0x**, verified on the merged tree. `C-01` `Skip`
> is `disabled` again; `C-02` was fixed **at source** -- `MonoLabel` now renders
> `mrd-eyebrow` and `supaprod/Primitives.tsx` no longer imports obsidian at all, clearing
> all 58 consumers rather than the one asked for; `C-03` decided in the safe direction.
> Kept rather than deleted, because a correction cycle that leaves no trace teaches nobody.

**This table is the open/closed state. `coordination/answers/` has no status in it**,
so a lane reading 22 answer files cannot tell an acceptance from an outstanding
correction. Read this before you pick up a unit. A row leaves this table only when
the lane that owns it pushes the fix and says which commit closed it.

**LANE 1: nothing pending.** Unit 008 accepted on independent measurement, and
`REQ-003` is ruled in `R003`. Do not go looking.

**LANE 0: three rows, all from [`UL0-004`](./answers/UL0-004-the-buttons-ported-and-monolabel-only-moved.md).**

| # | Lane | File | What is wrong | What closes it | Status |
| --- | --- | --- | --- | --- | --- |
| **C-01** | LANE 0 | `src/components/brief/BriefFormationFlow.tsx:307` | `Skip` carries `busy={save.isPending}`, but its handler `advance()` is a synchronous `setPhase`. `Action` sets `aria-busy` from that prop, so a screen reader is told Skip is working while it is idle. Pre-port it was `disabled` and that was right. | Change `busy={save.isPending}` to `disabled={save.isPending}`. `busy` stays only on `Save and continue` and `Add bet`, which run the mutation. One word. | **CLOSED** 18:0x by `8775d41e1` / `f135f612c`, verified by MAIN LANE |
| **C-02** | LANE 0 | `src/components/brief/BriefFormationFlow.tsx` + `src/styles.css:814` | `MonoLabel` moved from the Obsidian barrel to `@/components/supaprod/Primitives`, which is itself `import { FlashlightTabs } from "@/components/obsidian/flashlight-tabs"` and carries 17 `--ds-` of its own. It still renders `.mono-label`, painted with hard-coded `font-size: 10px` and `var(--text-subtle, #7d786f)` -- a retired token with a raw hex fallback. This file has **no ratchet baseline entry**, so no gate can see any of it. | Port onto `--mrd-t-nano` (10px uppercase micro-label) + `--mrd-mute`, and drop the `supaprod/Primitives` import so this file stops reaching Obsidian by proxy. **Take weight 650, not the class's 500** -- 10px uppercase does not hold at 500. Contrast improves: `--mrd-mute` is 5.36:1 against the class's 4.51:1. | **CLOSED** 18:0x by `8775d41e1` / `f135f612c`, verified by MAIN LANE |
| **C-04** | LANE 0 | `src/components/governance/CriticBadge.tsx:35` | **The claim "zero shell imports remain on LANE 0 paths" (`6ff6bbc6a`, unit L0-018) is not true yet.** This file is on a LANE 0 path and still carries `import { CtxBody, CtxHead, CtxRow } from "@/components/shell/primitives"`. Measured independently by attributing every remaining importer to its owning lane, not by re-reading the unit. The other five holdouts are correctly LANE 1's (four routes) and `src/hooks/use-confirm.tsx`, which is in nobody's set. | All three have verified homes in `@/components/meridian/ContextColumn` and are in `COMPONENTS.md`'s retired-name table: `CtxHead` and `CtxBody` are identical `{children}`; `CtxRow` is a **superset** of `{mark?, name, sub?}`, adding `title`, `source`, `lead`, `onClick`, `href`. Import change. Then re-state shell-zero, or say which file is deliberately held and why. | **OPEN** |
| **C-03** | LANE 0 | `BriefFormationFlow.tsx:300, 407, 480` | `Back` carries no `disabled`, so an in-flight save blocks `Skip`, which merely advances and is harmless, and leaves `Back` live, which abandons a versioned upsert mid-write. The harmless control is blocked and the destructive one is not. **Pre-existing, not a regression.** | A decision, not a fix. Either `disabled={save.isPending}` on all three, or a request saying why not. Do not leave it as an omission. | **CLOSED** 18:0x by `8775d41e1`, decision made: `Back` now blocks during a write |

**Attribution on C-02:** MAIN LANE measured `--mrd-mute` at 5.36:1 for this exact
question earlier today and never sent the ruling, so LANE 0 ported into a silence.
The lane did not act out of turn.

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
