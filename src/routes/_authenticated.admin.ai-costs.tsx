/**
 * ADMIN / SPEND. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The operator who has just approved an AI invoice and wants to know whether
 *    it bought anything. One question in their head: "which agent is expensive,
 *    and is it earning it?"
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Comparing what each agent COSTS against what it DECIDED. Cost alone is an
 *    invoice, decisions alone are a log; the two on one line is the only thing
 *    here that supports a judgment, and it is why this page exists rather than a
 *    billing export.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    KEEP  the per-agent figures. This is the judgment.
 *    KEEP  the by-week series, shortened. It is the only thing on the page that
 *          shows a direction rather than a level.
 *    KEEP  the note that these are recomputed overnight. A stale number that
 *          says it is stale is honest; one that does not is a trap.
 *    KILL  the second per-agent table. "Outcome rate by agent" and "Cost per
 *          decision by agent" were two tables over ONE dimension, so the reader
 *          had to join them by eye to answer the only question worth asking.
 *          They are one row per agent now.
 *    KILL  all three `overflow-x: auto` tables, and the three bordered cards
 *          that held them (one bordered container per region, anti-slop ban 5).
 *    KILL  the colour thresholds on outcome rate (green over 50%, ink over 20%,
 *          grey below). Nothing in the product defines those cut-offs; they were
 *          invented in the component, and a colour that asserts "this is good"
 *          without a source is a fabricated status.
 *    KILL  the two explanatory paragraphs under the table titles. What "lower is
 *          better" means is carried by the block's own sub-line, once.
 *    KILL  188 weeks of scrolling. Twelve weeks is a trend; two hundred is a
 *          database dump.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    Per-week, per-agent, per-workspace detail. The rows carry the level and the
 *    direction; anyone who needs the raw series has the record itself.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The moment is the top row: the most expensive agent in the workspace, named,
 *    with what its decisions cost each. Nobody had that sentence before.
 *    The confusion this pass had to remove was arithmetic. The old rollup called
 *    the unweighted mean of per-agent ratios "cost per decision", which is not
 *    cost per decision: an agent with one decision counted as much as one with
 *    four hundred. Every figure here is now a weighted total (sum of cost over
 *    sum of decisions), and a window with no calls says there were none rather
 *    than rendering a confident zero.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    This is the one admin surface where the crew is the SUBJECT, and it earns
 *    its marks: every row is an agent, named and marked, and the number beside
 *    it is money that agent actually spent. It proves the labour was real,
 *    which is the whole test the presence doctrine sets. Remove the agents from
 *    the product and this page has no rows at all.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { Block, Empty, Failed, Loading, Row } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";
import { getMoatMetrics } from "@/lib/observability.functions";

export const Route = createFileRoute("/_authenticated/admin/ai-costs")({
  component: AdminAiCosts,
});

/** How many weeks of the series are worth rendering. A trend, not a dump. */
const WEEKS_SHOWN = 12;

function usd(n: number): string {
  return n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

type AgentLine = {
  slug: string;
  decisions30d: number;
  cost30d: number;
  costPerDecision: number | null;
  decisionsTotal: number;
  closed: number;
  closedRate: number | null;
};

function AdminAiCosts() {
  const fMetrics = useServerFn(getMoatMetrics);
  const metrics = useQuery({
    queryKey: ["admin-moat-metrics"],
    queryFn: () => fMetrics(),
    staleTime: 60_000,
  });

  if (metrics.isLoading) {
    return <Loading>Reading what the crew spent.</Loading>;
  }

  if (!metrics.data || "error" in metrics.data) {
    return (
      <Failed onRetry={() => void metrics.refetch()}>
        The spend figures did not load, so nothing here is safe to read as a cost.{" "}
        {metrics.data && "error" in metrics.data
          ? (metrics.data as { error: string }).error
          : metrics.error instanceof Error
            ? metrics.error.message
            : "The read failed."}
      </Failed>
    );
  }

  const { decisionVelocity, supersessionRate, agentCost } = metrics.data;

  // One line per agent, summed across workspaces. WEIGHTED on purpose: cost per
  // decision is total cost over total decisions, never the mean of per-agent
  // ratios, which would let a one-decision agent outvote a four-hundred one.
  const byAgent = new Map<string, AgentLine>();
  const line = (slug: string): AgentLine => {
    const found = byAgent.get(slug);
    if (found) return found;
    const fresh: AgentLine = {
      slug,
      decisions30d: 0,
      cost30d: 0,
      costPerDecision: null,
      decisionsTotal: 0,
      closed: 0,
      closedRate: null,
    };
    byAgent.set(slug, fresh);
    return fresh;
  };
  for (const r of agentCost) {
    const l = line(r.agent_slug);
    l.decisions30d += r.decisions_30d;
    l.cost30d += r.cost_usd_30d;
  }
  for (const r of supersessionRate) {
    const l = line(r.agent_slug);
    l.decisionsTotal += r.decisions_total;
    l.closed += r.decisions_superseded;
  }
  const agents = [...byAgent.values()]
    .map((l) => ({
      ...l,
      costPerDecision: l.decisions30d > 0 ? l.cost30d / l.decisions30d : null,
      closedRate: l.decisionsTotal > 0 ? (l.closed / l.decisionsTotal) * 100 : null,
    }))
    .sort((a, b) => b.cost30d - a.cost30d || b.decisions30d - a.decisions30d);

  const spend30d = agents.reduce((s, a) => s + a.cost30d, 0);
  const decisions30d = agents.reduce((s, a) => s + a.decisions30d, 0);
  const perDecision = decisions30d > 0 ? spend30d / decisions30d : null;

  // The by-week series, summed across workspaces, newest first.
  const weeks = new Map<string, { made: number; shipped: number; replaced: number }>();
  for (const r of decisionVelocity) {
    const key = r.week?.slice(0, 10) ?? "";
    if (!key) continue;
    const w = weeks.get(key) ?? { made: 0, shipped: 0, replaced: 0 };
    w.made += r.decisions_made;
    w.shipped += r.decisions_shipped;
    w.replaced += r.decisions_superseded;
    weeks.set(key, w);
  }
  const weekRows = [...weeks.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, WEEKS_SHOWN);

  return (
    <>
      <Block
        title={
          decisions30d === 0 || perDecision === null
            ? "No agent recorded a decision in the last 30 days"
            : `${usd(spend30d)} bought ${decisions30d} decisions, ${usd(perDecision)} each`
        }
        sub="Rolling 30 days, summed across every workspace. Lower is better, and an agent spending with no decisions beside it is spending on something the record does not show."
      >
        {agents.length === 0 ? (
          <Empty>
            No agent has spent anything against a recorded decision yet. The first figures appear
            once the crew runs against real work.
          </Empty>
        ) : (
          agents.map((a) => (
            <Row
              key={a.slug}
              tight
              marks={<AgentMark slug={a.slug} />}
              lead={agentDisplayName(a.slug)}
              sub={
                <>
                  {a.decisions30d === 0 ? (
                    "No decisions in the last 30 days"
                  ) : (
                    <>
                      <Num>{a.decisions30d}</Num> decisions, 30d
                    </>
                  )}
                  {" · "}
                  {a.closedRate === null ? (
                    "no outcomes recorded"
                  ) : (
                    <>
                      <Num>{a.closedRate.toFixed(0)}%</Num> closed by a result
                    </>
                  )}
                </>
              }
              time={a.costPerDecision === null ? usd(a.cost30d) : `${usd(a.costPerDecision)} each`}
            />
          ))
        )}
      </Block>

      <Block
        title="Decisions by week"
        sub="Made is what the loop recorded, shipped is what reached a real result, replaced is what it later revised. Every figure on this page is recomputed overnight, so if this series stops moving at all, the nightly job has stopped and Health says so."
      >
        {weekRows.length === 0 ? (
          <Empty>
            No decisions have been recorded in any workspace yet. This fills in the first week the
            loop closes one.
          </Empty>
        ) : (
          weekRows.map(([week, w]) => (
            <Row
              key={week}
              tight
              lead={
                <>
                  <Num>{w.made}</Num> made
                </>
              }
              sub={
                <>
                  <Num>{w.shipped}</Num> shipped · <Num>{w.replaced}</Num> replaced
                </>
              }
              time={week}
            />
          ))
        )}
      </Block>
    </>
  );
}
