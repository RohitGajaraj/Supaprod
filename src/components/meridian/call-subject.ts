import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

/**
 * WHAT A CALL SITS IN FRONT OF, OR NOTHING.
 *
 * ── TWO SURFACES DISAGREED AND ONLY ONE HAD WRITTEN DOWN A REASON ──────────
 * `/approvals` resolves this to null and draws nothing, and says why: *"null is
 * drawn as nothing rather than as 'Workspace', because inventing a container
 * for a call that has none says something the read never said."*
 *
 * The board drew `?? "This workspace"`. That is not a wording difference. It is
 * a claim about scope, made on a call where the read returned no scope at all.
 *
 * ── WHY THE FALLBACK IS ACTUALLY WRONG AND NOT MERELY BOLD ─────────────────
 * `projectName` is null for two different reasons and the payload cannot tell
 * them apart:
 *
 *   the family IS workspace-wide      memory, house rules, trust, assumption
 *                                     challenges, playbooks. Six families set
 *                                     `projectName: null` outright, and for
 *                                     these "This workspace" is TRUE.
 *   the lookup missed                 `approvals-queue.functions.ts:563` reads
 *                                     `d.prd_id ? projectByPrd.get(d.prd_id)
 *                                     : undefined`. A decision that BELONGS to
 *                                     a PRD, whose project did not resolve,
 *                                     lands here with `projectId` null too - so
 *                                     it is indistinguishable from the case
 *                                     above, and "This workspace" is FALSE. It
 *                                     belongs to a project we could not name.
 *
 * Because the two collapse into one null, no client-side guard can separate
 * them. The only honest move left is to stop making the claim.
 *
 * ── AND IT COSTS ALMOST NOTHING TO STOP ───────────────────────────────────
 * The board is already scoped to one workspace, and every other row on it
 * belongs to that workspace. "This workspace" is therefore close to
 * contentless even when true: it restates the frame the reader is inside. So
 * the trade is a sentence that is sometimes false against a sentence that is
 * usually empty, which is not a close call.
 *
 * ── IT LIVES HERE SO THE TWO SURFACES CANNOT DRIFT AGAIN ──────────────────
 * `/approvals` folds (SURFACE-MAP, R-04) and its version is a private function
 * in the route file, so the reasoned answer would have died with the door -
 * the same shape as `stopped-for`, which moved here for the same reason.
 */
export function callSubject(item: ApprovalQueueItem): string | null {
  // An empty string is not a name; rendered, it is a separator with nothing
  // after it.
  return item.project?.trim() || item.projectName?.trim() || null;
}
