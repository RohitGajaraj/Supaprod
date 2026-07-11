import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { auditDecisionContradictions } from "@/lib/ai/contradiction-auditor.server";

// RPT-25: the on-demand contradiction auditor, run from a decision detail view.
// auditDecision re-reads the workspace's prior decisions and returns the ones
// that disagree with this call; proposeSupersession records the human's
// supersession edge (decision -> decision "contradicts") the Decision Brain
// graph reasons over later. Workspace-scoped and RLS-safe throughout: the
// auth'd client only sees rows in the caller's workspace.

/** Re-read the workspace's decisions and flag the ones that disagree with this call. */
export const auditDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: decision, error } = await supabase
      .from("decisions")
      .select("id,title,rationale,workspace_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!decision) throw new Error("Decision not found.");

    const workspaceId = (decision.workspace_id as string | null) ?? null;
    // A decision with no workspace binding has no corpus to audit against.
    if (!workspaceId) return { scanned: 0, count: 0, items: [] };

    return auditDecisionContradictions(supabase, userId, workspaceId, {
      id: decision.id as string,
      title: decision.title as string,
      rationale: (decision.rationale as string | null) ?? null,
    });
  });

/** Record a supersession: the subject decision supersedes an earlier one. Writes
 *  a decision -> decision "contradicts" edge, copying the assumption-watcher
 *  upsert shape so the graph reads one consistent relation. */
export const proposeSupersession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        supersedingId: z.string().uuid(),
        supersededId: z.string().uuid(),
        rationale: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.supersedingId === data.supersededId) {
      throw new Error("A decision cannot supersede itself.");
    }

    // RLS-safe: both rows must be visible to this user, and in the same
    // workspace, before an edge is written. The auth'd client already scopes
    // reads to the caller's workspace, so a returned row is authorized.
    const { data: rows, error } = await supabase
      .from("decisions")
      .select("id,workspace_id")
      .in("id", [data.supersedingId, data.supersededId]);
    if (error) throw new Error(error.message);

    const found = (rows ?? []) as { id: string; workspace_id: string | null }[];
    const superseding = found.find((r) => r.id === data.supersedingId);
    const superseded = found.find((r) => r.id === data.supersededId);
    if (!superseding || !superseded) {
      throw new Error("Both decisions must exist and be in your workspace.");
    }
    if (superseding.workspace_id !== superseded.workspace_id) {
      throw new Error("Both decisions must be in the same workspace.");
    }

    const { error: upErr } = await supabase.from("artifact_lineage").upsert(
      {
        user_id: userId,
        parent_kind: "decision",
        parent_id: data.supersedingId,
        child_kind: "decision",
        child_id: data.supersededId,
        relation: "contradicts",
        rationale: data.rationale ?? null,
        created_by_agent: "contradiction-auditor",
      },
      { onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation" },
    );
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });
