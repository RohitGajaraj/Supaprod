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
 * Node language, kept from the v4 assignment: signal blossom, theme
 * violet-soft, spec pearl, mission cornflower, meeting rose, task slate,
 * opportunity teal, roadmap cobalt, design memory mauve. Blue harmony (founder
 * ruling A, 2026-07-11): only glacier reads as "the blue"; --cornflower and
 * --cobalt were retuned in styles.css into the same hue 215 family but stepped
 * apart in lightness so mission/roadmap stay distinguishable without competing
 * with glacier. Fallbacks mirror the retuned token values verbatim.
 *
 * Meridian port, 2026-08-25: `decision` wore the ember accent and now wears its
 * Meridian successor --mrd-you. The rest of the row is a CATEGORICAL palette
 * (DESIGN-SYSTEM.md: --mrd-viz-* and the status five are the only sanctioned
 * hues, and neither can give sixteen node kinds a distinguishable ramp), so its
 * tokens stay until Meridian grows the stops; their hex fallbacks carry the
 * paint wherever the old scope does not reach.
 */
export const KIND_VISUAL: Record<string, KindVisual> = {
  decision: { token: "--mrd-you", fallback: "#ffa477", label: "Decision" },
  signal: { token: "--blossom", fallback: "#e5bddf", label: "Finding" },
  theme: { token: "--violet-soft", fallback: "#a67fc9", label: "Theme" },
  opportunity: { token: "--teal", fallback: "#2e9e8f", label: "Opportunity" },
  prd: { token: "--pearl", fallback: "#edeae4", label: "Spec" },
  roadmap_item: { token: "--cobalt", fallback: "#2f5d9e", label: "Roadmap" },
  task: { token: "--slate", fallback: "#6e6a64", label: "Task" },
  meeting: { token: "--rose", fallback: "#e89ab0", label: "Meeting" },
  mission: { token: "--cornflower", fallback: "#5c88c9", label: "Mission" },
  design_memory: { token: "--mauve", fallback: "#b78bc7", label: "Design" },
  /**
   * THE SIX KINDS A LIVE CENSUS FOUND STORED AND UNDECLARED (2026-08-02). Until
   * this pass they resolved through UNKNOWN_VISUAL, which paints ash and labels
   * the node with its raw column value, so 146 recorded outcomes rendered grey
   * and captioned "learning" on a surface whose entire claim is that it remembers
   * how things turned out.
   *
   * THEY TOOK THE LIFECYCLE TOKENS, not new hues. `learning` wearing the LEARN
   * stage colour says something true that an arbitrary colour could not: where
   * in the loop the thing was made.
   *
   * MERIDIAN PORT, 2026-08-25. `changeset` moves first, on the recorded
   * precedent in queue-instruments.tsx: --sp-stage-build became --mrd-agent,
   * azure being a machine working, present tense. The other five stay on their
   * retired stage names for now -- three of them (--sp-stage-ship/-design/-plan)
   * were already deleted from ink.css and resolve empty, so their hex
   * fallbacks carry the paint -- because Meridian has no second stage hue to
   * give them, and pointing five kinds at one status colour would collapse the
   * distinctions the palette exists to keep. That is a gap for --mrd-viz to
   * grow into, not a licence to invent a hue here.
   */
  learning: { token: "--sp-stage-learn", fallback: "#a89f66", label: "Outcome" },
  deployment: { token: "--sp-stage-ship", fallback: "#bd8092", label: "Deploy" },
  changeset: { token: "--mrd-agent", fallback: "#6d97c2", label: "Code change" },
  // "Mockup": one static screen, no script. See ArtifactsView for the full note.
  prototype: { token: "--sp-stage-design", fallback: "#ab7fa0", label: "Mockup" },
  // Both are parts OF a spec rather than things of their own, so they share the
  // plan stage and are told apart by their label, not by a hue nobody can name.
  prd_scaffold: { token: "--sp-stage-plan", fallback: "#8fa464", label: "Spec scaffold" },
  prd_flow: { token: "--sp-stage-plan", fallback: "#8fa464", label: "Spec flow" },
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
 *
 * `SIG` STAYS, AND THIS IS NOT AN OVERSIGHT ABOUT §12. Raised by S1 on
 * 2026-08-27: §12 bans "signals" and "SIG" reads as short for it. The LABEL was
 * the drift and is fixed above -- these nodes say "Finding" now. This is not a
 * label. It is the first half of an identifier, rendered as `SIG-a3f2` beside
 * the label, and `artifact-words.ts` states the rule it follows in as many
 * words: *"Display word only; the stored `artifact_kind` is still `signal`."* A
 * trace ref is minted off the STORED kind, and the prefix is registered across
 * loops, so renaming it here would make the ref disagree both with the record it
 * points at and with whatever else mints the same one. `prd` is the same shape
 * and the same answer: the label reads "Spec" and the ref is still PRD.
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
  // Declared rather than derived, because the derivation collides: the fallback
  // strips non-letters and takes three, so `prd_scaffold` and `prd_flow` would
  // both trace as "PRD" and be indistinguishable from an actual spec.
  learning: "LRN",
  deployment: "DEP",
  changeset: "CHG",
  prototype: "PRO",
  prd_scaffold: "SCF",
  prd_flow: "FLW",
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

/* ------------------------------------------------------------------ *
 * Relation legibility: a stroke language, NOT a second palette.
 * ------------------------------------------------------------------ */

/**
 * WHY LINE STYLE AND NOT COLOUR. Thirteen relation families over ten node kinds
 * would be twenty-three hues on one canvas, which spends the restraint budget
 * several times over and fails the greyscale test outright (DESIGN-TEMPO section
 * 11: chromatic colour only with meaning, grayscale test before shipping). Colour
 * already carries WHAT a node is; the thread carries WHY two nodes are joined,
 * and a dash pattern reads at any zoom, in either theme, and in greyscale.
 *
 * FOUR GROUPS, not thirteen patterns, because a legend with thirteen dash
 * patterns is a legend nobody reads. The grouping is the honest one: a reader
 * asking "why is this here" is asking which of four things the link claims.
 */
export type RelationGroup = "flow" | "evidence" | "outcome" | "revision";

export const RELATION_GROUP_LABEL: Record<RelationGroup, string> = {
  flow: "How the work moved",
  evidence: "What backs it",
  outcome: "What actually happened",
  revision: "What stopped being true",
};

/** Canvas dash arrays, in world units. Empty is solid. */
export const RELATION_GROUP_DASH: Record<RelationGroup, number[]> = {
  flow: [],
  evidence: [1.5, 3],
  outcome: [5, 3],
  revision: [9, 4],
};

const RELATION_GROUP_BY_FAMILY: Record<string, RelationGroup> = {
  promoted: "flow",
  "derived-from": "flow",
  dispatched: "flow",
  "depends-on": "flow",
  cites: "evidence",
  "grounded-in": "evidence",
  informs: "evidence",
  "relates-to": "evidence",
  validates: "outcome",
  measures: "outcome",
  supersedes: "revision",
  contradicts: "revision",
  kills: "revision",
};

/** Anything undeclared reads as plain flow rather than inventing a fifth group. */
export function relationGroup(family: string): RelationGroup {
  return RELATION_GROUP_BY_FAMILY[family] ?? "flow";
}

export function relationDash(family: string): number[] {
  return RELATION_GROUP_DASH[relationGroup(family)];
}

/**
 * How hard a revision thread is drawn, from the supersession engine's own
 * confidence.
 *
 * A STRONG CLAIM AND A WEAK ONE MUST NOT LOOK IDENTICAL, which they did: every
 * revision edge got the same 1.5px madder dash whether the engine scored it 0.95
 * or 0.4. But an UNSCORED edge is not a weak one, it is an unmeasured one, so it
 * sits at the middle weight rather than being faded: fading it would render "we
 * did not score this" as "we do not believe this", and the whole surface turns on
 * refusing to assert what it did not check.
 */
export function edgeWeight(confidence: number | null | undefined): number {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return 1;
  const c = Math.max(0, Math.min(1, confidence));
  return 0.7 + c * 0.8;
}

/* ------------------------------------------------------------------ *
 * Outcome vocabulary
 * ------------------------------------------------------------------ */

/**
 * The three words the record uses about a bet, in the reader's language rather
 * than the column's. "missed" is a status value; "did not pay off" is what a PM
 * would actually say to another PM, which is the standing voice rule.
 */
export const OUTCOME_LABEL: Record<string, string> = {
  validated: "Paid off",
  missed: "Did not pay off",
  mixed: "Came back mixed",
};

/** The Value tone for a verdict. Green and red carry outcomes, and only outcomes. */
export const OUTCOME_TONE: Record<string, "pass" | "fail" | "warn"> = {
  validated: "pass",
  missed: "fail",
  mixed: "warn",
};

export function outcomeLabel(verdict: string | null | undefined): string | null {
  return verdict ? (OUTCOME_LABEL[verdict] ?? null) : null;
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
