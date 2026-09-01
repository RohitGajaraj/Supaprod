import type { Turn } from "@/lib/spine/activity";
import { formatElapsed } from "@/components/meridian/run-rows";

/**
 * WHAT THE WORK HAS COST, READ OFF ITS OWN RECEIPTS.
 *
 * Capability-register "Report cost" (§11): spend caps live on `agent_runs`,
 * `duration_ms` and `tokens_used` are written by finalizers -- and until this
 * existed, nothing anywhere put the three together against the work they
 * bought. Value-audit was the one verb with no surface at all.
 *
 * EVERY FIGURE IS AN AGGREGATE OF ROWS THAT EXIST, and each column keeps its
 * own honesty rule rather than sharing one:
 *
 *   time + tokens   a zero is a FINALIZER THAT DID NOT WRITE (a model call
 *                   cannot take 0ms or burn 0 tokens), so only measured values
 *                   aggregate -- `measured()`'s rule, applied per turn.
 *   money           summed straight off the column. Spend legitimately lands on
 *                   zero -- a seat refused before reaching a model is genuinely
 *                   free -- so the record's number is read as written.
 *
 * The pairing that makes this an AUDIT rather than a bill is the person's own
 * opening sentence, which is what the work was supposed to be doing. Cost
 * beside promise in one glance, both derived, neither invented.
 */
export interface CostSummary {
  /** Measured work-time across turns, in milliseconds. */
  msTotal: number;
  /** How many turns carried a measurable duration. */
  timedTurns: number;
  /** Measured tokens across turns. */
  tokenTotal: number;
  /** Sum of `spend_used_usd` exactly as the record wrote it. */
  usdTotal: number;
  /** Every run linked to this track, however it ended. */
  turns: number;
}

export function costSummary(turns: Array<Pick<Turn, "tookMs" | "tokens" | "usd">>): CostSummary {
  let msTotal = 0;
  let timedTurns = 0;
  let tokenTotal = 0;
  let usdTotal = 0;
  for (const t of turns) {
    if (t.tookMs != null) {
      msTotal += t.tookMs;
      timedTurns += 1;
    }
    if (t.tokens != null) tokenTotal += t.tokens;
    usdTotal += t.usd ?? 0;
  }
  return { msTotal, timedTurns, tokenTotal, usdTotal, turns: turns.length };
}

/** One figure per line of the audit, or null when the record cannot vouch. */
export function costLines(s: CostSummary): string[] {
  const lines: string[] = [];
  if (s.turns === 0) return lines;
  if (s.timedTurns > 0) {
    lines.push(
      `Worked for ${formatElapsed(s.msTotal / 1000)} across ${s.timedTurns} ${s.timedTurns === 1 ? "turn" : "turns"}`,
    );
  } else {
    // Turns exist but no finalizer wrote a duration: saying "0 minutes" would
    // be the exact lie `measured()` exists to stop.
    lines.push("No turn recorded how long it worked.");
  }
  if (s.tokenTotal > 0) {
    lines.push(`${s.tokenTotal.toLocaleString()} tokens`);
  }
  lines.push(s.usdTotal > 0 ? `$${s.usdTotal.toFixed(2)} spent` : "Nothing was charged.");
  return lines;
}
