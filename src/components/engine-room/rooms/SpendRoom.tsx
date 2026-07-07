import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AuroraCard, MonoLabel, ChartFrame, Axes, SeriesLine } from "@/components/obsidian";
import { getAnalyticsOverview, getAgentSpendBreakdown } from "@/lib/analytics.functions";
import { zeroFillDaily } from "@/lib/engine-room-glance";
import { Row, EmptyRow, ErrorRetry, PanelPending, type RoomBodyProps } from "../RoomDetail";

// LOOM W2 fold: /govern?tab=budgets lives here as CAPS (the one home for cap
// management) and /govern?tab=analytics as USAGE (the full rollup), each
// lazy-loaded so the room chunk stays light. The OBS-01 semantic bridge keeps
// the folded panels coherent on the dark canvas; full v4 reskin of these two
// is noted for W4.
const BudgetsPanel = React.lazy(() =>
  import("@/components/governance/BudgetsPanel").then((m) => ({ default: m.BudgetsPanel })),
);
const AnalyticsPanel = React.lazy(() =>
  import("@/components/observe/AnalyticsPanel").then((m) => ({ default: m.AnalyticsPanel })),
);
const AgentSpendDetail = React.lazy(() =>
  import("@/components/observe/AgentSpendDetail").then((m) => ({ default: m.AgentSpendDetail })),
);

function fmtUsd(n: number): string {
  return n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function TrendView() {
  const fAnalytics = useServerFn(getAnalyticsOverview);
  const cost7Q = useQuery({
    queryKey: ["analytics-overview", 7],
    queryFn: () => fAnalytics({ data: { days: 7 } }),
  });
  const cost14Q = useQuery({
    queryKey: ["analytics-overview", 14],
    queryFn: () => fAnalytics({ data: { days: 14 } }),
  });
  const week = cost7Q.data?.summary.totalCost ?? 0;
  const prevWeek = Math.max(0, (cost14Q.data?.summary.totalCost ?? 0) - week);
  const trendPct = prevWeek > 0 ? Math.round(((week - prevWeek) / prevWeek) * 100) : 0;
  // Honesty (LOOM §9b): the comparison line only makes a claim once the
  // 14-day read genuinely loaded. A failed read is named, never dressed as
  // "no prior week to compare".
  const trendNote = cost14Q.isError
    ? "prior week did not load"
    : cost14Q.isLoading
      ? "comparing to the week before"
      : prevWeek > 0
        ? `${trendPct >= 0 ? "+" : ""}${trendPct}% vs the week before`
        : "no prior week to compare";
  // Same query as the totals above (queryKey ["analytics-overview", 7]), so
  // this is a cache hit, not a second fetch. Zero-filled to a fixed 7-day
  // window (getAnalyticsOverview's `daily` omits a day with no events
  // entirely, and Sparkline plots by index) so a quiet day renders as a
  // real zero, not as if it were adjacent to its neighbors.
  const filled = zeroFillDaily(cost7Q.data?.daily ?? [], 7);
  if (cost7Q.isError) {
    return (
      <ErrorRetry
        message="Spend for this week did not load."
        onRetry={() => void cost7Q.refetch()}
      />
    );
  }
  if (cost7Q.isLoading) return <PanelPending />;
  return (
    <div className="flex flex-col gap-3">
      <AuroraCard label="SPEND THIS WEEK" value={fmtUsd(week)} note={trendNote} />
      {filled.some((c) => c > 0) ? (
        <div>
          <MonoLabel tone="muted">SPEND · LAST 7 DAYS</MonoLabel>
          {/* Exact machine chart in the spend data-palette (tangerine): axes
              labelled with the real range, no pencil (the Engine Room is the
              machine's room; the PM's graphite ink lives on Decide). */}
          <div style={{ marginTop: 8 }}>
            <ChartFrame w={300} h={132}>
              <Axes
                w={300}
                h={132}
                xTicks={["7 days ago", "today"]}
                yTicks={[fmtUsd(Math.max(...filled)), "$0"]}
              />
              <SeriesLine data={filled} w={300} h={132} color="var(--tangerine)" />
            </ChartFrame>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ByAgentView({ agent }: { agent?: string }) {
  const navigate = useNavigate();
  const fByAgent = useServerFn(getAgentSpendBreakdown);
  const q = useQuery({
    queryKey: ["analytics-by-agent", 30],
    queryFn: () => fByAgent({ data: { days: 30 } }),
  });
  if (agent) {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <AgentSpendDetail id={agent} />
      </React.Suspense>
    );
  }
  if (q.isError) {
    return <ErrorRetry message="Agent spend did not load." onRetry={() => void q.refetch()} />;
  }
  if (q.isLoading) return <PanelPending />;
  const agents = q.data?.agents ?? [];
  if (agents.length === 0) {
    return (
      <EmptyRow message="No spend yet. The first mission draws this line in about a minute." />
    );
  }
  return (
    <div>
      {agents.map((a) => (
        <Row
          key={a.slug}
          subject={a.name}
          value={fmtUsd(a.cost)}
          statusWord={`${Math.round(a.pct)}%`}
          statusColor="var(--text-muted)"
          onOpen={() =>
            navigate({
              to: "/engine-room",
              search: { room: "spend", view: "by-agent", agent: a.slug },
            })
          }
        />
      ))}
    </div>
  );
}

export function SpendRoom({ view, agent }: RoomBodyProps) {
  if (view === "by-agent") return <ByAgentView agent={agent} />;
  if (view === "caps") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <BudgetsPanel />
      </React.Suspense>
    );
  }
  if (view === "usage") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        {agent ? <AgentSpendDetail id={agent} /> : <AnalyticsPanel />}
      </React.Suspense>
    );
  }
  return <TrendView />;
}
