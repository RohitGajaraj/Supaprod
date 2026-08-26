/**
 * THE RECORD BEHIND THE POLICY — what this workspace has actually answered.
 *
 * ── THE HALF THAT WAS MISSING ──────────────────────────────────────────────
 * `approval-policy.ts` has been complete and correct since it was written, and
 * has had **zero callers**. It is a pure function: hand it a tool and a record,
 * it tells you what that tool should need. **Nothing ever built the record.**
 * So the module that exists to shorten the approvals queue has never seen a
 * single real answer.
 *
 * This file is that record, read from `agent_approvals`.
 *
 * ── WHAT IT FINDS TODAY, MEASURED 2026-08-26 ───────────────────────────────
 *   delegate.openhands   0 approved · 7 rejected
 *   calendar.create      0 approved · 7 rejected
 *
 * **Fourteen requests for two tools that were refused every single time.** The
 * governance doctrine names exactly this: *"a long approvals queue is a policy
 * failure to surface, not a workload to render."* Asking a question whose answer
 * you already have, seven times, is worse than not offering it.
 *
 * ── WHY WIRING THIS CANNOT LOOSEN A GATE, WHICH IS WHY IT IS SAFE ──────────
 * Every path in `resolveApprovalPolicy` returns a decision equal to or STRICTER
 * than `axisDefault`: all-refusals gives `disabled`, `always-human` is returned
 * unchanged, consecutive rejections demote, and everything else falls through to
 * the base. `isNeverLaxerThanDefault` exists so a caller can assert that against
 * its own numbers, and this module's tests do.
 *
 * **So a record can switch a tool OFF and can make it ask more often. It can
 * never earn a tool more autonomy.** That belongs to `trust-ramp.ts`, whose whole
 * design is that promotion "never silently flips: the proposal is itself an
 * approval item". Two ladders pointing the same way would be one too many, and a
 * record that could loosen a floor is the one thing this must never be.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApprovalTrackRecord } from "@/lib/ai/approval-policy";

/** Statuses that represent a person actually ruling, as opposed to a timeout. */
const DECIDED = ["approved", "rejected"] as const;

/**
 * What this workspace has answered about this tool, or `undefined` when nobody
 * has ruled on it yet — which is the common case and the one
 * `resolveApprovalPolicy` treats as "no record, use the axis default".
 *
 * WORKSPACE-SCOPED, always. One team's refusals must never quiet another team's
 * tools; the enterprise gate requires `workspace_id` on every read and this is
 * exactly the kind of read where crossing it would be invisible and wrong.
 *
 * A FAILED READ RETURNS `undefined`, NOT AN EMPTY RECORD. The difference matters
 * and it is F-76's lesson again: an empty record is the positive claim "nobody
 * has ever ruled on this", which would silently discard a real history of
 * refusals and re-open a tool a person switched off. `undefined` says "I do not
 * know", and the policy then falls back to the axis default, which is the safe
 * direction.
 */
export async function approvalRecordFor(
  supabase: SupabaseClient,
  workspaceId: string,
  toolName: string,
): Promise<ApprovalTrackRecord | undefined> {
  try {
    const { data, error } = await supabase
      .from("agent_approvals")
      .select("status,decided_at")
      .eq("workspace_id", workspaceId)
      .eq("tool_name", toolName)
      .in("status", DECIDED as unknown as string[])
      .order("decided_at", { ascending: false })
      .limit(200);

    // Read the error rather than discard it — the single line F-76 was missing.
    if (error || !data) return undefined;
    if (data.length === 0) return undefined;

    const rows = data as Array<{ status?: string | null }>;
    let approved = 0;
    let rejected = 0;
    for (const r of rows) {
      if (r.status === "approved") approved += 1;
      else if (r.status === "rejected") rejected += 1;
    }

    /*
     * CONSECUTIVE, newest first, RESETTING ON ANY APPROVAL — the contract
     * `ApprovalTrackRecord` states in its own comment. Counted from the ordered
     * read rather than with a window function so the rule lives beside the
     * numbers it produces and a reader can check it without SQL.
     */
    let consecutiveRejections = 0;
    for (const r of rows) {
      if (r.status === "rejected") consecutiveRejections += 1;
      else break;
    }

    return { approved, rejected, consecutiveRejections };
  } catch {
    return undefined;
  }
}
