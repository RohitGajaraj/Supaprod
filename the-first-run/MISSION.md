# MISSION: THE FIRST RUN

> _Created: 2026-08-24 · Written by MAIN LANE · Read by all three lanes · Supersedes the Meridian
> port as the run's objective. The Meridian **rules** still bind every line of code._

**THE OBJECTIVE, and every unit is judged against it:**

> **One track walks all seven stations, on demand, on a real workspace, watchable live, with the
> forecast captured before Build and graded after Ship, at one URL that can be revisited.**

**Why:** the founder has never seen a journey finish. Not because a feature is missing — because the
object that walks the loop (`spine_tracks`) has **no route in 84**, its only driver is a background
cron, and a watched run is impossible by construction. Full measurement:
[`DIAGNOSIS.md`](./DIAGNOSIS.md).

**THIS IS AN ASSEMBLY MISSION.** Wire what exists. A new component, table or route needs a line in
its unit file saying what existing thing was tried and why it did not serve. `src/components/meridian/`
has ~105 built components; the run primitives (`RunTimeline`, `ToolStream`, `RunMap`, `PlanGate`,
`PlanCard`, `AgentInbox`) are all real and already used on live surfaces. Compose them.

---

## The lane split — unchanged, by PATH, absolute

| Lane | Runs on | Writes ONLY | Worktree |
| --- | --- | --- | --- |
| **MAIN** | Claude Code | `src/lib/**`, `src/routes/api/**`, `src/components/meridian/**`, `src/styles/meridian.css`, `supabase/**`, `coordination/{STATUS,answers}`, `the-first-run/**` | `Supaprod` (`main`) |
| **LANE 0** | opencode / OX Alpha | `src/components/**` EXCEPT `meridian/` and `shell/` | `cadence-lane-0` |
| **LANE 1** | opencode / OX Alpha | `src/routes/**` EXCEPT `api/`, `src/components/shell/**`, `src/styles/**` EXCEPT meridian.css | `cadence-lane-1` |

**Reading any path is always allowed. Writing outside your prefix is never allowed.** A file touched
by two lanes is what broke `main` on 2026-08-22. MAIN owns the database, deploys, Mobbin, and every
ruling; neither building lane has DB or MCP access and must not pretend to.

## The wiring order — this sequence exists to stop a tsc break

```
L0-A  stub    src/components/track/TrackRun.tsx   → renders one line, exports TrackRun. PUSH IT FIRST.
L1-A  mount   src/routes/_authenticated.track.$trackId.tsx → imports the stub. Route exists, empty.
M-A   drive   POST /api/tracks/:id/drive          → foreground walk, no fair-share deadline
M-B   stream  GET  /api/tracks/:id/stream         → SSE of station transitions
L0-B  fill    TrackRun consumes the stream, renders seven station cards live
L1-B  onramp  one intent box → creates a track → navigates to /track/:id
M-C   moat    forecast captured at Decide + graded at Learn, on a REAL workspace, DB-verified
L0-C  payoff  the forecast moment card, and the Learn verdict card ("predicted X, got Y")
L1-C  collapse duplicate + dead doors; the rail leads to the run
```

**L0-A is the unblocker. LANE 0 pushes it before anything else** so LANE 1 is never blocked on it.
After that the three lanes are independent and pull each other's work in.

## Acceptance — what "done" means, and it is not "tests pass"

1. A route exists at `/track/:trackId` that shows one track's seven stations.
2. It **moves without a page refresh** while the run is walking.
3. A run can be started by a person in one action and **without configuration**.
4. It completes seven stations in **minutes**, not hours — the foreground drive does not use the tick.
5. A forecast is recorded **before** Build and graded **after** Ship, on a real workspace, and both
   are visible on the run.
6. Every claim of "it works" carries the SQL or the `file:line` that proves it. **A number without
   its query is not evidence** — three metrics that proved the product worked were all seed data.

## Standing rules for all three lanes

- **The dev server stays off.** Start it only when a change genuinely needs to be seen in a browser,
  and **stop it the moment that check is done.** A server left running exhausts RAM and the machine
  shuts down. This has happened. Never leave one up "in case".
- **Commit after every logical piece, then push.** Unpushed work does not exist and cannot be read by
  the other lanes. `git commit -F <file>` — never `-m`, zsh eats backticks. Never `git add -A`.
- **On start, check for mid-flight work before beginning anything new.** `git status` and the last
  units in `coordination/units/`. If a unit is half-done, finish it; do not restart the sequence.
- **Work continuously until the founder says stop.** There is no end-of-task. Finish a unit, write it
  up, push, pull, take the next thing. If you believe you are out of work, re-read this file's
  acceptance list and find which of the six is not yet true.
- **Needs the founder or the database → file a request, do not stall.** `coordination/requests/`,
  `L0-` prefix for LANE 0. Then pick up the next unit while you wait. MAIN answers in `answers/`.
- **Meridian is the only design system and it is enforced by `bun test`.** No `--sp-*`, `--ds-*`,
  `--text-*`, `--hairline`, `--raised`, `data-obsidian`, no raw colours. If no `--mrd-*` token fits,
  that is a gap in Meridian — file a request, never widen the baseline to pass.
- **Gates:** `bunx tsc --noEmit`, `bun test`, `bun run lint`. Never pipe a gate into `tail` and trust
  the exit code — the pipe hides it and `main` shipped red that way.
