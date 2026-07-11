import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AuroraCard, MonoLabel, GraphSlider } from "@/components/obsidian";
import { getEvalHealth } from "@/lib/eval-health.functions";
import { getGuardrailHitCount } from "@/lib/guardrails.functions";
import { EVAL_COVERAGE_TARGETS } from "@/lib/evals/coverage";
import { Row, ErrorRetry, PanelPending, type RoomBodyProps } from "../RoomDetail";

// RPT-18: the canonical surface ids already used for eval coverage (evals/coverage.ts) get a
// friendly label here too, so "Calibration by surface" reads as "Roadmap" not the raw "roadmap"
// slug. A surface outside this canonical list (an older/custom suite) still renders, just
// title-cased from the real value — never invented.
const SURFACE_LABELS: Record<string, string> = Object.fromEntries(
  EVAL_COVERAGE_TARGETS.map((t) => [t.surface, t.label.split(",")[0]!.trim()]),
);
function surfaceLabel(surface: string): string {
  if (surface === "unassigned") return "Unassigned";
  return SURFACE_LABELS[surface] ?? surface.charAt(0).toUpperCase() + surface.slice(1);
}

// LOOM W2 fold: /govern's evals (SUITES, with the ?suite= drill), drift
// (DRIFT, with the ?surface= drill), prompts (PROMPTS - Prompt Studio's
// first reachable home since /prompts went lossy) and gauntlet (PROOF) all
// live in this room now. Lazy-loaded; the OBS-01 bridge keeps them coherent
// dark. EvalsPanel is v4-reskinned (one of the four most-used views); the
// others carry a lighter pass, noted for W4.
const EvalsPanel = React.lazy(() =>
  import("@/components/governance/EvalsPanel").then((m) => ({ default: m.EvalsPanel })),
);
const EvalSuiteDetail = React.lazy(() =>
  import("@/components/governance/EvalSuiteDetail").then((m) => ({ default: m.EvalSuiteDetail })),
);
const DriftPanel = React.lazy(() =>
  import("@/components/observe/DriftPanel").then((m) => ({ default: m.DriftPanel })),
);
const DriftSurfaceDetail = React.lazy(() =>
  import("@/components/observe/DriftSurfaceDetail").then((m) => ({
    default: m.DriftSurfaceDetail,
  })),
);
const PromptsPanel = React.lazy(() =>
  import("@/components/governance/PromptsPanel").then((m) => ({ default: m.PromptsPanel })),
);
const GauntletMetricsPanel = React.lazy(() =>
  import("@/components/observe/GauntletMetricsPanel").then((m) => ({
    default: m.GauntletMetricsPanel,
  })),
);
const EvalCalibrationPanel = React.lazy(() =>
  import("@/components/engine-room/EvalCalibrationPanel").then((m) => ({
    default: m.EvalCalibrationPanel,
  })),
);
// RPT-50: the self-improvement engine, surfaced as a Quality view. Reads
// Cadence's OWN quality signals and lists the deterministic improvements it
// would make to itself (failing evals, over-corrected agents, losing playbooks).
const SelfImprovementPanel = React.lazy(() =>
  import("@/components/engine-room/SelfImprovementPanel").then((m) => ({
    default: m.SelfImprovementPanel,
  })),
);

/** RPT-18: one rigor stat (a mono label above a real, tabular-nums figure). Local to this view —
 * not promoted to a shared primitive since AuroraCard already owns the "one hero number" slot and
 * this is deliberately a smaller, secondary figure beside it. */
function RigorStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <MonoLabel tone="muted">{label}</MonoLabel>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-h4, 20px)",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ScoreView() {
  const navigate = useNavigate();
  const fHealth = useServerFn(getEvalHealth);
  const fGuardrailHits = useServerFn(getGuardrailHitCount);
  const q = useQuery({ queryKey: ["eval-health"], queryFn: () => fHealth() });
  // A second, independent read (RPT-18): guardrail activity is a different table/room's story
  // (Safety), so its own failure never blocks the eval pass rate from rendering — it just shows
  // "-" for its own stat, same honesty rule as everything else here.
  const hitsQ = useQuery({ queryKey: ["guardrail-hit-count"], queryFn: () => fGuardrailHits() });
  // Honesty (LOOM §9b): a failed read is an error with a retry, never the
  // "no eval runs yet" card.
  if (q.isError) {
    return <ErrorRetry message="Eval health did not load." onRetry={() => void q.refetch()} />;
  }
  if (q.isLoading) return <PanelPending />;
  const health = q.data?.health;
  const calibration = q.data?.calibrationBySurface ?? [];
  const passRatePct = health?.passRate != null ? Math.round(health.passRate * 100) : null;
  const trend = health?.scoreTrend ?? [];
  // Scope-labeled, plain words (LOOM section 9b: a figure ships with its
  // meaning and its scope; never the raw "unknown · watch" telemetry pair).
  const TREND_WORDS: Record<string, string> = {
    improving: "improving",
    declining: "declining",
    stable: "holding steady",
    unknown: "too few runs to call a trend",
  };
  const note =
    health && passRatePct != null
      ? `across ${health.totalRuns} run${health.totalRuns === 1 ? "" : "s"} · ${TREND_WORDS[health.trend] ?? "too few runs to call a trend"}`
      : "no eval runs yet";
  return (
    <div className="flex flex-col gap-3">
      <AuroraCard
        label="PASS RATE"
        value={passRatePct != null ? `${passRatePct}%` : "-"}
        note={note}
        hue={
          health?.verdict === "at-risk"
            ? "failing"
            : health?.verdict === "watch"
              ? "attention"
              : "healthy"
        }
      />
      {trend.length >= 2 ? (
        <div>
          <MonoLabel tone="muted">SCORE · RECENT RUNS</MonoLabel>
          {/* Interactive trend (teal, the machine-measured family): scrub to
              read each run's score, peak/low always shown. */}
          <div style={{ marginTop: 10 }}>
            <GraphSlider
              data={trend}
              w={340}
              h={140}
              color="var(--teal)"
              formatValue={(v) => String(Math.round(v))}
              ariaLabel="Eval score across recent runs"
            />
          </div>
        </div>
      ) : null}

      {/* RPT-18: "live rigor" — the two counts that back up "is the machine
          still good" with real evidence, not just one pooled rate. Both
          numbers are already running in production (eval runs, guardrail
          hits); this only exposes them together in the one screen that
          already answers the quality question. Exposure, not construction. */}
      <div className="flex gap-8 flex-wrap" style={{ marginTop: 4 }}>
        <RigorStat
          label="EVALS RUN"
          value={health ? health.totalRuns.toLocaleString("en-US") : "0"}
        />
        <RigorStat
          label="GUARDRAIL HITS"
          value={
            hitsQ.isError
              ? "—"
              : hitsQ.isLoading
                ? "…"
                : (hitsQ.data?.count ?? 0).toLocaleString("en-US")
          }
        />
      </div>

      {calibration.length > 0 ? (
        <div style={{ marginTop: 4 }}>
          <MonoLabel tone="muted">CALIBRATION · BY SURFACE</MonoLabel>
          {/* Drillable (RPT-18): each row opens What we test, straight into
              that surface's one suite when it has exactly one (reusing the
              existing suite detail's runs table + failing-case breakdown —
              no new detail view), or the suite list when a surface spans
              more than one suite. */}
          <div style={{ marginTop: 8 }}>
            {calibration.map((c) => (
              <Row
                key={c.surface}
                subject={surfaceLabel(c.surface)}
                value={c.avgScore != null ? String(Math.round(c.avgScore)) : "no score yet"}
                statusWord={
                  c.passRate != null
                    ? `${Math.round(c.passRate * 100)}% pass`
                    : `${c.runs} run${c.runs === 1 ? "" : "s"}`
                }
                statusColor="var(--text-muted)"
                onOpen={() =>
                  navigate({
                    to: "/engine-room",
                    search: {
                      room: "quality",
                      view: "suites",
                      suite: c.suiteIds.length === 1 ? c.suiteIds[0] : undefined,
                    },
                  })
                }
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function QualityRoom({ view, suite, surface }: RoomBodyProps) {
  if (view === "suites") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        {suite ? <EvalSuiteDetail id={suite} /> : <EvalsPanel />}
      </React.Suspense>
    );
  }
  if (view === "calibration") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <EvalCalibrationPanel />
      </React.Suspense>
    );
  }
  if (view === "drift") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        {surface ? <DriftSurfaceDetail id={surface} /> : <DriftPanel />}
      </React.Suspense>
    );
  }
  if (view === "prompts") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <PromptsPanel />
      </React.Suspense>
    );
  }
  if (view === "proof") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <GauntletMetricsPanel />
      </React.Suspense>
    );
  }
  if (view === "self-improvement") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <SelfImprovementPanel />
      </React.Suspense>
    );
  }
  return <ScoreView />;
}
