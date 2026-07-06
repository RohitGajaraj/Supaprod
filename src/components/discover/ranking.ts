import { verdictFor, type OpportunityVerdictInput, type VerdictWord } from "./format";

/**
 * Deterministic opportunity ranking.
 *
 * An agent (and a human) needs a single, stable total order of the bets and
 * one unambiguous top priority, never a tie or a coin flip. Two bets with the
 * same ICE score are separated by a fixed tie-break chain, and the chain ends
 * in an absolute finalizer (the id) so the order is never left to chance.
 *
 * Pure functions only: no React, no side effects, so the order is testable and
 * identical on every run and on server or client.
 */

/** The fields ranking reads off an opportunity. Extends the verdict input so
 * the same row that `verdictFor` accepts is rankable, plus the numeric ICE
 * components and the stable ordering keys (created_at, id). */
export interface RankableOpportunity extends OpportunityVerdictInput {
  id: string;
  ice_score: number | null;
  confidence: number;
  impact: number;
  created_at: string;
  theme_id?: string | null;
}

/** One ranked bet: the source opportunity, its 1-based position, the single
 * best-bet flag, and the human-and-agent readable rationale plus the
 * recommended next action. */
export interface RankedOpportunity<T> {
  opp: T;
  rank: number;
  isBestBet: boolean;
  rationale: string;
  nextAction: string;
}

/**
 * Maps a Critic verdict word to a strength number, higher is stronger.
 * SHIP (endorsed/proceed/strong) is highest; PENDING (not yet reviewed, the
 * "none" case) sits in the middle; REVISE (caution/weak) and KILL (reject)
 * are the lowest, with REVISE above KILL so a fixable bet outranks a dead one.
 * WATCH is a reviewed positive hold, so it ranks just above PENDING.
 */
export function verdictRankOf(verdict: VerdictWord): number {
  switch (verdict) {
    case "SHIP":
      return 4;
    case "WATCH":
      return 3;
    case "PENDING":
      return 2;
    case "REVISE":
      return 1;
    case "KILL":
      return 0;
  }
}

/** Coalesce a nullable score to a comparable number. A missing score sinks to
 * the bottom of its tier deterministically rather than producing NaN. */
function scoreOf(opp: RankableOpportunity): number {
  return opp.ice_score ?? 0;
}

/** Parse a timestamp to millis, with a stable fallback so a malformed date can
 * never introduce randomness into the order. */
function timeOf(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * The deterministic comparator. The tie-break chain, in strict order:
 *   1. ice_score      desc  (the primary priority signal)
 *   2. verdict rank   desc  (the Critic's strongest bets first)
 *   3. corroboration  desc  (backing signal count via corroborationOf)
 *   4. confidence     desc
 *   5. impact         desc
 *   6. created_at     asc   (the older, proven bet first)
 *   7. id             asc   (absolute stable finalizer, never random)
 *
 * Returns a negative number when `a` should sort before `b`.
 */
export function compareOpportunities<T extends RankableOpportunity>(
  a: T,
  b: T,
  corroborationOf: (opp: T) => number,
): number {
  const byIce = scoreOf(b) - scoreOf(a);
  if (byIce !== 0) return byIce;

  const byVerdict = verdictRankOf(verdictFor(b)) - verdictRankOf(verdictFor(a));
  if (byVerdict !== 0) return byVerdict;

  const byCorroboration = corroborationOf(b) - corroborationOf(a);
  if (byCorroboration !== 0) return byCorroboration;

  const byConfidence = (b.confidence ?? 0) - (a.confidence ?? 0);
  if (byConfidence !== 0) return byConfidence;

  const byImpact = (b.impact ?? 0) - (a.impact ?? 0);
  if (byImpact !== 0) return byImpact;

  const byCreated = timeOf(a.created_at) - timeOf(b.created_at);
  if (byCreated !== 0) return byCreated;

  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/** Build the short rationale sentence from the discriminators that are true or
 * nonzero for this bet, e.g. "Ranked #1: top ICE score, Critic endorsed,
 * backed by 7 signals". */
function rationaleFor(
  opp: RankableOpportunity,
  rank: number,
  corroboration: number,
): string {
  const verdict = verdictFor(opp);
  const clauses: string[] = [];

  if (rank === 1) clauses.push("top ICE score");
  else if (opp.ice_score != null) clauses.push(`ICE ${opp.ice_score.toFixed(1)}`);

  if (verdict === "SHIP") clauses.push("Critic endorsed");
  else if (verdict === "WATCH") clauses.push("flagged to watch");
  else if (verdict === "REVISE") clauses.push("Critic says revise");
  else if (verdict === "KILL") clauses.push("Critic says kill");

  if (corroboration > 0) {
    clauses.push(`backed by ${corroboration} signal${corroboration === 1 ? "" : "s"}`);
  }

  return clauses.length > 0 ? `Ranked #${rank}: ${clauses.join(", ")}` : `Ranked #${rank}`;
}

/** The recommended next action, derived from the bet's state. */
function nextActionFor(opp: RankableOpportunity): string {
  const verdict = verdictFor(opp);
  if (verdict === "PENDING") return "Challenge with the Critic first";
  if (opp.status === "shipped") return "Review the outcome";
  if (verdict === "SHIP" && (opp.status === "backlog" || opp.status === "now")) {
    return "Draft the spec";
  }
  return "Draft the spec";
}

/**
 * Rank a list of opportunities into a deterministic total order. Returns a new
 * array (does not mutate the input) of ranked entries, 1-based and contiguous,
 * with exactly one `isBestBet` (rank 1) whenever the list is non-empty.
 */
export function rankOpportunities<T extends RankableOpportunity>(
  opps: readonly T[],
  corroborationOf: (opp: T) => number,
): RankedOpportunity<T>[] {
  const sorted = [...opps].sort((a, b) => compareOpportunities(a, b, corroborationOf));
  return sorted.map((opp, index) => {
    const rank = index + 1;
    return {
      opp,
      rank,
      isBestBet: rank === 1,
      rationale: rationaleFor(opp, rank, corroborationOf(opp)),
      nextAction: nextActionFor(opp),
    };
  });
}
