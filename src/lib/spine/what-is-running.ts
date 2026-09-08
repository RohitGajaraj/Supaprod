/**
 * WHAT IS RUNNING, ASKED OF THE THING THAT RUNS.
 *
 * ── THE HEADER SAID "NOTHING RUNNING" TWICE WHILE SEATS WERE WORKING ─────
 * 2026-09-04, measured on the shipped Ship track:
 *
 *   06:13  the orchestrator was running          header: Nothing running
 *   06:44  the release seats were running        header: Nothing running
 *
 * P-18b had already fixed a version of this -- the dock and the bar disagreeing
 * -- by making both read one source. The source is the problem, not the count
 * of readers.
 *
 * ── THE SUBJECT WAS A MISSION, AND A MISSION IS NOT WHAT RUNS ────────────
 * `useLiveAgents` reads `listMissions`, keeps the ones whose stored status is a
 * working one, and then -- rightly, since that column goes stale -- confirms
 * each against `listMovingTracks`. Two hops, and both drop live seats:
 *
 *   A run with a MISSION AND NO TRACK is excluded by the confirmation, because
 *   `genuinelyWorkingMissions` cannot verify it and refuses to guess. That is
 *   the orchestrator at 06:13, and the refusal is correct on its own terms.
 *
 *   A run with a TRACK AND NO MISSION never enters the list at all, because the
 *   list is of missions. That is `release`, `release-verifier`, `data-analyst`
 *   and `insight-keeper` -- every seat the spine dispatches directly.
 *
 * Both halves of the roster are invisible, for opposite reasons, and no amount
 * of cross-checking a mission's status fixes either. `agent_runs` already
 * carries the fact: a row whose status is `running`, `queued` or `in_progress`
 * IS a seat working, whatever else it is or is not attached to.
 *
 * ── WAITING ON A PERSON IS NOT RUNNING ───────────────────────────────────
 * `waiting_approval` is deliberately excluded, on P-114's distinction: a run
 * parked at a gate is doing nothing and will do nothing until somebody acts.
 * Counting it would put the header back to claiming present-tense work over a
 * run nobody is touching -- which is the defect `genuinely-working.ts` was
 * written to end, and it stays ended.
 */

import { targetOf } from "@/lib/presence/collision";
import { verbForTool } from "@/lib/presence/character";

/** The statuses that mean a seat is actually working. */
export const RUNNING_NOW: ReadonlySet<string> = new Set(["running", "queued", "in_progress"]);

/**
 * WHAT THE SEAT IS DOING THIS SECOND, off its own tool calls.
 *
 * The founder's standard for this product is that the machine's work is SEEN:
 * which seat, on what, right now, with its own identity on screen. A seat's
 * slug and station say who and where; this says what, in the first person the
 * character already speaks ("reading the repository"), and names the thing it
 * has hold of when a call named one.
 */
export type RunningNow = {
  /** The newest call's tool slug, e.g. `repo.read`. */
  tool: string;
  /** The same call in the presence vocabulary: "reading the repository". */
  verb: string;
  /**
   * The thing the seat last NAMED: a file path, a spec id, a decision id.
   * Null when no call on this seat named anything yet -- a search, a list, a
   * create whose target does not exist until it returns. Never invented.
   */
  object: { kind: string; id: string } | null;
  /**
   * The object as a noun a presence slot can print beside the verb ("Reading
   * · AddressStep.tsx", "writing the spec · the spec"): a file's own name, a
   * record's kind in the product's words, at most forty characters. Null when
   * the call named nothing, so the slot stays empty rather than saying "the
   * record" over a search.
   */
  objectLabel: string | null;
  /** When the newest call happened. */
  at: string;
};

/** The words a presence slot uses for a record kind. Unknown kinds print as "the record". */
const OBJECT_WORDS: Readonly<Record<string, string>> = {
  "row:prd": "the spec",
  "row:decision": "the decision",
  "row:opportunity": "the bet",
  "row:theme": "the theme",
  "row:signal": "a finding",
  "row:mission": "the build",
  "row:changeset": "the change",
  "row:prototype": "the drawing",
  "row:task": "the task",
  "row:learning": "the outcome",
};

export function objectLabelOf(object: { kind: string; id: string } | null): string | null {
  if (!object) return null;
  if (object.kind === "file") {
    const name = object.id.split("/").filter(Boolean).pop() ?? object.id;
    return name.length > 40 ? `${name.slice(0, 39)}\u2026` : name;
  }
  return OBJECT_WORDS[object.kind] ?? "the record";
}

/** One seat, working, as much as the record can say about it. */
export type RunningSeat = {
  /** The run. Always present, which is why it is the identity here. */
  runId: string;
  /** The seat's slug, when the row carries one. */
  slug: string | null;
  /** The station its track is at, when it has a track. */
  station: string | null;
  /** Its track, when it has one. Null for a seat dispatched outside a track. */
  trackId: string | null;
  /** What the work is called: the track's title, or the mission's. */
  title: string | null;
  missionId: string | null;
  /**
   * The planner's own sentence for the step this mission is on.
   *
   * Carried because it is the difference between "Build is working" and "Build
   * is working on: add the read-only address card" -- and agent visibility is
   * the product's whole claim. Null for a seat with no mission, which is
   * honest: there is no planner sentence to show, and inventing one to fill the
   * slot is what this file's neighbours already forbid.
   */
  subGoal: string | null;
  startedAt: string | null;
  /**
   * The newest tool call on this seat, or null for a seat that has made none
   * the record can see (no trace yet, or a run that only just started).
   * Derived by `nowPerTrace` from the same rows the collision layer reads.
   */
  now: RunningNow | null;
};

/** The columns `nowPerTrace` reads off `tool_calls`. */
export type NowCallRow = {
  trace_id: string | null;
  tool_name: string;
  args: unknown;
  created_at: string;
};

/**
 * One `RunningNow` per trace, from calls in ANY order.
 *
 * ── THE VERB IS THE NEWEST CALL; THE OBJECT IS THE NEWEST CALL THAT NAMED ONE ──
 * The same two-row rule `getWorkspaceAnchors` settled on (2026-08-31, S2's
 * measurement: 1,983 of 2,271 calls name no target, and the ordinary shape is
 * `repo.read` on a file, then a search, then `studio.stage`). Taking only the
 * newest call would drop the file the moment the seat searched for something,
 * so a seat demonstrably working on `AddressStep.tsx` would be anchored for a
 * few seconds of a ninety-second run. The verb is what it is doing now; the
 * object is the last place we knew. A reader seeing "searching the repository"
 * over `AddressStep.tsx` is being told something true.
 */
export function nowPerTrace(calls: readonly NowCallRow[]): Map<string, RunningNow> {
  const newest = new Map<string, { tool: string; at: string }>();
  const named = new Map<string, { kind: string; id: string; at: string }>();
  for (const c of calls) {
    if (!c.trace_id) continue;
    const prev = newest.get(c.trace_id);
    if (!prev || c.created_at > prev.at)
      newest.set(c.trace_id, { tool: c.tool_name, at: c.created_at });
    const target = targetOf(c.args);
    if (target) {
      const prevNamed = named.get(c.trace_id);
      if (!prevNamed || c.created_at > prevNamed.at) {
        named.set(c.trace_id, { kind: target.targetKind, id: target.targetId, at: c.created_at });
      }
    }
  }
  const out = new Map<string, RunningNow>();
  for (const [trace, n] of newest) {
    const o = named.get(trace);
    const object = o ? { kind: o.kind, id: o.id } : null;
    out.set(trace, {
      tool: n.tool,
      verb: verbForTool(n.tool),
      object,
      objectLabel: objectLabelOf(object),
      at: n.at,
    });
  }
  return out;
}

export function isRunningNow(status: string | null | undefined): boolean {
  return RUNNING_NOW.has((status ?? "").trim());
}

/**
 * What a person reads about one working seat.
 *
 * NAMES THE SEAT AND THE STATION, which is what the header could not do before:
 * it knew a mission title and inferred the rest. Degrades a clause at a time
 * rather than falling back to a generic sentence -- a seat with no station is
 * still a seat working, and saying "an agent is working" when we know it is the
 * orchestrator is throwing away the fact that makes the line worth reading.
 */
export function workingLine(
  seat: RunningSeat,
  displayName: (slug: string) => string = (s) => s,
): string {
  const who = seat.slug ? displayName(seat.slug) : "An agent";
  const at = seat.station ? ` at ${seat.station}` : "";
  const on = seat.title?.trim() ? ` on ${seat.title.trim()}` : "";
  return `${who} is working${at}${on}.`;
}

/**
 * The one-line answer to "is anything happening", for a header.
 *
 * Says the COUNT past one rather than listing, because a header has one line
 * and a reader wants to know whether to look rather than what all of it is.
 */
export function runningHeadline(
  seats: readonly RunningSeat[],
  displayName: (slug: string) => string = (s) => s,
): string | null {
  if (seats.length === 0) return null;
  const lead = workingLine(seats[0]!, displayName);
  if (seats.length === 1) return lead;
  return `${lead.replace(/\.$/, "")}, and ${seats.length - 1} more.`;
}
