/**
 * ONE SET OF RUN STATUSES, and one function that spells them.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * Four files in this repo map a run's raw status onto their own words, and they
 * disagree. Not about styling: about whether a run succeeded.
 *
 * `agent_runs.status` and `missions.status` are two disjoint vocabularies feeding
 * the same surfaces, and the same state is written by two code paths under two
 * spellings. `AGENTS.md` records the cost as "four status normalisers, three of
 * which disagree about what `completed_with_failures` means, so two surfaces read
 * the same run as opposite outcomes". Measured across the four files on
 * 2026-08-20, that is exactly right and it is worse than it sounds.
 *
 * ── THE FOUR, AND WHERE THEY DIVERGE ───────────────────────────────────
 *
 *   1. `components/runs/run-state.ts`     gate | working | queued | stopped | done
 *   2. `lib/agent-fleet.ts`               running | queued | done | failed | other
 *   3. `components/obsidian/build-status.ts`  working | gate | done | blocked | queued
 *   4. `lib/run-analytics.ts`             succeeded | succeeded_with_failures | failed | abandoned | null
 *
 * `completed_with_failures`, the one AGENTS.md names:
 *   run-state       stopped
 *   agent-fleet     NOT IN ITS TABLE AT ALL, so `other`, so uncounted
 *   build-status    a failure
 *   run-analytics   a SUCCESS
 * Three answers and a blind spot, for one value, on four surfaces.
 *
 * `complete`, the singular, which `agents.functions.ts` writes on the happy path:
 *   run-state       falls through to `queued`. A FINISHED RUN READS AS QUEUED.
 *   agent-fleet     done. It was missing and was fixed, with a comment saying so
 *   build-status    falls through to `queued`. Same misread as run-state
 *   run-analytics   succeeded, and it says 2 of 245 real runs carry it
 *
 * `cancelled`:
 *   run-state       stopped · agent-fleet failed · build-status a failure
 *   run-analytics   UNHANDLED, so null, so counted as still in flight
 *
 * `halted`:
 *   agent-fleet     not in its table, so `other`
 *   the other three stopped / a failure / abandoned
 *
 * ── WHAT THIS FILE IS, AND WHAT IT DELIBERATELY IS NOT ──────────────────
 * It is the SPELLING layer, not a fifth projection. Those four unions are four
 * different questions and all four are legitimate: a fleet count, a row's state, a
 * mission header, an outcome rate. Collapsing them into one would lose real
 * distinctions, which is why the answer is not a fifth union that replaces them.
 *
 * What they should not each be doing is deciding, separately, that `complete` and
 * `completed` are two things. So: one canonical status set, one normaliser, and a
 * consumer keeps its own projection while deriving it from a canonical value
 * instead of from a raw string.
 *
 * NOTHING HERE CHANGES A WRITER OR A CONSUMER. Wiring the four to it is a separate
 * change, and doing both at once would make an unreviewable diff out of a mapping
 * nobody has agreed yet.
 *
 * ── THE UNKNOWN IS EXPLICIT, WHICH IS THE POINT ─────────────────────────
 * Every one of the four falls back silently: three to `queued` and one to `null`.
 * A silent fallback is how `complete` came to read as queued on two surfaces for
 * however long it did, and no gate could report it because the code was doing
 * exactly what it said. `unknown` is a value a caller has to handle, and a caller
 * that maps it to a neutral state is making that choice in the open.
 */

/**
 * THE CANONICAL SET: the real database vocabulary, de-duplicated.
 *
 * These are not new words. Every one appears in `agent_runs.status` or
 * `missions.status` as documented by `run-state.ts` and `build-status.ts`, which
 * both transcribed the two tables. Nothing is invented and nothing is collapsed
 * that carries a distinct fact.
 *
 * `waiting_approval` and `proposed` stay separate, and that is the one place a
 * reader might expect a collapse. `build-status.ts` argues it and is right: a
 * `proposed` mission is one an ambient trigger raised and a person has not
 * promoted, while `waiting_approval` is a running mission stopped at a gate. Both
 * wait on a person; only one has already started. A projection may fold them, and
 * three of the four do.
 */
export type RunStatus =
  | "queued"
  | "running"
  | "waiting_approval"
  | "proposed"
  | "halted"
  | "cancelled"
  | "completed"
  | "completed_with_failures"
  | "failed"
  | "unknown";

/**
 * Every spelling any of the four files recognises, and where it came from.
 *
 * Ordered by what it maps TO rather than alphabetically, because the interesting
 * reading is which spellings are the same state.
 */
const SPELLINGS: Readonly<Record<string, RunStatus>> = {
  // ── queued ────────────────────────────────────────────────────────────
  queued: "queued",
  pending: "queued",
  scheduled: "queued",

  // ── running ───────────────────────────────────────────────────────────
  running: "running",
  in_progress: "running",
  dispatched: "running",
  processing: "running",
  executing: "running",
  active: "running",

  /*
   * ── waiting on a person ───────────────────────────────────────────────
   * `blocked` is `missions.status`' own word for a mission stopped at a human
   * gate, and that table NEVER writes `waiting_approval`, which is the runs
   * table's word for the same fact. Two tables, one state, two spellings, so
   * this is a de-duplication rather than a decision.
   */
  waiting_approval: "waiting_approval",
  blocked: "waiting_approval",

  proposed: "proposed",

  // ── stopped without finishing ─────────────────────────────────────────
  halted: "halted",

  cancelled: "cancelled",
  /* American spelling. `agent-fleet.ts` already carries both, so a writer
     somewhere produces it or somebody expected one to. */
  canceled: "cancelled",
  /*
   * A JUDGMENT CALL, and the two existing files disagree with this one.
   * `agent-fleet.ts` buckets both `aborted` and `denied` as FAILED. Neither
   * appears in either documented table, so there is no ground truth to appeal
   * to, and semantically both are a stop by decision rather than by fault: an
   * abort is a cancel, and a denial is a person refusing. Filed as `cancelled`.
   *
   * It costs `agent-fleet` nothing, because it buckets `cancelled` as failed too,
   * so its counts are identical either way. It matters to `run-analytics`, which
   * would newly see these as finished rather than in flight, and that is the
   * correct direction: a denied run is not still running.
   */
  aborted: "cancelled",
  denied: "cancelled",

  // ── failed ────────────────────────────────────────────────────────────
  failed: "failed",
  error: "failed",
  errored: "failed",
  /* It did not finish, and the reason is a fault rather than a decision. */
  timed_out: "failed",

  /*
   * ── finished ──────────────────────────────────────────────────────────
   * `complete` singular is the one that cost real money. `agents.functions.ts`
   * writes it on the happy path and two of the four files fall through it to
   * `queued`, so a finished run reads as waiting to start. `run-analytics.ts`
   * measured 2 of 245 real successful runs carrying it.
   */
  completed: "completed",
  complete: "completed",
  done: "completed",
  succeeded: "completed",
  success: "completed",

  /*
   * KEPT SEPARATE FROM BOTH `completed` AND `failed`, deliberately, and this is
   * the value AGENTS.md names as the four-way disagreement.
   *
   * It cannot fold into `completed`, because a surface reporting a success rate
   * would count a run whose checks failed. It cannot fold into `failed`, because
   * the work landed and a surface listing failures would send somebody to look
   * at a run that finished. `run-analytics.ts` reached the same conclusion from
   * the other end and gave it its own outcome, `succeeded_with_failures`.
   *
   * So it stays its own status and every projection has to say what it thinks,
   * which is the whole reason four files disagreed: it is genuinely two facts at
   * once and a four-value union has nowhere to put it.
   */
  completed_with_failures: "completed_with_failures",
};

/**
 * A raw status string to one canonical status.
 *
 * Trimmed and lowercased first, because `agent-fleet.ts` already does and the
 * others do not, so a status arriving with different case reads differently on
 * different surfaces today.
 *
 * `unknown` for anything else, never a neutral guess. See the header.
 */
export function normalizeRunStatus(raw: string | null | undefined): RunStatus {
  if (raw === null || raw === undefined) return "unknown";
  return SPELLINGS[raw.trim().toLowerCase()] ?? "unknown";
}

/** Every spelling this recognises. Exported so a guard can enumerate them. */
export const KNOWN_RUN_SPELLINGS: readonly string[] = Object.keys(SPELLINGS);

/**
 * Whether the run has stopped for good, whatever the reason.
 *
 * Offered because all four consumers ask a version of this question and three of
 * them answer it with a `Set` of their own. `unknown` is NOT terminal: a status
 * nobody recognises is not evidence that the work has stopped, and treating it as
 * terminal is how a run in an unrecognised state disappears from a queue.
 */
export function isTerminal(status: RunStatus): boolean {
  return (
    status === "completed" ||
    status === "completed_with_failures" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "halted"
  );
}

/**
 * Every canonical status `isTerminal` calls terminal, as a sorted list.
 *
 * WHY A LIST AND NOT A SECOND HAND-WRITTEN SET. A writer that must not clobber a
 * terminal status has to say so in the QUERY, not in JS, because the check and
 * the write have to be one statement or the race is still open. That means the
 * names have to leave this file as data. **Derived from `isTerminal` rather than
 * typed out again**, so the predicate a query sends and the answer this module
 * gives can never disagree -- which is the entire reason K-12 exists.
 *
 * Sorted so the string a caller builds is stable, and a snapshot test of a query
 * does not fail on key order.
 */
export const TERMINAL_RUN_STATUSES: readonly RunStatus[] = [...new Set(Object.values(SPELLINGS))]
  .filter(isTerminal)
  .sort();

/**
 * Whether a person is what it is waiting for.
 *
 * `halted` is deliberately absent. A halt is a stop on a condition, usually a
 * spend cap, and the thing that releases it is the condition changing rather than
 * a decision anybody can make on the spot. That distinction is the one
 * `--mrd-you` and `--mrd-hold` exist to draw, so a helper that blurred it here
 * would put the wrong colour on a surface later.
 */
export function isWaitingOnAPerson(status: RunStatus): boolean {
  return status === "waiting_approval" || status === "proposed";
}
