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
import { PRIMARY_NAV, type NavItemDef } from "@/lib/nav-model";

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

/** A door result: `nav-model.ts`'s own shape, unchanged. Matched on the
 *  door's label and tagline, both already the person's own words. */
export type FoundDoor = NavItemDef;

/** `sync_mappings` carries no per-document title (P-64: found while building
 *  this group -- each row is a connector mapping, not a document, and Sync's
 *  own page already displays the provider name, not one). So a source result
 *  names the connector, the only human word this table actually holds. */
export type FoundSource = { id: string; provider: string; label: string };

export type FoundConversation = { id: string; title: string };

export type FoundPerson = { userId: string; displayName: string | null; email: string | null };

export type FindAnythingResult = {
  /** P-64: the nine doors, searched by their own label and tagline. Pure --
   *  no I/O, `searchDoors` below -- and returned by the server function
   *  anyway (not computed client-side) so this one type stays the whole
   *  contract `FindAnything.tsx` renders from. */
  doors: FoundDoor[];
  runs: FoundRun[];
  prd: FoundArtifact[];
  decision: FoundArtifact[];
  prototype: FoundArtifact[];
  changeset: FoundArtifact[];
  /** Signal ("finding") and theme ("cluster") rows, merged into the one
   *  group the packet names -- "Findings and themes" -- and capped at 8
   *  combined, not 8 each. */
  findings: FoundArtifact[];
  /** P-64. */
  sources: FoundSource[];
  /** P-64. */
  conversations: FoundConversation[];
  /** P-64. */
  people: FoundPerson[];
};

export const EMPTY_RESULT: FindAnythingResult = {
  doors: [],
  runs: [],
  prd: [],
  decision: [],
  prototype: [],
  changeset: [],
  findings: [],
  sources: [],
  conversations: [],
  people: [],
};

/**
 * P-64: the nine doors, searched the same word-matching way as everything
 * else this file matches, against the words a person actually reads on the
 * rail -- the label and the tagline, never the route path or the zone.
 * Pure, so it is provable without a database exactly like `searchWords`
 * above; `findAnything`'s handler calls it with the same `words` split every
 * other group already computed.
 */
/**
 * P-79: a named SECTION of a door, not a door of its own -- "Spend and
 * limits" is Team's own tab (`/crew?tab=spend`), not a tenth rail entry, so
 * it does not belong in `PRIMARY_NAV` and does not answer to the founder's
 * one-word rail rule (`the-rail-says-words-a-person-would-say.test.ts`),
 * which governs the RAIL's own labels and nothing outside it. Searched
 * alongside the nine doors because it is still a real navigation target, and
 * the packet's own acceptance line is explicit: "Find Anything's doors group
 * lists Spend and limits under Team."
 */
const SUB_DOORS: readonly NavItemDef[] = [
  {
    to: "/crew",
    label: "Spend and limits",
    zone: "home",
    tagline:
      "What the crew is costing this week, the caps, the costliest model, and what has failed.",
    search: { tab: "spend" },
  },
  /*
   * THE BOUNDARY, 2026-09-09 (fifth review). Settings' Autonomy group folded
   * into Team, so the words a person types when they want to change what an
   * agent may do without asking no longer resolve on the settings surface at
   * all -- `searchSections` reads the settings groups and those two sections
   * are gone. Without this entry the fold would have removed a door and its
   * search hit in the same commit, which is this repo's most expensive defect.
   * The tagline carries the real words the pane's panels answer to: the tools,
   * the spend ceiling, the budget caps, what must be approved, and the stop.
   */
  {
    to: "/crew",
    label: "The boundary",
    zone: "home",
    tagline:
      "Every tool the crew may use, the spend ceiling, the budget caps, what it must ask you to approve, and the switch that stops all of it.",
    search: { tab: "boundary" },
  },
];

/** Every door search actually reaches: the nine rail doors plus any named
 *  section, in that order, so the rail's own doors are found first. */
export const SEARCHABLE_DOORS: readonly NavItemDef[] = [...PRIMARY_NAV, ...SUB_DOORS];

export function searchDoors(
  words: readonly string[],
  doors: readonly NavItemDef[] = SEARCHABLE_DOORS,
): FoundDoor[] {
  if (words.length === 0) return [];
  return doors.filter((d) => {
    const hay = `${d.label} ${d.tagline}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

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
  doors: "Go to",
  runs: "Runs",
  prd: "Specs",
  decision: "Decisions",
  prototype: "Prototypes",
  changeset: "Pull requests",
  findings: "Findings and themes",
  sources: "Sources",
  conversations: "Conversations",
  people: "People",
};
