// SW-4 / mission 3.4 DESIGN STATION: the pure gate seam, no DB.
//
// Design becomes a real pipeline stage between Define and Build: a spec
// cannot dispatch while the workspace's design stage is on and the spec's
// design gate has not been approved. The gate decision itself writes back a
// taste learning into design memory (the decide fn in
// design-scaffold.functions.ts); this module only owns the blocking rule and
// the ARD design-section shape, so both dispatch paths (studio.functions.ts
// and build.functions.ts) enforce exactly the same rule.

import type { DesignMemoryRow } from "@/lib/design-memory.functions";
import type { ArdDesignSection } from "@/lib/ard-schema";

export type DesignGateStatus = "pending" | "approved" | "rejected";

export interface DesignGateState {
  /** workspaces.design_stage_enabled; false pre-migration (fail-open). */
  stageEnabled: boolean;
  /** prds.design_gate_status; null pre-migration. */
  status: string | null;
}

/** The one blocking rule both dispatch paths enforce. */
export function designGateBlocksDispatch(state: DesignGateState): boolean {
  if (!state.stageEnabled) return false;
  return state.status !== "approved";
}

export const DESIGN_GATE_BLOCK_MESSAGE =
  "The design stage gates this dispatch: approve the design mockup on the spec page first, or turn the design stage off for this workspace.";

/** What the design station hands the ARD: everything the loaders found. */
export interface DesignDispatchContext {
  memory: DesignMemoryRow[];
  flow: { steps: unknown; edges: unknown } | null;
  scaffoldHtml: string | null;
}

/** Keep the dispatched payload bounded; a scaffold is context, not cargo. */
export const ARD_SCAFFOLD_HTML_CAP = 20_000;

/** PURE. Project the loaded design context into the ARD's design section.
 *  Returns null when there is nothing to carry, so the ARD stays lean. */
export function toArdDesignSection(ctx: DesignDispatchContext | null): ArdDesignSection | null {
  if (!ctx) return null;
  const memory = ctx.memory.map((m) => ({
    category: m.category as string,
    title: m.title,
    content: m.content,
  }));
  const flow_steps = ctx.flow?.steps ?? null;
  const scaffold_html = ctx.scaffoldHtml ? ctx.scaffoldHtml.slice(0, ARD_SCAFFOLD_HTML_CAP) : null;
  if (memory.length === 0 && flow_steps == null && scaffold_html == null) return null;
  return { memory, flow_steps, scaffold_html };
}
