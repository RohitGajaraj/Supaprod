/**
 * The run-state vocabulary. ONE copy, read by both views of Runs.
 *
 * This moved out of `_authenticated.runs.index.tsx` the moment that surface
 * grew a second view. The list and the board are two renderings of one truth,
 * and the failure mode is not that one of them looks wrong: it is that a run
 * reads "Working" in the list and sits under "Done" on the board, which
 * destroys trust in both at once. Two copies of a status mapping drift on the
 * first status the engine adds. One copy cannot.
 *
 * Nothing here queries. It is pure mapping over what `listStudioSessions`
 * already returned, so adding the board added no server function, no query and
 * no Supabase select.
 */

import type { StudioSessionListItem } from "@/lib/studio.functions";
import type { MarkState } from "@/components/meridian/marks";
import { agentDisplayName, agentRelayVerb } from "@/lib/agent-vocabulary";

/**
 * Two disjoint status vocabularies feed a run: `agent_runs.status` (queued /
 * running / waiting_approval / halted / completed / failed / cancelled / done)
 * and `missions.status` (proposed / queued / running / blocked / halted /
 * cancelled / completed / completed_with_failures / failed). `blocked` is the
 * mission table's word for waiting on a human gate, and answering a gate only
 * updates the approvals table until the next resume tick, so a pending count
 * outranks every status string. An unrecognised string falls to the neutral
 * "queued", never to "done": a false Done is the one reading that lies.
 */
export type RunState = "gate" | "working" | "queued" | "stopped" | "done";

const STOPPED = new Set(["failed", "halted", "cancelled", "completed_with_failures"]);

export function runState(s: StudioSessionListItem): RunState {
  const status = s.run_status ?? s.status;
  /*
   * NULL IS NOT ZERO, AND THE DIFFERENCE DECIDES WHETHER A PERSON LOOKS.
   *
   * `pending_approvals` is null when the gate read itself failed, which until
   * 2026-09-09 arrived here as a zero and read as "nothing is waiting". The
   * line below catches most of it: a run with a pending gate normally carries
   * `waiting_approval` or `blocked` in its own status. What it cannot catch is
   * a run whose status still says running while an approval sits pending, and
   * that one would read "Working" while a person is the thing it is waiting on.
   *
   * So an unread count resolves toward the look. Being sent to a run that
   * turns out to need nothing costs a glance; the opposite costs a person
   * waiting on a machine that says it is busy, which is the failure this
   * product cannot afford. It is also rare: it takes a failed read to reach.
   */
  if (s.pending_approvals === null || s.pending_approvals > 0) return "gate";
  if (status === "waiting_approval" || status === "blocked" || status === "proposed") return "gate";
  if (status === "running") return "working";
  if (status === "queued") return "queued";
  if (STOPPED.has(status)) return "stopped";
  /*
   * `complete`, SINGULAR, and it was the omission. `agents.functions.ts` writes
   * it on the single-agent happy path; this line tested only the plural and the
   * word `done`, so a finished run fell through to the neutral fallback and read
   * "Queued" in the list AND sat under Queued on the board. That is exactly the
   * pair this file's header names as the failure it exists to prevent, and it was
   * this file producing it. Two of 1,889 production runs carry the singular, and
   * `runBucket` and `classifyRunOutcome` were both already right about it.
   */
  if (status === "completed" || status === "complete" || status === "done") return "done";
  return "queued";
}

/** State is never a hue: the mark carries it, and the mark owns the colour. */
export const MARK_STATE: Record<RunState, MarkState> = {
  gate: "gate",
  working: "running",
  queued: "quiet",
  stopped: "failed",
  done: "idle",
};

/** The one fact that decides who a run may be attributed to. 'build' means the
 *  session carries `agent_slug='builder'` runs; 'mission' means it does not. */
export type RunKind = StudioSessionListItem["kind"];

/**
 * WHO IS ON THIS RUN. A 'build' run is selected by `agent_slug='builder'`, so
 * naming Engineer is a fact rather than a guess. A goal run's holder lives in
 * `missions.current_agent_id`, a uuid with no client-reachable slug resolver,
 * so it stays "The crew": unspecific and true beats specific and invented.
 *
 * THESE TAKE THE KIND, not a list row, and that is the point. The run DETAIL
 * page has no list row, so it answered the same question with its own hardcoded
 * `const BUILDER = "builder"` and credited Engineer in the headline, in "Who is
 * on it", in "What happens next", on every ledger row and on every receipt of
 * EVERY run. "From a goal" is the default composer door, so most runs are
 * orchestrator runs with no build agent in them at all, and the list one click
 * back was correctly calling the same row "The crew". Attribution is the proof
 * of the whole product: a surface that invents one, or that disagrees with the
 * surface next to it about one, is the single claim this cannot afford to get
 * wrong. Taking the kind is what lets both surfaces read the same mapping.
 *
 * Anything that is not 'build' resolves to the crew, so a page that has not
 * loaded its kind yet is honest by construction rather than by the caller
 * remembering to be.
 */
export function actorSlug(kind: RunKind | null | undefined): string | null {
  return kind === "build" ? "builder" : null;
}
export function actorName(kind: RunKind | null | undefined): string {
  return kind === "build" ? agentDisplayName("builder") : "The crew";
}
export function actorVerb(kind: RunKind | null | undefined): string {
  return (kind === "build" ? agentRelayVerb("builder") : null) ?? "working";
}

/** Plain-words relative time. Mono is applied by the caller, not here.
 *
 *  It lives beside the state mapping for the same reason the mapping does:
 *  both views print a time off the same instant, and two roundings of "now"
 *  that disagree by a minute is a surface arguing with itself. */
export function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 0) return null;
  if (ms < 60_000) return "now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
