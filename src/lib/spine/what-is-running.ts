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

/** The statuses that mean a seat is actually working. */
export const RUNNING_NOW: ReadonlySet<string> = new Set(["running", "queued", "in_progress"]);

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
};

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
