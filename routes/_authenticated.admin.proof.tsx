/**
 * PRF-01: the proof surface. Composes what already exists (the Gauntlet,
 * MOAT-METRIC, the AFD-12 admin materialized views) with the three pieces
 * that don't (babysitting-tax trend, supersessions caught, the FS-01
 * prediction hit rate) into one investor-safe panel. The sentence it exists
 * to prove: "the system gets measurably better at this workspace's decisions
 * as its memory grows, and here is the curve." Sparse data reads honestly,
 * never an invented number. Spec: docs/features/proof-surface.md.
 *
 * Obsidian v3 chrome pass (2026-07-03): this file renders only the tab BODY
 * — the parent route (_authenticated.admin.tsx) already supplies the TopBar,
 * the Newsreader question header, and the mono sub-tab bar. No lucide icons;
 * cards use var(--card) / var(--hairline) / var(--radius-card); a trend word
 * maps to moss (improving) or madder (worsening), the outcome-color law.
 *
 * Loom W2-ADMIN pass (2026-07-04): failed reads render as errors with retry
 * instead of silent "-" stats or a vanished section (register D-11); the
 * fixed 3-column grids wrap on narrow windows (D-51); and the insider
 * jargon ("babysitting tax", "supersessions caught", the codename intro)
 * reads in plain words, fit for the investor-safe panel it claims to be.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AdminErrorCard, inBandError } from "@/components/admin/admin-ui";
import { getMoatMetrics } from "@/lib/observability.functions";
import { getProofSurfaceExtras } from "@/lib/proof-surface.functions";
import type { Trend } from "@/lib/gauntlet-metrics";
import { MonoLabel, type MonoLabelTone } from "@/components/obsidian";
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

/** Outcome color for a trend word: moss = positive, madder = negative, muted
 * = flat / nothing to call yet. Role colors mark a real outcome only, never
 * decoration (DESIGN-OBSIDIAN.md role-color law). */
function trendTone(word: string): MonoLabelTone {
  if (word === "improving") return "moss";
  if (word === "worsening") return "madder";
  return "muted";
}

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "var(--space-4)",
};

const cardNumberStyle = {
  fontFamily: "var(--font-sans)",
  fontWeight: 460,
  fontSize: 26,
  lineHeight: 1.3,
};

const cardMeaningStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 12.5,
  lineHeight: 1.5,
  color: "var(--text-body)",
  marginTop: 8,
};

function StatCard({
  label,
  value,
  meaning,
  substat,
  substatTone = "muted",
  loading,
}: {
  label: string;
  value: string;
  meaning: string;
  substat: string;
  substatTone?: MonoLabelTone;
  loading: boolean;
}) {
  return (
    <div style={cardStyle}>
      <MonoLabel style={{ marginBottom: 8, display: "block" }}>{label}</MonoLabel>
      <div
        className="tabular-nums"
        style={{
          ...cardNumberStyle,
          color: value === "-" ? "var(--text-faint)" : "var(--text-primary)",
        }}
      >
        {loading ? "···" : value}
      </div>
      <p style={cardMeaningStyle}>{meaning}</p>
      <MonoLabel tone={substatTone} style={{ marginTop: 10, display: "block" }}>
        {loading ? "reading…" : substat}
      </MonoLabel>
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
    return <MonoLabel style={{ marginTop: 12, display: "block" }}>reading…</MonoLabel>;
  }
  if (!q.data || "error" in q.data) {
    // A vanished section is a silent lie (register D-11): say what failed.
    return (
      <div style={{ marginTop: 12 }}>
        <AdminErrorCard
          what="the receipts"
          message={q.data && "error" in q.data ? q.data.error : undefined}
          onRetry={() => q.refetch()}
        />
      </div>
    );
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
    <div
      style={{
        display: "grid",
        // Wraps instead of crushing on narrow windows (register D-51).
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        marginTop: 12,
      }}
    >
      <div style={cardStyle}>
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>Decisions recorded</MonoLabel>
        <div className="tabular-nums" style={{ ...cardNumberStyle, color: "var(--text-primary)" }}>
          {decisionVelocity.length === 0 ? "-" : decisionsInWindow}
        </div>
        <p style={cardMeaningStyle}>
          Across every workspace, weekly velocity (up to 200 weeks of history).
        </p>
      </div>
      <div style={cardStyle}>
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>Outcome rate, avg</MonoLabel>
        <div className="tabular-nums" style={{ ...cardNumberStyle, color: "var(--text-primary)" }}>
          {avgSupersessionPct == null ? "-" : pct1(avgSupersessionPct)}
        </div>
        <p style={cardMeaningStyle}>
          Share of decisions closed by a real result, averaged across agents.
        </p>
      </div>
      <div style={cardStyle}>
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>Cost / decision, avg</MonoLabel>
        <div className="tabular-nums" style={{ ...cardNumberStyle, color: "var(--text-primary)" }}>
          {avgCostPerDecision == null ? "-" : `$${avgCostPerDecision.toFixed(4)}`}
        </div>
        <p style={cardMeaningStyle}>
          Rolling 30 days, averaged across agents with recorded decisions.
        </p>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <Link
          to="/admin/ai-costs"
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-label)",
            letterSpacing: "0.11em",
            color: "var(--link)",
          }}
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
  // A failed read must not render as three "-" stats (register D-11).
  const extrasError = extrasQ.isError
    ? extrasQ.error instanceof Error
      ? extrasQ.error.message
      : "Request failed."
    : inBandError(extrasQ.data);
  const extras = extrasQ.data && !("error" in extrasQ.data) ? extrasQ.data : undefined;

  const tax = extras?.babysittingTax;
  const taxValue = tax == null || !tax.tableReady ? "-" : String(tax.weeklyGated.at(-1) ?? 0);
  const taxTrend = tax != null && tax.tableReady ? trendWord(tax.trend, false) : null;
  const taxSub =
    tax == null
      ? ""
      : !tax.tableReady
        ? "not enough data yet."
        : `${taxTrend} · last 8 weeks: ${tax.weeklyGated.join(", ")}`;

  const sup = extras?.supersessionsCaught;
  const supValue = sup == null ? "-" : String(sup.total);
  const supTrend = sup != null && sup.total > 0 ? trendWord(sup.trend, true) : null;
  const supSub =
    sup == null
      ? ""
      : sup.total === 0
        ? "not enough data yet. No decisions revised in the last 60 days."
        : `${sup.last30d} in the last 30 days · ${supTrend}`;

  const fs01 = extras?.predictionHitRate;
  const fs01Value =
    fs01 == null || !fs01.tableReady || fs01.rate == null ? "-" : pct1(fs01.rate * 100);
  const fs01Sub =
    fs01 == null
      ? ""
      : !fs01.tableReady
        ? "not enough data yet. This calibration is not live yet."
        : `${fs01.hits} of ${fs01.total} predictions called correctly`;

  return (
    <div style={{ marginTop: 12 }}>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--text-body)",
          margin: 0,
          maxWidth: 720,
        }}
      >
        The system gets measurably better at this workspace's decisions as its memory grows, and
        here is the curve. Every number below reads from real records; sparse windows say "not
        enough data yet", never an invented figure.
      </p>

      <div style={{ marginTop: 16 }}>
        <GauntletMetricsPanel />
      </div>

      <div style={{ marginTop: 20 }}>
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>The receipts</MonoLabel>
        <AdminReceiptsRollup />
      </div>

      <div style={{ marginTop: 20 }}>
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>The rest of the proof</MonoLabel>
        {extrasError ? (
          <AdminErrorCard
            what="these measures"
            message={extrasError}
            onRetry={() => extrasQ.refetch()}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <StatCard
              label="Approvals needing you, weekly"
              value={taxValue}
              meaning="Approval requests landing on a human each week. Falling means the loop is earning more trust and asking less."
              substat={taxSub}
              substatTone={taxTrend ? trendTone(taxTrend) : "muted"}
              loading={extrasQ.isLoading}
            />
            <StatCard
              label="Decisions revised"
              value={supValue}
              meaning="Standing decisions the loop revised or contradicted once new evidence arrived: the system catching its own drift."
              substat={supSub}
              substatTone={supTrend ? trendTone(supTrend) : "muted"}
              loading={extrasQ.isLoading}
            />
            <StatCard
              label="Prediction hit rate"
              value={fs01Value}
              meaning="Of the testable predictions whose deadline has passed, the share that came true: the most quotable trust figure for a skeptic."
              substat={fs01Sub}
              loading={extrasQ.isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
