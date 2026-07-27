# Session handoff - 2026-07-27 (YC founder video script, v3.1 -> v8.3)

## State: SAFE. main = 42946181, remote verified identical. Working tree clean.

Prior commits this session: `b2abf5c5` (YC video scripts frozen) · `5fd2e176` (Wave 1-2
typography + spacing, 172 files) · `b94fea4e` (Wave 1-2 scaffolding removed, 21 files).

## THE LIVE TASK: two videos, still pending on the submitted application

YC Fall 2026 is **already filed**. Only the founder video and the demo video remain editable.
Deadline **08:30 IST, 28 July**. **Both fields are HARD FILE UPLOADS, not URLs** (founder
confirmed from the live portal). 100 MB cap on both; encode specs are in each file.

### Founder video - `docs/pitch/yc/founder-video-script.md`

**v8.3 IS THE ONE TO SHOOT** (372 words, ~3:14 practised). It is the HYBRID: v7.2's pitch spine
with eleven imports from the conversational register. Venue-neutral: no YC mention, no employer
named, so it serves other investor applications too.

The file is ordered newest-first: **v8.3 hybrid -> the coffee version -> v7.2 formal -> v7 tiers
-> v6 -> v5 -> v4 -> v3.1**, each with the reasoning, because the founder asked to see where it
started and what worked. He practised v8.2 himself and got it to ~3:00.

**PACE, four data points, and the finding that matters most: PRACTICE IS WORTH ~30 WPM TO HIM.**
Cold he reads ~85 wpm on camera; practised he hit ~115 on v8.2 and is targeting 125.
**Do not cut a script for him before he has rehearsed it twice** - v8.2 looked like 4:03 on my
cold-rate arithmetic and he practised it to 3:00. I sized scripts wrong three times this session:
first at 145 wpm (way too fast), then at 101, then at 85. Use 115 practised.

**Founder rulings from the script rounds, all binding:**

- No employer names, ever. "Space systems, then semiconductors, now banking" carries the arc.
- **Layer two is NOT about code generation.** He rejected "agents write the code, open the pull
  request, run the checks" as a positioning error, and he was right: that is what Cursor and Devin
  do, and it invites "how is this different from Cursor". Layer two is the LOOP and that it
  CLOSES: "Discovery, decide, design, build, ship. And then it grades what shipped. Every tool
  I've used helps with one step. This runs all of them, and the loop actually closes."
- **Layer two and layer three must not both land on "where we went wrong."** The relationship is a
  handoff: layer two PRODUCES the grades, layer three REMEMBERS them and warns. Not a repeat.
- **Layer three names "the company brain" out loud**, right after "the one I care about most".
- **The pain must read as the profession's, not his.** v8.3 adds the explicit bridge: "And that's
  not a me problem. That's the job. Every product manager I've ever worked with is answering it
  the same way. Best guess, then defend the guess." Chose observation over a statistic on purpose:
  a number invites a sourcing question and breaks the conversational register.
- **Never say "reinforcement learning."** Say "it learns your taste". `one-pager.md:32` tags
  "Outcomes move the ranking" [PROVEN], but the mechanism improves context, not weights.
- **No VP in the pain beat.** It imported an org chart and made him read as disorganised. Beat 3
  now universalises first ("Every product manager wakes up to that question"), then blames the
  missing system ("There is no system that keeps it"), never the person. The word "I" does not
  appear in the failure.
- Commit counts, the eight-weeks proof block, and "It's live, public launch September" are CUT.
- MBA is optional and says "an MBA in Germany", never a ranking (application §3d ruling).
- "Company brain" is fine as the name of layer 03 (it is on the live site in `ThreeLayers.tsx`);
  what to avoid is claiming it as the whole positioning.

### Demo video - `docs/pitch/yc/video-scripts.md`

11-step click-by-click walkthrough, verified live as `harbor@`. GO TO / DO / ON SCREEN / SAY /
WHY / TRAPS per step. ~2:36.

**Three safety laws:** navigate by URL only (key `1` = Approve and dispatch a real agent run, on
camera, irreversibly) · frame every room shot from the Canvas leftward (the left rail shows
`[auto] ... frequency 1, severity 5` with live Approve buttons) · record at 1920x1080 (at 1440
the Spine clips and `07 Learn` falls off the edge).

## What was repaired, and the root cause

`supabase/migrations/20260725140000_clone_helio_to_investor_workspaces.sql:110` has a
hand-maintained `v_tables` array. It lists parents but **omits four child tables**:
`studio_changes`, `prd_scaffolds`, `prototype_files`, `agent_run_checkpoints`. Every cloned demo
workspace got headers with no bodies.

Fixed in harbor (`60000000-`), both verified rendering live:

- **05 Build**: inserted the 4 real `studio_changes` rows from the Helio source changeset. Now
  reads `+17 -2 across 4 files` with real diffs and "Pull request #1 is open".
- **04 Design**: clicked the product's own "Generate mockup" on
  `/plan/spec/60000000-0001-4000-8000-000000000012`. Persisted a 7,163-char `prd_scaffolds` row.

**DB access is `mcp__lovable__query_database` (project `371dd588-...`). The Supabase MCP returns
Unauthorized.**

## Traps that cost time this session

1. **RTK summarises command output.** A per-file eslint run displayed "react-hooks/exhaustive-deps
   (1)" while the real log had **22 prettier errors**. Read
   `~/Library/Application Support/rtk/tee/*_lint.log` for the truth. RTK also rewrites `git diff`,
   so piping it into `xargs git add` fails.
2. **This handoff file gets wiped to 0 bytes by something** (twice today). Check
   `wc -c .remember/remember.md` before editing it, or a read-modify-write silently destroys it.

## After the deadline (do NOT touch before it)

1. **The permanent clone fix**: derive `v_tables` from the FK graph instead of hand-maintaining
   it, so new child tables are copied automatically. Then re-clone all seven demo workspaces.
2. **Migration timestamp collisions**: 9 duplicate version strings mean **10 migration files
   silently never applied**, including `k2_rollbacks` (so `studio_rollbacks` does not exist in
   production and the rollback button throws). The registry keys on the version string; first
   file wins.
3. **Two one-line UI bugs**: `EngineRoomDisclosure.tsx:131` hides the CI Refresh button behind the
   state it exists to create. `StatusBadge` lacks `waiting_approval` and maps `halted` to red
   FAILED.
4. **64 pre-existing test failures** (8,945 pass / 9,188). NOT from the design pass:
   route-namespace, SignalCard keyboard, CommandBar, 6 AskPanel SSE. All 134 assertions in the
   four typography-asserting files are green.
5. **`bun run lint` is unusable as a gate: 56,905 problems**, overwhelmingly `prettier/prettier`.
   `prettier --check src` lists **191 unformatted files**. Pre-existing, proven twice: 81 of the
   191 are outside any recent commit, and 8 of 8 sampled files were already unformatted at parent
   `b2abf5c5`. `.output` IS correctly ignored by eslint; the repo has simply drifted from
   prettier. Fix is `bun run format`, but that is a ~191-file diff and wants its own commit.
6. **`rag_chunks` is empty for harbor.** The Ask still answers (it falls back to a structured
   decision snapshot), but retrieval quality on a real customer workspace needs this.

## Claim law

"Supaprod is building Supaprod on its own" is **out of the founder video**. `one-pager.md:36`
tags it `[WIRING]`, RPT-50 is partial, and there has never been a PR on the Supaprod repo. The
filed Progress Update still contains the stronger claim; that is founder-decided, untouched.

**Zero outside users exist on the database.** Nothing may imply usage.

## Wave 1-2 cleanup, for the record

21 scaffolding files removed, all created the same day by `3b9cdb22` / `a80a1f11`: 11 session
status reports (root + `docs/design/`), `VERCEL_GEIST_DISSECTION.md` (canonical and deeper in
`DESIGN-TEMPO.md` + `tempo-v5/tokens/` + 75 per-component specs), 7 e2e specs +
`playwright.wave1-2.config.ts` (~307 assertions but **manual-only**: no e2e script in
package.json, CI never invokes playwright, 160 of those assertions target the retired `/today`),
plus a `.bak` and a scratch note.
**Recovery: `git show 3b9cdb22:e2e/<name>.spec.ts`.**
