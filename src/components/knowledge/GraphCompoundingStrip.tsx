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
 * THE ZERO PASS, 2026-08-10. THE HEADING WAS THE LIE, NOT THE NUMBERS.
 *   ADDED a data threshold. With nothing learned, no measurable lift, no scored
 *     forecast and no revision in view, this drew "Your record, compounding"
 *     over four values reading "Not yet" and an eight-bar chart of zeroes. Every
 *     number was correct; the composition asserted the opposite of what it
 *     showed, and on a real account today that is the only state it has. It now
 *     renders nothing at all until one of the four facts is real, because none
 *     of what it was drawing was information a person acts on.
 *   KILLED "Lights up after the next sync". That is our migration queue reported
 *     to a customer, and it stood where the honest fact belonged: `tableReady`
 *     false means the read did not answer. It says that, in the fail voice.
 *   KILLED the all-zero chart. Eight bars of nothing draw only the axis, which
 *     reads as a broken chart rather than as a quiet eight weeks.
 *
 * UNCHANGED: getMemoryCompounding / getMemoryLift / getForecastCalibration,
 * every query key including the activeWorkspaceId scoping, the eight-week
 * client-side growth computation, and the SketchBarChart mount.
 *
 * STILL LEGACY, and named rather than hidden: SketchBarChart lives in
 * components/supaprod, which this lane does not own.
 */
import { useMemo } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMemoryCompounding, getMemoryLift } from "@/lib/gauntlet.functions";
import { getForecastCalibration } from "@/lib/brain-insights.functions";
import { SketchBarChart } from "@/components/supaprod/Sketch";
import { useWorkspace } from "@/hooks/use-workspace";
import type { GraphNode } from "@/lib/knowledge-graph-view";
import { Block, Failed, Line, Loading, Value } from "@/components/shell/primitives";

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

  /**
   * WHETHER "COMPOUNDING" IS A CLAIM THIS STRIP HAS EARNED.
   *
   * It used to render the heading "Your record, compounding" over four values
   * reading "Not yet" and an eight-bar chart of zeroes. Every one of those is
   * accurate and the composition is still a lie: the heading asserts a thing is
   * happening, and every number under it says it is not. On a real account
   * today that is the ONLY state this strip has, so the overclaim was the
   * normal view rather than an edge case.
   *
   * A zero also has no reader. Nobody does anything differently having seen
   * four "Not yet"s, so drawing them costs the space and buys nothing, and the
   * page has somewhere better already: Brain's own guidance region above the
   * Graph tab states what has not fired yet AND names the act that ends it.
   * Repeating it here would just be the second copy.
   *
   * So the strip is silent until at least one of its four facts is real. It is
   * not hiding anything: nothing it would have drawn was information.
   */
  const learned = mem?.tableReady ? mem.stored : 0;
  const liftKnown = Boolean(lift?.tableReady) && lift?.liftPoints != null;
  const hitRateKnown = prediction?.hitRate != null;
  const hasClaim = learned > 0 || liftKnown || hitRateKnown || beliefsRevised > 0;

  /**
   * The memory read came back with the graceful shape it uses when the table
   * itself could not be read (gauntlet.functions.ts degrades rather than
   * throwing). That is "we could not find out", which is a Failed, not a zero
   * and not a young workspace. It used to be reported as "Lights up after the
   * next sync", which tells a customer about our migration queue and reads to
   * them as a feature that has not shipped.
   */
  const memUnread = mem != null && !mem.tableReady;

  // A chart of eight zero bars is a chart of zeroes: the axis is the only thing
  // it draws. Kept off until a week in the window actually gained something.
  const grew = growth.some((n) => n > 0);

  if (!loading && !failed && !hasClaim) {
    return memUnread ? (
      <Block title="What the record holds">
        <Failed onRetry={() => void memQ.refetch()}>
          This could not be read, so nothing here is a claim that the record is empty.
        </Failed>
      </Block>
    ) : null;
  }

  return (
    <Block
      // NOT "Your record, compounding". Present progressive asserted that
      // accumulation is happening right now, which is the claim the vocabulary
      // canon forbids: the loop is wired and proven, and it accrues on first
      // real use. A title that names WHAT IS THERE is true at every size of
      // record, including zero.
      title="What the record holds"
      // Different information from the title, not a restatement: this is the
      // read on the graph BELOW, not a standing claim.
      sub="Measured over the nodes in view, and over the last ninety days of runs."
    >
      {loading ? (
        <Loading>Reading the record.</Loading>
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
          These numbers did not load, so nothing here is a claim about what the record holds.{" "}
          {((memQ.error ?? liftQ.error ?? calibrationQ.error) as Error)?.message ?? ""}
        </Failed>
      ) : (
        <>
          {/* "LIGHTS UP AFTER THE NEXT SYNC" IS GONE. That was our migration
              queue reported to a customer, in a sentence that reads to them as
              a feature nobody has shipped, and it was standing in for the one
              thing this system refuses to blur: `tableReady` false means the
              read did not answer, not that there is nothing to answer with. It
              says that now, in the fail voice, in the reader's terms. */}
          {/* NOT "What it learned" over a count. A count offered as proof of
              learning is the exact shape the canon rejects, and the identical
              sentence was already killed once on the Brain surface. The label
              now names what the number IS. */}
          <Line
            label="On the record"
            sub={
              memUnread
                ? "This could not be read just now, so it is not a claim that the record is empty"
                : mem && mem.stored > 0
                  ? `${mem.newThisWeek} of them landed this week`
                  : "Nothing on the record yet"
            }
          >
            {memUnread ? (
              <Value tone="fail">Not read</Value>
            ) : mem && mem.stored > 0 ? (
              <Value>
                <Num>{mem.stored.toLocaleString()}</Num> entries
              </Value>
            ) : (
              <Value>Not yet</Value>
            )}
          </Line>

          {/* NOT "What learning bought". That asserted learning had produced
              measured value. This is a ninety-day comparison between runs that
              had more precedent to go on and runs that had less: the label
              names the slice, the sub states the finding, the value sizes it.
              No claim that the system learned anything. */}
          <Line
            label="Where precedent was richer"
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

          {/* SCOPE, SAID ON THE LINE ITSELF. This reads 0 while Learn reports
              "3 calls later replaced", and both are right: this counts
              supersession threads among the nodes IN VIEW, Learn counts them
              across the workspace. The section header already says "measured
              over the nodes in view", but nobody reads a header to reconcile a
              number, so the line carries its own scope and points at the
              authoritative one. */}
          <Line
            label="Calls it later revised"
            sub="Among the nodes in view; Learn carries the workspace total"
          >
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

          {/* A CHART OF EIGHT ZERO BARS DRAWS ONLY ITS OWN AXIS. It reads as a
              broken chart rather than as a quiet eight weeks, and it is what
              every view whose nodes are all older than the window got. Drawn
              only once a week in the window actually gained something. */}
          {grew ? (
            <SketchBarChart
              data={growth.map((count, i) => ({ label: `w${i + 1}`, value: count }))}
              color="var(--sp-stage-learn)"
              formatValue={(v) => String(Math.round(v))}
              ariaLabel={`New beliefs per week, last ${WEEKS} weeks`}
              trackH={40}
            />
          ) : null}
        </>
      )}
    </Block>
  );
}
