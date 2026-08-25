# THE FIRST RUN — build status

**Last updated: 2026-08-25 00:1x UTC (~05:4x IST) · MAIN LANE**

> **THIS FILE WAS WRONG AND HAS BEEN REWRITTEN.** The version before this one advertised three API
> endpoints — `POST /api/tracks`, `POST /api/tracks/:id/drive`, `GET /api/tracks/:id/stream` — as
> shipped, with a commit and a green build, under the heading *"M-A/M-B/M-C are 100% ready."* **None
> of the three files exists.** They were the endpoints reverted as ledger F-03 for not compiling, and
> the status file was never taken back with them. `ls src/routes/api/` returns `chat.ts`, `mcp.ts`,
> `plan-gate.ts`, `stripe/`, `public/`, `__tests__/` and nothing else.
>
> **If you were waiting on any of those three, stop waiting.** What actually exists is below, and it
> is enough to build against.

## The objective

> One track walks all seven stations, on demand, on a real workspace, watchable live, forecast
> captured before Build and graded after Ship, at one URL that can be revisited.

## What is real, verified by reading the files today

| Thing | Where | What it does |
| --- | --- | --- |
| `driveTrackNow` | `src/lib/spine/track.functions.ts:1215` | **A server function, not an HTTP endpoint.** Foreground walk with a fresh clock per seat, so a watched run is never rationed by the tick's shared 45s deadline. Returns `{track, steps, stopped, more}` |
| `/track/$trackId` | `src/routes/_authenticated.track.$trackId.tsx` | The one linkable address for a piece of work |
| `TrackRun` | `src/components/track/TrackRun.tsx` | Calls `driveTrackNow` through `useServerFn`. Drive control + `TrackChain` + `TrackActivity` |
| `startTrack` | `src/lib/spine/track.functions.ts` | Creates a track from one sentence. **Repaired today — see below** |
| the agent's clock | `src/lib/ai/loop.server.ts` | Today's date in every system prompt |

**There is no SSE stream and there is no HTTP API for tracks.** Everything goes through TanStack
server functions. A lane that needs a live stream should say so in a request rather than assume one.

## What MAIN fixed tonight, and the evidence for each

| # | What | Commit |
| --- | --- | --- |
| F-14 | **The clock split the crew and the driver called the station empty.** A station whose producing seat ran in one tick and whose checking seat ran in the next was judged `produced-nothing` three times and given up on, with its three artifacts sitting on the record. **The mechanical reason no track has ever finished** | `5d0780bdb` |
| 17 | **Starting a track from one sentence has never once worked.** `workspace_id` is NOT NULL with a default; the insert sent an explicit null, so Postgres refused the row. 58 of 59 tracks came from the promotion sweep and the 59th is the seed row | `3eb8d0f48` |
| 19 | **The track spend ceiling was off in all 21 workspaces.** A column with no default, never backfilled, read as a deliberate "no ceiling" | `84e7fa7da` |
| F-19 | **The search index stored the QUESTIONS, never the answers.** 17 rows, one embedded, every one a prompt somebody typed. **Zero signals, ever** — so Discover's first tool could not return evidence that was sitting in the table, and 52 of that workspace's 72 signals are the agents' own notes saying they found nothing. **The answer to the whole "empty workspace" pathology** | `388900039` |
| F-20 | **Dead work held every slot in the sweep.** Five `given-up` tracks took all five slots and the one live track was not driven at all, while the tick reported `ok` in 500ms | `c61aa55fc` |
| F-21 | **A halted run was charged as a station that failed.** The loop stopped throwing on credit exhaustion and started halting; the driver never read the new channel, so an empty account spent the station's attempts | `ea69d62e4` |
| — | Migration `20260824200000` was in the repo, **absent from the ledger, and had never run**. `/track` was an unreserved first segment | applied and verified |

**Three of those five were found by watching a live run, not by reading code.** F-19 came out of one
agent sentence; F-20 came out of a tick that did nothing; F-21 came out of the account emptying.
Reading the code had already missed all three.

## Where the experiment stands

Round 1 is finished and **negative**: neither reset track advanced, both are `given-up`, and the
autopsy bought F-14. The full record, with the SQL behind every number, is in
[`EXPERIMENT-first-finish.md`](./EXPERIMENT-first-finish.md).

**Round 2 is a fresh track, not another reset.** Both round-1 tracks decline on their merits —
`active_scout_targets = 0`, no primary evidence — so neither could ever reach `learn` however well
the driver behaved.

## ⛔ THE RUN IS STOPPED, AND ONLY THE FOUNDER CAN CLEAR IT

**The AI credit account behind the only live workspace is empty.** Every agent seat now halts before
it starts. Nothing in the loop can run — not the proof, not a diagnostic, nothing.

```sql
SELECT w.name, w.account_id, c.balance_credits, c.topup_credits,
       c.monthly_grant_credits, c.cycle_anchor
  FROM workspaces w JOIN account_credits c ON c.account_id = w.account_id
 WHERE w.id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4';
-- My workspace | 164e0692 | balance 0 | topup 11 | grant 750 | anchor 2026-08-22
```

The seats' own words, 2026-08-25 00:00 UTC:

> *"Halted: AI credits exhausted: account credit balance (13) is below the projected cost (16). Top
> up or upgrade in Settings → Usage."*

**Where the 750 went, and it is worth reading before topping up.**

```sql
SELECT date_trunc('day', created_at) AS day, count(*) AS runs,
       round(sum(spend_used_usd)::numeric,4) AS usd, sum(tokens_used) AS tokens
  FROM agent_runs WHERE workspace_id = '0b792d52-…' AND created_at > '2026-08-21' GROUP BY 1;
-- 08-22 | 140 runs | $0.6727 | 2,703,988 tokens
-- 08-23 | 144 runs | $1.1820 | 4,560,489 tokens
-- 08-24 |  15 runs | $0.1073 |   377,389 tokens
-- 08-25 |   3 runs | $0.0047 |    11,295 tokens
```

**A whole monthly grant, 302 runs and 7.65M tokens in three days, and not one track finished.**
Almost all of it was spent on tracks that were searching an index holding no evidence (F-19) and
being judged by a driver that called a working station empty (F-14). **The empty account is a
symptom of the defects, not a separate problem** — and all four are now fixed, so the next credits
buy a materially different run.

**What is needed:** a top-up on account `164e0692`. Nothing else is blocked on it — the whole backlog
below is buildable without a single agent run.

## What is actually blocking the acceptance

1. **Credits.** Above. Nothing runs without them.
2. **One approval at Ship, which is the founder's contradiction to resolve** (ledger F-18). Every
   station's filing tool resolves to `auto` except `release.publish`, which is review-pinned by his
   own ruling and can never graduate. **Six of seven stations are provable; the seventh is not**
   until he picks one of the three options on the OPEN list in `RULINGS.md`.
3. **The composer still creates missions, not tracks** (item 16, ledger F-04) — though **R-24 has now
   settled the question it was blocked on**, so it is buildable. LANE 1 shipped `/start`
   (`801b9c427`), which is the other door to "one sentence in".
4. **Deploy lag, not deploy failure.** Lovable syncs from GitHub on its own and has moved through
   five commits tonight unattended. It simply runs a few minutes behind a push, so a fix is never
   live at the instant it lands. **Read the sha back before believing a fix is in play.**

## For the building lanes

**Nothing is blocked on MAIN.** Both open requests are answered
(`coordination/answers/RL0-018-019-…`), and the queue has five new rows (23 to 27) from those
censuses. Take the topmost row you own by path that is not `BLOCKED` or `WIP`.

**Ask for SQL rather than guessing at the database.** Turnaround is minutes, and three metrics that
once proved this product worked turned out to be seed data because nobody recorded the query.
