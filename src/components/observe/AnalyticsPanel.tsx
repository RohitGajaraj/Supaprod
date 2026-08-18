/**
 * Spend and usage, the whole rollup. Lives at /engine-room?room=spend&view=usage.
 *
 * Ported off the retired Ember/bento system onto the primitives (2026-07-29).
 * The room around this panel is already one bordered container, so nothing in
 * here draws a second one. What changed, and why:
 *
 * KILL the bentos. Nine bordered, padded cards stacked inside a room that is
 *      already a bordered container is ban 5, and it made three headline
 *      numbers, two rollups and a chart read as nine equally important
 *      subjects. Sections are Blocks now: a rule where the register changes.
 * KILL MonoLabel everywhere. Uppercase mono caps was the label voice of the
 *      retired system. Mono is for DATA only, so every label is sentence case
 *      and every number, duration, count, cost, share and timestamp is inside
 *      Num.
 * KILL the ember share bars on both rollups. A bar per row is a second way of
 *      saying the number already at the end of the row, and ember marks the
 *      human rather than a quantity. The agent rollup keeps its real share as
 *      a percentage, because the server computes it against the agent
 *      subtotal and that is genuinely not derivable from what is on screen.
 * KILL the daily activity chart. Not restyled, deleted: getAnalyticsOverview
 *      OMITS a day with no events from `daily`, and the chart plotted by
 *      index, so a sparse window drew a continuous shape over a
 *      discontinuous series. That is a fabricated shape, and the same room
 *      already carries a properly zero-filled trend at ?view=trend. The two
 *      true facts in that data are stated in words instead: the busiest day,
 *      and how many days in the window recorded anything at all.
 * KILL the verdict chips on the run list. A pill inside a row is a card
 *      inside a card, and "ok" repeated down every row is not information.
 *      Only a failure says anything now, in the fail tone.
 * KILL the "detail" affordance text on every run row. The row is a button.
 * KILL the slide-over drawer. See THE DRAWER below.
 * KILL the whole-panel error return. One failed read used to blank the panel
 *      including the two sections that read from their own queries. Failure
 *      is scoped to the read that failed now.
 *
 * KEEP every server function, every query key, every navigation target, and
 *      the one exported symbol (AnalyticsPanel, lazily mounted by SpendRoom).
 *
 * THE DRAWER. primitives.tsx names the pane, the slide-over and the drawer as
 * deliberately absent, with its reasons. The event detail is rendered IN
 * PLACE: opening a run replaces the run list with the run, and one Back
 * button returns. Same query, same key, same enabled flag.
 *
 * HONESTY. Three reads feed this panel and each one owns three states: a read
 * in flight says so, a read that failed says so and offers a retry, and only a
 * read that genuinely returned nothing renders an empty state. Two windows
 * disagree with the picker on purpose and the panel discloses it rather than
 * implying otherwise: listAiEvents returns the last 100 calls regardless of
 * the range, and getGuardrailStats is a fixed 30 days.
 *
 * The reference's "of $X cap" sub-line still renders only where a real cap
 * covers the window (ai_budgets daily cap on 24h, monthly cap on 30d), and it
 * is now additive rather than replacing the run count, so a failed budget read
 * can never quietly swap one fact for another. The reference's "ttft"
 * sub-datum stays omitted, and the reason CHANGED on 2026-08-02: ttft_ms used
 * to be written by nothing at all, and is now written by the streaming path in
 * callModelStream. It is still omitted here because it is only meaningful for a
 * streamed call, so an average over this panel's window would silently mix
 * streamed rows with awaited ones that carry no first token. Adding it needs a
 * "streamed only" qualifier on the datum, which is a design decision, not a
 * missing column.
 */
import { useServerFn } from "@tanstack/react-start";
import { Row, Line } from "@/components/meridian/rows";
import { Num, Actions } from "@/components/meridian/surface-parts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import {
  getAnalyticsOverview,
  getAgentSpendBreakdown,
  getUnitEconomics,
  listAiEvents,
  getEventDetail,
  getGuardrailStats,
} from "@/lib/analytics.functions";
import { getBudgetSummary } from "@/lib/budgets.functions";
import { relTime } from "@/components/product/format";
import { Block, Button, Cell, Choices, Empty, Failed, Grid, Loading, Pre, Prose, Value } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";

function fmtUsd(n: number) {
  if (n === 0) return "$0";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function fmtMs(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
function errText(e: unknown) {
  return e instanceof Error ? e.message : "The read failed.";
}

/** The window. `n` and `unit` are split so the numeral can wear mono and the
 *  word cannot: a unit is a word a person reads, not data. */
const RANGES = [
  { id: "24h", days: 1, n: 24, unit: "hours" },
  { id: "7d", days: 7, n: 7, unit: "days" },
  { id: "30d", days: 30, n: 30, unit: "days" },
  { id: "90d", days: 90, n: 90, unit: "days" },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

/** Which breakdown is being read. A mutually exclusive pick, so it is a
 *  radiogroup with arrow keys rather than three toggle buttons. */
const SECTIONS = [
  { id: "models", label: "Models" },
  { id: "runs", label: "Runs" },
  { id: "guardrails", label: "Guardrails" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export function AnalyticsPanel() {
  const navigate = useNavigate();
  const fOverview = useServerFn(getAnalyticsOverview);
  const fByAgent = useServerFn(getAgentSpendBreakdown);
  const fUnit = useServerFn(getUnitEconomics);
  const fBudget = useServerFn(getBudgetSummary);
  const fEvents = useServerFn(listAiEvents);
  const fDetail = useServerFn(getEventDetail);
  const fGuards = useServerFn(getGuardrailStats);

  const [range, setRange] = useState<RangeId>("7d");
  const [section, setSection] = useState<SectionId>("models");
  const [openId, setOpenId] = useState<string | null>(null);
  const days = RANGES.find((r) => r.id === range)?.days ?? 7;

  const overview = useQuery({
    queryKey: ["analytics-overview", days],
    queryFn: () => fOverview({ data: { days } }),
  });
  const byAgentQ = useQuery({
    queryKey: ["analytics-by-agent", days],
    queryFn: () => fByAgent({ data: { days } }),
  });
  const unitQ = useQuery({
    queryKey: ["unit-economics", days],
    queryFn: () => fUnit({ data: { days } }),
  });
  const budgetQ = useQuery({
    queryKey: ["budget-summary"],
    queryFn: () => fBudget(),
  });
  const events = useQuery({
    queryKey: ["analytics-events"],
    queryFn: () => fEvents({ data: { limit: 100 } }),
    enabled: section === "runs",
  });
  const guards = useQuery({
    queryKey: ["analytics-guards"],
    queryFn: () => fGuards(),
    enabled: section === "guardrails",
  });
  const detail = useQuery({
    queryKey: ["event-detail", openId],
    queryFn: () => fDetail({ data: { eventId: openId! } }),
    enabled: !!openId,
  });

  const s = overview.data?.summary;
  const bySurface = overview.data?.bySurface ?? [];
  const byAgents = byAgentQ.data?.agents ?? [];
  const byModel = overview.data?.byModel ?? [];
  const daily = overview.data?.daily ?? [];
  const ue = unitQ.data;
  const totalCost = s?.totalCost ?? 0;
  const runs = s?.totalRuns ?? 0;
  const errors = s?.errors ?? 0;

  // "of $X cap" is only honest where a real cap covers the window: ai_budgets
  // daily_usd_cap for 24h, monthly_usd_cap for 30d, and only when set. No
  // weekly or quarterly cap concept exists, so 7d and 90d never claim one.
  const capForRange =
    range === "24h"
      ? (budgetQ.data?.daily_usd_cap ?? null)
      : range === "30d"
        ? (budgetQ.data?.monthly_usd_cap ?? null)
        : null;

  // The two true facts inside `daily`. It carries only the days that recorded
  // an event, which is exactly why the count of them is worth saying.
  const busiest = daily.length ? daily.reduce((a, b) => (b.runs > a.runs ? b : a)) : null;

  const eventRows = events.data?.events ?? [];
  const guardHits = guards.data?.hits ?? [];

  return (
    <div>
      <Choices
        label="How far back to read"
        mode="one"
        value={range}
        onPick={(id) => setRange(id)}
        options={RANGES.map((r) => ({
          id: r.id,
          label: (
            <>
              <Num>{r.n}</Num> {r.unit}
            </>
          ),
        }))}
      />

      {/* THE HEADLINE FACTS, as Lines rather than a Grid of Cells. Each one is
          a named quantity read as label-left, fact-right, and a Cell's lead is
          the value with nowhere to put its own name, which would leave four
          unlabelled numbers side by side. The Grid is used further down, on the
          judge scores, where five siblings are genuinely scanned across and
          compared against each other. */}
      <Block title="What it cost">
        {overview.isLoading ? (
          <Loading>Reading the AI event history.</Loading>
        ) : overview.isError ? (
          <Failed onRetry={() => void overview.refetch()}>
            The event history did not load, so nothing here is a claim about what you spent.{" "}
            {errText(overview.error)}
          </Failed>
        ) : runs === 0 ? (
          <Empty>
            Nothing ran in this window. Widen it, or run an agent and the first call lands here
            within a minute.
          </Empty>
        ) : (
          <>
            <Line
              label="Spend"
              sub={
                <>
                  <Num>{runs}</Num> calls
                  {errors > 0 ? (
                    <>
                      {", "}
                      <span className="sp-fail">
                        <Num>{errors}</Num> of them failed
                      </span>
                    </>
                  ) : null}
                  {capForRange != null ? (
                    <>
                      {". The cap for this window is "}
                      <Num>{fmtUsd(Number(capForRange))}</Num>
                    </>
                  ) : null}
                  .
                </>
              }
            >
              <Value>
                <Num>{fmtUsd(totalCost)}</Num>
              </Value>
            </Line>

            <Line
              label="Tokens"
              sub="Prompt and completion together, across every AI call the product made."
            >
              <Value>
                <Num>{fmtNum(s?.totalTokens ?? 0)}</Num>
              </Value>
            </Line>

            {/* The reference headline is the median. Its "ttft" sub-datum is
                never written in production, so the real average and p95 ride
                the second line instead of a number nobody records. */}
            <Line
              label="Median latency"
              sub={
                <>
                  Average <Num>{fmtMs(s?.avgLatency ?? 0)}</Num>, and the slowest call in twenty
                  took <Num>{fmtMs(s?.p95Latency ?? 0)}</Num>.
                </>
              }
            >
              <Value>
                <Num>{fmtMs(s?.p50Latency ?? 0)}</Num>
              </Value>
            </Line>

            {/* Only where the window spans more than one day. `daily` buckets
                by UTC calendar day while the window is a rolling one, so a
                24 hour window can legitimately hold two day buckets and a
                "busiest day" would be arithmetic rather than a fact. For the
                same reason the count below never compares itself to the
                window length. */}
            {busiest && days > 1 ? (
              <Line
                label="Busiest day"
                sub={
                  <>
                    <Num>{busiest.runs}</Num> calls that day. <Num>{daily.length}</Num>{" "}
                    {daily.length === 1 ? "day" : "days"} in this window recorded anything at all.
                  </>
                }
              >
                <Value>
                  <Num>{busiest.day}</Num>
                </Value>
              </Line>
            ) : null}
          </>
        )}
      </Block>

      {/* Fed by the same read as the block above, so it renders only once that
          read succeeded. Repeating one failure twice on one screen tells the
          reader nothing the first line did not. */}
      {overview.isSuccess && bySurface.length > 0 ? (
        <Block
          title="Where it went"
          sub="Every AI call in the product rolls up here, busiest first."
        >
          {bySurface.map((x) => (
            <Row
              key={x.surface}
              tight
              lead={x.surface}
              sub={
                <>
                  <Num>{fmtUsd(x.cost)}</Num> · <Num>{x.runs}</Num> calls
                  {x.errors > 0 ? (
                    <>
                      {" · "}
                      <span className="sp-fail">
                        <Num>{x.errors}</Num> failed
                      </span>
                    </>
                  ) : null}
                </>
              }
            />
          ))}
        </Block>
      ) : null}

      {/* The per-agent layer underneath the 'agent' surface row above. Its own
          read, so its own three states. A row that resolved to a real agent
          wears that agent's mark: the row IS that agent's spend, so the mark is
          attribution rather than decoration. A pseudo-ref (orchestrator:plan,
          unattributed) resolved to nothing, so it wears no mark and says so,
          rather than borrowing an identity it was never given. */}
      <Block
        title="Which agent spent it"
        sub="Share is of agent spend, not of everything above. Open one for its runs and missions."
      >
        {byAgentQ.isLoading ? (
          <Loading>Reading the agent history.</Loading>
        ) : byAgentQ.isError ? (
          <Failed onRetry={() => void byAgentQ.refetch()}>
            Agent spend did not load, so this is not a claim that no agent ran.{" "}
            {errText(byAgentQ.error)}
          </Failed>
        ) : byAgents.length === 0 ? (
          <Empty>
            No agent calls in this window. Everything else the product asked a model is in the
            rollup above.
          </Empty>
        ) : (
          byAgents.map((a) => {
            // getAgentSpendBreakdown sets name to the agents row when the ref
            // resolved and to the raw ref when it did not, so this is the
            // honest test for whether there is an agent behind the row.
            const resolved = a.name !== a.slug;
            return (
              <Row
                key={a.slug}
                tight
                marks={
                  resolved ? <AgentMark slug={a.slug} name={a.name} state="idle" /> : undefined
                }
                lead={a.name}
                sub={
                  <>
                    <Num>{fmtUsd(a.cost)}</Num> · <Num>{Math.round(a.pct)}%</Num> of agent spend ·{" "}
                    <Num>{a.calls}</Num> calls
                    {resolved ? null : " · no agent on the record for these"}
                  </>
                }
                onClick={() =>
                  navigate({
                    to: "/engine-room",
                    search: { room: "spend", view: "usage", agent: a.slug },
                  })
                }
              />
            );
          })
        )}
      </Block>

      {/* ENG-06 unit economics, the operator half of cost-per-outcome. Stays
          silent on a workspace that has produced no outcomes yet, because a
          block of dashes teaches nobody anything. A failed read is never
          silent: that is the difference between "nothing yet" and "we could
          not find out". */}
      {unitQ.isError ? (
        <Block title="What each outcome cost">
          <Failed onRetry={() => void unitQ.refetch()}>
            The outcome history did not load. {errText(unitQ.error)}
          </Failed>
        </Block>
      ) : unitQ.isLoading ? (
        <Block title="What each outcome cost">
          <Loading>Reading the outcome history.</Loading>
        </Block>
      ) : ue && ue.outcomes > 0 ? (
        <Block title="What each outcome cost">
          <Line
            label="Cost per outcome"
            sub="Blended across specs, decisions and shipped missions on purpose. Per-type attribution would claim a precision this data does not have."
          >
            <Value>
              {ue.costPerOutcomeUsd != null ? (
                <Num>{fmtUsd(ue.costPerOutcomeUsd)}</Num>
              ) : (
                "not yet countable"
              )}
            </Value>
          </Line>
          <Line
            label="Agent spend"
            sub="From the agent runs history, which counts only model calls tied to a run. It will not match the spend above, and that disagreement is real."
          >
            <Value>
              <Num>{fmtUsd(ue.totalSpendUsd)}</Num>
            </Value>
          </Line>
          <Line
            label="Outcomes"
            sub={
              <>
                <Num>{ue.specs}</Num> specs, <Num>{ue.decisions}</Num> decisions,{" "}
                <Num>{ue.missions}</Num> shipped.
              </>
            }
          >
            <Value>
              <Num>{ue.outcomes}</Num>
            </Value>
          </Line>
        </Block>
      ) : null}

      {/* THE DRAWER, converted. Opening a run REPLACES the breakdown rather
          than floating over it, which is what the absent pane would have done.
          A Block is a rule and never appears inside another Block, so the run
          takes the whole region rather than nesting inside it, and the way
          back is one real Button at the top of the first thing you read. */}
      {section === "runs" && openId ? (
        detail.isError ? (
          <Block title="The call you opened">
            <Actions>
              <Button onClick={() => setOpenId(null)}>Back to the runs</Button>
            </Actions>
            <Failed onRetry={() => void detail.refetch()}>
              This call did not load. {errText(detail.error)}
            </Failed>
          </Block>
        ) : detail.isLoading || !detail.data ? (
          <Block title="The call you opened">
            <Actions>
              <Button onClick={() => setOpenId(null)}>Back to the runs</Button>
            </Actions>
            <Loading>Reading the call.</Loading>
          </Block>
        ) : (
          <EventDetail data={detail.data as EventDetailData} onBack={() => setOpenId(null)} />
        )
      ) : (
        /* The three breakdowns. The picker's own words name each one, so the
           block heading says something else: what all three have in common,
           and where their windows disagree with the picker at the top. */
        <Block
          title="Underneath the totals"
          sub="Models follow the window above. The run list is the last 100 calls and guardrail hits are the last 30 days, whichever window is picked."
        >
          <Choices
            label="Which breakdown to read"
            mode="one"
            value={section}
            onPick={(id) => setSection(id)}
            options={SECTIONS.map((x) => ({ id: x.id, label: x.label }))}
          />

          {section === "models" ? (
            overview.isLoading ? (
              <Loading>Reading the AI event history.</Loading>
            ) : overview.isError ? (
              <Failed onRetry={() => void overview.refetch()}>
                The event history did not load, so this is not a claim that no model ran.
              </Failed>
            ) : byModel.length === 0 ? (
              <Empty>No AI calls in this window, so no model has a line yet.</Empty>
            ) : (
              byModel.map((m) => (
                <Row
                  key={m.model}
                  tight
                  lead={m.model}
                  sub={
                    <>
                      <Num>{fmtUsd(m.cost)}</Num> · <Num>{m.runs}</Num> calls ·{" "}
                      <Num>{fmtNum(m.tokens)}</Num> tokens
                    </>
                  }
                />
              ))
            )
          ) : section === "runs" ? (
            events.isLoading ? (
              <Loading>Reading the last calls on the record.</Loading>
            ) : events.isError ? (
              <Failed onRetry={() => void events.refetch()}>
                The calls did not load, so this is not a claim that nothing ran.{" "}
                {errText(events.error)}
              </Failed>
            ) : eventRows.length === 0 ? (
              <Empty>
                No AI call is on the record yet. Run an agent or ask a question and the first one
                lands here.
              </Empty>
            ) : (
              eventRows.map((e) => (
                <Row
                  key={e.id}
                  tight
                  lead={(e.input_preview ?? "").trim() || "No preview was recorded."}
                  // "ok" repeated down a hundred rows is not information. Only a
                  // failure says anything, and it says it in the fail tone.
                  sub={
                    <>
                      {e.status === "ok" ? null : (
                        <>
                          <span className="sp-fail">failed</span>
                          {" · "}
                        </>
                      )}
                      {e.surface} · <Num>{fmtNum(e.total_tokens)}</Num> tokens ·{" "}
                      <Num>{fmtMs(e.latency_ms)}</Num> · <Num>{fmtUsd(Number(e.est_cost_usd))}</Num>
                    </>
                  }
                  time={relTime(e.created_at)}
                  onClick={() => setOpenId(e.id)}
                />
              ))
            )
          ) : guards.isLoading ? (
            <Loading>Reading the guardrail hits.</Loading>
          ) : guards.isError ? (
            <Failed onRetry={() => void guards.refetch()}>
              The guardrail hits did not load, so this is not a claim that nothing fired.{" "}
              {errText(guards.error)}
            </Failed>
          ) : guardHits.length === 0 ? (
            <Empty>
              No guardrail has fired in the last 30 days. Inputs and outputs stayed clean.
            </Empty>
          ) : (
            guardHits.map((h) => (
              <Row
                key={`${h.name}-${h.action}`}
                tight
                lead={h.name}
                sub={
                  <>
                    <span className={h.action === "block" ? "sp-fail" : "sp-warn"}>{h.action}</span>{" "}
                    · <Num>{h.count}</Num> times
                  </>
                }
              />
            ))
          )}
        </Block>
      )}
    </div>
  );
}

type EventDetailData = {
  event: {
    id: string;
    created_at: string;
    surface: string;
    model: string;
    via: string;
    status: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    est_cost_usd: number;
    latency_ms: number;
    input_preview: string | null;
    output_preview: string | null;
    error_message: string | null;
  } | null;
  eval: {
    hallucination_score: number | null;
    groundedness: number | null;
    relevance: number | null;
    coherence: number | null;
    toxicity: number | null;
    judge_rationale: string | null;
    unsupported_claims: unknown;
  } | null;
  guardrailHits: { rule_name: string; side: string; action: string; matched: string | null }[];
  feedback: { rating: number; comment: string | null }[];
};

/**
 * One AI call, rendered in place of the run list rather than over it. The
 * pane, the slide-over and the drawer are deliberately absent from the
 * primitives; this is the shape /admin/people uses for the same job.
 */
function EventDetail({ data, onBack }: { data: EventDetailData; onBack: () => void }) {
  const back = (
    <Actions>
      <Button onClick={onBack}>Back to the runs</Button>
    </Actions>
  );
  const e = data.event;
  if (!e) {
    return (
      <Block title="The call you opened">
        {back}
        <Empty>That call is no longer on the record.</Empty>
      </Block>
    );
  }
  const ev = data.eval;
  const ok = e.status === "ok";

  // Five sibling scores, compared against each other rather than read down:
  // that is the one thing on this panel a Grid is for.
  const scores: [string, number | null][] = ev
    ? [
        ["Hallucination", ev.hallucination_score],
        ["Groundedness", ev.groundedness],
        ["Relevance", ev.relevance],
        ["Coherence", ev.coherence],
        ["Toxicity", ev.toxicity],
      ]
    : [];

  return (
    <>
      <Block
        title="The call you opened"
        sub={
          <>
            {e.surface} · {e.model} · via {e.via} · <Num>{relTime(e.created_at)}</Num>
          </>
        }
      >
        {back}
        <Line label="Status">
          <Value tone={ok ? "pass" : "fail"}>{ok ? "ok" : "failed"}</Value>
        </Line>
        <Line
          label="Tokens"
          sub={
            <>
              Prompt <Num>{e.prompt_tokens}</Num>, completion <Num>{e.completion_tokens}</Num>.
            </>
          }
        >
          <Value>
            <Num>{fmtNum(e.total_tokens)}</Num>
          </Value>
        </Line>
        <Line label="Latency">
          <Value>
            <Num>{fmtMs(e.latency_ms)}</Num>
          </Value>
        </Line>
        <Line label="Cost">
          <Value>
            <Num>{fmtUsd(Number(e.est_cost_usd))}</Num>
          </Value>
        </Line>
      </Block>

      {ev ? (
        <Block
          title="What the judge scored"
          sub="A score the judge did not return says so, rather than reading as a zero."
        >
          <Grid>
            {scores.map(([label, v]) => (
              <Cell
                key={label}
                lead={v == null ? "not scored" : <Num>{Math.round(v * 100)}%</Num>}
                sub={label}
              />
            ))}
          </Grid>
          {ev.judge_rationale ? <Prose>{ev.judge_rationale}</Prose> : null}
        </Block>
      ) : null}

      {data.guardrailHits.length > 0 ? (
        <Block title="What the guardrails caught">
          {data.guardrailHits.map((h, i) => (
            <Row
              key={`${h.rule_name}-${h.side}-${i}`}
              tight
              lead={h.rule_name}
              sub={
                <>
                  <span className={h.action === "block" ? "sp-fail" : "sp-warn"}>{h.action}</span>{" "}
                  on the {h.side}
                  {h.matched ? ` · matched ${h.matched}` : null}
                </>
              }
            />
          ))}
        </Block>
      ) : null}

      {data.feedback.length > 0 ? (
        <Block
          title="What a person said about it"
          sub="Someone rated this call after it ran. The rating prints as it was stored, rather than being translated into a scale nobody set."
        >
          {data.feedback.map((f, i) => (
            <Row
              key={i}
              tight
              lead={f.comment?.trim() || "No comment was left."}
              sub={
                <>
                  Rated <Num>{f.rating}</Num>
                </>
              }
            />
          ))}
        </Block>
      ) : null}

      <Block title="What went in">
        {e.input_preview ? (
          <Pre>{e.input_preview}</Pre>
        ) : (
          <Empty>No input preview was recorded for this call.</Empty>
        )}
      </Block>

      <Block title="What came back">
        {e.output_preview ? (
          <Pre>{e.output_preview}</Pre>
        ) : (
          <Empty>No output preview was recorded for this call.</Empty>
        )}
      </Block>

      {e.error_message ? (
        <Block title="Why it failed">
          <Pre>
            <span className="sp-fail">{e.error_message}</span>
          </Pre>
        </Block>
      ) : null}
    </>
  );
}
