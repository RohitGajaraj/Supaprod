// W3 (Loom) - the graph's shared visual vocabulary. One place maps a node
// kind to its v4 role color (DESIGN-LOOM section 7) so the canvas renderer,
// the legend, and the story panel can never drift apart. Colors are token
// references first (the tokens-only law); each carries a literal fallback so
// the Canvas2D renderer, which needs concrete color strings, can resolve them
// through getComputedStyle and still paint if a token is ever missing.
import { useEffect, useState } from "react";
import type { GraphNode } from "@/lib/knowledge-graph-view";

export type KindVisual = { token: string; fallback: string; label: string };

/**
 * DESIGN-LOOM section 7 node language. Kinds the contract names verbatim:
 * decision ember-soft, learning glacier, signal blossom, theme violet-soft,
 * spec pearl, mission cornflower, meeting rose, task slate. Kinds the graph
 * carries that the contract does not name are assigned from the working data
 * palette (families never moonlight): opportunity teal, roadmap cobalt,
 * design memory mauve.
 */
export const KIND_VISUAL: Record<string, KindVisual> = {
  decision: { token: "--ember-soft", fallback: "#ffa477", label: "Decision" },
  signal: { token: "--blossom", fallback: "#e5bddf", label: "Signal" },
  theme: { token: "--violet-soft", fallback: "#a67fc9", label: "Theme" },
  opportunity: { token: "--teal", fallback: "#2e9e8f", label: "Opportunity" },
  prd: { token: "--pearl", fallback: "#edeae4", label: "Spec" },
  roadmap_item: { token: "--cobalt", fallback: "#3b5bdb", label: "Roadmap" },
  task: { token: "--slate", fallback: "#6e6a64", label: "Task" },
  meeting: { token: "--rose", fallback: "#e89ab0", label: "Meeting" },
  mission: { token: "--cornflower", fallback: "#6b8afd", label: "Mission" },
  design_memory: { token: "--mauve", fallback: "#b78bc7", label: "Design" },
};

const UNKNOWN_VISUAL: KindVisual = { token: "--ash", fallback: "#a8a29a", label: "" };

export function kindVisual(kind: string): KindVisual {
  return KIND_VISUAL[kind] ?? { ...UNKNOWN_VISUAL, label: kind };
}

/** CSS color for DOM elements (legend dots, story chips): token with fallback. */
export function kindCssColor(kind: string): string {
  const v = kindVisual(kind);
  return `var(${v.token}, ${v.fallback})`;
}

export function kindLabel(kind: string): string {
  return kindVisual(kind).label || kind;
}

/**
 * Resolve every kind's CONCRETE color for the Canvas2D renderer, reading the
 * live token values off a mounted element so the canvas always matches the
 * DOM. Falls back to the literal when a token resolves empty.
 */
export function resolveKindColors(el: HTMLElement): Map<string, string> {
  const styles = typeof window !== "undefined" ? window.getComputedStyle(el) : null;
  const out = new Map<string, string>();
  for (const [kind, v] of Object.entries(KIND_VISUAL)) {
    const resolved = styles?.getPropertyValue(v.token).trim();
    out.set(kind, resolved || v.fallback);
  }
  out.set(
    "__unknown",
    styles?.getPropertyValue(UNKNOWN_VISUAL.token).trim() || UNKNOWN_VISUAL.fallback,
  );
  return out;
}

/** Size = influence (degree in the shown subgraph), gently capped. */
export function nodeRadius(n: Pick<GraphNode, "influence">, isFocus: boolean): number {
  const base = 7 + Math.min(n.influence, 8) * 1.4;
  return isFocus ? base + 3 : base;
}

export function truncateTitle(s: string, max = 26): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Motion is off when the OS asks for reduced motion OR the in-product toggle
 * (html[data-motion="off"]) is set. Watches both live, so flipping the toggle
 * switches the graph without a reload. SSR-safe (false until mounted).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compute = () =>
      setReduced(mq.matches || document.documentElement.dataset.motion === "off");
    compute();
    mq.addEventListener("change", compute);
    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    return () => {
      mq.removeEventListener("change", compute);
      observer.disconnect();
    };
  }, []);
  return reduced;
}
