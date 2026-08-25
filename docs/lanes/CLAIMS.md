# CLAIMS — who is holding what, right now

> **Check this file BEFORE touching any file; write your claim BEFORE coding; push the claim
> first; REMOVE it when done.** Format, one row per claim:
>
> `| session | files or area | what | claimed (UTC) |`
>
> Sessions: **A** (Claude Code, director — owns AUDIT.md, PRODUCT-TRUTH.md, the queue files, and
> all architecture/product decisions), **B** (Claude Code, second worktree), **L0** (OX Alpha,
> `src/components/**` except `meridian/`+`shell/`+`presence/`), **L1** (OX Alpha,
> `src/routes/**` except `api/`, `src/components/shell/**`, `src/styles/**` except
> `meridian.css`). A claim conflict is negotiated in [`INBOX-MAIN.md`](./INBOX-MAIN.md), never
> raced. If two sessions built the same thing, Session A decides which survives (BUILDLOG says
> so).

| Session | Files / area | What | Claimed (UTC) |
| --- | --- | --- | --- |
| A | `src/lib/presence/**`, `src/components/presence/**` | Queue 52–53, the character (SPEC-PRESENCE) — CORE + COMPONENT SHIPPED, claim held for iteration | 2026-08-25 09:0x |
| A | `src/components/track/ArtifactPane.tsx` | Founder design push: per-station rich renders (forecast card, prototype preview, changeset story) — L0: coordinate via INBOX before touching | 2026-08-25 10:5x |
| A | `docs/AUDIT.md`, `docs/PRODUCT-TRUTH.md`, `docs/lanes/QUEUE-*.md`, `the-first-run/BUILD-QUEUE.md` | Standing director ownership | standing |
| B | `the-first-run/EXPERIMENT-first-finish.md`, `the-first-run/RULINGS.md`, `the-first-run/FINDINGS-LEDGER.md` | The live acceptance run — driving Round 6/7, the database, and the record of both | 2026-08-25 09:3x |
| B | queue 63 (F-55 driven_via): `driver.server.ts`, `track.functions.ts`, `track-tick.ts`, migration | Building A's ruling | 2026-08-25 09:5x |
| B | `src/lib/ai/loop.server.ts`, `src/lib/deployments.functions.ts`, `src/lib/hosting/**` | R-27 (ship autonomy) — SHIPPED; claim held while Round 7's ship path is proven | 2026-08-25 09:3x |
| A | — | **SEAT NOTE:** `supaprod-a6` exited after committing R-16 (`39375bf7e`, 16:42 IST); `supaprod-8c` holds the A seat from 11:2x UTC. B confirmed via socket. | 2026-08-25 11:2x |
| A | queue 64: `driver.ts` (DrivenVia), `track.functions.ts` (driveTrackNow signature ONLY), `TrackRun.tsx` (mutate sites), `stage-events.server.ts` (type), new migration, `criterion-two-is-a-query-now.test.ts` | SHIPPED `89de72c90`; claim held for the F-57 window only | 2026-08-25 11:2x |
| A | F-57: hold-classification code in `driver.server.ts` (NOT the brief text — B holds that for F-58), `correction.ts` TERMINAL_HOLDS neighbourhood, GitHub tool error mapping | 404 on the repository ROOT where the workspace holds a binding naming that repo = permission answer → classify as refusal, burn no attempt. Assigned by B over the socket. | 2026-08-25 12:3x |
| A | F-59 (new): `docs/operations/deploy-verification.md` + one FINDINGS-LEDGER row (B invited the entry) | Publish-after-push must verify the SERVING BUNDLE, not the publish status; chunk-scan method recorded | 2026-08-25 12:3x |
| L1 | — | (Queue 54 claim removed: shipped as unit 076, verification filed `requests/076-verify-queue54.md`) | 2026-08-25 12:0x |
| L0 | `src/components/spine/TrackActivity.tsx`, `src/components/spine/activity-rows.*` | Queue 65 component half: origin markers on the transcript from `transitions` (press/sweep/continuation distinct; foreground+NULL silent) | 2026-08-25 12:3x |
| B | `src/lib/spine/driver.ts` (builder brief), `src/lib/ai/tools/registry.server.ts` (`repo.search` description) | F-58: an empty `repo.search` is not evidence the code is absent | 2026-08-25 18:0x |
