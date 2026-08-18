/**
 * ADMIN / PROOF. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The founder, twenty minutes before showing a skeptic. They came for ONE
 *    sentence they can say out loud and defend if the skeptic asks where the
 *    number comes from.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Saying "the system gets better at this workspace's decisions as its memory
 *    grows" without lying. Which means the page's real job is not to show
 *    metrics; it is to be honest about WHICH parts of that claim are currently
 *    provable and which are not yet. A number that cannot be defended is worse
 *    than no number here, because this is the surface that gets quoted.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    KEEP  the three measures that exist nowhere else: approvals landing on a
 *          human each week, decisions the loop revised when new evidence
 *          arrived, and the prediction hit rate. These three ARE the claim.
 *    KEEP  the decisions-recorded count and the cost per decision, corrected
 *          (see 5), as the volume the claim rests on.
 *    KILL  the GauntletMetricsPanel mount. It is the exact same component the
 *          Engine room's Quality room renders, so this page was a second copy of
 *          a room that is one click away and does the job better, and it dragged
 *          six retired-chrome cards into a ported surface. It is now one door.
 *    KILL  the three-card receipts rollup. Its per-week and per-agent tables are
 *          rendered in full on Spend; two of its three cards restated Spend and
 *          the third was arithmetically wrong.
 *    KILL  the local StatCard. Label, big number, a sentence of meaning, and a
 *          sub-stat is four registers for one fact, which is hard ban 10 with
 *          extra steps. A claim is a line: what we can say, and what backs it.
 *    KILL  eleven bordered cards across three grids (ban 5), and the three
 *          `repeat(auto-fit, minmax(220px, 1fr))` grids that produced the same
 *          layout three times (ban 6).
 *    KILL  the "-" placeholder as a value. A dash reads as zero at a glance. A
 *          measure with no data now says so in words and says what would unlock
 *          it.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    The Gauntlet (acceptance, autonomy, ritual, outcome accuracy, memory
 *    compounding) in the Engine room's Quality room, and the per-week and
 *    per-agent tables on Spend. Both are named doors, not duplicated content.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The moment is the block title, which counts how many of the five measures
 *    genuinely have data behind them today. A proof surface that admits its own
 *    coverage is more persuasive to a skeptic than one that renders five
 *    confident figures, three of which are zero.
 *    The confusion this pass had to remove was a real arithmetic error. The old
 *    rollup labelled the UNWEIGHTED MEAN OF PER-AGENT RATIOS "Cost / decision,
 *    avg". That is not cost per decision: an agent with one decision counted as
 *    much as one with four hundred, so the headline figure on the investor page
 *    was wrong in a direction nobody could predict. It is now total spend over
 *    total decisions.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    As the subject of every line, and with no marks, deliberately. Each measure
 *    is a statement about what the crew did: how often it needed a human, how
 *    often it caught its own error, how often it was right. Those are workspace
 *    aggregates over every agent at once, so a mark would have to name one agent
 *    for a number that belongs to all of them, and a mark that stands for
 *    "everyone" stands for nobody. The per-agent view, with marks, is on Spend,
 *    and this page links to it. Remove the agents and every line here is zero,
 *    which is the test the doctrine actually sets.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Row } from "@/components/meridian/rows";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { inBandError } from "@/components/admin/admin-ui";
import { getMoatMetrics } from "@/lib/observability.functions";
import { getProofSurfaceExtras } from "@/lib/proof-surface.functions";
import type { Trend } from "@/lib/gauntlet-metrics";
import { Block, Failed, Loading } from "@/components/shell/primitives";

export const Route = createFileRoute("/_authenticated/admin/proof")({
  component: AdminProof,
});

/** A measure is either quotable or it is not. Never a dash standing in for a
 *  number: a dash reads as zero, and this is the page that gets quoted. */
type Measure = {
  id: string;
  /** The claim, in the words you would say out loud. */
  claim: string;
  /** The figure, or null when there is nothing defensible to show. */
  figure: string | null;
  /** What backs it, or what would unlock it. Always different from the claim. */
  backing: string;
};

function trendWord(t: Trend | undefined, upIsGood: boolean): string {
  if (!t || t === "flat") return "flat";
  return (t === "up") === upIsGood ? "improving" : "worsening";
}

function usd(n: number): string {
  return n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function AdminProof() {
  const navigate = useNavigate();
  const fExtras = useServerFn(getProofSurfaceExtras);
  const fMetrics = useServerFn(getMoatMetrics);

  const extrasQ = useQuery({
    queryKey: ["proof-surface-extras"],
    queryFn: () => fExtras(),
    staleTime: 60_000,
  });
  const metricsQ = useQuery({
    queryKey: ["admin-moat-metrics"],
    queryFn: () => fMetrics(),
    staleTime: 60_000,
  });

  if (extrasQ.isLoading || metricsQ.isLoading) {
    return <Loading>Reading what the record can prove.</Loading>;
  }

  // A failed read must never render as three empty measures, which on this
  // surface would be a claim that the system did nothing.
  const extrasError = extrasQ.isError
    ? extrasQ.error instanceof Error
      ? extrasQ.error.message
      : "Request failed."
    : inBandError(extrasQ.data);
  const metricsError = metricsQ.isError
    ? metricsQ.error instanceof Error
      ? metricsQ.error.message
      : "Request failed."
    : inBandError(metricsQ.data);

  if (extrasError && metricsError) {
    return (
      <Failed
        onRetry={() => {
          void extrasQ.refetch();
          void metricsQ.refetch();
        }}
      >
        Neither half of the proof loaded, so nothing on this page is safe to quote. {extrasError}
      </Failed>
    );
  }

  const extras = extrasQ.data && !("error" in extrasQ.data) ? extrasQ.data : undefined;
  const metrics = metricsQ.data && !("error" in metricsQ.data) ? metricsQ.data : undefined;

  const measures: Measure[] = [];

  // 1. The babysitting tax: how often the loop still needs a human.
  const tax = extras?.babysittingTax;
  if (tax) {
    const ready = tax.tableReady && tax.weeklyGated.length > 0;
    measures.push({
      id: "tax",
      claim: "Approval requests landing on a human each week",
      figure: ready ? String(tax.weeklyGated.at(-1) ?? 0) : null,
      backing: ready
        ? `${trendWord(tax.trend, false)} · last 8 weeks: ${tax.weeklyGated.join(", ")}`
        : "Not measured yet. It fills in once the loop has asked for an approval.",
    });
  }

  // 2. The loop catching its own drift.
  const sup = extras?.supersessionsCaught;
  if (sup) {
    measures.push({
      id: "revised",
      claim: "Standing decisions the loop revised once new evidence arrived",
      figure: sup.total > 0 ? String(sup.total) : null,
      backing:
        sup.total > 0
          ? `${sup.last30d} in the last 30 days · ${trendWord(sup.trend, true)}`
          : "Not measured yet. No decision has been revised or contradicted in the last 60 days.",
    });
  }

  // 3. The most quotable figure for a skeptic, and the one most likely to be
  //    empty. It says so rather than showing a confident zero.
  const fs01 = extras?.predictionHitRate;
  if (fs01) {
    const rate = fs01.tableReady && fs01.total > 0 ? fs01.rate : null;
    const ready = rate != null;
    measures.push({
      id: "hitrate",
      claim: "Testable predictions that came true",
      figure: rate == null ? null : `${(rate * 100).toFixed(1)}%`,
      backing: ready
        ? `${fs01.hits} of ${fs01.total} predictions whose deadline has passed`
        : fs01.tableReady
          ? "Not measured yet. No prediction has reached its deadline."
          : "Not measured yet. Prediction scoring is not running here.",
    });
  }

  // 4 and 5. The volume the claim rests on, and what it cost. Weighted.
  if (metrics) {
    const recorded = metrics.decisionVelocity.reduce((sum, r) => sum + r.decisions_made, 0);
    const spend = metrics.agentCost.reduce((sum, r) => sum + r.cost_usd_30d, 0);
    const decisions30d = metrics.agentCost.reduce((sum, r) => sum + r.decisions_30d, 0);
    measures.push({
      id: "recorded",
      claim: "Decisions on the record",
      figure: recorded > 0 ? String(recorded) : null,
      backing:
        recorded > 0
          ? `Across every workspace, over ${metrics.decisionVelocity.length} weekly rows`
          : "Not measured yet. The count starts with the first decision the loop records.",
    });
    measures.push({
      id: "cost",
      claim: "What one recorded decision costs",
      figure: decisions30d > 0 ? usd(spend / decisions30d) : null,
      backing:
        decisions30d > 0
          ? `${usd(spend)} of AI spend over ${decisions30d} decisions, rolling 30 days`
          : "Not measured yet. No agent recorded a decision in the last 30 days.",
    });
  }

  const quotable = measures.filter((m) => m.figure !== null).length;
  const title =
    measures.length === 0
      ? "Nothing loaded, so nothing here is quotable"
      : quotable === 0
        ? `None of the ${measures.length} measures has data behind it yet`
        : quotable === measures.length
          ? `All ${measures.length} measures have data behind them`
          : `${quotable} of ${measures.length} measures have data behind them`;

  return (
    <>
      <Block
        title={title}
        sub="The claim this page exists to support: the system gets measurably better at this workspace's decisions as it learns more of them. Every figure below is read from real records, and a measure with nothing behind it says so rather than showing a zero."
      >
        {measures.map((m) => (
          <Row key={m.id} lead={m.claim} sub={m.backing} time={m.figure} />
        ))}
        {extrasError ? (
          <Failed onRetry={() => void extrasQ.refetch()}>
            Three of these measures did not load: {extrasError}
          </Failed>
        ) : null}
        {metricsError ? (
          <Failed onRetry={() => void metricsQ.refetch()}>
            The volume and cost figures did not load: {metricsError}
          </Failed>
        ) : null}
      </Block>

      <Block title="The rest of the proof, where it already lives">
        <Row
          tight
          lead="Spend"
          sub="Cost per decision per agent, and decisions by week"
          onClick={() => void navigate({ to: "/admin/ai-costs" })}
        />
        <Row
          tight
          lead="Engine room, Quality"
          sub="Acceptance, autonomy, ritual retention, outcome accuracy and compounding learning"
          onClick={() => void navigate({ to: "/engine-room", search: { room: "quality" } })}
        />
      </Block>
    </>
  );
}
