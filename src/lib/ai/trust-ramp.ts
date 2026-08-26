/**
 * SW-4 / mission 3.10 TRUST RAMP: the Cat Wu curve, made mechanical.
 *
 * Per (agent, tool), after N clean approvals the system PROPOSES graduating
 * the approval mode review -> confirm -> auto. It never silently flips: the
 * proposal is itself an approval item, and the mode changes only when the
 * human accepts. The RF-06 missed-outcome blocker guards the downside (an
 * agent with a recent 'missed' outcome gets no proposals at all).
 *
 * This module is the PURE seam: streak math, the ladder, and the risk
 * ceilings, unit-tested with no DB. The generator (reflection.server.ts),
 * the runtime override (loop.server.ts), and the decide fn
 * (trust.functions.ts) all consume it.
 */

export type RampMode = "auto" | "confirm" | "review";

/** Clean approvals in a row before a graduation is proposed. */
export const TRUST_RAMP_CLEAN_N = 5;

/** How far back an agent's 'missed' outcome blocks new proposals. */
export const TRUST_RAMP_OUTCOME_WINDOW_MS = 30 * 24 * 3600_000;

/**
 * Safety floor (not overridable by the autonomy dial OR the ramp): at least
 * `confirm`. Single source of truth: loop.server.ts imports these sets for
 * its resolveToolMode floors, and the ramp uses them as graduation ceilings
 * so it never proposes a mode the floor would immediately override.
 */
export const HIGH_RISK_MIN_CONFIRM = new Set(["calendar.create"]);
/**
 * Founder ruling 2026-07-08 (SW-7 live-run): the build lane's own mechanics
 * run autonomously. A studio/* branch commit and a draft PR are isolated and
 * reversible - the WHAT only ever lands through the review-pinned
 * studio.pr.merge gate above. studio.commit / studio.pr.open moved out of
 * HIGH_RISK_MIN_CONFIRM into this exemption set (the generic high-risk
 * demotion in resolveToolMode skips these three).
 */
/**
 * F-88, 2026-08-26 — `studio.unstage` joins, and it FOLLOWS the ruling above
 * rather than extending it.
 *
 * THE ASYMMETRY WAS THE BUG. `studio.stage` is autonomous: the build lane may
 * CREATE a staged intent without asking. `studio.unstage` was not: the same lane
 * could not WITHDRAW one. **A station that can enter a state it cannot leave is
 * trapped there**, and that is not a floor protecting anyone — it is a wall.
 *
 * WHAT THAT COST, MEASURED. F-63's floor refuses a commit that would write CI
 * config, a lockfile, or the manifest the checks run from. A builder refused
 * there leaves the path staged, and **every later `studio.commit` refuses the
 * whole changeset identically, forever.** Changeset `f9354439` has been stuck
 * exactly there since 2026-08-25 13:01, which is why track `7977dc06` — entry
 * `sense`, `waived='[]'`, two stations from the first acceptance this product has
 * ever recorded — sits at `ship` behind a PR that was never merged.
 *
 * IT IS LESS CONSEQUENTIAL THAN EVERY MEMBER ALREADY HERE, which is why this is
 * not a widening. `studio.unstage` "removes the staged INTENT only. It does not
 * revert a commit already pushed to the branch, it does not change the file on
 * the repo, and it is not an undo for work that has merged." So it touches
 * strictly less than `studio.stage`, which created the thing it removes, and the
 * ruling's own guarantee is untouched: **the WHAT still only lands through the
 * review-pinned `studio.pr.merge` gate.**
 *
 * The alternative — briefing the escape while leaving it floored — would swap a
 * trapped changeset for a queued approval, and 90 of those died detached from
 * the work that raised them. An escape that files a question is a second wall.
 */
export const BUILD_LANE_AUTONOMOUS = new Set([
  "studio.stage",
  "studio.unstage",
  "studio.commit",
  "studio.pr.open",
]);
/**
 * DELIBERATELY ABSENT FROM BOTH FLOORS: Build's pre-pull-request verification
 * checks (studio.review, studio.secrets.scan, studio.tests.plan,
 * studio.deps.audit). Recording the reasoning here so a later reader does not
 * take the omission for an oversight and "fix" it.
 *
 * A floor exists to put a human in front of consequence. These four have none:
 * they read the staged diff and GitHub, they write nothing, and their whole
 * purpose is to be run before the tools that DO have consequence. Flooring them
 * would invert their point twice over. It would put an approval in front of the
 * check that exists to shorten the approval queue, and it would make skipping
 * the check the cheapest path through the loop, which is precisely the state
 * that let an unread diff reach the merge gate.
 *
 * They are also not in BUILD_LANE_AUTONOMOUS, and do not need to be: that set
 * exempts a tool from the generic high-risk demotion in resolveToolMode, and
 * these are catalogued low-risk in tool-consequences.ts, so the demotion never
 * reaches them. Adding a read tool there would blur what the set means.
 *
 * The floors below are unchanged. Nothing in the Build verification layer
 * lowers one, and studio.pr.merge in particular still forces review no matter
 * how clean a review verdict is: a green check is evidence for a human, never a
 * substitute for one.
 */
/** Safety floor: always `review`. Never graduates. */
export const HIGH_RISK_FORCE_REVIEW = new Set([
  "studio.pr.merge",
  "studio.revert",
  "delegate.openhands",
  // Ship's own tool, pinned the day it was written rather than after an
  // incident. A production deploy is two of the four governance floors at once:
  // irreversible from inside the product, and customers see it. It is the only
  // gate in the seven-station loop, which is what makes the autonomy of the
  // other six defensible instead of reckless.
  "release.publish",
]);

const LADDER: Record<RampMode, RampMode | null> = {
  review: "confirm",
  confirm: "auto",
  auto: null,
};

/**
 * The next rung for a tool, honoring the risk ceilings: force-review tools
 * never graduate; min-confirm tools stop at confirm.
 */
export function nextRampMode(current: RampMode, toolName: string): RampMode | null {
  if (HIGH_RISK_FORCE_REVIEW.has(toolName)) return null;
  const next = LADDER[current] ?? null;
  if (next === "auto" && HIGH_RISK_MIN_CONFIRM.has(toolName)) return null;
  return next;
}

export interface DecidedApproval {
  tool_name: string;
  /** agent_approvals.status; only decided rows should be passed in. */
  status: string;
  decided_at: string | null;
}

/** 'executed' = you said yes AND the tool ran clean. The only status that
 *  counts toward a streak. */
const CLEAN = "executed";
/** A no from the human, or a yes that then broke: the streak resets. */
const BREAKS = new Set(["rejected", "failed"]);

/**
 * Consecutive clean approvals per tool, newest first, stopping at the first
 * break. Neutral statuses (approved-not-yet-executed, cancelled, expired)
 * neither count nor break. Rows may arrive in any order.
 */
export function computeCleanStreaks(rows: DecidedApproval[]): Map<string, number> {
  const sorted = [...rows]
    .filter((r) => r.decided_at != null)
    .sort((a, b) => (a.decided_at! < b.decided_at! ? 1 : -1));
  const streaks = new Map<string, number>();
  const broken = new Set<string>();
  for (const r of sorted) {
    if (broken.has(r.tool_name)) continue;
    if (r.status === CLEAN) {
      streaks.set(r.tool_name, (streaks.get(r.tool_name) ?? 0) + 1);
    } else if (BREAKS.has(r.status)) {
      broken.add(r.tool_name);
      if (!streaks.has(r.tool_name)) streaks.set(r.tool_name, 0);
    }
    // neutral statuses: skip
  }
  return streaks;
}

export interface GraduationCheck {
  toolName: string;
  streak: number;
  /** The stored mode the ramp would graduate FROM (override if one exists, else the seeded tool mode). */
  currentMode: RampMode;
  hasPendingProposal: boolean;
  /** RF-06: the agent has a 'missed' outcome inside the window. */
  outcomeBlocked: boolean;
}

/** The one gate deciding whether to write a proposal row. */
export function shouldProposeGraduation(
  check: GraduationCheck,
): { from: RampMode; to: RampMode } | null {
  if (check.outcomeBlocked) return null;
  if (check.hasPendingProposal) return null;
  if (check.streak < TRUST_RAMP_CLEAN_N) return null;
  const to = nextRampMode(check.currentMode, check.toolName);
  if (!to) return null;
  return { from: check.currentMode, to };
}
