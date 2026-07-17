// ShimmerText: the ONE shared marker for AI presence/working states
// (founder ruling B, 2026-07-11; DESIGN-TEMPO.md section 9 AI patterns).
// A text-clip span riding the consolidated glacier --shimmer-gradient via
// the .agent-live class in styles.css, so the reduced-motion gates (OS
// preference + the in-product data-motion toggle) and any recoloring live
// in the token layer, never per surface. Generalizes the ShimmerStatus
// pattern from obsidian/AskPanel.tsx.
//
// Yield rule: at most ONE shimmer per screen; a surface adopting this must
// yield to an already-shimmering element (the convention documented at
// supaprod/AppShell.tsx, OBS-12).
import * as React from "react";

export function ShimmerText({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className ? `agent-live ${className}` : "agent-live"} style={style}>
      {children}
    </span>
  );
}
