# WO-BE — Build-engine lanes A/B/C (native path, honesty-tagged)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Context ruling (founder, 2026-07-23): Conductor (conductor.build) stays our internal dev tool — its terms allow internal use and prohibit embedding/white-labeling in a product. Supaprod builds the EQUIVALENT experience on its own seam. These three lanes make the native path Conductor-grade for real; the premium rung is PC-35 (separate packet). The patch driver flag (`CLAUDE_SDK_BUILD_DRIVER_ENABLED`) stays OFF — it is single-shot, never live-tested, and would not even fire without `spec.targetFiles`.

## BE-A — Route dispatch through the driver seam (S)

**WHY.** `dispatchStudioSession` (`src/lib/studio.functions.ts:325`) hard-calls `nativeBuildDriver.dispatch()`, bypassing `resolveBuildDriver` (`src/lib/build/resolve.server.ts`) — the seam exists but nothing uses it. Routing through the resolver is bit-identical today (unset `BUILD_DRIVER` resolves native) and makes driver choice a config change forever.

**Files owned:** `src/lib/studio.functions.ts` (the dispatch call site), `src/lib/build/driver.ts`, `src/lib/build/resolve.server.test.ts` + one new test file.

**Steps:**
1. At the call site: `const driver = resolveBuildDriver();` — if the resolved driver id is not `native`, log the reason and degrade to native (both other wired adapters require a pre-existing `ctx.missionId` and would throw at this ctx shape; degrading is the honest behavior).
2. Do **NOT** wire `chooseBuildDriverId` — booby trap: a spec with zero `targetFiles` returns `"claude-sdk"` (see `claude-sdk-driver.server.ts:117`), and product dispatches never set `targetFiles`. Leave it unused.
3. Registry honesty: remove `"claude-sdk"` from `RESERVED_BUILD_DRIVER_IDS` in `src/lib/build/driver.ts:37-42` (it HAS a wired adapter; the reserved list currently misreports).
4. Tests: default resolution is native; non-native resolution at this call site degrades to native with the logged reason; the mission row stamps `build_driver='native'`.
5. Report honestly: `dispatchBuilderMission` (`src/lib/build.functions.ts:361`) is a second dispatch door that bypasses the seam — out of scope here; never claim "all dispatch goes through the seam."

**Acceptance:** `bun test src/lib/build` green; one dev dispatch produces an identical mission/run to before (status queued, driver native).

## BE-B — The Conductor-grade board (S/M)

**WHY.** The Build home already polls sessions every 5s with three lenses, and `StudioSessionListItem.changeset` already carries `branch`, `file_count`, `pr_url`, `pr_number`, `status` — but `BuildMissionRow.tsx` renders none of them. Rendering them gives the parallel-missions board its Conductor feel with zero server change.

**Files owned:** `src/components/obsidian/BuildMissionRow.tsx`.

**Steps:**
1. Add a quiet mono chip row per mission card: branch name (when a changeset exists), `N files`, and PR/CI state worded from `changeset.status` (staged / PR open / merged). Slate chips per the design law; timestamps right-aligned mono.
2. A LIVE pulse dot on rows whose run status is running (data already present); a slate "needs you" flag on rows with an open gate.
3. Do **NOT** compute +/− line stats in the list payload — it would diff changeset content on a 5s poll. `file_count` on the board; real +/− lives one click in.

**Acceptance:** dispatch 2-3 concurrent missions on dev; rows show branch/files/PR chips updating on the poll; grayscale test passes; `tsc/build/test` green.

## BE-C — Build-face floor pass + focus state (M)

**WHY.** The in-room CodeFace/BuildDeck is substantially AT the screen-3 floor (verified 2026-07-23). Remaining deltas: no door to hunk review, driver line placement louder than the mockup's kebab, the Critic-Revise color-law violation, and the new focus-collapse state (screen-3b Frame B).

**Files owned:** `src/components/mission/faces.tsx` (CodeFace/BuildDeck + the Revise-verdict color fix at ~line 337).

**Steps:**
1. Add a quiet "Review hunks" affordance on the diff header → `/build/$missionId?tab=changes` (per-hunk reject already works in `ChangesPanel` — do not rebuild it in-room).
2. Driver line ("Build finished by Supaprod native"): if rendered louder than the mockup's closed-kebab treatment, move it behind the kebab/footer disclosure.
3. Fix the color-law violation: the Critic "Revise" verdict currently renders in `var(--voice-memory)` — verdicts never wear the memory voice; re-skin to the slate chip tokens.
4. The focus state per `screen-3b-build-focus.html` Frame B: when the user expands the diff/terminal work area, collapse the Thread to the 48px rail and the Spine to the slim strip (CSS-first; a `data-focus` attribute on the shell region is acceptable). Escape/rail-click restores. If the shell-level collapse requires touching `MissionShellView`, coordinate with WO-A's merge first and keep the change additive (a prop/class, no re-layout of other faces).

**Acceptance:** visual check against screen-3 + screen-3b; hunk door round-trips; focus collapse + restore works; reduced-motion unaffected; `tsc/build/test` green.
