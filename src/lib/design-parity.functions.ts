/**
 * DSN-04: the design contract rides the BuildSpec (v12 §6).
 *
 * What remains of this module is the OUTBOUND half: `formatFlowContext`
 * renders a spec's flow graph as the text block the building seat is handed,
 * so it walks the states the spec named rather than an invented path.
 * `studio.functions.ts` reads it when it composes a dispatch.
 *
 * The RETURN half is gone (2026-09-08, P-146). `getDesignParity` (a live
 * verdict on whether the work that came back mentioned the tokens and flow
 * states it was given) lost its only reader when /runs/$missionId became a
 * redirect stub (P-14), and `checkDesignParity` (the same verdict recorded as
 * an `artifact_lineage` edge) never had a caller: production held zero rows
 * with relation='design_parity' across the feature's whole life, verified
 * twice (2026-08-06, 867 edges and not one of them). A feature that ran zero
 * times and reached no screen is deleted rather than carried. If Build is
 * ever graded against the design it was handed, it should be graded on the
 * diff (`studio.review` already returns a verdict per acceptance line), not
 * on a text search of the changeset's own summary, which is all this was.
 */
export type PrdFlowRow = { steps: Array<{ label?: string }>; edges: unknown[] } | null;

/** PURE. Renders a PRD's flow graph as a text block for the mission goal. Empty/missing flow renders nothing. */
export function formatFlowContext(flow: PrdFlowRow): string {
  if (!flow || !Array.isArray(flow.steps) || flow.steps.length === 0) return "";
  const labels = flow.steps.map((s) => s.label).filter((l): l is string => !!l);
  if (labels.length === 0) return "";
  return [
    "User flow (the states/steps this spec walks through, in order - use these, not an invented path):",
    ...labels.map((l, i) => `  ${i + 1}. ${l}`),
  ].join("\n");
}
