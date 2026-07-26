# Session handoff - 2026-07-26 (YC video scripts + Wave 1-2 cleanup)

## State: SAFE. Working tree clean. main = b94fea4e, remote verified identical.

Three commits pushed:
- `b2abf5c5` pitch: freeze the two YC video scripts against the live app
- `5fd2e176` design: finish the Wave 1-2 typography and spacing standardization
- `b94fea4e` chore: remove the Wave 1-2 session scaffolding

## THE LIVE TASK: two videos, both still pending on the submitted application

The YC Fall 2026 application is **already filed**. Only the founder video and the
demo video remain editable. Deadline **08:30 IST, 28 July**.

**Both fields are HARD FILE UPLOADS, not URLs** (founder confirmed from the live
portal). 100 MB cap applies to both. Encode specs are in each script file.

### Founder video
`docs/pitch/yc/founder-video-script.md` - **v3.1 operative**. Venue-neutral (no YC
mention, no employer named) so it serves other investor applications too. 304 words
full / 277 lean, lands 1:35-1:45. Founder has NOT yet stopwatch-read it; that
calibration is the next step and decides full vs lean vs the tight cut.
`docs/pitch/yc/founder-video-script-detailed.md` - delivery craft only (its script is
deferred): 19 accepted videos measured with yt-dlp (median 64s, 14 of 19 over YC's
stated 1:00), the one-hour practice protocol, the fumble rule, pre-upload checks.

### Demo video
`docs/pitch/yc/video-scripts.md` - 11-step click-by-click walkthrough, verified live
as `harbor@` today. GO TO / DO / ON SCREEN / SAY / WHY / TRAPS per step. ~2:36.

**Three safety laws, non-negotiable:** navigate by URL only (key `1` = Approve and
dispatch a real agent run, on camera, irreversibly) - frame every room shot from the
Canvas leftward (the left rail shows `[auto] ... frequency 1, severity 5` with live
Approve buttons) - record at 1920x1080 (at 1440 the Spine clips and `07 Learn` falls
off the edge).

## What I repaired today, and the root cause

`supabase/migrations/20260725140000_clone_helio_to_investor_workspaces.sql:110` has a
hand-maintained `v_tables` array. It lists parents but **omits four child tables**:
`studio_changes`, `prd_scaffolds`, `prototype_files`, `agent_run_checkpoints`. So every
cloned demo workspace got headers with no bodies.

Fixed in harbor (`60000000-`), both verified rendering live:
- **05 Build**: inserted the 4 real `studio_changes` rows from the Helio source
  changeset. Now reads `+17 -2 across 4 files` with real diffs and "Pull request #1 is
  open". The migration's own comment names the 34% drop.
- **04 Design**: clicked the product's own "Generate mockup" on
  `/plan/spec/60000000-0001-4000-8000-000000000012`. Persisted a 7,163-char
  `prd_scaffolds` row. The white void is gone.

**DB access is via `mcp__lovable__query_database` (project `371dd588-...`). The
Supabase MCP returns Unauthorized.**

## After the deadline (do NOT touch before it)

1. **The permanent clone fix**: derive `v_tables` from the FK graph instead of hand-
   maintaining it, so new child tables are copied automatically. Then re-clone all
   seven demo workspaces.
2. **Migration timestamp collisions**: 9 duplicate version strings mean **10 migration
   files silently never applied**, including `k2_rollbacks` (so `studio_rollbacks` does
   not exist in production, and the rollback button throws). The registry keys on the
   version string and the first file wins.
3. **Two one-line UI bugs**: `EngineRoomDisclosure.tsx:131` hides the CI Refresh button
   behind the state it exists to create. `StatusBadge` lacks `waiting_approval` and maps
   `halted` to a red FAILED.
4. **64 pre-existing test failures** (8,945 pass / 9,188 total). NOT caused by the
   design pass: route-namespace, SignalCard keyboard activation, CommandBar, and 6
   AskPanel SSE tests. All 134 assertions in the four typography-asserting files are
   green.
5. **`rag_chunks` is empty for harbor.** The Ask still answers (it falls back to a
   structured decision snapshot), but retrieval quality on a real customer workspace
   needs this.

## Claim law, enforced today

"Supaprod is building Supaprod on its own" is **out of the founder video**.
`one-pager.md:36` tags it `[WIRING]`, RPT-50 is still partial, and there has never been
a PR on the Supaprod repo. The true and equally strong form is "one person directing
agents, every change on the record". The filed Progress Update text still contains the
stronger claim; that is founder-decided and was not touched.

Also: **zero outside users exist on the database.** Nothing may imply usage. "It is
live" is true; "people are using it" is not.

## Wave 1-2 cleanup, for the record

21 scaffolding files removed, all created the same day by `3b9cdb22` / `a80a1f11`:
11 session status reports (root + `docs/design/`), `VERCEL_GEIST_DISSECTION.md` (its
ground is canonical and deeper in `DESIGN-TEMPO.md` + `tempo-v5/tokens/` + 75
per-component specs), 7 e2e specs + `playwright.wave1-2.config.ts` (~307 assertions but
**manual-only**: no e2e script in package.json, CI never invokes playwright, and 160 of
those assertions target the retired `/today`), plus a `.bak` and a scratch note.
**Recovery: `git show 3b9cdb22:e2e/<name>.spec.ts`.**
