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

    // Log the revert action to the Trust Ledger
    // (as an "action" receipt, same as agent approvals)
    await db.from("agent_approvals").insert({
      workspace_id: prd.workspace_id,
      artifact_id: data.prd_id,
      artifact_type: "prd",
      tool_name: "artifact.rewind",
      decided_by: userId,
      approved_at: new Date().toISOString(),
      status: "approved",
      rationale: "User initiated rewind to previous state",
    });

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
      .select("id,workspace_id,rationale,snapshot_before")
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
      })
      .eq("id", data.decision_id);

    if (updateErr) throw new Error(`Revert failed: ${updateErr.message}`);

    await db.from("agent_approvals").insert({
      workspace_id: decision.workspace_id,
      artifact_id: data.decision_id,
      artifact_type: "decision",
      tool_name: "artifact.rewind",
      decided_by: userId,
      approved_at: new Date().toISOString(),
      status: "approved",
      rationale: "User initiated rewind to previous state",
    });

    return { success: true, decision_id: data.decision_id };
  });
