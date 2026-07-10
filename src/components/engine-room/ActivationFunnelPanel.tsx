/**
 * Activation Funnel Panel (PC-06)
 * Displays signup → connect → first-teardown → first-mission → week-2-return conversion funnel
 * for the workspace over the last 30 days.
 */

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace } from "@/hooks/use-workspace";
import { getFunnelSnapshot } from "@/lib/activation-funnel.server";
import type { FunnelSnapshot } from "@/lib/activation-funnel.types";

interface FunnelStageRow {
  label: string;
  count: number;
  percentage: number;
  bar: string;
}

export function ActivationFunnelPanel() {
  const { activeProductId } = useWorkspace();
  const fGetFunnel = useServerFn(getFunnelSnapshot);

  if (!activeProductId) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "var(--text-muted)" }}>
        No workspace selected
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const {
    data: snapshot,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["activation-funnel", activeProductId, today],
    queryFn: () => fGetFunnel(activeProductId, today, 30),
  });

  if (isLoading) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "var(--text-muted)" }}>Loading funnel...</div>
    );
  }

  if (error || !snapshot) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "var(--text-muted)" }}>
        Unable to load funnel data
      </div>
    );
  }

  const stages: FunnelStageRow[] = [
    {
      label: "Signups",
      count: snapshot.totalSignups,
      percentage: 100,
      bar: "🟦",
    },
    {
      label: "Connected",
      count: Math.round((snapshot.totalSignups * snapshot.conversionToConnected) / 100),
      percentage: snapshot.conversionToConnected,
      bar: "🟦",
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
      bar: "🟦",
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
      bar: "🟦",
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
      bar: "🟩",
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-subtle)",
          marginBottom: 16,
        }}
      >
        Activation funnel (30d)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stages.map((stage) => (
          <div key={stage.label} style={{ fontSize: 12 }}>
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
                  background: "var(--glacier)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {snapshot.cohorts.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 11 }}>
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
              fontSize: 10,
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
