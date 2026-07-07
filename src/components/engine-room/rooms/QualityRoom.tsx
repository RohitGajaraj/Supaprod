import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AuroraCard, MonoLabel, GraphSlider } from "@/components/obsidian";
import { getEvalHealth } from "@/lib/eval-health.functions";
import { ErrorRetry, PanelPending, type RoomBodyProps } from "../RoomDetail";

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

function ScoreView() {
  const fHealth = useServerFn(getEvalHealth);
  const q = useQuery({ queryKey: ["eval-health"], queryFn: () => fHealth() });
  // Honesty (LOOM §9b): a failed read is an error with a retry, never the
  // "no eval runs yet" card.
  if (q.isError) {
    return <ErrorRetry message="Eval health did not load." onRetry={() => void q.refetch()} />;
  }
  if (q.isLoading) return <PanelPending />;
  const health = q.data?.health;
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
  return <ScoreView />;
}
