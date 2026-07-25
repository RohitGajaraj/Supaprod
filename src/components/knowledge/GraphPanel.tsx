// O1, reframed by W3 (Loom) - the Graph tab shell. Two complementary views of
// the same artifact_lineage: "Graph" is the living physics canvas (the
// flagship), "List" the indented downstream lineage tree, kept as the
// reduced-motion and screen-reader path (founder ruling 2026-06-20: keep
// both). When the OS or the in-product toggle asks for reduced motion the
// List leads by default; the Graph stays one click away and renders as a
// settled still there.
import { useEffect, useState } from "react";
import { GraphCanvasView } from "./GraphCanvasView";
import { GraphTreeView } from "./GraphTreeView";
import { usePrefersReducedMotion } from "./graph-visual";

type GraphView = "graph" | "list";

const VIEWS: { id: GraphView; label: string }[] = [
  { id: "graph", label: "GRAPH" },
  { id: "list", label: "LIST" },
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
        className="flex w-fit"
        role="tablist"
        aria-label="Graph view"
        // Tabs keyboard contract: Left/Right move between the two views.
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          const next = view === "graph" ? "list" : "graph";
          setUserChose(true);
          setView(next);
          e.currentTarget.querySelector<HTMLButtonElement>(`[data-tab-id="${next}"]`)?.focus();
        }}
        style={{
          gap: 2,
          marginBottom: 12,
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-control)",
          padding: 2,
        }}
      >
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            tabIndex={view === id ? 0 : -1}
            data-tab-id={id}
            onClick={() => {
              setUserChose(true);
              setView(id);
            }}
            className={
              view === id
                ? "loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                : "loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] hover:[background-color:var(--hover)]"
            }
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              padding: "4px 12px",
              borderRadius: 6,
              background: view === id ? "var(--raised)" : "transparent",
              color: view === id ? "var(--text-primary)" : "var(--text-subtle)",
              border: "none",
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
    </div>
  );
}
