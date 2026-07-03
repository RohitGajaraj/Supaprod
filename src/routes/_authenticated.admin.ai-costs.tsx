/**
 * AFD-12: Admin → AI Costs surface.
 *
 * Reads the 3 moat-metric materialized views:
 *   - mv_decision_velocity  (decisions/week per workspace — velocity KPI)
 *   - mv_supersession_rate  (% decisions superseded per agent — receipts KPI)
 *   - mv_agent_cost_per_decision ($ per decision per agent, rolling 30d — ROI KPI)
 *
 * These are the investor receipts that prove the Decision Brain accretes value.
 * Engine-Room Doctrine: outcome labels only (no "materialized view" copy).
 *
 * OBS-13 - re-skinned to Obsidian v3 (chrome-only): tokens, Newsreader card
 * titles, JetBrains-mono table headers, zero lucide. Data/logic unchanged.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  getMoatMetrics,
  type DecisionVelocityRow,
  type SupersessionRateRow,
  type AgentCostRow,
} from "@/lib/observability.functions";

export const Route = createFileRoute("/_authenticated/admin/ai-costs")({
  component: AdminAiCosts,
});

function AdminAiCosts() {
  const fMetrics = useServerFn(getMoatMetrics);
  const metrics = useQuery({
    queryKey: ["admin-moat-metrics"],
    queryFn: () => fMetrics(),
    staleTime: 60_000,
  });

  if (metrics.isLoading) {
    return (
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-label)",
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: "var(--text-subtle)",
          marginTop: 16,
        }}
      >
        Reading spend data…
      </p>
    );
  }

  if (!metrics.data || "error" in metrics.data) {
    return (
      <p style={{ marginTop: 16, fontSize: 13, color: "var(--madder)" }}>
        {"error" in (metrics.data ?? {})
          ? (metrics.data as { error: string }).error
          : "Could not load spend data."}
      </p>
    );
  }

  const { decisionVelocity, supersessionRate, agentCost } = metrics.data;

  return (
    <div style={{ marginTop: "var(--space-3)", display: "grid", gap: "var(--space-6)" }}>
      <p style={{ fontSize: 13, color: "var(--text-subtle)", margin: 0, lineHeight: 1.55 }}>
        Whether the money spent on AI decisions is paying off, tracked over time.
      </p>

      {/* Decision velocity */}
      <section style={cardStyle()}>
        <h2 style={cardTitleStyle()}>Decisions made, by week</h2>
        {decisionVelocity.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-subtle)" }}>
            No decisions recorded yet. This fills in once the workspace starts making them.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead style={{ background: "var(--raised)" }}>
                <tr>
                  <th style={th()}>Week</th>
                  <th style={th()}>Made</th>
                  <th style={th()}>Shipped</th>
                  <th style={th()}>Superseded</th>
                </tr>
              </thead>
              <tbody>
                {(decisionVelocity as DecisionVelocityRow[]).map((r, i) => (
                  <tr key={i} style={rowStyle(i)}>
                    <td style={td()}>{r.week?.slice(0, 10) ?? "-"}</td>
                    <td style={td()}>{r.decisions_made}</td>
                    <td style={td()}>{r.decisions_shipped}</td>
                    <td style={td()}>{r.decisions_superseded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Supersession rate */}
      <section style={cardStyle()}>
        <h2 style={cardTitleStyle()}>Outcome rate by agent</h2>
        <p style={{ fontSize: 13, color: "var(--text-body)", marginBottom: "var(--space-3)" }}>
          Higher outcome rate means more decisions closed by a real result, not a guess.
        </p>
        {supersessionRate.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-subtle)" }}>No data yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead style={{ background: "var(--raised)" }}>
                <tr>
                  <th style={th()}>Agent</th>
                  <th style={th()}>Total decisions</th>
                  <th style={th()}>Outcome rate</th>
                </tr>
              </thead>
              <tbody>
                {(supersessionRate as SupersessionRateRow[]).slice(0, 20).map((r, i) => (
                  <tr key={i} style={rowStyle(i)}>
                    <td style={{ ...td(), fontFamily: "var(--font-mono)" }}>{r.agent_slug}</td>
                    <td style={td()}>{r.decisions_total}</td>
                    <td style={td()}>
                      <span
                        style={{
                          color:
                            r.supersession_rate_pct >= 50
                              ? "var(--moss)"
                              : r.supersession_rate_pct >= 20
                                ? "var(--text-primary)"
                                : "var(--text-subtle)",
                        }}
                      >
                        {r.supersession_rate_pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Cost per decision */}
      <section style={cardStyle()}>
        <h2 style={cardTitleStyle()}>Cost per decision, last 30 days</h2>
        <p style={{ fontSize: 13, color: "var(--text-body)", marginBottom: "var(--space-3)" }}>
          Lower is better. Measures AI spend efficiency: how much it costs to produce one recorded
          decision.
        </p>
        {agentCost.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-subtle)" }}>No data yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead style={{ background: "var(--raised)" }}>
                <tr>
                  <th style={th()}>Agent</th>
                  <th style={th()}>Decisions (30d)</th>
                  <th style={th()}>Spend (30d)</th>
                  <th style={th()}>Cost / decision</th>
                </tr>
              </thead>
              <tbody>
                {(agentCost as AgentCostRow[]).slice(0, 20).map((r, i) => (
                  <tr key={i} style={rowStyle(i)}>
                    <td style={{ ...td(), fontFamily: "var(--font-mono)" }}>{r.agent_slug}</td>
                    <td style={td()}>{r.decisions_30d}</td>
                    <td style={td()}>${r.cost_usd_30d.toFixed(4)}</td>
                    <td style={td()}>
                      {r.decisions_30d > 0 ? `$${r.cost_per_decision_usd.toFixed(4)}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ marginTop: "var(--space-3)", fontSize: 11.5, color: "var(--text-subtle)" }}>
          Refreshes overnight. Turn on{" "}
          <code
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--text-muted)",
              background: "var(--raised)",
              borderRadius: "var(--radius-control)",
              padding: "1px 5px",
            }}
          >
            refresh_observability_mvs()
          </code>{" "}
          in Supabase Cron to keep these numbers live.
        </p>
      </section>
    </div>
  );
}

function cardStyle(): React.CSSProperties {
  return {
    background: "var(--card)",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius-card)",
    padding: "var(--space-4)",
  };
}

function cardTitleStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--font-serif)",
    fontWeight: 460,
    fontSize: "var(--text-card-title)",
    lineHeight: 1.3,
    color: "var(--text-primary)",
    marginBottom: "var(--space-2)",
  };
}

function rowStyle(i: number): React.CSSProperties {
  return {
    borderTop: "1px solid var(--hairline)",
    background: i % 2 === 1 ? "var(--surface-card-deep)" : "transparent",
  };
}

function th(): React.CSSProperties {
  return {
    padding: "var(--space-2) var(--space-3)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-mono-label)",
    letterSpacing: "0.11em",
    textTransform: "uppercase",
    textAlign: "left",
    color: "var(--text-subtle)",
    fontWeight: 500,
  };
}
function td(): React.CSSProperties {
  return {
    padding: "var(--space-2) var(--space-3)",
    verticalAlign: "middle",
    color: "var(--text-body)",
  };
}
