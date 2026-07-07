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
export const HIGH_RISK_MIN_CONFIRM = new Set(["calendar.create", "studio.commit", "studio.pr.open"]);
/** Safety floor: always `review`. Never graduates. */
export const HIGH_RISK_FORCE_REVIEW = new Set(["studio.pr.merge", "studio.revert", "delegate.openhands"]);

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
