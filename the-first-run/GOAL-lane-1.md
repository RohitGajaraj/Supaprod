# LANE 1 — comprehensive brief

You are **LANE 1** on the Supaprod repo, worktree `cadence-lane-1`, running on OX Alpha via opencode.
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
6. Read every file in `coordination/answers/` you have not acted on. Those are rulings for you.
7. Read the last 5 files in `coordination/units/` — both lanes' recent work, so you do not repeat it.
8. Run `git status`.

**IF WORK IS HALF-DONE OR UNCOMMITTED, FINISH AND COMMIT IT BEFORE STARTING ANYTHING NEW.** A session
that died mid-unit leaves a dirty tree; that is your first signal, not a nuisance. Never restart the
sequence from zero — `coordination/units/` tells you how far the lane already got. If 12 of 40 units
are done, you start at 13.

## 2. Why this mission exists

The founder has been building for three months and **has never once seen a journey run end to end on
its own.** He is right, and it is not a missing feature. It is measured:

- `spine_tracks` (migration `20260801130000`) is the object that walks all seven stations. It exists
  and it works — `src/lib/spine/a-signal-walks-the-whole-spine.test.ts` proves it walks.
- **It has no route. 0 out of 84 authenticated routes surface a track.**
- `driveTrackOnce` has exactly **one** caller: the cron `src/routes/api/public/hooks/track-tick.ts`.
- That tick serves ≤5 tracks under one shared 45s deadline, ≤3 seats a station. Seven stations is ~21
  seats, round-robin. A journey takes **hours, invisibly, in a database table.**
- The moat — a forecast recorded before the outcome is known — has fired 146 times, **all inside two
  seeded demo tenants. 0 of 131 across six real workspaces.**

`spine_tracks`' own migration argued for itself on exactly this ground: *"A person needs one address.
The learning curve of this product is the number of nouns in it, and 'your work is eight different
things depending on which page you are on' is the expensive version."* **That fix shipped as a table
and stopped there. 84 doors is the expensive version, and it is what the product still is.**

**In an agentic product the system walks and the person watches. Today the person walks and the system
waits.** Your half of the fix is the two ends: **the way in, and the doors.**

## 3. THIS IS AN ASSEMBLY MISSION

**Almost everything you need already exists.** The default move is to wire what is there. If you
create something new, your unit file must say what you tried first and why it did not serve.

Things that already exist and that you should wire rather than rebuild:

| Thing | Where | Note |
| --- | --- | --- |
| `startTrackCore` | `src/lib/spine/track.functions.ts` | the track creator. MAIN wraps it as `POST /api/tracks` |
| `AskDock` | `src/components/ask/AskDock.tsx` | LANE 0's path — read, never write |
| `AskComposer` | `src/components/today/AskComposer.tsx` | LANE 0's path |
| `GlobalComposer` | `src/components/mission/composer/` | LANE 0's path. It is a thin wrapper that returns `AskDock` |
| composer mount | `src/routes/_authenticated.tsx` | **yours** |
| `run-strip` | `src/components/shell/run-strip.tsx` | **yours.** A run strip in the shell already exists |
| `AppFrame` (the rail) | `src/components/shell/AppFrame.tsx` | **yours** |
| station order | `@/lib/agent-vocabulary` → `AGENT_STATION_ORDER` | **never write station lists as literals** |

There is already a test named `src/components/ask/__tests__/one-prompt-per-screen.test.ts`. Read it
before you add any input — there is a standing rule about one composer per screen and you will trip it.

## 4. What you own, and it is absolute

**YOU WRITE ONLY:**
- `src/routes/**` **EXCEPT** `src/routes/api/**`
- `src/components/shell/**`
- `src/styles/**` **EXCEPT** `meridian.css`

Not yours, ever: `src/lib/**` and `src/routes/api/**` and `src/components/meridian/**` and
`src/styles/meridian.css` (MAIN LANE). `src/components/**` other than `shell/` (LANE 0).

**Reading any path is always allowed. Writing outside your prefix never is.** A file touched by two
lanes is what broke `main` on 2026-08-22. If a rebase conflicts inside `coordination/`, two writers
touched one file — fix the ownership, not just the conflict.

Need a change in a path you do not own? **File a request. Do not edit it and do not work around it.**

## 5. Your units, in order

### L1-A — DO THIS FIRST

Mount `src/routes/_authenticated.track.$trackId.tsx`, importing `TrackRun` from
`@/components/track/TrackRun` and passing the route param through as `trackId`.

**LANE 0 pushes that stub component as its own first unit.** Pull until you see it. **If it is not
there yet, do not idle and do not create it yourself — it is LANE 0's path.** Start L1-C instead and
come back.

**This is the one URL the entire mission is about.** It must be linkable, revisitable, and shareable —
the founder's test is that he can send someone the link to a finished run.

### L1-B — The on-ramp. This is the difference between a demo and a product.

**One box. One sentence of intent. One action. ZERO configuration.** A person types what they want,
and lands on `/track/:id` watching it walk.

- Call `POST /api/tracks` (MAIN LANE builds it; the contract is in `the-first-run/MISSION.md`). It returns
  a track id. Navigate to `/track/:id`.
- **No workspace picker, no product picker, no station picker in the path.** If something is genuinely
  required, default it and disclose it afterwards. MAIN's endpoint defaults the workspace and product
  and reports what it defaulted — surface that as a line the user can change later, never as a gate
  before anything happens.
- **A user who must configure before anything happens is a user who does not come back.** This is the
  single highest-leverage line in this brief.
- The composer components are LANE 0's path. **Wire at the route level** (`_authenticated.tsx` is
  yours), or file a request if the composer itself must change.

### L1-C — The doors. 84 authenticated routes, and that count IS the learning curve.

Do these **one at a time, each its own commit, each with its own unit file. Never a mass rename.**

- **`_authenticated.discover.tsx` and `_authenticated.discovery.tsx` are two doors to one station.**
  Read both, keep one, redirect the other.
- **Close routes that promise what the destination cannot deliver.** The precedent and the standard:
  the landing hero's tertiary link read *"Watch a real run"* and pointed at `/demo`, which is live
  seeded data where nothing moves. It was **removed entirely**, not relabelled, because it read as an
  orphaned third door. Apply that standard.
- **The rail should lead to a run.** A person landing in this product should reach a live run in one
  click, not assemble the journey themselves by navigating. `AppFrame.tsx` and `run-strip.tsx` are
  yours; the rail is already Today · Runs · Brain · Guardrails.
- **Before deleting or redirecting anything, open it.** Some of the 84 are real and load real work.
  A README describes what a surface was meant to be; the rendered page wins.

### L1-D — Then take whatever acceptance criterion in §7 is not yet true and is yours by path.

## 6. Standing rules. All non-negotiable, all paid for.

**THE DEV SERVER STAYS OFF.** Start it only when a change genuinely must be seen in a browser, and
**stop it the moment that check is done.** A server left running exhausts RAM and the machine shuts
down. This has actually happened on this machine. Never leave one up "in case".

**Commit after every logical piece, then push.** Unpushed work does not exist — no other lane can
read it, and a session that dies with six hours unpushed has produced nothing.

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
  sweeping picks up another lane's half-finished edits. That is exactly how `main` broke.
- **Never `git checkout --` anything.** It has destroyed uncommitted work in this repo.

**You do NOT edit BUILD-QUEUE.md — MAIN owns it.** Report a finished item by writing
**one file per finished unit** in `coordination/units/`. Say what you changed, the actual gate output,
and — this matters most — **anything you could not verify.**

**You have no database, no deploy, no Mobbin and no founder access.** Need one? File
`coordination/requests/<n>-<slug>.md`, push it, and **take the next unit while you wait. Never
stall.** MAIN LANE answers in `coordination/answers/`.

**Verification is Playwright plus whatever skills you have available.** And:

- **A mount is not a render.** An element in the route tree does NOT prove the feature exists. Two
  sessions here already reported a surface working that was never mounted. Screenshot, or assert text.
- **Do not measure immediately after navigating** — you will read the loading state.
- **A failed browser check may simply be the truth.** Suspect the product before the instrument, but
  suspect the instrument when a known-good control fails just as badly.

**Meridian is the only design system and `bun test` enforces it.** No `--sp-*`, `--ds-*`, `--text-*`,
`--hairline`, `--raised`, `data-obsidian`, no raw colours. A test fails if a **new** file carries a
retired token and fails if an **existing** file grows its count. **If no `--mrd-*` token fits, that is
a gap in Meridian — file a request. Never widen the baseline to pass.** You own `src/styles/**` except
`meridian.css`, so you are the lane most able to break this by accident. Meridian's bar is
`beautifui.dev` exactly; the brand ember lives in the logo and never in an interaction state.

**Copy rules, from the locked positioning canon:** never *receipts, ledger, company brain, decision
layer, unattended, first run, provenance*. "Audit trail" and "shared brain" are fine everywhere. Never
*remembers*, *stores* or *logs* as verbs of the brain. **Never claim accumulated learning in the
present tense.** "Approve" only where a click UNBLOCKS something; "review" where it only shows you
something. Canon: `docs/strategy/positioning-locked-2026-08.md`.

**Gates before every push:** `bunx tsc --noEmit`, `bun test`, `bun run lint`.

- **Never pipe a gate into `tail` and trust the exit code.** The pipe reports `tail`'s status, so a
  failing gate looks green. `main` shipped red exactly that way.
- **tsc + lint clean is NOT green here.** `bun test` holds the real invariants.
- Touching docs? `bun run docs:check`. A new doc must be linked from its folder index in the same
  commit or `docs-doctor` fails the commit.

**Two traps this repo keeps hitting:** a renamed export reads exactly like a missing one — grep for
the symbol before concluding it does not exist. And a defect is a shape, not a location: after any
copy or token fix, sweep every sibling field mechanically instead of reading them one at a time.

## 7. Acceptance — what "done" means, and it is not "tests pass"

1. A route exists at `/track/:trackId` showing one track's seven stations.
2. **It moves without a page refresh** while the run walks.
3. A person can start a run in one action, **with no configuration.**
4. It completes seven stations in **minutes, not hours.**
5. A forecast is recorded **before** Build and graded **after** Ship, on a real workspace, and both
   are visible on the run.
6. Every "it works" carries the `file:line` or the query that proves it. **A number without its query
   is not evidence** — three metrics that proved this product worked turned out to be seed data.
