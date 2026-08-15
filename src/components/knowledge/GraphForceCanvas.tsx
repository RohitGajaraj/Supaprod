// W3 (Loom flagship) - the living graph. A physics-driven Canvas2D renderer
// for the workspace's memory, per DESIGN-LOOM section 7: d3-force simulation
// (link / charge / collide / center) that settles calm in under 3s and
// reheats gently on interaction; DPR-aware canvas; node kinds in v4 role
// colors with layered radial glows; edges as quiet 25%-alpha threads;
// supersession edges carrying a slow directional shimmer (memory revising
// itself); click focus that lights the neighborhood and dims the rest to
// 20%; node drag with momentum; wheel zoom to the cursor; a glass hover
// card; double-click opens the story panel. Reduced motion (OS setting or
// the in-product toggle) freezes the physics to a settled still and kills
// the shimmer. Truth law: only the real nodes and edges getKnowledgeGraph
// returned are ever drawn.
//
// The knowledge pass, 2026-08-02:
//   Threads are drawn by RELATION MEANING now, not by two booleans. A reader
//   could previously tell a revision from everything else and nothing else
//   apart, so a promotion, a cited source and a measured result were one
//   identical hairline. Four dash groups, no new colour (graph-visual.ts
//   records why it is a stroke and not a hue).
//   Revision threads are weighted by the supersession engine's own confidence,
//   because a strong claim and a tentative one must not look identical. An
//   UNSCORED edge draws at the middle weight: "we did not score this" is not
//   "we do not believe this".
//   The hover card answers WHY, with the rationale and the agent off the edge,
//   and names the recorded verdict where the node is an outcome.
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { getLineage } from "@/lib/lineage.functions";
import {
  relationPhrase,
  type GraphNodeKind,
  type KnowledgeGraph,
} from "@/lib/knowledge-graph-view";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { Action, Num } from "@/components/meridian/surface-parts";
import {
  OUTCOME_TONE,
  RELATION_GROUP_DASH,
  edgeWeight,
  kindCssColor,
  kindLabel,
  nodeRadius,
  outcomeLabel,
  relationGroup,
  resolveKindColors,
  truncateTitle,
  type RelationGroup,
} from "./graph-visual";

type SimNode = SimulationNodeDatum & {
  key: string;
  kind: string;
  id: string;
  title: string;
  influence: number;
  r: number;
  label: string;
  x: number;
  y: number;
  /** Present on a recorded outcome whose verdict the server could read. */
  outcome: string | null;
};

/**
 * The strongest thing the record says about WHY a node is on the canvas: its
 * newest incident link, phrased from that node's point of view, with the
 * rationale the writer left and the agent that left it.
 *
 * This is the defect the founder named. `rationale` and `created_by_agent` are
 * columns on every lineage row and neither reached a pixel, so the canvas showed
 * topology with the reasoning stripped out, which is a picture of a brain rather
 * than a brain.
 */
type EdgeWhy = {
  phrase: string;
  peerTitle: string;
  rationale: string | null;
  agent: string | null;
  at: string | null;
  revises: boolean;
};

type SimEdge = SimulationLinkDatum<SimNode> & {
  id: string;
  source: SimNode;
  target: SimNode;
  /** The relation's MEANING, spelling-independent. Drives the dash pattern. */
  family: string;
  group: RelationGroup;
  /** True for any relation that says a belief stopped being current. */
  revises: boolean;
  retired: boolean;
  /** Stroke multiplier from the engine's own confidence; 1 when unscored. */
  weight: number;
};

type Camera = { x: number; y: number; k: number };

const SPRITE_PAD = 2.6; // glow radius multiplier baked into each sprite
const SPRITE_SCALE = 3; // sprite oversampling so glows stay smooth when zoomed
const LABEL_ZOOM_THRESHOLD = 1.05;
const PULSE_MS = 1400;

/** The three non-revision stroke groups, drawn before the revision threads. */
const PLAIN_GROUPS: RelationGroup[] = ["flow", "evidence", "outcome"];

/** Layered radial glow + nothing else; the crisp core is drawn as a vector. */
function makeGlowSprite(color: string, r: number): HTMLCanvasElement {
  const size = Math.ceil(r * SPRITE_PAD * 2 * SPRITE_SCALE);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const cx = size / 2;
  const outer = r * SPRITE_PAD * SPRITE_SCALE;
  const inner = r * SPRITE_SCALE;
  const g1 = ctx.createRadialGradient(cx, cx, inner * 0.4, cx, cx, outer);
  g1.addColorStop(0, color);
  g1.addColorStop(0.35, color);
  g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = g1;
  ctx.beginPath();
  ctx.arc(cx, cx, outer, 0, Math.PI * 2);
  ctx.fill();
  const g2 = ctx.createRadialGradient(cx, cx, inner * 0.3, cx, cx, inner * 1.6);
  g2.addColorStop(0, color);
  g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(cx, cx, inner * 1.6, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

export function GraphForceCanvas({
  graph,
  selectedKey,
  onSelect,
  onOpenStory,
  staleKeys,
  hotKeys,
  reducedMotion,
}: {
  graph: KnowledgeGraph;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onOpenStory: (key: string) => void;
  staleKeys?: Set<string>;
  hotKeys?: Set<string>;
  reducedMotion: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const camRef = useRef<Camera>({ x: 0, y: 0, k: 1 });
  const sizeRef = useRef({ w: 800, h: 520 });
  const simRef = useRef<Simulation<SimNode, SimEdge> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const posMemory = useRef(new Map<string, { x: number; y: number }>());
  const spriteCache = useRef(new Map<string, HTMLCanvasElement>());
  const colorsRef = useRef<Map<string, string>>(new Map());
  const chromeColors = useRef({
    // The selection highlight is NEUTRAL, 2026-08-15. It read ember on the
    // argument that a selected element deserves an accent; the argument is
    // wrong, and it is the same one that put ember on every focus ring, caret
    // and active row in the app. Selecting a node is the reader pointing at
    // something, not the product asking them to decide anything, and a bright
    // neutral against kind-coloured nodes separates better than a hue that has
    // to compete with them.
    selected: "#f2f0ed",
    madder: "#e06557",
    marigold: "#e8b44c",
    label: "#9c978f",
    labelBright: "#f2f0ed",
    pearl: "#edeae4",
    thread: "#c6c0b8",
  });
  const pulseStarts = useRef(new Map<string, number>());
  const userMovedCam = useRef(false);

  const rafId = useRef<number | null>(null);
  const rafPending = useRef(false);

  // Interaction state lives in refs (the draw loop reads them without renders).
  const dragging = useRef<{
    node: SimNode | null;
    panFrom: { sx: number; sy: number; camX: number; camY: number } | null;
    start: { sx: number; sy: number; t: number };
    moved: boolean;
    lastSample: { x: number; y: number; t: number } | null;
    velocity: { vx: number; vy: number };
  } | null>(null);

  const [hover, setHover] = useState<{ key: string; sx: number; sy: number } | null>(null);
  const hoverRef = useRef(hover);
  hoverRef.current = hover;
  const selectedRef = useRef(selectedKey);
  selectedRef.current = selectedKey;
  const staleRef = useRef(staleKeys);
  staleRef.current = staleKeys;
  const hotRef = useRef(hotKeys);
  hotRef.current = hotKeys;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  const neighborSets = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of graph.edges) {
      const s = m.get(e.source) ?? new Set<string>();
      s.add(e.target);
      m.set(e.source, s);
      const t = m.get(e.target) ?? new Set<string>();
      t.add(e.source);
      m.set(e.target, t);
    }
    return m;
  }, [graph.edges]);
  const neighborsRef = useRef(neighborSets);
  neighborsRef.current = neighborSets;

  /**
   * One WHY per node: the newest link incident to it, phrased from its side. A
   * revision beats a plain link at the same recency, because "this belief was
   * replaced" is the sentence a reader most needs and the one they will never go
   * looking for.
   */
  const whyByKey = useMemo(() => {
    const titleOf = new Map(graph.nodes.map((n) => [n.key, n.title]));
    const best = new Map<string, EdgeWhy>();
    const better = (a: EdgeWhy, b: EdgeWhy | undefined) =>
      !b || (a.revises && !b.revises) || (a.revises === b.revises && (a.at ?? "") > (b.at ?? ""));
    for (const e of graph.edges) {
      if (e.retired) continue;
      for (const side of ["source", "target"] as const) {
        const self = side === "source" ? e.source : e.target;
        const peer = side === "source" ? e.target : e.source;
        const why: EdgeWhy = {
          phrase: relationPhrase(e.family, e.inverted, side),
          peerTitle: titleOf.get(peer) ?? "",
          rationale: e.rationale,
          agent: e.createdByAgent,
          at: e.validFrom,
          revises: e.revises,
        };
        if (better(why, best.get(self))) best.set(self, why);
      }
    }
    return best;
  }, [graph.edges, graph.nodes]);

  const hasLiveSupersession = useMemo(
    () => graph.edges.some((e) => e.revises && !e.retired),
    [graph.edges],
  );
  const shimmerRef = useRef(hasLiveSupersession);
  shimmerRef.current = hasLiveSupersession;

  /** One draw. No allocations on the hot paths (sprites and colors cached). */
  const draw = (t: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = sizeRef.current;
    const cam = camRef.current;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const colors = colorsRef.current;
    const chrome = chromeColors.current;
    const selected = selectedRef.current;
    const lit = selected ? neighborsRef.current.get(selected) : undefined;
    const isLit = (key: string) => !selected || key === selected || (lit?.has(key) ?? false);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2 + cam.x, h / 2 + cam.y);
    ctx.scale(cam.k, cam.k);

    // Edges. Grouped passes so canvas state changes stay cheap, but grouped by
    // RELATION MEANING now rather than by two booleans: a reader could previously
    // tell a revision from everything else and nothing else apart, so a promotion
    // and a piece of cited evidence and a measured result were one identical
    // hairline. The dash pattern is the vocabulary (graph-visual.ts explains why
    // it is a stroke and not a hue).
    const hairWidth = 1.1 / cam.k;

    // 1. Ordinary threads, one pass per (group, lit) so each group keeps its own
    //    dash. Dimmed to 7% outside a focused neighborhood, exactly as before.
    for (const group of PLAIN_GROUPS) {
      const dash = RELATION_GROUP_DASH[group];
      for (const pass of [true, false]) {
        ctx.beginPath();
        let any = false;
        for (const e of edges) {
          if (e.revises || e.retired || e.group !== group) continue;
          const litEdge = isLit(e.source.key) && isLit(e.target.key);
          if (litEdge !== pass) continue;
          ctx.moveTo(e.source.x, e.source.y);
          ctx.lineTo(e.target.x, e.target.y);
          any = true;
        }
        if (!any) continue;
        ctx.lineWidth = hairWidth;
        // Dash lengths are in world units, so they must be divided by the camera
        // scale or a dotted thread turns solid the moment you zoom out.
        ctx.setLineDash(dash.map((d) => d / cam.k));
        ctx.lineDashOffset = 0;
        if (pass && selected) {
          ctx.strokeStyle = chrome.selected;
          ctx.globalAlpha = 0.42;
        } else {
          // Token-resolved thread color (was a hardcoded hex; both themes resolve).
          ctx.strokeStyle = chrome.thread;
          ctx.globalAlpha = pass ? 0.25 : 0.07;
        }
        ctx.stroke();
      }
    }

    // 2. Live revision threads: madder, long-dashed, drifting toward the newer
    //    belief (the thread in motion; static under reduced motion).
    //
    //    ONE PASS PER WEIGHT, because a strong claim and a tentative one must not
    //    look identical and lineWidth cannot vary inside a single path. The weight
    //    comes from the supersession engine's own confidence; an UNSCORED edge
    //    draws at the middle weight rather than the thin one, so "we did not score
    //    this" never renders as "we do not believe this".
    const revisionDash = RELATION_GROUP_DASH.revision;
    const byWeight = new Map<number, SimEdge[]>();
    for (const e of edges) {
      if (!e.revises || e.retired) continue;
      const w = Math.round(e.weight * 10) / 10;
      const bucket = byWeight.get(w) ?? [];
      bucket.push(e);
      byWeight.set(w, bucket);
    }
    if (byWeight.size > 0) {
      ctx.strokeStyle = chrome.madder;
      ctx.setLineDash(revisionDash.map((d) => d / cam.k));
      ctx.lineDashOffset = reducedRef.current ? 0 : -((t * 0.012) % 13);
      ctx.globalAlpha = selected ? 0.5 : 0.7;
      for (const [w, group] of byWeight) {
        ctx.lineWidth = (1.5 * w) / cam.k;
        ctx.beginPath();
        for (const e of group) {
          ctx.moveTo(e.source.x, e.source.y);
          ctx.lineTo(e.target.x, e.target.y);
        }
        ctx.stroke();
      }
    }

    // 3. Retired revisions stay as faded history (invalidate, never delete).
    ctx.lineWidth = hairWidth;
    ctx.setLineDash([2 / cam.k, 4 / cam.k]);
    ctx.lineDashOffset = 0;
    ctx.beginPath();
    let anyRetired = false;
    for (const e of edges) {
      if (!e.retired) continue;
      ctx.moveTo(e.source.x, e.source.y);
      ctx.lineTo(e.target.x, e.target.y);
      anyRetired = true;
    }
    if (anyRetired) {
      ctx.globalAlpha = 0.2;
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Nodes: cached glow sprite + crisp vector core.
    for (const n of nodes) {
      const litNode = isLit(n.key);
      ctx.globalAlpha = litNode ? 1 : 0.2;
      const color = colors.get(n.kind) ?? colors.get("__unknown") ?? "#a8a29a";
      const spriteKey = `${color}|${n.r}`;
      let sprite = spriteCache.current.get(spriteKey);
      if (!sprite) {
        sprite = makeGlowSprite(color, n.r);
        spriteCache.current.set(spriteKey, sprite);
      }
      const half = n.r * SPRITE_PAD;
      ctx.drawImage(sprite, n.x - half, n.y - half, half * 2, half * 2);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (n.key === graph.focusKey) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 3 / cam.k, 0, Math.PI * 2);
        ctx.strokeStyle = chrome.pearl;
        ctx.lineWidth = 1 / cam.k;
        ctx.globalAlpha = litNode ? 0.55 : 0.15;
        ctx.stroke();
      }
      if (n.key === selected) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4 / cam.k, 0, Math.PI * 2);
        ctx.strokeStyle = chrome.selected;
        ctx.lineWidth = 2 / cam.k;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
      if (staleRef.current?.has(n.key)) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4.5 / cam.k, 0, Math.PI * 2);
        ctx.strokeStyle = chrome.marigold;
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1 / cam.k;
        ctx.globalAlpha = litNode ? 0.8 : 0.2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (hotRef.current?.has(n.key)) {
        // One arrival pulse, then a settled marker dot.
        const started = pulseStarts.current.get(n.key);
        const progress = started === undefined ? 1 : Math.min(1, (t - started) / PULSE_MS);
        if (!reducedRef.current && progress < 1) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 2 + progress * 20, 0, Math.PI * 2);
          ctx.strokeStyle = chrome.madder;
          ctx.lineWidth = 1.4 / cam.k;
          ctx.globalAlpha = (1 - progress) * 0.55;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(n.x + n.r * 0.72, n.y - n.r * 0.72, 3 / Math.max(1, cam.k * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = chrome.madder;
        ctx.globalAlpha = litNode ? 1 : 0.3;
        ctx.fill();
      }
    }
    ctx.restore();

    // Labels in screen space (constant size). Virtualized: below the zoom
    // threshold only the focused neighborhood, hover and focus keep labels.
    ctx.globalAlpha = 1;
    ctx.font = '10.5px "Geist", ui-sans-serif, sans-serif';
    ctx.textAlign = "center";
    const showAll = cam.k >= LABEL_ZOOM_THRESHOLD;
    const hovered = hoverRef.current?.key ?? null;
    for (const n of nodes) {
      const litNode = isLit(n.key);
      const show =
        (showAll && litNode) || n.key === hovered || n.key === selected || n.key === graph.focusKey;
      if (!show) continue;
      const sx = w / 2 + cam.x + n.x * cam.k;
      const sy = h / 2 + cam.y + n.y * cam.k;
      if (sx < -40 || sx > w + 40 || sy < -20 || sy > h + 30) continue;
      // Use pre-computed label instead of recomputing every frame (was: truncateTitle(n.title || kindLabel(n.kind))).
      ctx.fillStyle = n.key === selected || n.key === hovered ? chrome.labelBright : chrome.label;
      ctx.globalAlpha = litNode ? 1 : 0.35;
      ctx.fillText(n.label, sx, sy + n.r * cam.k + 13);
    }
    ctx.globalAlpha = 1;
  };

  const drawRef = useRef(draw);
  drawRef.current = draw;

  const schedule = () => {
    if (rafPending.current) return;
    rafPending.current = true;
    rafId.current = requestAnimationFrame(function frame(t) {
      rafPending.current = false;
      const sim = simRef.current;
      let animating = false;
      if (sim && !reducedRef.current) {
        if (sim.alpha() > sim.alphaMin() || (sim.alphaTarget() ?? 0) > 0) {
          sim.tick();
          animating = true;
        }
      }
      drawRef.current(t);
      let pulsing = false;
      if (!reducedRef.current && hotRef.current) {
        for (const key of hotRef.current) {
          const started = pulseStarts.current.get(key);
          if (started !== undefined && t - started < PULSE_MS) {
            pulsing = true;
            break;
          }
        }
      }
      const shimmer = !reducedRef.current && shimmerRef.current;
      if (animating || shimmer || pulsing) schedule();
    });
  };
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;
  const wake = () => scheduleRef.current();

  // Resolve token colors once mounted (and rebuild if the wrapper remounts).
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    colorsRef.current = resolveKindColors(el);
    const styles = window.getComputedStyle(el);
    const read = (token: string, fallback: string) =>
      styles.getPropertyValue(token).trim() || fallback;
    chromeColors.current = {
      selected: read("--text-primary", "#f2f0ed"),
      madder: read("--madder", "#e06557"),
      marigold: read("--marigold", "#e8b44c"),
      label: read("--text-muted", "#9c978f"),
      labelBright: read("--text-primary", "#f2f0ed"),
      pearl: read("--pearl", "#edeae4"),
      thread: read("--text-faint", "#c6c0b8"),
    };
    spriteCache.current.clear();
    wake();
  }, []);

  // Build (or rebuild) the simulation whenever the graph data changes.
  // Positions persist across rebuilds so the time scrubber reads as growth,
  // not a relayout.
  useEffect(() => {
    for (const n of nodesRef.current) posMemory.current.set(n.key, { x: n.x, y: n.y });
    simRef.current?.stop();

    const isFirstBuild = nodesRef.current.length === 0;
    const byKey = new Map<string, SimNode>();
    const nodes: SimNode[] = graph.nodes.map((n) => {
      const prior = posMemory.current.get(n.key);
      const simNode: SimNode = {
        key: n.key,
        kind: n.kind,
        id: n.id,
        title: n.title,
        influence: n.influence,
        r: Math.round(nodeRadius(n, n.key === graph.focusKey) * 2) / 2,
        // Pre-compute label once at node creation (not per-frame in draw()).
        label: truncateTitle(n.title || kindLabel(n.kind)),
        x: prior?.x ?? n.x,
        y: prior?.y ?? n.y,
        outcome: n.outcome,
      };
      byKey.set(n.key, simNode);
      return simNode;
    });
    const edges: SimEdge[] = [];
    for (const e of graph.edges) {
      const source = byKey.get(e.source);
      const target = byKey.get(e.target);
      if (!source || !target) continue;
      edges.push({
        id: e.id,
        source,
        target,
        family: e.family,
        group: relationGroup(e.family),
        revises: e.revises,
        retired: e.retired,
        weight: edgeWeight(e.confidence),
      });
    }
    nodesRef.current = nodes;
    edgesRef.current = edges;

    const sim = forceSimulation<SimNode>(nodes)
      .force(
        "link",
        forceLink<SimNode, SimEdge>(edges)
          .distance((l) => 52 + (l.source.r + l.target.r) * 0.9)
          .strength(0.55),
      )
      .force("charge", forceManyBody<SimNode>().strength(-170).distanceMax(460))
      .force(
        "collide",
        forceCollide<SimNode>()
          .radius((n) => n.r + 6)
          .strength(0.9),
      )
      .force("center", forceCenter<SimNode>(0, 0).strength(0.25))
      // alphaDecay 0.035 settles in roughly 160 ticks: under 3s at 60fps.
      .alphaDecay(0.035)
      .velocityDecay(0.32)
      .alpha(isFirstBuild ? 0.9 : 0.5)
      .stop(); // ticked by our own frame loop, never d3's internal timer
    simRef.current = sim;

    if (reducedRef.current) {
      // No animated settling: run the physics to rest synchronously and show
      // the finished constellation as a still.
      let guard = 0;
      while (sim.alpha() > sim.alphaMin() && guard < 300) {
        sim.tick();
        guard++;
      }
    }

    // Fit the constellation on first sight; respect the user's camera after.
    if (!userMovedCam.current && nodes.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
      }
      const { w, h } = sizeRef.current;
      const spanX = Math.max(120, maxX - minX + 160);
      const spanY = Math.max(120, maxY - minY + 160);
      const k = Math.min(1.6, Math.max(0.35, Math.min(w / spanX, h / spanY)));
      camRef.current = {
        k,
        x: -((minX + maxX) / 2) * k,
        y: -((minY + maxY) / 2) * k,
      };
    }
    wake();
    return () => {
      sim.stop();
    };
  }, [graph]);

  // Contradiction hotspots pulse once on arrival.
  useEffect(() => {
    if (!hotKeys) return;
    const now = performance.now();
    for (const key of hotKeys) {
      if (!pulseStarts.current.has(key)) pulseStarts.current.set(key, now);
    }
    wake();
  }, [hotKeys]);

  // Redraw when focus/selection/annotations change.
  useEffect(() => {
    wake();
  }, [selectedKey, staleKeys, reducedMotion]);

  // DPR-aware sizing.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const apply = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(280, rect.width);
      const h = Math.max(320, rect.height);
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      wake();
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom to the cursor. Native listener: React's root-attached wheel
  // handlers are passive, so preventDefault must be wired here.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cam = camRef.current;
      const { w, h } = sizeRef.current;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const k = Math.min(3, Math.max(0.25, cam.k * factor));
      // Keep the world point under the cursor fixed while scaling.
      const wx = (sx - w / 2 - cam.x) / cam.k;
      const wy = (sy - h / 2 - cam.y) / cam.k;
      camRef.current = { k, x: sx - w / 2 - wx * k, y: sy - h / 2 - wy * k };
      userMovedCam.current = true;
      wake();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(
    () => () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      // A cancelled frame never runs, so it must reopen the schedule gate:
      // under dev double-invoked effects (and any future remount that keeps
      // refs), a latched-true rafPending would silently freeze the canvas
      // forever - the blank-graph bug.
      rafPending.current = false;
      simRef.current?.stop();
    },
    [],
  );

  const toWorld = (sx: number, sy: number) => {
    const cam = camRef.current;
    const { w, h } = sizeRef.current;
    return { x: (sx - w / 2 - cam.x) / cam.k, y: (sy - h / 2 - cam.y) / cam.k };
  };

  const pick = (sx: number, sy: number): SimNode | null => {
    const { x, y } = toWorld(sx, sy);
    const nodes = nodesRef.current;
    const slack = 3 / camRef.current.k;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = n.x - x;
      const dy = n.y - y;
      const hit = n.r + slack;
      if (dx * dx + dy * dy <= hit * hit) return n;
    }
    return null;
  };

  const localPoint = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return { sx: e.clientX - (rect?.left ?? 0), sy: e.clientY - (rect?.top ?? 0) };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // A touch/pen pointer can be gone before the handler runs; dragging
      // still works for the common case, so never let capture failure throw.
    }
    const { sx, sy } = localPoint(e);
    const node = pick(sx, sy);
    const cam = camRef.current;
    dragging.current = {
      node,
      panFrom: node ? null : { sx, sy, camX: cam.x, camY: cam.y },
      start: { sx, sy, t: performance.now() },
      moved: false,
      lastSample: null,
      velocity: { vx: 0, vy: 0 },
    };
    if (node) {
      const wp = toWorld(sx, sy);
      node.fx = wp.x;
      node.fy = wp.y;
      dragging.current.lastSample = { x: wp.x, y: wp.y, t: performance.now() };
      if (!reducedRef.current) simRef.current?.alphaTarget(0.25);
      setHover(null);
    }
    wake();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { sx, sy } = localPoint(e);
    const d = dragging.current;
    if (d) {
      const dist = Math.hypot(sx - d.start.sx, sy - d.start.sy);
      if (dist > 4) d.moved = true;
      if (d.node) {
        const wp = toWorld(sx, sy);
        const now = performance.now();
        if (d.lastSample) {
          const dt = Math.max(1, now - d.lastSample.t);
          // Per-tick velocity (about 16ms a frame), clamped so a fling stays graceful.
          const scale = 16 / dt;
          d.velocity = {
            vx: Math.max(-40, Math.min(40, (wp.x - d.lastSample.x) * scale)),
            vy: Math.max(-40, Math.min(40, (wp.y - d.lastSample.y) * scale)),
          };
        }
        d.lastSample = { x: wp.x, y: wp.y, t: now };
        d.node.fx = wp.x;
        d.node.fy = wp.y;
        if (reducedRef.current) {
          // Physics stays frozen: move just this node, no web response.
          d.node.x = wp.x;
          d.node.y = wp.y;
        }
      } else if (d.panFrom) {
        camRef.current = {
          ...camRef.current,
          x: d.panFrom.camX + (sx - d.panFrom.sx),
          y: d.panFrom.camY + (sy - d.panFrom.sy),
        };
        userMovedCam.current = true;
      }
      wake();
      return;
    }
    const node = pick(sx, sy);
    const cur = hoverRef.current;
    if (node ? cur?.key !== node.key : cur !== null) {
      setHover(node ? { key: node.key, sx, sy } : null);
      wake();
    } else if (node && cur) {
      // Same node: keep the card anchored near the pointer without re-rendering per pixel.
      if (Math.hypot(sx - cur.sx, sy - cur.sy) > 24) setHover({ key: node.key, sx, sy });
    }
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = node ? "pointer" : "grab";
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragging.current;
    dragging.current = null;
    if (!d) return;
    if (d.node) {
      d.node.fx = null;
      d.node.fy = null;
      if (!reducedRef.current) {
        // Momentum: the node keeps the fling velocity and the web answers.
        d.node.vx = d.velocity.vx;
        d.node.vy = d.velocity.vy;
        simRef.current?.alphaTarget(0);
        if ((simRef.current?.alpha() ?? 0) < 0.1) simRef.current?.alpha(0.1);
      }
    }
    const dt = performance.now() - d.start.t;
    if (!d.moved && dt < 500) {
      const { sx, sy } = localPoint(e);
      const node = pick(sx, sy);
      // dim 17 (click-to-open): a single click on a node opens its detail (the
      // story panel) and lights its neighborhood; clicking empty space clears
      // the focus. No dead tiles, no double-click requirement.
      if (node) {
        onSelect(node.key);
        onOpenStory(node.key);
      } else {
        onSelect(null);
      }
    }
    wake();
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { sx, sy } = localPoint(e);
    const node = pick(sx, sy);
    if (node) onOpenStory(node.key);
  };

  const hoveredNode = hover ? (nodesRef.current.find((n) => n.key === hover.key) ?? null) : null;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(420px, 58vh, 640px)",
        // The ONE bordered container in this region. The recess reads as a
        // window cut into the page rather than a card sitting on it, which is
        // what a map wants.
        background: "var(--sp-sink)",
        border: "1px solid var(--sp-line)",
        borderRadius: "var(--sp-radius-panel)",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="The knowledge map: an interactive constellation of this workspace's signals, specs, decisions and outcomes. Use the list view for a screen reader friendly outline."
        style={{ display: "block", touchAction: "none", cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={(e) => {
          onPointerUp(e);
          setHover(null);
        }}
        onDoubleClick={onDoubleClick}
      />
      {hoveredNode ? (
        <GraphHoverCard
          node={hoveredNode}
          why={whyByKey.get(hoveredNode.key) ?? null}
          sx={hover!.sx}
          sy={hover!.sy}
          bounds={sizeRef.current}
        />
      ) : null}
      <div style={{ position: "absolute", right: 10, bottom: 8 }}>
        <Action
          variant="quiet"
          onClick={() => {
            userMovedCam.current = false;
            camRef.current = { x: 0, y: 0, k: 1 };
            simRef.current?.alpha(0.3);
            wake();
          }}
        >
          Recentre
        </Action>
      </div>
    </div>
  );
}

/**
 * The glass hover card: kind, title, real link counts from the same lineage
 * query GraphNodeStory uses (shared cache key, so the data is fetched once).
 * Origin-aware: it flips to stay inside the canvas.
 */
function GraphHoverCard({
  node,
  why,
  sx,
  sy,
  bounds,
}: {
  node: {
    key: string;
    kind: string;
    id: string;
    title: string;
    influence: number;
    outcome: string | null;
  };
  /** The newest link into this node, in words. Null when nothing is joined to it. */
  why: EdgeWhy | null;
  sx: number;
  sy: number;
  bounds: { w: number; h: number };
}) {
  const fLineage = useServerFn(getLineage);
  const story = useQuery({
    queryKey: ["graph-node-story", node.kind, node.id],
    queryFn: () => fLineage({ data: { kind: node.kind as GraphNodeKind, id: node.id } }),
    enabled: !!node.id,
    staleTime: 60_000,
  });
  const cameFrom = story.data?.ancestors?.length ?? null;
  const ledTo = story.data?.descendants?.length ?? null;
  const verdict = outcomeLabel(node.outcome);

  const flipX = sx > bounds.w * 0.58;
  const flipY = sy > bounds.h * 0.62;
  return (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        left: flipX ? undefined : sx + 14,
        right: flipX ? bounds.w - sx + 14 : undefined,
        top: flipY ? undefined : sy + 14,
        bottom: flipY ? bounds.h - sy + 14 : undefined,
        maxWidth: 260,
        pointerEvents: "none",
        // SOLID, not glass. Blur is chrome material for things that genuinely
        // float (anti-slop ban 2), and a label you have to read against a
        // moving constellation is the one place it costs contrast rather than
        // buying depth. This floats, so it takes the float surface and the
        // system shadow.
        background: "var(--sp-float)",
        border: "1px solid var(--sp-line)",
        borderRadius: "var(--sp-radius-panel)",
        boxShadow: "var(--sp-shadow)",
        padding: "10px 12px",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: 3,
            background: kindCssColor(node.kind),
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
          {kindLabel(node.kind)}
        </span>
        {/* The verdict, where the record has one. Green and red carry outcomes,
            and an outcome is the one thing on this canvas that IS one. */}
        {verdict ? (
          <span className={OUTCOME_TONE[node.outcome!] === "fail" ? "sp-fail" : "sp-pass"}>
            <span style={{ fontSize: "var(--sp-text-meta)" }}>{verdict}</span>
          </span>
        ) : null}
      </div>
      <div
        style={{
          color: "var(--sp-ink)",
          lineHeight: "var(--sp-leading-row)",
          marginBottom: 6,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {node.title || "Untitled"}
      </div>
      {/* WHY it is joined to anything, in the record's own words. The link count
          below says HOW MANY, which is a different fact and a much weaker one. */}
      {why ? (
        <div
          style={{
            fontSize: "var(--sp-text-meta)",
            color: "var(--sp-mute)",
            lineHeight: "var(--sp-leading-row)",
            marginBottom: 6,
          }}
        >
          <span className={why.revises ? "sp-fail" : undefined}>{why.phrase}</span>
          {why.peerTitle ? ` ${truncateTitle(why.peerTitle, 34)}` : ""}
          {why.rationale ? (
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                marginTop: 3,
              }}
            >
              {why.rationale}
            </span>
          ) : null}
          {why.agent ? (
            <span style={{ display: "block" }}>{agentDisplayName(why.agent)}</span>
          ) : null}
        </div>
      ) : null}
      <div style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
        <Num>{node.influence}</Num> {node.influence === 1 ? "link" : "links"}
        {cameFrom !== null && ledTo !== null ? (
          <>
            {" · from "}
            <Num>{cameFrom}</Num>
            {", led to "}
            <Num>{ledTo}</Num>
          </>
        ) : null}
      </div>
      <div style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)", marginTop: 5 }}>
        Click to open it
      </div>
    </div>
  );
}
