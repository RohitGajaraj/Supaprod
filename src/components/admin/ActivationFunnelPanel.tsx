/**
 * Activation Funnel Panel (PC-06)
 * Displays signup → connect → first-teardown → first-mission → week-2-return conversion funnel
 * for the workspace over a selectable time range (7 or 30 days).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace } from "@/hooks/use-workspace";
import { getFunnelSnapshot } from "@/lib/activation-funnel.server";
import type { FunnelSnapshot } from "@/lib/activation-funnel.types";

interface FunnelStageRow {
  label: string;
  count: number;
  percentage: number;
}

export function ActivationFunnelPanel() {
  const { activeProductId } = useWorkspace();
  const fGetFunnel = useServerFn(getFunnelSnapshot);
  const [days, setDays] = useState<7 | 30>(30);

  const today = new Date().toISOString().split("T")[0];
  // Hook order must not depend on activeProductId (Rules of Hooks): the query
  // is always declared and gated with `enabled` instead of an early return.
  const {
    data: snapshot,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["activation-funnel", activeProductId, today, days],
    enabled: !!activeProductId,
    queryFn: () => fGetFunnel(activeProductId!, today, days),
  });

  if (!activeProductId) {
    return (
      <div className="text-label-13" style={{ padding: 16, color: "var(--text-muted)" }}>
        No workspace selected. Pick a workspace to see its funnel.
      </div>
    );
  }

  if (isLoading) {
    // Skeleton bars shaped like the funnel rows, never a dead text frame
    // (checklist point 5). animate-pulse is killed by the global
    // prefers-reduced-motion block in styles.css.
    return (
      <div style={{ padding: 16, display: "grid", gap: 12 }} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: 20, borderRadius: 4, background: "var(--surface-recessed)" }}
          />
        ))}
      </div>
    );
  }

  if (error || !snapshot) {
    // Cause + one action, never a mute shrug (checklist point 7).
    return (
      <div className="text-label-13" style={{ padding: 16 }}>
        <span style={{ color: "var(--madder)" }}>
          Couldn't load funnel data.{" "}
          {error instanceof Error ? error.message : "The snapshot came back empty."}
        </span>{" "}
        <button
          type="button"
          onClick={() => refetch()}
          className="cursor-pointer underline outline-none hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{ background: "none", border: "none", padding: 0, color: "var(--text-primary)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  const stages: FunnelStageRow[] = [
    {
      label: "Signups",
      count: snapshot.totalSignups,
      percentage: 100,
    },
    {
      label: "Connected",
      count: Math.round((snapshot.totalSignups * snapshot.conversionToConnected) / 100),
      percentage: snapshot.conversionToConnected,
    },
    {
      label: "First teardown",
      count: Math.round(
        (snapshot.totalSignups *
          snapshot.conversionToConnected *
          snapshot.conversionToFirstTeardown) /
          10000,
      ),
      percentage: snapshot.conversionToFirstTeardown,
    },
    {
      label: "First mission",
      count: Math.round(
        (snapshot.totalSignups *
          snapshot.conversionToConnected *
          snapshot.conversionToFirstTeardown *
          snapshot.conversionToFirstMission) /
          1000000,
      ),
      percentage: snapshot.conversionToFirstMission,
    },
    {
      label: "Week 2 return",
      count: Math.round(
        (snapshot.totalSignups *
          snapshot.conversionToConnected *
          snapshot.conversionToFirstTeardown *
          snapshot.conversionToFirstMission *
          snapshot.conversionToWeek2Return) /
          100000000,
      ),
      percentage: snapshot.conversionToWeek2Return,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-subtle)",
          }}
        >
          Activation funnel ({days}d)
        </div>

        {/* 7/30-day toggle */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "var(--surface-recessed)",
            borderRadius: 4,
            padding: 2,
          }}
        >
          {[7, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d as 7 | 30)}
              aria-label={`Show ${d}-day funnel`}
              aria-pressed={days === d}
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                padding: "4px 8px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "none",
                borderRadius: 3,
                background: days === d ? "var(--text-primary)" : "transparent",
                color: days === d ? "var(--surface-card)" : "var(--text-subtle)",
                cursor: "pointer",
                transition: "all 0.15s var(--ease, ease)",
              }}
              onMouseEnter={(e) => {
                if (days !== d) {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-body)";
                }
              }}
              onMouseLeave={(e) => {
                if (days !== d) {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-subtle)";
                }
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stages.map((stage) => (
          <div key={stage.label} className="text-label-12">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ color: "var(--text-body)" }}>{stage.label}</span>
              <span style={{ color: "var(--text-muted)" }}>
                {stage.count} ({stage.percentage}%)
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: "var(--surface-recessed)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${stage.percentage}%`,
                  background: "var(--text-faint)",
                  // One easing family; killed globally under reduced motion.
                  transition: "width 0.3s var(--ease, ease)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {snapshot.cohorts.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              color: "var(--text-subtle)",
              marginBottom: 8,
            }}
          >
            By cohort (signup date)
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    color: "var(--text-muted)",
                    paddingBottom: 4,
                    borderBottom: "1px solid var(--hairline)",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    textAlign: "right",
                    color: "var(--text-muted)",
                    paddingBottom: 4,
                    borderBottom: "1px solid var(--hairline)",
                  }}
                >
                  Signups
                </th>
                <th
                  style={{
                    textAlign: "right",
                    color: "var(--text-muted)",
                    paddingBottom: 4,
                    borderBottom: "1px solid var(--hairline)",
                  }}
                >
                  Connected
                </th>
                <th
                  style={{
                    textAlign: "right",
                    color: "var(--text-muted)",
                    paddingBottom: 4,
                    borderBottom: "1px solid var(--hairline)",
                  }}
                >
                  Missions
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshot.cohorts.slice(0, 10).map((cohort) => (
                <tr key={cohort.cohortDate}>
                  <td
                    style={{
                      textAlign: "left",
                      color: "var(--text-body)",
                      padding: "4px 0",
                    }}
                  >
                    {cohort.cohortDate}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: "var(--text-muted)",
                      padding: "4px 0",
                    }}
                  >
                    {cohort.signups}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: "var(--text-muted)",
                      padding: "4px 0",
                    }}
                  >
                    {cohort.connected}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: "var(--text-muted)",
                      padding: "4px 0",
                    }}
                  >
                    {cohort.firstMission}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
