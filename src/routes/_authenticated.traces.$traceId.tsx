/**
 * One trace, in detail. The record room's drill layer, ported onto the
 * rebuild primitives (step 4).
 *
 * WHAT THE RETIRED VERSION WAS: a page-level TopBar with its own four-part
 * breadcrumb (a second header, on top of the shell's), a DrillHeader with a
 * back button and a kicker, then a seven-column CSS grid table drawn by hand
 * inside a `bento` card, each row carrying a hand-positioned waterfall bar,
 * and a second `bento` card underneath holding the inspector, which drew its
 * own bordered cards for guardrail hits and its own bordered tiles for eval
 * scores. Four levels of container, three separate skins, and every colour
 * literal written at the call site.
 *
 * WHAT IT IS NOW: one surface that reads top to bottom and says three things:
 *   what ran  ·  the hop you picked  ·  the brief it was given
 *
 * The hop table is an attribution list, because that is what it always was:
 * who did what, and how long it took. The seven columns collapse into the
 * row's own three slots, and the numbers an engineer came for ride the
 * "Show timing and cost" disclosure rather than being permanently on screen.
 *
 * MECHANISM WORDS ARE ALLOWED HERE and almost nowhere else: this is the
 * engine room's drill layer, the reader is an engineer, and trace / span /
 * hop / guardrail / eval are what a stack trace calls them.
 *
 * Nothing about the read changed: getTrace on ["trace", id], the same
 * interleave of ai_events spans with tool_calls by created_at, the same
 * parent-chain depth, the same brief extraction, and the same /build and
 * /engine-room targets.
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
  AgentMark,
  Block,
  Button,
  Empty,
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

type EventRow = {
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
type Span = EventRow & { depth: number };
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

/** Plain-words clock, so the context column reads as a sentence. */
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

/** Depth via the ai_events parent chain. The retired table drew it as row
 *  indentation; a nested row inside a list reads as a card in a card, so the
 *  number rides the inspector instead. */
function withDepth(events: EventRow[]): Span[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const cache = new Map<string, number>();
  const depthOf = (id: string): number => {
    if (cache.has(id)) return cache.get(id)!;
    const e = byId.get(id);
    if (!e || !e.parent_event_id || !byId.has(e.parent_event_id)) {
      cache.set(id, 0);
      return 0;
    }
    const d = depthOf(e.parent_event_id) + 1;
    cache.set(id, d);
    return d;
  };
  return events.map((e) => ({ ...e, depth: depthOf(e.id) }));
}

/** ai_events.status is written post-hoc: only ok / error / blocked exist.
 *  A blocked call is NOT a gate: ember marks the human and nothing else, and
 *  nobody is being asked anything here. It fails soft on the mark and says so
 *  in words on the row's second line. */
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

const paneStyle: React.CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
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

function Pane({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <Label>{label}</Label>
      <pre style={paneStyle}>{children}</pre>
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
        <Fact label="Surface">
          <Num>{span.surface}</Num>
        </Fact>
        {span.depth > 0 ? (
          <Fact label="Nested">
            <Num>{span.depth}</Num> deep
          </Fact>
        ) : null}
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

      {scores.length > 0 ? (
        <div style={{ marginTop: 22 }}>
          <Label>Judged</Label>
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
        {since(tool.created_at) ? <Fact label="Ran">{since(tool.created_at)}</Fact> : null}
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
        <Pane label="Arguments">{JSON.stringify(tool.args, null, 2)}</Pane>
      ) : null}
      {tool.result != null ? (
        <Pane label="Result">{JSON.stringify(tool.result, null, 2)}</Pane>
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
  const [showBrief, setShowBrief] = React.useState(false);

  const spans = React.useMemo(
    () => withDepth((trace.data?.events ?? []) as EventRow[]),
    [trace.data],
  );
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
  React.useEffect(() => {
    if (!selected && spans.length > 0) setSelected({ kind: "event", id: spans[0].id });
  }, [spans, selected]);

  // Pull the brief block out of the first agent system prompt, if present.
  const briefBlock = React.useMemo(() => {
    const root = spans.find((s) => s.system_preview);
    const sys = root?.system_preview ?? "";
    const m = sys.match(/--- Workspace Strategic Brief[\s\S]*?--- End brief ---/);
    return m ? m[0] : null;
  }, [spans]);

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

  // IA spine: the record room's traces view is the canonical home for this
  // drill layer, and the shell header no longer carries a crumb trail.
  const back = React.useCallback(
    () => void navigate({ to: "/engine-room", search: { room: "record", view: "traces" } }),
    [navigate],
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
        <PageHead
          title="This trace did not load."
          sub={<span className="sp-fail">{(trace.error as Error).message}</span>}
        />
        <Block>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            <Button onClick={() => void trace.refetch()}>Try again</Button>
            <Button variant="ghost" onClick={back}>
              All traces
            </Button>
          </div>
        </Block>
      </Surface>
    );
  }

  if (hopRows.length === 0) {
    return (
      <Surface>
        <PageHead
          title={
            <>
              Trace <Num>{id.slice(0, 8)}</Num>
            </>
          }
        />
        <Block>
          <Empty>
            No model calls or tool calls were recorded on this trace. It may have expired, or it
            belongs to another account.
          </Empty>
          <Button variant="ghost" onClick={back}>
            All traces
          </Button>
        </Block>
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

  const startedAt = hopRows.length ? new Date(t0).toISOString() : null;

  return (
    <Surface
      context={
        <>
          <div className="sp-ctx-head">Who ran it</div>
          <div className="sp-ctx-row">
            <AgentMark
              slug={traceAgentSlug}
              name={rootSurface}
              state={totals.failed > 0 ? "failed" : "idle"}
            />
            <span>
              <span className="sp-ctx-name">
                {traceAgentSlug ? agentDisplayName(traceAgentSlug) : (rootSurface ?? "The engine")}
              </span>
              {spans[0]?.model ? (
                <span className="sp-ctx-sub">
                  <Num>{spans[0].model}</Num>
                </span>
              ) : null}
            </span>
          </div>

          <div className="sp-ctx-head">What it cost</div>
          <div className="sp-ctx-body">
            <Num>{totals.tokens.toLocaleString()}</Num> tokens · <Num>{fmtUsd(totals.cost)}</Num>
          </div>

          {since(startedAt) ? (
            <>
              <div className="sp-ctx-head">When it ran</div>
              <div className="sp-ctx-body">{since(startedAt)}</div>
            </>
          ) : null}

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
        title={
          mission ? (
            stripAutoPrefix(mission.title)
          ) : (
            <>
              Trace <Num>{id.slice(0, 8)}</Num>
            </>
          )
        }
        sub={
          <>
            <Num>{hopRows.length}</Num> {hopRows.length === 1 ? "hop" : "hops"} ·{" "}
            <Num>{fmtMs(totalMs)}</Num> wall
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

        <div className="sp-subtitle" style={noteStyle}>
          Every model call and tool call on this trace, in the order they ran. Previews are cut
          short; pick a hop for its full input, prompt and output.
          {mission ? " The reasoning between calls lives on the run." : null}
        </div>
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

      {briefBlock ? (
        <Block
          title="The brief it was given"
          more={showBrief ? "Hide it" : "Read it"}
          onMore={() => setShowBrief((v) => !v)}
        >
          {showBrief ? (
            <pre style={paneStyle}>{briefBlock}</pre>
          ) : (
            <div className="sp-subtitle" style={{ marginTop: 0 }}>
              The workspace brief was injected into the system prompt for this run.
            </div>
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
