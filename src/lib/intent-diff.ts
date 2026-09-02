/**
 * RPT-44 - Intent-vs-built diff receipt (pure core).
 *
 * After a Build run ships a changeset, this module compares the PRD's stated
 * intent (the standing success-metric texts of its Outcome Contract, or the
 * acceptance-criteria lines of its body when no contract exists) against what
 * the shipped changeset says it delivered (its release notes plus summary).
 *
 * The comparison is deterministic text overlap, nothing more. It answers "do
 * the words of this intent point show up in what shipped?", which is a signal
 * that a point was addressed. It is NOT a proof of correctness: a release note
 * can claim anything, and matching tokens can be coincidental. Every surface
 * that renders this receipt must say so. Keeping the logic pure means it is
 * fully unit-tested with no DB and reused by the server fn as-is.
 */

/** The minimal contract shape this module reads. Structural on purpose so the
 * pure core never imports the DB-bound discovery module at runtime. */
export type ContractLike =
  | {
      success_metrics?: Array<{ text?: string | null; status?: string | null } | null> | null;
    }
  | null
  | undefined;

/** The PRD's stated intent: a title and its standing success-metric texts. */
export type IntentPoints = { title: string; points: string[] };

/** What the shipped changeset says it delivered. */
export type BuiltText = { release_notes: string | null; summary: string | null };

/** One intent point graded against the built text. `checkable` is false when the
 * point has no gradeable words (an acronym or all-stopword line like "CI" or
 * "P0"): such a point is neither evidenced nor a miss, it just cannot be graded
 * by text overlap, so it is excluded from coverage rather than counted against it. */
export type ReceiptPoint = {
  text: string;
  evidenced: boolean;
  matched_terms: string[];
  checkable: boolean;
};

/** The honest receipt: per-point evidence, an overall coverage ratio, and a
 * label naming exactly what the evidence is (and is not). */
export type IntentReceipt = {
  points: ReceiptPoint[];
  coverage: number;
  evidence_basis: string;
};

/** Names the evidence for what it is: an overlap of words, not a correctness check. */
export const EVIDENCE_BASIS = "text-overlap with release notes";

// A salient token must be at least this long. Two-character tokens (as, to,
// id, 2s) carry too little signal to count as evidence.
const MIN_TOKEN_LEN = 3;

// A point counts as evidenced only when STRICTLY MORE than this share of its
// salient words appear in the built text. A strict majority is a deliberately
// honest bar: a two-word requirement like "export salesforce" must match BOTH,
// so one coincidental common word ("export") never reads as delivered.
const EVIDENCE_RATIO = 0.5;

// Common words with too little signal to count toward overlap. All entries are
// three or more characters (shorter tokens are already dropped by length).
const STOPWORDS = new Set<string>([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "your",
  "our",
  "its",
  "this",
  "that",
  "these",
  "those",
  "from",
  "into",
  "than",
  "then",
  "with",
  "was",
  "were",
  "has",
  "have",
  "had",
  "will",
  "shall",
  "can",
  "must",
  "should",
  "would",
  "could",
  "when",
  "where",
  "which",
  "who",
  "what",
  "how",
  "all",
  "any",
  "each",
  "per",
  "via",
]);

/** Lowercase and split on any non-alphanumeric run. Case-insensitive by
 * construction, so "CSV" and "csv" tokenize identically. */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** The set of matchable tokens in the built text (length-filtered only). */
function builtTokenSet(s: string): Set<string> {
  return new Set(tokenize(s).filter((t) => t.length >= MIN_TOKEN_LEN));
}

/** The distinct, meaningful words of an intent point, in first-seen order:
 * long enough and not a stopword. */
function salientTokens(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tokenize(text)) {
    if (t.length < MIN_TOKEN_LEN) continue;
    if (STOPWORDS.has(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function classifyPoint(text: string, corpus: Set<string>): ReceiptPoint {
  const salient = salientTokens(text);
  // No gradeable words (an acronym or all-stopword line): not checkable by text
  // overlap. Neither evidenced nor a miss, so it stays out of coverage.
  if (salient.length === 0) {
    return { text, evidenced: false, matched_terms: [], checkable: false };
  }
  const matched = salient.filter((t) => corpus.has(t));
  const ratio = matched.length / salient.length;
  // Strict majority: for a 2-word point both must match; for 3 words, 2 of 3.
  const evidenced = matched.length >= 1 && ratio > EVIDENCE_RATIO;
  return { text, evidenced, matched_terms: matched, checkable: true };
}

/**
 * Grade each intent point by how much of its wording appears in the built
 * text. Coverage is the share of CHECKABLE points that clear the evidence bar
 * (0 when there are no checkable points); un-gradeable points are excluded so a
 * bare acronym never counts as a miss. The result is a text-evidence
 * projection, labeled as such by evidence_basis. Never overclaims.
 */
export function buildIntentReceipt(intent: IntentPoints, built: BuiltText): IntentReceipt {
  const corpus = builtTokenSet(`${built.release_notes ?? ""} ${built.summary ?? ""}`);
  const points = intent.points.map((text) => classifyPoint(text, corpus));
  const checkable = points.filter((p) => p.checkable);
  const evidenced = checkable.filter((p) => p.evidenced).length;
  const coverage = checkable.length === 0 ? 0 : evidenced / checkable.length;
  return { points, coverage, evidence_basis: EVIDENCE_BASIS };
}

function dedupe(items: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

/** Strip a markdown list marker (bullet, numbered, or checkbox) off a line.
 * Returns the cleaned item text, or "" when the line is not a list item. */
function cleanListItem(line: string): string {
  const m = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
  if (!m) return "";
  return m[1]
    .trim()
    .replace(/^\[(?:\s|x|X)\]\s*/, "")
    .trim();
}

/**
 * Pull acceptance-criteria lines out of a markdown body when there is no
 * contract to read. Prefers list items under a heading that scopes acceptance
 * criteria or success metrics; falls back to every list item in the document.
 */
function extractAcceptanceCriteria(bodyMd: string): string[] {
  if (!bodyMd || !bodyMd.trim()) return [];
  const lines = bodyMd.split(/\r?\n/);
  const headingRe = /^#{1,6}\s+(.*)$/;
  const scopeRe =
    /(acceptance criteria|acceptance|success metric|success criteria|requirements|definition of done|exit criteria|what good looks like)/i;
  // Sections that state what is NOT being built. A bullet here is the opposite
  // of an intent point, so grading it (and worse, green-checking it) would
  // assert the spec delivered something it explicitly excluded.
  const excludeRe = /(non-?goal|out of scope|out-of-scope|will not|won'?t|risk|open question)/i;

  const scoped: string[] = [];
  const fallback: string[] = [];
  let inScope = false;
  let excluded = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(headingRe);
    if (heading) {
      inScope = scopeRe.test(heading[1]);
      excluded = excludeRe.test(heading[1]);
      continue;
    }
    const item = cleanListItem(line);
    if (!item) continue;
    if (inScope && !excluded) scoped.push(item);
    // The document-wide fallback collects every list item EXCEPT those under an
    // excluded heading, so a non-goal is never mistaken for an intent point.
    if (!excluded) fallback.push(item);
  }
  if (scoped.length > 0) return dedupe(scoped).slice(0, 20);
  return dedupe(fallback).slice(0, 20);
}

/**
 * Derive the intent points to grade against. Prefers the standing
 * success-metric texts of the Outcome Contract (superseded clauses are
 * dropped). When there is no contract, or none of its metrics are standing,
 * falls back to the acceptance-criteria lines of the body markdown.
 */
export function extractIntentPoints(contract: ContractLike, bodyMd: string): string[] {
  return intentPointsWithSource(contract, bodyMd).points;
}

/**
 * THE SAME LINES, AND WHERE THEY CAME FROM.
 *
 * `extractIntentPoints` answers "what do we grade against". Build's verdict
 * needs one more fact from the same walk: WHICH of the two sources answered,
 * because the three outcomes are three different things to say to a person.
 *
 *   contract   the author wrote success metrics and we are using their words
 *   body       no metrics on the row, so these are the acceptance-criteria
 *              lines read out of the document, which is a weaker claim
 *   none       the spec says nothing about what done means
 *
 * Measured on this database: contract 2 of 119, body 94 of the remaining 117.
 * So `body` is the ordinary case and a surface that reported it as "no contract"
 * would be calling the normal state a failure.
 *
 * Split out rather than duplicated: two functions deriving these lines
 * separately is how Build and Learn would come to grade against different
 * readings of one spec, and the point of reusing this is that they cannot.
 */
export function intentPointsWithSource(
  contract: ContractLike,
  bodyMd: string,
): { points: string[]; source: "contract" | "body" | "none" } {
  const metrics = contract?.success_metrics ?? [];
  const standing = (metrics ?? [])
    .filter((m): m is { text?: string | null; status?: string | null } => !!m)
    .filter((m) => (m.status ?? "standing") !== "superseded")
    .map((m) => (typeof m.text === "string" ? m.text.trim() : ""))
    .filter((t) => t.length > 0);
  const deduped = dedupe(standing);
  if (deduped.length > 0) return { points: deduped.slice(0, 20), source: "contract" };
  const fromBody = extractAcceptanceCriteria(bodyMd ?? "");
  return { points: fromBody, source: fromBody.length > 0 ? "body" : "none" };
}
