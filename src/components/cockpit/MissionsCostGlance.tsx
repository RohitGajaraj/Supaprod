import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCostPerOutcome } from "@/lib/cost-per-outcome.functions";
import { getAnalyticsOverview } from "@/lib/analytics.functions";
import { fmtCost } from "@/components/studio/studio-format";

// ENG-06 (Part B2) - the cost-per-outcome "manager's glance" on the Build header.
// The founder's "agent manager" ask expressed doctrine-safe: a single calm, outcome-framed
// line (what the fleet shipped this week, then what it cost), NOT a control-room metrics
// panel. Stays silent on a quiet week so the header reads calm.
//
// LOOM v4 (W2-BUILD, audit D-10): the dollar figure previously summed
// agent_runs.spend_used_usd while the Engine Room's Spend room summed
// ai_events.est_cost_usd; the two disagreed on the same screen pair ($0.01 vs
// $0.21). The glance now reads the SAME server fn, same 7-day window, same
// query key (["analytics-overview", 7]) and same format as the Spend room, so
// Build and the Engine Room can never quote different spend. Outcome counts
// and the monthly budget line still come from getCostPerOutcome (they are not
// spend telemetry).
// Engine-Room: per-run agent spend + outcome counts -> one calm "this week ... for $X" line
// atop Build -> the full per-window unit economics stay behind Engine Room > Spend.

export function MissionsCostGlance() {
  const fetchCost = useServerFn(getCostPerOutcome);
  const fetchAnalytics = useServerFn(getAnalyticsOverview);
  const q = useQuery({ queryKey: ["cost-per-outcome"], queryFn: () => fetchCost() });
  // Same key + fn as the Engine Room Spend room's TrendView: TanStack Query
  // dedupes, so whichever surface loads second is a cache hit.
  const spendQ = useQuery({
    queryKey: ["analytics-overview", 7],
    queryFn: () => fetchAnalytics({ data: { days: 7 } }),
  });
  const d = q.data;
  if (!d || !spendQ.data) return null;
  const weekSpendUsd = spendQ.data.summary.totalCost;

  // LOOM QA R2 (§9b honesty): each outcome carries its own verb — specs are
  // drafted, decisions are recorded (never "shipped"), missions ship. The old
  // shared "the fleet shipped 12 decisions · 1 shipped" read garbled and
  // claimed the wrong verb for decisions.
  const outcomes = [
    d.specs > 0 ? `${d.specs} spec${d.specs === 1 ? "" : "s"} drafted` : null,
    d.decisions > 0 ? `${d.decisions} decision${d.decisions === 1 ? "" : "s"} recorded` : null,
    d.missions > 0 ? `${d.missions} mission${d.missions === 1 ? "" : "s"} shipped` : null,
  ].filter((x): x is string => x !== null);

  // Quiet week (nothing shipped, nothing spent): stay silent, keep the header calm.
  if (outcomes.length === 0 && weekSpendUsd === 0) return null;

  return (
    <div
      className="mono-label tabular-nums"
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "var(--geist-space-2x)",
        flexWrap: "wrap",
        marginTop: 12,
        color: "var(--text-subtle)",
      }}
    >
      <span style={{ color: "var(--text-subtle)" }}>This week</span>
      <span style={{ color: "var(--text-primary)" }}>
        {outcomes.length > 0 ? outcomes.join(" · ") : "no outcomes yet"}
      </span>
      <span style={{ color: "var(--text-subtle)" }}>for</span>
      <span style={{ color: "var(--text-primary)" }}>{fmtCost(weekSpendUsd)}</span>
      {d.monthCapUsd != null && (
        <span style={{ color: "var(--text-subtle)" }}>
          · ${d.monthUsedUsd.toFixed(2)} of ${d.monthCapUsd.toFixed(0)} this month
        </span>
      )}
    </div>
  );
}
