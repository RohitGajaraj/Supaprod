/**
 * Signal Fabric - telling a restatement apart from a second witness.
 *
 * WHAT THIS EXISTS TO STOP, measured on the live database 2026-08-22. The
 * autonomous loop ran on real customer data, promoted a theme, and burned the
 * account's whole monthly credit grant in ~80 minutes. The evidence under that
 * theme was thirteen rows. It was two observations:
 *
 *   "Users, particularly those in EU timezones, experience significant delays…"  7 rows
 *   "Users in EU regions face critical delays of up to 12 hours…"                6 rows
 *
 * all `source='agent'`, all `external_id IS NULL`, all inside 21 minutes, all one
 * workspace. `prepare.ts` deduped on `external_id` alone and `signals.log` supplies
 * none, so the branch never fired and thirteen copies of one sentence were counted
 * as thirteen independent units of evidence. The promotion bar asks "how many
 * independent signals say this", and repetition answered it.
 *
 * THE BAR IS NOT THE BUG AND IS NOT TOUCHED HERE. A bar is only as honest as the
 * units under it. This file makes a unit mean one observation.
 *
 * ── WHAT COUNTS AS THE SAME OBSERVATION ────────────────────────────────────
 *
 * Two rules, cascaded, because the incident's own rows prove each catches what the
 * other cannot. The thirteen rows hold exactly four distinct texts: each of the two
 * sentences was stored both in full AND in a 120-character truncation of itself
 * (`signals.log` derives a missing title as `content.slice(0, 120)`, and the agent
 * then re-filed what it read back). So:
 *
 *   1. NORMALIZED-TEXT IDENTITY kills 9 of the 13. Deterministic, needs no vector,
 *      cannot be wrong. It cannot see the truncation pairs: a 120-char prefix is a
 *      different string from the 211-char sentence it was cut from.
 *
 *   2. EMBEDDING SIMILARITY kills the remaining truncation pairs, taking 4 to 2.
 *      It is the rule that does the actual work, and the only one that can see a
 *      restatement that is not a copy.
 *
 * Exact-text alone would have left four "independent" signals where there were two,
 * which is still a fabricated majority. Embedding alone would have worked but pays a
 * vector comparison for rows a string compare settles for free, and goes blind the
 * moment an embedding is missing - which is a real state, because `attachEmbeddings`
 * is fail-open by contract. Neither rule is sufficient; the cascade is.
 *
 * ── THE THRESHOLD, AND WHY IT IS NOT 0.8 ───────────────────────────────────
 *
 * `THEME_ATTACH_THRESHOLD` is 0.8 and it is the precedent to read before choosing,
 * not the number to copy. Cosine similarities measured across the thirteen rows and
 * their neighbours, on the live database, same embedding model:
 *
 *     byte-identical copies                                    1.0000
 *     same sentence, one truncated (sentence B)                0.9359
 *     a third agent restatement of the same sentence           0.9011
 *     a shorter agent restatement of the same problem          0.8826
 *     same sentence, one truncated (sentence A)                0.8682   <- must catch
 *     ────────────────────────────────────────────────────────────────
 *     the two sentences, to each other                         0.7300   <- must NOT catch
 *     nearest genuinely different signal                       0.6525
 *
 * The gap between 0.8682 and 0.7300 is where the decision lives, and 0.8 sits inside
 * it on the wrong side of nothing - it would work, by luck, on this data. It is the
 * wrong number for a reason that outlives this incident: 0.8 is the bar for "this
 * signal belongs to that theme", and the sink must not be making theme decisions.
 *
 * THE SINK'S BAR MUST BE STRICTLY HIGHER THAN THE THEME LAYER'S, because they answer
 * different questions. The theme layer asks "is this the same SUBJECT" and is allowed
 * to be generous: a wrong attach is reversible and a human can merge or split. The
 * sink asks "is this the same STATEMENT" and its answer destroys a row, which nothing
 * downstream can undo. At 0.7300 the two sentences describe one problem in different
 * words and each carries a fact the other does not (one names follow-the-sun coverage,
 * the other names time-to-resolution). Folding those is a judgment about subject, and
 * `themes` is the thing built to make it, with a human able to look at the result.
 *
 * 0.85 catches every restatement measured and clears the two-sentence pair by 0.12.
 * The honest weakness: it clears 0.8682 by only 0.018, so the truncation pair sits
 * close to the line. That is the acceptable side to be thin on. A MISSED fold costs
 * one extra row - exactly today's behaviour, which is survivable. An OVER-EAGER fold
 * silently deletes a real observation, and no reader downstream can tell it ever
 * arrived. The failure is asymmetric, so the threshold leans toward keeping.
 */
import { cosineSimilarity, parseVector } from "@/lib/ai/theme-growth";

/**
 * Cosine similarity at or above which one text is a RESTATEMENT of another.
 *
 * Deliberately above `THEME_ATTACH_THRESHOLD` (0.8). See the header: the sink
 * decides "same statement" and the theme layer decides "same subject", and a sink
 * bar at or below the theme bar would silently pre-empt clustering decisions by
 * destroying the rows the theme layer was built to weigh.
 */
export const RESTATEMENT_THRESHOLD = 0.85;

/**
 * How far back a stored signal can absorb a new one. 24 hours.
 *
 * NOT unbounded, and this is the half that is easy to get wrong. The same complaint
 * arriving next week is NOT a restatement - it is the strongest evidence a problem is
 * real, and `theme-growth.ts` exists precisely so that "the same complaint arriving
 * next week makes the first one heavier". An unbounded window would erase recurrence,
 * which is the one thing the brain is for.
 *
 * 24 hours is the band where repetition is a mechanism rather than a fact about the
 * world: a loop tick re-running, a job retried, an agent re-reading its own output and
 * filing it again. The incident spanned 21 minutes and three ticks, well inside it.
 */
export const RESTATEMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Most recent rows compared against, per (workspace, source) window.
 *
 * The window is scanned exhaustively rather than sampled by a top-K vector search,
 * because top-K over a user's whole corpus can push the true near-duplicate out of
 * the result set exactly when the window is busy - which is the pathological case
 * this file exists for. Measured on the live database, rows per
 * (workspace, source, day) with a null external_id: mean 3.9, p95 14, max 146. 200
 * covers every workspace-day production has ever seen, and bounds the payload.
 */
export const RESTATEMENT_WINDOW_MAX_ROWS = 200;

/** A stored signal the sink is comparing an incoming candidate against. */
export type StoredObservation = {
  id: string;
  title: string | null;
  content: string | null;
  /** The vector, in either shape supabase-js may hand back. See parseVector. */
  embedding: unknown;
  /** Which vector space `embedding` lives in. A mismatch makes cosine meaningless. */
  embeddingModel: string | null;
};

/** An incoming row, after prepare and after attachEmbeddings. */
export type IncomingObservation = {
  title: string;
  content: string;
  embedding?: unknown;
  embeddingModel?: string | null;
};

export type RestatementMatch = {
  /** The stored signal this restates. Null when the match is another row in this batch. */
  ofId: string | null;
  /** Which rule fired. Kept because "identical" and "0.87 similar" are different facts. */
  rule: "text" | "vector";
  similarity: number;
};

/**
 * The comparison key for the text rule.
 *
 * Normalized rather than raw, for the same reason `signalEmbeddingText` collapses
 * whitespace: the same sentence re-filed with different wrapping or a trailing period
 * is the same sentence, and a raw compare would call it new. Normalization stops at
 * case, whitespace and terminal punctuation - it does NOT strip interior punctuation
 * or stem words, because that starts merging texts that differ in meaning and the
 * vector rule is the right tool for anything past a literal match.
 *
 * Keyed on title AND content, joined by a character neither can contain. Title alone
 * would be catastrophic here: these titles are auto-derived truncations of content, so
 * two genuinely different observations that happen to open with the same 120
 * characters would collide and one would be destroyed.
 */
export function observationFingerprint(title: string | null, content: string | null): string {
  const norm = (s: string | null) =>
    (s ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!?…]+$/u, "");
  return `${norm(title)} ${norm(content)}`;
}

/**
 * Does this candidate restate something already in the window?
 *
 * `stored` must ALREADY be scoped by the caller to one workspace, one source, one
 * time window, and to rows with no external_id. This function does not re-check that,
 * because the scope is a query concern and duplicating it here would let the two
 * definitions drift. See sink.server.ts for the argument behind each part of it.
 *
 * Returns the STRONGEST match, not the first: an exact text match outranks any vector
 * match, and among vector matches the closest wins, so the row a restatement is
 * attributed to is the one it most resembles rather than the one that sorted first.
 */
export function findRestatement(
  candidate: IncomingObservation,
  stored: readonly StoredObservation[],
  threshold: number = RESTATEMENT_THRESHOLD,
): RestatementMatch | null {
  const key = observationFingerprint(candidate.title, candidate.content);
  for (const s of stored) {
    if (observationFingerprint(s.title, s.content) === key) {
      return { ofId: s.id, rule: "text", similarity: 1 };
    }
  }

  // The vector rule needs a vector on BOTH sides and needs both to be in the same
  // space. A candidate whose embedding failed (attachEmbeddings is fail-open) simply
  // gets the text rule and nothing else, which is the correct degradation: it means a
  // restatement may slip through, never that a distinct observation is destroyed.
  const mine = parseVector(candidate.embedding);
  if (!mine) return null;
  const myModel = candidate.embeddingModel ?? null;
  if (!myModel) return null;

  let best: RestatementMatch | null = null;
  for (const s of stored) {
    // PIN THE MODEL. On 2026-08-02 a provider key change silently moved production
    // onto a second embedding model, and rows from two vector spaces sat in the same
    // column, where cosine distance between them is arithmetic without meaning
    // (see judgment-search.server.ts, which pins for the same reason). Comparing
    // across spaces here would delete real signals on the strength of a number that
    // means nothing. A mismatch must yield NOTHING, never confident nonsense.
    if ((s.embeddingModel ?? null) !== myModel) continue;
    const theirs = parseVector(s.embedding);
    if (!theirs) continue;
    const sim = cosineSimilarity(mine, theirs);
    if (sim === null) continue;
    if (sim >= threshold && (best === null || sim > best.similarity)) {
      best = { ofId: s.id, rule: "vector", similarity: sim };
    }
  }
  return best;
}

/**
 * Is this candidate eligible to be folded at all?
 *
 * THE ONE DISTINCTION THAT MATTERS, and the honest limit of this whole file.
 *
 * Two customers reporting the same problem is corroboration and must count twice.
 * One agent rephrasing itself is noise and must count once. Their TEXT is identical
 * in both cases, so no text rule and no threshold can separate them. What separates
 * them is whether the producer can name a distinct thing the observation came from:
 *
 *   external_id PRESENT - the producer is asserting "this is a distinct real-world
 *   item": this Intercom conversation, this Zendesk ticket, this review. Two tickets
 *   that say the same words are two customers. That assertion outranks any similarity
 *   score, so a candidate carrying an external_id is NEVER folded by this rule. The
 *   existing external_id dedup already makes those idempotent, which is a different
 *   job - it stops the same item being stored twice, not two items sounding alike.
 *
 *   external_id ABSENT - the producer cannot point at a distinct origin. The only
 *   thing telling this row apart from the last one is its text. When the text is the
 *   same too, there is no evidence of a second occurrence, and "how many independent
 *   signals say this" must not be answered by something that produced no evidence of
 *   independence. Counting it as independent anyway is the error that burned the
 *   credits.
 *
 * WHERE THIS FAILS, said plainly because it is a real cost and not a rounding error:
 * two genuinely different customers whose complaints are both filed by one agent
 * through `signals.log` with no external_id WILL be folded, and a real corroboration
 * is lost. The rule cannot tell them apart, because nothing in the row says who said
 * it - `signals.log` accepts content, title, source, sentiment and tags, and has no
 * field for the person, ticket or conversation behind the observation. That is the
 * actual root cause and it is upstream of this file. Until that field exists the sink
 * is choosing between two wrong answers, and it takes the recoverable one: an
 * under-count leaves a `restated_count` a human can read and act on, while an
 * over-count is what promotes a theme nobody can walk back.
 */
export function isFoldable(candidate: { externalId?: string | null }): boolean {
  return !candidate.externalId;
}
