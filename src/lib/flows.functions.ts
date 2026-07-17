/**
 * DSN-03: Flow before screens (v12 §6).
 *
 * A typed user-flow graph (steps, states, decision points) generated from a
 * PRD's title + body_md, the artifact designers actually start with before a
 * screen. One flow per PRD: regenerating replaces it in place, the same
 * dual-projection idiom CNV-01 used for `contract` jsonb — the PRD's
 * narrative stays authoritative, the flow is a structured view. The
 * PRD-derives-flow relationship is recorded as a real `artifact_lineage`
 * edge so the Brain graph can walk it like any other derived artifact.
 *
 * Deliberately out of scope this ticket: the "scaffold derives from flow"
 * half (DSN-01's design-memory/scaffold files were claimed by another lane
 * in the same session this shipped).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callModel } from "@/lib/ai/runtime.server";

export type FlowStepKind = "step" | "decision" | "state";

export type FlowStep = {
  id: string;
  kind: FlowStepKind;
  label: string;
};

export type FlowEdge = {
  from: string;
  to: string;
  label?: string;
};

export type PrdFlow = {
  id: string;
  workspace_id: string;
  prd_id: string;
  steps: FlowStep[];
  edges: FlowEdge[];
  created_at: string;
  updated_at: string;
};

const FLOW_COLUMNS = "id,workspace_id,prd_id,steps,edges,created_at,updated_at";

export const getFlowForPrd = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prdId: string }) => z.object({ prdId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<PrdFlow | null> => {
    const { supabase } = context;
    const { data: row } = await supabase
      .from("prd_flows")
      .select(FLOW_COLUMNS)
      .eq("prd_id", data.prdId)
      .maybeSingle();
    return (row as PrdFlow | null) ?? null;
  });

const MAX_STEPS = 10;
const MAX_LABEL_CHARS = 200;
const MAX_EDGE_LABEL_CHARS = 60;

/**
 * Fail-safe validator for the model's raw JSON: every step needs a unique
 * id/kind/label, every edge must reference two ids that actually exist among
 * the accepted steps. Anything malformed is dropped rather than trusted,
 * same discipline as CNV-02's `deriveOracleClassifications` and FS-02's
 * `deriveWatchVerdict`. Pure — no I/O — so it is directly unit-testable.
 */
export function parseGeneratedFlow(raw: unknown): { steps: FlowStep[]; edges: FlowEdge[] } {
  const j = (raw ?? {}) as { steps?: unknown; edges?: unknown };
  const rawSteps = Array.isArray(j.steps) ? j.steps : [];
  const steps: FlowStep[] = [];
  const seenIds = new Set<string>();
  for (const s of rawSteps.slice(0, MAX_STEPS)) {
    if (typeof s !== "object" || s === null) continue;
    const { id, kind, label } = s as Record<string, unknown>;
    if (typeof id !== "string" || !id.trim() || seenIds.has(id)) continue;
    if (kind !== "step" && kind !== "decision" && kind !== "state") continue;
    if (typeof label !== "string" || !label.trim()) continue;
    seenIds.add(id);
    steps.push({ id, kind, label: label.trim().slice(0, MAX_LABEL_CHARS) });
  }

  const rawEdges = Array.isArray(j.edges) ? j.edges : [];
  const edges: FlowEdge[] = [];
  for (const e of rawEdges) {
    if (typeof e !== "object" || e === null) continue;
    const { from, to, label } = e as Record<string, unknown>;
    if (typeof from !== "string" || typeof to !== "string") continue;
    if (!seenIds.has(from) || !seenIds.has(to)) continue;
    const trimmedLabel = typeof label === "string" ? label.trim() : "";
    edges.push(
      trimmedLabel
        ? { from, to, label: trimmedLabel.slice(0, MAX_EDGE_LABEL_CHARS) }
        : { from, to },
    );
  }

  return { steps, edges };
}

const GENERATE_FLOW_SYSTEM = `You are the Supaprod flow analyst. Given a PRD's title and body, extract the user flow it implies: the steps, decision points, and states a user moves through.
Rules:
- 4 to ${MAX_STEPS} nodes. Each node has a short label (under 60 chars) and a kind: "step" (an action the user takes), "decision" (a branch point), or "state" (an end state or a waiting state).
- Edges connect node ids in the order the flow happens. A "decision" node can have 2 or more outgoing edges, each with a short label naming the branch (e.g. "approved", "rejected").
- Ground this ONLY in what the PRD actually describes. If the PRD does not describe a real user flow (a pure backend or infra spec, for example), return an empty steps array rather than inventing one.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"steps":[{"id":"s1","kind":"step","label":"..."}],"edges":[{"from":"s1","to":"s2","label":null}]}`;

export const generateFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prdId: string }) => z.object({ prdId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<PrdFlow | null> => {
    const { supabase, userId } = context;
    const { data: prd, error: prdErr } = await supabase
      .from("prds")
      .select("id,title,body_md,workspace_id")
      .eq("id", data.prdId)
      .single();
    if (prdErr || !prd) throw new Error(prdErr?.message ?? "PRD not found");

    const res = await callModel(supabase as never, userId, {
      surface: "prd",
      surface_ref: "generate_flow",
      model: "google/gemini-2.5-flash",
      workspaceId: prd.workspace_id as string,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: GENERATE_FLOW_SYSTEM },
        {
          role: "user",
          content: `PRD: ${(prd.title as string).slice(0, 280)}\n\n${((prd.body_md as string) ?? "").slice(0, 4000)}\n\nExtract the flow.`,
        },
      ],
    });
    const { steps, edges } = parseGeneratedFlow(res.json);
    if (steps.length === 0) return null;

    const { data: row, error } = await supabase
      .from("prd_flows")
      .upsert(
        {
          workspace_id: prd.workspace_id,
          prd_id: prd.id,
          steps,
          edges,
          generated_by: userId,
        },
        { onConflict: "prd_id" },
      )
      .select(FLOW_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    try {
      await supabase.from("artifact_lineage").upsert(
        {
          user_id: userId,
          parent_kind: "prd",
          parent_id: prd.id,
          child_kind: "prd_flow",
          child_id: row.id,
          relation: "derived-from",
          created_by_agent: "flow-analyst",
        },
        { onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation" },
      );
    } catch (e) {
      console.error("artifact_lineage upsert failed (non-fatal):", e);
    }

    return row as PrdFlow;
  });
