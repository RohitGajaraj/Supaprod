/**
 * BEFORE DEFINE WRITES A SPEC, WHETHER ONE ALREADY SAYS THIS.
 *
 * ── WHAT THE RECORD SHOWS ─────────────────────────────────────────────────
 * Helio, measured 2026-09-04: 13 of 29 draft specs are duplicates of another
 * draft, in five title groups.
 *
 *   4x  "Installers working panel and inverter basements lose cell ..."  08-18 to 08-21
 *   3x  "Remove the redundant address re-confirmation step in Relay ..." 08-31 to 09-02
 *   2x  "Let returning customers reuse a saved delivery address ..."     both 08-27
 *   2x  "Differentiate the red status tile shown after an over-the- ..." both 08-31
 *   2x  "Differentiate the red tile shown after an over-the-air firm..." both 08-31
 *
 * The last two groups are near-duplicates of EACH OTHER, so four rows describe
 * one firmware tile. And the three address re-confirmation drafts are siblings
 * of `f2aa82f1`, which shipped on 09-04: two copies of a solved problem sat on
 * Waiting asking for approval while the thing they describe was already live.
 *
 * ── WHY THE GUARD THAT EXISTS DID NOT CATCH ANY OF THEM ───────────────────
 * `discovery.functions.ts` already refuses to mint a second spec for the same
 * BET, workspace-wide, and returns the first instead. It is a good guard and it
 * never fired here: **every one of the 13 carries `opportunity_id = null`.**
 * They were written from a brief rather than from a bet, and the brief path had
 * no duplicate check at all.
 *
 * P-57 covers the other half -- a second spec on the same TRACK returns the
 * first -- and that is per-track by construction. It is why `a3866e00` and
 * `9277a817` survived the 02:00 fold: each is the only spec on its own track,
 * so a per-track rule could never see them as twins. The same problem entering
 * twice through two different tracks is the case nothing owned, and it is the
 * case this file is for.
 *
 * ── WHY TITLES, AND WHY THAT IS NOT AS WEAK AS IT SOUNDS ──────────────────
 * These titles are not loosely similar; they are the same sentence. The four
 * installer rows agree for 58 characters. A spec's title in this product is
 * generated FROM the problem statement, so two specs about one problem tend to
 * converge on one sentence, and the normalisation below (case, punctuation,
 * articles, whitespace) closes the small gaps.
 *
 * It is deliberately a HIGH bar rather than a fuzzy one. A false positive here
 * attaches a person's new spec to somebody else's problem, which is worse than
 * a duplicate: the duplicate is visible and recoverable, the wrong attachment
 * quietly buries a real piece of work. So this matches near-identity and hands
 * anything less back as "no match", where the old behaviour -- write the spec --
 * still applies.
 *
 * Embedding similarity is the natural second pass and is NOT implemented here.
 * `prds.embedding` exists and is populated unevenly, and a threshold nobody has
 * measured against this corpus would be a number invented to look rigorous. The
 * seam takes candidates from the caller, so the day somebody measures a
 * threshold, they add candidates and every rule below still holds.
 */

/** What a caller already knows about a spec it might attach to. */
export type ExistingSpec = {
  readonly id: string;
  readonly title: string;
  /** draft | review | approved | shipped. Decides what attaching MEANS. */
  readonly status: string;
  /** Set when the spec's design gate closed because the spec stopped applying. */
  readonly designGateStatus?: string | null;
  /** When it shipped, if it did. Rendered in the sentence a person reads. */
  readonly shippedAt?: string | null;
};

/**
 * What to do about it. Never "delete" and never "silently reuse": each of these
 * is a thing a person can read on the transcript row and disagree with.
 */
export type SpecMatch =
  /**
   * The problem is already SOLVED. The new sentence lands on the shipped
   * spec's outcome rather than becoming a draft, because a re-entered solved
   * problem is a question about whether the fix worked, not a new piece of
   * work.
   */
  | { readonly kind: "shipped"; readonly spec: ExistingSpec }
  /** A live spec already says this; the track attaches to it. */
  | { readonly kind: "live"; readonly spec: ExistingSpec }
  /** Nothing says this yet. Write the spec, as before. */
  | { readonly kind: "none" };

/**
 * A spec that stopped applying is not a match.
 *
 * P-57b's migration closed the design gate of every superseded spec and
 * deliberately left `prds.status` alone, so a superseded spec still reads
 * `draft`. Attaching new work to one would attach it to a document the record
 * has already retired -- and 14 of Helio's 29 drafts are in exactly that
 * state, so this is the common case rather than the edge.
 */
export function stoppedApplying(spec: ExistingSpec): boolean {
  return spec.designGateStatus === "superseded";
}

const ARTICLES = new Set(["a", "an", "the"]);

/**
 * The comparable form of a title: lowercase, punctuation dropped, articles
 * dropped, whitespace collapsed.
 *
 * Articles go because "the red tile" and "red status tile" are the same
 * problem, and the two OTA groups in the measurement differ by exactly that
 * kind of word. Nothing else is stemmed: dropping more would start matching
 * problems that merely rhyme.
 */
export function comparableTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !ARTICLES.has(w))
    .join(" ");
}

/** How much of the shorter title the two share, as a fraction of its words. */
function overlap(a: string, b: string): number {
  const aw = a.split(" ").filter(Boolean);
  const bw = b.split(" ").filter(Boolean);
  if (aw.length === 0 || bw.length === 0) return 0;
  const bag = new Map<string, number>();
  for (const w of bw) bag.set(w, (bag.get(w) ?? 0) + 1);
  let shared = 0;
  for (const w of aw) {
    const left = bag.get(w) ?? 0;
    if (left > 0) {
      shared += 1;
      bag.set(w, left - 1);
    }
  }
  return shared / Math.min(aw.length, bw.length);
}

/**
 * The bar. 0.85 of the shorter title's words, and at least four words of
 * substance, so a two-word title cannot match on one shared word.
 *
 * Chosen against the measured corpus rather than picked for looking round: the
 * four installer rows and the three address rows clear it comfortably, the two
 * OTA phrasings clear it, and the distinct Relay problems in the same workspace
 * ("muting notifications", "abandon checkout on the address screen") do not
 * come close to each other.
 */
export const SAME_PROBLEM_OVERLAP = 0.85;
const MIN_WORDS = 4;

export function sameProblem(a: string, b: string): boolean {
  const ca = comparableTitle(a);
  const cb = comparableTitle(b);
  if (ca.length === 0 || cb.length === 0) return false;
  if (ca === cb) return true;
  const shortest = Math.min(ca.split(" ").length, cb.split(" ").length);
  if (shortest < MIN_WORDS) return false;
  return overlap(ca, cb) >= SAME_PROBLEM_OVERLAP;
}

const SHIPPED = new Set(["shipped", "approved"]);

/**
 * Which existing spec, if any, the incoming problem belongs to.
 *
 * A SHIPPED match wins over a live one even when the live one is a closer
 * string. The question "did the fix work?" is a different question from "should
 * we do this?", and answering the second when the record can answer the first
 * is how two copies of a solved problem end up on Waiting.
 */
export function findTheSpecThatAlreadySaysThis(
  incomingTitle: string,
  candidates: readonly ExistingSpec[],
): SpecMatch {
  const live: ExistingSpec[] = [];
  let shipped: ExistingSpec | null = null;

  for (const spec of candidates) {
    if (stoppedApplying(spec)) continue;
    if (!sameProblem(incomingTitle, spec.title)) continue;
    if (SHIPPED.has(spec.status)) {
      if (!shipped) shipped = spec;
      continue;
    }
    live.push(spec);
  }

  if (shipped) return { kind: "shipped", spec: shipped };
  if (live.length > 0) return { kind: "live", spec: live[0] };
  return { kind: "none" };
}

/**
 * The transcript line. Says WHICH spec and WHY, because a person who disagrees
 * needs to be able to find the thing it attached to and say so.
 */
export function whatDefineDidInstead(match: SpecMatch): string | null {
  switch (match.kind) {
    case "shipped":
      return `This problem is already solved: it shipped as "${match.spec.title}"${
        match.spec.shippedAt ? ` on ${match.spec.shippedAt.slice(0, 10)}` : ""
      }. Rather than writing another spec, this lands on that one's outcome, where Learn is measuring whether it worked.`;
    case "live":
      return `A spec already says this: "${match.spec.title}". This work attaches to it rather than becoming a second copy.`;
    case "none":
      return null;
  }
}
