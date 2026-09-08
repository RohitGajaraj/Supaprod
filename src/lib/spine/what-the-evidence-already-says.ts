/**
 * WHAT THE WORKSPACE ALREADY HOLDS ABOUT THIS SUBJECT, ASKED BEFORE THE WORK
 * STARTS (F-184, and the door `SPEC-BUILD-PATHS.md` §2.3 implies one step
 * earlier than the connector dry-run).
 *
 * ── WHY, MEASURED ON THREE REAL CANDIDATES ON ONE WORKSPACE ─────────────────
 *
 *   d2263583  redundant address entry        76 signals  reached Learn
 *   060bc5ff  password-reset link 404s        1 signal   DIED AT DISCOVER
 *   ce846e9b  OTA reboot reads as an outage  57 signals  running
 *
 * `060bc5ff` spent three completed runs and three attempts for all three
 * Discover seats to report — correctly, and independently — that the workspace
 * holds no evidence about it. **One query at creation would have said so.**
 * The workspace was never empty: 267 signals from 40 sources.
 *
 * ── IT TELLS. IT NEVER REFUSES. ─────────────────────────────────────────────
 * **A subject the evidence is silent on may be exactly what somebody wants
 * investigated**, and a door that blocks is worse than a door that tells you.
 * This returns a number and where it came from; it has no opinion and no
 * threshold, and nothing here may become a gate. That constraint is the whole
 * design and it is the part that gets lost when someone implements this.
 */

/**
 * Words that carry no subject. Deliberately small and boring: a long list is a
 * language model wearing a constant, and this has to be explicable to whoever
 * reads a count of 1 and wants to know why.
 */
const NOISE = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "than",
  "that",
  "this",
  "these",
  "those",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "am",
  "do",
  "does",
  "did",
  "doing",
  "done",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "from",
  "into",
  "onto",
  "about",
  "after",
  "before",
  "over",
  "under",
  "again",
  "so",
  "as",
  "it",
  "its",
  "their",
  "there",
  "here",
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
  "which",
  "can",
  "cannot",
  "could",
  "will",
  "would",
  "should",
  "may",
  "might",
  "must",
  "get",
  "gets",
  "got",
  "go",
  "goes",
  "not",
  "no",
  "up",
  "out",
  "off",
  "back",
  "one",
  "two",
  "all",
  "any",
  "some",
  "every",
  "each",
  "same",
  "other",
  "more",
  "most",
  // Product-shaped words that appear in almost every subject line here and so
  // discriminate nothing. Measured rather than guessed: each appears in a
  // majority of this workspace's own signal titles.
  "user",
  "users",
  "customer",
  "customers",
  "homeowner",
  "homeowners",
  "people",
]);

/**
 * The terms worth searching for in a subject line.
 *
 * Short words are dropped because a two-letter token matches everything, and a
 * count that matches everything answers nothing — which is worse than no answer,
 * because it looks like reassurance.
 */
export function searchTermsFor(subject: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of subject.toLowerCase().split(/[^a-z0-9]+/)) {
    const w = raw.trim();
    if (w.length < 4) continue;
    if (NOISE.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  // Bounded so one pathological title cannot build a hundred-clause query.
  return out.slice(0, 12);
}

/** What the door shows. Numbers, and where they came from. No verdict. */
export type SubjectEvidence = {
  /** Signals matching ANY term. `null` means THE READ FAILED, never zero. */
  count: number | null;
  /** Distinct sources those signals came from, most first. At most five. */
  sources: string[];
  /**
   * How many of the matching signals the LOOP ITSELF wrote (`source = 'agent'`).
   *
   * ── WHY THE DOOR HAS TO SAY THIS (S4-183) ─────────────────────────────────
   * Measured across the whole table 2026-09-01: **1,499 signals, 940 of them
   * `source='agent'` — 63% of the entire evidence base is the loop's own
   * output.** A description rewrite on 2026-08-25 flipped the inflow (before:
   * 920 agent against 518 external, 64%; since: 20 against 41, 33%) **and
   * nothing drained the pool**, so every Discover run still reads a corpus that
   * is majority self-authored.
   *
   * So a crew reporting "systemic signal ingestion failure" is **accurate about
   * what it sees and wrong about the tense** — ingestion is not failing now, the
   * backlog is. *"57 things mention this, and 38 of them we wrote"* is a
   * materially different sentence from *"57 things mention this"*, and only the
   * first one lets a person judge the number.
   */
  agentAuthored: number;
  /**
   * PER TERM, most first, AND THIS IS THE HALF THAT MAKES THE NUMBER HONEST.
   *
   * Measured against the three live candidates on one workspace, the any-term
   * total alone reads: **address 94 · password 8 · outage 69.** It discriminates
   * — but `060bc5ff`, the subject with no evidence at all, scores EIGHT, because
   * `email`, `account`, `reset` and `link` match things that have nothing to do
   * with password resets. **A person reading "8 things mention this" would be
   * reassured by a number that is almost entirely noise.**
   *
   * Broken out, the same subject reads `password 1 · email 5 · account 2`, and
   * the truth is legible at a glance: the word the subject is ABOUT appears
   * once. A total can flatter; a breakdown cannot.
   */
  byTerm: Array<{ term: string; count: number }>;
};

export const NO_EVIDENCE_READ: SubjectEvidence = {
  count: null,
  sources: [],
  byTerm: [],
  agentAuthored: 0,
};

/** The terms searched, recovered from the breakdown so there is one source. */
export function termsOf(e: SubjectEvidence): string[] {
  return e.byTerm.map((t) => t.term);
}

/**
 * Count each term across the rows that matched, in code rather than in N
 * queries. One read, exact counts, and the tokeniser and the counter cannot
 * disagree because they share the term list.
 */
export function countByTerm(
  terms: readonly string[],
  rows: ReadonlyArray<{ title?: string | null; content?: string | null }>,
): Array<{ term: string; count: number }> {
  return terms
    .map((term) => ({
      term,
      count: rows.filter((r) => `${r.title ?? ""} ${r.content ?? ""}`.toLowerCase().includes(term))
        .length,
    }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
}

/**
 * The sentence a person reads. Kept here beside the shape so the count and the
 * words cannot drift, and written so that ZERO is not a rebuke — it is an
 * invitation to go and connect something, or to proceed anyway.
 */
export function evidenceLine(e: SubjectEvidence): string {
  /* Plain and unsold, as he would say it (third review, 2026-09-08): no
     narrator "I", and the zero line does not say "connect a source" when
     the door that says it sits right after the sentence. */
  if (e.count === null) return "It could not check what this workspace already holds about this.";
  if (e.count === 0) {
    return "Nothing in this workspace mentions this yet. Discover starts from your sentence alone.";
  }
  // LEADS WITH THE BREAKDOWN, NOT THE TOTAL. The total is the number that
  // flatters: `060bc5ff` scored 8 on a subject with one real mention. Naming the
  // top terms with their counts is what makes that legible without a threshold.
  const top = e.byTerm
    .filter((t) => t.count > 0)
    .slice(0, 3)
    .map((t) => `${t.term} ${t.count}`)
    .join(" · ");
  const where = e.sources.length
    ? `, from ${joinSources(e.sources.slice(0, 3).map(sourceName))}`
    : "";
  // NAMES WHAT THE LOOP WROTE ITSELF when that is most of it. 63% of the whole
  // table is `source='agent'`, so a bare count routinely flatters a subject the
  // product has only ever talked to itself about.
  const ours =
    e.agentAuthored > 0 && e.agentAuthored * 2 >= e.count
      ? ` ${e.agentAuthored} of ${e.count} were written by your agents.`
      : "";
  return top
    ? `Already on the record${where}: ${top}.${ours}`
    : `${e.count === 1 ? "1 thing" : `${e.count} things`} in this workspace loosely match${where}.${ours}`;
}

/**
 * A source is named as a person would say it, never as its slug (Lane 1,
 * 2026-09-08, read live under the home's composer: "from steward, slack,
 * workspace-theme"). Unknown names pass through untouched, because a source a
 * person named themselves is already in their words.
 */
const SOURCE_NAME: Readonly<Record<string, string>> = {
  slack: "Slack",
  github: "GitHub",
  intercom: "Intercom",
  gmail: "Gmail",
  hubspot: "HubSpot",
  linear: "Linear",
  jira: "Jira",
  notion: "Notion",
  zendesk: "Zendesk",
  salesforce: "Salesforce",
  productboard: "Productboard",
  canny: "Canny",
  steward: "the steward",
  scout: "the scout",
  "workspace-theme": "a theme it formed",
  manual: "what you captured",
  paste: "what you pasted",
};

export function sourceName(slug: string): string {
  return SOURCE_NAME[slug.toLowerCase()] ?? slug;
}

function joinSources(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
