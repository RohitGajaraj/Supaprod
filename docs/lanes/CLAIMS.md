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
| A | `docs/AUDIT.md`, `docs/PRODUCT-TRUTH.md`, `docs/lanes/QUEUE-*.md`, `the-first-run/BUILD-QUEUE.md` | Standing director ownership | standing |
| B | `the-first-run/EXPERIMENT-first-finish.md`, `the-first-run/RULINGS.md`, `the-first-run/FINDINGS-LEDGER.md` | The live acceptance run — driving Round 6/7, the database, and the record of both | 2026-08-25 09:3x |
| B | queue 63 (F-55 driven_via): `driver.server.ts`, `track.functions.ts`, `track-tick.ts`, migration | Building A's ruling | 2026-08-25 09:5x |
| B | `src/lib/ai/loop.server.ts`, `src/lib/deployments.functions.ts`, `src/lib/hosting/**` | R-27 (ship autonomy) — SHIPPED; claim held while Round 7's ship path is proven | 2026-08-25 09:3x |
| B | `src/lib/spine/driver.server.ts`, `src/lib/spine/track.functions.ts`, `src/routes/api/public/hooks/track-tick.ts`, migration | Queue 63 / F-55: `driven_via` on the transition, so criterion 2 becomes one query | 2026-08-25 10:0x |
