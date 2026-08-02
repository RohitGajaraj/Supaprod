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
import { useEffect, useState } from "react";
import { GraphCanvasView } from "./GraphCanvasView";
import { GraphTreeView } from "./GraphTreeView";
import { GraphRecordRegions } from "./GraphRecordRegions";
import { usePrefersReducedMotion } from "./graph-visual";

type GraphView = "graph" | "list";

const VIEWS: { id: GraphView; label: string }[] = [
  { id: "graph", label: "Canvas" },
  { id: "list", label: "Outline" },
];

export function GraphPanel({ focusKind, focusId }: { focusKind?: string; focusId?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [view, setView] = useState<GraphView>("graph");
  const [userChose, setUserChose] = useState(false);

  // Auto-switch to the a11y path when reduced motion turns on, unless the
  // user has explicitly picked a view this visit.
  useEffect(() => {
    if (reducedMotion && !userChose) setView("list");
  }, [reducedMotion, userChose]);

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
        <GraphTreeView focusKind={focusKind} focusId={focusId} />
      )}
      {/* WHAT THE MAP SAYS, in sentences, under BOTH views.
          Reduced motion makes the outline the default above, which is exactly
          why these two regions sit out here rather than inside the canvas: the
          reader most likely to want a text answer is the one who would never
          have seen them. Same query key as the canvas, so it costs no second
          request, and every row leads to an address that already existed. */}
      <GraphRecordRegions focusKind={focusKind} focusId={focusId} />
    </div>
  );
}
