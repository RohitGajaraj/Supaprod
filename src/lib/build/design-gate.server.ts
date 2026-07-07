// SW-4 / mission 3.4 DESIGN STATION: the server-side loaders both dispatch
// paths share. Fail-open by contract: pre-migration (columns absent) the
// stage reads as off and dispatch behaves exactly as before, the trust-ramp
// precedent.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getActiveDesignMemoryForWorkspace } from "@/lib/design-memory.functions";
import type { DesignDispatchContext, DesignGateState } from "@/lib/build/design-gate";

/** Read the gate state for a spec: the workspace's stage switch + the spec's
 *  gate status. Two independent maybeSingle reads so a missing column soft-
 *  fails to "stage off" instead of breaking dispatch. */
export async function loadDesignGateState(
  db: SupabaseClient,
  prd: { id: string; workspace_id: string | null } | null,
): Promise<DesignGateState> {
  if (!prd?.workspace_id) return { stageEnabled: false, status: null };
  const [wsRes, prdRes] = await Promise.all([
    db.from("workspaces").select("design_stage_enabled").eq("id", prd.workspace_id).maybeSingle(),
    db.from("prds").select("design_gate_status").eq("id", prd.id).maybeSingle(),
  ]);
  if (wsRes.error || prdRes.error) return { stageEnabled: false, status: null };
  return {
    stageEnabled: Boolean(
      (wsRes.data as { design_stage_enabled?: boolean | null } | null)?.design_stage_enabled,
    ),
    status:
      (prdRes.data as { design_gate_status?: string | null } | null)?.design_gate_status ?? null,
  };
}

/** Load everything the design station hands a Build dispatch: the standing
 *  design memory, the spec's flow graph, and the persisted scaffold. Every
 *  read degrades to empty so a partial context never blocks a dispatch. */
export async function loadDesignDispatchContext(
  db: SupabaseClient,
  prd: { id: string; workspace_id: string | null } | null,
): Promise<DesignDispatchContext | null> {
  if (!prd?.workspace_id) return null;
  const [memory, flowRes, scaffoldRes] = await Promise.all([
    getActiveDesignMemoryForWorkspace(db, prd.workspace_id).catch(() => []),
    db.from("prd_flows").select("steps,edges").eq("prd_id", prd.id).maybeSingle(),
    db.from("prd_scaffolds").select("html").eq("prd_id", prd.id).maybeSingle(),
  ]);
  return {
    memory,
    flow: (flowRes.data as { steps: unknown; edges: unknown } | null) ?? null,
    scaffoldHtml: (scaffoldRes.data as { html?: string | null } | null)?.html ?? null,
  };
}
