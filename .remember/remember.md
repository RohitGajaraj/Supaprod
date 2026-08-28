# S4 · the proving ground · handed off 2026-08-28

`lane/proof` rebased onto `main` and pushed. **S0 does the integration merges. Do not push to `main`
from a lane.** Full detail, including every claim proved, refuted and unverified:
[`docs/operations/session-handoff.md`](../docs/operations/session-handoff.md).

## The one thing to read first

**The gates could not see the code that proves the product works.** `tsconfig.json` includes `src/**`
only — `e2e/` is absent and every `*.test.ts` is excluded — and `bun test` does not run Playwright
specs. I proved it by breaking a spec and watching all four gates go green on a spec that could not
start, then by putting `const x: number = "definitely not a number"` in it and getting **zero** tsc
errors.

Fixed with `e2e/tsconfig.json` and a `tsc:e2e` gate. **The unit suite is still unchecked: 797 files,
414 type errors.** Not gated, because failing every lane on debt none of them wrote is how a check
gets reverted rather than fixed.

## The gate is now six

`tsc` · **`tsc:e2e`** · **`unreachable`** · **`aliases`** · `docs:check` · `test` · `build`

`unreachable` and `aliases` are new, and both were detectors **this lane had already written and
nothing ran**. `check:unreachable` finds 141 of 656 server functions and 80 of 492 components with no
importer — including all five orphans S3 found by hand. It printed them and exited 0.

Every ratchet freezes today's debt, fails only on growth, and carries an anti-vacuity guard.

## Three rules this session paid for

1. **A scan of nothing must never report clean.** Earned three times: `0 below AA of 0 judged`,
   `0 errors` from a compiler that had died, and `12,531 of 12,531` recalls "rated" — which was
   counting a column default.
2. **A number that is suspiciously total is the same smell as one that is suspiciously round.** Both
   mean the thing being counted is not the thing you think.
3. **Mutation-test with a real defect, not an edited baseline.** A real orphan file proves the
   detector; changing the frozen number only proves the arithmetic.

## Do not re-investigate

The guardrails did **not** go silent 33 days ago — that is when a seed last ran. `--mrd-mute` is
**not** short; the cause was a 17% wash on the selected stage. `spine_tracks.spend_cap_usd` is **fed**
by a resolver. The `md` breakpoint is **not** why tablets fail tap targets. Editing a bash script
mid-run does **not** corrupt its verdict. Full list with evidence in the handoff.

## Left measured and unowned

`meridian/` and `shell/` have no live owner. `Door` (the retry in every failure line, 56x21, inline in
prose), `ReadFailed` (repeats the shell's session sentence and draws a second door), and
**`track_drives` — 323 rows recording every station drive, including 40 human presses, written and
read by nothing.** That last one is the founder's own test failing: the work agents do, recorded
faithfully and never shown.

## Habit worth keeping

**Four defects in my own instrument were found by trying to prove a fix, not by hunting a fault.**
Each returned a confident wrong answer rather than no answer. Verify the thing you just built by
looking for the message you expect and noticing when it does not appear.

---

> **Below this line: the other lanes' handoffs from the same night, preserved intact.**
> This file is written by every session at close, so a merge here is two lanes reporting, not a
> disagreement. Nothing was dropped to resolve it.

# S3 (platform lane), night of 2026-08-27 into 08-28

Lane `lane/platform`, head after handoff commit. 32 build units U-111 to U-141, all pushed, all
gated, fast-forwarded into `main` at the founder's direct instruction.

## Read this before you touch a governance surface

`getBoundary` buckets tools by what they RUN AS, not what they are set to. It composes seed → arc
dial → safety floors through `resolveToolMode`, the same path the loop takes. 96 of 97 `agent_tools`
rows run as `auto`. If you change the bucketing, the screen starts lying about what needs asking.

`BoundaryControls.tsx` renders `AutomationBoundary` OUTSIDE the `!data` guard on purpose, with the
reason written at the line. It must survive a failed boundary read. I moved it inside once (U-119)
and put it back.

## The class to keep hunting

Unreachable finished work — a capability wired end to end with no way in. Seven found in one night.
It typechecks, it lints, it builds, its tests pass, and no gate sees it. S4 gated it as
`bun run check:unreachable`, but that detector does not follow `React.lazy(() => import(…))`, so its
80 is an upper bound. Grep for the component name before mounting anything off that list.

## Three open, each one small, each needs an owner who was offline

1. `Door` is 56x21 inline in prose (`src/components/meridian/`). The remedy already exists: the
   centred `::after` overlay in `src/styles/public-legibility.css`.
2. `ReadFailed` repeats the shell's session sentence and adds a second door. `AppFrame` states the
   rule: the shell says it once, above everything.
3. Nothing mounts a recall-rating control. `MessageMetaFooter` and `submitFeedback` both work; the
   surface that would carry "did this help" is S1's.

## Two habits that cost me time

`bunx tsc … | head` reports exit 0 because the pipe swallows the status. Capture exit codes.
A busy :8080 is SOMEBODY ELSE'S. I killed S4's harness three times before I learned to check the
process owner instead of the port.

Full detail: `docs/operations/session-handoff.md`, top section.
---

# S4 handoff, 2026-08-27 ~04:00 UTC

**FIRST DECISION OF THE MORNING: nothing fixed last night is live.** Production deploys from `main`
and all four lanes sit 9 to 16 commits ahead. Every fix is inert until a merge, and that merge is the
founder's call. S0 declined to take it unilaterally.

## Measured 2026-08-27 08:37 UTC, both forms

| | |
| --- | --- |
| plain form (`CLAUDE.md`) | **1** |
| honest form **plus presses** (`S4-071`) | **0** |
| `a30238f5` | station `ship`, hold `given-up` |

**Nothing has changed since the fixes landed on lane branches, because none of them is deployed.**

**AND THE GAP IS COMPOUNDING.** Commits ahead of `main`, measured twice a few hours apart:

| lane | earlier | later |
| --- | --- | --- |
| `lane/run` | +36 | **+44** |
| `lane/platform` | +63 | **+70** |
| `lane/control` | +58 | **+68** |

**182 commits across three lanes, none of them exercised against production.**

**AND THE MERGE ITSELF IS ONE CONFLICTING FILE**, computed with `git merge-tree`, which touches
nothing:

| branch | against `main` |
| --- | --- |
| `lane/run` | **clean** |
| `lane/platform` | **clean** (was the one conflict; S3 resolved it in `601fdb30f`) |
| `lane/control` | **clean** |
| `lane/proof` | **clean** |

**All four branches now apply to `main` cleanly, and `run × platform` is clean too.** Verified
independently after S3 pushed, not taken from their report.

The one conflict was `src/lib/governance.functions.ts`: S0's `F-128` **adds** a `gatesLiveWork` field
to an approval row, S3's `U-092` **corrects** the `risk` field on the same row, and they landed on
adjacent lines. **Both halves were right**, so the resolution needed no judgement — S0's block
verbatim plus S3's one-line change. Roughly 30 lines, under ten minutes including a full gate run,
and S3 took it because they had edited an S0-owned file.

**Read the two numbers together:** 182 unexercised commits is the reason to be careful; one
conflicting file is the reason it is doable. Re-run
`git merge-tree --write-tree --name-only origin/main origin/lane/<name>` immediately before the
deploy, because every lane is still committing.
 Every hour of lane
work makes the eventual merge larger and less testable, and the risk is not linear: three lanes
editing overlapping surfaces for a day produces conflicts nobody has seen yet. **The cost of waiting
is not zero and it is not flat.**

## The acceptance, and why it is 0

The loop worked. `a30238f5` walked `sense` to `ship` agent-driven after S0's Discover fix: 13
members, a real pull request, five stations in under three hours, on a track that filed nothing
across twelve drives that morning. **Do not press it** — it is S0's proving ground.

It is parked at `ship` on `given-up`, a terminal hold, and both of Ship's refusals are correct.

**Three things stand between here and R-18, all definitional rather than broken:**

1. **The published query will report a FALSE PASS.** It excludes decided approvals and cannot see a
   press. `a30238f5` has 0 decided approvals and **7 presses**. One extra `NOT IN` against
   `track_drives.driven_via='press'` fixes it (`S4-071`). 19 of 106 tracks carry a press.
2. **No agent can clear a design gate and there is no `prd.approve`** (`S4-076`, corroborated by S0).
   The acceptance also forbids `waived`, so three things must hold that cannot. S0 built `spec-gate.ts`
   for this (F-116).
3. **117 of 119 specs carried no success metric**, so Learn had nothing to grade (S0, F-117).

## The structural findings, which describe the product rather than a screen

Each has a one-command check in `e2e/helpers/`, no server, no credentials.

| | |
| --- | --- |
| Server functions nothing imports | **141 of 656** |
| Components nothing imports | **80 of 492** (noisier: a helper used only in its own file counts) |
| **The Meridian ratchet is bypassed by an alias** | **46 files**, and a NEW file can be written entirely in the retired system today and pass green. **S0's call** |
| Tables with a live writer and a dead one | **19** |
| The Linear push was moved off a route and never arrived | capability lost in a fold, and `SURFACE-MAP` had said by name not to drop it |
| A person cannot rename a run | confirmed; **S2 ruled: delete, do not wire** |
| Spend accrues against no ceiling | **10 of 14** budget rows |
| `/proof` prints a raw config error naming an env var to the public | one line |

**An orphan is not waste.** Three rows were resolved three different ways within an hour by three
people: one was a real gap (S3 shipped the banner), one was documented as a gap before either of us
looked, and one was superseded and should be deleted. **The list is where to look, not a delete
order.**

## The safety model is proof, not permission, and the public copy says permission

**One tool of seventy-four always requires a person** (`delegate.openhands`). 52 tools are seeded
`auto`, 21 `confirm`, and a `trusted` arc turns every `confirm` into `auto` — all 93 agent rows are
trusted. Of the four high-risk tools floored to `review`, **two are released back out
unconditionally**: `studio.revert` and `release.publish`.

**This is deliberate and it is defensible.** Every release carries a written argument about
reversibility: a branch and draft PR are reversible, a rollback to a known-good commit is reversible
by definition, and a publish is gated not on a click but on **merged + CI green at that sha + a live
preview + a recorded forecast**. *"A change nobody can grade cannot ship itself."* That is a stronger
guarantee than a click.

**The problem is that the public copy describes permission.** Three surfaces said an absolute the
wiring does not keep — the landing trust badge twice, and `llms.txt`, which is what every crawler and
agent reads. S3 fixed all three. **The honest sentence already existed on `index.tsx`** and is
stronger than the false one.

**This is the one I would look at first outward**, because it is the last thing a visitor reads
before deciding whether an agent touching their repository is safe.

## The meta-finding, which outranks all of it

**Four guards reported success while the thing they guarded was happening.** My `curl` warming that
warmed nothing. S1's `Gate` printing "Waiting on you" for a status nobody had set. S0's `FILE_IT`
rewrite that reached no seat. The ratchet matching literals past an alias.

**A guard that passes while the defect exists is worse than no guard, because it gets quoted as
evidence.** Four lanes hit that shape independently, in four different layers, in one night.

## What I built, all in `e2e/`

`bash e2e/check-motion.sh [--signed-in] [--phone] [--expired-session] [paths…]`, also
`bun run check:motion`. Boots against a dead database, fabricates the session the guard reads (no
credentials), warms routes **in a browser** and reports: motion that survives a dead backend,
counted progress that ADVANCES (this one fails the build), failure sentences per surface, clipped
unreachable content, controls a screen reader cannot name, prose past Meridian's 68ch measure.

`e2e/helpers/surface-census.mjs` answers what all 95 URLs do: **51 render, 43 redirect, 0 dead.**
14 of those redirects land on `/engine-room`.

## Open, by owner

- **S2** · the lit rail row on `/today` needs a three-way call with S1 and S0 (they fixed the label).
- **S3** · prose at **122ch on `/`** and **165ch on `/pricing`** against a 68ch token (`S4-085`).
- **S1/S3** · `/brain` and `/learn` each announce one dead read **7 times**; both have fixes unmerged.
- **Founder** · outward copy on the hero was checked against canon §5N and is CLEAN, not a defect.

## What I got wrong, so it is not inherited

`/runs` is a dead end (my curl warming), four surfaces show cache keys (my 401 shim), the settings
control is ungated (diagnosis inverted, gating would be the danger), the em dash leak is closed (a
column total proves nothing), `/meridian` is the worst surface (it is the component gallery), 15
forecasts are overdue (13 are demo fixtures). **Five of six were my instrument or my population.**
