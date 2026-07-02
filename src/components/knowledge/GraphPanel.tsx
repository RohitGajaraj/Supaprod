// O1 - the Graph tab shell. A view toggle over two complementary explorers of the
// same artifact_lineage: "Graph" = the visual canvas (DBR-1 v1 / B+), "List" = the
// indented downstream lineage tree. Both honor the same route focus, so "Center the
// graph here" in the canvas feeds the tree (founder ruling 2026-06-20: keep both).
//
// OBS-08: the toggle is ported to Obsidian — mono-caps text, no icon set
// (iconography law). GraphCanvasView / GraphTreeView data logic is UNCHANGED.
import { useState } from "react";
import { GraphCanvasView } from "./GraphCanvasView";
import { GraphTreeView } from "./GraphTreeView";

type GraphView = "graph" | "list";

const VIEWS: { id: GraphView; label: string }[] = [
  { id: "graph", label: "GRAPH" },
  { id: "list", label: "LIST" },
];

export function GraphPanel({ focusKind, focusId }: { focusKind?: string; focusId?: string }) {
  const [view, setView] = useState<GraphView>("graph");
  return (
    <div>
      <div
        className="flex w-fit"
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
            onClick={() => setView(id)}
            className={
              view === id
                ? "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                : "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)] hover:[background-color:var(--hover)]"
            }
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
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
        <GraphCanvasView focusKind={focusKind} focusId={focusId} />
      ) : (
        <GraphTreeView focusKind={focusKind} focusId={focusId} />
      )}
    </div>
  );
}
