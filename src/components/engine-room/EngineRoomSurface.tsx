import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Surface } from "@/components/obsidian/Surface";
import { getBudgetOverview } from "@/lib/budgets.functions";
import { getAnalyticsOverview } from "@/lib/analytics.functions";
import { listEvalSuites } from "@/lib/evals.functions";
import { getDriftOverview } from "@/lib/drift.functions";
import { getGuardrailOverview } from "@/lib/guardrails.functions";
import { getIncidents } from "@/lib/incidents.functions";
import { listTraces } from "@/lib/traces.functions";
import { getLedgerSeal } from "@/lib/trust-ledger.functions";
import { buildGlance, type GlanceInputs, type RoomKey } from "@/lib/engine-room-glance";
import { RoomCard } from "./RoomCard";
import { ConnectionStrip } from "./ConnectionStrip";

/** Shared glance data source: EngineRoomSurface (the grid) and RoomDetail
 * (a single room's header) both need the same four verdicts, so the nine
 * read queries live in one hook rather than being wired twice. TanStack
 * Query dedupes by key regardless of which mounts first. */
export function useEngineRoomGlance() {
  const fBudget = useServerFn(getBudgetOverview);
  const fAnalytics = useServerFn(getAnalyticsOverview);
  const fSuites = useServerFn(listEvalSuites);
  const fDrift = useServerFn(getDriftOverview);
  const fGuardrails = useServerFn(getGuardrailOverview);
  const fIncidents = useServerFn(getIncidents);
  const fTraces = useServerFn(listTraces);
  const fSeal = useServerFn(getLedgerSeal);

  const budgetQ = useQuery({ queryKey: ["budget_overview"], queryFn: () => fBudget() });
  const cost7Q = useQuery({
    queryKey: ["analytics-overview", 7],
    queryFn: () => fAnalytics({ data: { days: 7 } }),
  });
  const cost14Q = useQuery({
    queryKey: ["analytics-overview", 14],
    queryFn: () => fAnalytics({ data: { days: 14 } }),
  });
  const suitesQ = useQuery({ queryKey: ["eval_suites"], queryFn: () => fSuites() });
  const driftQ = useQuery({ queryKey: ["drift_overview"], queryFn: () => fDrift() });
  const guardrailsQ = useQuery({ queryKey: ["guardrails"], queryFn: () => fGuardrails() });
  const incidentsQ = useQuery({ queryKey: ["incidents"], queryFn: () => fIncidents() });
  const tracesQ = useQuery({
    queryKey: ["traces", 30, "all"],
    queryFn: () => fTraces({ data: { days: 30, status: "all", limit: 200 } }),
  });
  const sealQ = useQuery({ queryKey: ["ledger-seal"], queryFn: () => fSeal({ data: {} }) });

  const loading =
    budgetQ.isLoading ||
    cost7Q.isLoading ||
    cost14Q.isLoading ||
    suitesQ.isLoading ||
    driftQ.isLoading ||
    guardrailsQ.isLoading ||
    incidentsQ.isLoading ||
    tracesQ.isLoading ||
    sealQ.isLoading;

  const inputs: GlanceInputs = loading
    ? {}
    : {
        spend: {
          global: budgetQ.data?.global ?? null,
          costThisWeek: cost7Q.data?.summary.totalCost ?? 0,
          costTrailing14d: cost14Q.data?.summary.totalCost ?? 0,
        },
        quality: {
          suites: (suitesQ.data ?? []).map((s) => ({
            pass_threshold: s.pass_threshold,
            last_run: s.last_run,
          })),
          driftOpenCount: driftQ.data?.openIncidents.length ?? 0,
        },
        safety: {
          rules: guardrailsQ.data?.rules ?? [],
          incidentCount: incidentsQ.data?.count ?? 0,
        },
        record: {
          traceCount: tracesQ.data?.traces.length ?? 0,
          ledgerVerifies: sealQ.data?.available ?? false,
        },
      };

  return { rooms: buildGlance(inputs), loading };
}

/** The glance: hero, 2x2 room grid, connection strip. Every number is a
 * read-only consumer of an existing query (OBS-09 §3 no-feature-work
 * boundary). Nothing here writes. */
export function EngineRoomSurface() {
  const navigate = useNavigate({ from: "/engine-room" });
  const { rooms, loading } = useEngineRoomGlance();
  const allClear = !loading && rooms.every((r) => r.state === "healthy");
  const openRoom = (key: RoomKey) => navigate({ search: { room: key } });

  return (
    <Surface>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 430,
          fontSize: "28px",
          letterSpacing: "-0.015em",
          color: "var(--text-primary)",
          margin: "0 0 6px",
        }}
      >
        The engine, at a <em style={{ fontStyle: "italic", color: "var(--glacier)" }}>glance</em>.
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-subtle)", marginBottom: "24px" }}>
        Four rooms, one verdict each. Your calls never live here · they find you on Today.
      </p>

      {allClear ? (
        <div
          style={{
            borderRadius: "var(--radius-panel)",
            border: "1px solid rgba(127, 191, 142, 0.45)",
            backgroundColor: "var(--surface-card-deep)",
            padding: "24px",
            marginBottom: "20px",
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            color: "var(--text-body)",
          }}
        >
          Four rooms, nothing burning. Come back when a chip turns marigold.
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: "14px", marginBottom: "20px" }}>
          {rooms.map((room) => (
            <RoomCard key={room.key} glance={room} onOpen={() => openRoom(room.key)} />
          ))}
        </div>
      )}

      <ConnectionStrip />
    </Surface>
  );
}
