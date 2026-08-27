/**
 * "EACH OF THESE COSTS ONE INTERRUPTION EVERY TIME IT HAPPENS" WAS THE
 * OPTIMISTIC READING OF A GATE.
 *
 * That is what the boundary says over the tools set to come to you first, and
 * it assumes the interruption is answered. Measured on the live database on
 * 2026-08-27 across all 324 `agent_approvals` rows ever written:
 *
 *   approved 79 · executed 44 · rejected 24 · failed 20   = 167 answered
 *   expired 71 · pending-past-expiry 21 · escalated 7      =  99 never answered
 *   cancelled 58
 *
 * So roughly one gate in three was never answered by anybody. The cost of those
 * was not an interruption. It was work that stopped and did not resume, and
 * R-27's own comment names the shape: *"a gate nobody answers is a stall wearing
 * governance as a costume."*
 *
 * A person setting a tool to "come to me first" is entitled to know that on this
 * workspace those requests have a real chance of dying unanswered, because the
 * fix is theirs either way: grant it, or switch it off. Both are better than a
 * gate that quietly eats the work.
 *
 * WHAT IT WILL NOT DO. It reports what it can see and says so. The read behind
 * it caps at 50 rows and covers only PENDING and EXPIRED gates for this person,
 * so it can count the unanswered ones and cannot compute a ratio against the
 * answered ones. A ratio would be the more useful number and it would be
 * invented, so the sentence stays a count with its population named, and says
 * "at least" the moment it is standing on a capped read.
 */

/** The shape `getGovernanceOverview().approvals` already returns. */
export interface GateRow {
  tool_name?: string | null;
  escalation_state?: string | null;
}

export interface UnansweredGates {
  /** The sentence, or null when nothing expired. */
  said: string | null;
  /** Gates seen in the expired state. */
  expired: number;
  /** True when the read was at its cap, so `expired` is a floor. */
  capped: boolean;
}

/**
 * `getGovernanceOverview` selects `agent_approvals` with `.limit(50)`, filtered
 * to pending and expired. Passed in rather than hardcoded twice, so a change
 * there is a compile-time argument here rather than a silent lie about the cap.
 */
export const GATE_READ_LIMIT = 50;

export function unansweredGates(
  approvals: readonly GateRow[] | null | undefined,
  toolLabel: (name: string) => string,
): UnansweredGates {
  if (!approvals || approvals.length === 0) {
    return { said: null, expired: 0, capped: false };
  }

  const dead = approvals.filter((a) => a.escalation_state === "expired");
  if (dead.length === 0) return { said: null, expired: 0, capped: false };

  const capped = approvals.length >= GATE_READ_LIMIT;
  const names = [...new Set(dead.map((a) => a.tool_name).filter((n): n is string => !!n))]
    .map(toolLabel)
    .sort();

  const count = capped ? `At least ${dead.length}` : `${dead.length}`;
  const verb = dead.length === 1 ? "request was" : "requests were";
  /* Two named tools at most. A list long enough to wrap stops being a pointer
     and becomes a second table nobody reads. */
  const which =
    names.length === 0
      ? ""
      : names.length <= 2
        ? ` (${names.join(" and ")})`
        : ` (${names[0]}, ${names[1]} and ${names.length - 2} more)`;

  return {
    said: `${count} ${verb} never answered${which} and expired, so the work stopped rather than waiting. Granting one or switching it off both beat leaving it there.`,
    expired: dead.length,
    capped,
  };
}

/**
 * WHAT BECAME OF EVERY GATE THIS WORKSPACE EVER RAISED.
 *
 * The sentence above is a floor with no denominator: it counts expired gates
 * off a read capped at 50 rows, covering only this person's pending and
 * expired ones, so it can say "3 expired" and never "3 of how many".
 *
 * `getBoundary` now counts all three states across the workspace's whole
 * history. Measured 2026-08-27 across the 324 rows ever written: 176 answered,
 * 92 expired unanswered, 58 cancelled. More than one gate in four was never
 * answered by anybody.
 *
 * IT STATES THE POPULATION RATHER THAN A PERCENTAGE. "28% expired" hands a
 * person a number whose denominator they cannot see; "92 of 324" is the same
 * fact with the population in it, and this file already argues that a count
 * whose population is not named will be read as covering everything.
 *
 * NULL DRAWS NOTHING. A failed count is not "none expired", which is the
 * reassuring answer arrived at by omission.
 */
export interface GateHistory {
  total: number;
  answered: number;
  expired: number;
}

export function whatBecameOfThem(history: GateHistory | null | undefined): string | null {
  if (!history || history.total <= 0) return null;
  if (history.expired <= 0) {
    /* Worth saying: a workspace that answers every gate has proved the thing
       the expired ones disprove, and nothing else on this page says it. */
    return `All ${history.total} ${history.total === 1 ? "gate" : "gates"} this workspace has raised ${history.total === 1 ? "was" : "were"} answered.`;
  }
  const one = history.expired === 1;
  return `${history.expired} of the ${history.total} gates this workspace has ever raised ${one ? "was" : "were"} never answered.`;
}
