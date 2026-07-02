import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AuroraCard } from "@/components/obsidian";
import { listEvalSuites, getEvalScoreTrends } from "@/lib/evals.functions";
import { getEvalHealth } from "@/lib/eval-health.functions";
import { getDriftOverview } from "@/lib/drift.functions";
import { Row, EmptyRow } from "../RoomDetail";

function ScoreView() {
  const fHealth = useServerFn(getEvalHealth);
  const q = useQuery({ queryKey: ["eval-health"], queryFn: () => fHealth() });
  const health = q.data?.health;
  const passRatePct = health?.passRate != null ? Math.round(health.passRate * 100) : null;
  return (
    <AuroraCard
      label="PASS RATE"
      value={passRatePct != null ? `${passRatePct}%` : "-"}
      note={health ? `${health.trend} · ${health.verdict}` : "no eval runs yet"}
      hue={
        health?.verdict === "at-risk"
          ? "failing"
          : health?.verdict === "watch"
            ? "attention"
            : "healthy"
      }
    />
  );
}

function DriftView() {
  const navigate = useNavigate();
  const fDrift = useServerFn(getDriftOverview);
  const q = useQuery({ queryKey: ["drift_overview"], queryFn: () => fDrift() });
  const open = q.data?.openIncidents ?? [];
  if (!q.isLoading && open.length === 0) {
    return (
      <EmptyRow message="No open drift. The last check found every surface within baseline." />
    );
  }
  return (
    <div>
      {open.map((i: { surface: string; severity: string; detected_at: string }, idx: number) => (
        <Row
          key={`${i.surface}-${idx}`}
          subject={i.surface}
          value={new Date(i.detected_at).toLocaleDateString()}
          statusWord={i.severity}
          statusColor={i.severity === "high" ? "var(--madder-bright)" : "var(--marigold)"}
          onOpen={() => navigate({ to: "/govern", search: { tab: "drift", surface: i.surface } })}
        />
      ))}
    </div>
  );
}

function SuitesView() {
  const navigate = useNavigate();
  const fSuites = useServerFn(listEvalSuites);
  const fTrends = useServerFn(getEvalScoreTrends);
  const suitesQ = useQuery({ queryKey: ["eval_suites"], queryFn: () => fSuites() });
  const trendsQ = useQuery({ queryKey: ["eval_suite_trends"], queryFn: () => fTrends() });
  const suites = suitesQ.data ?? [];
  if (!suitesQ.isLoading && suites.length === 0) {
    return (
      <EmptyRow message="No eval yet. Point a suite at a prompt and the score lands in about five minutes." />
    );
  }
  return (
    <div>
      {suites.map((s) => {
        const t = trendsQ.data?.trends[s.id];
        const arrow =
          !t || t.previous == null
            ? "→"
            : t.latest > t.previous
              ? "↑"
              : t.latest < t.previous
                ? "↓"
                : "→";
        return (
          <Row
            key={s.id}
            subject={s.name}
            value={
              s.last_run?.avg_score != null ? `${Math.round(s.last_run.avg_score)}` : "no runs"
            }
            statusWord={arrow}
            statusColor="var(--text-muted)"
            onOpen={() => navigate({ to: "/govern", search: { tab: "evals", suite: s.id } })}
          />
        );
      })}
    </div>
  );
}

export function QualityRoom({ view }: { view: string }) {
  if (view === "drift") return <DriftView />;
  if (view === "suites") return <SuitesView />;
  return <ScoreView />;
}
