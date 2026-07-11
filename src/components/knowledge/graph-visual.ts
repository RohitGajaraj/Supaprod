// W3 - the graph's shared visual vocabulary. One place maps a node kind to
// its role color (DESIGN-TEMPO.md section 2: data-viz is the sanctioned
// multi-hue exception) so the canvas renderer, the legend, and the story
// panel can never drift apart. Colors are token references first (the
// tokens-only law); each carries a literal fallback so the Canvas2D
// renderer, which needs concrete color strings, can resolve them through
// getComputedStyle and still paint if a token is ever missing.
import { useEffect, useState } from "react";
import type { GraphNode } from "@/lib/knowledge-graph-view";

export type KindVisual = { token: string; fallback: string; label: string };

/**
 * Node language, kept from the v4 assignment: decision ember-soft, signal
 * blossom, theme violet-soft, spec pearl, mission cornflower, meeting rose,
 * task slate, opportunity teal, roadmap cobalt, design memory mauve.
 * Blue harmony (founder ruling A, 2026-07-11): only glacier reads as "the
 * blue"; --cornflower and --cobalt were retuned in styles.css into the same
 * hue 215 family but stepped apart in lightness so mission/roadmap stay
 * distinguishable without competing with glacier. Fallbacks mirror the
 * retuned token values verbatim.
 */
export const KIND_VISUAL: Record<string, KindVisual> = {
  decision: { token: "--ember-soft", fallback: "#ffa477", label: "Decision" },
  signal: { token: "--blossom", fallback: "#e5bddf", label: "Signal" },
  theme: { token: "--violet-soft", fallback: "#a67fc9", label: "Theme" },
  opportunity: { token: "--teal", fallback: "#2e9e8f", label: "Opportunity" },
  prd: { token: "--pearl", fallback: "#edeae4", label: "Spec" },
  roadmap_item: { token: "--cobalt", fallback: "#2f5d9e", label: "Roadmap" },
  task: { token: "--slate", fallback: "#6e6a64", label: "Task" },
  meeting: { token: "--rose", fallback: "#e89ab0", label: "Meeting" },
  mission: { token: "--cornflower", fallback: "#5c88c9", label: "Mission" },
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
 * dim 17 trace-ref prefix for a graph node kind. The shared object types use
 * their registered prefix (DESIGN-LOOM dim 17 registry / design-anatomy §4):
 * signal SIG, theme THM, opportunity OPP, prd PRD, mission MIS, decision DEC.
 * The graph-only kinds (meeting, roadmap item, task, design memory) carry a
 * local 3-letter code so every node still traces cleanly; they are not part of
 * the shared cross-loop registry. Paired with the shared traceRef(id) helper.
 */
const KIND_TRACE_PREFIX: Record<string, string> = {
  signal: "SIG",
  theme: "THM",
  opportunity: "OPP",
  prd: "PRD",
  mission: "MIS",
  decision: "DEC",
  meeting: "MTG",
  roadmap_item: "RDM",
  task: "TSK",
  design_memory: "DSG",
};

export function kindTracePrefix(kind: string): string {
  return (
    KIND_TRACE_PREFIX[kind] ||
    kind
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 3)
      .toUpperCase() ||
    "REF"
  );
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
 * Compute whether motion should be reduced based on OS preference and
 * in-product toggle. Pure function extracted for testability.
 */
export function computeReducedMotion(
  mediaQueryMatches: boolean,
  motionDataset: string | undefined,
): boolean {
  return mediaQueryMatches || motionDataset === "off";
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
      setReduced(computeReducedMotion(mq.matches, document.documentElement.dataset.motion));
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
