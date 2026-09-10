import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { GraphSlider } from "@/components/meridian/graph-slider";
import { getAnalyticsOverview, getAgentSpendBreakdown } from "@/lib/analytics.functions";
import { zeroFillDaily } from "@/lib/engine-room-glance";
import { Row, EmptyRow, ErrorRetry, PanelPending, type RoomBodyProps } from "../room-parts";
import { FigureCard } from "../EngineChrome";
import { Eyebrow } from "@/components/meridian/surface-parts";
import { getProviderFaults } from "@/lib/provider-faults.functions";
import { ProviderFaultNotice } from "@/components/approvals/ProviderFaultNotice";

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
  // P-119: the same provider-fault read the Waiting page's "agent actions"
  // item calls (provider-faults.functions.ts's own header: one query, one
  // answer, never two) — Team is where the founder actually goes to fix a
  // spend problem, so the same state shows here too.
  const fProviderFaults = useServerFn(getProviderFaults);
  const providerFaults = useQuery({
    queryKey: ["provider-faults"],
    queryFn: () => fProviderFaults(),
  });
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
  const dayLabels = filled.map((_, i) => {
    const daysAgo = filled.length - 1 - i;
    return daysAgo === 0 ? "today" : `${daysAgo}d ago`;
  });
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
    <div className="flex flex-col gap-mrd-5">
      <ProviderFaultNotice faults={providerFaults.data?.faults ?? []} />
      <FigureCard label="Spend this week" value={fmtUsd(week)} note={trendNote} />
      {filled.some((c) => c > 0) ? (
        <div>
          <Eyebrow>Spend, last 7 days</Eyebrow>
          {/* Interactive trend: scrub to read each day, peak and low always
              shown.

              THE SERIES COLOUR IS `--mrd-viz-1`, NOT A STATUS HUE, and that is
              the whole reason meridian.css keeps a second palette. This line
              answers "which series is this", which is CATEGORICAL; the five
              semantic hues answer "what does this MEAN", and painting a spend
              line with one of them would tell a reader that spending money is
              a status. It replaces `var(--tangerine)`, which was the same
              instinct reaching into a retired layer for a colour nobody could
              audit. */}
          <div className="mt-mrd-4">
            <GraphSlider
              data={filled}
              labels={dayLabels}
              w={340}
              h={140}
              color="var(--mrd-viz-1)"
              formatValue={fmtUsd}
              ariaLabel="Daily spend over the last 7 days"
            />
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
          /* No tone: a share of spend is a measurement, not a verdict. */
          onOpen={() =>
            navigate({
              to: "/team",
              search: { tab: "spend", room: "spend", view: "by-agent", roomAgent: a.slug },
            })
          }
        />
      ))}
    </div>
  );
}

// PC-06's activation funnel left this room (IA 2026-07-11): it is an operator
// metric, so it lives on the admin observability surface now. An old
// ?view=funnel deep link falls back to the trend view via the route's
// unknown-view normalization (_authenticated.engine-room.tsx). It used to say
// RoomDetail, which was a second chassis nothing rendered and is now deleted.

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
