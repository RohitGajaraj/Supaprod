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
| F-03 | **`main` was red and pushed.** Three agent-written endpoints could not compile — `.from("users")` on a table that does not exist, and an invalid `context` option on a server-fn call | `tsc` 7 errors | Reverted. The replacement `driveTrackNow` follows repo convention |

### OPEN — queued, with the backlog item that carries it

| # | Finding | Where | Item |
| --- | --- | --- | --- |
| F-04 | **The app-wide composer creates MISSIONS, not TRACKS.** `chat.ts` explicitly defers `startTrackCore` pending *"the mission/track question"*. `AskDock` says "What should we build?" on every screen and files an object the run workbench cannot see. **This is the mechanical answer to why only 59 tracks have ever existed** | `src/routes/api/chat.ts:1130` | **16** |
| F-05 | **`startTrack` writes `workspace_id = NULL`**, overriding the column default. The sweep filters `NOT IN`, and **in SQL `NULL NOT IN (...)` is NULL** — such a track is dropped from every batch, forever, silently | `track.functions.ts:272`, `track-tick.ts:93` | **17** |
| F-06 | A null-workspace track bills AI spend to the **operator's personal credit account**, and escapes the pause switch and spend ceiling | `runtime.server.ts:1091` | **18** |
| F-07 | **Track spend ceiling is OFF in all 21 workspaces** — an un-backfilled NULL read as a deliberate "no ceiling" | migration needed | **19** |
| F-08 | **57 of 59 tracks carry a hold reason; `/track/:trackId` renders none of it.** `getTrack` exists with **zero callers**. Retry is hidden on the four holds it was built to clear | `src/components/track/` | **20** |
| F-09 | **The run transcript is silent to assistive tech.** 22 files poll or stream, 27 carry `aria-live`, **the intersection is empty**. `Action` has `busy` and 65 of 105 pending sites do not pass it | product-wide | **21** |
| F-10 | `/boundary` (1131 lines) has **no rail door** and is reached only from `/crew` and a component rendered *inside* the Safety room — so that room answers its own question by linking the reader out of itself | `_authenticated.boundary.tsx` | **22** |
| F-11 | **`resolveApprovalPolicy` has ZERO callers.** The whole approval-policy engine, with its demotion invariant, is dead code. **It is also the asset the strategic angle rests on** | `src/lib/ai/approval-policy.ts:230` | not yet queued — see `FRONTIER-BRIEF.md` §4 |
| F-12 | **`release.publish` — the one correctly-gated irreversible act — has NEVER raised an approval**, while `cluster.trigger`, which four sources say must never be gated, raised 90. **The gate is inverted** | `defaults.ts:188` | not yet queued |
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
