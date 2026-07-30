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
 * every run, and which of it is waiting on me.
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
};

export type BuildWork = {
  items: BuildWorkItem[];
  /**
   * Changesets that exist beyond the window this returns. Rendered, never
   * swallowed: a list that silently truncates reads as "this is everything".
   */
  more: number;
};

/** The window. Generous for a real workspace, bounded so one query stays one query. */
const WINDOW = 60;

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
      .select(
        "id,mission_id,title,status,repo,branch,pr_url,pr_number,updated_at,created_at",
      )
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
    if (!rows.length) return { items: [], more: 0 };

    const ids = rows.map((r) => r.id);
    const missionIds = [...new Set(rows.map((r) => r.mission_id).filter((m): m is string => !!m))];

    const [{ data: changeRows }, { data: missionRows }, { data: liveRuns }, { data: gates }] =
      await Promise.all([
        // path is not read; `op` is, and selecting the key + op keeps this off
        // the content columns entirely.
        db.from("studio_changes").select("changeset_id,op").in("changeset_id", ids),
        missionIds.length
          ? db.from("missions").select("id,title").in("id", missionIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        missionIds.length
          ? db
              .from("agent_runs")
              .select("mission_id")
              .in("mission_id", missionIds)
              .in("status", ["running", "queued"])
          : Promise.resolve({ data: [] as { mission_id: string | null }[] }),
        missionIds.length
          ? db
              .from("agent_approvals")
              .select("mission_id")
              .in("mission_id", missionIds)
              .eq("status", "pending")
          : Promise.resolve({ data: [] as { mission_id: string | null }[] }),
      ]);

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
    const title = new Map(
      ((missionRows ?? []) as { id: string; title: string }[]).map((m) => [m.id, m.title]),
    );
    const liveSet = new Set(
      ((liveRuns ?? []) as { mission_id: string | null }[])
        .map((r) => r.mission_id)
        .filter((m): m is string => !!m),
    );
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
        };
      }),
      more,
    };
  });
