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
| A | — | (Queue 64, F-57, F-59, F-63 item 2 and the Learn honest-wait claims RELEASED: all shipped, gated and pushed by `ac333b2c8`; deploy `c3c6489a` carries the last two) | 2026-08-25 13:5x |
| L1 | — | (Queue 54 claim removed: shipped as unit 076, verification filed `requests/076-verify-queue54.md`) | 2026-08-25 12:0x |
| L0 | — | (Queue 65 claim released: shipped `7fa621e8f`, unit L0-080) | 2026-08-25 12:5x |
| B | `src/lib/spine/driver.ts` (builder brief), `src/lib/ai/tools/registry.server.ts` (`repo.search` description) | F-58: an empty `repo.search` is not evidence the code is absent | 2026-08-25 18:0x |
| L0 | — | (All five audit adoptions CLOSED: 1/2/5 landed, 3 refused on evidence, 4 investigated and found already-reasoned — outcomes recorded in docs/design/MERIDIAN-INVENTORY.md) | 2026-08-25 |
| L0 | — | (Adoptions 1/2/5 landed `639678be7`/`dcc70e819`/`5ff3ee5a3`; 3 refused on evidence — zero tunables on /design, see MERIDIAN-INVENTORY; 4 sweep in progress) | 2026-08-25 |
| L0 | — | (Item 4 split half shipped `9242664aa`; request 022 lift shipped `214cfffd5`, unit L0-083) | 2026-08-25 14:0x |
| A | `src/lib/nav-model.ts`, `src/components/shell/AppFrame.tsx` (RAIL block + owns-paths only), `src/components/shell/icons.tsx` | The `/start` door: founder named the pain — the track surface has no entry in the primary nav. PRIMARY_NAV row + rail row + owns `/track/*`. L1: coordinate via INBOX before touching the shell nav region | 2026-08-25 15:2x |
