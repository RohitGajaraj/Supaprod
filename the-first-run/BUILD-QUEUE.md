# BUILD QUEUE — the director's instruction set

> **MAIN LANE writes this file and nothing else in `src/`.** MAIN decides what gets built, models it,
> rules on requests, verifies against the database, and audits. **Execution is LANE 0 and LANE 1.**
> A lane reports completion by writing its own file into `coordination/units/`; MAIN moves the rows.
> _Last updated 2026-08-25 01:2x by MAIN LANE._

**Status keys:** `READY` start now · `BLOCKED` dependency named · `SHIPPED` in main, verified.

---

## Already in main. Extend these; do not rebuild them.

MAIN built these before the role split was drawn. They are pushed, typechecked, and green. **A lane
that rebuilds any of them has wasted a night.**

| Thing | Where | What it does |
| --- | --- | --- |
| `driveTrackNow` | `src/lib/spine/track.functions.ts` | Foreground walk. Loops `driveTrackOnce` with a fresh clock per seat, so a watched run is not rationed by the cron's shared 45s deadline. Stops on `moved`/`hold`/`arrivedAt`, never on prose. Returns `{track, steps, stopped, more}` |
| `/track/$trackId` | `src/routes/_authenticated.track.$trackId.tsx` | The one linkable address for a piece of work |
| `TrackRun` | `src/components/track/TrackRun.tsx` | Stacked: drive control + `TrackChain` + `TrackActivity`. **L0-3 replaces the layout, keeps the parts** |
| the agent's clock | `src/lib/ai/loop.server.ts` | Injects today's date into every system prompt. Without it agents burned 68k tokens guessing the year and every station died at `MAX_STATION_ATTEMPTS` |

---

## LANE 0 — writes `src/components/**` EXCEPT `meridian/` and `shell/`

### L0-1 · READY · **Inline consent. Build this first.**
When a run needs a person, the ask must appear **inside the run**, at the station that raised it.

**Why, measured:** 90 `cluster.trigger` approvals were raised since July into `/approvals` — a queue
detached from the work it blocked. **42 cancelled, 38 expired, 10 still pending, zero ever approved.**
A question that has to be found does not get answered. This single defect is most of the three months.

**Build:** a card in `TrackRun` that reads the track's `pending_gates` and renders, per gate: which
station asked, what the tool will do (use `gateHeadline`/`toolConsequence` in `src/lib/tool-consequences.ts`,
which already writes this copy), what happens if you decline, and **two controls**. Reference shape:
ChatPRD's *"Scan Website? · Not Now · Scan Now"*.

**Acceptance:** (1) a track holding `waiting-on-a-person` shows the ask on `/track/:id` without
navigating away; (2) the consequence sentence comes from `tool-consequences.ts`, never a literal;
(3) declining records a reason; (4) Playwright screenshot proves it renders, not that it mounts.
**"Approve" only where the click UNBLOCKS. "Review" where it only shows.**

### L0-2 · READY · **The artifact pane — the founder's "live preview".**
The right-hand pane that shows **the thing being made**, not a list of what was made.

**Why:** `TrackChain` lists "1 spec filed". Nobody relates to that. They relate to the spec. This is
what moves a person from spectator to operator.

**Build:** a pane that renders the current station's artifact as itself — signals at `sense`, the
decision at `decide`, the spec at `define`, the PRD at `design` — with its version and a save state.
Read-only is acceptable for v1 **if** the unit file says which artifacts will become editable and why
not yet. Use `STATION_ARTIFACT` in `src/lib/spine/attach.ts` for what each station produces.

**Acceptance:** (1) walking a track changes what the pane shows, without a page refresh; (2) a station
that produces nothing says so plainly rather than rendering blank; (3) no invented status — every line
derives from a row the run wrote.

### L0-3 · BLOCKED → L0-2 · **Two panes, not stacked.**
Recompose `TrackRun`: left = `TrackActivity` (the transcript), right = L0-2's artifact pane. Keep
`TrackChain` reachable but demote it. **Acceptance:** both panes visible at 1440px without horizontal
scroll; the layout degrades to stacked below the Meridian breakpoint.

### L0-4 · READY · **Tool calls become cards you can act on.**
`ToolStream` renders rows you can only read. A call that produced an artifact must link to it.
**Acceptance:** clicking a tool row that filed something reveals that artifact in the L0-2 pane.

### L0-5 · BLOCKED → L0-2 · **The forecast card and the Learn verdict card.**
Before Build: what the run expects, recorded, timestamped, as a commitment. After Ship:
*predicted X · actually Y · what we now believe.* **Acceptance:** both read real columns on
`decisions` (`forecast_claim`, `forecast_how_we_will_know`, `forecast_horizon_date`,
`forecast_resolution`). **14 real forecasts exist and 0 are graded — so the verdict card must have an
honest empty state, not a fabricated one.**

## LANE 1 — writes `src/routes/**` EXCEPT `api/`, `src/components/shell/**`, `src/styles/**` EXCEPT `meridian.css`

### L1-1 · READY · **The landing becomes three job cards. Build this first.**
**Why:** 84 authenticated routes IS the learning curve, stated as a number. ChatPRD's blank state is
one question and four cards, each a whole job, no configuration.

**Build:** replace the authenticated landing with 3–4 cards in **the user's words, not our station
names**. Proposed, and you may argue better: *"I have a problem and don't know what to build"* →
starts a track at `sense`; *"I know what to build — get it specified"* → starts at `define`;
*"Something shipped — tell me if it worked"* → opens Learn. `suggestRoute` in
`src/lib/spine/route.ts` already maps a work shape to an entry station; use it.

**Acceptance:** (1) a new user reaches a running track in **one click and zero configuration**;
(2) no station vocabulary on the card faces; (3) count the clicks in your unit file, before and after.

### L1-2 · READY · **Starting a track lands you on it.**
`TrackStart` is mounted at `/plan` and already creates tracks — and does not take you to the run.
**Acceptance:** creating a track navigates to `/track/:id`; the back path still works.

### L1-3 · READY · **Collapse the duplicate doors.**
`_authenticated.discover.tsx` vs `_authenticated.discovery.tsx` — two doors, one station. Read both,
keep one, redirect the other. Then find the rest. **One at a time, one commit each, never a mass
rename. Open every route before you touch it** — some of the 84 hold real work.

### L1-4 · READY · **The rail leads to a run.** `AppFrame.tsx` and `run-strip.tsx` are yours.
**Acceptance:** from any surface, a live run is one click away.

## MAIN LANE — decides, models, verifies. No product code.

| # | Item |
| --- | --- |
| M-1 | Answer every `coordination/requests/` file. I hold the database, deploys and Mobbin; a blocked lane is my cost. **Ask me for SQL — turnaround is minutes.** |
| M-2 | Prove a track that entered at `sense` reaches `learn`. Never happened in 59 tracks. Needs the date fix deployed, then the 5 `given-up` tracks reset. |
| M-3 | Grade one real forecast. 14 exist, 0 graded, `forecast_resolution_log` has never written a row. |
| M-4 | The 12 pre-existing test failures on main; 7 share one cause in the nav model. |
| M-5 | Positioning and architecture rulings, and this queue. |

---

## Acceptance that governs every item

1. **A mount is not a render.** Prove with a screenshot or a text assertion, never with "it's in the tree".
2. **A number without its query is not evidence.** Three metrics that proved this product worked were seed data.
3. **Gates before every push:** `bunx tsc --noEmit`, `bun test`, `bun run lint`. **Never pipe a gate into `tail`** — it hides the exit code and main shipped red that way. **12 failures are pre-existing; do not claim them and do not fix them silently.**
4. **Meridian only.** No `--sp-*`, `--ds-*`, `--text-*`, `--hairline`, `--raised`, `data-obsidian`, no raw colours. No `--mrd-*` fits → file a request; never widen the baseline.
5. **The dev server stays off** unless a browser check needs it, and **stops the moment it is done.**
6. **Commit after every logical piece and push.** `git commit -F`, never `-m`. Never `git add -A`.
7. **Work continuously until the founder says stop.** Out of work → re-read this file.
