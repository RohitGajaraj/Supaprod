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
 *    receipt of facts in mono, what the judge said is quoted prose.
 *    NOT CLAIMED: work in motion. getTrace returns a mission as {id, title}
 *    with no status, so this surface cannot honestly tell you whether the run
 *    is still going, and it never renders a running or waiting mark. An honest
 *    silence beats a flattering animation. Gap reported, not faked.
 *
 * MECHANISM WORDS ARE CORRECT HERE and almost nowhere else: this is the engine
 * room's drill layer, the reader is an engineer, and trace, span, hop, tool
 * call, guardrail and eval are what a stack trace calls them. Mono carries
 * every id, duration, token count and cost.
 *
 * The read is unchanged: getTrace on ["trace", id], the same interleave of
 * ai_events with tool_calls by created_at, the same brief-bearing system
 * prompt, and the same /build and /engine-room targets.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { getTrace } from "@/lib/traces.functions";
import { evalScoreVerdict } from "@/components/observe/EvalScoreChips";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { stripAutoPrefix } from "@/components/plan/format";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Num,
  PageHead,
  Row,
  Surface,
  Who,
  type MarkState,
} from "@/components/shell/primitives";

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
 * surface's folder, so a parallel port cannot break this one.
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

/** ai_events.status is written post-hoc: only ok / error / blocked exist.
 *  A blocked call is NOT a gate: ember marks the human and nothing else, and
 *  nobody is being asked anything here. It fails soft on the mark and says so
 *  in words on the row's second line. Nothing on this page ever renders
 *  `running`: a trace is a record, and the wiring cannot tell us otherwise. */
function markState(status: string): MarkState {
  if (status === "error") return "failed";
  return "idle";
}

/* ------------------------------------------------------------------ *
 * Local presentation atoms. Deliberately not added to the shared
 * primitives: they are this surface's shape, not the system's.
 * ------------------------------------------------------------------ */

const factGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
  gap: "16px 20px",
};

const factValue: React.CSSProperties = {
  fontSize: "var(--sp-text-meta)",
  color: "var(--sp-ink)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** Capped, and it scrolls on BOTH axes inside its own box. Horizontal
 *  scrolling was named twice as a pain point, so a 400-line result may never
 *  grow the page and a 300-column JSON line may never widen it. */
const paneBase: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--sp-font-mono)",
  fontSize: "var(--sp-text-data)",
  lineHeight: 1.6,
  color: "var(--sp-body)",
  background: "var(--sp-sink)",
  borderRadius: "var(--sp-radius-panel)",
  padding: "14px 16px",
  maxHeight: 260,
  overflow: "auto",
};

const noteStyle: React.CSSProperties = {
  marginTop: 16,
  fontSize: "var(--sp-text-meta)",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="sp-ctx-head" style={{ marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Label>{label}</Label>
      <div style={factValue}>{children}</div>
    </div>
  );
}

/** `data` keeps structure and scrolls sideways in its box: indented JSON is
 *  unreadable once it is word-broken. Prose wraps, because a paragraph that
 *  scrolls sideways is the defect this rule exists to prevent. */
function Pane({
  label,
  data = false,
  children,
}: {
  label: string;
  data?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <Label>{label}</Label>
      <pre
        style={
          data
            ? { ...paneBase, whiteSpace: "pre" }
            : { ...paneBase, whiteSpace: "pre-wrap", wordBreak: "break-word" }
        }
      >
        {children}
      </pre>
    </div>
  );
}

/** One honest verdict word for a call's outcome, in the outcome colours. */
function Outcome({ status }: { status: string }) {
  if (status === "ok") return <span className="sp-pass">ok</span>;
  if (status === "blocked") return <span className="sp-warn">stopped by a guardrail</span>;
  return <span className="sp-fail">{status}</span>;
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
      <div style={factGrid}>
        <Fact label="Outcome">
          <Outcome status={span.status} />
        </Fact>
        <Fact label="Model">
          <Num>{span.model}</Num>
        </Fact>
        <Fact label="Via">
          <Num>{`${span.provider} · ${span.via}${span.fallback ? " · fallback" : ""}`}</Num>
        </Fact>
        <Fact label="Took">
          <Num>{fmtMs(span.latency_ms)}</Num>
        </Fact>
        <Fact label="Tokens">
          <Num>{span.prompt_tokens.toLocaleString()}</Num> in,{" "}
          <Num>{span.completion_tokens.toLocaleString()}</Num> out
        </Fact>
        <Fact label="Cost">
          <Num>{fmtUsd(Number(span.est_cost_usd))}</Num>
        </Fact>
        <Fact label="Span id">
          <Num>{span.id}</Num>
        </Fact>
      </div>

      {span.error_message ? (
        <div style={{ ...noteStyle }} className="sp-fail">
          {span.error_message}
        </div>
      ) : null}

      {hits.length > 0 ? (
        <div style={{ marginTop: 22 }}>
          <Label>{hits.length === 1 ? "Guardrail hit" : "Guardrail hits"}</Label>
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
        <div style={{ marginTop: 22 }}>
          <Label>Judged</Label>
          {scores.length > 0 ? (
            <div style={factGrid}>
              {scores.map((s) => {
                const verdict = evalScoreVerdict(s.value, s.higherIsBetter);
                const tone =
                  verdict === "pass" ? "sp-pass" : verdict === "watch" ? "sp-warn" : "sp-fail";
                return (
                  <div key={s.label} style={{ minWidth: 0 }}>
                    <Label>{s.label}</Label>
                    <div style={factValue}>
                      <span className={tone}>{verdict}</span> <Num>{s.value.toFixed(2)}</Num>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {rationale ? (
            // DID versus SAID: the scores above are a record, this is a claim,
            // and they must never share a treatment. Quoted, in prose, in the
            // judge's own words rather than paraphrased into a fact.
            <div
              style={{
                marginTop: scores.length > 0 ? 16 : 0,
                fontSize: "var(--sp-text-meta)",
                color: "var(--sp-body)",
                maxWidth: "68ch",
                lineHeight: "var(--sp-leading-body)",
              }}
            >
              The judge said: &quot;{rationale}&quot;
            </div>
          ) : null}
        </div>
      ) : null}

      {span.input_preview ? <Pane label="Input">{span.input_preview}</Pane> : null}
      {span.system_preview ? <Pane label="System prompt">{span.system_preview}</Pane> : null}
      {span.output_preview ? <Pane label="Output">{span.output_preview}</Pane> : null}
    </>
  );
}

function ToolDetail({ tool }: { tool: ToolCallRow }) {
  return (
    <>
      <div style={factGrid}>
        <Fact label="Outcome">
          {tool.ok ? <span className="sp-pass">ok</span> : <span className="sp-fail">failed</span>}
        </Fact>
        <Fact label="Took">
          <Num>{fmtMs(tool.latency_ms)}</Num>
        </Fact>
        <Fact label="Call id">
          <Num>{tool.id}</Num>
        </Fact>
      </div>

      {tool.error ? (
        <div style={{ ...noteStyle }} className="sp-fail">
          {tool.error}
        </div>
      ) : null}

      {tool.args != null ? (
        <Pane label="Arguments" data>
          {JSON.stringify(tool.args, null, 2)}
        </Pane>
      ) : null}
      {tool.result != null ? (
        <Pane label="Result" data>
          {JSON.stringify(tool.result, null, 2)}
        </Pane>
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

  if (trace.isLoading) {
    return (
      <Surface>
        <PageHead title="Reading the trace." />
      </Surface>
    );
  }

  if (trace.error) {
    return (
      <Surface>
        <PageHead title={shortTitle} />
        <Failed onRetry={() => void trace.refetch()}>{(trace.error as Error).message}</Failed>
        <Actions>
          <Button variant="ghost" onClick={back}>
            All traces
          </Button>
        </Actions>
      </Surface>
    );
  }

  if (hopRows.length === 0) {
    return (
      <Surface>
        <PageHead title={shortTitle} />
        <Empty>
          No model calls or tool calls were recorded on this trace. It may have expired, or it
          belongs to another account.
        </Empty>
        <Actions>
          <Button variant="ghost" onClick={back}>
            All traces
          </Button>
        </Actions>
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

  return (
    <Surface
      context={
        <>
          <div className="sp-ctx-head">Who ran it</div>
          {actors.length > 0 ? (
            actors.map((a) => (
              <div className="sp-ctx-row" key={a.slug}>
                <AgentMark
                  slug={a.slug}
                  state={totals.failed > 0 && actors.length === 1 ? "failed" : "idle"}
                />
                <span>
                  <span className="sp-ctx-name">{agentDisplayName(a.slug)}</span>
                  <span className="sp-ctx-sub">
                    <Num>{a.n}</Num> {a.n === 1 ? "call" : "calls"}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div className="sp-ctx-row">
              <AgentMark
                slug={null}
                name={rootSurface}
                state={totals.failed > 0 ? "failed" : "idle"}
              />
              <span>
                <span className="sp-ctx-name">{rootSurface ?? "The engine"}</span>
                <span className="sp-ctx-sub">no agent on this trace</span>
              </span>
            </div>
          )}

          <div className="sp-ctx-head">What it cost</div>
          <div className="sp-ctx-body">
            <Num>{totals.tokens.toLocaleString()}</Num> tokens · <Num>{fmtUsd(totals.cost)}</Num>
          </div>

          <div className="sp-ctx-head">Trace id</div>
          <div className="sp-ctx-body" style={{ wordBreak: "break-all" }}>
            <Num>{id}</Num>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 24 }}>
            {mission ? (
              <Button
                onClick={() =>
                  void navigate({ to: "/build/$missionId", params: { missionId: mission.id } })
                }
              >
                Open the run
              </Button>
            ) : null}
            <Button variant="ghost" onClick={back}>
              All traces
            </Button>
          </div>
        </>
      }
    >
      <PageHead
        title={mission ? stripAutoPrefix(mission.title) : shortTitle}
        sub={
          <>
            <Num>{hopRows.length}</Num> {hopRows.length === 1 ? "hop" : "hops"} ·{" "}
            <Num>{fmtMs(totalMs)}</Num> wall
            {ranAgo ? <> · {ranAgo}</> : null}
            {totals.failed > 0 ? (
              <>
                {" · "}
                <span className="sp-fail">
                  <Num>{totals.failed}</Num> failed
                </span>
              </>
            ) : null}
            {totals.blocked > 0 ? (
              <>
                {" · "}
                <span className="sp-warn">
                  <Num>{totals.blocked}</Num> stopped by a guardrail
                </span>
              </>
            ) : null}
          </>
        }
      />

      <Block
        title="What ran"
        // The one non-obvious thing about this list, said once: it is time
        // order rather than a call tree, and the thinking is not in it.
        sub={
          mission
            ? "In the order they ran, not nested: the reasoning between calls lives on the run."
            : "In the order they ran. Previews are cut short."
        }
        more={showCost ? "Hide timing and cost" : "Show timing and cost"}
        onMore={() => setShowCost((v) => !v)}
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
              s.surface === "agent" && s.surface_ref ? agentDisplayName(s.surface_ref) : s.surface;
            const hits = hitsByEvent.get(s.id) ?? [];
            const outcome =
              s.status === "error" && s.error_message ? (
                <span className="sp-fail">{clip(s.error_message)}</span>
              ) : s.status === "blocked" ? (
                <span className="sp-warn">
                  {s.error_message ? clip(s.error_message) : "Stopped by a guardrail"}
                </span>
              ) : s.output_preview ? (
                clip(s.output_preview)
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
                sub={
                  <>
                    {showCost ? (
                      <>
                        <Num>{(s.total_tokens || 0).toLocaleString()}</Num> tokens ·{" "}
                        <Num>{fmtUsd(Number(s.est_cost_usd))}</Num> · +<Num>{fmtMs(offset)}</Num>{" "}
                        ·{" "}
                      </>
                    ) : null}
                    {hits.length > 0 ? (
                      <>
                        <span className="sp-warn">
                          <Num>{hits.length}</Num>{" "}
                          {hits.length === 1 ? "guardrail hit" : "guardrail hits"}
                        </span>
                        {" · "}
                      </>
                    ) : null}
                    {outcome}
                  </>
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
                <>
                  {showCost ? (
                    <>
                      +<Num>{fmtMs(offset)}</Num>
                      {" · "}
                    </>
                  ) : null}
                  {!t.ok && t.error ? (
                    <span className="sp-fail">{clip(t.error)}</span>
                  ) : (t.result ?? t.args) != null ? (
                    clip(JSON.stringify(t.result ?? t.args))
                  ) : (
                    "No result recorded"
                  )}
                </>
              }
              time={fmtMs(latency)}
              onClick={() => setSelected({ kind: "tool", id: t.id })}
            />
          );
        })}
      </Block>

      {selRow ? (
        <Block title={selRow.kind === "event" ? "The call you picked" : "The tool call you picked"}>
          {selRow.kind === "event" ? (
            <SpanDetail
              span={selRow.span}
              hits={hitsByEvent.get(selRow.span.id) ?? []}
              evalRow={evalsByEvent.get(selRow.span.id)}
            />
          ) : (
            <ToolDetail tool={selRow.tool} />
          )}
        </Block>
      ) : null}
    </Surface>
  );
}

/* ---------- Route shell. No TopBar: the app frame draws the header. ---------- */

function TraceReplayPage() {
  const { traceId } = Route.useParams();
  return <TraceDetail id={traceId} />;
}
