/**
 * WHICH OF THE STOPPED THINGS IS WORTH A PERSON'S NEXT TEN MINUTES.
 *
 * ── WHAT THE LIST WAS ─────────────────────────────────────────────────────
 * Helio's Waiting page, 16:37 IST 2026-09-04: below the one card that moves,
 * 53 stopped items in a flat list, oldest first, from "Helio prefers concise
 * release notes, stopped 50 days" down to "Mission completed: Checkout asks
 * for already-saved delivery address, stopped 5 hours". Every row an Open
 * press. The heading above them read "The oldest has been stopped for 50
 * days", which is true and tells a person nothing they can act on.
 *
 * A person arriving after lunch cannot tell which row is theirs, which is a
 * seed, and which one is holding a live track. Sorting by age does not answer
 * any of those, because age is not what decides whether to act -- what the row
 * is HOLDING is.
 *
 * ── THE COMPOSITION, MEASURED, AND WHY IT IS NOT WHAT WAS ASSUMED ─────────
 * The packet that asked for this said fifty of the rows were the demo's
 * furniture. They are not. Measured across every family the queue reads:
 *
 *   SPEC      prds draft/review ........ 29    seeded id  1
 *   DESIGN    prds design gate ......... 20    seeded id  5
 *   CHALLENGE assumption_challenges .... 11    seeded id  0
 *   GATE      agent_approvals ........... 3    seeded id  3
 *   MEMORY    memory_candidates ......... 2    seeded id  2
 *
 * Eleven rows carry a seeded id. The rest is the founder's OWN work -- four
 * near-duplicate rows about installers' panels between 08-18 and 08-21, three
 * about Relay checkout, two about muted notifications. `is_sample` is FALSE on
 * every pending row in the workspace, and four of the source tables do not
 * have the column at all, so a fold keyed on it would hide exactly none of
 * these. The list is not cluttered with somebody else's demo; it is cluttered
 * with a person's own unfinished thinking, and that is a harder thing to say
 * and the true one.
 *
 * ── SO THE GROUPING IS BY WHAT IS AT STAKE, NOT BY AGE ────────────────────
 * Holding live work first, because that is the only group where answering
 * changes what happens next. Then this week, because it is probably still in
 * the person's head. Then older. Demo rows last and never interleaved: they
 * are the one class that is nobody's decision.
 *
 * ── WHY `null` NEVER COUNTS AS HOLDING LIVE WORK, AND NEVER AS NOT ────────
 * `gatesLiveWork` is three-valued by design (F-128): true, false, and null for
 * "we could not tell". Only a tool-call gate can carry a meaningful value; a
 * spec, a challenge or a memory is not held open by a run, so those are null
 * by construction rather than by failure. Promoting null into the first group
 * would fill it with rows that hold nothing, and the group would stop meaning
 * anything within a day. Demoting it to "we checked and it is dead" would be a
 * claim nothing measured. So null simply does not qualify, and no surface says
 * it was checked.
 */

/**
 * Whether a row is seeded demo data, decided from its id.
 *
 * Every seeded row in this database begins `60000000-`. That is not a guess:
 * `components/governance/incident-format.ts` documents the same fact from the
 * other direction -- all seven incidents in the Engine room once rendered the
 * identical tag `INC.600000` precisely because every seeded id shares that
 * prefix.
 *
 * It is a convention rather than a column, and it is used here only because the
 * column that ought to answer this does not. MEASURED 2026-09-04: `is_sample`
 * is false on every pending row in the workspace, and four of the six source
 * tables the queue reads do not have the column at all. When the flag becomes
 * real this function is the one place that changes.
 */
export function looksSeeded(id: string): boolean {
  return id.startsWith("60000000-");
}

/** The four places a stopped row can land, in the order a reader meets them. */
export type StoppedGroup = "holding-live-work" | "this-week" | "older" | "demo";

/** One stopped row, as much of it as the grouping needs to decide. */
export type StoppedRow = {
  readonly id: string;
  /** Epoch ms it stopped. */
  readonly since: number;
  /** What the row is: a spec, a decision, a mission, a memory. */
  readonly kind: string;
  /**
   * Whether the work this gate holds is still going. Three-valued on purpose;
   * see the header. Only `true` puts a row in the first group.
   */
  readonly gatesLiveWork: boolean | null;
  /**
   * Whether this row is the demo's furniture. Decided by the CALLER, not here:
   * how demo-ness is known is a property of the data (a seeded id today, an
   * `is_sample` column on the three tables that have one) and it is going to
   * change. Keeping the question out of this file means the day it changes,
   * one caller changes and every rule below still holds.
   */
  readonly isDemo: boolean;
};

const DAY = 86_400_000;
export const THIS_WEEK_MS = 7 * DAY;

/**
 * Which group one row belongs to. Demo is checked FIRST and unconditionally:
 * a seeded row that happens to hold a live run is still not a person's
 * decision to make, and letting it into the top group would put furniture
 * above the founder's own work, which is the one thing the packet's guard
 * forbids.
 */
export function groupOf(row: StoppedRow, now: number): StoppedGroup {
  if (row.isDemo) return "demo";
  if (row.gatesLiveWork === true) return "holding-live-work";
  return now - row.since <= THIS_WEEK_MS ? "this-week" : "older";
}

export type GroupedStopped<T extends StoppedRow> = {
  readonly holdingLiveWork: readonly T[];
  readonly thisWeek: readonly T[];
  readonly older: readonly T[];
  readonly demo: readonly T[];
};

/**
 * The whole list, grouped, each group oldest-first within itself.
 *
 * Oldest-first survives inside a group because within one stake the age IS the
 * tiebreak -- it just was never the right thing to sort the WHOLE list by.
 */
export function groupStopped<T extends StoppedRow>(
  rows: readonly T[],
  now: number,
): GroupedStopped<T> {
  const buckets: { [K in StoppedGroup]: T[] } = {
    "holding-live-work": [],
    "this-week": [],
    older: [],
    demo: [],
  };
  for (const row of rows) buckets[groupOf(row, now)].push(row);
  for (const key of Object.keys(buckets) as StoppedGroup[]) {
    buckets[key].sort((a, b) => a.since - b.since);
  }
  return {
    holdingLiveWork: buckets["holding-live-work"],
    thisWeek: buckets["this-week"],
    older: buckets.older,
    demo: buckets.demo,
  };
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * The heading, which says the thing that decides whether to act rather than
 * the thing that is easiest to compute.
 *
 * It replaces "The oldest has been stopped for 50 days" -- true, and useless,
 * because the oldest thing on that list was a note about release-note style
 * and nothing was waiting on it.
 *
 * The demo count is deliberately NOT in this sentence. It is not work, so
 * putting it in the headline would inflate the number a person reads as their
 * obligation, which is the defect P-56 fixed one page higher.
 */
export function stoppedHeading(groups: GroupedStopped<StoppedRow>): string {
  const live = groups.holdingLiveWork.length;
  const week = groups.thisWeek.length;
  const older = groups.older.length;

  if (live > 0) {
    const head = `${plural(live, "stopped item is", "stopped items are")} holding live work`;
    if (week > 0) return `${head}; ${week} more stopped this week.`;
    if (older > 0) return `${head}; ${plural(older, "other has", "others have")} been stopped longer.`;
    return `${head}.`;
  }
  if (week > 0) {
    const head = `Nothing stopped is holding live work; ${plural(week, "item", "items")} stopped this week`;
    return older > 0 ? `${head}, and ${older} older.` : `${head}.`;
  }
  if (older > 0) {
    return `Nothing stopped is holding live work; ${plural(older, "item has", "items have")} been stopped longer than a week.`;
  }
  return groups.demo.length > 0
    ? "Nothing of yours is stopped."
    : "Nothing is stopped.";
}

/** The one line that folds the demo rows away. Says the true number. */
export function demoFoldLine(count: number): string {
  return `${plural(count, "sample item", "sample items")} from the demo`;
}

/**
 * What a row IS, in the product's words. A person scanning a list needs to
 * know whether they are looking at a spec or a memory before they can judge
 * whether to open it, and the kind key is our vocabulary rather than theirs.
 */
const WHAT_IT_IS: Record<string, string> = {
  SPEC: "a spec",
  DESIGN: "a design gate",
  GATE: "a tool call",
  MEMORY: "a memory",
  CHALLENGE: "a challenged assumption",
  PLAYBOOK: "a playbook",
  PROPOSAL: "a proposal",
  TRUST: "a trust change",
};

export function whatItIs(kind: string): string {
  return WHAT_IT_IS[kind] ?? "an item";
}

/**
 * What would unblock it, in one line, and never a guess. A row whose kind we
 * do not recognise says so plainly rather than inventing a verb: telling
 * somebody to "approve" a thing that has no approve press is worse than
 * telling them nothing.
 */
const WHAT_UNBLOCKS: Record<string, string> = {
  SPEC: "your approval",
  DESIGN: "your decision on the design",
  GATE: "your answer to the call",
  MEMORY: "your yes or no on remembering it",
  CHALLENGE: "your ruling on the challenge",
  PLAYBOOK: "your approval",
  PROPOSAL: "your approval",
  TRUST: "your approval",
};

export function whatUnblocksIt(kind: string): string | null {
  return WHAT_UNBLOCKS[kind] ?? null;
}
