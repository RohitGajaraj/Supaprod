import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Rocket, Square } from "lucide-react";
import { toast } from "@/lib/notify";
import { Action } from "@/components/meridian/surface-parts";
import {
  getLaunchPlan,
  generateLaunchPlan,
  toggleLaunchChecklistItem,
  rearmOutcomeCheck,
} from "@/lib/launch-plan.functions";

type Props = {
  prdId: string;
};

/**
 * JNY-04 — the launch plan layer above LCH-01's channel copy: positioning
 * derived from the spec's own intent/decision rationale, a standing launch
 * checklist, and an armed outcome-check window (RF-01's outcome-tick does
 * not evaluate this PRD before checkBy, so a verdict is not drafted from a
 * few hours of post-ship noise). Channel copy itself (changelog/blog/email/
 * social/docs) is generated per shipped changeset on the Build page — not
 * duplicated here.
 */
export function LaunchPlanPanel({ prdId }: Props) {
  const qc = useQueryClient();
  const fGet = useServerFn(getLaunchPlan);
  const fGenerate = useServerFn(generateLaunchPlan);
  const fToggle = useServerFn(toggleLaunchChecklistItem);
  const fRearm = useServerFn(rearmOutcomeCheck);
  const [days, setDays] = useState(30);

  const planQ = useQuery({
    queryKey: ["launch-plan", prdId],
    queryFn: () => fGet({ data: { prdId } }),
  });

  const generate = useMutation({
    mutationFn: () => fGenerate({ data: { prdId } }),
    onSuccess: (row) => {
      qc.setQueryData(["launch-plan", prdId], row);
      toast.success("Launch plan drafted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (index: number) => fToggle({ data: { prdId, index } }),
    onSuccess: (row) => qc.setQueryData(["launch-plan", prdId], row),
    onError: (e: Error) => toast.error(e.message),
  });

  const rearm = useMutation({
    mutationFn: () => fRearm({ data: { prdId, days } }),
    onSuccess: (row) => {
      qc.setQueryData(["launch-plan", prdId], row);
      toast.success(`Outcome check rescheduled, ${days} days out.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const plan = planQ.data;

  return (
    <div className="rounded-lg border hairline bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="mono-label flex items-center gap-2">
          <Rocket className="h-3.5 w-3.5" /> Launch plan
        </div>
        <Action onClick={() => generate.mutate()} busy={generate.isPending}>
          {generate.isPending ? "Drafting…" : plan ? "Regenerate" : "Draft launch plan"}
        </Action>
      </div>

      {planQ.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : !plan ? (
        <p className="text-xs text-muted-foreground">
          No launch plan yet. This drafts positioning grounded in the spec's own intent and decision
          rationale, a standing launch checklist, and arms an outcome-check window so success is
          judged once there is real usage, not a few hours after shipping.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <div className="mono-label text-[9px] text-muted-foreground mb-1.5">POSITIONING</div>
            <p className="text-sm leading-relaxed">{plan.positioning}</p>
          </div>

          <div>
            <div className="mono-label text-[9px] text-muted-foreground mb-1.5">CHECKLIST</div>
            <div className="flex flex-col gap-1.5">
              {plan.checklist.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle.mutate(i)}
                  disabled={toggle.isPending}
                  className="flex items-center gap-2 text-left text-sm disabled:opacity-50"
                >
                  {item.done ? (
                    <CheckSquare className="h-3.5 w-3.5 flex-shrink-0 text-foreground" />
                  ) : (
                    <Square className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span className={item.done ? "line-through text-muted-foreground" : ""}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mono-label text-[9px] text-muted-foreground mb-1.5">SUCCESS METRIC</div>
            <p className="text-sm">
              {plan.success_metric ?? (
                <span className="text-muted-foreground">
                  None stated in the contract yet. Compile a metric from the Contract tab first.
                </span>
              )}
            </p>
          </div>

          <div>
            <div className="mono-label text-[9px] text-muted-foreground mb-1.5">
              OUTCOME CHECK ARMED
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm">
                {plan.check_by
                  ? new Date(plan.check_by).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Not armed"}
              </p>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 30)}
                className="input w-16 text-xs"
              />
              {/* An action, not an escape, so it is raised like the Draft above
                  it. Its neighbour here is the number input rather than another
                  button, and the shared height is what makes them read as one
                  control: `.input` stands about 35px and `.sp-btn` is 38, where
                  the pill it replaces was 26 and visibly short of the field. */}
              <Action onClick={() => rearm.mutate()} busy={rearm.isPending}>
                Rearm, days out
              </Action>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
