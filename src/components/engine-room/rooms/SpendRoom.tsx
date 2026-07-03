import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AuroraCard, MonoLabel, Sparkline } from "@/components/obsidian";
import { getAnalyticsOverview, getAgentSpendBreakdown } from "@/lib/analytics.functions";
import { getBudgetOverview } from "@/lib/budgets.functions";
import { zeroFillDaily } from "@/lib/engine-room-glance";
import { Row, EmptyRow } from "../RoomDetail";

function fmtUsd(n: number): string {
  return n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function TrendView() {
  const fAnalytics = useServerFn(getAnalyticsOverview);
  // Same keys as EngineRoomSurface's glance queries. TanStack Query dedupes,
  // so opening this tab right after the glance is an instant cache hit.
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
  // Same query as the totals above (queryKey ["analytics-overview", 7]), so
  // this is a cache hit, not a second fetch. Zero-filled to a fixed 7-day
  // window (getAnalyticsOverview's `daily` omits a day with no events
  // entirely, and Sparkline plots by index) so a quiet day renders as a
  // real zero, not as if it were adjacent to its neighbors.
  const filled = zeroFillDaily(cost7Q.data?.daily ?? [], 7);
  return (
    <div className="flex flex-col gap-3">
      <AuroraCard
        label="SPEND THIS WEEK"
        value={fmtUsd(week)}
        note={
          prevWeek > 0
            ? `${trendPct >= 0 ? "+" : ""}${trendPct}% vs the week before`
            : "no prior week to compare"
        }
      />
      {cost7Q.data && filled.some((c) => c > 0) ? (
        <div>
          <MonoLabel tone="muted">SPEND · LAST 7 DAYS</MonoLabel>
          <Sparkline data={filled} w={260} h={44} />
        </div>
      ) : null}
    </div>
  );
}

function ByAgentView() {
  const navigate = useNavigate();
  const fByAgent = useServerFn(getAgentSpendBreakdown);
  const q = useQuery({
    queryKey: ["analytics-by-agent", 30],
    queryFn: () => fByAgent({ data: { days: 30 } }),
  });
  const agents = q.data?.agents ?? [];
  if (!q.isLoading && agents.length === 0) {
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
          onOpen={() => navigate({ to: "/govern", search: { tab: "analytics", agent: a.slug } })}
        />
      ))}
    </div>
  );
}

function CapsView() {
  const fBudget = useServerFn(getBudgetOverview);
  const q = useQuery({ queryKey: ["budget_overview"], queryFn: () => fBudget() });
  const surfaces = q.data?.surfaces ?? [];
  if (!q.isLoading && surfaces.length === 0) {
    return (
      <EmptyRow message="No per-surface caps set. Every AI surface shares the global budget." />
    );
  }
  return (
    <div>
      {surfaces.map(
        (s: { surface: string; daily_usd_cap: number | string | null; enabled: boolean }) => (
          <Row
            key={s.surface}
            subject={s.surface}
            value={s.daily_usd_cap != null ? `${fmtUsd(Number(s.daily_usd_cap))}/day` : "no cap"}
            statusWord={s.enabled ? "on" : "off"}
            statusColor={s.enabled ? "var(--moss-bright)" : "var(--text-faint)"}
          />
        ),
      )}
    </div>
  );
}

export function SpendRoom({ view }: { view: string }) {
  if (view === "by-agent") return <ByAgentView />;
  if (view === "caps") return <CapsView />;
  return <TrendView />;
}
