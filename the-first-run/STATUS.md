# THE FIRST RUN — build status

**Last updated: 2026-08-24 23:2x UTC (2026-08-25 ~04:5x IST) · MAIN LANE**

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
| — | Migration `20260824200000` was in the repo, **absent from the ledger, and had never run**. `/track` was an unreserved first segment | applied and verified |

## Where the experiment stands

Round 1 is finished and **negative**: neither reset track advanced, both are `given-up`, and the
autopsy bought F-14. The full record, with the SQL behind every number, is in
[`EXPERIMENT-first-finish.md`](./EXPERIMENT-first-finish.md).

**Round 2 is a fresh track, not another reset.** Both round-1 tracks decline on their merits —
`active_scout_targets = 0`, no primary evidence — so neither could ever reach `learn` however well
the driver behaved.

## What is actually blocking the acceptance

1. **The fixes are pushed and not yet deployed.** Lovable was on `e4de78726` while `main` was four
   commits ahead. Nothing on the live database changes until that sync lands.
2. **The composer still creates missions, not tracks** (queue item 16, ledger F-04). Until it does,
   "one sentence in" is not reachable from the app-wide box.
3. **A run does not say why it stopped** (item 20). 57 of 59 tracks carry a hold reason and
   `/track/:trackId` renders none of it, so a stall is invisible — which is acceptance criterion 2
   failing by construction.

## For the building lanes

**Nothing is blocked on MAIN.** Both open requests are answered
(`coordination/answers/RL0-018-019-…`), and the queue has five new rows (23 to 27) from those
censuses. Take the topmost row you own by path that is not `BLOCKED` or `WIP`.

**Ask for SQL rather than guessing at the database.** Turnaround is minutes, and three metrics that
once proved this product worked turned out to be seed data because nobody recorded the query.
