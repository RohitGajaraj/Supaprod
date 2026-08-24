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
| **2** | L1 | **READY** | **Landing becomes 3–4 job cards** in the user's words. **No station names** (R-01). Each maps to a `WorkShape` `suggestRoute` understands | New user reaches a running track in **one click, zero configuration**; click count recorded before and after |
| **3** | L0 | **READY** | **The artifact pane** — renders the thing being made, not a list of what was made. Build `decide` first, from `decisions` | Pane changes as the track walks, no refresh; a station that produced nothing says so; every line from a row the run wrote |
| **4** | L1 | **READY** | **Starting a track lands you on it.** `TrackStart` (`_authenticated.plan.index.tsx:893`) creates and does not navigate | Creating a track lands on `/track/:id`; back path intact |
| **5** | L0 | **BLOCKED → founder** | **The run's step list. HELD 2026-08-25: `FRONTIER-BRIEF.md` §1 shows Anthropic shipped this exact display, measured it, and DISABLED it — *"Claude keeps track of multi-step work without a written checklist"* — and no frontier agentic product renders a lifecycle coordinate. That is a call about what the product IS, not a patch. Items 1-4 do not depend on it.** Original brief: Stations as progress display (R-01), drawn like `emergent-live-steps.webp`. **Compose `src/components/meridian/run-rows.tsx` — `RunGlyph`, `RunClock`, `RunTook`, `RunSubject`, `RunRail`. 22.8KB of exactly this vocabulary, ported from beautifui.dev, with ZERO importers. Building a second one recreates the arbitrariness failure that file was written to end.** Plus `RunMap` `mode="live"` for the route | Five states render honestly; **display names come from one map — a raw station slug on screen is a bug**; active step's clock ticks |
| **6** | L1 | **READY** | **Collapse duplicate doors.** `discover.tsx` vs `discovery.tsx` first. **48 of 84 routes are pure redirects** | One at a time, one commit each; **open every route before touching it** |
| **7** | L0 | BLOCKED → 3 | **Tool calls become actionable cards** | Clicking a row that filed something reveals it in the pane |
| **8** | L1 | BLOCKED → 3,5 | **Two-pane layout** on `/track/$trackId` | Both panes at 1440px, no horizontal scroll; stacks below the Meridian breakpoint |
| **9** | L0 | BLOCKED → 3 | **Forecast card and Learn verdict card** | Reads real `forecast_*` columns; **0 are graded, so the verdict card needs an honest empty state** |
| **10** | L1 | **READY** | **The rail leads to a run.** `AppFrame.tsx`, `run-strip.tsx` | A live run is one click from any surface |
| **12** | L1 | **READY** | **Design review: Today** (`_authenticated.today.tsx`). Answer the five questions in R-12 in the unit file BEFORE changing anything. It is the post-auth landing and item 2 replaces it, so this review governs that replacement | Five questions answered in writing; every region named with the Meridian component it uses; regions nobody can name a job for are killed with the reason |
| **13** | L1 | **READY** | **Design review: Engine Room** — guardrails and approvals (`_authenticated.engine-room.tsx`, `govern.tsx`, `boundary.tsx`, `approvals.tsx`). **Four routes for one concept**; the review decides how many survive | As above, plus: which of the four routes remain and where the others redirect |
| **14** | L1 | BLOCKED → 12,13 | **Design review: Brain** (`_authenticated.brain.tsx`) and **Settings** | As above. **Brain must not claim accumulated learning in the present tense** (R-06) — 0 forecasts graded |
| **15** | L0 | **READY** | **Adopt what is already built.** From `MERIDIAN-ADOPTION.md`: evaluate `InsightCards`/`Entity` for the `sense` pane, `PromotionCard` for `decide`, `PairMark` for the handoff. **`Flowchart` is HELD — do not adopt** | Each either adopted with the surface named, or rejected in the unit file with the reason. Never adopted for adoption's sake |
| **11** | L0 | BLOCKED → 5 | **Motion.** pending → running → done reads as movement | Meridian `--ease`/`--d-*` tokens; **a raw duration is a bug** |

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
