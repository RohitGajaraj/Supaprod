// BRN-01: the compounding metrics strip + a growth-over-time read on the Brain
// graph itself. Composes what already exists (memory depth + lift from the
// Gauntlet, FS-01's calibration read) with one client-side computation (weekly
// node growth from the already-fetched graph): no new heavy machinery.
import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMemoryCompounding, getMemoryLift } from "@/lib/gauntlet.functions";
import { getForecastCalibration } from "@/lib/brain-insights.functions";
import { MonoLabel } from "@/components/cadence/Primitives";
import type { GraphNode } from "@/lib/knowledge-graph-view";

const WEEK_MS = 7 * 86_400_000;
const WEEKS = 8;

function weeklyGrowth(nodes: GraphNode[]): number[] {
  const buckets = new Array(WEEKS).fill(0) as number[];
  const now = Date.now();
  for (const n of nodes) {
    if (!n.createdAt) continue;
    const t = Date.parse(n.createdAt);
    if (Number.isNaN(t)) continue;
    const idx = WEEKS - 1 - Math.floor((now - t) / WEEK_MS);
    if (idx >= 0 && idx < WEEKS) buckets[idx]++;
  }
  return buckets;
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ minWidth: 110 }}>
      <div className="font-display tabular-nums" style={{ fontSize: 18, color: "var(--ink)" }}>
        {value}
      </div>
      <div className="mono-label" style={{ fontSize: 8, color: "var(--ink-faint)", marginTop: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 10, color: "var(--ink-subtle)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export function GraphCompoundingStrip({
  nodes,
  supersessionsCaught,
}: {
  nodes: GraphNode[];
  supersessionsCaught: number;
}) {
  const fMem = useServerFn(getMemoryCompounding);
  const fLift = useServerFn(getMemoryLift);
  const fCalibration = useServerFn(getForecastCalibration);

  const memQ = useQuery({ queryKey: ["gauntlet-memory"], queryFn: () => fMem() });
  const liftQ = useQuery({
    queryKey: ["gauntlet-memory-lift"],
    queryFn: () => fLift({ data: { days: 90 } }),
  });
  const calibrationQ = useQuery({
    queryKey: ["forecast-calibration"],
    queryFn: () => fCalibration(),
  });

  const growth = useMemo(() => weeklyGrowth(nodes), [nodes]);
  const maxGrowth = Math.max(1, ...growth);

  const mem = memQ.data;
  const lift = liftQ.data;
  const prediction = calibrationQ.data?.prediction;

  const depthValue = mem?.tableReady && mem.stored > 0 ? String(mem.stored) : "-";
  const depthSub = mem?.tableReady
    ? mem.stored > 0
      ? `+${mem.newThisWeek} this week`
      : "not enough data yet"
    : "lights up on next sync";

  const liftValue =
    lift?.tableReady && lift.liftPoints != null
      ? `${lift.liftPoints > 0 ? "+" : ""}${lift.liftPoints}pt`
      : "-";
  const liftSub =
    lift?.tableReady && lift.liftPoints != null
      ? "richer precedent, validated more"
      : "not enough data yet";

  const predValue = prediction?.hitRate != null ? `${Math.round(prediction.hitRate * 100)}%` : "-";
  const predSub = prediction?.recentLabel ?? "not enough data yet";

  return (
    <div className="bento" style={{ padding: "var(--card-pad)", marginBottom: 12 }}>
      <MonoLabel style={{ marginBottom: 8 }}>your brain, compounding</MonoLabel>
      <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Stat label="memory depth" value={depthValue} sub={depthSub} />
        <Stat label="lift" value={liftValue} sub={liftSub} />
        <Stat label="supersessions caught" value={String(supersessionsCaught)} sub="in this view" />
        <Stat label="prediction hit rate" value={predValue} sub={predSub} />
        <div style={{ minWidth: 140, flex: 1 }}>
          <div
            className="mono-label"
            style={{ fontSize: 8, color: "var(--ink-faint)", marginBottom: 4 }}
          >
            growth, last {WEEKS} weeks
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 24 }}>
            {growth.map((count, i) => (
              <div
                key={i}
                title={`${count} node${count === 1 ? "" : "s"}`}
                style={{
                  flex: 1,
                  height: `${Math.max(2, (count / maxGrowth) * 24)}px`,
                  background: count > 0 ? "var(--ink-muted, #555555)" : "var(--hairline, #e5e0d8)",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
