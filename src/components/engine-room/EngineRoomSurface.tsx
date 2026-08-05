import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/supaprod/PageHeader";
import { PixelStat } from "@/components/supaprod/PixelStat";
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
import { RoomCard, RoomCardSkeleton, RoomCardError } from "./RoomCard";
import { ConnectionStrip } from "./ConnectionStrip";

/** LOOM §4b: the Engine Room is a work surface - fluid to --container-work
 * (1520px), not the 1060px standard cap. Local to this folder because the
 * shared Surface component is other lanes' dependency. */
export function EngineRoomContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        // width:100% matters: the shell's <main> is a column flexbox, and a
        // flex item with cross-axis auto margins gives up stretch and
        // shrink-wraps its content. Without it the room grid rendered ~650px
        // wide at 1440 - the exact "floats like a phone layout" defect §4b
        // exists to kill.
        width: "100%",
        maxWidth: "var(--container-work)",
        margin: "0 auto",
        padding: "var(--page-inset-v) var(--page-inset-h) 64px",
        animation: "cadRise 260ms var(--ease) both",
        // Loom §2b: anchors + clips the glance's glow field (harmless for
        // RoomDetail, which renders no glow).
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

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

/** Shared glance data source: EngineRoomSurface (the grid) and RoomDetail
 * (a single room's header) both need the same four verdicts, so the read
 * queries live in one hook rather than being wired twice. TanStack Query
 * dedupes by key regardless of which mounts first.
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

/** The glance: hero, 2x2 room grid, connection strip. Every number is a
 * read-only consumer of an existing query (OBS-09 §3 no-feature-work
 * boundary). Nothing here writes. The four doors are always visible (LOOM
 * §0: nothing hidden); an all-healthy day earns one quiet line, never a
 * banner that swallows the grid.
 *
 * IA 2026-07-11: renders bare (no container) so the route can seat it in the
 * content column beside the persistent RoomRail switcher. */
export function EngineRoomGlance() {
  const navigate = useNavigate({ from: "/engine-room" });
  const { rooms, throughput } = useEngineRoomGlance();
  const showThroughput =
    throughput.totalRuns > 0 || throughput.decisionsClosed > 0 || throughput.prsShipped > 0;
  // "healthy" is now one of THREE states, so this has to test for it by name
  // rather than by "not watch". Before the unconfigured state existed the two
  // were the same test; they are not any more, and a room nobody has switched
  // on must not light the moss glow or print the all-healthy line.
  const allHealthy =
    rooms.length > 0 && rooms.every((r) => r.glance !== null && r.glance.state === "healthy");
  // Loom §2b glow tone: moss on an all-healthy day, ember when any room asks
  // for attention, no tone (glacier default) while the verdicts are loading.
  const anyAttention = rooms.some((r) => r.glance !== null && r.glance.state !== "healthy");
  const glowTone = allHealthy ? "moss" : anyAttention ? "ember" : undefined;
  const openRoom = (key: RoomKey) => navigate({ search: { room: key } });

  return (
    <div>
      {/* Loom §2b glow field: the one ambient wash behind the hero (absolute,
          anchored + clipped by EngineRoomContainer, which the route still
          renders as this column's ancestor). */}
      <div aria-hidden="true" className="loom-glow-field" data-tone={glowTone} />
      <PageHeader
        title="The engine, at a"
        accent="glance."
        subtitle="Four rooms, one verdict each. Approvals find you on Today; the rooms keep the record."
        usp="Full observability for autonomous work: spend, quality, safety, and a receipt for every action the machine takes."
      />

      {/* RPT-09: the "While you worked" amplifier strip. Real counts only (this
          week's AI actions from the already-fetched analytics read + RPT-33's honest
          decisions-closed / PRs-shipped, no fabricated hours). Renders only when there
          is something to show, so a brand-new workspace never sees an empty shell. */}
      {showThroughput ? (
        <div
          style={{
            marginBottom: allHealthy ? "10px" : "18px",
            padding: "13px 16px",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--hairline)",
            background: "var(--surface-recessed)",
          }}
        >
          <div
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              color: "var(--text-subtle)",
              marginBottom: 6,
            }}
          >
            While you worked
          </div>
          {/* Lead with this week's actions when there are any; a flat "ran 0 actions
              this week" would undercut the amplifier framing, so a quiet week leads
              with the to-date stats below instead. */}
          {throughput.totalRuns > 0 ? (
            <p style={{ color: "var(--text-primary)", margin: 0 }}>
              Supaprod ran <PixelStat value={throughput.totalRuns} tone="blue" size={16} glow />{" "}
              {throughput.totalRuns === 1 ? "action" : "actions"} for you this week.
            </p>
          ) : null}
          {throughput.decisionsClosed > 0 || throughput.prsShipped > 0 ? (
            <p
              style={{
                fontSize: throughput.totalRuns > 0 ? 12.5 : "var(--tempo-text-base)",
                color: throughput.totalRuns > 0 ? "var(--text-subtle)" : "var(--text-primary)",
                margin: throughput.totalRuns > 0 ? "4px 0 0" : 0,
              }}
            >
              {throughput.decisionsClosed}{" "}
              {throughput.decisionsClosed === 1 ? "decision" : "decisions"} closed to date ·{" "}
              {throughput.prsShipped} {throughput.prsShipped === 1 ? "PR" : "PRs"} shipped to date
            </p>
          ) : null}
          <p
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--text-muted)",
              margin: "8px 0 0",
            }}
          >
            Your judgment, amplified and compounding.
          </p>
        </div>
      ) : null}

      {allHealthy ? (
        <p
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            color: "var(--moss-bright)",
            margin: "0 0 18px",
          }}
        >
          All four rooms are healthy
        </p>
      ) : null}

      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: "14px", marginBottom: "20px" }}
      >
        {rooms.map((room) => {
          if (room.error !== null) {
            return (
              <RoomCardError
                key={room.key}
                room={room.key}
                message={room.error}
                onRetry={room.retry}
              />
            );
          }
          if (room.loading || room.glance === null) {
            return <RoomCardSkeleton key={room.key} room={room.key} />;
          }
          return <RoomCard key={room.key} glance={room.glance} onOpen={() => openRoom(room.key)} />;
        })}
      </div>

      <ConnectionStrip />
    </div>
  );
}
