import { useServerFn } from "@tanstack/react-start";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getBudgetOverview } from "@/lib/budgets.functions";
import { getAnalyticsOverview } from "@/lib/analytics.functions";
import { getValueReceipts } from "@/lib/value-receipts.functions";
import { getEvalHealth } from "@/lib/eval-health.functions";
import { getDriftOverview } from "@/lib/drift.functions";
import { getGuardrailOverview } from "@/lib/guardrails.functions";
import { getIncidents } from "@/lib/incidents.functions";
import { listTraces } from "@/lib/traces.functions";
import { getLedgerSeal } from "@/lib/trust-ledger.functions";
import {
  buildSpendGlance,
  buildQualityGlance,
  buildSafetyGlance,
  buildRecordGlance,
  GUARDRAIL_HIT_READ_LIMIT,
  TRACE_READ_LIMIT,
  type RoomGlance,
  type RoomKey,
} from "@/lib/engine-room-glance";

/** One room's glance, honestly staged: loading | error | ready. */
export interface RoomStatus {
  key: RoomKey;
  loading: boolean;
  error: string | null;
  glance: RoomGlance | null;
  retry: () => void;
}

function roomStatus(
  key: RoomKey,
  queries: UseQueryResult<unknown>[],
  build: () => RoomGlance,
): RoomStatus {
  const failed = queries.filter((q) => q.isError);
  const retry = () => {
    for (const q of failed) void q.refetch();
  };
  if (failed.length > 0) {
    const cause = failed[0]!.error;
    return {
      key,
      loading: false,
      error: cause instanceof Error ? cause.message : "The read failed.",
      glance: null,
      retry,
    };
  }
  if (queries.some((q) => q.isLoading)) {
    return { key, loading: true, error: null, glance: null, retry };
  }
  return { key, loading: false, error: null, glance: build(), retry };
}

/** Shared glance data source: the engine-room route and the room bodies it
 * mounts need the same four verdicts, so the reads live in one hook rather
 * than being wired twice. TanStack Query dedupes by key regardless of which
 * mounts first. (This named RoomDetail as the second consumer; that was a
 * chassis nothing rendered and it is deleted.)
 *
 * Honesty (LOOM §9b): every room reports its own loading/error/ready state;
 * a failed read renders as an error, never as a healthy verdict. */
export function useEngineRoomGlance(): {
  rooms: RoomStatus[];
  throughput: { totalRuns: number; decisionsClosed: number; prsShipped: number };
} {
  const fBudget = useServerFn(getBudgetOverview);
  const fAnalytics = useServerFn(getAnalyticsOverview);
  const fEvalHealth = useServerFn(getEvalHealth);
  const fDrift = useServerFn(getDriftOverview);
  const fGuardrails = useServerFn(getGuardrailOverview);
  const fIncidents = useServerFn(getIncidents);
  const fTraces = useServerFn(listTraces);
  const fSeal = useServerFn(getLedgerSeal);
  const fReceipts = useServerFn(getValueReceipts);

  const budgetQ = useQuery({ queryKey: ["budget_overview"], queryFn: () => fBudget() });
  const cost7Q = useQuery({
    queryKey: ["analytics-overview", 7],
    queryFn: () => fAnalytics({ data: { days: 7 } }),
  });
  // Same key as the Quality room's SCORE view: the glance and the score card
  // share one cached read of one report (the audit's three-way-conflict fix).
  const evalHealthQ = useQuery({ queryKey: ["eval-health"], queryFn: () => fEvalHealth() });
  const driftQ = useQuery({ queryKey: ["drift_overview"], queryFn: () => fDrift() });
  const guardrailsQ = useQuery({ queryKey: ["guardrails"], queryFn: () => fGuardrails() });
  const incidentsQ = useQuery({ queryKey: ["incidents"], queryFn: () => fIncidents() });
  // The glance needs a count, not an archive: 7 days (window named in the
  // verdict), against the audit's 30-day/200-row count-only read (D-43).
  //
  // The limit is named once, in the pure module, and passed to the builder as
  // well as to the query, so the number that truncates the read and the number
  // that words the verdict cannot drift apart. See TRACE_READ_LIMIT.
  const tracesQ = useQuery({
    queryKey: ["traces", 7, "all"],
    queryFn: () => fTraces({ data: { days: 7, status: "all", limit: TRACE_READ_LIMIT } }),
  });
  const sealQ = useQuery({ queryKey: ["ledger-seal"], queryFn: () => fSeal({ data: {} }) });
  // RPT-09: the "While you worked" amplifier strip reads value-receipts (RPT-33 --
  // honest counted decisions + PRs, no fabricated hours) alongside the already-fetched
  // 7-day totalRuns from the spend read.
  const receiptsQ = useQuery({ queryKey: ["value-receipts"], queryFn: () => fReceipts() });

  /**
   * THE VOLUMES WERE ALWAYS HERE. Every field added below 2026-08-06 is read
   * out of a query this hook already made and already paid for; not one of them
   * costs a round trip. The founder's complaint that the four rooms say nothing
   * until you click was, underneath, a complaint that this function fetched
   * nine reports and forwarded four sentences of them.
   *
   * A field is passed only where the query genuinely answers it, and every one
   * is optional on the builder side, so a read that came back thin produces a
   * shorter card rather than a card full of zeros.
   */
  const rooms: RoomStatus[] = [
    roomStatus("spend", [budgetQ, cost7Q], () =>
      buildSpendGlance({
        global: budgetQ.data?.global ?? null,
        costThisWeek: cost7Q.data?.summary.totalCost ?? 0,
        missionCapUsd: budgetQ.data?.missionCapUsd ?? null,
        callsThisWeek: cost7Q.data?.summary.totalRuns,
        tokensThisWeek: cost7Q.data?.summary.totalTokens,
        failedThisWeek: cost7Q.data?.summary.errors,
        byModel: cost7Q.data?.byModel,
        daily: cost7Q.data?.daily,
        // Without this the trend stands down (see SpendGlanceInput): a capped
        // read drops its OLDEST days, and a zero-filled missing day reads as a
        // real $0.00 that never happened.
        windowIsWhole: cost7Q.data?.windowIsWhole,
      }),
    ),
    roomStatus("quality", [evalHealthQ, driftQ], () =>
      buildQualityGlance({
        passRate: evalHealthQ.data?.health.passRate ?? null,
        totalRuns: evalHealthQ.data?.health.totalRuns ?? 0,
        verdict: evalHealthQ.data?.health.verdict ?? "no-data",
        driftOpenCount: driftQ.data?.openIncidents.length ?? 0,
        avgScore: evalHealthQ.data?.health.avgScore ?? null,
        errorRate: evalHealthQ.data?.health.errorRate,
        suiteCount: evalHealthQ.data?.health.suites.length,
        flakyCount: evalHealthQ.data?.health.flakySuites.length,
        trend: evalHealthQ.data?.health.trend,
        // getDriftOverview orders open incidents by detected_at descending, so
        // index 0 is genuinely the newest and no re-sort is needed here.
        latestDrift: driftQ.data?.openIncidents[0] ?? null,
      }),
    ),
    roomStatus("safety", [guardrailsQ, incidentsQ], () =>
      buildSafetyGlance({
        rules: guardrailsQ.data?.rules ?? [],
        incidentCount: incidentsQ.data?.count ?? 0,
        // Without this the verdict prints a ceiling as a total. See
        // buildSafetyGlance: the read is capped at forty after merging five
        // sources that are each capped at twenty.
        incidentsCapped: incidentsQ.data?.capped,
        floorCount: guardrailsQ.data?.floor.length,
        hits: guardrailsQ.data?.hits,
        hitLimit: GUARDRAIL_HIT_READ_LIMIT,
        // getIncidentsInternal sorts by `at` descending before it slices, so
        // index 0 is the newest incident across all four of its sources.
        incidents: incidentsQ.data?.incidents,
      }),
    ),
    roomStatus("record", [tracesQ, sealQ], () =>
      buildRecordGlance({
        traceCount: tracesQ.data?.traces.length ?? 0,
        ledgerVerifies: sealQ.data?.available ?? false,
        traceLimit: TRACE_READ_LIMIT,
        // listTraces sorts by last_at descending, so index 0 is the newest run.
        traces: tracesQ.data?.traces,
        sealCount: sealQ.data?.count,
        // Without this the card claims the fingerprint covers the whole ledger
        // when it covers the newest SEAL_LIMIT receipts. See buildRecordGlance.
        sealCapped: (sealQ.data as { capped?: boolean } | undefined)?.capped,
      }),
    ),
  ];

  return {
    rooms,
    throughput: {
      totalRuns: cost7Q.data?.summary.totalRuns ?? 0,
      decisionsClosed: receiptsQ.data?.decisionsClosed ?? 0,
      prsShipped: receiptsQ.data?.prsShipped ?? 0,
    },
  };
}
