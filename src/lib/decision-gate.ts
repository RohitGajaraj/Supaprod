/**
 * Must a human SEE this decision before it counts as recorded?
 *
 * THE FLOOR THIS CLOSES, measured on production 2026-08-10. 172 decisions sat
 * at status 'pending' waiting for a person. 170 of them carried
 * `source_kind: 'mission'`: one receipt per mission, written by an agent, none
 * of which a human had ever asked to be shown. A product that calls itself
 * agentic-first cannot open on 172 things to approve one at a time. The
 * founder's ruling was to auto-approve the provably-benign class NOW and
 * graduate the rest later on evidence, which is what this module is.
 *
 * WHAT MAKES THE MISSION RECEIPT BENIGN, and it is a fact about the code rather
 * than an opinion about risk. A `decisions` row is a RECEIPT, not a LEVER.
 * `updateDecision` (decisions.functions.ts) and `routeDecision`
 * (approvals-queue.functions.ts) both do exactly one thing when a human
 * approves one: flip `status` and write a stage event. Nothing launches,
 * nothing spends, nothing ships. The mission the receipt is about is held by
 * its OWN gate somewhere else -- a proposed mission carries Studio's "Review &
 * launch" (studio.functions.ts), and a completed one already ran under its
 * per-tool approvals. So the queue was asking a person to press a button that
 * moves nothing, 170 times, while the gate that actually decides anything sat
 * on a different screen.
 *
 * WHAT THIS IS MODELLED ON, deliberately. `decideSettlement`
 * (lib/autonomy-policy.ts) over `classifyOutcomeSettlement`
 * (lib/ai/outcome-review.ts): hard gates first, each of which a confident model
 * cannot talk its way past, and a decision object that carries the plain
 * sentence AND `because`, every input that counted, named as facts. That
 * pattern is proven here -- it already settles 38 of 119 outcomes without a
 * person. An auto-approval nobody can audit is worse than a queue, so the
 * `because` list is not decoration: `recordAutoApproval`
 * (lib/decision-gate.server.ts) persists it, and that row is what a human reads
 * before overturning.
 *
 * NO NEW SCORING MODEL. confidence.ts's own header rules it: "each writer maps
 * a signal it already has onto this one vocabulary". Every input below is a
 * signal that already exists -- `decisions.source_kind`,
 * `decisions.decided_by_agent_slug`, the PC-11 `ConfidenceTier`, and
 * `assessTool`'s six catalogued dimensions. This file invents no number.
 *
 * THE FAILURE MODE THIS FILE IS BUILT AGAINST. Every refusal below is written
 * so an ABSENT signal refuses. A null source_kind, an unnamed agent, a tool
 * nobody catalogued, a writer that cannot tell whether anything moved: each of
 * those is UNKNOWN, and unknown must never read as benign. The whole point of
 * a conservative first phase is that the thing we did not check is the thing
 * that hurts, so "we had no signal" and "the signal was good" must never
 * produce the same answer. If you add an input here, give it a null and make
 * the null ask.
 *
 * Pure and IO-free on purpose: both mission write points decide with it, the
 * tests decide with it, and any surface that wants to explain a silent
 * approval reads the same sentence the writer acted on.
 */
import { shouldGateForReview, type ConfidenceTier } from "@/lib/confidence";
import { assessTool } from "@/lib/tool-consequences";

/** Auto-approve it on the record, or put it in front of a person. */
export type DecisionReviewAction = "auto_approve" | "ask";

/**
 * The one catalogued tool whose effect a `decisions` row's landing actually
 * has: "Records a decision, with the alternatives that were rejected",
 * reversible, undone by deleting or superseding it (tool-consequences.ts).
 *
 * Named here rather than typed as a literal at each write point so the two
 * mission writers can never drift onto different claims about the same write.
 */
export const DECISION_RECORD_EFFECT = "decision.record";

export type DecisionReviewInputs = {
  /**
   * `decisions.source_kind`, exactly as it will be written. 'manual' is the
   * human-authored form; the convention is `isAgentDrafted` in
   * approvals-queue.functions.ts, which reads this same column for this same
   * question. Null is not 'agent', it is UNKNOWN.
   */
  sourceKind: string | null;
  /**
   * `decisions.decided_by_agent_slug`. The founder's rule is that every
   * auto-approval must be attributable, and an approval we cannot pin on a
   * named drafter is not attributable, whatever else is true about it.
   */
  agentSlug: string | null;
  /**
   * The PC-11 tier for ONE question: is the row I am about to write TRUE?
   *
   * NOT "is the underlying work a good idea". Those come apart and conflating
   * them is how this gate would have shipped deciding nothing: the merit of a
   * mission nobody has agreed to run yet is held by that mission's own launch
   * gate, and gating the receipt on it would leave the queue exactly where it
   * was. Required rather than defaulted, so a new write point has to state one
   * instead of inheriting a silent "medium" it never thought about.
   */
  confidence: ConfidenceTier;
  /**
   * The catalogued tool (tool-consequences.ts) whose consequence LANDING THIS
   * ROW has. `assessTool` scores it across all six dimensions and fails closed
   * on anything it has never heard of, which is exactly the treatment an
   * uncatalogued effect should get here.
   */
  effect: string | null;
  /**
   * Does anything OUTSIDE this row move because it lands -- spend starting, a
   * ship, a write that leaves the workspace -- that no other gate is holding?
   *
   * `null` when the writer cannot tell, and that is NOT the same as `false`.
   * The brief this was built to is explicit: irreversible, external or
   * spend-touching always asks, whatever else is true.
   */
  commitsBeyondTheRecord: boolean | null;
};

export type DecisionReviewDecision = {
  action: DecisionReviewAction;
  /** What to write to `decisions.status`. Returned rather than derived at each
   *  call site so the two writers cannot map the same action differently. */
  status: "approved" | "pending";
  /** One plain sentence: why it landed on the record, or why it is on your desk. */
  reason: string;
  /** Every input that counted, as facts. This is what the audit row stores and
   *  what a human reads before overturning a silent approval. */
  because: string[];
};

/* ==========================================================================
 * PHASE (B): THE SEAM, BUILT AND DELIBERATELY NOT SWITCHED ON.
 *
 * `summarizeGateSignals` (lib/gate-signals.ts) already rolls `human_gate_events`
 * into a per-agent correction rate -- how often a human had to reject, edit or
 * override that agent's draft. That is the evidence the bar below should
 * eventually widen on, and the seam for it is the optional second argument.
 *
 * IT CANNOT PROMOTE TODAY, AND THAT IS THE POINT. The correction-rate corpus
 * started filling on 2026-08-10. An agent with no history has a correction rate
 * of exactly 0 (`summarizeGateSignals` returns 0 for total 0, honestly, because
 * a rate over nothing has no other value), and 0 is also what a perfect record
 * looks like. Letting that number widen anything would read "we have never
 * checked this agent" as "this agent has never been wrong", which is the exact
 * defect this codebase spent the day removing. So the parameter runs in ONE
 * direction, the same carve-out discipline `decideSettlement` uses: it can take
 * a decision away from the agent and give it to a person, and it can never hand
 * the agent one the bar refused.
 *
 * WHAT HAPPENS AT THE FOUR-WEEK REVIEW (2026-09-07), precisely, so the next
 * person does not have to re-derive it:
 *
 *   1. Check the corpus is real: `human_gate_events` holds at least
 *      TRACK_RECORD_MIN_EVENTS decided gates for the agent in question. Below
 *      that the rate is noise and this function already ignores it.
 *   2. Read the rate the humans produced. It is the ONLY number in the loop
 *      that a person paid attention to produce, which is why it and not model
 *      confidence is the thing allowed to widen a gate.
 *   3. Raise the ceiling by relaxing gates in this order, one per review, never
 *      more, each with its own before/after count of overturned auto-approvals:
 *        (a) `confidence: "low"` stops being an automatic refusal for an agent
 *            under TRACK_RECORD_MAX_CORRECTION_RATE -- a drafter humans almost
 *            never correct has earned its own thin-evidence drafts.
 *        (b) `assessTool(...).score === 1` (reversible, one non-benign
 *            dimension) becomes auto-approvable for such an agent, `drivenBy`
 *            named in `because` so the widening is legible in the audit row.
 *      Gate 6 (`commitsBeyondTheRecord`) is NOT on that list and should not be
 *      added to it. No track record makes spend, a ship or an external write
 *      into something a person should learn about afterwards.
 *   4. The measurement that says whether step 3 was right is already collected:
 *      an auto-approval a human later flips to 'rejected' is a stage_events
 *      transition approved -> rejected on a decision the audit log names. If
 *      that count is not ~zero, roll the last relaxation back.
 * ========================================================================== */

/**
 * How many DECIDED human gates an agent needs before its correction rate is a
 * track record rather than an anecdote. A corpus that started today is not a
 * track record; below this the rate is ignored in both directions.
 */
export const TRACK_RECORD_MIN_EVENTS = 20;

/**
 * The correction rate above which an agent's drafts go back in front of a
 * person even when everything else clears. A human having to fix better than
 * one draft in four is the agent telling us it is not ready, and that is worth
 * acting on TODAY -- unlike a good rate, a bad one cannot be faked by absence,
 * because it takes real corrections to produce.
 */
export const TRACK_RECORD_MAX_CORRECTION_RATE = 0.25;

/** The phase (b) input. Both fields come straight off
 *  `summarizeGateSignals(rows).perAgent[slug]`; nothing new is computed. */
export type AgentTrackRecordSignal = {
  /** `correctionRate`, 0..1. Lower is a more trustworthy agent. */
  correctionRate: number;
  /** `total`. How many decided gates that rate is computed from. */
  events: number;
};

function clean(v: string | null | undefined): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

/** The facts that counted, in the order a person would want to read them. */
function factsFor(i: DecisionReviewInputs, track?: AgentTrackRecordSignal | null): string[] {
  const facts: string[] = [];
  const kind = clean(i.sourceKind);
  const slug = clean(i.agentSlug);

  facts.push(
    kind === null
      ? "Nothing on this row says where it came from."
      : kind === "manual"
        ? "A person wrote this one."
        : `An agent drafted it, off the ${kind} path.`,
  );
  facts.push(slug === null ? "No agent is named on it." : `${slug} drafted it.`);
  facts.push(
    i.confidence === "low"
      ? "The writer is not confident the record is right."
      : `The writer's confidence in the record is ${i.confidence}.`,
  );

  const effect = clean(i.effect);
  if (effect === null) {
    facts.push("What landing this row does is not catalogued.");
  } else {
    const a = assessTool(effect);
    facts.push(
      a.autoApprovable
        ? `Landing it runs ${effect}, which is reversible and touches nothing of consequence.`
        : `Landing it runs ${effect}, and ${a.drivenBy}.`,
    );
  }

  facts.push(
    i.commitsBeyondTheRecord === null
      ? "Whether anything moves outside this row is unknown."
      : i.commitsBeyondTheRecord
        ? "Something outside this row moves the moment it lands."
        : "Nothing outside this row moves when it lands.",
  );

  if (track) {
    facts.push(
      track.events < TRACK_RECORD_MIN_EVENTS
        ? `${track.events} decided gates for this agent so far, too few to be a record.`
        : `Humans corrected this agent on ${Math.round(track.correctionRate * 100)}% of ${track.events} decided gates.`,
    );
  }
  return facts;
}

/**
 * Auto-approve it, or ask. Six hard gates, then the phase (b) seam.
 *
 * They are gates rather than a score for the reason `classifyOutcomeSettlement`
 * gives: a score can always be talked up, and every one of these six is a fact
 * that cannot. Each one also refuses on ABSENCE, so the honest answer to "we
 * did not check" is the same as the answer to "we checked and it was bad".
 */
export function decideDecisionReview(
  i: DecisionReviewInputs,
  track?: AgentTrackRecordSignal | null,
): DecisionReviewDecision {
  const because = factsFor(i, track);
  const ask = (reason: string): DecisionReviewDecision => ({
    action: "ask",
    status: "pending",
    reason,
    because,
  });

  // Gate 1. Unknown provenance. A row that does not say where it came from
  // cannot be shown to be agent-drafted, and the founder's bar starts there.
  const kind = clean(i.sourceKind);
  if (kind === null) {
    return ask("Nothing on this decision says where it came from, so it stays yours to confirm.");
  }

  // Gate 2. A person wrote it. Their own call is not ours to approve on their
  // behalf. Same test `isAgentDrafted` already applies to this column.
  if (kind === "manual") {
    return ask("You wrote this one, so it is not ours to approve for you.");
  }

  // Gate 3. Unattributable. An auto-approval that cannot name its drafter can
  // be neither audited nor learned from: the correction-rate corpus that phase
  // (b) will one day widen this gate on is keyed by agent slug, so an
  // unattributed approval is also a row that can never earn anything.
  const slug = clean(i.agentSlug);
  if (slug === null) {
    return ask(
      "No agent is named on this decision, so an approval could not be attributed to anyone. It stays yours.",
    );
  }

  /**
   * Gate 4. The PC-11 convention, wired for the first time. Built and left with
   * zero callers, which is how a convention quietly becomes decoration.
   *
   * IT WAS THE ONE GATE HERE THAT FAILED OPEN, and the asymmetry is the whole
   * point of this module. `shouldGateForReview` is `tier === "low"`, so it
   * answers false for "low" only — and equally false for undefined, null, an
   * empty string, or any tier word nobody has taught it. Every other gate in
   * this function refuses on ABSENCE: a missing agent, an uncatalogued effect
   * and a blank rationale all stop the auto-approval. Gate 4 waved them through.
   *
   * `i.confidence` is typed `ConfidenceTier`, which is exactly why this was
   * invisible. The type says the field is always one of three words; the callers
   * are agent-shaped writers assembling this input from model output and row
   * reads, where a field going missing is ordinary. A compiler guarantee at the
   * boundary of something that did not go through the compiler is not a
   * guarantee, and this repo has now been bitten by that shape more than once.
   *
   * So the test is INVERTED: proceed only on a tier explicitly known to be
   * confident. Anything else — low, absent, malformed, or a fourth tier added
   * later by someone who does not read this file — asks the human. Adding a new
   * confident tier is then a deliberate edit here rather than a silent widening
   * of what auto-approves, which is the correct direction for a gate to fail
   * when it is surprised.
   *
   * `shouldGateForReview` itself is deliberately NOT changed. It has other
   * callers that use it to decide what to SHOW, where "unknown" reasonably means
   * "do not nag"; only the gate needs unknown to mean "stop".
   */
  const CONFIDENT_TIERS: readonly string[] = ["medium", "high"];
  if (shouldGateForReview(i.confidence) || !CONFIDENT_TIERS.includes(clean(i.confidence) ?? "")) {
    return ask(
      "The agent is not confident this record is right, and a record we are unsure of is exactly the one you should read.",
    );
  }

  // Gate 5. What landing this row actually does, scored on the six catalogued
  // dimensions rather than on anybody's intuition. `assessTool` fails closed on
  // a tool it has never heard of, and `autoApprovable` is already stricter than
  // "harmless": it additionally demands the action be reversible.
  const effect = clean(i.effect);
  if (effect === null) {
    return ask(
      "What landing this decision does is not catalogued, and an uncatalogued effect is an unknown one.",
    );
  }
  const assessment = assessTool(effect);
  if (!assessment.autoApprovable) {
    return ask(
      `Landing this decision runs ${effect}, and ${assessment.drivenBy}. That is your call, not ours.`,
    );
  }

  // Gate 6. Anything moving outside the row. Spend, a ship, a write that leaves
  // the workspace: none of those is made safe by the row being a receipt, and
  // `null` lands here too, because a writer that cannot tell has not told us no.
  if (i.commitsBeyondTheRecord !== false) {
    return ask(
      i.commitsBeyondTheRecord === null
        ? "We cannot tell whether anything moves outside this record, and an unknown is not a no."
        : "Something outside this record moves the moment it lands, so you should see it.",
    );
  }

  // The phase (b) seam, running in its safe direction only. A rate computed
  // from too few gates is ignored: it is noise, and treating noise as evidence
  // in EITHER direction is the same mistake.
  if (
    track &&
    track.events >= TRACK_RECORD_MIN_EVENTS &&
    track.correctionRate > TRACK_RECORD_MAX_CORRECTION_RATE
  ) {
    return ask(
      `You have had to correct ${slug} on ${Math.round(track.correctionRate * 100)}% of its drafts, so its drafts come back to you until that improves.`,
    );
  }

  return {
    action: "auto_approve",
    status: "approved",
    reason: `${slug} recorded this, nothing outside the record moves, and undoing it is one click. Kept off your queue rather than kept from you.`,
    because,
  };
}
