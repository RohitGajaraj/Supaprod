// BRN-01: the compounding metrics strip + a growth-over-time read on the
// Brain graph itself. Composes what already exists (memory depth + lift from
// the Gauntlet, FS-01's calibration read) with one client-side computation
// (weekly node growth from the already-fetched graph): no new heavy
// machinery. W3 (Loom): v4 tokens, plain words ("beliefs revised", not
// supersession jargon), tabular numerals.
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMemoryCompounding, getMemoryLift } from "@/lib/gauntlet.functions";
import { getForecastCalibration } from "@/lib/brain-insights.functions";
import { MonoLabel } from "@/components/obsidian/primitives";
import { SketchBar } from "@/components/cadence/Sketch";
import { useWorkspace } from "@/hooks/use-workspace";
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

/** The weekly-growth read, held to the Infographic Law (DESIGN-LOOM dim 16):
 *  hand-drawn bars, a pencil scale hint, and a readable data point on hover. */
function GrowthBars({ growth, max }: { growth: number[]; max: number }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div style={{ minWidth: 150, flex: 1 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
          fontFamily: "var(--font-pencil)",
          fontSize: 12.5,
          color: "var(--text-subtle)",
        }}
      >
        <span>new beliefs per week, last {WEEKS} weeks</span>
        <span>peak {max}</span>
      </div>
      <div
        style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 4, height: 34 }}
      >
        {growth.map((count, i) => {
          const active = hover === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                cursor: "default",
                opacity: hover == null || active ? 1 : 0.45,
                transition: "opacity 160ms var(--ease)",
              }}
            >
              {active ? (
                <div
                  role="tooltip"
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    marginBottom: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                    zIndex: 5,
                    fontFamily: "var(--font-pencil)",
                    fontSize: 13.5,
                    color: "var(--text-primary)",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--hairline-strong)",
                    borderRadius: 8,
                    padding: "4px 9px",
                    boxShadow: "var(--shadow-ambient)",
                  }}
                >
                  {`${count} new, week ${i + 1}`}
                </div>
              ) : null}
              {count > 0 ? (
                <SketchBar
                  pct={Math.max(6, (count / max) * 100)}
                  seed={i + 1}
                  color="var(--ember)"
                  trackH={34}
                />
              ) : (
                <div
                  style={{ width: "100%", height: 2, background: "var(--hairline)", borderRadius: 1 }}
                />
              )}
            </div>
          );
        })}
      </div>
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

  // Keys carry the active workspace so a switch refetches instead of showing
  // the previous workspace's cached numbers (the server fns resolve scope
  // per-session; the cache must not outlive a workspace change).
  const { activeWorkspaceId } = useWorkspace();
  const memQ = useQuery({
    queryKey: ["gauntlet-memory", activeWorkspaceId],
    queryFn: () => fMem(),
  });
  const liftQ = useQuery({
    queryKey: ["gauntlet-memory-lift", activeWorkspaceId],
    queryFn: () => fLift({ data: { days: 90 } }),
  });
  const calibrationQ = useQuery({
    queryKey: ["forecast-calibration", activeWorkspaceId],
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
        <GrowthBars growth={growth} max={maxGrowth} />
      </div>
    </div>
  );
}
