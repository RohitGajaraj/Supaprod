/**
 * One trace, in detail. The engine room's drill layer.
 *
 * REDESIGNED, NOT RE-SKINNED (SURFACE-JUSTIFICATION.md). The prototype does not
 * draw this surface, so it owes the six answers and they ship here. The port
 * before this one was mechanical: it swapped the hand-drawn seven-column grid
 * for primitives and stopped. Mechanically clean is not designed.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO. An engineer holding a
 *    trace id, sent here by a run that failed or a bill that jumped. They came
 *    to name the one call that explains it. They are not browsing and they
 *    leave the moment they can point at the hop.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE. To put the exact text
 *    a model was sent and the exact text it returned in front of the person who
 *    has to explain the outcome. Everything else is either the path to that hop
 *    or a candidate for removal.
 *
 * 3. KEEP / MOVE / KILL, element by element.
 *    KEEP  the hop list. It is the surface. One row per model call and tool
 *          call, in the order they ran, each already `tight`: who acted, what
 *          they called, what came back, how long it took.
 *    KEEP  the picked hop's full input, system prompt, output, arguments and
 *          result. This is answer 2, literally.
 *    KEEP  outcome, model, routing, latency, tokens, cost, span id, guardrail
 *          hits, eval scores. Every one is a thing an engineer came to read.
 *    KEEP  the timing-and-cost disclosure. Per-hop money is why half the
 *          visits happen, and it is still wrong to have it permanently on
 *          screen for the other half.
 *    KILL  "The brief it was given". A whole titled block whose collapsed
 *          state spent vertical space saying "a brief was injected", and whose
 *          expanded state printed a substring of the root call's system prompt,
 *          which this page already renders in full one click away. A second
 *          home for one string. Gone with its state, its memo and its regex.
 *    KILL  the nesting depth. A bare "2 deep" with no parent chain drawn is a
 *          number nothing depends on, so the whole `withDepth` parent-chain
 *          walk and the `Span` type that carried it are deleted with it.
 *    KILL  the per-span "Surface" fact. When the surface is an agent the row's
 *          own mark and name say so; when it is not, the row lead prints the
 *          surface as the actor. Two renderings of one string, one line apart.
 *    KILL  the trace-level model line in the context column. It showed the
 *          FIRST span's model as though it were the trace's, which is wrong the
 *          moment a run falls back, and every row already names its own model.
 *    KILL  the tool call's "Ran 3d ago". A tool inside a trace is always the
 *          age of the trace; it restated the head.
 *    KILL  the paragraph under the hop list explaining that the hop list is a
 *          list of hops, and the hand-rolled flex rows and bare Block wrappers
 *          around the error and empty states.
 *    MOVE  "When it ran" out of the context column and into the head, beside
 *          hops and wall time, where the other whole-trace facts already live.
 *          One label and one divider fewer in a 300px column.
 *
 * 4. WHAT IS ONE CLICK AWAY. Everything long. A hop row never carries a full
 *    prompt, a full result or a stack trace; it carries one line plus a second
 *    line of DIFFERENT information, and the full text belongs to the one hop in
 *    focus. Long text scrolls inside its own capped box, so neither axis of the
 *    page ever grows: JSON keeps its structure and scrolls sideways in the box,
 *    prose wraps.
 *
 *    THAT LAST SENTENCE WAS A COMMENT AND NOT A FACT, for as long as this file
 *    has existed. The `<pre>` it described set no max height and no overflow, so
 *    a 400 line result grew the page until the controls under it were off
 *    screen, and one wide JSON line pushed the whole page sideways with it. It
 *    is now enforced by `TracePane`, which adapts the text to Meridian's
 *    CodeBlock: the cap, both axes, and a copy control on every pane, which is
 *    the other half of what someone holding a prompt actually wants.
 *
 * 5. DELIGHT, AND CONFUSION. The moment is reading the literal system prompt a
 *    model was handed and recognising a line you wrote. Nothing else in the
 *    product answers "is it really doing what I told it" this directly. The
 *    confusion this surface must not cause is a silent gap: the loop never
 *    writes tool_calls.event_id, so tools cannot be nested under the call that
 *    made them and are interleaved by timestamp instead. Rather than draw a
 *    false hierarchy, the list says it is time order and says the reasoning
 *    between calls lives on the run.
 *
 * 6. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Remove the agents and this
 *    page changes: every hop is attributed at its leading edge, by mark and by
 *    name, and the context column names every agent that touched the trace with
 *    how many calls each made, so a two-agent trace reads as two workers rather
 *    than as one anonymous engine. Judgment leaves a trace here twice: a
 *    guardrail hit says which rule stopped which side, and the eval judge's own
 *    words now render beside its scores instead of being fetched and thrown
 *    away. Registers are kept apart per the DID / SAID law: what ran is a
 *    record of facts in mono, what the judge said is quoted prose.
 *    NOT CLAIMED: work in motion. getTrace returns a mission as {id, title}
 *    with no status, so this surface cannot honestly tell you whether the run
 *    is still going, and it never renders a running or waiting mark. An honest
 *    silence beats a flattering animation. Gap reported, not faked.
 *
 * MECHANISM WORDS ARE CORRECT HERE and almost nowhere else: this is the engine
 * room's drill layer, the reader is an engineer, and trace, span, hop, tool
 * call, guardrail and eval are what a stack trace calls them. Mono carries
 * every id, duration, token count and cost. The one word that was mechanism
 * without meaning was "Via", a single cell holding three unlabelled facts
 * jammed together with separators: it now says who served the call, what it was
 * called through, and, only when it happened, that the first choice failed.
 *
 * COLOUR. Every colour on this surface is a Meridian token. Two of them are
 * outcome and nothing else, and the third state a call can be in, stopped by a
 * guardrail, deliberately has no hue at all: there is no amber in this system
 * and a guardrail stop is not a failure of the call, so it is carried by weight
 * and by words. See `Outcome` below.
 *
 * FIVE THINGS THIS PAGE CAN BE, and they are five different facts rather than
 * two. The read is still running. The read failed. The id in the address is not
 * a trace id, which is the one a mistyped paste actually hits and which used to
 * render the validator's own words about a schema. The trace holds no hop at
 * all, which is also what an expired trace and another account's trace look
 * like, and the copy names all three. And a trace that recorded tool calls but
 * no model call, where the auto-pick has nothing to pick and the page used to
 * simply stop after the hop list.
 *
 * The read is unchanged: getTrace on ["trace", id], the same interleave of
 * ai_events with tool_calls by created_at, the same brief-bearing system
 * prompt, and the same /build and /engine-room targets.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { reasonLine } from "@/lib/error-copy";
import { Row, Who } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingHere,
  Num,
  PageHeading,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { readModelStep, actionLine } from "@/components/traces/what-the-model-said";
import { toolCallFacts } from "@/lib/spine/tool-call-facts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { getTrace } from "@/lib/traces.functions";
import { evalScoreVerdict } from "@/components/observe/EvalScoreChips";
import { AGENT_STATIONS, agentDisplayName, type AgentStation } from "@/lib/agent-vocabulary";
import { stripAutoPrefix } from "@/components/plan/format";
import { Fact, FactLabel, Facts, IdFact, CopyButton } from "@/components/traces/TraceFacts";
import { TracePane } from "@/components/traces/TracePane";
import { ToolTrace } from "@/components/traces/ToolTrace";
import { CtxBody, CtxHead, CtxRow } from "@/components/meridian/ContextColumn";
import { Surface } from "@/components/meridian/Surface";
import { AgentMark, type MarkState } from "@/components/meridian/marks";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

export const Route = createFileRoute("/_authenticated/traces/$traceId")({
  component: TraceReplayPage,
  head: () => ({ meta: [{ title: "Trace · Supaprod" }] }),
});

type Span = {
  id: string;
  parent_event_id: string | null;
  created_at: string;
  surface: string;
  surface_ref: string | null;
  model: string;
  provider: string;
  via: string;
  status: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  est_cost_usd: number;
  latency_ms: number;
  fallback: boolean;
  input_preview: string | null;
  output_preview: string | null;
  system_preview?: string | null;
  error_message: string | null;
};
type ToolCallRow = {
  id: string;
  tool_name: string;
  args: unknown;
  result: unknown;
  ok: boolean;
  error: string | null;
  latency_ms: number;
  created_at: string;
};
type HopRow =
  { kind: "event"; at: number; span: Span } | { kind: "tool"; at: number; tool: ToolCallRow };
type GuardrailHit = { rule_name: string; action: string; side: string; matched: string | null };
type EvalRow = {
  relevance: number | null;
  groundedness: number | null;
  coherence: number | null;
  hallucination_score: number | null;
  toxicity: number | null;
  pii_risk: number | null;
  /** The judge's own words. Fetched by getTrace since the drill shipped and
   *  never rendered until now: six numbers with no reason are six numbers. */
  judge_rationale: string | null;
};
type Selected = { kind: "event" | "tool"; id: string };

/* ------------------------------------------------------------------ *
 * Formatting. Local on purpose: nothing here reaches into another
 * surface's folder, so a parallel port cannot break this one. The
 * presentation atoms in src/components/traces/ ARE this surface's
 * folder, and they take formatted strings rather than a second copy of
 * these functions.
 * ------------------------------------------------------------------ */

function fmtMs(ms: number) {
  if (ms < 1) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Real money. Keep the <$0.0001 floor; never round a real cost to a fake $0. */
function fmtUsd(n: number) {
  if (n === 0) return "$0";
  if (n < 0.0001) return `<$0.0001`;
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

function clip(s: string, n = 180) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

/**
 * ── THE MODEL EXPLAINS EVERY STEP, AND THIS ROW USED TO DRAW THE JSON ──────
 *
 * Read live on `/traces/899baa5a`, 2026-09-09. Seven model calls, each rendered
 * as `clip(s.output_preview)`, so each row read:
 *
 *   Critique called qwen/qwen-plus                                    4.72s
 *   {"thought":"I need to review the standing design system and the spec to
 *    evaluate the provi...
 *
 * Inside that string, on all seven, was a paragraph of the model's own
 * reasoning and -- on the complete ones -- a `reason` field saying WHY it chose
 * the next tool. The deepest surface in a product whose claim is that you can
 * watch an agent work was drawing the punctuation around the answer.
 *
 * `readModelStep` scans rather than parses, because these are `*_preview`
 * columns and `JSON.parse` throws on essentially every row of a busy trace --
 * see `what-the-model-said.ts` for the cut sample that proves it. When the row
 * is not that shape it returns null and this falls back to `clip`, which is
 * what every non-agent writer on this page still gets.
 *
 * THE THOUGHT LEADS AND THE TOOL FOLLOWS. The row's own lead already says who
 * acted and on which model, so this line is for what it was thinking; the tool
 * it then reached for is the consequence and sits after it, in the data face,
 * under its real name. `reason` is deliberately NOT here: it is a second
 * paragraph, and the detail pane beside this row is where a paragraph belongs.
 */
function modelSaid(preview: string): React.ReactNode {
  const step = readModelStep(preview);
  if (!step) return clip(preview);
  /*
   * ── THE WHOLE LINE GOES TO THE THOUGHT, AND THE ACTION IS DROPPED ────────
   *
   * A first version appended the tool the step chose (`... · workspace.search`)
   * and it was wrong twice over, both visible only once it rendered. The row's
   * `sub` is ONE line, so a thought long enough to be worth reading pushed the
   * action off the end and it was never seen; and the action is redundant
   * anyway, because the very next row in this stream is `Critique ran
   * workspace.search`. The stream already says what it called. This says what
   * it was thinking, which is the thing nothing else says.
   */
  if (!step.thought) return actionLine(step) ?? clip(preview);
  return clip(step.thought);
}

/**
 * ── WHAT A TOOL CALL WAS FOR AND WHETHER IT FOUND ANYTHING ────────────────
 *
 * The tool rows rendered `clip(JSON.stringify(t.result ?? t.args))`, so a
 * search read as
 * `[{"id":"a468f120-18bb-47b1-a9d2-290ae0c10d80","kind":"learning","score":0.117,…`
 * With the model rows now in prose, the column alternated between English and
 * machine noise, and the noise sat on exactly the rows a reader needs to follow
 * the story: on this trace the seat searched, found little, said so, and
 * searched again.
 *
 * `toolCallFacts` already answers both halves and is the transcript's own
 * reader, so the trace and the run screen cannot describe one call two ways.
 * `argument` is the query in quotes or the path; `found` is the row count, null
 * for anything that is not a list, and a zero is never invented.
 *
 * Falls back to the raw JSON when it can say neither, because a row that
 * carries something a reader might need must not go blank to look tidy.
 */
function toolDid(tool: string, args: unknown, result: unknown): React.ReactNode {
  const facts = toolCallFacts(tool, args, result);
  const found =
    facts.found === null ? null : facts.found === 1 ? "1 result" : `${facts.found} results`;
  if (!facts.argument && !found) {
    return (result ?? args) != null ? clip(JSON.stringify(result ?? args)) : "No result recorded";
  }
  return [facts.argument, found].filter(Boolean).join(" · ");
}

/** Plain-words clock for the one whole-trace timestamp in the head. */
function since(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 0) return null;
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `on ${new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

/** The route param is free text until something proves otherwise, and getTrace
 *  validates it as a uuid on the server. So a truncated or mistyped id comes
 *  back through the same channel as a database outage and used to render the
 *  validator's own words at the reader, which name a schema rather than the
 *  mistake. The shape is knowable here, so the surface can say which of the two
 *  things went wrong. */
const TRACE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ai_events.via is one of three routes, and the raw word is opaque even to an
 *  engineer: `byo` and `cache` in particular change what the numbers beside them
 *  mean. Unknown values pass through untranslated rather than being swallowed. */
function routeWords(via: string): string {
  if (via === "gateway") return "the shared gateway";
  if (via === "byo") return "your own key";
  if (via === "cache") return "cache, no new call";
  return via;
}

/** ai_events.status is written post-hoc: only ok / error / blocked exist.
 *  A blocked call is NOT a gate: the accent marks a person who has to decide,
 *  and nobody is being asked anything here. It fails soft on the mark and says
 *  so in words on the row's second line. Nothing on this page ever renders
 *  `running`: a trace is a record, and the wiring cannot tell us otherwise. */
function markState(status: string): MarkState {
  if (status === "error") return "failed";
  return "idle";
}

/* ------------------------------------------------------------------ *
 * The one presentation atom that stays here, because it encodes THIS
 * surface's status vocabulary rather than a shape. Everything else the
 * file used to draw by hand (the fact grid, the labels, the panes) now
 * lives in src/components/traces/.
 * ------------------------------------------------------------------ */

/** One honest verdict word for a call's outcome, in the outcome colours.
 *
 *  THREE STATES, TWO COLOURS, and that is deliberate. Green and red report what
 *  happened. A guardrail stop is a third thing: the call did not fail, a rule
 *  refused it, and the reader is not being asked to do anything about it here.
 *  The system has no warn hue to spend on that and is not getting one, so it is
 *  carried by weight and by a full sentence instead, which is what it needed
 *  anyway: "blocked" was never the useful word. */
function Outcome({ status }: { status: string }) {
  if (status === "ok") return <span className="text-mrd-pass">ok</span>;
  if (status === "blocked")
    return <span className="font-medium text-mrd-ink">stopped by a guardrail</span>;
  return <span className="text-mrd-fail">{status}</span>;
}

/* ------------------------------------------------------------------ *
 * The hop you picked
 * ------------------------------------------------------------------ */

function SpanDetail({
  span,
  hits,
  evalRow,
}: {
  span: Span;
  hits: GuardrailHit[];
  evalRow?: EvalRow;
}) {
  const scores = (
    evalRow
      ? [
          { label: "Relevance", value: evalRow.relevance, higherIsBetter: true },
          { label: "Grounded", value: evalRow.groundedness, higherIsBetter: true },
          { label: "Coherence", value: evalRow.coherence, higherIsBetter: true },
          { label: "Hallucination", value: evalRow.hallucination_score, higherIsBetter: false },
          { label: "Toxicity", value: evalRow.toxicity, higherIsBetter: false },
          { label: "PII risk", value: evalRow.pii_risk, higherIsBetter: false },
        ]
      : []
  ).filter((s): s is { label: string; value: number; higherIsBetter: boolean } => {
    return s.value != null && Number.isFinite(s.value);
  });
  const rationale = evalRow?.judge_rationale?.trim() || null;

  return (
    <>
      <Facts>
        <Fact label="Outcome">
          <Outcome status={span.status} />
        </Fact>
        <Fact label="Model">
          <Num>{span.model}</Num>
        </Fact>
        {/* Was one cell labelled "Via" holding `provider · via · fallback`. Three
            facts, no labels, and the cell truncated before the third one. */}
        <Fact label="Served by">
          <Num>{span.provider}</Num>
        </Fact>
        <Fact label="Called through">{routeWords(span.via)}</Fact>
        <Fact label="Took">
          <Num>{fmtMs(span.latency_ms)}</Num>
        </Fact>
        <Fact label="Tokens">
          <Num>{span.prompt_tokens}</Num> in, <Num>{span.completion_tokens}</Num> out
        </Fact>
        <Fact label="Cost">
          <Num>{fmtUsd(Number(span.est_cost_usd))}</Num>
        </Fact>
        {/* Only when it happened. A cell reading "no" on every well-behaved call
            is a column of noise carrying one bit for one call in a hundred. */}
        {span.fallback ? (
          <Fact label="Fallback">the first choice failed, this model was next</Fact>
        ) : null}
      </Facts>

      {/* The id an engineer came for, in full, and takeable. */}
      <IdFact label="Span id" value={span.id} />

      {span.error_message ? (
        <div className="mt-mrd-5 text-mrd-base text-mrd-fail">{span.error_message}</div>
      ) : null}

      {hits.length > 0 ? (
        <div className="mt-mrd-6">
          <FactLabel>{hits.length === 1 ? "Guardrail hit" : "Guardrail hits"}</FactLabel>
          {hits.map((h, i) => (
            <Row
              key={`${h.rule_name}-${i}`}
              tight
              lead={<Who>{h.rule_name}</Who>}
              sub={
                <>
                  {h.side} · {h.action}
                  {h.matched ? (
                    <>
                      {" · "}
                      <Num>{h.matched}</Num>
                    </>
                  ) : null}
                </>
              }
            />
          ))}
        </div>
      ) : null}

      {scores.length > 0 || rationale ? (
        <div className="mt-mrd-6">
          <FactLabel>Judged</FactLabel>
          {scores.length > 0 ? (
            <Facts>
              {scores.map((s) => {
                const verdict = evalScoreVerdict(s.value, s.higherIsBetter);
                // Pass and fail are outcomes and take the outcome colours.
                // "watch" is neither, and the colour it used to wear was the
                // amber this system does not have. It is a word at full ink
                // with weight behind it, which is what the middle of a three
                // step verdict actually needs.
                const tone =
                  verdict === "pass"
                    ? "text-mrd-pass"
                    : verdict === "fail"
                      ? "text-mrd-fail"
                      : "font-medium text-mrd-ink";
                return (
                  <Fact key={s.label} label={s.label}>
                    <span className={tone}>{verdict}</span> <Num>{s.value.toFixed(2)}</Num>
                  </Fact>
                );
              })}
            </Facts>
          ) : null}
          {rationale ? (
            // DID versus SAID: the scores above are a record, this is a claim,
            // and they must never share a treatment. Quoted, in prose, in the
            // judge's own words rather than paraphrased into a fact.
            <div
              className={`max-w-[var(--mrd-measure)] text-mrd-base leading-mrd-prose text-mrd-prose text-mrd-body ${
                scores.length > 0 ? "mt-mrd-5" : ""
              }`}
            >
              The judge said: &quot;{rationale}&quot;
            </div>
          ) : null}
        </div>
      ) : null}

      {span.input_preview ? <TracePane label="Input" text={span.input_preview} /> : null}
      {span.system_preview ? <TracePane label="System prompt" text={span.system_preview} /> : null}
      {span.output_preview ? <TracePane label="Output" text={span.output_preview} /> : null}
    </>
  );
}

function ToolDetail({ tool }: { tool: ToolCallRow }) {
  return (
    <>
      <Facts>
        {/* One outcome vocabulary on the surface. A tool carries a boolean
            rather than a status word, and mapping it here rather than writing
            a second pair of coloured spans is what keeps the two kinds of hop
            saying "ok" and "failed" in the same words and the same colours. */}
        <Fact label="Outcome">
          <Outcome status={tool.ok ? "ok" : "failed"} />
        </Fact>
        {/* The detail pane is the thing that gets screenshotted, and it named
            everything about the call except which tool it was. SpanDetail
            names its model for the same reason one row above says it. */}
        <Fact label="Tool">
          <Num>{tool.tool_name}</Num>
        </Fact>
        <Fact label="Took">
          <Num>{fmtMs(tool.latency_ms)}</Num>
        </Fact>
      </Facts>

      <IdFact label="Call id" value={tool.id} />

      {tool.error ? <div className="mt-mrd-5 text-mrd-base text-mrd-fail">{tool.error}</div> : null}

      {tool.args != null ? (
        <TracePane label="Arguments" json text={JSON.stringify(tool.args, null, 2)} />
      ) : null}
      {tool.result != null ? (
        <TracePane label="Result" json text={JSON.stringify(tool.result, null, 2)} />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The drill body. Takes { id } per the drill contract: the route
 * passes the param.
 * ------------------------------------------------------------------ */

export function TraceDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const fGet = useServerFn(getTrace);
  const trace = useQuery({
    queryKey: ["trace", id],
    queryFn: () => fGet({ data: { traceId: id } }),
  });

  const [selected, setSelected] = React.useState<Selected | null>(null);
  // Tokens and cost per hop hide until asked for; the head and the context
  // column keep the trace-level totals either way, so nothing real vanishes.
  const [showCost, setShowCost] = React.useState(false);

  const spans = React.useMemo(() => (trace.data?.events ?? []) as Span[], [trace.data]);
  const toolCalls = React.useMemo(
    () => (trace.data?.toolCalls ?? []) as ToolCallRow[],
    [trace.data],
  );

  // Interleave LLM spans and tool calls strictly by created_at: the loop
  // never writes tool_calls.event_id, so time order is the only honest join.
  const hopRows = React.useMemo<HopRow[]>(() => {
    const rows: HopRow[] = [
      ...spans.map((s) => ({
        kind: "event" as const,
        at: new Date(s.created_at).getTime(),
        span: s,
      })),
      ...toolCalls.map((t) => ({
        kind: "tool" as const,
        at: new Date(t.created_at).getTime(),
        tool: t,
      })),
    ];
    rows.sort((a, b) => a.at - b.at);
    return rows;
  }, [spans, toolCalls]);

  // Wall clock across both row kinds.
  const t0 = hopRows.length ? Math.min(...hopRows.map((r) => r.at)) : 0;
  const tEnd = hopRows.length
    ? Math.max(
        ...hopRows.map(
          (r) => r.at + ((r.kind === "event" ? r.span.latency_ms : r.tool.latency_ms) || 0),
        ),
      )
    : 0;
  const totalMs = Math.max(1, tEnd - t0);

  // Auto-select the root span once events load, so the detail is never empty.
  // The root is also the span carrying the assembled system prompt, which is
  // why the separate brief block was deleted rather than re-homed.
  React.useEffect(() => {
    if (!selected && spans.length > 0) setSelected({ kind: "event", id: spans[0].id });
  }, [spans, selected]);

  const hitsByEvent = new Map<string, GuardrailHit[]>();
  for (const h of trace.data?.hits ?? []) {
    const arr = hitsByEvent.get(h.event_id) ?? [];
    arr.push(h);
    hitsByEvent.set(h.event_id, arr);
  }
  const evalsByEvent = new Map(trace.data?.evals.map((e) => [e.event_id, e]) ?? []);

  const totals = {
    tokens: spans.reduce((n, s) => n + (s.total_tokens || 0), 0),
    cost: spans.reduce((n, s) => n + Number(s.est_cost_usd || 0), 0),
    failed:
      spans.filter((s) => s.status === "error").length + toolCalls.filter((t) => !t.ok).length,
    blocked: spans.filter((s) => s.status === "blocked").length,
  };

  const mission = trace.data?.mission ?? null;
  const rootSurface = spans[0]?.surface ?? null;
  // Only agent-surface spans carry a slug in surface_ref; tool rows (agent_id
  // uuid only) ride under the trace's agent slug.
  const traceAgentSlug =
    spans.find((s) => s.surface === "agent" && s.surface_ref)?.surface_ref ?? null;

  // Every agent that touched this trace, with how many calls each made. A
  // handoff inside one trace is real and used to render as a single anonymous
  // "who ran it"; two workers now read as two workers.
  const actors = React.useMemo(() => {
    const calls = new Map<string, number>();
    for (const s of spans) {
      if (s.surface === "agent" && s.surface_ref) {
        calls.set(s.surface_ref, (calls.get(s.surface_ref) ?? 0) + 1);
      }
    }
    return [...calls.entries()].map(([slug, n]) => ({ slug, n }));
  }, [spans]);

  // IA spine: the record room's traces view is the canonical home for this
  // drill layer, and the shell header no longer carries a crumb trail.
  const back = React.useCallback(
    () => void navigate({ to: "/engine-room", search: { room: "record", view: "traces" } }),
    [navigate],
  );

  const shortTitle = (
    <>
      Trace <Num>{id.slice(0, 8)}</Num>
    </>
  );

  // The title holds still across every one of the states below. It used to be
  // the loading sentence, so arriving replaced the h1 and shifted everything
  // under it.
  if (trace.isLoading) {
    return (
      <Surface>
        {/* `.sp-block` and `.sp-empty` carried their own margins in the retired
            sheet. Meridian's parts set none, so the surface owns the rhythm and
            `gap-mrd-6` is the step every ported route uses. `data-mrd` rides on
            it because `Surface` is a layout move that carries no ground of its
            own, and an early return is exactly where a control would otherwise
            sit outside a Meridian root. */}
        <div data-mrd="" className="flex flex-col gap-mrd-6">
          <PageHeading title={shortTitle} />
          <Reading>Reading the trace.</Reading>
        </div>
      </Surface>
    );
  }

  if (trace.error) {
    return (
      <Surface>
        <div data-mrd="" className="flex flex-col gap-mrd-6">
          <PageHeading title={shortTitle} />
          {TRACE_ID.test(id) ? (
            <ReadFailedLine error={trace.error} onRetry={() => void trace.refetch()}>
              {reasonLine("This trace did not load, so nothing here is its record.", trace.error)}
            </ReadFailedLine>
          ) : (
            // A MISTYPED ID AND A FAILED READ ARE DIFFERENT FACTS, and the reader
            // acts differently on each: one is checked against the log line they
            // came from, the other is waited out. Retrying an id that is not one
            // never succeeds, so this branch offers no retry and leans on the way
            // out below, which every branch here already carries.
            <ReadFailedLine>
              That is not a trace id. A trace id is 36 characters in five groups separated by
              hyphens, so check the one you were given for a missing character at either end.
            </ReadFailedLine>
          )}
          <Actions>
            <Action variant="quiet" onClick={back}>
              All traces
            </Action>
          </Actions>
        </div>
      </Surface>
    );
  }

  if (hopRows.length === 0) {
    return (
      <Surface>
        <div data-mrd="" className="flex flex-col gap-mrd-6">
          <PageHeading title={shortTitle} />
          <NothingHere>
            No model calls or tool calls were recorded on this trace. It may have expired, or it
            belongs to another account.
          </NothingHere>
          <Actions>
            <Action variant="quiet" onClick={back}>
              All traces
            </Action>
          </Actions>
        </div>
      </Surface>
    );
  }

  const selRow: HopRow | null = selected
    ? (hopRows.find((r) =>
        selected.kind === "event"
          ? r.kind === "event" && r.span.id === selected.id
          : r.kind === "tool" && r.tool.id === selected.id,
      ) ?? null)
    : null;

  const ranAgo = since(new Date(t0).toISOString());
  const run = trace.data?.run ?? null;
  /* `run.station` is the seat's own station (Lane 3, after the live walk that
     saw a Discover turn headed "at Learn" while the read carried the track's
     current station). The eyebrow and the sub name it. */
  const runStation: AgentStation | undefined =
    run?.station && run.station in AGENT_STATIONS ? (run.station as AgentStation) : undefined;

  return (
    <Surface
      context={
        <>
          <CtxHead>Who ran it</CtxHead>
          {actors.length > 0 ? (
            actors.map((a) => (
              <CtxRow
                key={a.slug}
                mark={
                  <AgentMark
                    slug={a.slug}
                    state={totals.failed > 0 && actors.length === 1 ? "failed" : "idle"}
                  />
                }
                name={agentDisplayName(a.slug)}
                sub={
                  <>
                    <Num>{a.n}</Num> {a.n === 1 ? "call" : "calls"}
                  </>
                }
              />
            ))
          ) : (
            <CtxRow
              mark={
                <AgentMark
                  slug={null}
                  name={rootSurface}
                  state={totals.failed > 0 ? "failed" : "idle"}
                />
              }
              name={rootSurface ?? "The engine"}
              sub="no agent on this trace"
            />
          )}

          <CtxHead>What it cost</CtxHead>
          <CtxBody>
            <Num>{totals.tokens}</Num> tokens · <Num>{fmtUsd(totals.cost)}</Num>
          </CtxBody>

          <CtxHead>Trace id</CtxHead>
          <CtxBody>
            <span className="flex flex-wrap items-center gap-x-mrd-4 gap-y-mrd-2">
              <span className="min-w-0 break-all">
                <Num>{id}</Num>
              </span>
              {/* The same control the span and call ids carry. Reading 36
                  characters off a screen to retype them into a log query is the
                  work this surface exists to save. */}
              <CopyButton value={id} what="trace id" />
            </span>
          </CtxBody>

          <div className="mt-mrd-6 flex flex-wrap gap-mrd-4">
            {run?.trackId ? (
              /* The run's own address, now that getTrace carries the track
                 (2d408fd48); it fell back to Start while it could not. */
              <Action
                onClick={() =>
                  void navigate({
                    to: "/track/$trackId",
                    params: { trackId: run.trackId as string },
                  })
                }
              >
                Open the run
              </Action>
            ) : mission ? (
              <Action onClick={() => void navigate({ to: SIGNED_IN_HOME })}>Open the run</Action>
            ) : null}
            <Action variant="quiet" onClick={back}>
              All traces
            </Action>
          </div>
        </>
      }
    >
      <div data-mrd="" className="flex flex-col gap-mrd-6">
        {/*
         * ── THE TRACE KEEPS ITS RUN'S CONTEXT (2026-09-08) ──────────────────
         * Reached from "Open the full trace" on a transcript turn, this page
         * headed itself "Trace 67c7327f" and knew nothing of the run, so the
         * person who arrived from one landed with the context gone. Lane 3's
         * read now carries the run (2d408fd48): the seat, the station and the
         * person's own sentence lead, the id stays in the context column, and
         * one door goes back to the run.
         */}
        <PageHeading
          station={runStation}
          title={run?.trackTitle ?? (mission ? stripAutoPrefix(mission.title) : shortTitle)}
          sub={
            <>
              {run ? (
                <>
                  {run.agentName}&rsquo;s turn
                  {runStation ? ` at ${AGENT_STATIONS[runStation].name}` : ""} ·{" "}
                </>
              ) : null}
              <Num>{hopRows.length}</Num> {hopRows.length === 1 ? "hop" : "hops"} ·{" "}
              <Num>{fmtMs(totalMs)}</Num> wall
              {ranAgo ? <> · {ranAgo}</> : null}
              {totals.failed > 0 ? (
                <>
                  {" · "}
                  <span className="text-mrd-fail">
                    <Num>{totals.failed}</Num> failed
                  </span>
                </>
              ) : null}
              {totals.blocked > 0 ? (
                <>
                  {" · "}
                  {/* No hue, for the reason `Outcome` gives. Weight lifts it off a
                    muted subtitle without claiming the run broke. */}
                  <span className="font-medium text-mrd-ink">
                    <Num>{totals.blocked}</Num> stopped by a guardrail
                  </span>
                </>
              ) : null}
            </>
          }
        />
        {run?.trackId ? (
          <div>
            <Link
              to="/track/$trackId"
              params={{ trackId: run.trackId }}
              className="mrd-focus inline-flex items-center gap-1 rounded-mrd-ctl text-mrd-small text-mrd-mute underline decoration-mrd-line underline-offset-4 transition-colors hover:text-mrd-ink hover:decoration-mrd-edge"
            >
              Back to the run
              <span aria-hidden className="text-mrd-faint">
                &rarr;
              </span>
            </Link>
          </div>
        ) : null}

        {/* Shut, one line, and it names its own failures. See ToolTrace. */}
        <ToolTrace
          tools={toolCalls.map((t) => ({
            id: t.id,
            name: t.tool_name,
            ok: t.ok,
            took: fmtMs(t.latency_ms),
          }))}
          onPick={(toolId) => setSelected({ kind: "tool", id: toolId })}
        />

        <Region
          title="What ran"
          // The one non-obvious thing about this list, said once: it is time
          // order rather than a call tree, and the thinking is not in it.
          sub={
            mission
              ? "In the order they ran, not nested: the reasoning between calls lives on the run."
              : "In the order they ran. Previews are cut short."
          }
          toggle={showCost ? "Hide timing and cost" : "Show timing and cost"}
          onToggle={() => setShowCost((v) => !v)}
          toggled={showCost}
        >
          {hopRows.map((r) => {
            const isSel =
              selected != null &&
              (r.kind === "event"
                ? selected.kind === "event" && r.span.id === selected.id
                : selected.kind === "tool" && r.tool.id === selected.id);
            const rowId = r.kind === "event" ? r.span.id : r.tool.id;
            const latency = (r.kind === "event" ? r.span.latency_ms : r.tool.latency_ms) || 0;
            const offset = r.at - t0;

            if (r.kind === "event") {
              const s = r.span;
              const actor =
                s.surface === "agent" && s.surface_ref
                  ? agentDisplayName(s.surface_ref)
                  : s.surface;
              const hits = hitsByEvent.get(s.id) ?? [];
              const outcome =
                s.status === "error" && s.error_message ? (
                  <span className="text-mrd-fail">{clip(s.error_message)}</span>
                ) : s.status === "blocked" ? (
                  <span className="font-medium text-mrd-ink">
                    {s.error_message ? clip(s.error_message) : "Stopped by a guardrail"}
                  </span>
                ) : s.output_preview ? (
                  modelSaid(s.output_preview)
                ) : (
                  "No output recorded"
                );
              return (
                <Row
                  key={rowId}
                  tight
                  focused={isSel}
                  marks={
                    <AgentMark
                      slug={s.surface === "agent" ? s.surface_ref : traceAgentSlug}
                      name={s.surface}
                      state={markState(s.status)}
                    />
                  }
                  lead={
                    <>
                      <Who>{actor}</Who> called <Num>{s.model}</Num>
                    </>
                  }
                  // ONE REGISTER PER LINE. Cost mode replaces the preview with
                  // the numbers rather than prefixing it: five facts in a
                  // truncating row means the last two are never read, and you
                  // opened cost mode because you came for the numbers. A bad
                  // outcome is never optional and shows in either mode.
                  sub={
                    showCost ? (
                      <>
                        <Num>{s.total_tokens || 0}</Num> tokens ·{" "}
                        <Num>{fmtUsd(Number(s.est_cost_usd))}</Num> · started +
                        <Num>{fmtMs(offset)}</Num>
                        {s.status !== "ok" ? <> · {outcome}</> : null}
                      </>
                    ) : (
                      <>
                        {hits.length > 0 ? (
                          <>
                            <span className="font-medium text-mrd-ink">
                              <Num>{hits.length}</Num>{" "}
                              {hits.length === 1 ? "guardrail hit" : "guardrail hits"}
                            </span>
                            {" · "}
                          </>
                        ) : null}
                        {outcome}
                      </>
                    )
                  }
                  time={fmtMs(latency)}
                  onClick={() => setSelected({ kind: "event", id: s.id })}
                />
              );
            }

            const t = r.tool;
            const actor = traceAgentSlug ? agentDisplayName(traceAgentSlug) : "The engine";
            return (
              <Row
                key={rowId}
                tight
                focused={isSel}
                marks={
                  <AgentMark slug={traceAgentSlug} name="Tool" state={t.ok ? "idle" : "failed"} />
                }
                lead={
                  <>
                    <Who>{actor}</Who> ran <Num>{t.tool_name}</Num>
                  </>
                }
                sub={
                  showCost && t.ok ? (
                    <>
                      started +<Num>{fmtMs(offset)}</Num>
                    </>
                  ) : !t.ok && t.error ? (
                    <span className="text-mrd-fail">{clip(t.error)}</span>
                  ) : (
                    toolDid(t.tool_name, t.args, t.result)
                  )
                }
                time={fmtMs(latency)}
                onClick={() => setSelected({ kind: "tool", id: t.id })}
              />
            );
          })}
        </Region>

        {selRow ? (
          <Region
            title={selRow.kind === "event" ? "The call you picked" : "The tool call you picked"}
          >
            {selRow.kind === "event" ? (
              <SpanDetail
                span={selRow.span}
                hits={hitsByEvent.get(selRow.span.id) ?? []}
                evalRow={evalsByEvent.get(selRow.span.id)}
              />
            ) : (
              <ToolDetail tool={selRow.tool} />
            )}
          </Region>
        ) : (
          // The root span is picked for you the moment events load, so this is
          // reached only by a trace that recorded tool calls and no model call
          // at all. That used to render as a page that simply stopped.
          <Region title="Nothing is picked">
            <NothingHere>Pick a hop above to read what it was sent and what came back.</NothingHere>
          </Region>
        )}
      </div>
    </Surface>
  );
}

/* ---------- Route shell. No TopBar: the app frame draws the header. ---------- */

function TraceReplayPage() {
  const { traceId } = Route.useParams();
  return <TraceDetail id={traceId} />;
}
