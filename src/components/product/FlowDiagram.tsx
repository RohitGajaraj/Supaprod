import { useServerFn } from "@tanstack/react-start";
import { readFailureMessage } from "@/lib/roles.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Workflow } from "lucide-react";
import { toast } from "@/lib/notify";
import { Action } from "@/components/meridian/surface-parts";
import {
  Flowchart,
  type FlowEdge as CanvasEdge,
  type FlowNode,
} from "@/components/meridian/Flowchart";
import { getFlowForPrd, generateFlow, type FlowEdge, type FlowStep } from "@/lib/flows.functions";

type Props = {
  prdId: string;
};

const KIND_LABEL: Record<FlowStep["kind"], string> = {
  step: "Step",
  decision: "Decision",
  state: "State",
};

/**
 * Layers the extracted graph onto the canvas: rows by longest path from a root
 * step, one ordering pass so a branch sits under where it comes FROM, then
 * columns spread within each row. The forced assignment on the last pass is
 * reached only if the stored graph carries a cycle, which parseGeneratedFlow
 * does not rule out; a debatable row still beats no drawing at all.
 */
function layoutFlow(
  steps: FlowStep[],
  edges: FlowEdge[],
): { nodes: FlowNode[]; edges: CanvasEdge[] } {
  const known = new Set(steps.map((s) => s.id));
  const live = edges.filter((e) => e.from !== e.to && known.has(e.from) && known.has(e.to));

  const preds = new Map<string, string[]>();
  for (const e of live) preds.set(e.to, [...(preds.get(e.to) ?? []), e.from]);

  const rowOf = new Map<string, number>();
  let pending = steps.map((s) => s.id);
  for (let pass = 0; pass < steps.length && pending.length > 0; pass += 1) {
    const waiting: string[] = [];
    const forced = pass === steps.length - 1;
    for (const id of pending) {
      const above = (preds.get(id) ?? []).filter((p) => p !== id);
      if (!forced && above.some((p) => !rowOf.has(p))) {
        waiting.push(id);
        continue;
      }
      rowOf.set(id, above.length ? Math.max(...above.map((p) => rowOf.get(p) ?? -1)) + 1 : 0);
    }
    pending = waiting;
  }

  const byRow = new Map<number, string[]>();
  for (const s of steps) {
    const row = rowOf.get(s.id) ?? 0;
    byRow.set(row, [...(byRow.get(row) ?? []), s.id]);
  }

  const xOf = new Map<string, number>();
  for (const row of [...byRow.keys()].sort((a, b) => a - b)) {
    const members = byRow.get(row) ?? [];
    const centreFrom = (id: string) => {
      const above = (preds.get(id) ?? [])
        .map((p) => xOf.get(p))
        .filter((x): x is number => x !== undefined);
      return above.length
        ? above.reduce((sum, x) => sum + x, 0) / above.length
        : Number.POSITIVE_INFINITY;
    };
    const ordered = members
      .map((id, i) => ({ id, i, key: centreFrom(id) }))
      .sort((a, b) => (a.key === b.key ? a.i - b.i : a.key - b.key));
    ordered.forEach(({ id }, i) => xOf.set(id, (i + 1) / (members.length + 1)));
  }

  return {
    nodes: steps.map((s) => {
      const row = rowOf.get(s.id) ?? 0;
      return {
        id: s.id,
        row,
        x: xOf.get(s.id) ?? 0.5,
        w: (byRow.get(row)?.length ?? 1) > 1 ? 200 : undefined,
        kind: KIND_LABEL[s.kind],
        title: s.label,
      };
    }),
    edges: live.map((e) => ({ from: e.from, to: e.to, label: e.label || undefined })),
  };
}

/**
 * DSN-03, drawn. The step/decision/state graph generated from this spec's own
 * body sat on a vertical timeline because nothing here could lay out a graph;
 * Meridian's Flowchart canvas can, so a decision's branches are now real edges
 * with their labels on them, landing on the steps they lead to. That drawn fork
 * is the check against the beautiful screen with a broken journey. No selection
 * is wired: this host never selected a step, so the cards stay plain facts.
 */
export function FlowDiagram({ prdId }: Props) {
  const qc = useQueryClient();
  const fGet = useServerFn(getFlowForPrd);
  const fGenerate = useServerFn(generateFlow);

  const flowQ = useQuery({
    queryKey: ["prd-flow", prdId],
    queryFn: () => fGet({ data: { prdId } }),
  });

  const generate = useMutation({
    mutationFn: () => fGenerate({ data: { prdId } }),
    onSuccess: (row) => {
      qc.setQueryData(["prd-flow", prdId], row);
      if (!row) toast.error("No user flow found in this spec's body yet.");
      else toast.success("Flow generated from the spec.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const flow = flowQ.data;

  return (
    <div className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5 font-mrd">
      <div className="mb-mrd-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-mrd-data text-mrd-body">
          <Workflow className="size-3.5" />
          User flow
        </div>
        {/* The panel's one action, and not an escape, so it takes the raised
            default. `gap-1.5` is passed because it has to be: `.btn-pill-outline`
            carried `gap: 0.5rem` and `.sp-btn` sets no gap at all, so without it
            the glyph and the word butt together. Passing any className replaces
            the `sp-btn` the primitive sets (it spreads rest props after it),
            which is why that class is repeated here. The mark grew with the
            label, 12px to 14px, to sit at the size of the word beside it. */}
        <Action
          onClick={() => generate.mutate()}
          busy={generate.isPending}
          className="sp-btn gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          {generate.isPending ? "Generating…" : flow ? "Regenerate" : "Generate flow"}
        </Action>
      </div>

      {flowQ.isLoading ? (
        <p className="text-mrd-small text-mrd-mute">Loading…</p>
      ) : flowQ.isError ? (
        /* A FAILED READ IS NOT AN EMPTY SPEC. "No flow generated yet" offers to
           generate one, so a reader who acts on it regenerates work that may
           already exist rather than retrying a read. */
        <p className="max-w-[62ch] text-mrd-small leading-mrd-prose text-mrd-mute">
          The flow did not load, so this is not a claim that none has been generated.{" "}
          {readFailureMessage(flowQ.error)}
        </p>
      ) : !flow || flow.steps.length === 0 ? (
        <p className="max-w-[62ch] text-mrd-small leading-mrd-prose text-mrd-mute">
          No flow generated yet. This reads the spec's own body and extracts the steps, decision
          points, and states a user moves through, the artifact designers start with before a
          screen.
        </p>
      ) : (
        <Flowchart
          label="The journey through this spec, and every place it forks"
          {...layoutFlow(flow.steps, flow.edges)}
        />
      )}
    </div>
  );
}
