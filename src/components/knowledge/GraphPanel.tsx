// O1 - the Graph tab shell. Two complementary views of the same
// artifact_lineage: the living physics canvas (the flagship), and the indented
// downstream outline, kept as the reduced-motion and screen-reader path
// (founder ruling 2026-06-20: keep both). When the OS or the in-product toggle
// asks for reduced motion the outline leads by default; the canvas stays one
// click away and renders as a settled still there.
//
// Ported to the shell primitives, 2026-07-29. What went: the hand-built pill
// tab group with its own 1px border, 2px padding, `--hairline`,
// `--radius-control`, `--raised`, `loom-press` and four hand-written
// focus-visible utility classes. `.sp-tabs` / `.sp-tab` is the ported tab strip
// and the whole group is one line of markup now. The UPPERCASE MONO labels went
// with it: mono is for data, never for a door's name.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE OUTLINE COMES OFF THE ACCESSIBILITY PATH AND LEADS, 2026-08-10.
//
// It was built as the reduced-motion fallback and treated as the lesser copy of
// the canvas, which is backwards. A survey of dependency and lineage
// visualisers across roughly two hundred products found the best one shipped
// anywhere was not a graph at all: it was a scrollable list of text -- grouped,
// counted, linked, with the consequence spelled out in a sentence. This repo
// already had that and hid it behind a toggle labelled as the a11y option.
//
// Position carries no meaning in a force-directed layout, so the canvas is
// answering "how many things are near each other", which nobody asked. The
// outline answers "what came out of this, and what came out of that", in order,
// with the reason on the row. That is the question the tab exists for.
//
// SO THE OUTLINE IS FIRST, AND IT IS THE DEFAULT WHEREVER IT CAN ACTUALLY
// ANSWER. The one thing it cannot do is start from nothing: `getLineageTree`
// takes a kind and an id, so with no node centred the outline has no root and
// renders its "nothing is centred yet" state. Defaulting to it there would open
// the tab on an empty state and send the reader to the other view to fix it.
// So: centred -> Outline, which is every deep link from the record regions,
// every "centre the graph here" on a node, and every double-click on the
// preview. Not centred -> Canvas, which is the only view that can show you the
// whole map to pick a starting point out of. The reader is never dropped
// somewhere that cannot answer them.
import { useEffect, useState } from "react";
import { GraphCanvasView } from "./GraphCanvasView";
import { GraphTreeView } from "./GraphTreeView";
import { GraphRecordRegions } from "./GraphRecordRegions";
import { usePrefersReducedMotion } from "./graph-visual";

type GraphView = "graph" | "list";

const VIEWS: { id: GraphView; label: string }[] = [
  { id: "list", label: "Outline" },
  { id: "graph", label: "Canvas" },
];

export function GraphPanel({ focusKind, focusId }: { focusKind?: string; focusId?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  // Whether the outline has a root to grow from. It is the same condition
  // GraphTreeView enables its own read on, kept here because it is what decides
  // which view can answer at all.
  const centred = Boolean(focusKind && focusId);
  const [view, setView] = useState<GraphView>(centred ? "list" : "graph");
  const [userChose, setUserChose] = useState(false);

  // Two reasons to move the reader without being asked, and both stand down the
  // moment they pick a view themselves:
  //   reduced motion, which has always forced the text path;
  //   a node becoming centred, which is the outline's whole precondition. That
  //   second one is what makes "centre the graph here" land somewhere that
  //   answers, rather than redrawing the same canvas around a new middle.
  useEffect(() => {
    if (userChose) return;
    if (reducedMotion || centred) setView("list");
    else setView("graph");
  }, [reducedMotion, centred, userChose]);

  return (
    <div>
      <div
        className="sp-tabs"
        role="tablist"
        aria-label="How to read the graph"
        // Tabs keyboard contract: Left/Right move between the two views.
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          const next = view === "graph" ? "list" : "graph";
          setUserChose(true);
          setView(next);
          e.currentTarget.querySelector<HTMLButtonElement>(`[data-tab-id="${next}"]`)?.focus();
        }}
      >
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={view === id}
            tabIndex={view === id ? 0 : -1}
            data-tab-id={id}
            onClick={() => {
              setUserChose(true);
              setView(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "graph" ? (
        <GraphCanvasView focusKind={focusKind} focusId={focusId} reducedMotion={reducedMotion} />
      ) : (
        /* The outline's not-centred state used to tell the reader to "open the
           Graph view and choose Centre the graph here", which is a correct
           instruction and not a door: it named a control on a view they were
           not looking at. Now it can hand them there. */
        <GraphTreeView
          focusKind={focusKind}
          focusId={focusId}
          onOpenCanvas={() => {
            setUserChose(true);
            setView("graph");
          }}
        />
      )}
      {/* WHAT THE MAP SAYS, in sentences, under BOTH views.
          Reduced motion makes the outline the default above, which is exactly
          why these two regions sit out here rather than inside the canvas: the
          reader most likely to want a text answer is the one who would never
          have seen them. Same query key as the canvas, so it costs no second
          request, and every row leads to an address that already existed.

          `readStatedAbove` is which of the two views is showing, because only
          one of them reads this key. The canvas fetches
          ["knowledge-graph", ...] and renders its own Loading and Failed for
          it; the outline fetches ["lineage-tree", ...] and says nothing about
          this read at all. Passing the view keeps a failed graph read stated
          exactly once on either path. Before this, the regions were silent on
          both, so on the outline (the DEFAULT under reduced motion) a failure
          was invisible. */}
      <GraphRecordRegions
        focusKind={focusKind}
        focusId={focusId}
        readStatedAbove={view === "graph"}
      />
    </div>
  );
}
