# LANE 2 — 2026-09-10 — THE RUN WENT ROUND, AND THE JOIN BETWEEN LAYER 2 AND LAYER 3 WAS EMPTY

**Branch `worktree-2` pushed to `main` · HEAD `e1d40a890` · 0 ahead / 0 behind origin/main ·
tsc 0 · 15,882 pass / 0 fail / 0 error · `bun run build` exit 0 · working tree clean**

**Everything is pushed. Lovable deploys from GitHub, so this session's code is shipped.
IT IS NOT YET VERIFIED ON THE SERVED BUILD — see the last section, which is the first thing
to do next.**

---

## THE THING TO KNOW BEFORE YOU TOUCH THIS

**A run that goes in circles now says so, and 23% of them do.** Measured on production over
every track that has ever taken a turn, before anything was built:

```
tracks with turns                        117
tracks that visit a station twice         27   (23%)
tracks that visit one station 3+ times    19   (16%)
of the 27, a clean repeating cycle        23
```

The commonest shapes are `sense, decide` three times over and `define, design, build` three
times over. **All three `given-up` runs in the founder's own workspace are the second one**,
each lap ending on the identical sentence: *"No repository is connected for this workspace."*

`transcriptSections` opens a new section every time the station changes — correctly — and had
no idea it had opened Plan for the third time. Eleven sections in one flat column, peers of
each other. The transcript now leads with **"Three times round Plan, Design and Build."** and
the column carries a seam per lap: *First / Second / Third time round*.

`src/components/spine/the-run-went-round.ts`, wired in `TrackActivity.tsx`. Silent on the 90 of
117 runs that walked a line.

## THE CORRECTION THAT MATTERS MOST, AND IT CAME FROM THE SERVED PAGE

**My fixture was cleaner than the product.** The SQL that measured the shapes collapsed
consecutive turns at one station into one leg. `transcriptSections` does not: a `move` row opens
a new section even when it moves to the station the work is already at, and on `6cc7a010`
Design's two seats draw as two sections. The real sequence is

```
Plan, Design, Design, Build   x2
```

so the lead would have read **"Twice round Plan, Design, Design and Build."** — the first
sentence on the most important screen in the product, and not a sentence anybody would write.

Found by reading the served transcript rather than the fixture. Fixed in `roundLead` only:
the cycle IS four sections long and the seams must land on all four, so deduping before
detection would move `lapStarts` and put "Second time round" in the wrong place.

## THE SECOND FIND, AND IT IS THE FOUNDER'S "NOTHING JOINS UP" AS A COLUMN

**58% of every task in the database has no link to the spec it implements.**

```
tasks with no prd_id                            264 of 457   (58%)
task rows filed as a track member               199
...of those, on a track that also holds a prd   183          (92%)
tasks in the founder's workspace                 43
...of those, linked to a spec                     0
```

`tasks.prd_id` has existed as long as the table. `tasks.create` — the only tool an agent has for
filing one — never offered the field and never wrote it. `/plan/spec/5446f8a8` says **"0 tasks on
this spec"** while the run screen one click away quotes Plan's own words about that same spec:
*"Three implementation tasks created"*, and again *"...has been broken down into the following
tasks"* naming five. **The seat did the work, said so in prose, and had no field to say it in.**

The read side is NOT at fault and was not touched: the rail filters on `prd_id`, refuses to claim
a count when the read failed, and was right to print 0.

Fixed at the cause (`registry.server.ts`): `tasks.create` takes an optional `prd_id` and on a run
reads the track's newest `prd` member — the third use of the pattern `ToolCtx.trackId`'s own doc
argued for, *"the difference between a link and a hope"*.

## THE ONE THING LEFT UNDONE, AND IT IS READY TO PASTE

**The 165-row backfill is written, measured and NOT applied.** The Lovable MCP token expired
mid-session (`requires re-authorization`). This repo's rule is that a lane applies its own
migration by hand and never leaves one for Lovable to apply on merge, so **the file was held out
of the tree rather than shipped unapplied.** The whole statement is in
`docs/operations/session-handoff.md` under "The backfill that is ready to run", with its guards
and expected counts. Re-authorize the MCP, run it, verify 165, then commit the file.

## /OUTCOMES: FOUR FIXES, AND THE FIRST IS A TENANCY DEFECT

1. **"Forecasts due (9)" was not this workspace's.** `c8ffbbe7` holds six forecasts and NONE
   overdue; the desk drew nine from Helio Labs — crypto wallet parity, $7.99 pricing — in a
   workspace named "A1 delete probe". All three desk reads were unscoped and the desk has exactly
   one caller in the tree: `/outcomes`, a workspace record. It also put a straight contradiction
   on one scroll: *"You called it on 6 of the last 9"* (unscoped, `decisions.forecast_resolution`)
   four regions above *"No forecast has been graded yet."* (this workspace, `insights.resolution`).
   One noun, two tables, both true.
2. **Nine rows ending in one byte-identical string.** The constant leaves the rows and is said
   once in the region's sub with the count. Back the moment one row differs.
3. **Four consecutive never-happened lines**, 381 characters, fold into one keeping every noun
   and every act. 149 characters. Fires at two, never at one.
4. **Six of eight decision rows ended in the word "hold"**, and two printed their own title back
   as their forecast (2 of 204 claims in the record are their own title; both in his workspace).

## THE GUARD THAT CAUGHT ME, AND THE WAY I ALMOST BEAT IT

`a-read-serves-the-workspace-you-are-in.test.ts` failed my first scoping draft, and it was right:
I resolved `current_user_default_workspace` server-side, and since `20260907010000` a person can
hold two workspaces — the default is not the one they have open.

**Then my second draft made the guard PASS by blinding it.** I moved the resolve into a shared
helper; the scanner reads source text and cannot see through a call, so the file went to zero
without the read being fixed. I inlined it back into all three. **A guard you silently defeat is
worse than a guard you fail.** The ratchet is one file lower, honestly.

## WHAT IS NOT VERIFIED, AND IT IS THE FIRST JOB NEXT SESSION

**Nothing this session has been seen on the served build.**

- **Chrome cannot reach a dev server from this worktree.** `curl` gets 200 on `127.0.0.1`, `::1`
  AND the LAN address; Chrome shows an error page on all three, including `/health`. Lane 3 hit
  the identical wall last session. Do not spend an hour on it again — walk `supaprod.ai`, which
  is the better instrument anyway.
- **The last production read showed the four admission lines still separate**, so the commit was
  not live at 14:2x IST. `/outcomes` no longer draws "Forecasts due (9)" — **but that is an
  ABSENCE and an absence proves nothing about a deploy.** Rule 18 wants a string only the commit
  introduced. Use one of these:
  - `Nothing has been rated, re-ranked or graded yet.` (`/outcomes`)
  - `None of them has been settled yet.` (`/outcomes` › Decisions)
  - `Three times round Plan, Design and Build.` and `Second time round`
    (`/track/6cc7a010-18e5-4e13-ad82-8d8d06687119`, which is the fixture the whole feature was
    measured on)

## THE DEFECT CLASS, AND IT IS THE SAME ONE AS LAST SESSION

**A value identical on every rendered row distinguishes nothing.** Removed from three more places
tonight, which makes eleven in this repo. So the comparison finally lives in one file,
`src/lib/a-value-on-every-row.ts`. **What to DO about a constant is never general and stays at the
call site**: on the agent roster it leaves because the heading already says it; on the forecast
desk it moves UP into the region's sub, because nothing else on the page says it at all.

---

# LANE 1 — 2026-09-10 — THE ENTRY, AND THREE INSTRUMENTS THAT LOOKED CLEAN

**`main` at `ac63223f0`, 0 ahead / 0 behind, tree clean. tsc 0 · 15,857 pass / 0 fail · build 0 ·
docs clean. NOT verified on the served build — Lovable still held `b4b23f53` at close.**

## The one thing to know before touching the home

**Everything the entry needed was already in the browser and being dropped.** `getApprovalsQueue`
gives the home the whole Inbox payload; the home rendered ONE INTEGER, ONE NOUN AND ONE TITLE off
it and discarded `evidence[]`, `impact`, the whole `forecast`, both consequences, `agentSlug`,
`gatesLiveWork` and **`trackId`** — the join to the run list 400px below on the same screen. So
"layers 1, 2 and 3 stitched on one object" cost **no new read**.

That is this repo's oldest defect class and this was its largest instance. **Before designing a new
read on any surface here, list what the surface already fetches and throws away.**

## The founder said the same sentence twice, and that is the signal

*"Shows no journey."* The previous pass answered it by MOVING the seven-station road to the top. It
shipped; he said it again. **A repeated complaint after a shipped fix means the diagnosis was wrong,
not the execution.** A journey is one thing moving through time, not a diagram of stages — the band
draws identically for any workspace with the same counts, which is the machine's self-portrait.

## The number that decides what any surface here may promise

**33,777 rows of MOTION against ~14 rows of RESULT** (9 hit/miss forecasts, 3 outcomes, 2
learnings), against 69,543 credits. **0 of all 97 resolved forecasts carry `forecast_observations`,
`forecast_predicted` or `forecast_metric`** — every one graded by narrative. Also: 80% of tracks
abandoned, 37 of 43 never left station one.

**Lead with proof and the screen is empty; lead with motion and it confirms the complaint. The
honest lead is what is stuck, on whom, and for how long.**

## THREE INSTRUMENTS IN ONE DAY, AND THE THIRD IS THE ONE TO HUNT

1. `a-grid-does-not-read-flex` scanned `/^\.(sp-[a-z-]+)\s*\{/`. Adding `[data-work]` beside
   `.sp-inner` made the selector a LIST, the scanner matched nothing, and it **reported a clean
   tree**. Caught only by its own self-check: *"the guard is worthless if its input is empty, and an
   empty result would otherwise look exactly like a clean tree."* **Every scanner needs that check.**
2. `today-states-its-wait` listed eight station files; **five were redirect stubs with no wait
   branch**, so it read eight and examined three. Repointed at the real surfaces, it found a genuine
   `isLoading ? null` on `plan.spec.$id` in one run.
3. Lane 2's: a guard that reads SOURCE TEXT was made to pass by **moving the logic into a helper**
   it cannot see through.

**The class: an instrument that reports a clean world because the world moved out of its view.**
Rewriting a guard's INPUT is as dangerous as rewriting its assertion, and neither fails loudly.

## Two laws now in DESIGN-SYSTEM.md

**31 — a surface's heading is the reader's SITUATION, not its name.** The name is in the rail and
the tab already. 114 ALL-CAPS labels across the signed-in product; `/evidence` and `/outcomes` each
open with FOUR heading layers. The doc already argued this and five surfaces did the opposite —
**when a written rule is inverted in code, it needs a guard, not another paragraph.**

**32 — a movement keeps its place when it is empty.** Twelve conditional regions is why no two
visits of the home shared a shape. Exception: an unread read draws NOTHING, because "nothing is
waiting on you" and "we could not find out" are different sentences.

## Practical

- **`sp-` is retired and the ratchet counts every one in JSX.** Joining the shell by class ADDS
  debt. `[data-work]`, `[data-work-main]`, `[data-work-wide]`, `[data-work-ctx]` are the hooks now,
  listed beside the classes in `shell.css` so surfaces port when next opened.
- **Ten routes had zero inbound links** and were pure redirects; deleted. `legacy-redirects.ts`'s
  own ruling: the 404 with a door is the correct landing.
- **Do not start a dev server** — Chrome cannot reach it from these worktrees. Walk `supaprod.ai`.
  It is the better instrument anyway: it is the served build.
- **Lovable's `latest_commit_sha` tracks the SYNC, not your push.** Check it is at or past your tip
  before deploying, or the build misses your commits.
