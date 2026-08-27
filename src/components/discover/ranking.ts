import { iceNum } from "@/lib/moat-vis";
import { verdictFor, type OpportunityVerdictInput, type VerdictWord } from "./format";
import { agentDisplayName } from "@/lib/agent-vocabulary";

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
  // RPT-47: the strategic top bet a human tied this opportunity to, if any. The
  // ranking reads it (via briefAlignmentOf) so a watched assumption on that bet
  // feeds the order. Optional so pre-migration rows and non-discover callers are
  // unaffected.
  linked_brief_item_id?: string | null;
}

/** A system-derived bet designation drawn from a self-explanatory PM vocabulary,
 * so a user or an agent reads what each bet IS at a glance and which to pick.
 * `null` means the bet earns no designation (a plain ranked bet). More PM terms
 * (sure thing, long shot, table stakes) are available spares if the set grows. */
export type Designation =
  "best bet" | "needs validation" | "quick win" | "heavy lift" | "watch this week" | null;

/** One named factor behind a bet's position: what counted (label) and its
 * concrete value or tier for THIS bet (detail). Terms carry no weights and
 * introduce no new computation - each one restates a field the decorate step
 * already computed, so the explanation can never disagree with the order. */
export interface Term {
  label: string;
  detail: string;
}

/** One ranked bet: the source opportunity, its 1-based position, the single
 * best-bet flag, its system-derived designation, the human-and-agent
 * readable rationale plus the recommended next action, and `terms`: the same
 * reasoning as structured data, ordered most-decisive-first (the comparator's
 * own tie-break chain). `rationale` is the prose projection of `terms`, so a
 * surface can show "why it ranks here" as chips without parsing sentences.
 * `outcomeSupport` is the recorded-outcome signal that informed the order (0
 * when the theme has no decisive history yet, or no support callback was
 * wired). */
export interface RankedOpportunity<T> {
  opp: T;
  rank: number;
  isBestBet: boolean;
  designation: Designation;
  rationale: string;
  terms: Term[];
  nextAction: string;
  outcomeSupport: number;
  // RPT-47: the brief-alignment signal that informed the order (+1 on a standing
  // top bet, -1 when that bet's assumption is challenged, 0 untied).
  briefAlignment: number;
}

/**
 * The reinforcement seam: fold a theme's decisive recorded outcomes into one
 * comparable number. Validated outcomes lift NEW bets on the same evidence,
 * missed ones sink them; each side is capped at 3 so one prolific theme can
 * never swamp the human's own ICE scoring, and 'mixed' verdicts are
 * deliberately neutral. Pure and deterministic like everything else in this
 * engine - the DB read that produces the counts lives with the callers.
 */
export function outcomeSupportFromCounts(validated: number, missed: number): number {
  const v = Math.min(Math.max(validated, 0), 3);
  const m = Math.min(Math.max(missed, 0), 3);
  return v - m;
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
 *   1. ice_score       desc  (the primary priority signal)
 *   2. verdict rank    desc  (the Critic's strongest bets first)
 *   3. brief alignment desc  (RPT-47: a watched assumption feeding the order.
 *                             An opportunity tied to a STANDING strategic top
 *                             bet lifts (+1); one tied to a bet with a
 *                             CHALLENGED assumption sinks (-1); untied is 0.
 *                             Sits below the Critic's verdict so alignment can
 *                             never lift a KILL over a SHIP, but above raw
 *                             history so live strategy outranks signal volume)
 *   4. outcome support desc  (recorded outcomes on the same evidence: what
 *                             actually happened beats what might - a theme
 *                             with validated history lifts its new bets, a
 *                             theme with missed history sinks them)
 *   5. corroboration   desc  (backing signal count via corroborationOf)
 *   6. confidence      desc
 *   7. impact          desc
 *   8. created_at      asc   (the older, proven bet first)
 *   9. id              asc   (absolute stable finalizer, never random)
 *
 * Returns a negative number when `a` should sort before `b`.
 */
export function compareOpportunities<T extends RankableOpportunity>(
  a: T,
  b: T,
  corroborationOf: (opp: T) => number,
  outcomeSupportOf: (opp: T) => number = () => 0,
  briefAlignmentOf: (opp: T) => number = () => 0,
): number {
  const byIce = scoreOf(b) - scoreOf(a);
  if (byIce !== 0) return byIce;

  const byVerdict = verdictRankOf(verdictFor(b)) - verdictRankOf(verdictFor(a));
  if (byVerdict !== 0) return byVerdict;

  const byBrief = briefAlignmentOf(b) - briefAlignmentOf(a);
  if (byBrief !== 0) return byBrief;

  const bySupport = outcomeSupportOf(b) - outcomeSupportOf(a);
  if (bySupport !== 0) return bySupport;

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
 * nonzero for this bet, e.g. "Ranked #1: top ICE score, Challenge endorsed,
 * backed by 7 findings". */
function rationaleFor(
  opp: RankableOpportunity,
  rank: number,
  corroboration: number,
  outcomeSupport: number = 0,
  briefAlignment: number = 0,
): string {
  const verdict = verdictFor(opp);
  const clauses: string[] = [];
  // PostgREST can serialize the `numeric` ice_score column as a string, not a
  // number (the generated Supabase type lies) - iceNum coerces it the same
  // way moat-vis.ts and decision-judgment.functions.ts already do for the
  // same column, so .toFixed never throws here.
  const ice = iceNum(opp.ice_score);

  if (rank === 1) clauses.push("top ICE score");
  else if (ice != null) clauses.push(`ICE ${ice.toFixed(1)}`);

  // The reviewer is named by the catalog, never by a literal. These clauses
  // render beside an AgentMark whose label comes from agentDisplayName, so a
  // hardcoded "Critic" put two names for the same worker on one screen: the
  // mark said "Challenge" and the sentence next to it said "Critic". DB slugs
  // never move, display names do, and this is display.
  const reviewer = agentDisplayName("critic");
  if (verdict === "SHIP") clauses.push(`${reviewer} endorsed`);
  else if (verdict === "WATCH") clauses.push("flagged to watch");
  else if (verdict === "REVISE") clauses.push(`${reviewer} says revise`);
  else if (verdict === "KILL") clauses.push(`${reviewer} says kill`);

  // Qualitative on purpose: the support number is a capped NET of validated
  // minus missed, so quoting it as a raw count could overstate or understate
  // the record. The receipts live on the theme's outcome history.
  if (outcomeSupport > 0) clauses.push("outcomes on this theme run proven");
  else if (outcomeSupport < 0) clauses.push("outcomes on this theme have missed");

  // RPT-47: name the strategic-brief signal so the reorder is legible, not silent.
  if (briefAlignment > 0) clauses.push("on a standing top bet");
  else if (briefAlignment < 0) clauses.push("a linked bet's assumption is challenged");

  if (corroboration > 0) {
    clauses.push(`backed by ${corroboration} finding${corroboration === 1 ? "" : "s"}`);
  }

  return clauses.length > 0 ? `Ranked #${rank}: ${clauses.join(", ")}` : `Ranked #${rank}`;
}

/**
 * The structured twin of rationaleFor: the same discriminators, as ordered
 * terms instead of prose. Order is most-decisive-first by construction - it
 * follows the comparator's tie-break chain (ICE, then verdict, then brief
 * alignment, then outcome support, then corroboration), so the first term is
 * the earliest factor in that chain that says anything about this bet. A term
 * appears only when its factor is true or nonzero, exactly like a rationale
 * clause; two bets tied on every named factor carry byte-identical terms and
 * the id finalizer is what separated them. Reads only fields the decorate step
 * already computed (plus iceNum on the raw score, as rationaleFor does).
 */
function termsFor(
  opp: RankableOpportunity,
  rank: number,
  verdict: VerdictWord,
  corroboration: number,
  outcomeSupport: number = 0,
  briefAlignment: number = 0,
): Term[] {
  const reviewer = agentDisplayName("critic");
  const terms: Term[] = [];
  // Same coercion as rationaleFor: PostgREST serializes the numeric column as
  // a string, iceNum normalizes it so .toFixed never throws.
  const ice = iceNum(opp.ice_score);

  // ICE always leads: it is the primary signal even when it is absent, and at
  // rank 1 it names the concrete value rather than the prose "top ICE score",
  // because a chip can show a number without reading like a boast.
  if (rank === 1) {
    terms.push({
      label: "ICE",
      detail: `${ice != null ? ice.toFixed(1) : "no score yet"} - highest in queue`,
    });
  } else {
    terms.push({ label: "ICE", detail: ice != null ? ice.toFixed(1) : "no score yet" });
  }

  if (verdict === "SHIP")
    terms.push({ label: `${reviewer} endorsed`, detail: "critic run, no kill" });
  else if (verdict === "WATCH")
    terms.push({ label: "Flagged to watch", detail: "held for more evidence" });
  else if (verdict === "REVISE")
    terms.push({ label: `${reviewer} says revise`, detail: "fixable concerns, ranked above kill" });
  else if (verdict === "KILL")
    terms.push({ label: `${reviewer} says kill`, detail: "rejected on review" });

  if (briefAlignment > 0)
    terms.push({
      label: "On a standing top bet",
      detail: "tied to the strategic top bet under watch",
    });
  else if (briefAlignment < 0)
    terms.push({
      label: "Linked bet challenged",
      detail: "the linked bet's assumption is challenged",
    });

  if (outcomeSupport > 0)
    terms.push({ label: "Theme track record", detail: "outcomes on this theme run proven" });
  else if (outcomeSupport < 0)
    terms.push({ label: "Theme track record", detail: "outcomes on this theme have missed" });

  if (corroboration > 0) {
    terms.push({
      label: "Evidence behind it",
      detail: `${corroboration} backing finding${corroboration === 1 ? "" : "s"}`,
    });
  }

  return terms;
}

/** The recommended next action, derived from the bet's state. */
export function nextActionFor(opp: RankableOpportunity): string {
  // Status takes precedence: shipped opps always review outcomes.
  if (opp.status === "shipped") return "Review the outcome";

  const verdict = verdictFor(opp);

  // Verdict-specific actions guide the user's next step.
  switch (verdict) {
    case "PENDING":
      return "Challenge with the Critic first";
    case "SHIP":
      return "Draft the spec";
    case "WATCH":
      return "Gather more evidence";
    case "REVISE":
      return "Address Critic feedback";
    case "KILL":
      return "Understand why it was rejected";
  }
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
 *
 * Implemented via Schwartzian transform (decorate-sort-undecorate) to eliminate
 * O(n log n) redundant function calls: verdictFor, scoreOf, timeOf, and the
 * callback functions (corroborationOf, etc.) are computed once per item (O(n)),
 * then the sort operates on cached values. This is critical for large
 * opportunity lists where the callbacks are expensive.
 */
export function rankOpportunities<T extends RankableOpportunity>(
  opps: readonly T[],
  corroborationOf: (opp: T) => number,
  outcomeSupportOf: (opp: T) => number = () => 0,
  briefAlignmentOf: (opp: T) => number = () => 0,
): RankedOpportunity<T>[] {
  // Decorate: precompute all derived values once per item (O(n))
  type Decorated = {
    opp: T;
    ice: number;
    verdict: VerdictWord;
    verdictRank: number;
    briefAlignment: number;
    outcomeSupport: number;
    corroboration: number;
    confidence: number;
    impact: number;
    createdMs: number;
    id: string;
  };

  const decorated: Decorated[] = opps.map((opp) => ({
    opp,
    ice: scoreOf(opp),
    verdict: verdictFor(opp),
    verdictRank: verdictRankOf(verdictFor(opp)),
    briefAlignment: briefAlignmentOf(opp),
    outcomeSupport: outcomeSupportOf(opp),
    corroboration: corroborationOf(opp),
    confidence: opp.confidence ?? 0,
    impact: opp.impact ?? 0,
    createdMs: timeOf(opp.created_at),
    id: opp.id,
  }));

  // Sort: compare using only precomputed values (O(n log n), no callback overhead)
  const sorted = decorated.sort((a, b) => {
    if (b.ice !== a.ice) return b.ice - a.ice;
    if (b.verdictRank !== a.verdictRank) return b.verdictRank - a.verdictRank;
    if (b.briefAlignment !== a.briefAlignment) return b.briefAlignment - a.briefAlignment;
    if (b.outcomeSupport !== a.outcomeSupport) return b.outcomeSupport - a.outcomeSupport;
    if (b.corroboration !== a.corroboration) return b.corroboration - a.corroboration;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    if (b.impact !== a.impact) return b.impact - a.impact;
    if (a.createdMs !== b.createdMs) return a.createdMs - b.createdMs;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  // Undecorate: map back to final shape (O(n))
  return sorted.map((decorated, index) => {
    const rank = index + 1;
    return {
      opp: decorated.opp,
      rank,
      isBestBet: rank === 1,
      designation: deriveDesignation({
        rank,
        verdict: decorated.verdict,
        impact: decorated.impact,
        ease: decorated.opp.ease,
        corroboration: decorated.corroboration,
      }),
      rationale: rationaleFor(
        decorated.opp,
        rank,
        decorated.corroboration,
        decorated.outcomeSupport,
        decorated.briefAlignment,
      ),
      terms: termsFor(
        decorated.opp,
        rank,
        decorated.verdict,
        decorated.corroboration,
        decorated.outcomeSupport,
        decorated.briefAlignment,
      ),
      nextAction: nextActionFor(decorated.opp),
      outcomeSupport: decorated.outcomeSupport,
      briefAlignment: decorated.briefAlignment,
    };
  });
}
