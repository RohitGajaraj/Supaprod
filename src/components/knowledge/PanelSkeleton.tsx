// Loom W2-BRAIN — the shared tab-panel loading state. DESIGN-LOOM section 9:
// loading is a shimmer skeleton that matches the loaded layout, never a
// spinner or a text placeholder for primary content. Rows approximate the
// list-of-cards shape every Brain tab resolves into.
export function PanelSkeleton({ rows = [64, 120, 120] }: { rows?: number[] }) {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((h, i) => (
        <div
          key={i}
          style={{
            width: i === rows.length - 1 ? "70%" : "100%",
            height: h,
            borderRadius: "var(--radius-card)",
            background:
              "linear-gradient(90deg, var(--raised), var(--hover), var(--raised)) 0 0 / 280% 100%",
            animation: "cadShimmer 1.6s linear infinite",
          }}
        />
      ))}
    </div>
  );
}
