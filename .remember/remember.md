# Session handoff - 2026-07-27 (YC founder video script, v3.1 -> v7.2 + coffee version)

## State: SAFE. main = b94fea4e + this commit. Working tree otherwise clean.

Prior commits this session: `b2abf5c5` (YC video scripts frozen) · `5fd2e176` (Wave 1-2
typography + spacing, 172 files) · `b94fea4e` (Wave 1-2 scaffolding removed, 21 files).

## THE LIVE TASK: two videos, still pending on the submitted application

YC Fall 2026 is **already filed**. Only the founder video and the demo video remain editable.
Deadline **08:30 IST, 28 July**. **Both fields are HARD FILE UPLOADS, not URLs** (founder
confirmed from the live portal). 100 MB cap on both; encode specs are in each file.

### Founder video - `docs/pitch/yc/founder-video-script.md`

**v7.2 is THE SHOOTING SCRIPT** (254 words, ~2:03 practised). Venue-neutral: no YC mention, no
employer named, so it serves other investor applications too.

The file also carries **THE COFFEE VERSION** above the script: the same content in conversational
register (~430 words). **Learn the coffee version first, then the script.** That is what stops
the recorded take sounding recited, which is YC's actual objection ("do not recite a written
script"). Every version v3.1 -> v7.2 is preserved below with its reasoning, because the founder
asked to see where it started and what worked.

**MEASURED PACE, the number that governs everything: ~123 wpm practised, ~108 unpractised.**
Derived from three real reads (304w->3:00, 216w->2:00, and his own 1:45 estimate). **Do not size
a script for him at 145 wpm.** I did that twice and was wrong twice.

**Founder rulings from the script rounds, all binding:**

- No employer names, ever. "Space systems, then semiconductors, now banking" carries the arc.
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
