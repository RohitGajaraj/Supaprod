/**
 * The Build stage, at workspace scope. The room the spine was missing.
 *
 * WHY THIS EXISTS. Six of the seven stations had a home of their own
 * (/discover, /decide, /plan, /design, /ship, /learn). Build had a 28-line
 * redirect to /runs, which is the home of a DIFFERENT axis: /runs lists runs,
 * one piece of work walking all seven stages. So "the build engine" resolved to
 * a page, looked fine, and was not there. A redirect is perfect camouflage for
 * a missing room, because the URL answers and a real surface appears.
 *
 * Founder, 2026-07-30: "isnt /run comprises of all this 7? and if /runs is for
 * /build then what happens to the other 6? where would they should be seen
 * from? what's the home for them?" The other six were fine. Build was the gap,
 * and it is the same gap he named in his first message of the session: "in
 * build, complete build part, whatever happens in the build cycle needs to take
 * care, a git pull, the code writing, displaying of code, the file changes,
 * diff status, what the agents is doing." None of that existed anywhere except
 * inside one open run.
 *
 * WHAT IT ANSWERS, and it is one question: what is the crew writing, across
 * every run, and which of it is waiting on me. "Waiting on me" has two halves,
 * and this file only had one of them until 2026-08-06: an approval somebody has
 * to answer, and a build that STOPPED and will not restart itself. See
 * `stopped` on BuildWorkItem for why the second half was the larger one.
 *
 * AND IT REPORTS WHAT IT COULD NOT READ. Four side reads feed the headline, and
 * a refused read used to produce the same empty set as a genuinely empty
 * workspace. See BuildWorkUnread.
 *
 * WHY THERE IS NO LINE-LEVEL DIFFSTAT IN THIS LIST. `studio_changes` carries
 * `base_content` and `new_content`, so a real added/removed count is
 * computable, and it is deliberately not computed here: it would mean pulling
 * every version of every file in the workspace to render a list. SYSTEM.md rule
 * 4 already decides this ("a list row is one line plus at most a second line
 * carrying different information. Full detail belongs to the one item in
 * focus"), so the list carries what a file-level query can source honestly, and
 * the line-level diff belongs to the changeset you open. What IS here is a real
 * count of files and how many of them are new, both from one query.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cleanTitle } from "@/components/plan/format";

/** One changeset, as the Build engine's list needs it. */
export type BuildWorkItem = {
  changesetId: string;
  missionId: string | null;
  /** The run this change belongs to, so a row says what it is FOR. */
  missionTitle: string | null;
  title: string;
  /** draft | staged | pr_open | merged | ... straight from the record. */
  status: string;
  repo: string;
  branch: string | null;
  prUrl: string | null;
  prNumber: number | null;
  files: number;
  /** Files this change creates, as opposed to edits. */
  added: number;
  /** Files it deletes. Counted separately because it is the scary one. */
  deleted: number;
  updatedAt: string;
  /** A builder run is running on this mission right now. */
  live: boolean;
  /** Something on this mission is waiting on a human. */
  gated: boolean;
  /**
   * THE STATE THAT DOMINATES PRODUCTION AND HAD NO NAME HERE.
   *
   * `live` asks only about running/queued and `gated` only about a pending
   * approval, so a mission that HALTED mapped to neither: the row fell through
   * to `statusPhrase`, which read the changeset's own column and said "staged,
   * not committed", a sentence about work in flight, over a build that stopped
   * days ago and that nothing will pick back up. Measured on the live database
   * 2026-08-06: 67 halted missions, 19 completed_with_failures, 0 running. The
   * dominant state on the station was the one it could not say.
   *
   * True when the MISSION reached a stopped status, or when a run on it did,
   * none is in flight, and the mission did not itself finish (see
   * MISSION_DONE: a completed mission usually carries the failed run its retry
   * survived). Never true at the same time as `live`: something running now
   * outranks something that stopped before it.
   */
  stopped: boolean;
  /**
   * When the run behind this actually died, for a stopped row.
   *
   * SEPARATE FROM `updatedAt`, AND THAT SEPARATION IS THE FIX. `updatedAt` is
   * the CHANGESET's last touch -- the right key to sort "most recently touched"
   * by, and the wrong answer to "how long has this been stopped". They agree
   * only when the last thing that happened to a changeset was the run dying,
   * which is exactly the case where a build stops and someone then edits or
   * retries something on it: the row then reports a fresh age for a run that has
   * been dead for days.
   *
   * A surface reading a column no writer sets for the event it is describing is
   * the same class of defect as the three wrong numbers of 2026-08-22. This is
   * the field the writer actually sets.
   *
   * Null when the row is not stopped, and null when the runs read failed -- in
   * which case the surface must fall back to saying nothing rather than to
   * `updatedAt`, because that is the wrong number wearing a confident face.
   */
  stoppedAt: string | null;
};

/**
 * WHICH OF THE FOUR SIDE READS CAME BACK, so the surface can say "we could not
 * read what is running" instead of "nothing is running".
 *
 * Each field is the read's own error message, or null when the read answered.
 * Not one of these four destructured `error` before: a refused `agent_runs`
 * read yielded an empty set and the page stated "Nothing is being written", a
 * refused `agent_approvals` read stated "Nothing needs you", and a refused
 * `studio_changes` read zeroed every file count in silence. That is
 * absence-as-evidence sitting directly under a headline asserted as fact.
 */
/**
 * When a run that is no longer alive actually ended.
 *
 * THREE COLUMNS BECAUSE THE QUESTION HAS NO SINGLE WRITER, and picking one and
 * hoping is how a surface ends up reading a column nobody sets for the event it
 * describes.
 *
 *   `halted_at`  set by the loop when it stops a run at a boundary. Exact.
 *   created_at + duration_ms   a run that FAILED rather than halted leaves no
 *                              end stamp, but it does leave how long it ran.
 *   `created_at` alone         last resort: a run with neither is at least
 *                              known to have died no earlier than it began.
 *
 * Null only when the row has no `created_at` at all, which should not happen and
 * is treated as "unknown" rather than as "now" -- a made-up recent timestamp on
 * a build that died last week is worse than an absent one.
 */
export function runEndedAt(run: {
  halted_at?: string | null;
  created_at?: string | null;
  duration_ms?: number | null;
}): string | null {
  if (run.halted_at) return run.halted_at;
  if (!run.created_at) return null;
  const ms = Number(run.duration_ms);
  if (Number.isFinite(ms) && ms > 0) {
    const started = Date.parse(run.created_at);
    if (Number.isFinite(started)) return new Date(started + ms).toISOString();
  }
  return run.created_at;
}

/** The columns `listBuildWork` needs from a run, named so the short-circuit
 *  branch below stays a short-circuit instead of a type declaration. */
type RunRow = {
  mission_id: string | null;
  status: string;
  halted_at: string | null;
  created_at: string | null;
  duration_ms: number | null;
};

export type BuildWorkUnread = {
  /** Per-changeset file counts. Every count on the surface reads 0 without it. */
  files: string | null;
  /** Mission titles. Rows lose the run they belong to, nothing else. */
  missions: string | null;
  /** What is in flight and what stopped. Both halves of the headline. */
  runs: string | null;
  /** What is waiting on a human. The "needs you" half of the headline. */
  gates: string | null;
};

export type BuildWork = {
  items: BuildWorkItem[];
  /**
   * Changesets that exist beyond the window this returns. Rendered, never
   * swallowed: a list that silently truncates reads as "this is everything".
   */
  more: number;
  /** Which of the four side reads failed. See {@link BuildWorkUnread}. */
  unread: BuildWorkUnread;
};

/** The window. Generous for a real workspace, bounded so one query stays one query. */
const WINDOW = 60;

/** Nothing failed. The shape the happy path returns, written once. */
const ALL_READ: BuildWorkUnread = { files: null, missions: null, runs: null, gates: null };

/**
 * A run that is being written RIGHT NOW. Unchanged from the first version of
 * this list on purpose: `dispatched` and `waiting_approval` are also in flight
 * by `native.server.ts`'s reckoning, but `waiting_approval` is what `gated`
 * already says and widening `live` here would move rows between two blocks for
 * a reason no finding asked for.
 */
const RUN_LIVE = ["running", "queued"];

/**
 * A run that STOPPED. The `agent_runs` half of the vocabulary that
 * `components/runs/run-state.ts` calls STOPPED; kept as its own copy because
 * that module is a client mapping over `listStudioSessions` rows and this is a
 * server query, and importing it here would drag the studio types into a file
 * that reads four tables and nothing else. If one list grows a word, so does
 * the other.
 */
const RUN_STOPPED = ["failed", "halted", "cancelled"];

/** The `missions` half of the same vocabulary. */
const MISSION_STOPPED = new Set(["halted", "failed", "cancelled", "completed_with_failures"]);

/**
 * A MISSION THAT FINISHED, AND WHY THIS SET HAS TO EXIST NEXT TO THE OTHER TWO.
 *
 * The run half of `stopped` is derived from EVERY run on the mission, not from
 * the latest one, and a mission commonly carries a dead run it already survived:
 * `mission-advance.server.ts` gives a 'failed' run a bounded retry (:531), and
 * `isLostQueuedRun` CASes a stranded 'queued' run to 'failed' before retrying
 * the step. When the retry succeeds and the DAG finalizes, the mission reaches
 * 'completed' with a 'failed' run row still on it, and without this set that
 * row read as "stopped, and nothing is picking it back up", counted in the
 * headline's needs-you half, and wore a red mark, over work that finished.
 * `components/runs/run-state.ts` does not have this problem because it reads
 * ONE session's current status; this query aggregates a mission's history, so
 * it has to say which history is over.
 *
 * The mission's own terminal word wins over an old run's, and only that word:
 * a mission still 'running' with every run on it failed is stopped, which is
 * the case the run half was added for.
 */
const MISSION_DONE = new Set(["completed", "done"]);

export const listBuildWork = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({}).optional().parse(i))
  .handler(async ({ context }): Promise<BuildWork> => {
    const db = context.supabase as unknown as SupabaseClient;
    const userId = context.userId;

    // `abandoned` is excluded the same way the run list excludes it: an
    // abandoned change is not work in progress, and showing it would put dead
    // rows at the top of the one surface that answers "what is being written".
    const { data: csRows, error } = await db
      .from("studio_changesets")
      .select("id,mission_id,title,status,repo,branch,pr_url,pr_number,updated_at,created_at")
      .eq("user_id", userId)
      .neq("status", "abandoned")
      .order("updated_at", { ascending: false })
      .limit(WINDOW + 1);
    if (error) throw new Error(error.message);

    const all = (csRows ?? []) as Array<{
      id: string;
      mission_id: string | null;
      title: string;
      status: string;
      repo: string;
      branch: string | null;
      pr_url: string | null;
      pr_number: number | null;
      updated_at: string;
    }>;
    // One extra row was fetched purely to learn whether there ARE more, without
    // a second count query.
    const rows = all.slice(0, WINDOW);
    const more = Math.max(0, all.length - WINDOW);
    if (!rows.length) return { items: [], more: 0, unread: ALL_READ };

    const ids = rows.map((r) => r.id);
    const missionIds = [...new Set(rows.map((r) => r.mission_id).filter((m): m is string => !!m))];

    /**
     * EVERY ONE OF THESE FOUR KEEPS ITS `error`, and that is the whole of
     * finding 5. supabase-js RESOLVES a refused read, so `{ data }` alone
     * cannot tell "there are none" from "we were not allowed to look", and
     * every consumer below turns the second into the first.
     *
     * A skipped read (no missions in the window) is NOT a failed one: it
     * answers `{ data: [], error: null }` and the surface may say "nothing" on
     * it, because there was genuinely nothing to ask about.
     */
    const [
      { data: changeRows, error: changeErr },
      { data: missionRows, error: missionErr },
      { data: runRows, error: runErr },
      { data: gates, error: gateErr },
    ] = await Promise.all([
      // path is not read; `op` is, and selecting the key + op keeps this off
      // the content columns entirely.
      db.from("studio_changes").select("changeset_id,op").in("changeset_id", ids),
      missionIds.length
        ? db.from("missions").select("id,title,status").in("id", missionIds)
        : Promise.resolve({
            data: [] as { id: string; title: string; status: string }[],
            error: null,
          }),
      // ONE READ FOR BOTH HALVES. In flight and stopped come off the same
      // column, so asking twice would double the round trips and open a window
      // where a run is both (promoted between the two reads).
      missionIds.length
        ? db
            .from("agent_runs")
            // `halted_at` is set by the loop when it stops a run; `created_at`
            // and `duration_ms` reconstruct the end for a run that failed
            // without being halted. Three columns rather than one because the
            // question "when did this die" has no single writer.
            .select("mission_id,status,halted_at,created_at,duration_ms")
            .in("mission_id", missionIds)
            .in("status", [...RUN_LIVE, ...RUN_STOPPED])
        : Promise.resolve({ data: [] as RunRow[], error: null }),
      missionIds.length
        ? db
            .from("agent_approvals")
            .select("mission_id")
            .in("mission_id", missionIds)
            .eq("status", "pending")
        : Promise.resolve({ data: [] as { mission_id: string | null }[], error: null }),
    ]);

    const unread: BuildWorkUnread = {
      files: changeErr ? changeErr.message : null,
      missions: missionErr ? missionErr.message : null,
      runs: runErr ? runErr.message : null,
      gates: gateErr ? gateErr.message : null,
    };

    const files = new Map<string, { total: number; added: number; deleted: number }>();
    for (const c of (changeRows ?? []) as { changeset_id: string; op: string }[]) {
      const f = files.get(c.changeset_id) ?? { total: 0, added: 0, deleted: 0 };
      f.total += 1;
      // The vocabulary is exactly create | update | delete, enforced by a CHECK
      // constraint (20260612100000_f_studio_engine.sql:57). No other value can
      // reach here, so there is no fallback branch to write.
      if (c.op === "create") f.added += 1;
      if (c.op === "delete") f.deleted += 1;
      files.set(c.changeset_id, f);
    }
    const missions = (missionRows ?? []) as { id: string; title: string; status: string }[];
    const title = new Map(missions.map((m) => [m.id, cleanTitle(m.title)]));
    const liveSet = new Set<string>();
    const stoppedSet = new Set<string>();
    /** Missions that reached a successful terminal status. See MISSION_DONE. */
    const doneSet = new Set<string>();
    for (const m of missions) {
      if (MISSION_STOPPED.has(m.status)) stoppedSet.add(m.id);
      else if (MISSION_DONE.has(m.status)) doneSet.add(m.id);
    }
    /** Per mission, the latest moment a run on it actually stopped. */
    const stoppedAtOf = new Map<string, string>();
    for (const r of (runRows ?? []) as RunRow[]) {
      if (!r.mission_id) continue;
      if (RUN_LIVE.includes(r.status)) liveSet.add(r.mission_id);
      // A dead run on a mission that FINISHED is history, not a call to act.
      // Only positive knowledge suppresses it: when the missions read failed,
      // `doneSet` is empty and the run's own word still stands, which keeps the
      // fail direction on the side of saying something rather than nothing.
      else if (!doneSet.has(r.mission_id)) stoppedSet.add(r.mission_id);

      // WHEN it died, recorded separately from WHETHER it counts as stopped.
      // Kept out of the branch above so the two questions cannot drift: a run on
      // a finished mission is not a call to act, and it still has an end time.
      // LATEST WINS -- a mission with several dead runs stopped when the last
      // one did, not when the first one did.
      if (!RUN_LIVE.includes(r.status)) {
        const at = runEndedAt(r);
        const prior = stoppedAtOf.get(r.mission_id);
        if (at && (!prior || prior < at)) stoppedAtOf.set(r.mission_id, at);
      }
    }
    const gateSet = new Set(
      ((gates ?? []) as { mission_id: string | null }[])
        .map((r) => r.mission_id)
        .filter((m): m is string => !!m),
    );

    return {
      items: rows.map((r) => {
        const f = files.get(r.id) ?? { total: 0, added: 0, deleted: 0 };
        return {
          changesetId: r.id,
          missionId: r.mission_id,
          missionTitle: r.mission_id ? (title.get(r.mission_id) ?? null) : null,
          title: r.title,
          status: r.status,
          repo: r.repo,
          branch: r.branch,
          prUrl: r.pr_url,
          prNumber: r.pr_number,
          files: f.total,
          added: f.added,
          deleted: f.deleted,
          updatedAt: r.updated_at,
          live: !!r.mission_id && liveSet.has(r.mission_id),
          gated: !!r.mission_id && gateSet.has(r.mission_id),
          // A run in flight outranks one that stopped: a mission that halted
          // and was then resumed is being written, and saying otherwise would
          // put a working build under "Stopped".
          stopped: !!r.mission_id && stoppedSet.has(r.mission_id) && !liveSet.has(r.mission_id),
          stoppedAt:
            r.mission_id && stoppedSet.has(r.mission_id) && !liveSet.has(r.mission_id)
              ? (stoppedAtOf.get(r.mission_id) ?? null)
              : null,
        };
      }),
      more,
      unread,
    };
  });
