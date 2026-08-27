/**
 * THE WRITE POINT FOR `spec-gate.ts`, AND ITS ONLY CALLER IS THE CRITIC.
 *
 * ── WHY IT RUNS HERE AND NOWHERE ELSE ──────────────────────────────────────
 * `critic.evaluate` is the moment the last missing input arrives. Everything
 * else the gate reads — the contract, the bet, the status — is already on the
 * row and unchanged for hours; the Critic's verdict and the design lens are
 * written by this call and by nothing else. Running the gate anywhere earlier
 * would be running it on facts that cannot have changed.
 *
 * It also decides WHO can trigger a clearance, which matters more than where.
 * The Critic is a different seat from the one that wrote the spec, and no seat
 * calls this module: an agent cannot ask for its own spec to be cleared, it can
 * only ask for its spec to be argued against, and a clearance is a consequence
 * of surviving that. `decision-gate.ts` deciding at the decision write point is
 * the precedent this copies.
 *
 * ── EVERY FAILURE IS REPORTED, NONE IS SWALLOWED ───────────────────────────
 * A clearance that silently did not happen looks exactly like a spec that did
 * not deserve one, which is the F-76 shape this whole line of work exists to
 * close. So a read error, a write error and a refused audit row each return a
 * decision that SAYS SO, rather than a null the caller reads as "no".
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTO_CLEARED_ACTION } from "@/lib/spec-gate.constants";
import {
  decideSpecReview,
  type CriticVerdict,
  type SpecReviewDecision,
  type SpecReviewInputs,
} from "@/lib/spec-gate";

/** Shapes the generated Database types are narrower than; the recordStageEvent precedent. */
type Bag = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

const verdictOf = (v: unknown): CriticVerdict | null =>
  v === "ship" || v === "revise" || v === "kill" ? v : null;

/**
 * The STANDING success metrics, reduced to text and oracle.
 *
 * Superseded clauses are dropped deliberately: a metric somebody replaced is
 * not one the spec still promises, and counting it would let an old
 * unverifiable clause block a spec that has since been made checkable.
 */
function metricsOf(contract: unknown): { text: string; oracleKind: string | null }[] {
  const raw = (contract as Bag | null)?.success_metrics;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => (c as Bag)?.status === "standing")
    .map((c) => ({
      text: str((c as Bag).text) ?? "",
      oracleKind: str((c as Bag).oracle_kind),
    }));
}

export type SpecClearance = SpecReviewDecision & {
  /** True only when this call actually moved `prds.status`. */
  cleared: boolean;
};

/**
 * Decide whether this spec still needs a person, and clear it if it does not.
 *
 * Returns the decision either way, so the tool result can say what happened and
 * a surface can show the same sentence the writer acted on.
 */
/**
 * Who caused this clearance to be considered.
 *
 * ── WHY THIS IS NOT OPTIONAL DECORATION (S4 -> S0, 2026-08-27) ─────────────
 * S4 measured the two places this product already lost the answer to "who did
 * it", and both are the same mistake: `agent_approvals.decided_by` is NULL, so
 * F-79's disqualifying human act could not be attributed and had to be found by
 * reading a log; and `forecast_resolved_by_agent_slug` is NULL on **all 91**
 * resolved forecasts, so not one of the verdicts this product exists to produce
 * can name its author.
 *
 * Their words, and they decided this parameter: *"whatever writes the loop's
 * verdict should populate its own author column, or you inherit this exact
 * ambiguity on the new path."*
 *
 * A clearance nobody can attribute is also a clearance nobody can learn from.
 * The correction-rate corpus that `decision-gate.ts` phase (b) will one day
 * widen its bar on is keyed by agent slug, so an unattributed clearance is a row
 * that can never earn anything either.
 */
export type ClearedBy = {
  /** The seat whose `critic.evaluate` call produced the verdict being read. */
  agentSlug?: string | null;
  agentId?: string | null;
  /** The run it happened in, so the decision can be traced to its transcript. */
  runId?: string | null;
};

export async function clearSpecIfProven(
  client: SupabaseClient,
  prdId: string,
  by: ClearedBy = {},
): Promise<SpecClearance> {
  /*
   * ── IT NEVER THROWS, AND THAT IS A CORRECTNESS RULE, NOT A COURTESY ──────
   *
   * This runs AFTER `runCritic` has already persisted a verdict. If a failure
   * here escaped, `critic.evaluate` would report a tool failure over a write
   * that succeeded — the seat would be told its red-team did not happen when
   * the row on the spec says it did. That is F-68 arriving from the other side:
   * a step described as refused while its own evidence shows it landed.
   *
   * `runCritic` itself carries the same rule for the same reason. A clearance
   * is best-effort work layered on a completed one; it may decline, it may
   * report that it could not run, and it may never erase what already happened.
   */
  const unavailable = (reason: string): SpecClearance => ({
    action: "ask",
    status: "review",
    reason,
    because: [],
    cleared: false,
  });

  try {
    return await decideAndClear(client, prdId, by, unavailable);
  } catch (e) {
    return unavailable(
      `The spec review could not be run, so nothing was cleared: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

async function decideAndClear(
  client: SupabaseClient,
  prdId: string,
  by: ClearedBy,
  unavailable: (reason: string) => SpecClearance,
): Promise<SpecClearance> {
  const { data, error } = await client
    .from("prds")
    .select("id,status,design_gate_status,critic_review,contract,opportunity_id,workspace_id")
    .eq("id", prdId)
    .maybeSingle();

  // A read that FAILED and a spec that does not exist are different facts, and
  // collapsing them is exactly F-76. Say which one happened.
  if (error)
    return unavailable(`This spec could not be read, so nothing was cleared: ${error.message}`);
  if (!data) return unavailable("There is no spec with that id, so nothing was cleared.");

  const row = data as Bag;
  const review = (row.critic_review ?? null) as Bag | null;
  const design = (review?.design ?? null) as Bag | null;

  /*
   * A spec serves a bet if it came from an opportunity OR if a decision points
   * at it. Both are checked, because the two entry paths write different
   * columns: `prd.draft` from a bet sets `opportunity_id`, while a decision
   * recorded against an existing spec sets `decisions.prd_id`.
   */
  let servesABet = str(row.opportunity_id) !== null;
  if (!servesABet) {
    const { data: bet, error: betErr } = await client
      .from("decisions")
      .select("id")
      .eq("prd_id", prdId)
      .limit(1)
      .maybeSingle();
    // A failed lookup must not read as "no bet". That would refuse a spec for a
    // reason that is about our query rather than about the spec.
    if (betErr)
      return unavailable(`The bets behind this spec could not be read: ${betErr.message}`);
    servesABet = Boolean(bet);
  }

  const inputs: SpecReviewInputs = {
    status: str(row.status),
    designGateStatus: str(row.design_gate_status),
    criticVerdict: verdictOf(review?.verdict),
    criticConfidence: typeof review?.confidence === "number" ? review.confidence : null,
    criticMissingEvidence: Array.isArray(review?.missing_evidence)
      ? (review.missing_evidence as unknown[]).map(String)
      : null,
    designVerdict: verdictOf(design?.verdict),
    successMetrics: metricsOf(row.contract),
    servesABet,
    // F-132: read straight off the review the Critic persisted, so the gate can
    // tell "nobody looked" from "our own look did not come back".
    designReadUnavailable: review?.design_unavailable === true,
    consideredBy: by.agentSlug ?? null,
  };

  const decision = decideSpecReview(inputs);
  if (decision.action !== "clear") return { ...decision, cleared: false };

  const { error: writeErr } = await client
    .from("prds")
    .update({ status: decision.status, updated_at: new Date().toISOString() } as never)
    .eq("id", prdId)
    // Guard the write with the state it was decided on. Two Critic runs landing
    // together must not both clear, and a spec a person shipped or rejected in
    // between must win over a decision taken before they acted.
    .eq("status", inputs.status ?? "");

  if (writeErr) {
    return {
      ...decision,
      action: "ask",
      status: "review",
      cleared: false,
      reason: `This spec cleared its review but the status could not be written, so it is still yours: ${writeErr.message}`,
    };
  }

  /*
   * THE AUDIT ROW IS NOT OPTIONAL DECORATION. `decision-gate.server.ts` states
   * the rule this follows: "an auto-approval nobody can audit is worse than a
   * queue". This one clears a LEVER, so it matters more there than it does
   * there. It is written after the status, and a failure is logged rather than
   * thrown, because losing the audit row is bad and rolling back a correct
   * clearance because of it is worse.
   */
  const workspaceId = str(row.workspace_id);
  if (!workspaceId) {
    console.error(`spec auto-cleared with no workspace, audit row skipped (spec ${prdId})`);
    return { ...decision, cleared: true };
  }
  const { error: auditErr } = await client.from("workspace_audit_log").insert({
    workspace_id: workspaceId,
    // No human acted, and saying so is the point.
    actor_id: null,
    action: AUTO_CLEARED_ACTION,
    detail: {
      prd_id: prdId,
      /*
       * NAMED, because the two places this product already lost this answer
       * both lost it by leaving the column null. See `ClearedBy` above. A slug
       * that is genuinely unknown is written as null AND said out loud in the
       * `because` list, so "we do not know who" never reads as "nobody".
       */
      cleared_by_agent_slug: by.agentSlug ?? null,
      cleared_by_agent_id: by.agentId ?? null,
      run_id: by.runId ?? null,
      from_status: inputs.status,
      to_status: decision.status,
      critic_verdict: inputs.criticVerdict,
      critic_confidence: inputs.criticConfidence,
      design_verdict: inputs.designVerdict,
      // The gate's own words, verbatim. A person overturning this reads exactly
      // the sentence and exactly the facts the writer acted on.
      reason: decision.reason,
      because: decision.because,
    },
  } as never);
  if (auditErr) {
    console.error(`spec auto-clear audit write failed (spec ${prdId}): ${auditErr.message}`);
  }

  return { ...decision, cleared: true };
}
