/**
 * PC-10: One-key rewind for AI-touched artifacts.
 *
 * Provides instant revert for PRDs and decisions modified by agents.
 * When a user clicks "Rewind" on an artifact, this:
 * 1. Restores the artifact to its snapshot_before state
 * 2. Captures the reverted state for future rewinds
 * 3. Logs the revert action to the Trust Ledger
 *
 * Authorization: `requireSupabaseAuth` builds a USER-SCOPED client (publishable
 * key + the caller's bearer token), so every read/write here runs under RLS -
 * prds are owner-scoped ("own prds all") and decisions are workspace-membership
 * scoped; a cross-tenant id fails the fetch before any write. Never swap this
 * to a service-role client.
 *
 * The third artifact type ("roadmap") joins when its real backing table is
 * designated - public.roadmaps does not exist in the live schema (2026-07-10
 * review; see the PC-10 row + the migration note).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { RoadmapBucket } from "@/lib/roadmap-governance";

/**
 * Revert a PRD to its previous snapshot.
 *
 * Restores body_md (and other editable fields) from snapshot_before,
 * then captures the reverted state as the new snapshot_before for potential
 * future rewinds. Logs the revert action to the Trust Ledger.
 *
 * Acceptance: "revert works on all three artifact types".
 */
export const revertPrdToPrevious = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prd_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const db = supabase as unknown as SupabaseClient;

    // Fetch the current PRD state
    const { data: prd, error: fetchErr } = await db
      .from("prds")
      .select("id,workspace_id,body_md,snapshot_before")
      .eq("id", data.prd_id)
      .single();

    if (fetchErr || !prd) throw new Error(`PRD not found: ${fetchErr?.message}`);

    if (!prd.snapshot_before) throw new Error("This PRD has no previous snapshot to revert to.");

    // Bug fix (2026-07-10, PC-10 finish pass): snapshot_before must hold the
    // SAME shape on every read and write, or a second revert corrupts
    // body_md with a stringified wrapper object. It is always the bare
    // prior body_md value, nothing else.
    const revertedBodyMd = prd.snapshot_before as unknown as string;

    // Update the PRD, capturing the current (soon-to-be-previous) body as
    // the next snapshot -- same bare shape, so a revert is reversible.
    const { error: updateErr } = await db
      .from("prds")
      .update({
        body_md: revertedBodyMd,
        snapshot_before: prd.body_md,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.prd_id);

    if (updateErr) throw new Error(`Revert failed: ${updateErr.message}`);

    // RPT-04 (designed wrongness): a rewind is the user saying the AI's prior
    // work was WRONG, so it must count as a REJECTED judgment against the
    // agent that authored it - a real signal on the error path, not a hollow
    // "approved" receipt (which is what this previously wrote, on top of 3
    // columns - artifact_id/artifact_type/approved_at - that do not exist on
    // agent_approvals, so the insert silently failed every time; confirmed
    // against the live schema before this fix). Attribution comes from the
    // artifact_lineage edge where this PRD is the child (same "ancestors"
    // query SpecDetail.tsx already uses for "Drafted by {agent}"); a
    // human-authored PRD with no such edge writes no receipt at all, since
    // summarizeAgentRecords (agent-track-record.ts) drops an empty agent_slug
    // anyway - a meaningless row is worse than none.
    const { data: draftEdge } = await db
      .from("artifact_lineage")
      .select("created_by_agent")
      .eq("child_kind", "prd")
      .eq("child_id", data.prd_id)
      .not("created_by_agent", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftEdge?.created_by_agent) {
      // PC-10 receipt-integrity fix: agent_approvals.user_id is NOT NULL with no
      // default (verified against the live schema), so an insert without it fails
      // the constraint; the prior code omitted user_id AND swallowed the error, so
      // the rewind receipt silently never persisted for any artifact type. Set
      // user_id, and surface a failure instead of hiding it.
      const { error: receiptErr } = await db.from("agent_approvals").insert({
        user_id: userId,
        workspace_id: prd.workspace_id,
        agent_slug: draftEdge.created_by_agent,
        tool_name: "artifact.rewind",
        decided_by: userId,
        decided_at: new Date().toISOString(),
        status: "rejected",
        rationale: `User rewound the PRD (${data.prd_id}) this agent drafted back to its previous state.`,
      });
      if (receiptErr)
        console.error("[PC-10] PRD rewind receipt insert failed:", receiptErr.message);

      // PC-10 Finding-2 fix: the reverted body is no longer the agent's revision,
      // so clear the agent attribution on the lineage edge. A second (toggle-back)
      // rewind then finds no created_by_agent edge and files no receipt.
      await db
        .from("artifact_lineage")
        .update({ created_by_agent: null })
        .eq("child_kind", "prd")
        .eq("child_id", data.prd_id)
        .not("created_by_agent", "is", null);
    }

    return { success: true, prd_id: data.prd_id };
  });

/**
 * Revert a decision to its previous snapshot.
 *
 * Same pattern as revertPrdToPrevious.
 */
export const revertDecisionToPrevious = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ decision_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const db = supabase as unknown as SupabaseClient;

    const { data: decision, error: fetchErr } = await db
      .from("decisions")
      .select("id,workspace_id,rationale,snapshot_before,decided_by_agent_slug")
      .eq("id", data.decision_id)
      .single();

    if (fetchErr || !decision) throw new Error(`Decision not found: ${fetchErr?.message}`);

    if (!decision.snapshot_before)
      throw new Error("This decision has no previous snapshot to revert to.");

    // Bug fix (2026-07-10, PC-10 finish pass): decisions has no `body`
    // column -- its content field is `rationale`. This read/write was
    // targeting a nonexistent column and would have thrown on first use.
    // Also matches the prd fix above: snapshot_before is always the bare
    // prior value, never a wrapper object, so a second revert stays clean.
    const revertedRationale = decision.snapshot_before as unknown as string;

    const { error: updateErr } = await db
      .from("decisions")
      .update({
        rationale: revertedRationale,
        snapshot_before: decision.rationale,
        // PC-10 Finding-2 fix: the reverted rationale is no longer the agent's
        // work, so clear the agent attribution. A second (toggle-back) rewind
        // then files no receipt -- re-applying the agent's version is not a
        // rejection of it. The receipt above already used the pre-update value.
        decided_by_agent_slug: null,
      })
      .eq("id", data.decision_id);

    if (updateErr) throw new Error(`Revert failed: ${updateErr.message}`);

    // RPT-04 (designed wrongness): same fix as the PRD revert above - a
    // rewind is a REJECTED judgment against the agent that made this
    // decision (decisions.decided_by_agent_slug, a direct column, unlike a
    // PRD's lineage-derived attribution), not a hollow "approved" receipt on
    // 3 nonexistent columns. A human-made decision writes no receipt.
    if (decision.decided_by_agent_slug) {
      // PC-10 receipt-integrity fix (see revertPrdToPrevious): user_id is required
      // (NOT NULL, no default) and the error must not be swallowed.
      const { error: receiptErr } = await db.from("agent_approvals").insert({
        user_id: userId,
        workspace_id: decision.workspace_id,
        agent_slug: decision.decided_by_agent_slug,
        tool_name: "artifact.rewind",
        decided_by: userId,
        decided_at: new Date().toISOString(),
        status: "rejected",
        rationale: `User rewound the decision (${data.decision_id}) this agent made back to its previous state.`,
      });
      if (receiptErr)
        console.error("[PC-10] decision rewind receipt insert failed:", receiptErr.message);
    }

    return { success: true, decision_id: data.decision_id };
  });

/**
 * Revert a roadmap item (an opportunity's Now/Next/Later placement) to its
 * previous state.
 *
 * A "roadmap" is opportunities.roadmap_bucket (+ outcome/measure), moved by an
 * agent (roadmap.move) or a human (the drag board). Both paths capture the prior
 * placement in roadmap_snapshot_before, so this restores it and re-captures the
 * just-current placement as the next snapshot (so a rewind is itself reversible),
 * matching the prd/decision reverts above. Owner-scoped ("own opportunities all").
 */
export const revertRoadmapItemToPrevious = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ opportunity_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const db = supabase as unknown as SupabaseClient;

    const { data: opp, error: fetchErr } = await db
      .from("opportunities")
      .select(
        "id,workspace_id,roadmap_bucket,roadmap_outcome,roadmap_measure,roadmap_snapshot_before,roadmap_last_agent_slug",
      )
      .eq("id", data.opportunity_id)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !opp) throw new Error(`Roadmap item not found: ${fetchErr?.message}`);

    const snap = opp.roadmap_snapshot_before as {
      bucket?: RoadmapBucket | null;
      outcome?: string | null;
      measure?: string | null;
    } | null;
    if (!snap) throw new Error("This roadmap item has no previous placement to revert to.");

    const { error: updateErr } = await db
      .from("opportunities")
      .update({
        roadmap_bucket: snap.bucket ?? null,
        roadmap_outcome: snap.outcome ?? null,
        roadmap_measure: snap.measure ?? null,
        // Re-capture the just-current placement so the rewind is itself reversible.
        roadmap_snapshot_before: {
          bucket: opp.roadmap_bucket ?? null,
          outcome: opp.roadmap_outcome ?? null,
          measure: opp.roadmap_measure ?? null,
        },
        // PC-10 Finding-2 fix: the restored placement is no longer the agent's
        // move, so clear its attribution. A second (toggle-back) rewind then files
        // no receipt. The receipt below already used the pre-update value.
        roadmap_last_agent_slug: null,
      })
      .eq("id", data.opportunity_id)
      .eq("user_id", userId);

    if (updateErr) throw new Error(`Revert failed: ${updateErr.message}`);

    // RPT-04 (designed wrongness): a rewind of an AGENT move is a REJECTED judgment
    // against that agent (roadmap_last_agent_slug, set by roadmap.move). A human
    // move clears the slug, so a human's own undo writes no agent receipt.
    if (opp.roadmap_last_agent_slug) {
      // PC-10 receipt-integrity fix (see revertPrdToPrevious): user_id is required
      // (NOT NULL, no default) and the error must not be swallowed.
      const { error: receiptErr } = await db.from("agent_approvals").insert({
        user_id: userId,
        workspace_id: opp.workspace_id,
        agent_slug: opp.roadmap_last_agent_slug,
        tool_name: "artifact.rewind",
        decided_by: userId,
        decided_at: new Date().toISOString(),
        status: "rejected",
        rationale: `User rewound the roadmap placement (${data.opportunity_id}) this agent set back to its previous bucket.`,
      });
      if (receiptErr)
        console.error("[PC-10] roadmap rewind receipt insert failed:", receiptErr.message);
    }

    return { success: true, opportunity_id: data.opportunity_id };
  });
