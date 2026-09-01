/**
 * WHAT CAME OF A STATION, in one line, from what actually ran there.
 *
 * ── THE FIELD WAS DESIGNED AND NEVER FILLED (2026-09-02) ───────────────────
 * `RunMapStation.outcome` has carried this docstring since it was written:
 * *"WHAT CAME OF THIS STATION, in outcome words a reader would use. 'Read
 * Intercom and PostHog for verify-step drop-off', never `web.search`."*
 * Nothing ever set it. `run-position.ts` builds every stop without it, so
 * `noteFor` in `run-strip-spec.ts` returned the waived reason or an empty
 * string, and every stage on both the run map and the run strip was wordless.
 *
 * Founder, on keeping the strip only inside a run: *"it should do more and take
 * less."* The taking-less shipped first. This is the doing-more.
 *
 * ── WHY THIS SAYS WHAT RAN AND NOT WHAT WAS PRODUCED ───────────────────────
 * The docstring's own example promises the artifact, and the artifact is not
 * reachable. Checked against production: exactly five tables carry `track_id`
 * (`agent_messages`, `agent_runs`, `spine_track_members`, `track_drives`,
 * `track_hold_notices`) and not one of them is a spec, a decision, a design or
 * a changeset. Artifacts are linked through a mission or named inside an
 * agent's prose output, so "the spec it wrote" cannot be resolved from a track
 * id today without guessing, and a guessed artifact on an audit surface is
 * worse than an empty line.
 *
 * What IS reachable, and is true without inference: `agent_runs` carries
 * `track_id`, `agent_slug` and `status`, and `agentStation(slug)` maps the
 * agent to its station. So the honest sentence is how many TURNS were taken at
 * the station and how they came out. That is a fact about the run, in the reader's
 * words, and it never claims a product that may not exist.
 *
 * ── THE WORDS ARE THE REPO'S OWN, NOT NEW ONES ─────────────────────────────
 * `completed_with_failures` is rendered as *"finished, with failures"* by
 * `AskRunCard.tsx:78`, which exists precisely because the raw value "is the
 * engine talking". This file reuses that phrasing rather than inventing a
 * second plain-English form of one status, because two wordings of one state
 * is how a product comes to describe itself differently on two screens.
 *
 * ── AND IT NEVER REPEATS THE STATE ─────────────────────────────────────────
 * `RunStage.note`'s contract is explicit: *"Never a status word the state
 * already carries."* The stage's own state drives the dot and the ink, so this
 * never writes "running", "done", "held" or "waiting on you". It counts, and
 * it says how the counting came out.
 */
import { agentStation } from "@/lib/agent-vocabulary";
import type { AgentStation } from "@/lib/agent-vocabulary";

/** One `agent_runs` row, narrowed to what an outcome needs. */
export type StationRun = {
  agent_slug: string | null;
  status: string | null;
};

/**
 * The five values `agent_runs.status` actually holds, measured on production
 * 2026-09-02: completed 1298, completed_with_failures 1040, failed 596,
 * halted 18, waiting_approval 9.
 *
 * `waiting_approval` is deliberately NOT counted as trouble. A run waiting on a
 * person has not gone wrong -- it is the one state the product exists to
 * surface, the stage's own state already carries it in `--mrd-you`, and
 * counting it as a failure would paint an ordinary gate as a fault.
 */
function wentWrong(status: string | null): boolean {
  return status === "completed_with_failures" || status === "failed" || status === "halted";
}

/** Did every run at this station go wrong? */
function allWentWrong(runs: readonly StationRun[]): boolean {
  return runs.length > 0 && runs.every((r) => wentWrong(r.status));
}

/**
 * Group a track's runs by the station their agent serves.
 *
 * A slug with no station mapping is DROPPED rather than bucketed somewhere.
 * `agentStation` returns undefined for an agent that is not on the roster --
 * a delegate, a one-off, a slug that has since been renamed -- and filing it
 * under a station it does not serve would put a number on a stage that never
 * ran it.
 */
export function runsByStation(
  runs: readonly StationRun[],
): Partial<Record<AgentStation, StationRun[]>> {
  const out: Partial<Record<AgentStation, StationRun[]>> = {};
  for (const run of runs) {
    if (!run.agent_slug) continue;
    const station = agentStation(run.agent_slug);
    if (!station) continue;
    (out[station] ??= []).push(run);
  }
  return out;
}

/**
 * The line for one station, or "" when there is nothing true to say.
 *
 * An empty string is a real answer here and the common one: a station that has
 * not been reached yet has no runs, and the stage renders no note at all. The
 * alternative -- "0 turns" -- is a number standing in for an absence, which is
 * the defect this whole pass has been removing.
 */
export function stationOutcome(runs: readonly StationRun[] | undefined): string {
  if (!runs || runs.length === 0) return "";
  const n = runs.length;
  /*
   * "TURNS", NOT "AGENTS", AND THE FIRST DRAFT OF THIS SHIPPED THE WRONG WORD.
   * Rendered on run ce846e9b it read "18 agents finished" at Build. There are
   * not 18 agents there: `builder` ran nine times and `qa` ran nine times, and
   * the count is of ROWS in `agent_runs`, which are invocations. Verified
   * against the query, which is the only reason it was caught -- "18 agents"
   * is entirely plausible on a screen.
   *
   * "Turn" is the word this repo already uses for one agent invocation inside a
   * run: LiveWork says "3 of 26 turns on this run wrote down what they called".
   * "Runs" was the other candidate and is worse here, because the page calls
   * the whole track a run and the note sits on that page.
   */
  const turns = n === 1 ? "1 turn" : `${n} turns`;
  const bad = runs.filter((r) => wentWrong(r.status)).length;

  if (bad === 0) return `${turns} finished`;
  if (allWentWrong(runs)) {
    // Every attempt came out badly, which is a different fact from "some did"
    // and is the one a person needs to see without counting.
    return n === 1 ? "1 turn, with failures" : `${turns}, none finished clean`;
  }
  return `${turns}, ${bad} with failures`;
}

/** Every station's line, ready to hand to `runPosition`. */
export function stationOutcomes(
  runs: readonly StationRun[],
): Partial<Record<AgentStation, string>> {
  const grouped = runsByStation(runs);
  const out: Partial<Record<AgentStation, string>> = {};
  for (const [station, rows] of Object.entries(grouped)) {
    const line = stationOutcome(rows);
    if (line) out[station as AgentStation] = line;
  }
  return out;
}
