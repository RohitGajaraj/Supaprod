import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, RefreshCw, Workflow } from "lucide-react";
import { toast } from "@/lib/notify";
import { Action } from "@/components/meridian/surface-parts";
import { getFlowForPrd, generateFlow, type FlowStep } from "@/lib/flows.functions";

type Props = {
  prdId: string;
};

const KIND_SHAPE: Record<FlowStep["kind"], string> = {
  step: "rounded-lg",
  decision: "rounded-lg rotate-0",
  state: "rounded-full",
};

const KIND_LABEL: Record<FlowStep["kind"], string> = {
  step: "STEP",
  decision: "DECISION",
  state: "STATE",
};

/**
 * DSN-03 — the artifact designers actually start with: a typed step/decision
 * /state graph generated from the PRD's own body, rendered as a simple
 * vertical timeline (a full graph-layout engine is out of scope; each node
 * lists its own outgoing branches, which is enough to catch the "beautiful
 * screen, broken journey" failure without inventing a diagramming library).
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
  const stepsById = new Map((flow?.steps ?? []).map((s) => [s.id, s]));

  return (
    <div className="rounded-lg border hairline bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="mono-label flex items-center gap-2">
          <Workflow className="h-3.5 w-3.5" /> User flow
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
          <RefreshCw className="h-3.5 w-3.5" />
          {generate.isPending ? "Generating…" : flow ? "Regenerate" : "Generate flow"}
        </Action>
      </div>

      {flowQ.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : !flow || flow.steps.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No flow generated yet. This reads the spec's own body and extracts the steps, decision
          points, and states a user moves through, the artifact designers start with before a
          screen.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {flow.steps.map((s) => {
            const outgoing = flow.edges.filter((e) => e.from === s.id);
            return (
              <div key={s.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-3 w-3 border hairline flex-shrink-0 ${KIND_SHAPE[s.kind]}`}
                  />
                  <span className="mrd-eyebrow">
                    {KIND_LABEL[s.kind]}
                  </span>
                  <span className="text-sm">{s.label}</span>
                </div>
                {outgoing.length > 0 ? (
                  <div className="ml-5 flex flex-col gap-1">
                    {outgoing.map((e, i) => {
                      const target = stepsById.get(e.to);
                      return (
                        <div
                          key={i}
                          className="text-xs text-muted-foreground flex items-center gap-1.5"
                        >
                          <GitBranch className="h-3 w-3 flex-shrink-0" />
                          {e.label ? (
                            <span className="mrd-eyebrow">{e.label}</span>
                          ) : null}
                          <span>{target ? target.label : e.to}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
