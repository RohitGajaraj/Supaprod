// BRN-01: the compounding metrics strip + a growth-over-time read on the
// Brain graph itself. Composes what already exists (memory depth + lift from
// the Gauntlet, FS-01's calibration read) with one client-side computation
// (weekly node growth from the already-fetched graph): no new heavy
// machinery. W3 (Loom): v4 tokens, plain words ("beliefs revised", not
// supersession jargon), tabular numerals.
import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMemoryCompounding, getMemoryLift } from "@/lib/gauntlet.functions";
import { getForecastCalibration } from "@/lib/brain-insights.functions";
import { MonoLabel } from "@/components/obsidian/primitives";
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
      <div
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 450,
          fontSize: 19,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>
      <MonoLabel style={{ fontSize: "var(--text-mono-floor)", marginTop: 2, display: "block" }}>
        {label}
      </MonoLabel>
      <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export function GraphCompoundingStrip({
  nodes,
  beliefsRevised,
}: {
  nodes: GraphNode[];
  /** Count of live supersession threads in the current view (real edges only). */
  beliefsRevised: number;
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
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--top-light)",
        padding: "14px 18px",
        marginBottom: 12,
      }}
    >
      <MonoLabel style={{ marginBottom: 8, display: "block" }}>your brain, compounding</MonoLabel>
      <div className="flex flex-wrap items-start" style={{ gap: 22 }}>
        <Stat label="memory depth" value={depthValue} sub={depthSub} />
        <Stat label="lift" value={liftValue} sub={liftSub} />
        <Stat label="beliefs revised" value={String(beliefsRevised)} sub="in this view" />
        <Stat label="prediction hit rate" value={predValue} sub={predSub} />
        <div style={{ minWidth: 140, flex: 1 }}>
          <MonoLabel
            style={{ fontSize: "var(--text-mono-floor)", marginBottom: 4, display: "block" }}
          >
            growth, last {WEEKS} weeks
          </MonoLabel>
          <div className="flex items-end" style={{ gap: 3, height: 24 }}>
            {growth.map((count, i) => (
              <div
                key={i}
                title={`${count} node${count === 1 ? "" : "s"}`}
                style={{
                  flex: 1,
                  height: `${Math.max(2, (count / maxGrowth) * 24)}px`,
                  background: count > 0 ? "var(--teal)" : "var(--hairline)",
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
