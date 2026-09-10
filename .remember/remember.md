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
