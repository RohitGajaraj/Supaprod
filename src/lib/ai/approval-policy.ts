import {
  isExternalTool,
  isSideEffectingTool,
  toolConsequence,
  type Reversibility,
} from "@/lib/tool-consequences";
import { HIGH_RISK_FORCE_REVIEW } from "@/lib/ai/trust-ramp";

/**
 * WHAT ACTUALLY NEEDS A PERSON, decided in advance rather than in the moment.
 *
 * ── THE PROBLEM THIS IS ────────────────────────────────────────────────
 * The governance doctrine says it in one line: "a long approvals queue is a
 * policy failure to surface, not a workload to render." This module is that
 * sentence expressed as code.
 *
 * The measured case for it, at zero real users: 53 pending approvals, 39 of them
 * over a day old, 14 missions blocked, the oldest standing at 627 hours. Read
 * against the record, only 26% of all 313 approvals ever raised were for
 * something a human genuinely had to rule on.
 *
 * The external evidence points the same way and is stronger than ours. Anthropic
 * instrumented real sessions and found roughly 70% of a person's decisions
 * happen at PLANNING and 20% at execution, and that 93% of in-the-moment
 * permission prompts are approved. A gate that is approved 93 times in 100 is not
 * a control, it is a keystroke, and it teaches the reader to stop reading.
 *
 * ── WHAT IS NEW HERE, AND WHAT WAS ALREADY BUILT ───────────────────────
 * Two of this module's three rules already exist and are not reimplemented.
 *
 *   `trust-ramp.ts` owns the LADDER and the never-graduates set. It carries
 *   `HIGH_RISK_FORCE_REVIEW`, which is the existing name for "always-human", and
 *   its whole design is that promotion "never silently flips: the proposal is
 *   itself an approval item". So rule 1 and rule 3 have a home already, and this
 *   module reads that set rather than restating its four members. Two lists of
 *   what may never be automated is one list too many.
 *
 *   `tool-consequences.ts` owns the AXES: `reversible` at three values and
 *   `isExternalTool` for whether the effect leaves the workspace.
 *
 * What did NOT exist is the DEFAULT: a way to answer "what should this tool's
 * gate be before anyone has any track record at all", from the two facts the
 * catalogue already holds. And nothing anywhere resolved `disabled`.
 *
 * ── THE TWO AXES, AT THREE VALUES RATHER THAN TWO ──────────────────────
 * The matrix this was specified as assumed reversibility was a boolean. It is
 * not: `Reversibility` is `reversible | irreversible | partial`, and `partial` is
 * most of the catalogue. Folding it in gives:
 *
 *                  reversible      partial          irreversible
 *   internal       never-ask       earn-it          always-human
 *   external       earn-it         always-human     always-human
 *
 * That is the same shape `toolRisk` already folds the identical two axes into
 * (low / medium / high), which is the point: a tool's gate and a tool's stated
 * blast radius must not be able to disagree, and they cannot if one is derived
 * from the same table as the other.
 *
 * ── ONE CELL OF THE SPECIFIED MATRIX IS DELIBERATELY OVERRIDDEN ────────
 * As written, internal-and-not-reversible resolved to `earn-it`. It resolves to
 * `always-human` here, and the reason is a floor rather than a preference:
 * governance names four things no boundary may lower and the first is "anything
 * irreversible from inside the product". An irreversible act cannot be earned
 * away by a good record, so it may not sit on a rung that a record can move.
 * `trust-ramp.ts` had already reached the same conclusion for `release.publish`,
 * in its own words: "irreversible from inside the product, and customers see it".
 *
 * ── PURE, AND IT HAS TO STAY THAT WAY ──────────────────────────────────
 * No I/O, no Supabase, no `.server.ts`. Both modules it imports declare
 * themselves client-safe and have zero imports of their own. The track record
 * arrives as three plain numbers, because who supplies them is not this module's
 * business and a query in here would make the whole thing untestable.
 */

/** What it takes to run a tool. Ordered below by how strict each one is. */
export type ApprovalDecision = "never-ask" | "earn-it" | "always-human" | "disabled";

/**
 * Increasing strictness, and it exists so "the record may only tighten this" can
 * be asserted rather than trusted. `disabled` is the strictest: a tool that never
 * runs is more constrained than one that runs with a person watching.
 */
const STRICTNESS: Record<ApprovalDecision, number> = {
  "never-ask": 0,
  "earn-it": 1,
  "always-human": 2,
  disabled: 3,
};

export interface ApprovalTrackRecord {
  /** Times a person let this run. */
  approved: number;
  /** Times a person turned it down. */
  rejected: number;
  /** Turned down in a row, most recent first. Resets on any approval. */
  consecutiveRejections: number;
}

export interface ApprovalPolicyInput {
  /** A registry tool name. Unknown names are handled, see `axisDefault`. */
  tool: string;
  /** Omit for a tool nobody has ruled on yet, which is the common case. */
  record?: ApprovalTrackRecord;
}

export interface ApprovalPolicy {
  decision: ApprovalDecision;
  /** One sentence, written for the person the gate would have interrupted. */
  reason: string;
}

/**
 * HOW MANY REFUSALS IN A ROW COUNT AS A PATTERN.
 *
 * Three, and it is bounded on both sides rather than picked. It must be more
 * than one, because a single refusal is a person changing their mind about a
 * single case and demoting on it would make the product jumpy. It must be fewer
 * than `TRUST_RAMP_CLEAN_N`, which is 5, or a tool could be promoted faster than
 * it could ever be demoted, and the asymmetry this whole design rests on would
 * run the wrong way.
 */
export const APPROVAL_DEMOTE_N = 3;

/** One rung stricter. `always-human` is the top and does not move. */
const DEMOTED: Record<"never-ask" | "earn-it", ApprovalDecision> = {
  "never-ask": "earn-it",
  "earn-it": "always-human",
};

type AxisDefault = { decision: ApprovalDecision; reason: string };

/**
 * The gate a tool gets before anyone has ruled on anything.
 *
 * FAIL CLOSED ON AN UNCATALOGUED TOOL, and say so out loud in the reason. This
 * mirrors `toolRisk`, which treats an unknown blast radius as the maximal one, and
 * being consistent with the layer that actually enforces matters more than being
 * right about any single tool: a policy module that is more permissive than the
 * enforcement path is the dangerous direction of wrong.
 *
 * It is worth knowing that this currently over-gates. 17 registry tools have no
 * `CONSEQUENCES` entry and most are plainly read-only (`repo.read`, `web.search`,
 * `themes.list`), so they resolve `always-human` here for the same reason they
 * score `high` risk there. That is a missing table row rather than a real
 * judgment, the reason says as much rather than inventing a consequence, and
 * cataloguing them is what fixes it.
 */
function axisDefault(tool: string): AxisDefault {
  if (HIGH_RISK_FORCE_REVIEW.has(tool)) {
    return {
      decision: "always-human",
      reason:
        "This is one of the few acts the product refuses to automate at all, so somebody signs off every time however good the record gets.",
    };
  }

  if (!isSideEffectingTool(tool)) {
    return {
      decision: "always-human",
      reason:
        "Nothing is written down about what this changes or whether it can be undone, so it is treated as if it changed everything until somebody records that.",
    };
  }

  const reversible: Reversibility = toolConsequence(tool).reversible;
  const external = isExternalTool(tool);

  if (reversible === "irreversible") {
    return {
      decision: "always-human",
      reason:
        "This cannot be undone from inside the product, so a person signs off every time and no track record changes that.",
    };
  }

  if (external) {
    return reversible === "partial"
      ? {
          decision: "always-human",
          reason:
            "This reaches a system outside the workspace and undoing it only partly works, so a person signs off every time.",
        }
      : {
          decision: "earn-it",
          reason:
            "This reaches a system outside the workspace, so it stays gated until you have watched it enough times to let it run on its own.",
        };
  }

  return reversible === "partial"
    ? {
        decision: "earn-it",
        reason:
          "Undoing this only partly works, so it stays gated until you have watched it enough times to let it run on its own.",
      }
    : {
        decision: "never-ask",
        reason:
          "Nothing this does leaves the workspace and all of it can be undone, so the crew runs it without asking.",
      };
}

/**
 * What it takes to run one tool, given what the catalogue says about it and what
 * this workspace has done with it so far.
 *
 * ── THE INVARIANT, AND IT IS THE WHOLE OF RULE 3 ───────────────────────
 * The record may only make this STRICTER, never looser. That is what "demotion
 * is automatic, promotion is not" means expressed as a property rather than as a
 * procedure: nothing a record contains can return a laxer decision than the axis
 * default, so a rise always has to come from a person deciding one. It is
 * asserted in the tests over generated records rather than only on the branches
 * anybody thought to write.
 *
 * This asymmetry is not conservatism for its own sake. No shipped product raises
 * autonomy on a track record, and every one of them automates the demotion, so
 * inventing automatic promotion here would put this ahead of the entire industry
 * on the risky side of the trade.
 */
export function resolveApprovalPolicy(input: ApprovalPolicyInput): ApprovalPolicy {
  const base = axisDefault(input.tool);
  const record = input.record;

  if (!record) return base;

  /*
   * ── ALL REFUSALS: SWITCH IT OFF RATHER THAN ASK AGAIN ─────────────────
   * Checked FIRST, so it applies even to `always-human`. That looks like it
   * conflicts with "always-human never graduates" and does not: graduating means
   * getting laxer, and switching a tool off is the strictest answer there is.
   * Asking a question whose answer you already have, seven times, is worse than
   * not offering it.
   *
   * The sample floor is the same figure as the demotion threshold. One or two
   * refusals is not a pattern, and without a floor a single early refusal on a
   * consequential tool would switch it off on the evidence of one afternoon.
   */
  if (record.approved === 0 && record.rejected >= APPROVAL_DEMOTE_N) {
    return {
      decision: "disabled",
      reason: `You have turned down all ${record.rejected} requests to do this and approved none, so it is switched off rather than asked again. Turning it back on is yours.`,
    };
  }

  if (base.decision === "always-human") return base;

  if (record.consecutiveRejections >= APPROVAL_DEMOTE_N) {
    const dropped = DEMOTED[base.decision as "never-ask" | "earn-it"];
    return {
      decision: dropped,
      reason:
        dropped === "always-human"
          ? `You turned down the last ${record.consecutiveRejections} of these, so it now waits for you every time instead of trying to earn its way out.`
          : `You turned down the last ${record.consecutiveRejections} of these, so the crew stopped running it on its own and will ask from now on.`,
    };
  }

  return base;
}

/**
 * Whether a record could only ever have tightened the answer.
 *
 * Exported because it is the property the tests assert and a caller wiring this
 * to real data can assert the same thing against its own numbers. Keeping the
 * check here rather than only in the test file means the invariant travels with
 * the module it constrains.
 */
export function isNeverLaxerThanDefault(input: ApprovalPolicyInput): boolean {
  return (
    STRICTNESS[resolveApprovalPolicy(input).decision] >=
    STRICTNESS[axisDefault(input.tool).decision]
  );
}
