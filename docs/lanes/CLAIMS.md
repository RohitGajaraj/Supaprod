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
| A | `src/components/track/TrackRun.tsx` (mount block only) | Character mounted at the top of the run — L0: your #55 `AUTO_MAX` edit is a different hunk, no conflict expected; pull first | 2026-08-25 09:3x |
| A | `docs/AUDIT.md`, `docs/PRODUCT-TRUTH.md`, `docs/lanes/QUEUE-*.md`, `the-first-run/BUILD-QUEUE.md` | Standing director ownership | standing |
