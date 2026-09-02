/**
 * `findAnything`: the shapes and the pure rules, kept apart from the I/O.
 *
 * WHY THIS IS ITS OWN FILE, AND NOT INLINE IN `track.functions.ts` (P-25,
 * A-QUEUE.md). The same split `chain.ts` already draws from
 * `track.functions.ts`: this module orders and states, it does no I/O, so the
 * word-matching rule and the run-state word are tested without a database.
 * The server function itself -- the six reads, the workspace scoping through
 * RLS -- lives in `track.functions.ts` per this packet's own Files line,
 * imports these two exports, and does nothing this file could also decide.
 */

/** The six artifact kinds `findAnything` searches, beyond the run itself. */
export const SEARCH_KINDS = [
  "prd",
  "decision",
  "prototype",
  "changeset",
  "signal",
  "theme",
] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export type FoundRun = { id: string; title: string; state: string };

export type FoundArtifact = {
  kind: SearchKind;
  id: string;
  title: string;
  /** The run this artifact belongs to. Names it, per this packet's own
   *  scope: "each artifact result names its run and opens
   *  /track/<run>?artifact=<id>". */
  trackId: string;
  trackTitle: string;
};

export type FindAnythingResult = {
  runs: FoundRun[];
  prd: FoundArtifact[];
  decision: FoundArtifact[];
  prototype: FoundArtifact[];
  changeset: FoundArtifact[];
  /** Signal ("finding") and theme ("cluster") rows, merged into the one
   *  group the packet names -- "Findings and themes" -- and capped at 8
   *  combined, not 8 each. */
  findings: FoundArtifact[];
};

export const EMPTY_RESULT: FindAnythingResult = {
  runs: [],
  prd: [],
  decision: [],
  prototype: [],
  changeset: [],
  findings: [],
};

/**
 * Case-insensitively, every word present, in any order.
 *
 * "ilike per word, no embeddings" (this packet's own scope). Pure so the rule
 * is provable without standing up Supabase: a caller builds one `.ilike()`
 * per word returned here and the database ANDs them.
 */
export function searchWords(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * A track's own coarse state, for a search result's badge.
 *
 * DELIBERATELY COARSER THAN `YourRuns`'s OWN `StartRowKind`. That one also
 * reads live seat presence and open gates (`kindOf` in `tracks-feed.ts`) to
 * tell "needs you" from "running" precisely, which costs a second read this
 * packet's own scope does not ask a search hit to carry -- "Runs (title,
 * state)" is the whole of what a result row owes. `waiting-on-a-person` is
 * the one `last_hold` this can say without that second read: it is the hold
 * whose own line (`HOLD_LINE`, `driver.ts`) says a call is in front of a
 * person, which is exactly the state a person searching would want named.
 */
export function runStateWord(status: string, lastHold: string | null): string {
  if (status === "done") return "Finished";
  if (status === "abandoned") return "Abandoned";
  if (lastHold === "waiting-on-a-person") return "Needs you";
  return "Running";
}

/** Display words for each group header, exactly as this packet's own scope
 *  names them -- "Pull requests" and "Findings and themes", not
 *  `KIND_WORD`'s sentence-composition words ("code change", "cluster"). Two
 *  different vocabularies for two different jobs: `KIND_WORD` feeds a
 *  sentence a track's own chain composes about itself; this is a rail
 *  search's own group heading, specified verbatim in the packet. */
export const GROUP_LABEL: Record<keyof FindAnythingResult, string> = {
  runs: "Runs",
  prd: "Specs",
  decision: "Decisions",
  prototype: "Prototypes",
  changeset: "Pull requests",
  findings: "Findings and themes",
};
