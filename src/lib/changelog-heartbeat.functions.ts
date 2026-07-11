import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildHeartbeat,
  isoWeekStart,
  type Heartbeat,
  type DecisionForHeartbeat,
} from "@/lib/changelog-heartbeat";
import type { ChangesetForChangelog } from "@/lib/changelog";

/**
 * RPT-45 - Changelog heartbeat read.
 *
 * Fetches the workspace's shipped changesets and recorded decisions in the last
 * N ISO weeks and folds them into the pure heartbeat projection. Everything
 * here is real data: merged changesets that carry release notes, and decisions
 * that have actually been resolved (not still pending). No AI, no estimates.
 */
export const getChangelogHeartbeat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        weeks: z.number().int().min(1).max(26).default(6),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<Heartbeat> => {
    const db = context.supabase as unknown as SupabaseClient;
    const weeks = data.weeks;
    const nowIso = new Date().toISOString();

    // Lower bound for the fetch: the Monday that opens the oldest week we show.
    // buildHeartbeat windows precisely again, so this is a safe outer bound.
    const currentMonday = isoWeekStart(nowIso);
    const oldest = new Date(`${currentMonday}T00:00:00.000Z`);
    oldest.setUTCDate(oldest.getUTCDate() - (weeks - 1) * 7);
    const sinceIso = oldest.toISOString();

    // Only merged changesets can ship. buildHeartbeat buckets by
    // (release_notes_at ?? updated_at), and release_notes_at is stamped at
    // promote-to-production time, which can be LATER than the merge's updated_at
    // (the write that sets release_notes_at does not bump updated_at). So filter
    // on EITHER timestamp being in-window, never updated_at alone, or a shipment
    // whose notes landed in-window but whose merge is older would be dropped.
    // buildHeartbeat windows precisely again, so a small over-fetch is harmless.
    const { data: csRows, error: csErr } = await db
      .from("studio_changesets")
      .select(
        "id,workspace_id,status,title,release_notes,release_notes_at,pr_url,pr_number,prd_id,updated_at",
      )
      .eq("workspace_id", data.workspaceId)
      .eq("status", "merged")
      .or(`release_notes_at.gte.${sinceIso},updated_at.gte.${sinceIso}`)
      .order("updated_at", { ascending: false });
    if (csErr) throw new Error(csErr.message);

    // Decisions bucket by created_at; a resolved decision is one that is no
    // longer pending. Pending proposals have not been decided yet.
    const { data: decRows, error: decErr } = await db
      .from("decisions")
      .select("title,status,created_at,decided_by_agent_slug")
      .eq("workspace_id", data.workspaceId)
      .neq("status", "pending")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false });
    if (decErr) throw new Error(decErr.message);

    return buildHeartbeat(
      (csRows ?? []) as unknown as ChangesetForChangelog[],
      (decRows ?? []) as unknown as DecisionForHeartbeat[],
      nowIso,
      weeks,
    );
  });
