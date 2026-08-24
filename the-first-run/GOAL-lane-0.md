# LANE 0 — comprehensive brief

You are **LANE 0** on the Supaprod repo, worktree `cadence-lane-0`, running on OX Alpha via opencode.
You work **autonomously and CONTINUOUSLY until the founder says stop.** There is no end-of-task:
finish a unit, write it up, commit, push, pull, take the next one. If you think you are out of work,
re-read the acceptance list in §7 and find which criterion is not yet true.

---

## 1. Start here, every session, in this order

```
git pull --rebase origin main
```

1. Read **`the-first-run/BUILD-QUEUE.md` — THIS IS YOUR WORK SOURCE.** Take the next `READY`
   item in your lane. If your next numbered item says `BLOCKED`, **skip it and take the next
   `READY` one.** Never idle, and never build another lane's item. MAIN LANE adds to this file
   continuously, so **re-pull it rather than waiting for it to grow.**
2. Read `the-first-run/MISSION.md` — the objective, and it governs every unit you write.
3. Read `the-first-run/EVIDENCE.md` — the production numbers behind every item in the queue.
4. Read `the-first-run/DIAGNOSIS.md` — why this mission exists, measured.
5. Read `coordination/STATUS.md` — MAIN LANE's current picture.
6. Read every file in `coordination/answers/` whose name starts `L0-` or `RL0-` that you have not
   acted on. Those are rulings addressed to you.
7. Read the last 5 files in `coordination/units/` — both lanes' recent work, so you do not repeat it.
8. Run `git status`.

**IF WORK IS HALF-DONE OR UNCOMMITTED, FINISH AND COMMIT IT BEFORE STARTING ANYTHING NEW.** A
session that died mid-unit leaves a dirty tree; that is your first signal, not a nuisance. Never
restart the unit sequence from zero — check `coordination/units/` for `L0-` files to see how far the
lane already got. If 12 of 40 units are done, you start at 13.

## 2. Why this mission exists

The founder has been building for three months and **has never once seen a journey run end to end on
its own.** He is right, and it is not a missing feature. It is measured:

- `spine_tracks` (migration `20260801130000`) is the object that walks all seven stations. It exists,
  it works, and `src/lib/spine/a-signal-walks-the-whole-spine.test.ts` proves it walks.
- **It has no route. 0 out of 84 authenticated routes surface a track.**
- `driveTrackOnce` has exactly **one** caller: the background cron `src/routes/api/public/hooks/track-tick.ts`.
- That tick serves ≤5 tracks under one shared 45s deadline, ≤3 agent seats per station. Seven
  stations is ~21 seats, round-robin. A journey takes **hours, invisibly, in a database table.**
- The moat — a forecast recorded before the outcome is known — has fired 146 times, **all inside two
  seeded demo tenants. 0 of 131 across six real workspaces.**

So the product has a complete engine, a complete component library, and a complete moat, **with no
screen where a human can watch any of it happen.** That is the whole defect.

**In an agentic product the system walks and the person watches. Today the person walks and the
system waits.** Your job is to build the watching.

## 3. THIS IS AN ASSEMBLY MISSION — read this before you write any component

**Almost everything you need already exists.** The default move on every unit is to wire what is
there. If you create a new component, your unit file must say what existing thing you tried and why
it did not serve. `src/components/meridian/` holds ~105 built components.

**The single most important fact in this brief:** the seven-station live view **already exists.**

```ts
// src/components/meridian/RunMap.tsx
export type RunMapMode = "editable" | "live" | "replay";
export type RunMapStation = {
  station: AgentStation;      // "sense"|"decide"|"define"|"design"|"build"|"ship"|"learn"
  state: PlanStepState;       // "pending" | "active" | "done" | "failed" | "skipped"
  outcome?: string;
  hold?: string | null;
  waivedReason?: string;
  steps?: PlanStep[];
};
export function RunMap({ stops, mode = "replay", label, onWaive }: {
  stops: RunMapStation[];
  mode?: RunMapMode;
  label?: string;
  onWaive?: (station: AgentStation, reason: string) => void;
}) { ... }
```

`RunMap` in `mode="live"` **is** the run theater. It draws the seven stations, their states, their
outcomes and their holds. It is currently only used inside `src/components/ask/AskPlanGate.tsx`, which
also already contains the shape-builder you should copy the pattern from:

```ts
// src/components/ask/AskPlanGate.tsx
export function stopsForRoute(routed: RoutedIntent): RunMapStation[]
```

**So your real job is not "build a run view". It is: map a LIVE track's state to `RunMapStation[]`
and keep it current from the stream.** That is a much smaller and much better piece of work.

Other primitives that are real and already used on live surfaces — compose them, never edit them,
never rebuild them:

| Component | Shape you feed it |
| --- | --- |
| `RunTimeline` | `TimelineEvent[]` — `{ id, at, kind, station?, label, detail?, agentSlug?, durationMs? }`, state `"working"\|"gate"\|"held"\|"failed"\|"passed"` |
| `ToolStream` | `{ rows: ToolStreamRow[], working?, label?, maxHeight?, onSelectRow? }`; row `{ id, tool, at, state: "running"\|"done"\|"failed", label?, argument?, durationMs?, error? }` |
| `RunMap` | above |
| `PlanGate`, `PlanCard` | in `src/components/meridian/`, used by `AskPlanGate` |
| `AgentInbox` | used by `_authenticated.today.tsx` |

Station order and display names come from `@/lib/agent-vocabulary`:
`AGENT_STATION_ORDER = ["sense","decide","define","design","build","ship","learn"]`. **Never write a
station list as literals** — import the constant, so a station that changes drags your view with it.

## 4. What you own, and it is absolute

**YOU WRITE ONLY:** `src/components/**` **EXCEPT** `meridian/` and `shell/`.

- `src/components/meridian/**` is MAIN LANE's. Read it freely. Never write it.
- `src/components/shell/**` is LANE 1's. Read it freely. Never write it.
- `src/routes/**` is LANE 1's. Read it freely. Never write it.
- `src/lib/**` is MAIN LANE's. Read it freely. Never write it.

**Reading any path is always allowed. Writing outside your prefix never is.** A file touched by two
lanes is what broke `main` on 2026-08-22. If a rebase conflicts inside `coordination/`, two writers
touched one file — fix the ownership, not just the conflict.

Need a change in a path you do not own? **File a request. Do not edit it and do not work around it.**

## 5. Your units, in order

### L0-A — DO THIS FIRST. It unblocks LANE 1. Push it within 20 minutes.

Create `src/components/track/TrackRun.tsx`:

```tsx
export function TrackRun({ trackId }: { trackId: string }) { ... }
```

A stub is correct and wanted here: render the `trackId` and the seven station names from
`AGENT_STATION_ORDER`. Pass `bunx tsc --noEmit` and `bun run lint`, commit, **push immediately.**

**Why first:** LANE 1's first unit mounts this at `src/routes/_authenticated.track.$trackId.tsx` and
is blocked until the import target exists. A route importing a missing file breaks `tsc` for
everyone. Your stub is what lets three lanes work in parallel.

### L0-B — Make it live

Fill `TrackRun` in so it shows one track walking seven stations, updating **without a page refresh.**

- Compose `RunMap` in `mode="live"`. Build `RunMapStation[]` for the track's route.
- Subscribe to `GET /api/tracks/:id/stream` (Server-Sent Events, built by MAIN LANE). **MAIN publishes
  the exact event shape into `MISSION.md` — read it there.** If it is not published yet, file a
  request, code against your best reading of `src/lib/ask-sse.ts` (which already carries a station
  field), and keep going.
- Add `RunTimeline` beneath it for the event history, and `ToolStream` for what the agent is doing
  right now. A person should be able to tell, at a glance: which station is running, what it just
  produced, and what it is doing this second.
- Handle the three real states honestly: **waiting** (nothing has happened yet — a normal first
  second, not an error), **held** (a station is stuck and the reason must be visible), and **done**.

### L0-C — The two moments that make this product worth paying for

Give these the most visual weight on the page. Everything else is scaffolding around them.

1. **The forecast card.** Before Build, the run states what it expects to happen. Draw it as a
   **recorded commitment with its timestamp** — not as a note, not as a tooltip. This is the only
   thing in this market that cannot be reconstructed after the fact, and it must look like it.
2. **The Learn verdict card.** After Ship: *predicted X · actually Y · what we now believe.* This is
   the payoff of the entire loop and the founder has never seen it happen once.

**Copy rules, non-negotiable, from the locked positioning canon:** never *receipts, ledger, company
brain, decision layer, unattended, first run, provenance*. "Audit trail" and "shared brain" are fine.
Never use *remembers*, *stores* or *logs* as verbs of the brain. **Never claim accumulated learning in
the present tense** — the honest form is *the loop is wired and proven, and it begins accruing on
first real use*. "Approve" only where a click UNBLOCKS something; "review" where it only shows you
something. Full canon: `docs/strategy/positioning-locked-2026-08.md`.

### L0-D — Then take whatever acceptance criterion in §7 is not yet true and is yours by path.

## 6. Standing rules. All of these are non-negotiable and all were paid for.

**THE DEV SERVER STAYS OFF.** Start it only when a change genuinely must be seen in a browser, and
**stop it the moment that check is done.** A server left running exhausts RAM and the machine shuts
down. This has actually happened on this machine. Never leave one up "in case".

**Commit after every logical piece, then push.** Unpushed work does not exist — no other lane can
read it, and an overnight session that dies with six hours unpushed has produced nothing.

```
git pull --rebase origin main     # before every unit
   ... one unit of work ...
git add <the files you touched, BY NAME>
git commit -F <message file>
git pull --rebase origin main     # again — the other lanes pushed while you worked
git push origin main
```

- **`git commit -F <file>`, never `-m`.** zsh evaluates backticks inside `-m` and silently deletes
  words from your message.
- **Never `git add -A`.** Stage by name. The index may already hold changes you did not stage, and
  sweeping the tree picks up another lane's half-finished edits. That is exactly how `main` broke.
- **Never `git checkout --` anything.** It has destroyed uncommitted work in this repo.

**You do NOT edit BUILD-QUEUE.md — MAIN owns it.** Report a finished item by writing
**one file per finished unit** in `coordination/units/`, prefixed `L0-`. Say what you changed, the
actual gate output, and — this matters most — **anything you could not verify.**

**You have no database, no deploy, no Mobbin and no founder access.** Need one? File
`coordination/requests/L0-<n>-<slug>.md`, push it, and **take the next unit while you wait. Never
stall.** MAIN LANE answers in `coordination/answers/`.

**Verification is Playwright plus whatever skills you have available.** And:

- **A mount is not a render.** `<TrackRun />` sitting in the route tree does NOT prove the feature
  exists. Two sessions here have already reported a surface working that was never mounted.
  Screenshot it, or assert on real text.
- **Do not measure immediately after navigating** — you will read the loading state.
- **A failed browser check may simply be the truth.** Two sessions blamed headless focus for a
  palette that was not mounted at all. Suspect the product before the instrument, but suspect the
  instrument when a known-good control fails too.

**Meridian is the only design system and `bun test` enforces it.** No `--sp-*`, `--ds-*`, `--text-*`,
`--hairline`, `--raised`, `data-obsidian`, and no raw colours. A test fails if a **new** file carries
a retired token, and fails if an **existing** file grows its count. **If no `--mrd-*` token fits, that
is a gap in Meridian — file a request. Never widen the baseline to pass.** Meridian's quality bar is
`beautifui.dev` exactly, and the brand ember belongs in the logo, never in an interaction state.

**Gates before every push:** `bunx tsc --noEmit`, `bun test`, `bun run lint`.

- **Never pipe a gate into `tail` and trust the exit code.** The pipe reports `tail`'s status, so a
  failing gate looks green. `main` shipped red exactly that way.
- **tsc + lint clean is NOT green here.** `bun test` holds the real invariants.

**Two things that will waste your time if you do not know them:** a renamed export reads exactly like
a missing one — grep for the component before concluding it does not exist. And a defect is a shape,
not a location: after any copy or token fix, sweep every sibling field mechanically rather than
reading them one at a time.

## 7. Acceptance — what "done" means, and it is not "tests pass"

1. A route exists at `/track/:trackId` showing one track's seven stations.
2. **It moves without a page refresh** while the run walks.
3. A person can start a run in one action, **with no configuration.**
4. It completes seven stations in **minutes, not hours.**
5. A forecast is recorded **before** Build and graded **after** Ship, on a real workspace, and both
   are visible on the run.
6. Every "it works" carries the `file:line` or the query that proves it. **A number without its query
   is not evidence** — three metrics that proved this product worked turned out to be seed data.
