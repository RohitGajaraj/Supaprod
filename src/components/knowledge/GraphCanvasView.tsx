// O1 / DBR-1, reframed by W3 (Loom): the Graph tab's data container. Fetches
// the typed knowledge graph around a focus artifact and hands it to the
// physics renderer (GraphForceCanvas, the flagship view), with the legend,
// the honest "as of" time scrubber plus replay, the drift and confidence
// notices, and the node story panel (opened by double-click). Bounded and
// fail-safe by the server fn; this layer only presents what is real.
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getKnowledgeGraph } from "@/lib/knowledge-graph-view.functions";
import {
  filterByTime,
  computeStaleness,
  computeContradictionDrift,
  summarizeEdgeConfidence,
  type GraphNodeKind,
} from "@/lib/knowledge-graph-view";
import { MonoLabel } from "@/components/obsidian/primitives";
import { GraphForceCanvas } from "./GraphForceCanvas";
import { GraphUniverseCanvas } from "./GraphUniverseCanvas";
import { GraphNodeStory } from "./GraphNodeStory";
import { GraphCompoundingStrip } from "./GraphCompoundingStrip";
import { kindCssColor, kindLabel } from "./graph-visual";

const REPLAY_STEP_MS = 650;

function NoticeLine({ color, children }: { color?: string; children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 8px",
        fontFamily: "var(--font-ui)",
        fontSize: 12.5,
        lineHeight: 1.5,
        color: color ?? "var(--text-subtle)",
      }}
    >
      {children}
    </p>
  );
}

/** The Universe (3D) / Flat (2D) view switch. Universe is the hero default. */
function GraphViewToggle({
  view,
  onChange,
}: {
  view: "3D" | "2D";
  onChange: (v: "3D" | "2D") => void;
}) {
  const opts: { id: "3D" | "2D"; label: string }[] = [
    { id: "3D", label: "Universe" },
    { id: "2D", label: "Flat" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Graph view"
      className="inline-flex"
      // Tabs keyboard contract: Left/Right move between the two views.
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const next = view === "3D" ? "2D" : "3D";
        onChange(next);
        e.currentTarget.querySelector<HTMLButtonElement>(`[data-tab-id="${next}"]`)?.focus();
      }}
      style={{
        gap: 2,
        padding: 2,
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-control)",
        background: "var(--surface-raised)",
      }}
    >
      {opts.map((o) => {
        const active = view === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            data-tab-id={o.id}
            className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: active ? "var(--text-primary)" : "var(--text-subtle)",
              background: active ? "var(--hover)" : "transparent",
              border: "none",
              borderRadius: "calc(var(--radius-control) - 2px)",
              padding: "3px 10px",
              cursor: "pointer",
            }}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Loading skeleton that matches the loaded layout (strip, legend, canvas). */
function GraphSkeleton() {
  const bar = (w: number | string, h: number) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        background:
          "linear-gradient(90deg, var(--raised), var(--hover), var(--raised)) 0 0 / 280% 100%",
        animation: "cadShimmer 1.6s linear infinite",
      }}
    />
  );
  return (
    <div role="status">
      <span className="sr-only">Loading the graph…</span>
      <div
        aria-hidden="true"
        style={{
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          padding: "14px 18px",
          marginBottom: 12,
          display: "flex",
          gap: 22,
        }}
      >
        {bar(90, 34)}
        {bar(90, 34)}
        {bar(90, 34)}
        <div style={{ flex: 1 }} />
        {bar(140, 34)}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {bar(64, 14)}
        {bar(64, 14)}
        {bar(64, 14)}
      </div>
      <div style={{ height: "clamp(420px, 58vh, 640px)" }}>{bar("100%", 460)}</div>
    </div>
  );
}

/** The empty state whispers the moat: a faint static constellation motif. */
function ConstellationMotif() {
  return (
    <svg width="200" height="88" viewBox="0 0 200 88" aria-hidden="true" style={{ opacity: 0.5 }}>
      <defs>
        <linearGradient id="graph-empty-thread" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--text-subtle)" />
          <stop offset="55%" stopColor="var(--text-muted)" />
          <stop offset="100%" stopColor="var(--text-faint)" />
        </linearGradient>
      </defs>
      <g stroke="url(#graph-empty-thread)" strokeWidth="1" opacity="0.4">
        <line x1="26" y1="58" x2="74" y2="30" />
        <line x1="74" y1="30" x2="128" y2="48" />
        <line x1="128" y1="48" x2="172" y2="24" />
        <line x1="74" y1="30" x2="110" y2="72" />
      </g>
      <g fill="var(--text-subtle)">
        <circle cx="26" cy="58" r="4" />
        <circle cx="74" cy="30" r="6" opacity="0.9" />
        <circle cx="128" cy="48" r="4.5" />
        <circle cx="172" cy="24" r="3.5" />
        <circle cx="110" cy="72" r="3" />
      </g>
    </svg>
  );
}

export function GraphCanvasView({
  focusKind,
  focusId,
  reducedMotion,
}: {
  focusKind?: string;
  focusId?: string;
  reducedMotion: boolean;
}) {
  const navigate = useNavigate();
  const fGraph = useServerFn(getKnowledgeGraph);
  const graphQ = useQuery({
    queryKey: ["knowledge-graph", focusKind ?? null, focusId ?? null],
    queryFn: () => fGraph({ data: { focusKind: focusKind as GraphNodeKind | undefined, focusId } }),
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [storyKey, setStoryKey] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [view, setView] = useState<"3D" | "2D">("3D");
  const replayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullGraph = graphQ.data ?? null;

  const timeline = useMemo(() => {
    if (!fullGraph) return [] as string[];
    const set = new Set<string>();
    for (const e of fullGraph.edges) if (e.validFrom) set.add(e.validFrom);
    return [...set].sort();
  }, [fullGraph]);

  const graph = useMemo(
    () => (fullGraph ? filterByTime(fullGraph, asOf) : null),
    [fullGraph, asOf],
  );

  const storyNode = useMemo(
    () => graph?.nodes.find((n) => n.key === storyKey) ?? null,
    [graph, storyKey],
  );

  const presentKinds = useMemo(() => {
    const set = new Set<string>();
    for (const n of graph?.nodes ?? []) set.add(n.kind);
    return [...set];
  }, [graph]);

  // O3 drift: facts with no fresh evidence lately (dashed ring on the canvas).
  const staleness = useMemo(
    () => (graph ? computeStaleness(graph, { nowMs: Date.now() }) : null),
    [graph],
  );

  // O3 contradiction drift: beliefs a recorded outcome revised, still in effect.
  const contradictionDrift = useMemo(
    () => (graph ? computeContradictionDrift(graph) : null),
    [graph],
  );

  const revisedCount = useMemo(
    () => (graph ? graph.edges.filter((e) => e.superseding && !e.retired).length : 0),
    [graph],
  );
  const retiredCount = useMemo(
    () => (graph ? graph.edges.filter((e) => e.retired).length : 0),
    [graph],
  );
  const confidence = useMemo(
    () => (graph ? summarizeEdgeConfidence(graph.edges) : { scored: 0, strong: 0, tentative: 0 }),
    [graph],
  );

  // Replay: step the "as of" cursor through real edge timestamps so memory
  // visibly grows. Manual scrubbing stays available under reduced motion;
  // autoplay does not run there.
  useEffect(() => {
    if (!replaying) return;
    if (timeline.length < 2) {
      setReplaying(false);
      return;
    }
    let idx = 0;
    setAsOf(timeline[0]);
    replayTimer.current = setInterval(() => {
      idx++;
      if (idx >= timeline.length - 1) {
        setAsOf(null);
        setReplaying(false);
      } else {
        setAsOf(timeline[idx]);
      }
    }, REPLAY_STEP_MS);
    return () => {
      if (replayTimer.current) clearInterval(replayTimer.current);
      replayTimer.current = null;
    };
  }, [replaying, timeline]);

  // Esc releases focus, then closes the story panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedKey) setSelectedKey(null);
      else if (storyKey) setStoryKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey, storyKey]);

  const recenter = (kind: string, id: string) => {
    setSelectedKey(null);
    setStoryKey(null);
    setAsOf(null);
    navigate({ to: "/brain", search: { tab: "graph", focusKind: kind, focusId: id } });
  };

  if (graphQ.isLoading) return <GraphSkeleton />;

  if (graphQ.isError) {
    // An error never wears the empty state's clothes: name the cause, offer retry.
    return (
      <div
        className="material-medium"
        style={{
          background: "var(--card)",
          padding: "16px 18px",
        }}
      >
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>Graph · failed to load</MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
          {(graphQ.error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          type="button"
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-subtle)",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
          onClick={() => void graphQ.refetch()}
        >
          Retry · rebuilds the graph
        </button>
      </div>
    );
  }

  if (
    !graph ||
    graph.nodes.length === 0 ||
    (graph.nodes.length === 1 && graph.edges.length === 0)
  ) {
    return (
      <div
        className="material-medium"
        style={{
          background: "var(--card)",
          padding: "36px 24px",
          textAlign: "center",
        }}
      >
        <ConstellationMotif />
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "var(--text-primary)",
            margin: "10px 0 6px",
          }}
        >
          Nothing to map yet
        </div>
        <p
          style={{
            fontSize: 12.5,
            color: "var(--text-muted)",
            maxWidth: 440,
            margin: "0 auto 14px",
            lineHeight: 1.55,
          }}
        >
          The map draws itself as you work: promote a signal, approve a spec, or record a decision
          and the connections appear here on their own.
        </p>
        <button
          type="button"
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-subtle)",
            background: "transparent",
            border: "none",
          }}
          onClick={() => navigate({ to: "/discover" })}
        >
          Capture a signal on Discover
        </button>
      </div>
    );
  }

  const sliderIdx = asOf ? Math.max(0, timeline.indexOf(asOf)) : timeline.length - 1;

  return (
    <div>
      <GraphCompoundingStrip nodes={graph.nodes} beliefsRevised={revisedCount} />

      <div className="flex flex-wrap items-center" style={{ gap: 14, marginBottom: 12 }}>
        <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
          {presentKinds.map((kind) => (
            <span key={kind} className="flex items-center" style={{ gap: 5 }}>
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: 2.5, background: kindCssColor(kind) }}
              />
              <MonoLabel style={{ fontSize: "var(--text-mono-floor)" }}>
                {kindLabel(kind)}
              </MonoLabel>
            </span>
          ))}
        </div>
        <GraphViewToggle view={view} onChange={setView} />
        <span style={{ flex: 1 }} />
        {timeline.length > 1 && (
          <span className="flex items-center" style={{ gap: 8 }}>
            {!reducedMotion ? (
              <button
                type="button"
                className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-floor)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: replaying ? "var(--text-primary)" : "var(--text-subtle)",
                  background: "transparent",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-control)",
                  padding: "3px 9px",
                }}
                onClick={() => setReplaying((r) => !r)}
              >
                {replaying ? "Stop" : "Replay growth"}
              </button>
            ) : null}
            <MonoLabel style={{ fontSize: "var(--text-mono-floor)" }}>as of</MonoLabel>
            <input
              type="range"
              min={0}
              max={timeline.length - 1}
              value={sliderIdx}
              onChange={(e) => {
                setReplaying(false);
                const idx = Number(e.target.value);
                setAsOf(idx >= timeline.length - 1 ? null : timeline[idx]);
              }}
              style={{ width: 130 }}
              aria-label="Show the graph as of a past date"
            />
            <MonoLabel
              className="tabular-nums"
              style={{ fontSize: "var(--text-mono-floor)", minWidth: 64 }}
            >
              {asOf ? new Date(asOf).toLocaleDateString() : "now · all"}
            </MonoLabel>
          </span>
        )}
      </div>

      {graph.truncated && (
        <NoticeLine>
          showing the {graph.stats.nodeCount} closest nodes · center on a node to explore further
        </NoticeLine>
      )}
      {staleness && staleness.staleCount > 0 && (
        <NoticeLine color="var(--marigold)">
          {staleness.staleCount} of {staleness.datedCount} facts may be stale · no fresh evidence in{" "}
          {staleness.thresholdDays}d (dashed ring)
        </NoticeLine>
      )}
      {contradictionDrift && contradictionDrift.driftedCount > 0 && (
        <NoticeLine color="var(--madder)">
          {contradictionDrift.driftedCount}{" "}
          {contradictionDrift.driftedCount === 1
            ? "belief in this view was"
            : "beliefs in this view were"}{" "}
          revised by a recorded outcome · the revision still stands
        </NoticeLine>
      )}
      {revisedCount > 0 && (
        <NoticeLine color="var(--madder)">
          {revisedCount} {revisedCount === 1 ? "thread here marks" : "threads here mark"} a belief a
          later outcome revised (the drifting dashes)
        </NoticeLine>
      )}
      {retiredCount > 0 && (
        <NoticeLine>
          {retiredCount} {retiredCount === 1 ? "revision was" : "revisions were"} themselves later
          reversed · kept as faded history, never deleted
        </NoticeLine>
      )}
      {confidence.scored > 0 && (
        <NoticeLine color="var(--text-muted)">
          {confidence.strong} of {confidence.scored}{" "}
          {confidence.scored === 1 ? "current revision is" : "current revisions are"}{" "}
          high-confidence
          {confidence.tentative > 0 ? ` · ${confidence.tentative} tentative` : ""}
        </NoticeLine>
      )}

      <div className="flex flex-wrap items-start" style={{ gap: 14 }}>
        {/* Loom §2b: the flagship graph card carries the fading hairline (the
            light catching its top edge). On the wrapper, not the canvas card
            itself: the card's overflow-hidden would clip the 1px line. */}
        <div className="loom-hairline-fade" style={{ flex: 1, minWidth: 320 }}>
          {view === "3D" ? (
            <GraphUniverseCanvas
              graph={graph}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onOpenStory={(key) => setStoryKey(key)}
              staleKeys={staleness?.staleKeys}
              hotKeys={contradictionDrift?.driftedKeys}
              reducedMotion={reducedMotion}
            />
          ) : (
            <GraphForceCanvas
              graph={graph}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onOpenStory={(key) => setStoryKey(key)}
              staleKeys={staleness?.staleKeys}
              hotKeys={contradictionDrift?.driftedKeys}
              reducedMotion={reducedMotion}
            />
          )}
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              letterSpacing: "0.06em",
              color: "var(--text-subtle)",
              margin: "8px 2px 0",
            }}
          >
            {view === "3D"
              ? "click a node to open it · drag to orbit · scroll to zoom · Esc closes"
              : "click a node to open it · drag to explore · scroll to zoom · Esc closes"}
          </p>
        </div>
        {storyNode ? (
          <div style={{ width: 300, flexShrink: 0 }}>
            <GraphNodeStory node={storyNode} onFocus={recenter} onClose={() => setStoryKey(null)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
