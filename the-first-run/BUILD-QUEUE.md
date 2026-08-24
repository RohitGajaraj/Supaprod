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

## The specs. Read the one for your item before you start it.

| Spec | Governs | The correction in it you must not miss |
| --- | --- | --- |
| [`SPEC-ARTIFACTS.md`](./SPEC-ARTIFACTS.md) | items 3, 7, 9 | **"Four stations have no registered tool" is STALE.** `STATION_ARTIFACT` (`attach.ts:222`) now has a non-null `createdBy` for all seven and `NOTHING_LANDS_HERE` is `{}`. **A lane writing a "nothing lands here" branch is writing dead code.** Separately: `ship` has never had a single `spine_track_members` row while `deployments` holds 42 successful ones — **shipping happens outside the spine** |
| [`SPEC-LAYOUT.md`](./SPEC-LAYOUT.md) | items 5, 8, 11 | Split ratios, breakpoints, the finished-run inversion, and every Meridian token by name |
| [`SPEC-CONSENT.md`](./SPEC-CONSENT.md) | item 1 | Where the pending question actually comes from, and what `Decide all` may and may not widen |
| [`SPEC-ONRAMP.md`](./SPEC-ONRAMP.md) | items 2, 4 | The real click and decision count today, and which `WorkShape` each job card maps to |

**MAIN owes one thing before item 3 can finish:** `getTrackArtifacts` in `src/lib/spine/track.functions.ts`. `getTrackChain` answers *what was filed*; the pane needs *the thing itself*, and `ChainMember` carries no body. Building it tonight. **Item 3 can start now** against `decisions` without waiting.

## THE BACKLOG — one ordered list, most valuable first

**How to take work (R-07):** take the **topmost item you own that is not `BLOCKED` or `WIP`.** Scan
past blocked items. **Never cross into another lane's path.** Owning nothing unblocked means STANDING
WORK plus a `starved` request, never idling.

**The `Own` column decides ownership by PATH.** `L0` = `src/components/**` except `meridian/`+`shell/`.
`L1` = `src/routes/**` except `api/`, plus `src/components/shell/**` and `src/styles/**` except
`meridian.css`. `M` = `src/lib/**`, `src/routes/api/**`, `src/components/meridian/**`, `supabase/**`.

| # | Own | Status | Item | Acceptance |
| --- | --- | --- | --- | --- |
| **1** | L0 | **READY** | **Inline consent card.** A run needing a person asks INSIDE the run, at the station that raised it. Ref `design-reference/mobbin-2026-08/cofounder-inline-question.webp`. Data from `spine_tracks.pending_gates` (`[{id,station}]`); **`agent_approvals` has NO track back-reference**. Copy from `gateHeadline`/`toolConsequence`, never a literal | Ask shows without navigating away; consequence derives from `tool-consequences.ts`; declining records a reason; **a person can answer the CLASS, not only the instance** (90 dead gates were one question); screenshot, not a mount assertion |
| **2** | L1 | **READY** | **`/start` ALREADY EXISTS** (`_authenticated.start.tsx`, 922 chars) as a **gated redirect stub** that bounces to `/onboarding` — *"GATED FOR LAUNCH: experimental and incomplete"*. **Delete the gate; do not create the route.** It already imports `MissionOnboarding`. **DO NOT modify `_authenticated.today.tsx`** — it stays reachable and unchanged so the founder can compare. 3–4 job cards in the user's words, **no station names** (R-01), each mapping to a `WorkShape` `suggestRoute` understands. Promotion is later and is one redirect in `_authenticated.tsx`'s `beforeLoad` | New user reaches a running track in **one click, zero configuration**; click count recorded before and after |
| **3** | L0 | **READY** | **The artifact pane** — renders the thing being made, not a list of what was made. Build `decide` first, from `decisions` | Pane changes as the track walks, no refresh; a station that produced nothing says so; every line from a row the run wrote |
| **4** | L1 | **READY** | **Starting a track lands you on it.** `TrackStart` (`_authenticated.plan.index.tsx:893`) creates and does not navigate | Creating a track lands on `/track/:id`; back path intact |
| ~~5~~ | — | **CANCELLED (R-13)** | **The seven-row station widget is not built.** Anthropic shipped this display, measured it, and disabled it; no frontier agentic product renders a lifecycle coordinate. **The left pane is a transcript instead** — `TrackActivity` already builds it and already carries the handoff. `run-rows.tsx` remains the vocabulary. See `RULINGS.md` R-13 |
| **6** | L1 | **BLOCKED → 1,2,3,4 (R-15)** | **Deletion happens LAST, after a run has finished end to end.** Collapse duplicate doors. `discover.tsx` vs `discovery.tsx` first. **48 of 84 routes are pure redirects** | One at a time, one commit each; **open every route before touching it** |
| **7** | L0 | BLOCKED → 3 | **Tool calls become actionable cards** | Clicking a row that filed something reveals it in the pane |
| **8** | L1 | BLOCKED → 3 | **Two-pane layout** on `/track/$trackId` | Both panes at 1440px, no horizontal scroll; stacks below the Meridian breakpoint |
| **9** | L0 | BLOCKED → 3 | **Forecast card and Learn verdict card** | Reads real `forecast_*` columns; **0 are graded, so the verdict card needs an honest empty state** |
| **10** | L1 | **READY** | **The rail leads to a run.** `AppFrame.tsx`, `run-strip.tsx` | A live run is one click from any surface |
| **12** | L1 | **READY** | **Design review: Today** (`_authenticated.today.tsx`). Answer the five questions in R-12 in the unit file BEFORE changing anything. It is the post-auth landing and item 2 replaces it, so this review governs that replacement | Five questions answered in writing; every region named with the Meridian component it uses; regions nobody can name a job for are killed with the reason |
| **13** | L1 | **READY** | **Design review: Engine Room** — guardrails and approvals (`_authenticated.engine-room.tsx`, `govern.tsx`, `boundary.tsx`, `approvals.tsx`). **Four routes for one concept**; the review decides how many survive | As above, plus: which of the four routes remain and where the others redirect |
| **14** | L1 | BLOCKED → 12,13 | **Design review: Brain** (`_authenticated.brain.tsx`) and **Settings** | As above. **Brain must not claim accumulated learning in the present tense** (R-06) — 0 forecasts graded |
| **15** | L0 | **READY** | **Adopt what is already built.** From `MERIDIAN-ADOPTION.md`: evaluate `InsightCards`/`Entity` for the `sense` pane, `PromotionCard` for `decide`, `PairMark` for the handoff. **`Flowchart` is HELD — do not adopt** | Each either adopted with the surface named, or rejected in the unit file with the reason. Never adopted for adoption's sake |
| **11** | L0 | **READY** | **Motion on the transcript.** A new entry landing, and the live entry's clock ticking, must read as movement rather than a repaint. Item 5 was cancelled (R-13) so this applies to the TRANSCRIPT and the artifact pane, not to a station widget. Compose `run-rows.tsx` | Meridian `--ease`/`--d-*` tokens; **a raw duration is a bug** |
| **16** | M | **P0 · do first** | **The composer creates MISSIONS, not TRACKS.** `chat.ts:1130` explicitly defers `startTrackCore` pending *"the mission/track question"*. `AskDock` ("What should we build?", mounted app-wide at `_authenticated.tsx:232`) and `AskComposer` both open a chat and file a mission — an object `TrackChain`/`TrackActivity` cannot see. **This is the mechanical answer to why only 59 tracks have ever existed.** | Typing in the app-wide box creates a track and returns its id on the SSE frame. Interim if the mission/track question cannot be settled: the dock stops saying "what should we build" and says what it does |
| **17** | M | **P0 · do first** | **`startTrack` writes `workspace_id = NULL`**, overriding the column default. The sweep filters `.not("workspace_id","in",excluded)` and **in SQL `NULL NOT IN (...)` is NULL**, so such a track is dropped from every batch, forever, silently. Measured 0 null rows today **only because every existing track came from the promotion sweep** — items 2 and 4 will start creating them through exactly this path | `startTrack` accepts `workspaceId` gated through the membership check (`resolveWorkspaceId`, `audio.functions.ts:78`); the `?? null` is dropped so the column default fires; existing nulls backfilled |
| **18** | M | **P0 · do first** | **A track with no workspace bills AI spend to the operator's PERSONAL credit account** (`runtime.server.ts:1091`), escapes the workspace pause switch, and escapes the spend ceiling. **Fixed by 17** — this is why 17 is a blocker rather than tidy-up | Regression test asserting `resolveCreditAccountId` is never reached with a null workspace from `driveTrackOnce` |
| **19** | M | **P0 · do first** | **The track spend ceiling is OFF in all 21 workspaces** — an un-backfilled NULL is read as a deliberate "no ceiling" | Backfill migration, applied individually; NULL means default, never unlimited |
| **20** | L0 | **P0 · do first** | **57 of 59 tracks carry a hold reason and `/track/:trackId` renders NONE of it.** `getTrack` already exists with **zero callers**. The retry control is hidden on the four holds it was written to clear | The run says why it stopped, in the words the driver wrote, and offers retry where the hold is retryable |
| **21** | L0 | **P0 · do first** | **The run transcript is silent to assistive tech.** 22 files poll or stream, 27 carry `aria-live`, **the intersection is empty**. A screen-reader user cannot use the one thing this product exists for. Enterprise procurement blocker (R-19) | The transcript and the walk result sit in live regions; `Action` passes `busy` (65 of 105 pending sites still do not) |
| **22** | L1 | P1 | **Fold `/boundary` into `/engine-room`.** Audit settles it: `/guardrails` (8 lines) and `/govern` (64) already redirect there; **`/boundary` (1131 lines) has NO rail door** and is reached only from `/crew:516` and a component rendered *inside* the Safety room — so that room answers its own question by linking the reader out of itself | `/boundary` becomes `/engine-room?room=safety&view=rules`; `/approvals` loses its primary rail row per R-04 |

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
