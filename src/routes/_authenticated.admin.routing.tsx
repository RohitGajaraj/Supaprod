/**
 * /admin/routing - the routing console (architecture §10, brief §11).
 * Operator-only: which model class each real AI surface resolves to, what
 * it costs and how fast it runs (7-day live aggregates), and an honest
 * recommendation when a cheaper, equal-or-better model exists. Every
 * number here comes from ai_events / eval_runs / the models.ts catalog -
 * nothing hardcoded, nothing implied that the backend cannot show.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminErrorCard, AdminSkeleton } from "@/components/admin/admin-ui";
import { RoutingPolicyBar, RoutingTable } from "@/components/admin/routing";
import {
  getRoutingTable,
  setRoutingPolicy,
  setSurfacePin,
  type RoutingPolicyMode,
  type RoutingSurface,
} from "@/lib/routing-console.functions";
import { toast } from "@/lib/notify";

export const Route = createFileRoute("/_authenticated/admin/routing")({
  component: AdminRouting,
});

const QUERY_KEY = ["admin-routing-table"];

function AdminRouting() {
  const qc = useQueryClient();
  const fTable = useServerFn(getRoutingTable);
  const fPin = useServerFn(setSurfacePin);
  const fPolicy = useServerFn(setRoutingPolicy);

  const table = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fTable(),
    staleTime: 30_000,
  });

  const pinMutation = useMutation({
    mutationFn: (vars: { surface: RoutingSurface; modelId: string | null }) => fPin({ data: vars }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Routing setting updated.");
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the setting."),
  });

  const policyMutation = useMutation({
    mutationFn: (mode: RoutingPolicyMode) => fPolicy({ data: { mode } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the policy."),
  });

  if (table.isLoading) {
    return (
      <div style={{ marginTop: 16 }}>
        <AdminSkeleton rows={6} height={44} />
      </div>
    );
  }

  if (!table.data || "error" in table.data) {
    return (
      <div style={{ marginTop: 16 }}>
        <AdminErrorCard
          what="the routing table"
          message={
            table.data && "error" in table.data
              ? table.data.error
              : table.error instanceof Error
                ? table.error.message
                : undefined
          }
          onRetry={() => table.refetch()}
        />
      </div>
    );
  }

  const { rows, policy, liveModels } = table.data;
  const pending = pinMutation.isPending;

  return (
    <div style={{ marginTop: "var(--space-3, 12px)", display: "grid", gap: 16 }}>
      <p style={{ fontSize: 13, color: "var(--ink-subtle)", margin: 0, lineHeight: 1.55 }}>
        Every surface, routed. You hold the pins.
      </p>

      <RoutingPolicyBar
        value={policy}
        disabled={policyMutation.isPending}
        onChange={(mode) => policyMutation.mutate(mode)}
      />

      <RoutingTable
        rows={rows}
        liveModels={liveModels}
        pending={pending}
        onPin={(surface, modelId) => pinMutation.mutate({ surface, modelId })}
        onApplyRecommendation={(surface, modelId) => pinMutation.mutate({ surface, modelId })}
      />

      <p style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: 0 }}>
        Cost and latency are the last 7 days of live calls. Eval scores come from completed eval
        runs for that surface and model; a surface with no eval runs shows no recommendation rather
        than a guess.
      </p>
    </div>
  );
}
