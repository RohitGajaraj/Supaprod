# Session handoff (durable)

> _Last updated: 2026-08-03 23:15 IST. `main` clean, pushed through `8c6dd832`. **The documentation was cleaned end to end: root went from 22 markdown files to 4, and 1.87 MB to 50 KB.** Read the section immediately below; it is the live one._

**This file is the durable, git-tracked session handoff.** It replaces `.remember/remember.md` as the committed record, because that file empties itself on read.

---

# 2026-08-03 (evening): the documentation cleanup

## STATE: SAFE

`main` = `8c6dd832`, pushed, working tree clean. **22 commits.** tsc 0 errors, `bun test` 7,159 pass / 0 fail across 402 files. No source behaviour changed; this was a documentation and repo session.

## DISK CLEANUP: DONE

The founder ran the `rm -rf` on `.claude/worktrees` on 2026-08-04. **`.claude/` went from 84 MB to 272 KB**, and everything functional survived: `agents`, `hooks`, `skills`, both settings files, and all four git hooks. Verified after: tsc 0, 7,159 tests pass, build succeeds, docs-doctor clean, tree clean and in sync with origin.

Total freed across the session: **~254 MB** (170 MB of lane worktrees, 84 MB of orphaned Workflow snapshots).

### Four branch refs are safely deletable, if you want them gone

Branch deletion is blocked for agents by policy, so these are yours. All verified merged or superseded:

```bash
git branch -D backup/graph-discovery backup/hook-removal \
              parallel/lane-0-fresh parallel/lane-1-fresh backup/graphify-work
```

- `backup/graph-discovery`, `backup/hook-removal`, `parallel/lane-0-fresh`, `parallel/lane-1-fresh` are all **ancestors of main**, so fully merged.
- `backup/graphify-work` shows 2 unmerged commits, but its content is already on main by another path: `.graphifyignore` exists (36 lines), and `CLAUDE.md` and `.gitignore` both carry the graphify entries. It is a stale backup.

**Keep these two:**

- `archive/final-sweep-2026-07-18`, 25 unmerged commits, is **deliberately** never merged and there is a `pre-merge-commit` hook enforcing that. Do not delete or merge it.
- `lovable-mcp-supabase-access` backs the Conductor worktree at `~/conductor/workspaces/Superprod/bordeaux`. Merged, but deleting it while that worktree exists would break it.

## WHAT CHANGED, AND WHY IT MATTERED

**Root: 22 markdown files and 1.87 MB, down to 4 files and 50 KB.** Every session was being told to read a 1.3 MB `plan.md`, four design contracts that were all retired on 2026-07-28, five phase docs for a rebuild superseded ten days later, and three wave handoffs describing an app shape that no longer exists.

Each root file now answers exactly one question and says so in its first line: `README` what it is and where everything lives, `AGENTS` how to build it, `CLAUDE` and `GEMINI` per-tool notes kept thin because they auto-load every request.

**Two founder rulings landed:**

1. **It learns and guides; it does not remember.** "Remembers" describes storage, and storage is not defensible. README carries a vocabulary table so this cannot be re-flattened, and AGENTS turns it into a coding constraint: a feature that records something and stops has not finished, and breaking the Learn write-back is a moat regression however well it typechecks.
2. **AI-fingerprint cleanup is consumer-facing only**, never backend source, comments, `.md` or `.sql`. Plus the positive half he added: removing fingerprints is the floor, not the standard. "An error occurred. Please try again." passes every automated check and still fails. Four tests now sit in `../conventions/humanized-output.md` with a worked before/after table.

**The drift that was actively harmful:** three of the four root docs pointed agents at Tempo v5, and **Lovable's project Knowledge field still said the product was named Cadence** with Loom v4 as the design system. Lovable writes code into this repo, so it had been building from a six-week-stale brief. Replaced, and mirrored to [`lovable-knowledge.md`](./lovable-knowledge.md) so the next drift is a diff instead of a discovery.

**6.4 MB of the corpus was whitespace.** `SOURCE-OF-TRUTH.md` was 6.45 MB, of which 5.5 MB was prettier's table-cell padding. Collapsed, verified lossless (467 rows to 467, identical pipes per row, zero content changes), and `docs/**/*.md` added to `.prettierignore` so `bun run format` cannot re-inflate it.

**`docs/strategy` declared seven documents simultaneously current.** Archived v7 to v10 and v13 with a reason next to each. New rule in its README: a version number is not a decision, do not open a v14.

## THINGS TO KNOW BEFORE YOU TOUCH DOCS

- **`docs-doctor.sh` now runs itself** from the pre-commit hook when a commit touches markdown. It prints and never blocks. Three of its checks were repaired because they could only ever pass or always failed; a check that cries wolf is worse than none.
- **Root holds exactly four files.** The whitelist in `docs-doctor.sh` enforces it. Adding a fifth is how the last three cleanups started.
- **Fifteen buckets in `docs/`, all kebab-case.** The map and placement policy is [`../README.md`](../README.md), which ends with a table of what moved where.
- **A blind path-prefix rewrite edits prose, not only links.** Mine rewrote two of my own explanatory comments into nonsense before I caught it.
- **Nothing was deleted except `ENTRY.md`**, whose only job was the doc map. Everything else moved with a README at the destination recording why it stopped being current.

## OPEN, NOT BLOCKED

- The `rm -rf` above.
- `docs/planning/SOURCE-OF-TRUTH.md` is still 923 KB and 467 rows. That is now real content, not padding, but it is a candidate for splitting live rows from done rows if it keeps growing.
- Known coverage gap recorded in [`../testing/README.md`](../testing/README.md): nothing tests `discover/ranking` and `discover/format` together, so a format-helper change can reorder the Discover queue with all 212 unit cases green. A stale draft test for exactly this is preserved in `../testing/archive/`.

---

# 2026-08-02 (evening): nine dead features, and the detector that finds the tenth

## STATE: SAFE

`main` = `3de9098e`, pushed to `origin/main`. **40 commits.** Gate green at every commit:
tsc 0 errors, `bun test` 7130 pass / 0 fail (up from 6571).

**ELEVEN MIGRATIONS APPLIED LIVE AND VERIFIED THIS SESSION**, so nothing is pending:
signal embedding sweeper, theme growth columns, changeset code_review, agent_memory
visibility, reflections visibility, seat-limit trigger, workspace autonomy policy,
landing session claims, lineage canonicalisation, workspace claim, entity embeddings.

## THE FINDING THAT SHAPED THE WHOLE SESSION

Nine features were shipped, committed with plausible messages, passing typecheck and
tests, and **doing nothing in production**:

1. `signals.embedding` was never written, so every semantic query returned zero.
2. Theme growth could not attach a signal, because zero themes had embeddings.
3. Ranking designations were computed and rendered nowhere; `OpportunityRow` had zero
   instantiations outside its own tests.
4. The knowledge graph could not name or focus a `learning`, its second-most-common node.
5. `note` and `precedent` memories were 100 percent unembedded, so the memories a HUMAN
   curated were exactly the ones recall could never reach.
6. The pulse widget had THREE stacked faults and had recorded nothing, ever.
7. `signals.url` existed since the table was created and no surface ever rendered it.
8. `design.draft` wrote a share link onto a blank page.
9. The public pricing page advertised 50 free credits against an actual 750.

**Not one was found by reading code. All nine came from querying the live database.**

Two had unit tests that asserted the defect as the contract.

**The root cause of the whole spine being frozen**: `signals.list` defaulted to a 7 day
lookback when only 6 of 308 signals fall inside it. 42 open tracks, every one standing at
`sense`, exactly ONE track in the product's history had ever reached `done`.

## WHAT SHIPPED, BY THEME

**The loop can now run.** Signal embeddings (308/308 live), theme embeddings (0 to 175),
theme growth with conditional decline, the 7-day lookback fixed, and a universal
correction loop so a failed station routes BACK to whoever can fix it and learns from it.

**The brain.** Memory is workspace-shared with private opt-in, both recall paths
workspace-aware, the graph renders WHY (rationale, author, verdict, dated revisions),
35 of 51 revision edges were being read backwards and are fixed, and
decisions/opportunities/prds/learnings finally have embeddings.

**Agent-first.** Learn settles its own verdict when the evidence is clear (the sweep was
ALREADY deciding one and was forbidden from acting), the promotion bar and settle bar are
workspace policy on /boundary, and Build gained four verification tools.

**Governance and security.** A seat-limit trigger, and a live tenancy hole closed: any
workspace owner could move their workspace into any account by uuid.

**Observability, the thing that makes the rest durable.** A feature-liveness detector
answering "is this executing in production", seeded with all nine cases. Gate pressure
answering "when it runs, what stops it". Plus: the cron watchdog was missing 8 jobs, one
job was structurally invisible, and a refused AI call left no trace on either path.

## WHAT IS OPEN, AND WHO OWNS IT

**EMBEDDING IS DOWN. Check this first.** `ai_events` has no `embed` row since 12:00 UTC
while `agent` and `discovery` are healthy. The entity sweeps shipped but are NOT verified
live. The symptom to look for is `error_events` filling with `cron.embed-tick.* /
embed_failed`, which is exactly the signal the old console.error swallowed.

**Founder decisions, all documented:**
- Tier limits are off. `docs/decisions/launch-gates-seat-limits-and-sandbox.md`. Ten
  accounts are over their limits; flipping first would freeze the demos. Arbor
  (harbor@supaprod.ai) was granted platform admin this session so the tier change can go
  through `admin_override_user_plan` rather than an ad-hoc write, which a billing trigger
  correctly refuses.
- Sandbox: same doc. Cloudflare on fit, cost is a rounding error for demos, and the
  do-nothing alternative (read CI before opening the PR) is written up.
- Max pricing: `creditMultiplier` grants 15,000 credits a month, which at Pro's published
  rate would be 3,000 USD, not 99. Two pricing models describing different products. The
  contradiction is stated in the code rather than smoothed over.
- Lineage relation CHECK constraint: NOT added, deliberately. 30 relation strings are
  written by real code and a 13-value CHECK would have rejected live inserts.

**Known gaps, flagged not hidden:** `workspace_audit_log` cascades on workspace delete, so
the claim's proof dies with the workspace. Nine modules still bypass the signal sink.
`meetings` and `audio` are complete AI pipelines with zero UI. `draftContractFromIntent`
is dead with zero callers. PostHog is keyless.

## THE OPERATING LESSON

Read the live database before believing the code. Every real defect this session came from
a query, never from a review. Two of my own fixes were wrong and only the data showed it:
I "fixed" the memory sweeper's query when the query was fine, and I told the founder the
read layer normalised the relation fork when three SQL-filtered surfaces did not, one of
them a public shared receipt showing a superseded decision as still standing.

`console.error` is not observability. `error_events` is.

---

# 2026-08-02 (overnight): the Build terminal, the loader, and the rules that outlast the session

## STATE: SAFE

`main` = `9e490f45`, pushed to `origin/main` (`RohitGajaraj/Supaprod`). Working tree clean,
nothing staged, dev server stopped. Gate green at every commit: **tsc 0, eslint 0 errors,
6646 pass / 0 fail, `bun run build` green.** **No migration is pending from this session** —
nothing here touched the schema, so a Lovable publish picks it all up.

Six commits, oldest first:

| Commit | What |
| --- | --- |
| `ae526cbf` | AgentPulse gains per-action detail; every diff delta goes green and red |
| `c17673c1` | The Build terminal: Monaco removed from the tree, `CodeDiff` on the shared alignment, two-pane split, +20 tests |
| `f874683d` | The last four agent-dispatch surfaces say what they are working on |
| `4f5520a1` | The app-wide wait becomes the mark turning, not the word sitting still |
| `ac5fa966` | **The rules: `surface-discipline.md` + 12 guards + AGENTS.md §3.0e** |
| `9e490f45` | An action stops looking like a label, in one token |

## THE MOST IMPORTANT THING IN THIS SESSION

**Two founder rulings are now repo law, not session memory.** `docs/conventions/surface-discipline.md`,
wired into `AGENTS.md` as **§3.0e** so every tool inherits it, guarded by
`src/__tests__/surface-discipline.test.ts` (16 tests).

1. **THE RATCHET: today's design is the FLOOR.** _"that doesn't mean you need to compromise on
   the look and feel... Don't just compress and shrink it and make it worse. Your baseline is
   what we have today. You need to enhance it on top of that."_ So "reduce the vertical scroll"
   is a request for a BETTER surface, never a smaller one. **Forbidden as an answer:** smaller
   type, stripped padding, capped heights, deleted states, two facts crushed onto one line.
   **Allowed:** use the horizontal axis, collapse what nobody reads, escape the 74ch measure for
   non-prose, delete genuine duplication. The test: would someone who liked yesterday's screen
   prefer today's?
2. **THE STANDARD: Stripe / Google / Anthropic at enterprise B2B scale.** Two halves, and the
   second is the one that gets forgotten: the states nobody screenshots (empty, partial, failed,
   denied, very long, very short, slow) are each COMPOSED not merely handled; and **we are past
   the reskin** — the `--sp-*` system is the built thing, work is fine touches on top, so
   reaching for a new visual language on a surface that already has one is itself a ratchet
   regression however good it looks alone.

The guards were **proven to fail**, not just proven to pass: I planted the exact defect the
founder hit (`overflow: auto` + `max-height: 60vh` back onto the diff body), confirmed the guard
caught it, then reverted. A guard that has only ever passed is worth nothing.

## THE BUILD TERMINAL, and the six corrections that shaped it

Monaco is gone from the tree (`grep -rn monaco src/` returns 0) and out of the bundle. It was a
code EDITOR shipped to display text nobody can edit, pinned at 420px so a three-line change sat
in an empty pane; until its chunk arrived the box was 420px of the words "Reading the diff.", and
if it never arrived it stayed that way. It also computed its OWN diff, so it could disagree with
the per-hunk curation directly underneath it.

`CodeDiff` renders from new pure `diffRows` / `pairDiffRows` in `studio-hunks.ts`, which walk the
SAME `buildSegments` alignment `computeHunks` and `applyHunkSelection` walk. **That is why they
live in that file** — a second alignment beside the renderer would drift, and then rejecting
"hunk 3" in the UI would revert a different three lines on disk.

What the founder corrected, each worth keeping:

- **"I see 1212 twice there."** Two gutters render an unchanged line as "12 12". The reference
  class is unanimous and I had not checked it: Monaco's inline diff, `delta` and Claude Code show
  ONE column, `git diff` shows none. Two gutters are right only in side-by-side.
- **"some sort of icon ... like Claude Code."** Pushed back: that class uses a bare `+`/`-`, no
  icons. What they have and we lacked is a coloured EDGE BAR, which is what makes a changed
  region findable in peripheral vision. Added that instead.
- **"why is it opening below? we need to scroll a lot."** VS Code, Cursor and GitHub all put the
  file list BESIDE the diff. Now a two-pane split, selection derived not effect-driven, no
  deselect.
- **"too congested and tightly placed."** The region was trapped in `.sp-main`'s 74ch measure,
  about 450px, so code clipped mid-token while a third of the window sat empty. Passes `wide` now.
- **"What is this side-by-side heading? It's not going well."** The fault was the SHAPE: a lone
  button labelled with a mode cannot say whether it describes what you see or what you would get.
  Now a two-state `Inline | Split` segment.
- **"the proper enclosing enclosure."** Chrome + body + status line. The path moved INTO the
  chrome, deleting a duplicate header row.

## THREE BUGS I INTRODUCED AND FIXED. The patterns matter more than the fixes.

1. **Nested scroll traps.** `.sp-work` is the page scroller (2229px of content in a 778px
   window). I added two more vertical scrollers inside it at 60vh. Wheeling over the diff scrolled
   the diff and the page stayed still: _"I'm not able to scroll to the end. It's got stuck."_ The
   diff no longer traps the wheel at all; collapsed context keeps its height sane so the cap
   protected nothing. **The LIST sticks instead**, which is the better pattern anyway.
2. **A full-width slot spilled off screen.** I moved the diff region into a slot spanning the
   work column AND the context column to buy 370px. `.sp-inner`'s second track is an **implicit**
   grid column, therefore `auto`-sized, and a spanning child contributes its own max-content to an
   auto track — so `white-space: pre` code sized the track and the grid outgrew its container.
   _"The terminal window basically spills over the screen."_ **Reverted**, with the reason recorded
   in `shell.css` so nobody rebuilds it without sizing both tracks explicitly first.
3. **Viewport media queries inside a pane.** At 1512px a `max-width: 900px` query never fires
   while the pane is 467px. Container queries now.

## A CLAIM OF MINE THAT WAS WRONG, corrected here so it is not inherited

I reported a "real, pre-existing bug: a direct URL load of `/runs/<id>` renders zero blocks."
**It is not real.** A subagent refuted it by sampling a cold load every 60ms across four loads:
the shell and spine strip paint at ~0.8s while the body still reads "Reading the record.", and
all eight blocks commit together at ~4s. Cold load and click-through are identical on three
separate runs. I had measured inside the loading window. Nothing was changed.

It did surface a genuine gap, which is brief item 7: **the loading branch renders a bare
`PageHead` with nothing beneath it, so a 3-second wait looks like an empty page.** Still open.

## THE LOADER

`BrandWait` (`src/components/supaprod/BrandWait.tsx`) wired into `defaultPendingComponent` in
`router.tsx`, which is the loader for **every** route, public and authenticated, so one change
reached all of them. The word "supaprod" is gone; the mark turns instead. Verified centred at
756/430 on a 1512x860 window, exactly half each axis.

Two things found by looking rather than reading: the loader's own full-curve track was
`--hairline-strong` at `opacity 0.22`, an **effective alpha near 0.02** — invisible, so a person
saw only a travelling comet and the seven-petal mark could not be recognised. Fixed to 0.38. And
44px read as lost on a large dark field; it is 76px.

One thing added: a second dimmer comet trailing the first. The bright one is the work going round
the loop; the faint one is the record keeping up. The company's claim in two marks and no copy.

## WHAT IS OPEN, in priority order, and it is all specified

The founder asked for **loop mode**: pick the next item, close it, do not stop to ask.

1. **The audit** feeding items 2 and 4. I have the full subagent prompt written and ready in the
   session; it covers five parts (nested scrollers, viewport-vs-container queries, fixed heights,
   waits that look like nothing, and a per-station verdict for all thirteen surfaces). It is
   READ-ONLY by design so it cannot collide with parallel work.
2. **Space and scroll discipline** across the other six stations — apply the audit output.
3. **Status colour beyond diffs** (brief item 3): coloured threads and mission ids, other hues
   where they carry meaning, never decorating, always surviving greyscale.
4. **Perceived speed** (brief item 7): adopt `BrandWait overlay={false}` where a region waits,
   and make the bare-`PageHead` loading branches say what they are reading.
5. **Left rail auto-collapse** (item 6) once the 01-07 spine is familiar, with instant hover
   tooltips. Needs a persisted familiarity signal.
6. **Unique shapes for missions and cards** (item 4): not square/circle/triangle, monotone,
   premium, and per the founder's refinement only where it makes sense — a UI cleanup, not
   ornament.

**Standing bar on all six:** the ratchet. None of these may make a surface worse to satisfy its
own metric.

## ENVIRONMENT, so tomorrow does not rediscover it

- **No Lovable MCP in this session.** `.kiro/settings/mcp.json` declares it at
  `https://mcp.lovable.dev` but it never came up authenticated. Founder confirmed he holds no
  Supabase credential directly. `.env` DOES hold `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF`
  (untested, he aborted the call).
- **Local dev cannot exercise service-role paths:** `SUPABASE_SERVICE_ROLE_KEY` is absent from
  `.env`; the dev server logs "Missing Supabase environment variable(s)".
- Login that works: `harbor@supaprod.ai` / `Supaprod!Harbor2026`. Dev server runs on **:8081**
  (8080 was taken). Browser viewport left at **1512x860** to match the founder's laptop.
- **Tooling traps that cost real time today:** heredocs (`<<'PY'`, `<<'EOF'`) are unreliable in
  this shell — they silently return stale output or hang, so use `fs_write` for scripts and
  `str_replace` for edits. Multi-file eslint needs
  `cat list | tr '\n' '\0' | xargs -0 npx eslint`; a bare `$VAR` breaks on newlines. **The
  pre-commit hook consumes stdin, so `git commit -F -` with a heredoc fails silently** — write the
  message to `/tmp` and use `-F <file>`. `grep_search` with `includePattern` silently returns zero
  matches; use `grep -rn`. `ripgrep` is not installed.
- The 12 screenshots this session created at the repo root were deleted per
  `workspace-hygiene.md`. **~65 older PNGs from previous sessions remain there** and are
  gitignored; `bun run clean:workspace` is the janitor if anyone wants them gone.

---

# 2026-08-01 evening: the loop delivers, and clusters become work

## PART 1: IS THE ONE-TO-SEVEN SPINE WORKING?

**Yes, end to end, verified on the live system rather than argued from the code.** A real track
walked Plan -> Design -> Build -> Ship -> Learn on its own and finished `status = done`, filing
artifacts and metering its own spend.

It did NOT work this morning. Four independent silent failures, each hiding the next:

1. **The tool was unreachable.** Plan's agent wrote a complete spec into its final answer and never
   called `prd.draft`, because that account had no `agent_tools` row for it and the loop built its
   tool list from that table. 11 of 16 accounts could not draft a spec; `prd.revise`,
   `decision.revise` and `roadmap.move` were reachable by nobody at all.
2. **There was no handoff.** `stationGoal` took only the track's title and origin, so Design never
   saw the spec and Build never saw the design. Seven stations were each handed the same one-line
   brief and asked to invent the rest.
3. **The driver advanced on silence.** A station that ran and filed nothing was indistinguishable
   from one that did its job, so 1 and 2 could never surface.
4. **The loop discarded correct tool calls over one field name.** Models emit
   `{"type":"learning.record","args":{...}}` rather than `{"type":"tool_call","name":"...",...}`.
   `action.name` was undefined, the loop answered "Unknown tool: undefined", and fully-formed calls
   carrying the verdict and reasoning were thrown away. **Only visible by reading a live
   checkpoint** - invisible in code, tests and every status field.

### Everything else shipped today

- **Tools are platform policy, not per-user rows.** `TOOL_REGISTRY` + `src/lib/ai/tools/defaults.ts`
  decide; `agent_tools` holds only per-account DEVIATIONS. A new tool is live for everyone the moment
  it ships; a new account needs no seeding. All seven seed functions are no-op'd in the live DB.
  **Never seed `agent_tools` again.** Adding a tool = registry entry + `TOOL_DEFAULTS` entry, no
  migration; `tools/defaults.test.ts` fails the build if you forget.
- **Every station runs a CREW.** 13 active agents existed and 7 were dispatched. Three genuinely
  missing seats created: `design-critic`, `release-verifier` (runs BEFORE release), `insight-keeper`.
  `driver.test.ts` fails the build if an active agent is in no crew.
- **A spend ceiling on the TRACK** ($5 default), because the run cap bounded ~16 runs separately and
  summed none of them. Control on `/boundary`.
- **A tick deadline**, after finding ticks killed mid-write by the Worker duration limit.
- **`agent_runs.track_id` + `TrackActivity`**: who acted, the handoff, the outcome.
- **`AgentPulse`**: our seven-petal mark turning beside a rotating gerund with running dots.
- **Clusters become work on their own**, the loop's front door, which was shut.

### Known-good live numbers

| --- | --- |
| --- | --- |
| Signals / sources | 308 across 26 |
| Clustered | 307 (99.7%) into 181 themes |
| Cost per agent run | ~$0.03 |
| Full track pass | ~16 runs, ~$0.50 |
| Tests | 6,610 pass, 0 fail |

### THE FIRST THING TO CHECK NEXT SESSION

Promotion has **not yet been observed firing live** - it ships inside `cron.cluster-tick` and needs a
sweep. Verify:

```sql
select id, title, station, theme_id, spend_used_usd
from spine_tracks where theme_id is not null order by created_at desc;
```

**READ THE SCOPE BEFORE JUDGING THE NUMBER.** `MAX_PROMOTIONS_PER_SWEEP` is 2 **per workspace
owner**, and `cron.cluster-tick` processes up to **five workspaces** per invocation. So one tick can
legitimately open up to **ten** tracks, not two. The figure to check against is
`2 x (distinct workspaces in that tick)`, and the tick's response body reports the per-workspace
`started` count so the arithmetic never has to be guessed.

An earlier draft of this handoff said "expect at most 2 per sweep, stop the tick if more appear",
which would have raised a false alarm on correct behaviour and stopped a working feature. Corrected
before close.

## UNCOMMITTED WORK IN THE TREE AT CLOSE

**13 files were modified by another session that was STILL MID-FLIGHT when this one closed, and they
are NOT committed.** They were deliberately left alone rather than swept into a commit by someone who
had not reviewed them (this repo has a standing rule against `git add -A` while other agents are
working).

**DO NOT DISCARD THEM.** This is live, in-progress work on the UX brief below, not an abandoned
tree. Let that session finish and gate its own work:

```
src/components/discover/OpportunityDetailSheet.tsx
src/components/mission/faces.tsx
src/components/shell/AgentPulse.tsx
src/components/shell/primitives.tsx
src/components/studio/ChangesPanel.tsx
src/lib/spine/promote.server.ts
src/lib/spine/promote.ts
src/routes/_authenticated.build.index.tsx
src/routes/_authenticated.decide.tsx
src/routes/_authenticated.design.tsx
src/routes/_authenticated.plan.spec.$id.tsx
src/routes/api/public/hooks/cluster-tick.ts
src/styles/primitives.css
```

They map onto the UX brief below: `faces.tsx` is mission shapes (item 4), `ChangesPanel.tsx` is the
Build terminal (item 2), `AgentPulse.tsx` and `primitives.css` are item 1, and the four station
routes are the surface pass (item 5).

**Before trusting them, run the full gate:** `bunx tsc --noEmit`, `bun run lint`, `bun test`,
`bun run build`. Everything committed through `1c0d046f` is gated and green; these are not yet.
If that session did not finish, pick its work up rather than restarting the item from scratch.

## PART 2: THE OPEN UX BRIEF (founder, 2026-08-01)

**Why it matters, his words:** _"If you don't have the live indicator it feels very static and we do
not realize what is happening in the background. The user would churn, there is no stickiness. And as
a founder, if I myself know what to do, I need to figure out where it is moving, what is the journey.
After this what happens, where did it move, where should I find that. That is still a mystery and a
little chaos."_

Standing bar: **premium but never force-fitted**, and a quick glance must not put cognitive load on
the reader.

1. **Wire `AgentPulse` across every agent-running surface**, plus per-action detail (which file,
   which line, which mockup, what moved to memory). Built, but wired into `TrackActivity` ONLY. 64
   files use `<Loading>`; pass `working` only where an agent genuinely runs or the indicator lies.
2. **The Build terminal - the biggest one.** Wrong shape, unexplained blank space above it, does not
   show what changed. Lift Claude Code's diff view; it must sit inline or side by side with the file
   and change with the selection.
3. **Status colour everywhere.** Red/green per added/deleted line, coloured threads and mission ids.
   **Not limited to red/green** - other hues welcome if subtle and carrying meaning, never decorating.
4. **Unique shapes for missions and cards.** Not square/circle/triangle. Monotone background,
   premium. Founder's refinement: _thoughtfully placed, only where it makes sense_ - a UI/UX cleanup,
   not ornament.
5. **Space and scroll discipline** across all seven surfaces.
6. **Left rail auto-collapses** once the 01-07 spine is familiar, with instant hover tooltips.
7. **Perceived speed** on strips and messages.

---

# 2026-08-01, the spine depth pass: Discover done, Decide connected, the route modelled

## WHERE WE STAND

Shipped through `eee24a54`. Every commit gated: tsc 0, build green, lint clean, 6439 tests
(6356 pass, 0 fail; +32 new from the route model).

### Three founder doctrines are now in the repo, not just in a session

Written into `AGENTS.md` (canonical), `CLAUDE.md` and `README.md` so every tool inherits them:

1. **The six-month-forward doctrine.** Design for where the industry will be in six months.
   Five tests: assume the model layer commoditizes; assume a vendor ships our vertical next
   quarter and name what we still have; agentic-first not agent-assisted; solve backwards and
   forwards; delight is a requirement.
2. **Copy the proven pattern per surface.** Research the best product in the category and lift
   its information model and verbs outright. Named references: Build to Cursor / Claude Code,
   Design to Figma's fidelity ladder, Discover to Sentry's issue stream + Linear's triage.
3. **The design baseline is production, not Tempo.** `docs/design/archive/tempo-v5.md`, the `supaprod-tempo`
   and `supaprod-design` skills are LEGACY and below standard. The real system is
   `src/styles/ink.css` (`--sp-*`), `src/styles/primitives.css`, `src/components/shell/primitives.tsx`,
   and the binding standard is `docs/conventions/anti-slop.md`. **CLAUDE.md still points at
   DESIGN-TEMPO in several places; those pointers are stale and should be cleaned up.**

### ✅ Discover, the full depth pass

The founder's read was right, and the evidence is harder than "it feels shallow": the depth was
already in the database and the surface rendered almost none of it.

| Was | Now |
| --- | --- |
| sorted on raw `frequency` | ranks by `scoreTheme()` (severity x recency x novelty), which was pure, unit-tested and unused for a month |
| `novelty` + `novelty_basis` computed on every theme, never rendered | the `Record` speaks at Discover, one station before the call gets expensive |
| one verb (promote) | 1 keep / 2 add-to-existing-bet / 3 not-a-pattern, digit keys per Linear |
| Gate said "this evidence travels with it", and it did not | per-signal lineage edges + the theme's product scope now travel |
| `toast.success` on the one loop-advancing act | `Receipt` with the real evidence count (anti-slop.md 5) |
| no way to ask "am I seeing everything" | source coverage, incl. sources that went quiet |
| unattended sensing built end to end with no switch anywhere | the boundary is one `Line` + `Switch` on the station itself |

Deliberately NOT copied from the reference class: a numeric confidence score. No product in
that category ships one (Enterpret says so outright); evidence and reversibility are what
people act on.

### ✅ The spine is a route, not a conveyor (`src/lib/spine/route.ts`, 32 tests)

There was **no station model at all** before this: no `advanceStation`, no `nextStation`
anywhere in `src/`. A transition was a client-side `useNavigate` call, and the spine strip's
unit is a MISSION, which only exists once work reaches Build, so the first four stations had no
run-level representation whatsoever.

**Pushback taken, and recorded in the module header rather than made quietly.** The founder
asked to pick stations up front ("I'll select the two, three, and five, and seven"). The
requirement is right; the mechanism is not, because it asks for a routing decision at the
moment you know least, and a ticked checklist cannot reopen itself when "backend only, skip
Design" turns out to be wrong. So stations are **waived, not skipped**: every waiver carries a
reason and a trigger, and `applyTrigger` reopens Design automatically the moment the work
touches an interface. A human hard waiver (`reopensWhen: "never"`) is honoured exactly, so the
literal ask survives as a manual override.

**The origin rule** is the part nobody asked for and the record needs: work entering below
Discover has no evidence behind it, so Learn would have nothing to grade against.
`validateRoute` refuses such a route until it states where it came from. Without it the
compounding record develops a hole exactly where most real work happens, on existing products.

**Not yet wired into any surface.** The pure core and its tests are done; the surfaces still
navigate directly.

### ✅ Decide, the handoff both ways

- Renders the actual verbatim signals via `getProvenance`, which reaches root signals now that
  promote writes direct signal to opportunity edges. Before, the entire evidence display was a
  stale integer written once at cluster time.
- `generatePrd` now places the opportunity in `next`, so **Decide's promise "moves it into
  Plan" is finally true.** Nothing in `src/` had ever written `roadmap_bucket`, and Plan's
  committed set is `items.filter(i => i.bucket !== null)`.
- `LineageDrawer` gated provenance on `depth > 1`, which hid the evidence precisely when the
  chain was shortest and most direct. Fixed.

### ✅ Two live UX defects the founder caught

- **Selection was invisible.** Both surfaces filtered the selected row OUT of the list, so the
  Gate changed with nothing connecting it to the row you pressed. The row now stays and wears
  `focused` (which `Row` already supported and neither surface used), plus an "N of M in the
  ranking" line on the Gate.
- **Discover's ranking was uncapped** (Decide already had an expand). Capped at six with
  "Show all N", the same gesture on both.

### ✅ All seven stations touched, in spine order

| Station | What this session did |
| --- | --- |
| **Discover** | full depth pass, see the table above |
| **Decide** | renders the real evidence via `getProvenance`; 3 success toasts became Receipts; selection stays visible |
| **Plan** | the Gate now PERFORMS the write it names (commit ceremony + Receipt) instead of scrolling to it |
| **Design** | verified already deep: 10 mutations, 3 gates, the fidelity ladder present, zero toast.success. No change needed. |
| **Build** | the spend ceiling made visible and settable, on the station where agents spend |
| **Ship** | publishing renders its public address as a real link, not a toast reading "It is live." |
| **Learn** | verified already deep: writes in `SettlePanel`, pre-committed projection, Receipt. No change needed. |

Two audit claims were WRONG and are corrected here, having been checked against the code:
Plan is not a read-only surface (`RoadmapColumns` carries five mutations), and Build's rows ARE
clickable into their run and it does have a "Waiting on you" block.

### ✅ The spine survives a detail record

Founder ruling: the strip must stay on screen when you drill into a sub-item, so you always know
which station you are in. `/plan/spec/$id` now publishes `define`; it was the one real gap
(`/build/$missionId` is a redirect, not a surface).

### ✅ The receipt-rule sweep, all seven stations

Design, Learn, Plan and Build were already clean. Ship and Decide were fixed. The rule's narrow
exception was applied deliberately twice: Ship's draft-save and Decide's draft-spec keep their
toasts, because in both cases the changed surface (or the navigation to the artifact) IS the
receipt.

## WHAT IS LEFT, and it is specified

**The route model is built and not yet wired.** `src/lib/spine/route.ts` is pure, total and
tested, and no surface calls it yet. Wiring it is the next substantial piece: a run carries a
`SpineRoute`, the handoff uses `nextStation`, and a waived station shows its reason and its way
back. That needs a persistence decision first, because no single entity walks all seven stations
today (signal, theme, opportunity, prd, prototype, mission, deployment, learning are eight tables
chained by `artifact_lineage`).

**Cross-cutting, fix once not five times:**

- `CtxHead` / `CtxBody` / `CtxRow` exist and several surfaces still hand-write raw `sp-ctx-*`
  divs. Counted 2026-08-01: **Decide 20, Design 7, Plan 4, Ship 2**, Discover 0 (converted),
  Build 0, Learn 0. Mechanical but with real regression surface, so it wants its own commit.
- `ago()` is duplicated verbatim in `decide.tsx:117` and `plan.index.tsx:125`.
- `OpportunityDetailSheet` is built on the legacy shadcn `Sheet`, which `primitives.tsx:13`
  explicitly bans ("DELIBERATELY ABSENT: a pane, a slide-over, a drawer").
- No table, meter, trend indicator, sparkline, or confidence bar exists in the `sp-*` system.
- `README.md` says "six stations"; the app ships seven (Design is missing from the doc).
- **`default_mission_spend_cap_usd` has NO UI anywhere.** The engine fix landed
  (`src/lib/ai/mission-caps.server.ts`), but the single most important governance control is
  invisible to the human. GOVERNANCE-PRINCIPLE.md's "a new first-class surface: the boundary"
  is still unbuilt.
- `signals.embedding` exists on the table but is never written, so `match_signals` returns
  nothing. `src/lib/brain/insights.functions.ts` is built, unit-tested, and imported by nothing.

**Known-blocked, recorded rather than pretended:** conditional decline on Discover ("archive
until it escalates", the Sentry pattern) needs clustering to merge into EXISTING themes.
`clusterSignalsCore` only reads signals with a null `theme_id` and only creates new ones, so a
dismissed cluster can never grow and `last_signal_at` is frozen at creation.

## PROCESS NOTE, learned the hard way

**Workflow subagents dispatched to "audit" will edit files and run `git commit` on their own.**
One lane committed `e2ea817d` autonomously; another's edits were swept into an unrelated commit
by `git add -A`. Both contained exactly the defects this session exists to remove (a raw cosine
printed as "72% match", a workspace-wide count presented as a claim about one bet). Constrain
tools, never `git add -A` while a workflow runs, and check `git log --format="%h %an %s"`
before committing.

---

# 2026-07-31, the accelerator campaign: four filed in a day

## WHERE WE STAND

### ✅ Submitted, now waiting

| Program | Filed | Decision | Login spent | Open item |
| --- | --- | --- | --- | --- |
| **Y Combinator F26** | 07-23 | rolling | `explore@` | **Demo + founder video still need updating.** Founder video is 2:37 against their 1:00 rule. |
| **The Residency** | 07-31 | **by 08-28** | none given | none |
| **Betaworks AI Camp** | 07-31 | rolling, batch starts 08-31 | `compass@` | none |
| **South Park Commons** | 07-31 | **invites by 08-30** | `voyage@` | Q10 needs a truth check, see below |

### 🟡 Drafted, waiting on the founder

**EF The Bridge Residency, San Francisco. Deadline 2026-08-30, rolling review so earlier is better.**
`docs/pitch/applications/ef-bridge-sf/`. All fourteen page-1 answers written and verified under the **100-word cap** on every field. Three things outstanding:

1. **A new one-minute video.** EF says "do not pitch an idea or a CV", so the Betaworks founder video cannot be reused. Script is at the bottom of `application.md`, 131 words, names no company or product.
2. **Two references**, one senior. Suggested: an Intellect manager who saw the 0-to-100K platform, and someone from ISRO who can confirm the moved-into-product story, which makes that answer verifiable rather than merely well told. **Message them before submitting.**
3. **Page 2 ("Your Details") has not been captured.** Founder screenshots it, then it gets drafted.

### ⬜ Next in the queue

**Dated:** Sequoia Arc (08-17) · Berkeley SkyDeck (08-21) · Hub71 (08-21) · Slush (08-31)
**Rolling, high value:** Emergent Ventures (equity-free, replies in about a week) · Alchemist (enterprise-only, welcomes solo founders in writing) · Peak XV Surge · Accel Atoms · Z Fellows · Conviction Embed · a16z Speedrun (accepts off-cycle any time)
**One hour, near-certain, keeps getting deferred:** the credits batch. Cloudflare, Microsoft, AWS Activate, Google Cloud, Anthropic, NVIDIA. Structure-agnostic, no entity needed.

**Decided against:** EF London (08-04). Same organisation as The Bridge, wrong geography under the US-primary ruling, no visa help. One EF application plus a note about their US Funding and Fellowships track beats two.

## TWO CONSTRAINTS THAT BITE NEXT SESSION

**Demo logins: three of five are spent.** `explore@` (YC), `voyage@` (SPC), `compass@` (Betaworks). Only `meridian@` and `lantern@` remain, and four dated applications are still ahead of them. **Clone more workspaces before promising a login to a third program**, pattern in `supabase/migrations/20260725140000_clone_helio_to_investor_workspaces.sql`. Sharing one hands the second reviewer an emptied approval queue, which is the exact beat these applications are built around.

**The YC founder video is still 2:37 against a 1:00 rule.** Speed cannot fix it; you would need 2.89x. It needs a re-record against a ~130-word cut, and it is the one open item on an application already in front of partners.

## WHAT THE FOUNDER RULED TODAY (all now in the doctrine)

Everything below lives in `docs/pitch/applications/POSITIONING-DOCTRINE.md` and `answer-bank.md`. Read those before drafting anything.

- **Rule 4, lead with the person not the market.** The company exists because people get blamed for decisions nobody can reconstruct. Dignity problem before efficiency problem.
- **Rule 5, three layers in order, and the brain guides rather than stores.** Director (tells you what to build, the sharpest claim), operating system (runs the lifecycle), company brain (warns you before you repeat what did not work). "Memory is one layer of the moat, not the headline." Banned: "where the record lives", "the accountability layer" as the whole pitch.
- **Rule 6, the commit count is per-surface.** Fine at YC, SPC and Betaworks; wrong at a builder house. **Never adjacent to "agents wrote the code"**, or the number appears to measure them. Framing that works: "4,297 commits directed and reviewed."
- **The 50-character line depends on the audience.** "Cursor for PMs" for investors; never for builder audiences, where "product manager" is not aspirational. Always name the actor, a verb-first fragment leaves the reader asking what knows. Never close on "remember".
- **Never imply he is not talking to users.** The single thing every accelerator screens hardest for. An early six-month-goals draft said "nobody telling me I am wrong" and read as exactly that.
- **Never open an answer on a negative.** Zero-users belongs at the end of a list, framed as sequencing.
- **Formatting:** paste blocks are reflowed so paragraphs are single lines. Rule is kill mid-sentence wraps, keep deliberate breaks (numbered items, URLs, logins). An earlier blanket-join folded a demo login into the sentence above it.

## VIDEO ASSETS, WHERE THEY ARE

All under `~/Library/Mobile Documents/com~apple~CloudDocs/Supaprod/`.

| | Location | State |
| --- | --- | --- |
| Betaworks x3 | `Beatworks/FINAL/` | Done, 1.15x, all under 2:00 (1:47, 1:40, 1:49). Video 2 has a 1s cut at the original 1:08-1:09. |
| YC founder | `YC/FINAL/` | 1.1x, **2:37, still over their 1:00 rule** |
| YC demo | `YC/FINAL/` | 1.25x, 3:52, over the 3:00 guidance. 1.62x would hit 3:00 exactly if wanted. |
| EF Bridge | not recorded | Fresh 1-minute "who you are" take needed |

Originals untouched in the parent folders. `ffmpeg` recipe used: `setpts=PTS/N` + `atempo=N`, CRF 15, preset slow, `+faststart`.

## THINGS TO VERIFY, NOT ASSUME

1. **SPC Q10, the four discarded versions.** The account submitted (dashboard, then agents he could not trust, then gates with nothing remembering) was **reconstructed from his own written record**, not dictated by him. A partner may ask which version was which. Confirm before any interview.
2. **The hero tagline still ends on "remember".** It is on the deck, the site and every external surface, and it is the same weak word he corrected twice today. Founder-locked, so it was flagged rather than changed. Worth a decision.
3. **`/brief` renders inside an iframe** from `/brief.html`. Fine for humans, invisible to crawlers that do not follow iframes. SEO nit, not an application risk. An earlier "it is broken" alarm was a bad measurement.

## THE CAMPAIGN FILES

`docs/pitch/applications/` is the whole thing.

| File | What it is |
| --- | --- |
| `README.md` | Master index: submitted, urgent queue, rolling, credits, closed, login ledger |
| `positioning-doctrine.md` | **Read first.** How we get selected. Six rules, asset ledger, per-program axis, quality gate |
| `answer-bank.md` | Reusable answers at every length, live numbers, login allocation |
| `TRACKER-notion.csv` / `TRACKER.csv` | 124 programs, typed columns |
| `board.html` | Read-only dashboard, also published as an artifact |
| `<program>/` | POSITIONING, application, HOW-TO-APPLY per program |

**Notion database:** `https://app.notion.com/p/4014ff9cb1c240c9a3b761e790852970` — 67 programs, four views (Deadlines, Calendar, Equity-free, By status). The Notion MCP is installed and working.

**Live numbers as of 2026-08-01:** 4,297 commits · 410 migrations · 401 specced / 362 shipped · 8 weeks · zero external users · zero revenue. Re-pull before every submit.

---

# 2026-07-30, the spine, the lineage graph, and one disease named

## THE FOUNDER'S OPEN CALLS (do these first)

0. **RESOLVED 20:35 IST, but read it: the demo-id scatter (20260730150000) was
   REVERTED by 20260730203000, applied live.** It broke cloning outright.
   `clone_demo_workspace` does NOT clone the `projects` table (verified:
   `pg_get_functiondef` contains no `into public.projects`), so the four demo
   products already exist per workspace with PASTED ids. Under the scatter,
   every product foreign key pointed at a derived row nothing ever creates, and
   the clone died on `themes_product_id_fkey`. Transactional, so nothing was
   left half-built, but every clone failed while it was live. `harbor@` has
   since been re-cloned successfully and is whole (22 opps, 20 missions, 25
   decisions, 16 themes, 4 projects, 3 pending approvals). **Demo tags still
   collide, and that is the accepted trade**, because the collision is already
   neutralised in code: `getEntityLineage` returns `ambiguous` and refuses to
   pick. To revive the scatter, first make the clone own `projects`.
   `demo_derive_id` is left in place for that.
1. **`AI_PROVIDER_FALLBACK=1` is set locally and OFF in production.** With it, a
   hard-failed model degrades to the next candidate; without it the whole Ask
   fails as "I hit a snag". Recommendation: set it in production rather than
   pinning a model, because pinning goes stale the next time a vendor retires
   something, which is exactly what happened to `gemini-2.5-pro` today.
2. **Do not re-clone `explore@` before a YC look.** Cloning works again, but it
   wipes and rebuilds a workspace and resets its pending approval queue, which
   is the demo's signature beat. `harbor@` is the disposable rehearsal account.
3. FIXED (02ced1aa): the roadmap snapshot now reads `roadmap_bucket`, and
   `architecture/data.md` no longer lists a `roadmap_items` table that never
   existed. That doc line was the source of four broken code maps.

## THE DISEASE, and it is the most useful thing to carry forward

**Capability built, door missing.** Eleven instances surfaced in one day, all
the same shape: the server logic is finished and correct, and the four lines
that put it on screen were deferred as trivial. Every one of them reads as "not
built" to anyone using the product.

The seven-stage strip nothing published. Build, whose route was a redirect onto
a different axis. The agent the header could not name. A complete theme system
with no switch. A chevron with no menu. **Sign-out reachable from one retired
component, so the shipped shell could not log out.** Voice wired into a hook the
pane never rendered. A lineage sheet written 17 days earlier and never mounted.
`findAuditIds` with zero callers. `/artifacts`, 575 redesigned lines nobody
could reach. The `deprecated`/`replacement` mechanism in `models.ts`, built for
exactly today's problem and never used once.

**This is now a build failure, not a discovery.** `route-inventory.test.ts`
gained an authenticated half (`d20bb171`). The rule that makes it work: **a link
from a RETIRED surface does not count.** `/artifacts` WAS linked, from
`MissionShell.tsx`, so a naive inbound-link check would have passed it green
every day it was unreachable. `RETIRED_LINKERS` names those files, so retiring a
surface immediately tells you what it was the last door to. Proven to fail by
planting an orphan route, not just proven to pass.

## What shipped, by theme

**The spine.** The 01-07 strip reaches every station and Build finally has a
room (`293cac75`). `/build` was a 28-line redirect to `/runs`, which is a
DIFFERENT AXIS: `/runs` lists runs, one piece of work walking all seven stages.
Six stations had real surfaces; Build had none, and the redirect was perfect
camouflage because the URL answered and a real page appeared. One shared
`useSpineStrip` hook, seven surfaces, one query.

**The shell.** Board in one click, plus three controls that were lying
(`664d1437`): `IconGear` was drawn as a SUN sitting where every app puts a theme
toggle, so the founder pressed the theme switcher and got Settings and reported
it broken. He was reading the icon correctly. The scope chevron promised a menu
and delivered a navigation. And `auth.signOut` was called in exactly one file in
the repo, inside the retired chrome.

**The status line** (`ae208325`) says a true thing, fits it, and goes where it
points. Measured: header 1600px, line pinned to 680 by a max-width, title needed
553 and got 386, **446 pixels sitting empty**. `flex: 1` was asking and the cap
was refusing. Clicking it went to `/runs` from every state, so pressing "21
calls need you" landed on a list of runs.

**One blink, enforced in the primitive.** `MarkStack` took ONE state and applied
it to every agent, so a stack of four asked for `gate` blinked four marks in
unison, which is precisely the failure the rule was written after, reproduced by
the component the rule governs. A rule every caller must remember is a rule that
gets forgotten, and this one already had been.

**Reliability** (`09d49396`). A run sat `status='running'` for FIFTEEN DAYS with
zero tokens and no checkpoint. `resume-runs` could not help: its only give-up
path is scoped to missions that never PLANNED (`stepCount > 0` continues), so
the shape most likely to be genuinely stuck had no ceiling at all. The measure
is PROGRESS, never age, and `waiting_approval` is never swept because it is
waiting on a human, legitimately, for days.

**The lineage graph**, end to end. `walkLineage` (pure, both directions),
`getLineageGraph` (resolver), the ported pane, and three doors. 43 real edges on
the founder's workspace spanning `theme -> opportunity -> decision -> prd ->
mission -> changeset -> deployment -> learning`, including the loop closing back
(`learning -> decision`).

**Ask** rebuilt: markdown rendered at ONE boundary every message crosses, a
working indicator, a fresh pane that shows no approvals until asked, starters
grounded in real workspace state, a conversation switcher, the mic, thin
scrollbars, and Cmd+J removed so one box has one key.

## THE TRAPS, and these are what a future lane will actually hit

- **Two vocabularies, no reconciliation.** `ARTIFACT_KINDS` says `prd`;
  `AUDIT_KINDS` says `spec` for the same thing. NEITHER contains `changeset` or
  `deployment`, and both are in live data. A walk validated against either drops
  `mission -> changeset -> deployment -> learning`, the ENTIRE forward chain,
  answering "this caused nothing" about a mission that shipped. `lineage-graph`
  is deliberately vocabulary-agnostic. **An audit tag resolves to `spec` and no
  edge ever says `spec`**, so focus kind must come from the EDGE TABLE.
- **Six hex characters collide.** `OPP·600000` matched SIX real opportunities and
  `MIS·600000` matched THREE. The old resolver returned whichever came first,
  with a real title and a real chain, and nothing said it had chosen. **I
  "verified" the pane against MIS·600000 and reported it resolved to one
  mission. That was a coin flip.** The failure was invisible because a wrong
  answer looked exactly like a right one.
- **`tsc` does not typecheck `.select()` strings.** Cost several runtime bugs
  today. `agent_runs` has no `updated_at`; `mission_steps` has no `title`. A
  wrong column returns null data and reads as "zero rows".
- **`roadmap_items` never existed** in any migration. Four files mapped to it.
  Removed, not remapped, because `roadmap_bucket` is NULL on all 21
  opportunities, so a remap would have resolved 100% of hits to wrong rows while
  looking like it worked. Truth now lives once in `lib/artifact-tables.ts`.
- **`activeModelId` runs BEFORE capability routing**, so a dead model id must be
  removed from `capability.ts` too or the deprecation mechanism never sees it.

## READING A DIFF IS NOT RUNNING IT

The scatter above is the sharpest example of the day. The migration was
reviewed, its arithmetic verified, and its FK claim reasoned about in writing.
It still could not work, for a reason invisible in the diff: a table the clone
does not touch. Diagnosing it from the code produced a plausible cause
(predicate mismatch between the two remappers, which was real and which I
fixed) that was NOT the cause. Only running the clone produced the true one.

Anything that writes to a database gets executed against real data before it is
believed, and a founder-applied migration is not evidence it works.

## ON VERIFICATION, learned the hard way

Two of four browser verifications today were **true about what I saw and wrong
about what it meant**: the ambiguous tag above, and "feeding ids into chunkRefs
lights the record register" (it only did on the FAILURE path; the success path
was suppressed by a web-mode gate). Seeing it work is not the same as knowing
what worked.

Subagent self-reports drifted too: one reported a test count of 6227 for three
consecutive rounds while the tree was at 6310, and described a 3-line diff as an
architecture rebuild. **A number moving the wrong direction is the cheapest
signal that a report describes a different moment than the one you are in.**

## COORDINATION, the mistake to not repeat

Telling a subagent "do not commit" while the parent commits the shared working
tree is an incoherent instruction, and it entangled two lanes in one commit.
Either the parent stages **precise paths** and never `git add -A`, or the lane
owns its own commit.

---

# 2026-07-29 evening, the run spine and the parallel sweep

## State: green, and pushed

`main` is at `b54482dd`. Working tree clean. tsc 0, build 0. Every lane below is
committed and pushed to `origin/main`.

## What the founder found, and what it actually was

The founder opened localhost and reported that the run section still rendered in the
legacy design. That was exactly right, and the cause was one line:
`AppFrame.tsx`'s rail pointed **Runs** at `/m`, which is Mission Control, the single
surface the rebuild never ported. So the primary nav row for the engine's spine landed
on the legacy five-region shell.

They also asked whether a run is only the build leg. It is not, and the code already
agreed: `missions.current_agent_id` can be any of the thirteen agents, and
`/build/$missionId` already branched to `MissionOrchestratorDetail` for missions with no
builder run at all. The route was named Build purely as a leftover of the
Builder to Studio to Build rename, and the name was telling users the spine covered one
stage of seven.

## What shipped

**The run spine.**
- `/build` is now `/runs`. `/build/*` stays alive permanently as a redirect carrying
  search state, per this repo's rule that an existing URL keeps working.
- The seven-stage strip belongs to a run. The shell owns the region, the run owns the
  content: a surface publishes through `src/components/shell/run-strip.tsx` and only a
  run does, so the strip is always there on a run and nowhere else. It was previously
  drawn on every route, hidden by default, and showed workspace-wide activity rather
  than one run's progress, which is the inverse of the founder's ruling.
- The chips are a segmented control. Clicking 05 swaps the work region to Build for this
  run; you never leave the run to walk its own lifecycle.
- `src/lib/run-stages.functions.ts` reads the other six from the record, walking
  mission to changeset to prd to opportunity / decision / flow / scaffold / learning.
- The diffstat states LINES. It stated characters, which is not a diff: a line rewritten
  to the same length nets to zero, and so do two lines swapped. New pure `diffStat` in
  `studio-hunks.ts` sums the same `computeHunks` alignment the Changes tab renders from,
  so the headline cannot drift from the hunks underneath it. 7 new tests.
- The Runs board: a second view, columns by work state (In plan / Working / Waiting on
  you / Done / Stopped), measured in a headless browser. Five columns at 1440 and 1366,
  three below 1040px of board width, zero horizontal overflow at any width.

**The surfaces.** Crew became where you govern (autonomy dial, tool-reach cap, enable
switch moved from Settings; per-tool controls drawn only where `resolveToolMode` would
honour them). Settings and Sources were redesigned, Sources splitting into what the crew
reads and what you can add. Brain gained a reader for house rules and the recall line,
both of which were being written and read by nothing.

**The design system.** `Grid`, `Cell`, `Choices`, `Checkbox`, `Value`, and `htmlFor` on
`Line`, closing gaps three lanes each worked around by hand. Seven components ported off
the retired system, nine orphans deleted.

## Bugs found on the way, all fixed

1. **`trust.server.ts` held opposite defaults for one column.** `loadAgentArc`, what the
   loop calls, returns `trusted` when no `agent_autonomy` row exists per the 2026-07-08
   founder ruling. `computeAllAgentTrust` returned `observing`. Every workspace that
   never touched the dial was told its crew was on probation while the loop ran it
   autonomously.
2. **`agent-fleet.ts`'s `RUN_STATE` had no entry for `"complete"`**, which is what
   `runAgent` writes on success, so finished runs bucketed as "other" and went uncounted.
3. **`TeamCard` rendered "No invitations yet" on a FAILED read**, a lie about the
   workspace. `MembersCard`'s error said "Try again" with nothing to click.
4. Two Supabase selects named columns that do not exist (`opportunities.evidence_count`,
   `studio_changesets.file_count`). Both typechecked clean.

## THE TRAP THAT CAUGHT THIS SESSION THREE TIMES, READ THIS

**`tsc` does not catch a bad Supabase select string.** `.select("a,b,c")` is a plain
string in the generated types, so a wrong column name typechecks perfectly and fails at
runtime. Verify every selected column against `src/integrations/supabase/types.ts`
directly. `file_count` is the nastiest case: it LOOKS real because it is a field on the
`StudioChangesetSummary` TypeScript type, but it is computed from child rows, not stored.

**Second trap: `src/styles.css` is a FILE beside the `src/styles/` DIRECTORY.** A grep
over `src/styles/` misses the 122KB root stylesheet and will tell you that `bento`,
`mono-label`, `--hairline`, `--madder` and `--moss` are dead. They are not; they resolve,
and they resolve dark. One commit message in this session says otherwise and is corrected
by the next.

**Third trap: `styles.css:2174` has an unlayered `[data-obsidian] :focus-visible` with
`box-shadow: none`**, and it sits after `primitives.css` in source order. So a focus ring
written in `primitives.css` is inert, and any box-shadow on a focused element is erased.
Five rules in `primitives.css` are currently inert because of this.

## Open, and waiting on the founder

1. **Mission Control: harvest then retire, or retire now?** After the rail repoint there
   is exactly one live door left into the legacy shell: the composer, when you pick a
   journey, opens the per-product stage canvas. Retiring it is NOT a deletion.
   `faces.tsx` is 102KB of eight real stage canvases (Evidence, Decision, Spec,
   Prototype, Code, Ship, Growth), and they are product-scoped where the new strip is
   run-scoped, so one does not simply replace the other. Recommendation: harvest the
   faces for the depth the stage panels need, then retire.
2. **The success-toast rule.** `docs/conventions/anti-slop.md` does NOT ban success
   toasts, despite several briefs in this session claiming it does. The doctrine is real
   (agents/FINAL-agent-presence.md R10, "the Commit": settling a call writes a receipt
   showing what it caused, not a toast confirming the click registered) but it lives
   elsewhere. Meanwhile `_authenticated.settings.tsx` has 10 `toast.success` calls.
   Either write the rule into anti-slop.md and sweep Settings, or accept toasts outside
   the run surfaces.
3. **97 failing tests, all pre-existing.** They assert the inline-style anatomy of
   design-system components no lane touched (`src/components/discover/DetailKit`,
   `StatCell`, `SignalCard`, `StatusPill`), plus a guardrail for the superseded
   DESIGN-TEMPO contract. The 20 tests covering files changed this session pass. They
   need updating or deleting; 97 red is how a real regression hides.

## The sweep, as measured rather than assumed

Every `_authenticated.*` route was surveyed. **All of them are ported except the three
Mission Control routes** (`m.index`, `m.$productId`, `$workspaceSlug.$productSlug`), and
that is a founder decision, not a port. The nine `/admin` children landed last, in two
parallel lanes.

The six stage panels are no longer thin: each reads real evidence for its stage on that
run, from a named table, with empty states that distinguish "nothing happened" from "no
link from this run to it".

## Verified in a browser, not just by tsc

Signed in as `harbor@` at 1440 and looked. This caught what grepping had missed: FOUR more
live doors into the legacy room, including the post-login landing itself. It also caught a
bug I had written, where the active stage chip used a box-shadow that the app-wide
focus rule erases, so it deleted its own indicator on the click that set it.

**The lesson worth keeping: a grep over call sites found one door; opening the app found
five.**

`/admin`'s six ported children could NOT be visually verified: `harbor@` is not an admin
and claiming admin is a real write on a shared account.

## Open, and waiting on the founder

4. **The demo reset button is dead.** `admin_reset_demo_workspace` raises "Safety gate:
   not a redcadence.app workspace", but the demo logins moved to `@supaprod.ai` on
   2026-07-25. It throws for every account it is offered on. The lane correctly refused to
   loosen the client check, which would have drawn a button the database rejects. The fix
   is a migration. This matters because `harbor@` is what the demo script rehearses on.
5. **The routing pin records a decision the engine ignores.** `routing.pin.*` is written by
   a real server function, and `runtime.server.ts` has zero references to it, so models
   resolve through `capability.ts` regardless. The control was kept and now says so
   plainly. Wiring it is a chokepoint edit, which is founder-attended by convention.

## Primitive gaps three separate lanes hit independently

- **`Row` cannot own an expanded detail.** Three lanes each reached for a wrapper div,
  which silently kills the `.sp-row + .sp-row` divider because an adjacent-sibling
  selector does not see through a wrapper. Same trap, three times.
- **`.sp-tabs`/`.sp-tab` have no component.** Six routes hand-write the same
  `role="tablist"` markup.
- `Field` has no second line; `Empty` is drifting into a general quiet-note slot; `Row`'s
  `time` prop is now carrying trailing metrics its name does not describe.

## Parked, founder's call, 2026-07-30: PM language beyond Ask's starters

The founder asked for product-manager vocabulary in Ask's starter templates: impact,
quarter, roadmap, bets, what the agent is doing, "slightly on the business side", so a
power user feels the platform was built for them. He then scoped it deliberately:

> "Whatever I've said, that is only from a starter perspective of task panel, what we are
> giving you starter template messages, what to pick. Only from that perspective, not
> across the entire product surface. If you're not touched upon, let's not pick that right
> now. But anyways, make a note of it. Later on, we'll come back."

**Done, and confined to Ask.** `src/lib/ask-starters.ts` (plus its consumer `AskPane.tsx`
and its test) is the ONLY place this landed. Verified by grep: nothing else in the tree
references `contextualStarters` or the prompt sets. No other surface's copy was touched.

**The open question, for later.** The same two rulings would apply to every surface that
speaks to a PM in the product's own vocabulary rather than theirs: empty states, gate
questions, run summaries, Today's headline. Two things to carry over when we do:

1. **Business framing, workspace facts.** PM language pulls hard toward metrics we do not
   store (revenue, ARR, NPS, MAU, conversion, LTV). A line promising one teaches a PM in a
   single press that the product talks a good game and cannot answer. `ask-starters.test.ts`
   has the banned-metric guard; whatever comes next should inherit it rather than reinvent
   it. What we CAN settle: decisions and rationale, outcome verdicts (VALIDATED / MISSED via
   `loadDecisionPrecedent`, which is what makes "did this bet pay off" a real question),
   ICE-ranked opportunities, signal clusters, specs, runs with steps and metered cost, the
   approvals queue.
2. **Never a static message.** His stronger ruling, and it is architectural rather than
   editorial: copy must derive from the surface the person is standing on. Ask does this by
   deriving its offers from the same scope resolution that feeds the header chip
   (`contextualStarters({ scopeKind, scopeLabel })`), so the chip and the suggestions are one
   fact said twice. Any surface that adopts PM voice should adopt that shape too, or it will
   drift back into a hand-written constant within a release.

---

## 2026-08-01 (afternoon): the boundary made legible, and work that enters anywhere

Four things shipped after the Boundary surface (`ffc1cc57`). All pushed to `main`, all
gated on tsc + lint + `bun test` 0 fail + `bun run build` green.

| Commit | What |
| --- | --- |
| `b1f0a268` | the declined ledger, on `/boundary` |
| `957a6978` | the graduation offer moved out of the approvals queue onto `/boundary` |
| `74f35070` | design provenance: which of your rules shaped a drawing |
| `cb79d9ca` | the spine track: work enters the loop anywhere, carrying its route |

### The pattern that keeps repeating, now six times

**Capability built, door missing.** Three of these four were not missing features. They
were finished systems whose last step, showing the result, was skipped:

- `guardrail_hits` has been written by `runtime.server.ts` at two chokepoints all along,
  and every `agent_approvals` row is an agent stopping because policy told it to. Nothing
  rendered either as evidence.
- `maybeProposeTrustGraduations` is called (`reflection.server.ts:249`), writes per-(agent,
  tool) proposals off clean streaks, honours the high-risk ceilings, guards against a recent
  `missed` outcome, and is duplicate-protected by a partial unique index. It was rendered
  **only inside the approvals queue**, so the one mechanism for shrinking the queue was
  visible exclusively to someone already working it. The fix was three lines.
- `buildDesignScaffoldHtml` has injected the workspace design language into every
  generation since DSN-01 and then discarded the fact, so a drawing arrived with no way to
  tell what was the workspace's and what the model invented.

**Check before building. Two of the four planned builds already existed and were better
than the version being planned.**

### Code deleted an hour after being written

`promotionCandidates` and `summarizeBoundary` in `boundary-ledger.ts` were written before
the trust ramp was found, then removed. Two recommenders that can disagree about the same
question is the "two vocabularies, neither authoritative" defect. **The engine proposes;
the ledger remembers.** Their absence is documented in the module so a future session does
not helpfully re-add them.

### Two honesty refusals worth keeping

1. **Design provenance never claims a given element came from a given rule.** Matching rule
   titles against generated HTML was the obvious implementation and would have produced
   mostly false negatives dressed as a verdict, the same defect as the raw cosine printed
   as "72% match" that was removed this morning. It states what was handed over (recorded
   fact), what has since been retired (read from the live active set, not inferred from
   timestamps), and the strongest provable line: drawn with none of your rules means all of
   it is invention.
2. **The ledger does not claim "approved without changes".** `resolveApproval` has no edit
   path, so there is no before-and-after to compare. The stronger honest reading is that
   approval here *cannot* alter the call, so a pair always approved is latency with a
   record attached.

### ⚠️ Needs a publish before it does anything

`spine_tracks` / `spine_track_members` (migration `20260801130000`) are **committed but not
applied**. `src/lib/spine/track.functions.ts` degrades on purpose (catch, return empty, the
same `as never` idiom `trust.functions.ts` uses), so `/plan` shows "Work in flight" with an
empty state and nothing looks broken. **Clicking "Start it" will silently do nothing until
Lovable applies the migration.** Check `src/integrations/supabase/types.ts` for
`spine_tracks` before debugging the track code.

### Picking this up

1. **Apply the migration**, then verify a track round-trips (start on `/plan`, confirm the
   route reads back).
2. **Advance is written but has no caller.** `advanceTrack` exists and is the point of the
   whole object (the next station comes from the route, not from whatever a page links to).
   Wiring it into the station handoffs is the next real step, and it replaces `navigate()`
   calls in components.
3. **`attachToTrack` has no caller either.** Each station should attach its artifact as it
   creates one, or a track will have a route and no members.
4. **Still open from the morning:** 33 hand-rolled `sp-ctx-*` divs to convert to
   `CtxHead`/`CtxRow`/`CtxBody` (Decide 20, Design 7, Plan 4, Ship 2).
