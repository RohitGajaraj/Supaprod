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

1. Read **`the-first-run/START-HERE.md` FIRST.** It says what we are doing and why in one page:
   this is a transformation, not a feature sprint, and the dominant defect is UNWIRED work, so
   the default move is always to wire what exists rather than build new.
3. Read **`the-first-run/BUILD-QUEUE.md` — THIS IS YOUR WORK SOURCE.** It is ONE ordered
   backlog, not a list per lane. **Take the topmost item you OWN that is not `BLOCKED` or
   `WIP`** — the `Own` column decides ownership by PATH. Scan past blocked items rather than
   stopping at one. **Never cross into another lane's path.** Claim by writing one line into
   `coordination/units/` and pushing BEFORE you start; that is advisory, not a lock. If you
   own nothing unblocked, do STANDING WORK (RULINGS.md R-07) and file
   `coordination/requests/<n>-starved.md`. **Never idle.** MAIN stacks this file continuously,
   so re-pull rather than wait.
2. Read **`the-first-run/RULINGS.md`** FIRST of the design files. **It is the tiebreaker: if any
   two documents in this repo disagree, RULINGS.md wins.** It also lists what is still OPEN, and
   an open question is one you file a request about rather than decide yourself.
4. Read **`the-first-run/DESIGN-DIRECTION.md`** — the design ruling, and the reference IMAGES it
   names in `design-reference/mobbin-2026-08/`. **Open the .webp files.** You have no Mobbin access,
   so those images are the only way to see what is being asked for.
5. Read `the-first-run/MISSION.md` — the objective, and it governs every unit you write.
6. Read `the-first-run/EVIDENCE.md` — the production numbers behind every item in the queue.
7. Read `the-first-run/DIAGNOSIS.md` — why this mission exists, measured.
8. Read `coordination/STATUS.md` — MAIN LANE's current picture.
9. Read every file in `coordination/answers/` you have not acted on. Those are rulings for you.
10. Read the last 5 files in `coordination/units/` — both lanes' recent work, so you do not repeat it.
10. Run `git status`.

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

## 5. Your work comes from the backlog, not from this file

**`the-first-run/BUILD-QUEUE.md` is the single ordered backlog.** Take the topmost item you own that
is not `BLOCKED` or `WIP` (R-07). This section used to list units; it no longer does, because a
second list is a second source of truth and they drift. **If this file and the backlog disagree, the
backlog wins; if the backlog and `RULINGS.md` disagree, RULINGS wins.**

## 5b. THE SIX THINGS THAT GET A UNIT REJECTED ON REVIEW

**1. STATIONS ARE A PROGRESS DISPLAY, NEVER A MENU** (R-01). Never in the rail, never a route a
person browses to, never a station name on a card face. Inside ONE run they ARE the step list, drawn
like `design-reference/mobbin-2026-08/emergent-live-steps.webp`. **A raw station slug on screen is a
bug** — display names come from one map.

**2. CAN THE PERSON DO SOMETHING HERE, or are they only being told something?** (R-03) A surface that
only tells is a status panel and does not ship. This test rejected an artifact whose best moment was
a region reading *"The crew is idle, and that is fine."*

**3. READ THE SPEC FOR YOUR ITEM BEFORE STARTING IT.** `the-first-run/SPEC-ARTIFACTS.md` (what
previews per station, exact tables and columns), `SPEC-LAYOUT.md` (split ratios, breakpoints, every
Meridian token by name), `SPEC-CONSENT.md` (where the pending question comes from, what `Decide all`
may widen), `SPEC-ONRAMP.md` (the real click count, which `WorkShape` each card maps to). They carry
`file:line` on every claim and they correct earlier briefs in three places.

**4. GREP MERIDIAN BEFORE BUILDING A COMPONENT.** `the-first-run/MERIDIAN-ADOPTION.md` — 121
components, 95 adopted, **17 real components built with no door**, including `run-rows.tsx`: 22.8KB
of run vocabulary ported from beautifui.dev with **zero importers**. **Your unit file must name which
Meridian component you checked first and why it did not serve.** A unit that cannot answer that is
rejected. **You are never blocked on Meridian (R-17).** Build what you need LOCALLY in your own path and
ship it, and in the SAME commit file `coordination/requests/mrd-<name>.md` saying what you needed,
which Meridian component you checked first, why it did not serve, and the props you used. MAIN
promotes it into `src/components/meridian/` generalised and documented, then you swap and delete
yours. **The one hard line: never EDIT an existing file in `src/components/meridian/`** — a shared
primitive changes every surface using it and only MAIN can see them all.

**5. YOU DO NOT SIGN OFF YOUR OWN WORK** (R-11). Finishing an item means filing
`coordination/requests/verify-<item>.md` naming the route to open, the exact thing to look for, and
**what would prove it false**. The OTHER lane verifies with Playwright and reports separately. A
verify request addressed to you is standing work — take it. **A verifier that only confirms is not
verifying: say what you tried that should have broken it.**

**6. 12 TEST FAILURES ARE PRE-EXISTING ON `main`** — 7 share one cause in the nav model. **Do not
claim them, do not silently fix them, do not let them stop your push.** If the set changes, move your
own files aside and re-run before blaming yourself.

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
