/**
 * BRN-01: what the graph proves about itself. Mounted above the graph canvas.
 *
 * Ported to the shell primitives, 2026-07-29. What went, and why:
 *   KILLED the material-medium card. The canvas below it is already the one
 *     bordered container in this region (anti-slop ban 5). This is a Block.
 *   KILLED the four-across hand-built Stat, its MonoLabel caption and its
 *     hand-set weights. A number with a name and one different fact under it is
 *     a Line with a Value, and Num already owns every numeral in the system.
 *   FIXED a real lie about the system, not a style defect. All three reads had
 *     their error state folded into "lights up on next sync" and "not enough
 *     data yet". A failed request rendered as a pre-migration state or as an
 *     honest absence of data, which are three different facts and a user acts
 *     differently on each. A failed read is Failed with a retry now.
 *
 * UNCHANGED: getMemoryCompounding / getMemoryLift / getForecastCalibration,
 * every query key including the activeWorkspaceId scoping, the eight-week
 * client-side growth computation, and the SketchBarChart mount.
 *
 * STILL LEGACY, and named rather than hidden: SketchBarChart lives in
 * components/supaprod, which this lane does not own.
 */
import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMemoryCompounding, getMemoryLift } from "@/lib/gauntlet.functions";
import { getForecastCalibration } from "@/lib/brain-insights.functions";
import { SketchBarChart } from "@/components/supaprod/Sketch";
import { useWorkspace } from "@/hooks/use-workspace";
import type { GraphNode } from "@/lib/knowledge-graph-view";
import { Block, Failed, Line, Loading, Num, Value } from "@/components/shell/primitives";

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

  const loading = memQ.isLoading || liftQ.isLoading || calibrationQ.isLoading;
  const failed = memQ.isError || liftQ.isError || calibrationQ.isError;

  const mem = memQ.data;
  const lift = liftQ.data;
  const prediction = calibrationQ.data?.prediction;

  return (
    <Block
      title="Your memory, compounding"
      // Different information from the title, not a restatement: this is the
      // read on the graph BELOW, not a standing claim.
      sub="Measured over the nodes in view, and over the last ninety days of runs."
    >
      {loading ? (
        <Loading>Reading what the record has learned.</Loading>
      ) : failed ? (
        // Never an empty state, and never the pre-migration copy. A read that
        // did not answer is a different fact from a table that is not there yet.
        <Failed
          onRetry={() => {
            void memQ.refetch();
            void liftQ.refetch();
            void calibrationQ.refetch();
          }}
        >
          These numbers did not load, so nothing here is a claim about how much the record has
          learned.{" "}
          {((memQ.error ?? liftQ.error ?? calibrationQ.error) as Error)?.message ?? ""}
        </Failed>
      ) : (
        <>
          <Line
            label="What it remembers"
            sub={
              mem?.tableReady
                ? mem.stored > 0
                  ? `${mem.newThisWeek} of them landed this week`
                  : "Nothing stored yet, so there is nothing to compound"
                : "Lights up after the next sync applies the memory tables"
            }
          >
            {mem?.tableReady && mem.stored > 0 ? (
              <Value>
                <Num>{mem.stored.toLocaleString()}</Num> memories
              </Value>
            ) : (
              <Value>Not yet</Value>
            )}
          </Line>

          <Line
            label="What remembering bought"
            sub={
              lift?.tableReady && lift.liftPoints != null
                ? "Runs with richer precedent validated more often, over ninety days"
                : "Not enough runs yet to compare against"
            }
          >
            {lift?.tableReady && lift.liftPoints != null ? (
              <Value tone={lift.liftPoints > 0 ? "pass" : lift.liftPoints < 0 ? "fail" : "quiet"}>
                <Num>
                  {lift.liftPoints > 0 ? "+" : ""}
                  {lift.liftPoints}
                </Num>{" "}
                points
              </Value>
            ) : (
              <Value>Not yet</Value>
            )}
          </Line>

          <Line label="Calls it later revised" sub="Supersession threads live in the graph below">
            <Value>
              <Num>{beliefsRevised}</Num>
            </Value>
          </Line>

          <Line
            label="How often its forecast was right"
            sub={prediction?.recentLabel ?? "Not enough settled forecasts yet to score"}
          >
            {prediction?.hitRate != null ? (
              <Value>
                <Num>{Math.round(prediction.hitRate * 100)}%</Num>
              </Value>
            ) : (
              <Value>Not yet</Value>
            )}
          </Line>

          <SketchBarChart
            data={growth.map((count, i) => ({ label: `w${i + 1}`, value: count }))}
            color="var(--sp-stage-learn)"
            formatValue={(v) => String(Math.round(v))}
            ariaLabel={`New beliefs per week, last ${WEEKS} weeks`}
            trackH={40}
          />
        </>
      )}
    </Block>
  );
}
