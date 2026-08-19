import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { StationGlyph, type StationGlyphKind } from "./station-glyphs";

/*
 * FLOWCHART: a branching sequence on a dotted canvas.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component 16 "Flowchart"
 *                 (their file: components/Flowchart.tsx), read from the page's
 *                 own embedded source on 2026-08-20, not from a screenshot.
 * To re-check it: fetch that page and search for "FLOWCHART — an agent
 * workflow"; the component's real source is inline in the document.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * The reference ships twenty components and Meridian had nineteen. This was the
 * missing one, and it is the one the direction had already asked for: §6.3
 * specifies the Run Map, "a canvas for watching, not authoring", and nothing in
 * this repo could draw a graph. There is no graph library here either, on purpose.
 *
 * ── THE MECHANICS, READ OFF THE SOURCE ──────────────────────────────────
 * These are the reference's own numbers, and several of them contradict what this
 * component was specified as. The source wins; the divergences are in the build
 * log.
 *
 *   PAD_Y 24 · ROW_GAP 64 · PILL_OFFSET 30
 *   x is a FRACTION of canvas width, so the canvas is responsive by construction
 *   node width is clamped to 92% of the canvas, never overflowing it
 *   heights are MEASURED with a ResizeObserver, with an estimate for first paint
 *   connectors are CUBIC BEZIER, stroke 1.25, k = clamp(|dy| * 0.55, 24, 84)
 *   the ground is a radial-gradient dot at 22px, centred
 *
 * ── THE TWO MECHANICS WORTH READING TWICE ───────────────────────────────
 *
 * 1. HEIGHTS ARE MEASURED, NOT DECLARED. A node's height comes from its content,
 *    so a second line of description makes the row taller and every row below it
 *    moves down. Declaring two fixed heights would be simpler and would break the
 *    moment a title wrapped.
 *
 * 2. `PILL_OFFSET` IS WHY THE CONNECTORS LAND CORRECTLY. The kind pill sits ABOVE
 *    the card, inside the node's box, so a node's top ANCHOR is 30px below its
 *    top EDGE. Without that the incoming connector stops in the air beside the
 *    pill. This is the "connectors meet nodes at a consistent anchor rather than
 *    wherever the maths lands" rule, and it is the reference's own solution to it.
 *
 * ── THE DRAGGING, WHICH THIS FILE ONCE ARGUED AGAINST ───────────────────
 * This header used to say the dragging was deliberately not ported, on the
 * grounds that §6.3 calls the Run Map "a canvas for watching, not authoring",
 * and that nodes a reader can shove around invite them to believe the layout
 * means something.
 *
 * FOUNDER RULING 2026-08-20 OVERTURNS THAT, and it is the better reading:
 * a graph you cannot rearrange is a picture, and a run map the reader cannot
 * untangle is not a map. Sixteen connectors crossing each other is exactly the
 * case where the layout derived from the graph is the layout nobody can read.
 * The line the ruling keeps is the one about AUTHORING: nothing here creates a
 * node, draws an edge or deletes anything. Dragging moves a card so the reader
 * can see past it. That is reading, not editing.
 *
 * The drag is the reference's own, ported off its source rather than watched:
 * a pointer-capture drag with a 3px threshold, offsets held per node, both axes
 * clamped so a card cannot leave the canvas, and a suppressed click so a drag
 * does not also toggle selection. Positions are NOT persisted: nothing writes
 * them anywhere, so a reload returns the graph's own layout. Whether a person's
 * untangling should outlive the page is a product decision nobody has taken.
 *
 * ONE DELIBERATE DIVERGENCE FROM THE SOURCE. The reference sets a node's
 * `zIndex` by reading its drag ref during render, which works there because a
 * state update follows in the same tick, but a ref read during render is a
 * value React is entitled to have changed since. Held in state here instead.
 *
 * ── WHAT IS DELIBERATELY NOT PORTED ─────────────────────────────────────
 * THE DECORATIVE HUE. The reference paints its kind pill and its step icon in a
 * per-kind colour, purple for Trigger and amber for If/Else. Meridian cannot: its
 * five hues are status words with fixed meanings and amber already means "stopped,
 * waiting on a condition", which on a run map would be actively wrong. So which
 * KIND a node is comes through its GLYPH, per law 4, identity is shape, and the
 * kind pill is colourless in the shape `RecordTag` already uses for a category.
 * The glyphs are the station set, reused rather than redrawn, so a node on this
 * canvas is the same shape as that station everywhere else in the product.
 */

/* The reference's own layout constants, unchanged. */
const PAD_Y = 24;
const ROW_GAP = 64;
/** The kind pill sits above the card, so a node's top anchor is this far down. */
const PILL_OFFSET = 30;
/** Only until the first measurement lands. Never used for layout after that. */
const ESTIMATED_HEIGHT = 92;
/**
 * The reference's own two drag figures.
 *
 * `DRAG_SLOP` is why a click on a card is still a click: a pointer that travels
 * under 3px has not been dragged, it has been pressed by a hand that moved.
 * `DRAG_INSET` keeps a card's edge this far inside the canvas, so a node can
 * never be pushed under the rounded corner and lost.
 */
const DRAG_SLOP = 3;
const DRAG_INSET = 8;

export type FlowNode = {
  id: string;
  /** Which rank down the canvas. Several nodes may share one. */
  row: number;
  /** 0 to 1, the node's CENTRE as a fraction of canvas width. */
  x: number;
  /** Intrinsic width in px, clamped to 92% of the canvas. */
  w?: number;
  /** The station this step belongs to. Drawn as its glyph, never as text. */
  station?: StationGlyphKind;
  /** What kind of step this is: "Trigger", "If / Else", "Gate". Colourless. */
  kind?: string;
  title: string;
  /** A second line. Its presence is what makes the node taller. */
  caption?: string;
};

export type FlowEdge = {
  from: string;
  to: string;
  /** A branch's outgoing label, e.g. "yes" / "no". Drawn on the curve. */
  label?: string;
};

const DEFAULT_WIDTH = 300;

export function Flowchart({
  nodes,
  edges,
  label = "How this run branches",
  selectedId,
  onSelect,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  label?: string;
  /** Controlled selection. Omit both and nodes are plain, unpressable facts. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const [width, setWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  /**
   * WHERE THE READER PUT EACH CARD, as a delta from where the graph put it.
   *
   * A delta rather than an absolute position, which is the reference's choice and
   * the right one: `x` is a FRACTION of canvas width, so a card that has been
   * moved still follows the canvas when the pane is resized, and an untouched
   * card has no entry here at all rather than an entry that happens to match.
   */
  const [offsets, setOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  /** Which card is under the pointer right now, so it draws over its neighbours. */
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const drag = useRef<{
    id: string;
    startX: number;
    startY: number;
    baseDx: number;
    baseDy: number;
    moved: boolean;
  } | null>(null);

  /*
   * MEASURE, DO NOT DECLARE. The reference does this with one ResizeObserver on
   * the canvas plus one per node, and it is the mechanic that lets a node's height
   * follow its content.
   *
   * Guarded because happy-dom and jsdom implement no ResizeObserver, and a
   * component that throws on mount in a test environment is one nobody can write a
   * test against. Without it every node keeps the estimate, which is exactly what
   * the estimate is for.
   */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measure = () => {
      setWidth(canvas.clientWidth);
      setHeights((previous) => {
        const next = { ...previous };
        let changed = false;
        nodeRefs.current.forEach((el, id) => {
          const h = el.offsetHeight;
          if (h && Math.abs(h - (next[id] ?? 0)) > 0.5) {
            next[id] = h;
            changed = true;
          }
        });
        return changed ? next : previous;
      });
    };

    measure();
    const Observer = typeof ResizeObserver === "undefined" ? null : ResizeObserver;
    if (!Observer) return;
    const observer = new Observer(measure);
    observer.observe(canvas);
    nodeRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [nodes.length]);

  const heightOf = (id: string) => heights[id] ?? ESTIMATED_HEIGHT;

  /* Rows to y offsets, from measured heights. A taller node pushes its whole row. */
  const rows = [...new Set(nodes.map((n) => n.row))].sort((a, b) => a - b);
  const rowHeights = rows.map((r) =>
    Math.max(...nodes.filter((n) => n.row === r).map((n) => heightOf(n.id)), ESTIMATED_HEIGHT),
  );
  const rowY: number[] = [];
  rows.forEach((_, i) => {
    rowY[i] = i === 0 ? PAD_Y : rowY[i - 1] + rowHeights[i - 1] + ROW_GAP;
  });

  const canvasHeight =
    rows.length === 0 ? PAD_Y * 2 : rowY[rows.length - 1] + rowHeights[rows.length - 1] + PAD_Y;

  /* 480 until the first measurement, which is the reference's own fallback. */
  const cw = width || 480;

  /** Where the graph puts a node, before the reader has moved anything. */
  const home = (n: FlowNode) => ({
    w: Math.min(n.w ?? DEFAULT_WIDTH, cw * 0.92),
    cx: n.x * cw,
    top: rowY[rows.indexOf(n.row)] ?? PAD_Y,
  });

  const place = (n: FlowNode) => {
    const at = home(n);
    const off = offsets[n.id];
    return { w: at.w, cx: at.cx + (off?.dx ?? 0), top: at.top + (off?.dy ?? 0) };
  };

  /*
   * A node's connector anchors. The top one is offset by the kind pill, which is
   * the whole reason connectors land on the card rather than beside it.
   */
  const anchors = (n: FlowNode) => {
    const { cx, top } = place(n);
    return {
      top: { x: cx, y: top + (n.kind ? PILL_OFFSET : 0) },
      bottom: { x: cx, y: top + heightOf(n.id) },
    };
  };

  const byId = new Map(nodes.map((n) => [n.id, n]));

  /*
   * A cubic bezier leaving downward and arriving downward, so two edges out of one
   * node separate immediately instead of crossing. `k` is the reference's:
   * proportional to the vertical run, floored so a short hop still curves and
   * capped so a long one does not balloon.
   */
  const curve = (edge: FlowEdge) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) return null;
    const a = anchors(from).bottom;
    const b = anchors(to).top;
    const k = Math.min(Math.max(Math.abs(b.y - a.y) * 0.55, 24), 84);
    return {
      d: `M ${a.x} ${a.y} C ${a.x} ${a.y + k}, ${b.x} ${b.y - k}, ${b.x} ${b.y}`,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  /*
   * ── DRAGGING ────────────────────────────────────────────────────────────
   * The reference's mechanics, and each of the four is load-bearing.
   *
   * POINTER CAPTURE, so a hand that outruns the card keeps dragging it. Without
   * it the pointer leaves the node's box on the first fast move and the card
   * stops dead under a finger that is still moving.
   *
   * A 3px THRESHOLD, so a press is still a press. `moved` only latches once the
   * pointer has travelled far enough that nobody would call it a click, and the
   * card does not shift by the two pixels a hand gives a mouse button.
   *
   * BOTH AXES CLAMPED against the canvas rather than the row, because the whole
   * point is moving a card OFF its row. Held `DRAG_INSET` inside so an edge
   * cannot disappear under the rounded corner.
   *
   * THE CLICK IS SUPPRESSED AFTER A REAL DRAG, and the one-tick `setTimeout` is
   * why: `pointerup` fires before `click`, so clearing the drag immediately
   * would let the card's own `onClick` toggle selection at the end of every
   * drag. The timeout holds `moved` true across exactly that gap.
   *
   * NOTHING HERE IS ON A KEYBOARD PATH. These are pointer events only, so a
   * person tabbing through the cards can still select them and can never
   * accidentally displace one. Position is not information a keyboard user is
   * missing: the graph's own layout is the answer, and dragging only ever
   * departs from it.
   */
  const startDrag = (node: FlowNode) => (event: ReactPointerEvent<HTMLDivElement>) => {
    const off = offsets[node.id];
    drag.current = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      baseDx: off?.dx ?? 0,
      baseDy: off?.dy ?? 0,
      moved: false,
    };
    setDraggingId(node.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (node: FlowNode) => (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== node.id) return;
    const travelX = event.clientX - d.startX;
    const travelY = event.clientY - d.startY;
    if (!d.moved && Math.hypot(travelX, travelY) < DRAG_SLOP) return;
    d.moved = true;

    const at = home(node);
    const h = heightOf(node.id);
    const cx = Math.min(
      Math.max(at.cx + d.baseDx + travelX, at.w / 2 + DRAG_INSET),
      cw - at.w / 2 - DRAG_INSET,
    );
    const top = Math.min(
      Math.max(at.top + d.baseDy + travelY, DRAG_INSET),
      canvasHeight - h - DRAG_INSET,
    );
    setOffsets((current) => ({ ...current, [node.id]: { dx: cx - at.cx, dy: top - at.top } }));
  };

  /*
   * `pointercancel` is bound to this too, which the reference does not do. A
   * browser cancels a pointer when it decides the gesture belongs to it instead
   * (a system back-swipe, a context menu, a lost capture), and without this the
   * card would keep `cursor-grabbing` and its raised z-index until the next
   * press. One of the sizes nobody draws.
   */
  const endDrag = (node: FlowNode) => () => {
    const d = drag.current;
    if (d?.id !== node.id) return;
    setDraggingId(null);
    if (d.moved) setTimeout(() => (drag.current = null), 0);
    else drag.current = null;
  };

  const wasDragged = () => drag.current?.moved === true;

  /*
   * THE ZERO CASE. A run with no map is not an error: a mission that has not been
   * planned yet has no branches to draw.
   *
   * `data-mrd` on the early return as well, which is exactly how a component loses
   * the attribute: the eye reads the main return as the root and stops.
   */
  if (nodes.length === 0) {
    return (
      <div
        data-mrd=""
        className="w-full rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5 font-mrd"
      >
        <p className="text-mrd-base font-medium text-mrd-body">This run has no map yet.</p>
        <p className="mt-1 max-w-[62ch] text-mrd-small leading-relaxed text-mrd-mute">
          Once the crew commits to a route, every step and every branch appears here, so you can see
          where the work went rather than reading which station it reached.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      data-mrd=""
      role="group"
      aria-label={label}
      className="relative w-full overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-map font-mrd select-none"
      style={{
        height: canvasHeight,
        /*
         * DOTTED, not gridded and not plain, which is the reference's own ground.
         * A grid reads as a spreadsheet and a plain panel gives the eye nothing to
         * judge distance against, so a node dragged nowhere looks placed nowhere.
         * The 1px dot inside a 1.25px stop is what keeps it from banding.
         *
         * THE DOT DOES NOT CHANGE NOW THE GROUND IS TINTED, and that is on
         * purpose. `--mrd-map` sits at exactly `--mrd-sink`'s lightness in each
         * ground and adds only chroma, so this pattern's contrast against it is
         * arithmetically what it was: 4.98 on dark, 1.313 on paper. The argument
         * and both measurements are in `meridian.css` beside the token.
         */
        backgroundImage: "radial-gradient(var(--mrd-edge) 1px, transparent 1.25px)",
        backgroundSize: "22px 22px",
        backgroundPosition: "center",
      }}
    >
      {/*
       * Connectors under the nodes and out of the pointer's way. `aria-hidden`
       * because an edge is announced by the order of the nodes it joins, and a
       * screen reader reading sixteen unnamed paths learns nothing.
       */}
      <svg
        aria-hidden
        width={cw}
        height={canvasHeight}
        className="pointer-events-none absolute inset-0"
      >
        {edges.map((edge) => {
          const c = curve(edge);
          if (!c) return null;
          const lit = selectedId === edge.from || selectedId === edge.to;
          return (
            <g key={`${edge.from}-${edge.to}-${edge.label ?? ""}`}>
              <path
                d={c.d}
                fill="none"
                /*
                 * FULL INK WHEN LIT, and never the accent. The reference lights a
                 * selected edge with its accent colour; Meridian's accent is
                 * `--mrd-you`, which means a person is required, and spending it on
                 * a selection would say this edge was waiting for somebody. Ink to
                 * edge is a value step, so it also survives greyscale.
                 */
                stroke={lit ? "var(--mrd-ink)" : "var(--mrd-edge)"}
                strokeWidth="1.25"
                className="transition-[stroke] duration-150"
              />
              {edge.label ? (
                <text
                  x={c.mid.x}
                  y={c.mid.y}
                  dy="0.32em"
                  textAnchor="middle"
                  className="fill-mrd-mute font-mrd text-mrd-data"
                  /* A plate behind the word, so a label crossing its own curve is
                     still readable. `paint-order` draws the stroke first. It is
                     the CANVAS token, not `sink`: those were the same colour
                     until the ground took its violet cast, and a plate one step
                     off its ground reads as a grey halo round the word. */
                  stroke="var(--mrd-map)"
                  strokeWidth="4"
                  paintOrder="stroke"
                >
                  {edge.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {nodes.map((node) => {
        const { w, cx, top } = place(node);
        const active = selectedId === node.id;

        const body = (
          <span className="flex items-center gap-2.5 px-3 py-2.5">
            {node.station ? (
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-mrd-ctl border border-mrd-line bg-mrd-lift text-mrd-body"
                aria-hidden
              >
                <StationGlyph kind={node.station} size={16} />
              </span>
            ) : null}
            <span className="min-w-0 text-left">
              <span className="block truncate text-mrd-base font-medium text-mrd-ink">
                {node.title}
              </span>
              {node.caption ? (
                <span className="mt-0.5 block text-mrd-small leading-snug text-mrd-mute">
                  {node.caption}
                </span>
              ) : null}
            </span>
          </span>
        );

        return (
          <div
            key={node.id}
            ref={(el) => {
              if (el) nodeRefs.current.set(node.id, el);
              else nodeRefs.current.delete(node.id);
            }}
            onPointerDown={startDrag(node)}
            onPointerMove={moveDrag(node)}
            onPointerUp={endDrag(node)}
            onPointerCancel={endDrag(node)}
            /*
             * `touch-none` so a finger drags the card instead of scrolling the
             * page, which is the reference's own class here and the only way a
             * touch drag works at all.
             *
             * `cursor-grab` is the whole affordance, and it is deliberately the
             * only one: the reference puts no visible grip on a step card either
             * (its six-dot handle lives inside the condition rows), and adding a
             * grip to every node would change a layout that has already been
             * measured and verified.
             *
             * NO TRANSITION ON `left` OR `top`, in either state. A dragged card
             * must sit under the pointer rather than easing towards it, so there
             * is nothing here for `prefers-reduced-motion` to suppress. That
             * matters because the reduced-motion block in `meridian.css` stills
             * keyframe ANIMATIONS and does not touch transitions, so a transition
             * put here would have run for everyone.
             */
            className={`absolute flex -translate-x-1/2 touch-none flex-col items-start gap-1.5 ${
              draggingId === node.id ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ left: cx, top, width: w, zIndex: draggingId === node.id ? 2 : 1 }}
          >
            {node.kind ? (
              /*
               * COLOURLESS, and the shape is `RecordTag`'s: 20px, `rounded-mrd-xs`,
               * a hairline on the recess. That component is the ported chip for a
               * CATEGORY, which is what a node kind is. The reference tints this
               * per kind; see the header for why Meridian cannot.
               */
              <span className="inline-flex h-5 items-center rounded-mrd-xs border border-mrd-line bg-mrd-sheet px-1.5 text-mrd-data text-mrd-body">
                {node.kind}
              </span>
            ) : null}

            {onSelect ? (
              <button
                type="button"
                aria-pressed={active}
                onClick={() => {
                  // A drag that ended on this card is not a press on it. See the
                  // one-tick timeout in `endDrag` for why the flag is still set
                  // when this runs.
                  if (wasDragged()) return;
                  onSelect(active ? null : node.id);
                }}
                className={`w-full rounded-mrd-card border text-left transition-colors duration-150 ${
                  active
                    ? "border-mrd-ink bg-mrd-float"
                    : "border-mrd-line bg-mrd-float hover:bg-mrd-lift-hover"
                }`}
                style={{ boxShadow: "var(--mrd-shadow-card)" }}
              >
                {body}
              </button>
            ) : (
              /* No handler, no pointer, no tab stop. A card that looks pressable and
                 does nothing is the affordance failure this system keeps finding. */
              <div
                className="w-full rounded-mrd-card border border-mrd-line bg-mrd-float"
                style={{ boxShadow: "var(--mrd-shadow-card)" }}
              >
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Flowchart;

/**
 * A straight run of steps, laid out for you.
 *
 * Most callers have a list rather than a graph, and making them invent `row` and
 * `x` for a single column is how two surfaces end up with two different idea of
 * what centred means.
 */
export function flowFromSteps(
  steps: { id: string; title: string; caption?: string; station?: StationGlyphKind; kind?: string }[],
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  return {
    nodes: steps.map((s, i) => ({ ...s, row: i, x: 0.5 })),
    edges: steps.slice(1).map((s, i) => ({ from: steps[i].id, to: s.id })),
  };
}
