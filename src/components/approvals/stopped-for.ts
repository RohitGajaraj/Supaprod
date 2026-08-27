/*
 * THIS FILE IS A FORWARDER AND IT IS TEMPORARY. DELETE IT ON THE MERGE.
 *
 * The module moved to `@/components/meridian/stopped-for` on 2026-08-27, for
 * the two reasons its own header now records: this folder folds (SURFACE-MAP,
 * R-04) and a phrase four components depend on cannot live inside a door being
 * removed, and `Gate` is a primitive, so a primitive importing from a feature
 * folder inverts the layering. That move stands and S1 endorsed it.
 *
 * ── WHY THE OLD PATH CAME BACK ANYWAY ──────────────────────────────────────
 * Moving it meant editing six importers, one of which is
 * `_authenticated.approvals.tsx` - S1's route, which they were concurrently
 * reworking in RUN-99 and RUN-100. Both edits land in the same import block, so
 * the two lane branches conflicted on a file where my entire contribution was
 * ONE import line against their rework of how that queue counts and pages.
 *
 * S4 found it with the lane-to-lane gate and the finding is worth restating:
 * a conflict like this is invisible to a main-only check BY CONSTRUCTION. main
 * holds neither side, so both branches truthfully answer "merges cleanly into
 * main" right up until the second one lands - and the lane that lands second
 * inherits it at the deploy, long after both sides have moved on.
 *
 * Resolving it would have meant taking a position on someone else's rework to
 * keep a one-line import. Forwarding instead REMOVES the conflict rather than
 * resolving it: my branch stops touching that file entirely, S1's branch keeps
 * working unchanged, and neither of us has to merge the other's lane.
 *
 * ── THE CONDITION FOR DELETING IT, so it does not become permanent ─────────
 * Once both lanes are on main, repoint the importer in
 * `_authenticated.approvals.tsx` at `@/components/meridian/stopped-for` and
 * delete this file. It has no reason to exist after that, and a forwarder kept
 * past its merge is exactly the kind of indirection this repo already pays for
 * elsewhere.
 */
export { isOverdue, stoppedFor, waitingSince } from "@/components/meridian/stopped-for";
