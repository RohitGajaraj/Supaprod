# BUILDLOG

Newest first. **What changed · why · what is next.** One entry per logical unit.

This file is a build record, not a status board — status lives in
[`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md), and what was found lives in
[`the-first-run/FINDINGS-LEDGER.md`](./the-first-run/FINDINGS-LEDGER.md).

---

## 2026-08-25 21:5x IST — deploy fired to unblock the live run · MAIN

**What.** `deploy_project` on current `main` (`045da4ef`). Everything below has been on `main` and
**undeployed**, which is why the acceptance run has spent seven station-drives grinding at Build
against a wall that is already fixed in source:

| | |
| --- | --- |
| **F-66** | `studio.pr.open` resolves the binding **before** trusting its cache, and refuses naming both repos. `studio.pr.merge` guarded too — it merges `/repos/{bound}/pulls/{stored number}`, which today 404s **by luck**. |
| **F-67** | `studio.unstage` exists, so a changeset carrying a forbidden path is no longer permanently unshippable. The commit refusal names it as the way out. |
| **F-68** | the driver cross-checks a seat's claim against its own `tool_calls`; every seat is told a step it was told failed may not be reported as done. |
| **R-27 #5** | a changeset that edited what CI runs may not ship. |
| **F-62** | `track_drives` — intervention is a log, not a slot the next sweep overwrites. |

**Why.** The mission's gate is *"watch a complete loop run itself end to end."* The run is at `build`,
`attempts 2`, `station_drives 7`, and **every one of those drives re-does ~90 seconds of real work
into a wall that source already removed.** Deploying is the shortest path between the code and the
gate.

**Next.** Verify the SERVING bundle rather than the publish status — F-59: a `status: completed`
describes the pipeline, not the bytes. Marker string `studio.unstage`, which is a new tool name and
so cannot be a stale match. Then watch for the first `studio.commit ok:true`.

**What I must decide.** Nothing yet. If the crew does not reach for `studio.unstage` on its own, the
refusal wording is the thing to change — not the tool.
