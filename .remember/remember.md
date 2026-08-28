# S0 CONDUCTOR — 2026-08-28 ~06:25 IST — SESSION CLOSE, MAIN TAKEN AND DEPLOYED

**Production is live on the full five-lane integration, and it is verified rather than
announced.** `origin/main` = `86a4509ed`. Every lane is **0 ahead, 0 behind**.

## THE DEPLOY IS VERIFIED BY THE BYTES ON THE WIRE, NOT BY A GREEN TOOL CALL

The Lovable deploy reports `pending` and returns a URL; neither says what SHIPPED. What
was checked:

| Check | Result |
| --- | --- |
| Local build of the integrated tree | `styles-CUgl1fzh.css` |
| `supaprod.ai` serving now | `styles-CUgl1fzh.css` — same hash |
| Live `.today-hero` rule | `border-top`, `border-bottom`, `margin`, `padding`, **no `background`** |

**THE FIRST DEPLOY SHIPPED THE WRONG TREE AND ONLY THIS CHECK CAUGHT IT.** `deploy_project`
fired before Lovable had synced `86a4509ed`, so it published `0ba9043fd` — the previous
main, which still carried `background: var(--mrd-lift)`. Confirmed by fetching the live
CSS: the fill was on production. A second deploy after the sync fixed it. **Never treat a
`pending` deployment id as a deploy; fetch the asset and compare the hash.**

`supaprod.lovable.app` 302s to `supaprod.ai`. Same app, custom domain, Lovable hosting on
Cloudflare — so `server: cloudflare` on `supaprod.ai` does NOT mean a separate worker
pipeline. That cost me twenty minutes chasing a deploy path that does not exist.

## MIGRATIONS: ONE NEW, AND IT WAS ALREADY APPLIED. VERIFIED OBJECT BY OBJECT

The founder's concern was that Lovable concatenates migrations and misses some. **It has
not.** Checked against `information_schema` and `pg_catalog` directly, never
`schema_migrations`:

- `20260827001500_a_steer_is_addressed_to_the_work_not_to_a_seat.sql` is the only migration
  new in this integration. `mission_id` and `to_agent_slug` are both already nullable, the
  `agent_messages_addressed_to_something` CHECK already exists, and 0 of 161 rows violate
  it. **No DDL was run**: re-running would drop and re-add a live constraint for no gain.
  The file's own header says it is "a no-op against production, and the missing history
  everywhere else", which is exactly what it turned out to be.
- Swept every migration from 08-25 to 08-27 for the objects each claims to create.
  **17 of 17 present**: 7 functions, 3 indexes, `track_drives`, and `is_sample` on all six
  tables. Nothing has been skipped.

## THE CI RED IS A BILLING BLOCK, AND IT IS NOW MEASURED RATHER THAN REPORTED

S2 reported it across four runs. S4 could not verify it (`gh` absent in its worktree) and
correctly logged it as second-hand. **I verified it directly on the run for this very
integration**, `33130173587`:

> The job was not started because recent account payments have failed or your spending
> limit needs to be increased.

Every push to main fails in 3–4 seconds for this reason. **A gate that was not run is not a
failing gate.** `ci.yml` has only a `checks` job and no deploy step, so this blocks
verification, not shipping. **FOUNDER ACTION, AND NOBODY IN ANY LANE CAN CLEAR IT.**

## WHAT I BUILT

- **F-150** — `MERIDIAN_ORPHANS` excused two tokens whose call sites were all fixed, so the
  excuse outlived the defect and the guard said so. Also found the same two tests copied
  verbatim out of the token `describe` into the CSS-**class** `describe` and never
  repointed, so a class guard was announcing token failures under a heading that does not
  describe them. Deleted the copies.
- **F-151** — the vocabulary ruling reached three maps and missed the fourth.
  `LineageDrawer`'s `KIND_LABEL` is read through `.toLowerCase()` into "How this {label}
  connects across the product lifecycle", so the product rendered **"How this what we found
  connects across the product lifecycle."** Same defect as "1 what we found" with a
  demonstrative instead of a number. The guard now watches that map too, mutation-tested
  with the real defect.
- **The fold ruling**, held across four separate merges that each tried to reinstate the
  fill. Deletion, not repoint. See below.

## FOUR SESSIONS FOUND ONE GUARD INDEPENDENTLY, AND THE FINAL FORM BEATS ALL OF THEM

S4-159, my F-150, S3's U-142, then S4's merge of the last two. Nobody took anybody's word.
S3 named the right question ("is this token STILL USED BARE") where mine bundled two
questions into one expression; S4 then restored the `declared` clause because an exemption
dies **two** ways — its call site disappearing, or the token becoming declared while still
in use — and neither lane's version caught both. **That is the coordination protocol
producing something better than any lane had, rather than merely avoiding a collision.**

## THE FOLD RULING, AND WHY IT KEPT COMING BACK

`.today-hero` carried `background: var(--mrd-raised)`, a token declared nowhere, so the
declaration was dropped and the rule **typechecked, linted, built and did not exist on
screen**. One lane repointed it at `--mrd-lift`; the ruling DELETED it.

The deciding evidence is which comment is a witness. The "a raised background" comment both
repointers cited **was written while the broken declaration sat in the file**, so it
describes the DECLARATION, not an observed pixel — a symptom of the bug, not testimony for
it. The section header states the real intent, "one featured moment with air and rules",
and the rule already delivers both: 26px/22px of padding is the air, the two borders are
the rules.

**S3 then measured the thing that settles it, and S2 verified it independently:** `--mrd-lift`
is +0.070 on dark and −0.014 on light against `--mrd-bg`. It **inverts direction between
grounds**. The repoint would have shipped a prominent band in one theme and a 1.4% step in
the other, and whoever shipped it would only ever have seen the dark one. If a fill is ever
chosen deliberately, `--mrd-sheet` is the rung — that is a design decision needing a
browser, not a merge resolution.

**It came back on four separate merges.** S2 proved that main-against-its-branch merged
clean with zero conflicted paths, so on that path nothing would have raised it. Verified
comment-stripped after **every** branch merge, because S4's branch had merged origin/main
and could have carried the fill back behind a clean merge.

## THE VERIFICATION LESSON OF THE NIGHT, AND IT CAUGHT US FIVE TIMES

**A naive `grep` reads prose as code.** S2's own ten-second check,
`grep 'background: var(--mrd-'`, reports FILL PRESENT on a tree with no fill, because the
comment explaining the removal quotes the line it replaced. S2 demonstrated the false
positive on its own commit. **Strip comments before asserting anything about CSS or tokens.**
The correct check is in S2's final message and exits 0/1/2 rather than printing a line.

## STILL OPEN — READ BEFORE RE-INVESTIGATING

1. **`track_drives` has 323 rows and no reader** (S4, and the sharpest finding of the night).
   277 sweep drives, 40 human presses across 19 tracks, 6 continuations. `driven_via` is the
   exact column the acceptance query needs to exclude runs a person pressed, and the only
   `SELECT` on that table anywhere in the repo is inside a test's documentation string.
   **The work agents do is recorded faithfully and shown nowhere — the founder's own test
   failing quietly.** Not a migration; the data is correct and already there.
2. **A refusal lands in `agent_approvals` OR `tool_calls`**, depending on whether it crossed
   the approval boundary. **Any claim of the form "tool X has never failed" is false unless
   it names both tables.** S1 nearly filed a false finding on this and caught it — our
   dominant defect class (a narrow read coming back empty, taken as a fact about the record
   rather than about the column read), committed by the session that had been naming it all
   night, then converted into a check instead of a sentence.
3. **`tools-refused` promises a specific reason and the one live instance has none** (S1).
   `driver.server.ts:2491` writes the sentence; track `8391835f` sits at `tools-refused` with
   `last_hold_because` NULL and `attempts` 0. Same for `given-up` and `going-in-circles`.
   **NOT to be confused with the 49 of 50 NULLs, which S1 checked and cleared as F-127
   working as designed** — a generic sentence in a field meant for specifics is worse than a
   null. Do not record that one as open.
4. **`check:unreachable` does not follow `React.lazy(() => import(…))`** (S3). Ten of the
   eighty it lists are mounted. Keep the ratchet, it cannot regress; **do not hand its output
   to anyone as a backlog.**
5. **`bun run typecheck:tests` reports 414 errors.** Pre-existing: every erroring file is
   unchanged versus main. It is not wired into any hook or CI gate — S3 added it as a
   diagnostic "so it can be driven down and then gated". Not a regression, not a blocker.
6. **`signals.log`, 28 failures, is two unrelated problems wearing one count** (S1). 17 are a
   missing `SUPABASE_SERVICE_ROLE_KEY` (ops, not product); 11 are a guard correctly refusing
   to log this product's own `workspace.brief` as evidence about the world. Split before
   deciding anything.
7. **`.remember/remember.md` is TRACKED, while CLAUDE.md calls it untracked.** S3 trusted the
   document over the index and a `git add -A` deleted 135 of S4's lines. **Until that is
   reconciled the rule is: append, never write whole.**

## GATES

Run individually with captured exit codes, never chained, because a chained run was killed
at exit 137 earlier tonight and **a gate that was killed is a gate that was not run**.

`tsc 0 · docs:check 0 · check:unreachable 0 · check:retired-aliases 0 · check:dead-writers 0
· build 0 · bun test 12,972 pass / 22 skip / 0 fail across 892 files.`

## NO LANE'S WORK WAS LOST, AND IT IS CHECKED RATHER THAN ASSERTED

All six heads — `main`, `lane/run`, `lane/control`, `lane/platform`, `lane/proof`, `s1` —
were confirmed ancestors of the integration before the push, then fast-forwarded to it.
Every handoff conflict was resolved as a **union** and then deduplicated only where a section
was byte-identical or empty, never by taking a side.

---

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

## Two kinds of green board, and the remedies are opposite

**A tool's silence misread as its verdict** — a CI check that never started, a gate killed at exit
137, a compiler that died reporting `0 errors`. Three tonight. These need the runner's status
surfaced so silence can be told from a verdict.

**No tool having an opinion at all** — `var(--mrd-raised)` named a property declared nowhere. A bare
`var()` on an undeclared custom property is legal CSS, so the rule is silently dropped and the element
inherits. tsc, eslint and the build were **correct** to say nothing. This needs a check that does not
exist yet: every `var(--mrd-*)` must name a property `meridian.css` declares.

**Both end in a green board and a wrong screen.** A team that hears "our checks missed it" four times
will harden the checks it has, which fixes three of these and cannot touch the fourth.


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
