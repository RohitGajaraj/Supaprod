/**
 * MAY THIS SPEC CLEAR ITS STATION WITHOUT A PERSON, OR DOES IT GO ON A DESK?
 *
 * ── THE WALL THIS CLOSES, MEASURED ON PRODUCTION 2026-08-27 ────────────────
 * R-18's acceptance is one piece of work walking seven stations with no human
 * touching it mid-run. It has never happened in three months and 73 tracks, and
 * the reason is not that the loop is bad at its job. **It is impossible by
 * construction**, and three columns say so:
 *
 *   · `prds.status` -- 61 draft, 1 review, 43 approved. The tool set an agent
 *     can call is draft/get/link_issue/revise/search. **There is no
 *     `prd.approve`.** The only review->approved write in the codebase is the
 *     human tray at `approvals-queue.functions.ts:1403`.
 *   · `prds.design_gate_status` -- **116 of 119 `pending`.** The only writer is
 *     `decideDesignGate`, a server fn behind `requireSupabaseAuth` that stamps
 *     `design_decided_by: userId`. `design_stage_enabled` is true on all 21
 *     workspaces, so `pending` really does mean nobody answered.
 *   · the spec's own success metrics -- **117 of 119 specs carry none.**
 *
 * Ship reads the first two and refuses. So every track that gets that far dies
 * one station from `learn`, having done all the work.
 *
 * ── THE PART THAT IS NOT A WALL ────────────────────────────────────────────
 * Design's crew already contains `design-critic`, whose job is exactly this
 * judgement. Its filing line said *"Say plainly if it is sound as it stands."*
 * **So a pass left no trace.** Only a CHANGE (`design.draft`) wrote anything,
 * which means `pending` meant both "nobody looked" and "the critic looked and
 * it was fine", and nothing downstream could tell those apart.
 *
 * That is F-76 wearing a third costume, and it is the whole finding: the loop
 * was doing the judgement and had nowhere to put it. This module is the
 * somewhere, and `critic.evaluate` -- which already persists a ship/revise/kill
 * verdict on the row -- is the pen.
 *
 * ── WHY THIS IS STRICTER THAN `decision-gate.ts`, WHICH IT COPIES ──────────
 * That module's argument for auto-approving is that a `decisions` row is a
 * RECEIPT: "nothing launches, nothing spends, nothing ships". **That argument
 * does not transfer, and pretending it did would be the whole mistake here.** A
 * spec is a LEVER. Clearing one is precisely what unblocks Ship. So every gate
 * below fails on ABSENCE, an unclassified signal is never read as a good one,
 * and a human's `rejected` can never be overturned by anything in this file.
 *
 * ── WHAT THIS IS NOT ───────────────────────────────────────────────────────
 * Not a way for an agent to approve its own work. Nothing here is a tool and no
 * seat can call it. It reads facts that were filed by a DIFFERENT seat than the
 * one that wrote the spec, and it has no opinion of its own: every input is a
 * column that already exists, and the answer is arithmetic over them.
 *
 * Pure and IO-free on purpose, like the two gates it is modelled on: the write
 * point decides with it, the tests decide with it, and any surface that wants
 * to explain a silent clearance reads the same sentence the writer acted on.
 */

/** Clear it on the record, or put it in front of a person. */
export type SpecReviewAction = "clear" | "ask";

/**
 * The Critic's three verdicts, as `critic.evaluate` persists them.
 *
 * `revise` and `kill` both mean no. They are kept apart because the sentence a
 * person reads should not call a fixable spec dead.
 */
export type CriticVerdict = "ship" | "revise" | "kill";

/**
 * How sure the Critic has to be before its `ship` clears a lever.
 *
 * ABOVE the settle floor on purpose. `SETTLE_FLOOR` is 0.45 and governs writing
 * a verdict onto the record, which is a claim. This governs UNBLOCKING A SHIP,
 * which is an action, and the asymmetry between "we said something wrong" and
 * "we released something wrong" is the reason the numbers differ. 0.75 is the
 * same bar `DEFAULT_PROMOTION_BAR` already uses for the other place the
 * platform acts without a click.
 */
export const SPEC_CLEAR_MIN_CONFIDENCE = 0.75;

export type SpecReviewInputs = {
  /** `prds.status`, exactly as it is on the row. Null is UNKNOWN, never draft. */
  status: string | null;
  /**
   * `prds.design_gate_status`. A human's `rejected` here is absolute: gate 1
   * returns on it before anything else is read.
   */
  designGateStatus: string | null;
  /** `critic_review.verdict`. Null means nobody has red-teamed this spec. */
  criticVerdict: CriticVerdict | null;
  /** `critic_review.confidence`, 0..1. Null is UNKNOWN and asks. */
  criticConfidence: number | null;
  /**
   * `critic_review.missing_evidence`. The Critic's own prompt calls this
   * "untestable/unmeasurable acceptance criteria, unstated assumptions, and
   * open questions to resolve before build". A non-empty list is the Critic
   * saying not yet, even beside a `ship` verdict.
   */
  criticMissingEvidence: readonly string[] | null;
  /**
   * `critic_review.design.verdict`, the design lens, present only for prd
   * targets. This is the judgement the human `design_gate_status` column has
   * been waiting for, filed by the seat whose job it is.
   */
  designVerdict: CriticVerdict | null;
  /**
   * Every STANDING clause of `contract.success_metrics`, reduced to the one
   * question that matters: can it be checked?
   *
   * `oracleKind` is the clause's own `oracle_kind` column -- eval | ci | uat |
   * unverifiable | null. This is F-115's measurability rule as a predicate on
   * a column that already exists rather than as a sentence in a prompt.
   */
  successMetrics: readonly { text: string; oracleKind: string | null }[];
  /** Whether the spec serves a recorded bet: an opportunity or a decision. */
  servesABet: boolean;
  /**
   * True when a design read was wanted and did not come back.
   *
   * Never a gate of its own: it changes only WHICH sentence gate 8 says, so a
   * person is told whether the next move is theirs or ours. `false` and
   * `undefined` both mean "no evidence our own pass failed", which is the
   * honest default for every row written before this existed.
   */
  designReadUnavailable?: boolean;
  /**
   * The seat whose filed review is being read here, for the record.
   *
   * Never a gate. It changes no outcome and must not: a clearance that depended
   * on WHICH seat asked would be a clearance an agent could shop for. It exists
   * only so the audit row and the sentence a person reads can name the actor,
   * which is the thing `agent_approvals.decided_by` and
   * `forecast_resolved_by_agent_slug` both failed to do on every row they have.
   */
  consideredBy?: string | null;
};

export type SpecReviewDecision = {
  action: SpecReviewAction;
  /** What to write to `prds.status`. Returned rather than derived at each call
   *  site so two writers cannot map the same action differently. */
  status: "approved" | "review";
  /** One plain sentence: why it cleared, or why it is on your desk. */
  reason: string;
  /** Every input that counted, as facts. This is what the audit row stores and
   *  what a person reads before overturning a silent clearance. */
  because: string[];
};

const clean = (v: string | null | undefined): string | null => {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
};

/** A clause nothing can check. `null` is unclassified, which is not "fine". */
const unmeasurable = (m: { oracleKind: string | null }): boolean =>
  clean(m.oracleKind) === null || m.oracleKind === "unverifiable";

/**
 * The facts, in the order a person would want them, whichever way it went.
 *
 * Built for BOTH outcomes rather than only for a clearance, because the sentence
 * on a person's desk is worth as much as the one on the record, and a queue item
 * that cannot say what it already has is how a tray becomes 172 items long.
 */
function factsFor(i: SpecReviewInputs): string[] {
  const facts: string[] = [];
  facts.push(`Spec status: ${clean(i.status) ?? "unknown"}.`);
  facts.push(`Design gate: ${clean(i.designGateStatus) ?? "never set"}.`);
  facts.push(
    i.criticVerdict === null
      ? "No Critic has red-teamed this spec."
      : `The Critic said ${i.criticVerdict}${
          i.criticConfidence === null
            ? ""
            : ` at ${Math.round(i.criticConfidence * 100)}% confidence`
        }.`,
  );
  const missing = i.criticMissingEvidence ?? [];
  facts.push(
    missing.length === 0
      ? "The Critic listed nothing still missing."
      : `The Critic listed ${missing.length} thing${missing.length === 1 ? "" : "s"} still missing.`,
  );
  facts.push(
    i.designVerdict === null
      ? "No design verdict has been filed."
      : `The design lens said ${i.designVerdict}.`,
  );
  const bad = i.successMetrics.filter(unmeasurable).length;
  facts.push(
    i.successMetrics.length === 0
      ? "The spec carries no success metric."
      : `${i.successMetrics.length} success metric${i.successMetrics.length === 1 ? "" : "s"}, ${bad} of which nothing can check.`,
  );
  facts.push(i.servesABet ? "It serves a recorded bet." : "It is attached to no recorded bet.");
  /*
   * WHO CAUSED THIS TO BE CONSIDERED, said out loud even when the answer is
   * nobody-knows. S4 measured two columns in this product that could have named
   * an actor and were left NULL on every row, and in both cases the absence
   * later read as "no agent did this" when it only ever meant "the record
   * cannot say". A fact that admits its own gap does not make that trade.
   */
  facts.push(
    clean(i.consideredBy) === null
      ? "The record cannot name which seat's review produced this."
      : `Considered after ${clean(i.consideredBy)} filed its review.`,
  );
  return facts;
}

/**
 * Decide, on filed facts alone.
 *
 * Read the gates in order: each one that fires names a DIFFERENT missing thing,
 * so the sentence a person gets is the actual next action rather than a generic
 * "needs review".
 */
export function decideSpecReview(i: SpecReviewInputs): SpecReviewDecision {
  const because = factsFor(i);
  const ask = (reason: string): SpecReviewDecision => ({
    action: "ask",
    status: "review",
    reason,
    because,
  });

  /*
   * Gate 1. A PERSON ALREADY SAID NO, and nothing in this file may overturn
   * that. First, before any other read, so no combination of good signals can
   * ever add up to reversing a human refusal. This is the one gate that exists
   * to protect the person from the gate.
   */
  if (clean(i.designGateStatus) === "rejected") {
    return ask("You turned this design down, and nothing here reopens that. It stays yours.");
  }

  // Gate 2. Already settled. Approved and shipped specs are not ours to move,
  // and a spec at an unknown status is not one we can reason about at all.
  const status = clean(i.status);
  if (status !== "draft" && status !== "review") {
    return ask(
      status === null
        ? "Nothing on this spec says what state it is in, so it stays yours to confirm."
        : `This spec is already ${status}, so there is nothing here to clear.`,
    );
  }

  // Gate 3. Serves nothing. A spec attached to no opportunity and no decision
  // cannot be graded later, because there is no bet for the verdict to be about.
  if (!i.servesABet) {
    return ask(
      "This spec is not attached to any bet anyone recorded, so nothing could grade it afterwards.",
    );
  }

  /*
   * Gate 4. NOBODY RED-TEAMED IT. The absence that started all of this: a spec
   * with no Critic verdict is not a spec that passed, it is a spec nobody read.
   */
  if (i.criticVerdict === null) {
    return ask(
      "Nothing has argued against this spec yet, so clearing it would rest on nobody having looked.",
    );
  }

  // Gate 5. The Critic said no. `kill` and `revise` are kept apart so the
  // sentence does not call a fixable spec dead.
  if (i.criticVerdict === "kill") {
    return ask("The Critic thinks this one should not be built at all. That call is yours.");
  }
  if (i.criticVerdict === "revise") {
    return ask("The Critic wants this spec changed before it goes anywhere.");
  }

  /*
   * Gate 6. Not sure enough. Written as a POSITIVE test on purpose: null,
   * NaN and a number outside 0..1 all fail it. `decision-gate.ts` gate 4 was
   * the one gate in this house that failed OPEN, because it asked whether a
   * value was bad instead of whether it was good, and a field assembled from
   * model output goes missing as a matter of routine.
   */
  const conf = i.criticConfidence;
  if (!(typeof conf === "number" && conf >= SPEC_CLEAR_MIN_CONFIDENCE && conf <= 1)) {
    return ask(
      "The Critic is not confident enough in its own verdict for that verdict to unblock a release.",
    );
  }

  // Gate 7. The Critic itself listed what is still missing. A `ship` verdict
  // beside a list of open questions is not a clearance, and the Critic is the
  // one saying so.
  const missing = i.criticMissingEvidence ?? [];
  if (missing.length > 0) {
    return ask(
      `The Critic still wants ${missing.length === 1 ? "one thing" : "things"} resolved: ${missing[0]}`,
    );
  }

  /*
   * Gate 8. NO DESIGN VERDICT, or a design verdict that says no.
   *
   * This is the gate the whole module exists for. `design_gate_status` is
   * human-only and 116 of 119 rows sit on `pending` forever; this reads the
   * verdict the `design-critic` seat filed instead, which is the same judgement
   * by the seat whose job it is. Absent still asks: the point was never to skip
   * the design review, it was to stop a completed one from being invisible.
   */
  if (i.designVerdict === null) {
    /*
     * TWO SENTENCES, BECAUSE THE ABSENCE HAS TWO CAUSES (F-132).
     *
     * The design lens is a best-effort second pass in `critic.server.ts`, and a
     * failed one used to leave no trace at all. So "nobody read the design" and
     * "our own design read did not come back" arrived here identically, and this
     * gate would have said the first while the second was true — blaming the
     * spec for our plumbing, which is precisely what makes a refusal read as a
     * judgement on the work.
     */
    return ask(
      i.designReadUnavailable === true
        ? "The design read did not come back, so this is waiting on us rather than on you. It will be tried again."
        : "Nobody has read this design back against the spec yet.",
    );
  }
  if (i.designVerdict !== "ship") {
    return ask("The design does not do what the spec asked for yet.");
  }

  /*
   * Gate 9. NOTHING TO GRADE. F-115's rule, made arithmetic.
   *
   * A spec with no measurable success metric can be shipped and can never be
   * judged, which does not merely lose a feature: it removes the one thing this
   * product sells. So an unmeasurable forecast is the ONE thing that legitimately
   * blocks a ship, in exact contrast to an UNMET one, which blocks nothing
   * because it cannot possibly have happened yet.
   */
  if (i.successMetrics.length === 0) {
    return ask(
      "This spec does not say what would count as it working, so shipping it could never be judged.",
    );
  }
  const unchecked = i.successMetrics.filter(unmeasurable);
  if (unchecked.length > 0) {
    return ask(
      `Nothing can check "${unchecked[0]!.text.slice(0, 90)}", so the verdict on this would never arrive.`,
    );
  }

  return {
    action: "clear",
    status: "approved",
    reason:
      "The Critic and the design read both cleared this, and every success metric on it can be checked, so it did not need to wait for you.",
    because,
  };
}
