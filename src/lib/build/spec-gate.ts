// The spec-approval gate: the pure rule, no DB, shared by both dispatch paths.
//
// WHY THIS EXISTS. Two surfaces disagreed about whether approval gates a build,
// and the disagreement sat on the handoff the lifecycle depends on most.
//
// `ReadyToBuild` filters the Build station's ready list to `status ===
// "approved"` and says why in its own words: "building an unapproved spec is
// the thing the approval gate exists to prevent". The spec page's Approve
// tooltip asserts the same contract, "approve the spec, SO BUILD CAN PICK IT
// UP". But the dispatch checked only the DESIGN gate, so a draft could be sent
// straight to Build, spend a billed builder run on work nobody had approved, and
// then be absent from the station's own ready list.
//
// The spec page has since added a client-side refusal, well argued, and that
// closed the visible half. It did not close this one: the rule lives in one
// React component's `routeBlocker`, and the two server dispatch paths still
// accept an unapproved spec from anywhere else. `/runs` dispatches. So does an
// agent through the same server function, which its own header calls "the agent
// door". A governance rule enforced in the client and not at the server is not a
// rule, it is a suggestion with good manners, and this repo's most expensive
// defects have all been that shape.
//
// So this is the design-gate module's twin, deliberately: `design-gate.ts` says
// its job is that "both dispatch paths enforce exactly the same rule", and the
// approval gate needed the same treatment rather than a second copy of a
// predicate in a component.

/**
 * The statuses a spec may be built from.
 *
 * `shipped` is here because a spec can be built again after it went out: a fix,
 * a follow-up, a reverted release. Refusing that would make the gate block the
 * ordinary second lap rather than the unapproved first one.
 *
 * `draft` and `archived` are the two that block. An archived spec is a stronger
 * no than a draft, and both mean the same thing to a builder: nobody has said
 * build this.
 */
export const BUILDABLE_SPEC_STATUSES: ReadonlySet<string> = new Set(["approved", "shipped"]);

export interface SpecGateState {
  /** `prds.status`. Null or absent means the status could not be read. */
  status?: string | null;
}

/**
 * Does the approval gate block this dispatch?
 *
 * AN UNREADABLE STATUS DOES NOT BLOCK, and that direction is deliberate. A
 * failed read must never masquerade as a governance decision: this repo has paid
 * for the opposite habit repeatedly, where a query that errored produced a
 * legitimate-looking zero and a surface then made a claim on it. The design gate
 * fails open for the same reason on its own pre-migration window.
 *
 * It is also the safe direction HERE specifically, which is worth stating
 * because the general rule is the reverse for a safety control. This gate
 * protects a spend decision a human owns, not an irreversible act: the
 * irreversible ones (opening a pull request, merging, publishing a release) have
 * their own boundaries and their own approval modes further down, and none of
 * them trusts this predicate. So the worst case of failing open is one billed
 * run on a spec whose status we could not read, against the worst case of
 * failing closed, which is every build in the product refused the moment one
 * column read fails.
 */
export function specGateBlocksDispatch(state: SpecGateState): boolean {
  const status = state.status;
  if (!status) return false;
  return !BUILDABLE_SPEC_STATUSES.has(status);
}

/**
 * What a person reads when it blocks.
 *
 * It names the act, the remedy and the cost, in that order, because the remedy
 * is one click on a page they can already reach and the cost is why the refusal
 * is worth the click. The spec page's client-side copy says the same thing; both
 * halves of one rule must not tell two stories.
 */
export const SPEC_GATE_BLOCK_MESSAGE =
  "Approve the spec first. Build only picks up an approved spec, and a run costs money.";
