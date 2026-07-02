/**
 * PRF-01: the proof surface. Composes what already exists (the Gauntlet,
 * MOAT-METRIC, the AFD-12 admin materialized views) with the three pieces
 * that don't (babysitting-tax trend, supersessions caught, the FS-01
 * prediction hit rate) into one investor-safe panel. The sentence it exists
 * to prove: "the system gets measurably better at this workspace's decisions
 * as its memory grows, and here is the curve." Sparse data reads honestly,
 * never an invented number. Spec: docs/features/proof-surface.md.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, GitMerge, Radar } from "lucide-react";
import { getMoatMetrics } from "@/lib/observability.functions";
import { getProofSurfaceExtras } from "@/lib/proof-surface.functions";
import type { Trend } from "@/lib/gauntlet-metrics";
import { MonoLabel } from "@/components/cadence/Primitives";
import { GauntletMetricsPanel } from "@/components/observe/GauntletMetricsPanel";

export const Route = createFileRoute("/_authenticated/admin/proof")({
  component: AdminProof,
});

function pct1(n: number): string {
  return `${n.toFixed(1)}%`;
}

function trendWord(t: Trend | undefined, upIsGood: boolean): string {
  if (!t || t === "flat") return "flat";
  const rising = t === "up";
  return rising === upIsGood ? "improving" : "worsening";
}

function ExtraCard({
  icon: Icon,
  label,
  value,
  meaning,
  substat,
  loading,
}: {
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  label: string;
  value: string;
  meaning: string;
  substat: string;
  loading: boolean;
}) {
  return (
    <div className="bento" style={{ padding: "var(--card-pad)" }}>
      <MonoLabel icon={Icon} style={{ marginBottom: 6 }}>
        {label}
      </MonoLabel>
      <div
        className="font-display tabular-nums"
        style={{ fontSize: 26, color: value === "-" ? "var(--ink-faint)" : "var(--ink)" }}
      >
        {loading ? "…" : value}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--ink-subtle)", marginTop: 8, lineHeight: 1.45 }}>
        {meaning}
      </p>
      <div
        className="mono-label"
        style={{ fontSize: 8.5, color: "var(--ink-faint)", marginTop: 8 }}
      >
        {loading ? "loading…" : substat}
      </div>
    </div>
  );
}

function AdminReceiptsRollup() {
  const fMetrics = useServerFn(getMoatMetrics);
  const q = useQuery({
    queryKey: ["admin-moat-metrics"],
    queryFn: () => fMetrics(),
    staleTime: 60_000,
  });

  if (q.isLoading) {
    return (
      <p className="mono-label" style={{ color: "var(--ink-subtle)", marginTop: 12 }}>
        loading…
      </p>
    );
  }
  if (!q.data || "error" in q.data) {
    return null; // AdminLayout already gates access; a transient error here just hides the section.
  }

  const { decisionVelocity, supersessionRate, agentCost } = q.data;
  const decisionsInWindow = decisionVelocity.reduce((sum, r) => sum + r.decisions_made, 0);
  const avgSupersessionPct =
    supersessionRate.length > 0
      ? supersessionRate.reduce((s, r) => s + r.supersession_rate_pct, 0) / supersessionRate.length
      : null;
  const costRows = agentCost.filter((r) => r.decisions_30d > 0);
  const avgCostPerDecision =
    costRows.length > 0
      ? costRows.reduce((s, r) => s + r.cost_per_decision_usd, 0) / costRows.length
      : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        <MonoLabel style={{ marginBottom: 6 }}>Decisions recorded</MonoLabel>
        <div className="font-display tabular-nums" style={{ fontSize: 26 }}>
          {decisionVelocity.length === 0 ? "-" : decisionsInWindow}
        </div>
        <p style={{ fontSize: 11.5, color: "var(--ink-subtle)", marginTop: 8 }}>
          Across every workspace, weekly velocity (up to 200 weeks of history).
        </p>
      </div>
      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        <MonoLabel style={{ marginBottom: 6 }}>Outcome rate, avg</MonoLabel>
        <div className="font-display tabular-nums" style={{ fontSize: 26 }}>
          {avgSupersessionPct == null ? "-" : pct1(avgSupersessionPct)}
        </div>
        <p style={{ fontSize: 11.5, color: "var(--ink-subtle)", marginTop: 8 }}>
          Share of decisions closed by a real result, averaged across agents.
        </p>
      </div>
      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        <MonoLabel style={{ marginBottom: 6 }}>Cost / decision, avg</MonoLabel>
        <div className="font-display tabular-nums" style={{ fontSize: 26 }}>
          {avgCostPerDecision == null ? "-" : `$${avgCostPerDecision.toFixed(4)}`}
        </div>
        <p style={{ fontSize: 11.5, color: "var(--ink-subtle)", marginTop: 8 }}>
          Rolling 30 days, averaged across agents with recorded decisions.
        </p>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <Link
          to="/admin/ai-costs"
          className="mono-label"
          style={{ fontSize: 10, color: "var(--ink-subtle)" }}
        >
          View the full per-week / per-agent tables →
        </Link>
      </div>
    </div>
  );
}

function AdminProof() {
  const fExtras = useServerFn(getProofSurfaceExtras);
  const extrasQ = useQuery({
    queryKey: ["proof-surface-extras"],
    queryFn: () => fExtras(),
    staleTime: 60_000,
  });
  const extras = extrasQ.data && !("error" in extrasQ.data) ? extrasQ.data : undefined;

  const tax = extras?.babysittingTax;
  const taxValue = tax == null || !tax.tableReady ? "-" : String(tax.weeklyGated.at(-1) ?? 0);
  const taxSub =
    tax == null
      ? ""
      : !tax.tableReady
        ? "not enough data yet."
        : `${trendWord(tax.trend, false)} · last 8 weeks: ${tax.weeklyGated.join(", ")}`;

  const sup = extras?.supersessionsCaught;
  const supValue = sup == null ? "-" : String(sup.total);
  const supSub =
    sup == null
      ? ""
      : sup.total === 0
        ? "not enough data yet. No supersessions caught in the last 60 days."
        : `${sup.last30d} in the last 30 days · ${trendWord(sup.trend, true)}`;

  const fs01 = extras?.predictionHitRate;
  const fs01Value =
    fs01 == null || !fs01.tableReady || fs01.rate == null ? "-" : pct1(fs01.rate * 100);
  const fs01Sub =
    fs01 == null
      ? ""
      : !fs01.tableReady
        ? "not enough data yet. FS-01 prediction calibration is not live yet."
        : `${fs01.hits} of ${fs01.total} predictions called correctly`;

  return (
    <div style={{ marginTop: 12 }}>
      <p className="mono-label" style={{ color: "var(--ink-subtle)", margin: 0, lineHeight: 1.5 }}>
        The proof surface: the system gets measurably better at this workspace's decisions as its
        memory grows, and here is the curve. Every number below reads from real tables; sparse
        windows say "not enough data yet", never an invented figure.
      </p>

      <div style={{ marginTop: 16 }}>
        <GauntletMetricsPanel />
      </div>

      <div style={{ marginTop: 20 }}>
        <MonoLabel icon={GitMerge} style={{ marginBottom: 8 }}>
          The receipts: admin materialized views
        </MonoLabel>
        <AdminReceiptsRollup />
      </div>

      <div style={{ marginTop: 20 }}>
        <MonoLabel icon={ShieldCheck} style={{ marginBottom: 8 }}>
          The remainder of the moat proof
        </MonoLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <ExtraCard
            icon={ShieldCheck}
            label="Babysitting tax, weekly"
            value={taxValue}
            meaning="Gated (human-decided) approval requests landing on you per week. Falling means the loop is earning more trust and asking less."
            substat={taxSub}
            loading={extrasQ.isLoading}
          />
          <ExtraCard
            icon={GitMerge}
            label="Supersessions caught"
            value={supValue}
            meaning="Standing decisions the loop revised or contradicted once new evidence arrived: the moat catching its own drift."
            substat={supSub}
            loading={extrasQ.isLoading}
          />
          <ExtraCard
            icon={Radar}
            label="Prediction hit rate (FS-01)"
            value={fs01Value}
            meaning="Of the loop's falsifiable predictions with an expired horizon, the share that came true: the single most quotable trust artifact for a skeptic."
            substat={fs01Sub}
            loading={extrasQ.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
