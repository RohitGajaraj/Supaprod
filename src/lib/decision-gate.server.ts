/**
 * The receipt for a decision a human never saw.
 *
 * WHY THIS EXISTS AT ALL. `decideDecisionReview` (lib/decision-gate.ts) keeps
 * mission receipts off the approvals queue, and the founder's condition for
 * that was that every auto-approval stay attributable and reversible. An
 * auto-approval nobody can audit is worse than the queue it replaced: the queue
 * was at least honest about what it was hiding from nobody. So the same
 * `because` list the gate decided on is written down, and it is written down
 * BEFORE anyone asks for it, because the question "why was I not shown this"
 * always arrives after the fact.
 *
 * WHERE IT LANDS AND WHY THERE. `workspace_audit_log` (migration
 * 20260619250000) is the append-only trail this product already keeps for
 * "something happened in this workspace without you doing it": workspace
 * members can read it, and it has no insert policy at all, so only the service
 * role writes. Both mission write points already hold `supabaseAdmin`, so no
 * new privilege is introduced.
 *
 * WHAT IT IS DELIBERATELY NOT. It is NOT a `human_gate_events` row. That table
 * is the human-correction corpus the ranking learns from, and an agent
 * approving its own draft is not a human approving it. Writing one here would
 * poison the exact signal phase (b) of the gate intends to widen on later --
 * it would manufacture a clean approval record for every agent, so every agent
 * would look perfect, so the four-week review would read its own auto-approvals
 * back as evidence that auto-approval works. That circularity is the single
 * worst thing this file could do, which is why it is named here.
 *
 * FAIL-SAFE BY CONTRACT, the `recordStageEvent` convention: recording history
 * must never break the write it observes. It swallows and logs its own
 * failures. A missing audit row is a gap in the trail; a thrown audit row would
 * be a lost mission receipt.
 */
import type { DecisionReviewDecision } from "@/lib/decision-gate";

export type AutoApprovalRecord = {
  decisionId: string;
  workspaceId: string | null;
  userId: string | null;
  /** Which agent's draft this was, so the trail keys the same way the
   *  correction-rate corpus does. */
  agentSlug: string | null;
  /** The mission the receipt is about, when there is one. */
  missionId?: string | null;
  /** `decisions.source_kind` as written. */
  sourceKind: string | null;
  /** Which writer decided: the two mission write points, named so a reader can
   *  go straight to the code that made the call. */
  writtenBy: string;
  decision: DecisionReviewDecision;
};

/** The action string the trail is queried by. One constant, so a reader and a
 *  writer can never disagree about the spelling. */
export const AUTO_APPROVED_ACTION = "decision.auto_approved";

// The generated Database types are narrower than this insert needs (detail is
// jsonb), so the client is structurally typed once here -- the recordStageEvent
// precedent -- and both call sites stay clean whichever client they hold.
interface AuditLogClient {
  from(table: string): {
    insert(values: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
}

/**
 * Write the trail row for one auto-approved decision. Never throws.
 *
 * Skipped without a workspace, because `workspace_audit_log.workspace_id` is
 * NOT NULL with a foreign key: an insert without one is refused by the database
 * anyway, and pretending otherwise would turn a known gap into a mystery in the
 * logs. That case is logged loudly rather than silently, because a mission
 * receipt with no workspace is itself a bug worth seeing.
 */
export async function recordAutoApproval(client: unknown, rec: AutoApprovalRecord): Promise<void> {
  if (!rec.workspaceId) {
    console.error(
      `decision auto-approved with no workspace, audit row skipped (decision ${rec.decisionId})`,
    );
    return;
  }
  try {
    const { error } = await (client as AuditLogClient).from("workspace_audit_log").insert({
      workspace_id: rec.workspaceId,
      // No human acted, and saying so is the point. Attribution to the agent is
      // carried in `detail.agent_slug`; putting an agent slug in a column that
      // foreign-keys auth.users would either fail or, worse, name a person.
      actor_id: null,
      action: AUTO_APPROVED_ACTION,
      detail: {
        decision_id: rec.decisionId,
        mission_id: rec.missionId ?? null,
        source_kind: rec.sourceKind,
        agent_slug: rec.agentSlug,
        written_by: rec.writtenBy,
        user_id: rec.userId,
        // The gate's own words, stored verbatim. A human reading this row sees
        // exactly the sentence and exactly the facts the writer acted on, not a
        // reconstruction of them.
        reason: rec.decision.reason,
        because: rec.decision.because,
      },
    });
    if (error) {
      console.error(
        `auto-approval audit write failed (decision ${rec.decisionId}): ${error.message}`,
      );
    }
  } catch (e) {
    console.error(
      `auto-approval audit write threw (decision ${rec.decisionId}): ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
