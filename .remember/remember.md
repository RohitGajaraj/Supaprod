# Session handoff - 2026-07-27 (founder video SHOT + UPLOADED; demo video is next)

## State: local main = `13f2095e`, working tree has only this file modified.

## 🚨 READ FIRST: the GitHub remote `main` is an ORPHAN history. Do not push or pull blind.

Discovered at session close, 18:09. **Nothing is lost, but `git pull` / `git push` will both
misbehave until a human decides the fix.**

- `origin/main` = `7eb93a93`, a **6-commit history with NO common ancestor** with local main
  (`git merge-base` returns nothing). Its root commit `76c35c3a` is dated **today 08:12**.
- Local main = `13f2095e`, the real history, **4102 commits**, rooted at `f319173a`
  (template, 2025-01-01). `git rev-list --count`: **4102 ahead, 6 behind.**
- Cause is visible in the remote tree: it contains a top-level **`.git.broken`**, and commit
  `6cd257c9` is **"3516 files changed, 849684 insertions"**. Some tool lost its git state and
  re-committed the whole working tree as a fresh history, then force-pushed over `main`.
  `origin/HEAD` and `origin/master` also point at `7eb93a93`.
- **The remote snapshot is MISSING `docs/pitch/yc/founder-video-script.md`** (the v8.3 script).
  The pitch work exists ONLY locally.
- **The old objects are still on GitHub**: `origin/archive/final-sweep-2026-07-18` (`b8266a6a`)
  and `origin/keep/rescued-pieces` (`bbd83680`) still match local exactly.

**Protective step already taken (additive, destroys nothing):** local branch
**`backup/remote-orphan-main-2026-07-27`** now pins `7eb93a93`, so the remote's 6 commits cannot
be lost to GC no matter what happens next.

**The 6 remote-only commits are mostly noise; the real work in them is small:**

| commit | size | what |
|---|---|---|
| `76c35c3a` | 4 files, 1566+ | Build screen Composer typography |
| `6cd257c9` | 3516 files | the bulk re-commit — real P0 typography fixes are buried inside |
| `0e5c6902` | 2 files | Geist Pixel brand moments, P0 screens |
| `56080330` | 1 file | Build screen line-break formatting |
| `9df919c5` | 1 file | doc: typography session summary |
| `7eb93a93` | 1 file | doc: MANDATE-COMPLETION-ROADMAP.md |

**Suggested fix (founder's call, NOT done):** diff the four small commits onto local main, then
`git push --force-with-lease origin main:main` to restore the real 4102-commit history. Do NOT
merge with `--allow-unrelated-histories`; it produces a 3500-file mess.

## THE LIVE TASK: demo video. The founder video is DONE and UPLOADED.

YC Fall 2026 is **already filed**. Deadline **08:30 IST, 28 July**. **Both fields are HARD FILE
UPLOADS, not URLs** (founder confirmed from the live portal). 100 MB cap on both.

- ✅ **Founder video: SHOT, COMPRESSED, UPLOADED** (confirmed by founder 17:19). Source
  `~/Documents/YC_Video.mov` 168.3 MB -> `~/Documents/YC_Video_compressed.mp4` **74.9 MB**.
- ⏭️ **Demo video: NEXT SESSION.** Script is frozen (below). Expect the same 100 MB problem.

### The compression recipe that worked (ffmpeg is NOW INSTALLED via brew)

The recorder pins ~7,691 kbps regardless of content; a talking head needs a fraction of that, so
the cut is nearly free. **CRF 18 + copy the audio** — no rescale, no reframe, no re-encode of sound.

```bash
ffmpeg -i IN.mov -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
       -c:a copy -movflags +faststart OUT.mp4
```

Result on the founder video: 168.3 MB -> 74.9 MB (55% cut), identical 1080x720 / 30fps /
173.46s, audio bit-exact, full-file decode clean. **Budget against 100,000,000 DECIMAL bytes**
(`ls -lh` shows MiB and reads ~8% smaller than the upload form does). If CRF 18 ever overshoots,
fall back to two-pass at `(budget*8/duration - audio_bitrate)`. Working script:
`scratchpad/compress.sh` pattern, reproduced above.

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
2. **This handoff file gets wiped to 0 bytes by something** (THREE times today — again at the
   18:09 close, recovered with `git show HEAD:.remember/remember.md > .remember/remember.md`).
   Check `wc -c .remember/remember.md` before editing it, or a read-modify-write silently
   destroys it. Always restore from HEAD first rather than writing over an empty file.

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
