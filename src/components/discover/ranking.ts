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
  ease: number;
  created_at: string;
  theme_id?: string | null;
}

/** A system-derived bet designation drawn from a self-explanatory PM vocabulary,
 * so a user or an agent reads what each bet IS at a glance and which to pick.
 * `null` means the bet earns no designation (a plain ranked bet). More PM terms
 * (sure thing, long shot, table stakes) are available spares if the set grows. */
export type Designation =
  | "best bet"
  | "needs validation"
  | "quick win"
  | "heavy lift"
  | "watch this week"
  | null;

/** One ranked bet: the source opportunity, its 1-based position, the single
 * best-bet flag, its system-derived designation, and the human-and-agent
 * readable rationale plus the recommended next action. */
export interface RankedOpportunity<T> {
  opp: T;
  rank: number;
  isBestBet: boolean;
  designation: Designation;
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
 * The pure, deterministic bet designation. Names each ranked bet in a
 * self-explanatory PM vocabulary so a human or an agent knows what the bet IS
 * and which to pick, without a model call. Evaluated in strict order (the first
 * match wins), so rank 1 is always the single best bet even if a lower rule
 * would also match it:
 *   1. rank === 1                                      -> "best bet"
 *   2. NOT endorsed (verdict rank below the endorsed
 *      top, SHIP) AND impact >= 6                      -> "needs validation"
 *   3. ease >= 7 AND impact >= 5                       -> "quick win"
 *   4. ease <= 3                                       -> "heavy lift"
 *   5. corroboration >= 3                              -> "watch this week"
 *   6. otherwise                                       -> null (a plain bet)
 * "Not endorsed" is the Critic having not endorsed the bet (pending, watch,
 * revise, or kill, i.e. a verdict rank below SHIP's).
 */
export function deriveDesignation(input: {
  rank: number;
  verdict: VerdictWord;
  impact: number;
  ease: number;
  corroboration: number;
}): Designation {
  const { rank, verdict, impact, ease, corroboration } = input;
  if (rank === 1) return "best bet";
  const endorsed = verdictRankOf(verdict) >= verdictRankOf("SHIP");
  if (!endorsed && impact >= 6) return "needs validation";
  if (ease >= 7 && impact >= 5) return "quick win";
  if (ease <= 3) return "heavy lift";
  if (corroboration >= 3) return "watch this week";
  return null;
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
    const corroboration = corroborationOf(opp);
    return {
      opp,
      rank,
      isBestBet: rank === 1,
      designation: deriveDesignation({
        rank,
        verdict: verdictFor(opp),
        impact: opp.impact,
        ease: opp.ease,
        corroboration,
      }),
      rationale: rationaleFor(opp, rank, corroboration),
      nextAction: nextActionFor(opp),
    };
  });
}
