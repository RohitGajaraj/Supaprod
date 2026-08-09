import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button, Num } from "@/components/shell/primitives";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getPushedInsights,
  markInsightActioned,
  type PushedInsight,
} from "@/lib/brain-insights.functions";

export function PushedInsights() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const fetchPushed = useServerFn(getPushedInsights);
  const markActioned = useServerFn(markInsightActioned);
  const queryKey = ["brain", "pushed-insights"] as const;

  const pushed = useQuery({
    queryKey,
    queryFn: () => fetchPushed({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
    staleTime: 10 * 60 * 1000,
  });

  const settle = useMutation({
    mutationFn: (value: { id: string; outcome: "acted" | "dismissed" }) =>
      markActioned({ data: value }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey });
      const before = queryClient.getQueryData<{ insights: PushedInsight[] }>(queryKey);
      queryClient.setQueryData<{ insights: PushedInsight[] } | undefined>(queryKey, (current) =>
        current
          ? { insights: current.insights.filter((insight) => insight.id !== id) }
          : current,
      );
      return { before };
    },
    onError: (_error, _value, ctx) => {
      if (ctx?.before) queryClient.setQueryData(["brain", "pushed-insights"], ctx.before);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  });

  if (pushed.isLoading || pushed.isError) return null;
  const insights = pushed.data?.insights ?? [];
  if (insights.length === 0) return null;

  return (
    <section className="today-notices" aria-labelledby="today-notices-title">
      <div className="today-notices-head">
        <div>
          <div className="today-kicker">New evidence</div>
          <h2 id="today-notices-title">What changed while you were away</h2>
        </div>
        <span className="today-notices-count">
          <Num>{insights.length}</Num> open
        </span>
      </div>
      <p className="today-notices-sub">
        New evidence changed a standing call or connected signals you had treated separately.
      </p>
      <div className="today-notice-list">
        {insights.map((i) => {
          const kind = insightKind(i.kind);
          return (
            <article className="today-notice" data-evidence-kind={kind.tone} key={i.id}>
              <div className="today-notice-copy">
                <span className="today-evidence-kind">{kind.label}</span>
                <h3>{i.title}</h3>
                <p>{i.body}</p>
              </div>
              <div className="today-notice-actions">
                <Button
                  disabled={settle.isPending}
                  onClick={() => {
                    navigate({ to: targetRoute(i.action.kind) });
                    settle.mutate({ id: i.id, outcome: "acted" });
                  }}
                >
                  {i.action.label}
                </Button>
                <Button
                  variant="ghost"
                  disabled={settle.isPending}
                  onClick={() => settle.mutate({ id: i.id, outcome: "dismissed" })}
                  title="Dismiss this update. It remains part of the record."
                >
                  Dismiss
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type InsightTone = "changed" | "challenged" | "connected";

function insightKind(kind: string): { label: string; tone: InsightTone } {
  switch (kind) {
    case "ground_shift":
      return { label: "Decision changed", tone: "changed" };
    case "bet_contradiction":
      return { label: "Contradicting evidence", tone: "challenged" };
    case "assumption_miss":
      return { label: "Assumption missed", tone: "challenged" };
    default:
      return { label: "Connected evidence", tone: "connected" };
  }
}

function targetRoute(kind: string): string {
  switch (kind) {
    case "open_opportunity":
    case "rerank_bets":
    case "open_decision":
      return "/decide";
    case "open_theme":
      return "/discover";
    case "open_prd":
      return "/plan";
    case "start_mission":
      return "/build";
    case "open_metric":
      return "/learn";
    default:
      return "/brain";
  }
}
