// The declined ledger — what the agents did NOT do, and why.
//
// WHY THIS EXISTS (founder ruling 2026-08-01, and the market gap behind it).
// Every product in this category shows agent suggestions or agent output. The
// research sweep in docs/design/REFERENCE-PATTERNS.md found that NONE of them
// shows the boundary being respected: the moment an agent wanted to act, hit a
// policy, and stopped. Cursor, Copilot, Devin, Codex and Claude Code all keep
// permissions in a config file and then never mention that file again at
// runtime. The near-miss is invisible everywhere.
//
// That absence is the whole opening. In a product whose claim is "agents run
// the loop without asking permission, because you set the boundary once and
// every crossing is on the record", the crossings ARE the proof. A boundary
// nobody can watch being respected is indistinguishable from no boundary, and
// an autonomy story without that evidence is the version a risk officer
// refuses. The ledger is what makes the autonomy argument sayable.
//
// TWO KINDS OF EVENT, and the distinction is load-bearing:
//   - ASKED    an agent reached a tool its boundary does not let it use alone,
//              so it stopped and put the call in front of a person. The
//              boundary worked BY DELEGATING. Costs one interruption.
//   - REFUSED  a guardrail rule matched and the content never travelled. The
//              boundary worked BY BLOCKING. Costs nothing, and the person may
//              never have known it happened.
// Collapsing them into one "blocked" count would hide the only number that
// matters for tuning: how many interruptions the current boundary buys.
//
// Pure and dependency-free, over plain rows, so the classification rules are
// unit-tested without a database. Same shape as rejection-learning.ts.

/** A row from `agent_approvals`: an agent stopped and asked. */
export type LedgerApprovalRow = {
  id: string;
  agent_slug: string | null;
  tool_name: string;
  /** The agent's own stated reason for wanting the call. */
  rationale: string | null;
  status: string;
  created_at: string;
  decided_at?: string | null;
  decision_reason?: string | null;
  /** Optional because it is NULL on 18 of 176 answered rows; see `decidedBy`. */
  decided_by?: string | null;
};

/** A row from `guardrail_hits`: a rule matched and stopped content. */
export type LedgerGuardrailRow = {
  id: string;
  rule_name: string;
  kind: string;
  /** block | redact | warn */
  action: string;
  /** input | output */
  side: string;
  created_at: string;
};

export type LedgerOutcome =
  /** in front of a person right now, costing an interruption */
  | "waiting"
  /** a person said yes; the call ran with the args the agent proposed */
  | "allowed"
  /** a person said no */
  | "declined"
  /** nobody answered in time, so it never ran */
  | "expired"
  /** a rule stopped it; it never reached a person at all */
  | "blocked";

export type BoundaryEvent = {
  id: string;
  kind: "asked" | "refused";
  at: string;
  /** Who wanted to act. Null for rule hits, which are not attributed to an agent. */
  agent: string | null;
  /** The tool it wanted, or the rule that stopped it. */
  subject: string;
  /** The agent's own words, when it gave them. */
  wanted: string | null;
  outcome: LedgerOutcome;
  /** The person's note on the decision, when they left one. */
  outcomeReason: string | null;
  outcomeAt: string | null;
  /*
   * WHO ANSWERED, OR NULL WHEN THE ROW CANNOT SAY (gap #19, 2026-08-31).
   *
   * This surface is an audit trail, and it labels every settled crossing "You
   * allowed it" / "You said no". `agent_approvals.decided_by` is NULL on 18 of
   * 176 answered approvals, so on 10% of rows that "You" is an attribution the
   * data does not support. S3 measured the important half before claiming it:
   * `decided_by <> user_id` returns 0, so this is NOT a live misattribution of
   * one person's decision to another -- it is an UNSUPPORTED attribution, which
   * is a smaller wrong and still the wrong kind for an audit trail.
   *
   * Carried here rather than rendered here: null means "this row cannot name
   * who", and the surface says something honestly weaker for those rows instead
   * of asserting "you".
   */
  decidedBy: string | null;
};

/**
 * Map an approval row's status onto what actually happened at the boundary.
 *
 * `executed` and `failed` are both post-approval states: a person said yes and
 * the call ran, well or badly. Whether the tool then succeeded is the run's
 * story, not the boundary's, so both read as `allowed` here. Conflating a
 * failed tool with a declined one would overstate how often the boundary bites.
 */
export function outcomeOfApproval(status: string | null | undefined): LedgerOutcome {
  switch ((status ?? "").trim().toLowerCase()) {
    case "approved":
    case "executed":
    case "failed":
      return "allowed";
    case "rejected":
      return "declined";
    case "expired":
      return "expired";
    default:
      return "waiting";
  }
}

/** `warn` rules annotate and let the content through, so they are not declines. */
export function isRefusal(action: string | null | undefined): boolean {
  const a = (action ?? "").trim().toLowerCase();
  return a === "block" || a === "redact";
}

/**
 * Fold both sources into one time-ordered record of every moment the boundary
 * held. Newest first, because the question a person arrives with is "what just
 * happened", not "what happened first".
 */
export function buildLedger(
  approvals: LedgerApprovalRow[],
  guardrails: LedgerGuardrailRow[],
): BoundaryEvent[] {
  const events: BoundaryEvent[] = [];

  for (const r of Array.isArray(approvals) ? approvals : []) {
    if (!r?.id) continue;
    events.push({
      id: r.id,
      kind: "asked",
      at: r.created_at,
      agent: r.agent_slug ?? null,
      subject: r.tool_name,
      wanted: (r.rationale ?? "").trim() || null,
      outcome: outcomeOfApproval(r.status),
      outcomeReason: (r.decision_reason ?? "").trim() || null,
      outcomeAt: r.decided_at ?? null,
      decidedBy: r.decided_by ?? null,
    });
  }

  for (const g of Array.isArray(guardrails) ? guardrails : []) {
    if (!g?.id || !isRefusal(g.action)) continue;
    events.push({
      id: g.id,
      kind: "refused",
      at: g.created_at,
      agent: null,
      subject: g.rule_name,
      // A rule hit has no rationale: nothing chose to do this, a match happened.
      // What IS worth saying is which direction it was travelling, because an
      // input block and an output block mean different things to a reader.
      wanted: g.side === "output" ? "on the way out" : "on the way in",
      outcome: "blocked",
      outcomeReason: null,
      outcomeAt: null,
      // A rule hit was not answered by anybody, so there is nobody to name.
      decidedBy: null,
    });
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

// THERE IS DELIBERATELY NO RECOMMENDER HERE, and the omission is the decision.
//
// A first draft of this module also proposed handing over any pair a person had
// always approved. That duplicated a system this repo already ships and does
// better: `maybeProposeTrustGraduations` (src/lib/ai/reflection.server.ts)
// writes a per-(agent, tool) `trust_graduation_proposals` row off a clean
// approval streak, and unlike a naive tally it honors the high-risk ceilings,
// refuses to propose anything for an agent with a recent `missed` outcome, and
// is protected against duplicates by a partial unique index.
//
// Two recommenders that can disagree about the same question is the "two
// vocabularies, neither authoritative" defect, and the weaker one does not get
// to ship beside the stronger one merely because it was written second.
//
// So the division of labour is: THE ENGINE PROPOSES, THIS MODULE REMEMBERS.
//
// The per-pair tally that draft carried went with it, rather than staying on as
// an unrendered helper. A grouped view of the record may well be worth building
// later, but it is not built now, and a function nobody calls is how this repo
// accumulates capability with no door.
