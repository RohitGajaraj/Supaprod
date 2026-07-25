import type { ReactNode } from "react";

// OBS-02 — the shared Obsidian surface container. Every ported surface
// (OBS-04..09) mounts its content inside this wrapper instead of rewriting
// the max-width/padding/entrance rules itself. `wide` widens the container
// to 1160px for Discover and Plan (§7 of the OBS-02 spec); everything else
// uses the default 1060px.
export function Surface({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div
      style={{
        maxWidth: wide ? 1160 : 1060,
        margin: "0 auto",
        padding: "var(--page-inset-v) var(--page-inset-h) 64px",
        animation: "cadRise 260ms var(--ease) both",
      }}
    >
      {children}
    </div>
  );
}
