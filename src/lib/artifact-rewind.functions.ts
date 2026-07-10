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

    // Restore from snapshot
    const revertedBodyMd = prd.snapshot_before as any;

    // Capture the current (soon-to-be-previous) state for future rewinds
    const currentSnapshot = {
      body_md: prd.body_md,
      reverted_at: new Date().toISOString(),
    };

    // Update the PRD
    const { error: updateErr } = await db
      .from("prds")
      .update({
        body_md: revertedBodyMd,
        snapshot_before: currentSnapshot,
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
      .select("id,workspace_id,body,snapshot_before")
      .eq("id", data.decision_id)
      .single();

    if (fetchErr || !decision) throw new Error(`Decision not found: ${fetchErr?.message}`);

    if (!decision.snapshot_before)
      throw new Error("This decision has no previous snapshot to revert to.");

    const revertedBody = decision.snapshot_before as any;
    const currentSnapshot = {
      body: decision.body,
      reverted_at: new Date().toISOString(),
    };

    const { error: updateErr } = await db
      .from("decisions")
      .update({
        body: revertedBody,
        snapshot_before: currentSnapshot,
        updated_at: new Date().toISOString(),
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
