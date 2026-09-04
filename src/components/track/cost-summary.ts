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
  /** Sum of what these turns' own calls debited from `credit_ledger`. */
  creditsTotal: number;
  /** Every run linked to this track, however it ended. */
  turns: number;
}

export function costSummary(
  turns: Array<Pick<Turn, "tookMs" | "tokens" | "usd" | "credits">>,
): CostSummary {
  let msTotal = 0;
  let timedTurns = 0;
  let tokenTotal = 0;
  let usdTotal = 0;
  let creditsTotal = 0;
  for (const t of turns) {
    if (t.tookMs != null) {
      msTotal += t.tookMs;
      timedTurns += 1;
    }
    if (t.tokens != null) tokenTotal += t.tokens;
    usdTotal += t.usd ?? 0;
    creditsTotal += t.credits ?? 0;
  }
  return { msTotal, timedTurns, tokenTotal, usdTotal, creditsTotal, turns: turns.length };
}

/**
 * THE ONE SPEND CLAUSE, credits first (P-136, A-QUEUE). The account is billed
 * and shown in credits everywhere else this product has an opinion -- Team >
 * Spend and limits, the balance on Start -- so this leads with the same
 * currency instead of the dollar figure a person had to convert in their head.
 * The dollar total is demoted into the parenthetical: real, in the summary,
 * never the first thing read.
 *
 * ONE COMPOSER for the bottom bar (`run-tally.ts`), its own strip, and the
 * artifact pane's audit (`RunCost.tsx`), so the run screen cannot show two
 * currencies, or two numbers in the same one, again.
 *
 * WHEN CREDITS ARE ZERO BUT MONEY IS NOT: a run whose ledger rows never
 * joined to a trace (older data, or a call path `creditsSpentByTrace` does not
 * cover yet) still genuinely cost something, and saying otherwise would be the
 * exact invented zero this file already refuses on `tookMs` and `tokens`. That
 * one case falls back to the dollar figure alone, which is still one number in
 * one currency, not two.
 */
export function spendClause(s: CostSummary): string | null {
  if (s.creditsTotal > 0) {
    const credits = `${s.creditsTotal.toLocaleString()} ${s.creditsTotal === 1 ? "credit" : "credits"}`;
    return s.usdTotal > 0 ? `${credits} ($${s.usdTotal.toFixed(2)})` : credits;
  }
  return s.usdTotal > 0 ? `$${s.usdTotal.toFixed(2)}` : null;
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
  const spend = spendClause(s);
  lines.push(spend ? `${spend} spent` : "Nothing was charged.");
  return lines;
}
