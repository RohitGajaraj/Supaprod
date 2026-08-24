# Findings ledger — what was found, what was fixed, what is still open

> **MAIN LANE owns this file and updates it the moment a finding's status changes.**
> _Its whole purpose is that nothing found goes orphaned._ This repo's dominant defect is work that
> exists and nothing reaches — `TrackActivity` sat unread for 24 days, `resolveApprovalPolicy` has
> zero callers, `run-rows.tsx` is 22.8KB nobody imports. **A finding nobody can find is the same
> defect wearing a different hat.**
>
> **Every agent, every lane, every session reads this before re-investigating anything.** If a
> symptom here says FIXED, do not re-diagnose it — check the commit named and move on.

**Status keys:** `FIXED` verified, with the commit · `OPEN` real, queued, not started · `DEFERRED`
real, deliberately not now, with the reason · `FALSE` investigated and disproved, **kept so nobody
re-finds it**.

---

## 2026-08-25 — the night the loop was traced

### FIXED

| # | Finding | Evidence it was real | Fix |
| --- | --- | --- | --- |
| F-01 | **Agents had no clock.** `decision.record` refuses a past `forecast_horizon_date`; the prompt never said what day it was, so a model guessed the year from its training cutoff, was refused, and burned its step budget guessing. One strategist run spent **68,260 tokens** on it. All five live tracks died at `MAX_STATION_ATTEMPTS` | The run's own words: *"All date attempts are failing… I'll use a date far enough ahead to be unambiguously future: January 1, 2026."* It was August 2026 | Today's date injected into every agent system prompt. `src/lib/ai/loop.server.ts`. **Verified deployed in Lovable HEAD by reading the file back** |
| F-02 | **The PII guardrail shredded UUIDs.** `floor-pii-phone` matched the leading digit-and-hyphen run of a UUID. The next station received `PRD id [REDACTED:pii]e-4f49-…` and answered, correctly and uselessly, that it could not proceed | Real row `55688633-679e-4f49-b5b2-12f21e858042` matched; **2 of 4 PRDs in the live workspace** | Lookbehind/lookahead boundaries added. **0 UUIDs redacted, 5/5 phone shapes still caught.** `guardrail-floor.ts` |
| F-14 | **The clock split the crew and the driver called the station empty. THIS is the mechanical reason no track has ever finished.** The seat cursor fixed the SPENDING half of a crew cut short by the tick deadline and left the VERDICT half broken: the tick that FINISHES a resumed crew judges the station on its own harvest, so a producing seat in the earlier tick and a checking seat in the later one reads as `produced-nothing`, counts an attempt, and three of those is `given-up` | Track `f9e41393` at `decide` filed **three decisions** on 2026-08-24 (20:41, 21:01, 21:20, all in `spine_track_members` at `decide`) and was given up on for filing nothing. Every strategist run exceeded the 45s deadline **by itself**, so that crew could never once reach its second seat in one tick — structural, not unlucky. **23 of 59 tracks were sitting on `out-of-time`** | `didStationProduce` (`driver.ts`), wired in `driver.server.ts`, scoped to this station and this arrival. Ordinary path unchanged and costs no query. Commit **`5d0780bdb`**, 8 tests. Full write-up in [`EXPERIMENT-first-finish.md`](./EXPERIMENT-first-finish.md) |
| F-15 | **Starting a track from one sentence has never once worked, and F-05 was the wrong reading of why.** `spine_tracks.workspace_id` is **NOT NULL** with default `current_user_default_workspace()`. A default fires only when the column is ABSENT from the insert; the code wrote `?? null`, PostgREST sent an explicit null, and Postgres **refused the row**. So `startTrack` did not make a track in the wrong workspace — it made no track at all | `count(*)=59, count(theme_id)=58`; `theme_id` is set by the promotion sweep alone and the 59th is the 2026-08-01 seed row. **Zero triggers** on the table, so omission is the only route to the default. F-05's `NULL NOT IN (...)` consequence is real in SQL and **unreachable here** — the constraint refuses first | Column omitted when no workspace is named; optional `workspaceId` gated through a `workspace_members` proof on the caller's own RLS client (not in Core, which the sweep calls service-role); the not-null violation now names the setup gap. Commit **`3eb8d0f48`**, 7 tests |
| F-16 | **The track spend ceiling was OFF in all 21 workspaces.** `workspaces.default_track_spend_cap_usd` shipped with no default, was never backfilled, and `resolveTrackSpendCap` read the resulting null as a deliberate *"no ceiling"* — **a decision nobody had made and no surface in the product can make** | `SELECT count(*), count(default_track_spend_cap_usd) FROM workspaces` → **21, 0**, column default null. It also contradicted the file's own stated fail direction three paragraphs above the offending line. **The test covering it had the right name and the wrong assertion** | Migration `20260824230000` — backfill **and** column default, both applied individually and read back (**21, 21**, min 5.00, max 5.00, default 5.00). Resolver inverted; per-track explicit null untouched and now has its own test. Commit **`84e7fa7da`** |
| F-17 | **Migration `20260824200000` was in the repo, absent from the ledger, and had never run.** `/track` was an unreserved workspace slug, so a workspace could have claimed it and collided with the run route | `SELECT slug FROM reserved_workspace_slugs WHERE slug='track'` → **zero rows**, while the file sat in `supabase/migrations/`. **A migration file in git is not an applied migration** | Applied individually, read back, ledger row inserted |
| F-03 | **`main` was red and pushed.** Three agent-written endpoints could not compile — `.from("users")` on a table that does not exist, and an invalid `context` option on a server-fn call | `tsc` 7 errors | Reverted. The replacement `driveTrackNow` follows repo convention |

### OPEN — queued, with the backlog item that carries it

| # | Finding | Where | Item |
| --- | --- | --- | --- |
| F-18 | **THE LOOP IS GATED SHUT AT SHIP, AND THAT GATE IS DELIBERATE.** Traced end to end: with the default arc, every station's filing tool resolves to `auto` — `signals.log`, `decision.record`, `prd.draft`, `design.draft`, `studio.stage`, `studio.commit`, `studio.pr.open`, `learning.record`. **`release.publish` is the single exception.** It sits in `HIGH_RISK_FORCE_REVIEW`, `nextRampMode` returns null for it so it can NEVER graduate, and `resolveToolMode` pins it to `review` regardless of arc. `review` and `confirm` tools are *"queued as agent_approvals instead of run"* | `agent_approvals` holds **zero `release.publish` rows, ever** — not because the gate is broken but because **no track has ever reached Ship.** The pin is a founder ruling with its reason written at the line: *"a production deploy is irreversible from inside the product and customers see it. It is the only gate in the seven-station loop, which is what makes the autonomy of the other six defensible instead of reckless"* | **NOT A DEFECT AND NOT MINE TO FIX.** The acceptance says *no human touching it mid-run*; the governance floor says a human decides the irreversible step. **Both are the founder's and they contradict each other.** Filed as an open call in `RULINGS.md`, stated as three options |
| F-04 | **The app-wide composer creates MISSIONS, not TRACKS.** `chat.ts` explicitly defers `startTrackCore` pending *"the mission/track question"*. `AskDock` says "What should we build?" on every screen and files an object the run workbench cannot see. **This is the mechanical answer to why only 59 tracks have ever existed** | `src/routes/api/chat.ts:1130` | **16** |
| ~~F-05~~ | **SUPERSEDED BY F-15, and its stated consequence was wrong.** The insert was refused by a NOT NULL constraint, not silently dropped from a sweep. **Fixed** | — | — |
| ~~F-06~~ | **CLOSED BY F-15, and it could never have happened.** A null-workspace track cannot exist: the column is NOT NULL, so there has never been a track that could bill the operator's personal credit account this way. **The invariant is enforced by the database, not by a test** | — | — |
| ~~F-07~~ | **FIXED as F-16.** Backfill and column default applied and read back: 21 of 21 capped | — | — |
| F-08 | **57 of 59 tracks carry a hold reason; `/track/:trackId` renders none of it.** `getTrack` exists with **zero callers**. Retry is hidden on the four holds it was built to clear | `src/components/track/` | **20** |
| F-09 | **The run transcript is silent to assistive tech.** 22 files poll or stream, 27 carry `aria-live`, **the intersection is empty**. `Action` has `busy` and 65 of 105 pending sites do not pass it | product-wide | **21** |
| F-10 | `/boundary` (1131 lines) has **no rail door** and is reached only from `/crew` and a component rendered *inside* the Safety room — so that room answers its own question by linking the reader out of itself | `_authenticated.boundary.tsx` | **22** |
| F-11 | **`resolveApprovalPolicy` has ZERO callers.** The whole approval-policy engine, with its demotion invariant, is dead code. **It is also the asset the strategic angle rests on** | `src/lib/ai/approval-policy.ts:230` | not yet queued — see `FRONTIER-BRIEF.md` §4 |
| F-12 | **HALF STALE, half confirmed, and re-measured 2026-08-24.** CONFIRMED: `release.publish` has never raised an approval — and F-18 explains why, which is that no track has ever reached Ship. **STALE: `cluster.trigger` is no longer gating.** It is seeded `auto`, is catalogued reversible, and its last approval row is **2026-08-20 10:20**; Discover has filed signals and themes freely since. The 9 `pending` rows are abandoned, from 08-19/08-20, and the hold that once let them block every track is now scoped to a track's own gates. **The remaining live issue is 9 stale pending approvals nobody will ever answer** | `defaults.ts:121` | superseded by **F-18** |
| F-13 | **17 Meridian components have no importer**, including `run-rows.tsx` (22.8KB, ported from beautifui.dev) while three surfaces each invented their own row | `MERIDIAN-ADOPTION.md` | **15** |

### FALSE — investigated and disproved. Do not re-find these.

| # | Claim | Why it is false |
| --- | --- | --- |
| X-01 | *"The run primitives are mounted only in the component gallery"* (`agent-first-reimagining-index.md`) | Re-measured: `RunTimeline`, `ToolStream`, `RunMap`, `PlanGate`, `AgentInbox` all reach live surfaces |
| X-02 | *"The PII credit-card rule redacts UUIDs"* — my first hypothesis for F-02 | Tested: the card regex does not match a UUID. It was the **phone** rule |
| X-03 | *"Every UI-started track carries a null workspace"* (`SPEC-ONRAMP.md` §0.2) | `workspace_id IS NULL` is **0 of 59**. The code defect (F-05) is real but **latent** — no track has yet been created through that path |
| X-04 | *"313 approvals raised, zero ever approved"* (`FRONTIER-BRIEF.md`) | **120 of 323 were approved or executed.** People answer here 37% of the time. The zero figure is true of `cluster.trigger` alone |
| X-06 | *"12 test failures are pre-existing on main"* — carried in the MAIN goal, `BUILD-QUEUE.md` acceptance rule 3, and two handoffs | **Re-run 2026-08-24 22:5x UTC on a clean `main`: `bun test` is 10,654 pass / 0 fail / 22 skip / 36 todo across 628 files.** They were repaired and the claim outlived the repair. **A green suite is now the bar; anyone quoting the 12 is quoting a dead number** |
| X-07 | *"The 2 reset tracks were never actually re-driven"* — my own first read of round 1 | The database is **UTC** and the session was on IST. `driven_at 22:50` looked like yesterday and was four minutes ago. They ran six times. **Stamp `now()` into every query on this box** |
| X-05 | *"Nothing ever moves; the loop does not run"* — my own early framing | 13 of 59 tracks moved past station one; the five live ones walked 2–4 stations unaided before dying at the attempt ceiling |

### DEFERRED — real, deliberately not now

| # | Finding | Why |
| --- | --- | --- |
| D-01 | Small-screen and responsive work | Founder ruling R-19: no mobile product at this stage. **Accessibility is NOT deferred** |
| D-02 | Sending the 25 design-partner messages | Founder ruling R-14: no outreach until a run finishes end to end. **Held, not late** |
| D-03 | The seven-row station widget | Ruling R-13: Anthropic shipped it, measured it, disabled it. The transcript replaces it |
| D-04 | Collapsing the 48 redirect routes | R-15: deletion is the only irreversible move; it happens after a run finishes |

---

## How to keep this alive

**When a finding's status changes, the same commit updates this file.** A fix that does not move its
row here is not finished. When a workflow or sweep produces findings, they land in `GAP-AUDIT.md` in
full and get a one-line row here with a status — **the detail can live elsewhere, the STATUS lives
here.**

**Open founder calls are NOT findings** and stay at the foot of `RULINGS.md`.
