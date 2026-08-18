/**
 * The Graph tab's data container. Fetches the typed knowledge graph around a
 * focus artifact and hands it to the physics renderer, with the legend, the
 * honest "as of" scrubber and its replay, the drift and confidence notices, and
 * the node story (opened by double-click). Bounded and fail-safe by the server
 * function; this layer only presents what is real.
 *
 * Ported to the shell primitives, 2026-07-29. What went, and why:
 *   KILLED the hand-built Universe / Flat pill group, with its own border,
 *     radius, `--surface-raised`, `--hover`, `loom-press` and four
 *     focus-visible utility classes. `.sp-tabs` / `.sp-tab` is the ported strip.
 *   KILLED the UPPERCASE MONO labels on both toggles and on the legend. Mono is
 *     for data, never for a door's name or a colour's name.
 *   KILLED the shimmer skeleton. Loading is the third fact and says so in
 *     words; a shimmer performs rather than confirms.
 *   KILLED the "Graph - failed to load" card with its hand-built retry, and the
 *     "Nothing to map yet" card with its own. Failed and Empty are the
 *     primitives, and the whole point of having both is that they say different
 *     things.
 *   KILLED the ConstellationMotif. A decorative SVG in an empty state is
 *     decoration where the standard asks for a sentence naming who acts next
 *     and a door to act through, and Empty carries both.
 *   KILLED the SIX stacked notice paragraphs floating between the toolbar and
 *     the canvas, each with its own hue. They are one region with one heading
 *     now, and only the two that carry an OUTCOME wear a colour: state is never
 *     a hue, and four coloured paragraphs in a column spend the whole restraint
 *     budget before the graph is even drawn.
 *   KILLED the "showing the N closest nodes" wording, which read as a claim
 *     about the workspace. It says the view is bounded, which is what is true.
 *
 * The knowledge pass, 2026-08-02. What arrived, and why:
 *   ADDED the THREAD legend. The dots said what a node is; nothing said what a
 *     line means, so the canvas carried a vocabulary with no way to learn it.
 *     Grouped into the four things a link can claim rather than listed per
 *     relation, and counted by MEANING, so `derived_from` and `derived-from` are
 *     one entry rather than two halves of the same fact.
 *   ADDED the WHY into the story panel, by handing it the edges this component
 *     is already holding. `rationale` and `created_by_agent` were on every row
 *     and had never reached a pixel.
 *   MOVED the two new reading regions OUT, to GraphRecordRegions, mounted by
 *     GraphPanel beside both views. Reduced motion makes the outline the
 *     default, so anything living in here is invisible to the reader most likely
 *     to want a text answer.
 *
 * UNCHANGED: getKnowledgeGraph, the time filter and replay stepping through
 * real edge timestamps, the Escape contract, the recentre navigation, and every
 * count, all of which come from the fetched graph rather than being asserted.
 * The query key gained the active workspace; see the note at the read for why
 * it had to, and what a drifted key was costing.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Num,
  Action,
  Region,
  Reading,
  ReadFailed,
  NothingYet,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getKnowledgeGraph } from "@/lib/knowledge-graph-view.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  filterByTime,
  computeStaleness,
  computeContradictionDrift,
  summarizeEdgeConfidence,
  summarizeRelations,
  type GraphNodeKind,
} from "@/lib/knowledge-graph-view";
import { GraphForceCanvas } from "./GraphForceCanvas";
import { GraphUniverseCanvas } from "./GraphUniverseCanvas";
import { GraphNodeStory } from "./GraphNodeStory";
import { GraphCompoundingStrip } from "./GraphCompoundingStrip";
import {
  RELATION_GROUP_DASH,
  RELATION_GROUP_LABEL,
  kindCssColor,
  kindLabel,
  relationGroup,
  type RelationGroup,
} from "./graph-visual";

const REPLAY_STEP_MS = 650;

/**
 * A relation's stroke, drawn at the size of its own label.
 *
 * The node legend has always been a dot and a name. Threads had no legend at
 * all, so the canvas carried a vocabulary nobody had been taught: a reader could
 * see that some lines were dotted and had no way to learn that dotted means
 * evidence. Same anatomy as the dot, one line of SVG instead.
 */
function StrokeSwatch({ group }: { group: RelationGroup }) {
  const dash = RELATION_GROUP_DASH[group];
  return (
    <svg width="18" height="8" aria-hidden="true" style={{ flexShrink: 0, overflow: "visible" }}>
      <line
        x1="0"
        y1="4"
        x2="18"
        y2="4"
        stroke="currentColor"
        strokeWidth={group === "revision" ? 1.8 : 1.1}
        strokeDasharray={dash.length ? dash.join(" ") : undefined}
      />
    </svg>
  );
}

/**
 * THE FLAT CANVAS LEADS NOW, AND THE UNIVERSE IS THE ONE BEHIND THE TOGGLE.
 *
 * The Universe was the default and it is strictly the weaker renderer for the
 * job this tab exists to do. Counted in the two files rather than argued:
 *
 *   GraphForceCanvas   rationale ×7, relationPhrase ×2, createdByAgent ×1
 *   GraphUniverseCanvas  rationale 0, relationPhrase 0, createdByAgent 0
 *
 * The entire WHY layer is missing from the default view. `rationale` and
 * `created_by_agent` are on every edge row, they are the only reason a drawn
 * link is evidence rather than decoration, and the flagship renderer never
 * touches them. The legend directly below this advertises four dash patterns to
 * tell the four kinds of link apart, and additive GL lines cannot carry a dash,
 * so the legend was teaching a vocabulary the default canvas could not speak.
 *
 * And the layout is force-directed in both, which means POSITION CARRIES NO
 * MEANING. A third axis of nothing costs three.js, costs the reader depth cues
 * they will read as significance, and buys a view that says less.
 *
 * SO IT IS DEMOTED, NOT DELETED. It is still one click away, it is genuinely
 * the better answer for a large graph seen from outside, and the founder
 * compares versions side by side rather than in a diff. Nothing about it
 * changed except which one you get without asking. Deleting it, and three.js
 * with it, is a bundle argument this pass did not have the evidence to close.
 */
const VIEWS: { id: "3D" | "2D"; label: string }[] = [
  { id: "2D", label: "Flat" },
  { id: "3D", label: "Universe" },
];

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
  /* THE KEY DRIFTED, AND A DRIFTED KEY IS NOT A COSMETIC PROBLEM HERE.
   *
   * The workspace-scoping pass added `activeWorkspaceId` to this key in the
   * route file and did not add it here, so the two stopped matching: Brain drew
   * the preview off ["knowledge-graph", kind, id, ws] and this view read
   * ["knowledge-graph", kind, id]. Both files' own comments say, in as many
   * words, that they are two consumers of ONE request. They were two requests,
   * and the handoff from the preview to this tab -- documented as a cache hit --
   * was a cold read every time.
   *
   * Worse than the cost: two caches over the same table can hold two different
   * answers, and this surface exists to be believed. Character-identical to the
   * route's key again, and the workspace goes to the server with it so that
   * scoping the read there needs no change on this side. */
  const { activeWorkspaceId } = useWorkspace();
  const graphQ = useQuery({
    queryKey: ["knowledge-graph", focusKind ?? null, focusId ?? null, activeWorkspaceId],
    queryFn: () =>
      fGraph({
        data: {
          focusKind: focusKind as GraphNodeKind | undefined,
          focusId,
          workspaceId: activeWorkspaceId ?? undefined,
        },
      }),
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [storyKey, setStoryKey] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);
  // See VIEWS above for the count that decided this. The flat canvas is the one
  // that can draw why a link exists; the Universe cannot, and it was default.
  const [view, setView] = useState<"3D" | "2D">("2D");
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

  /** Node key to title, shared by the story panel and both new regions. */
  const titleOf = useMemo(
    () => new Map((graph?.nodes ?? []).map((n) => [n.key, n.title])),
    [graph],
  );

  /** The links touching the open node, so the story can say WHY, not just what. */
  const storyEdges = useMemo(
    () =>
      storyKey
        ? (graph?.edges ?? []).filter((e) => e.source === storyKey || e.target === storyKey)
        : [],
    [graph, storyKey],
  );

  /** The thread vocabulary, counted by MEANING rather than by stored spelling. */
  const relationTallies = useMemo(() => (graph ? summarizeRelations(graph.edges) : []), [graph]);

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

  // Esc releases focus, then closes the story.
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

  if (graphQ.isLoading) return <Reading>Drawing what connects to what.</Reading>;

  if (graphQ.isError) {
    // A failed read never wears the empty state's clothes: "nothing is
    // connected yet" and "we could not find out" are different facts.
    return (
      <ReadFailed onRetry={() => void graphQ.refetch()}>
        The graph did not load, so this is not a claim that nothing is connected.{" "}
        {(graphQ.error as Error)?.message ?? ""}
      </ReadFailed>
    );
  }

  if (
    !graph ||
    graph.nodes.length === 0 ||
    (graph.nodes.length === 1 && graph.edges.length === 0)
  ) {
    return (
      <NothingYet
        action={<Action onClick={() => navigate({ to: "/discover" })}>Capture a signal</Action>}
      >
        Nothing is connected yet. The map draws itself as you work: promote a signal, approve a
        spec, or record a decision, and the connections appear here on their own.
      </NothingYet>
    );
  }

  const sliderIdx = asOf ? Math.max(0, timeline.indexOf(asOf)) : timeline.length - 1;

  // The notices. Each is a real fact read off the fetched graph, and only the
  // two that carry an OUTCOME wear a colour.
  const notices: { key: string; tone?: string; body: React.ReactNode }[] = [];
  if (graph.truncated) {
    notices.push({
      key: "truncated",
      body: (
        <>
          This view is bounded to the <Num>{graph.stats.nodeCount}</Num> nodes nearest the centre.
          Centre on a node to walk further out.
        </>
      ),
    });
  }
  if (staleness && staleness.staleCount > 0) {
    notices.push({
      key: "stale",
      tone: "sp-warn",
      body: (
        <>
          <Num>{staleness.staleCount}</Num> of <Num>{staleness.datedCount}</Num> facts here may be
          stale. Nothing fresh has backed them in <Num>{staleness.thresholdDays}</Num> days, and
          they wear a dashed ring.
        </>
      ),
    });
  }
  if (contradictionDrift && contradictionDrift.driftedCount > 0) {
    notices.push({
      key: "drift",
      tone: "sp-fail",
      body: (
        <>
          A recorded outcome revised <Num>{contradictionDrift.driftedCount}</Num>{" "}
          {contradictionDrift.driftedCount === 1 ? "belief" : "beliefs"} here, and the revision
          still stands.
        </>
      ),
    });
  }
  if (revisedCount > 0) {
    notices.push({
      key: "revised",
      body: (
        <>
          <Num>{revisedCount}</Num> {revisedCount === 1 ? "thread marks" : "threads mark"} a belief
          a later outcome replaced.
        </>
      ),
    });
  }
  if (retiredCount > 0) {
    notices.push({
      key: "retired",
      body: (
        <>
          <Num>{retiredCount}</Num> {retiredCount === 1 ? "revision was" : "revisions were"}{" "}
          themselves later reversed. They stay as faded history rather than being deleted.
        </>
      ),
    });
  }
  if (confidence.scored > 0) {
    notices.push({
      key: "confidence",
      body: (
        <>
          <Num>{confidence.strong}</Num> of <Num>{confidence.scored}</Num> current revisions are
          high confidence
          {confidence.tentative > 0 ? (
            <>
              , and <Num>{confidence.tentative}</Num> {confidence.tentative === 1 ? "is" : "are"}{" "}
              tentative
            </>
          ) : null}
          .
        </>
      ),
    });
  }

  return (
    <div>
      <GraphCompoundingStrip nodes={graph.nodes} beliefsRevised={revisedCount} />

      <div
        className="flex flex-wrap items-center"
        style={{ gap: "var(--sp-space-4)", marginBottom: "var(--sp-space-3)" }}
      >
        <div className="sp-tabs" role="tablist" aria-label="How to draw the graph">
          {VIEWS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="tab"
              className="sp-tab"
              aria-selected={view === o.id}
              onClick={() => setView(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* The legend. A dot and its name, at the size of its label. */}
        <div className="flex flex-wrap items-center" style={{ gap: "var(--sp-space-3)" }}>
          {presentKinds.map((kind) => (
            <span key={kind} className="flex items-center" style={{ gap: 5 }}>
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: 2.5, background: kindCssColor(kind) }}
              />
              <span style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
                {kindLabel(kind)}
              </span>
            </span>
          ))}
        </div>

        <span style={{ flex: 1 }} />

        {timeline.length > 1 && (
          <span className="flex items-center" style={{ gap: "var(--sp-space-2)" }}>
            {!reducedMotion ? (
              <Action
                variant={replaying ? "default" : "quiet"}
                onClick={() => setReplaying((r) => !r)}
              >
                {replaying ? "Stop" : "Replay how it grew"}
              </Action>
            ) : null}
            <label
              htmlFor="graph-as-of"
              style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}
            >
              As of
            </label>
            <input
              id="graph-as-of"
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
            <span style={{ minWidth: 72 }}>
              <Num>{asOf ? new Date(asOf).toLocaleDateString() : "today"}</Num>
            </span>
          </span>
        )}
      </div>

      {/* THE THREAD LEGEND. The dots above say what a NODE is; this says what a
          LINE means, and until now the canvas carried that vocabulary with no way
          to learn it. Grouped by the four things a link can claim rather than
          listed per relation, because thirteen dash patterns is a legend nobody
          reads (graph-visual.ts records the reasoning). Counted by MEANING, so
          `derived_from` and `derived-from` are one entry rather than two halves of
          the same fact. */}
      {relationTallies.length > 0 ? (
        <div
          className="flex flex-wrap items-center"
          style={{
            gap: "var(--sp-space-3)",
            marginBottom: "var(--sp-space-3)",
            color: "var(--sp-mute)",
            fontSize: "var(--sp-text-meta)",
          }}
        >
          {(["flow", "evidence", "outcome", "revision"] as RelationGroup[]).map((group) => {
            const inGroup = relationTallies.filter((r) => relationGroup(r.family) === group);
            if (inGroup.length === 0) return null;
            const total = inGroup.reduce((sum, r) => sum + r.count, 0);
            return (
              <span
                key={group}
                className="flex items-center"
                style={{ gap: 5 }}
                title={`${RELATION_GROUP_LABEL[group]}: ${inGroup
                  .map((r) => `${r.label} ${r.count}`)
                  .join(", ")}`}
              >
                <StrokeSwatch group={group} />
                <span>
                  {RELATION_GROUP_LABEL[group]} <Num>{total}</Num>
                </span>
              </span>
            );
          })}
        </div>
      ) : null}

      {/* One region, one heading, rather than six paragraphs floating loose. */}
      {notices.length > 0 ? (
        <Region title="What to watch in this view">
          {notices.map((n) => (
            <p key={n.key} className="sp-loading">
              <span className={n.tone}>{n.body}</span>
            </p>
          ))}
        </Region>
      ) : null}

      <div className="flex flex-wrap items-start" style={{ gap: "var(--sp-space-4)" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
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
          <p className="sp-loading">
            {view === "3D"
              ? "Click a node to open it. Drag to orbit, scroll to zoom, Escape closes."
              : "Click a node to open it. Drag to explore, scroll to zoom, Escape closes."}
          </p>
        </div>

        {/* The story opens IN PLACE beside the canvas, never over it: a
            question about what is on screen must not take the screen away. */}
        {storyNode ? (
          <div style={{ width: 340, flexShrink: 0, minWidth: 280 }}>
            <GraphNodeStory
              node={storyNode}
              edges={storyEdges}
              titleOf={titleOf}
              onFocus={recenter}
              onClose={() => setStoryKey(null)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
