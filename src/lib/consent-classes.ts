// RPT-36: consent policies by consequence class. A PURE presentation +
// aggregation layer over the STATIC tool-consequences catalogue (never model
// output, so the claim never outruns the wiring). It partitions an enabled-tool
// list into a small number of consequence classes and states the trust-ladder
// (RPT-17) default posture per class, so a person sets consent once per class
// instead of tool by tool.
//
// The philosophy, founder-worded: auto-run read-only research; ask first on
// reversible workspace writes; draft stakeholder-facing work to you and let you
// release it (auto-send is opt-in, per destination); always gate repo writes and
// anything irreversible. No new data model: the classes are derived from the same
// isSideEffectingTool / isExternalTool / toolRisk primitives the loop already
// enforces with, so the posture shown is the posture that actually holds.
// Client-safe.
import {
  isSideEffectingTool,
  isExternalTool,
  toolRisk,
  type ToolRisk,
} from "@/lib/tool-consequences";

/** The memorable line the panel leads with. Supaprod drafts, the human releases. */
export const CONSENT_PHILOSOPHY =
  "Supaprod drafts. You release. Nothing stakeholder-facing sends itself.";

/** The four consequence classes, floor (safest) to ceiling (widest blast radius). */
export type ConsequenceClassId = "read-only" | "internal-write" | "stakeholder" | "repo-write";

/** The oversight mode a class defaults to. These are the SAME three modes the
 *  per-tool oversight control and the loop's approval gate use, so a class's
 *  default posture is honest: it maps onto real gating, not decoration. */
export type ConsentMode = "auto" | "confirm" | "review";

/** A stable posture id, for keying styling/copy without matching on labels. */
export type ConsentPostureId = "auto-run" | "ask-first" | "draft-to-you" | "always-gate";

export interface ConsentPosture {
  posture: ConsentPostureId;
  /** The real oversight mode this posture defaults to (ties to the trust ladder). */
  mode: ConsentMode;
  /** Short human label, e.g. "Auto-run". */
  label: string;
  /** One-line plain-words rationale for the default. */
  rationale: string;
}

export interface ConsequenceClass {
  id: ConsequenceClassId;
  /** Human class name, e.g. "Read-only research". */
  label: string;
  /** What kind of tool falls in this class. */
  description: string;
  /** The trust-ladder (RPT-17) default consent posture for the whole class. */
  defaultPosture: ConsentPosture;
}

/** A class plus the tools that landed in it (original items preserved). */
export interface ConsentClassGroup<T = string> extends ConsequenceClass {
  tools: T[];
}

// ---------------------------------------------------------------------------
// The class definitions. Order is floor to ceiling and is the render order.
// ---------------------------------------------------------------------------

const CLASSES: Record<ConsequenceClassId, ConsequenceClass> = {
  "read-only": {
    id: "read-only",
    label: "Read-only research",
    description: "Reads, lookups, and research. They change nothing, so there is no blast radius.",
    defaultPosture: {
      posture: "auto-run",
      mode: "auto",
      label: "Auto-run",
      rationale: "Safe to run on its own. Nothing to undo.",
    },
  },
  "internal-write": {
    id: "internal-write",
    label: "Internal writes",
    description:
      "Writes that stay inside your workspace (tasks, notes, lessons, plans). Reversible.",
    defaultPosture: {
      posture: "ask-first",
      mode: "confirm",
      label: "Ask first",
      rationale: "A quick confirm before each run. Reversible if one slips through.",
    },
  },
  stakeholder: {
    id: "stakeholder",
    label: "Stakeholder-facing and external",
    description:
      "Anything that leaves the workspace but is reversible (opening a PR, filing an issue, a calendar hold).",
    defaultPosture: {
      posture: "draft-to-you",
      mode: "confirm",
      label: "Draft to you, batch-approve daily",
      rationale: "Supaprod drafts, you release. Auto-send is opt-in, per destination.",
    },
  },
  "repo-write": {
    id: "repo-write",
    label: "Repo writes and irreversible",
    description: "Commits, merges, and hand-offs you cannot recall. The widest blast radius.",
    defaultPosture: {
      posture: "always-gate",
      mode: "review",
      label: "Always gate",
      rationale: "These never run on their own. You review and release each one.",
    },
  },
};

/** Floor-to-ceiling render order. */
export const CONSEQUENCE_CLASS_ORDER: readonly ConsequenceClassId[] = [
  "read-only",
  "internal-write",
  "stakeholder",
  "repo-write",
] as const;

/**
 * PURE. The consequence class one tool belongs to, derived entirely from the
 * existing static primitives:
 *  - not side-effecting (the registry calls it a read)      => read-only research
 *  - side-effecting but internal to the workspace           => internal write
 *  - external and reversible (medium blast radius)          => stakeholder-facing
 *  - external and high blast radius (irreversible / commit) => repo write
 *
 * Fail-closed: an unknown external tool scores high blast radius (toolRisk), so it
 * lands in repo-write (always gate) rather than a looser class.
 *
 * ── THE FIRST LINE ONLY STARTED BEING TRUE ON 2026-08-22 ─────────────────
 * It used to read "not in the consequence catalogue", which is what
 * `isSideEffectingTool` tested, and the catalogue was completed to all 59 registry
 * tools on 2026-08-19. From then until the predicate was fixed this function could
 * not return `read-only` at all: the registry scored 0 read-only, 47
 * internal-write, 5 stakeholder, 7 repo-write, so the first bucket
 * `CONSEQUENCE_CLASS_ORDER` renders stood empty on every surface and a
 * `web.search` sat in the same class as a `decision.record`. The predicate now
 * answers from the registry's `category`, so all 20 reads land here again.
 *
 * The fail-closed line above also stopped being aspirational in the same change:
 * an unrecognised name is no longer read as "not side-effecting", so it can no
 * longer fall through to the one class that never gates.
 */
export function classifyConsequence(toolName: string | null | undefined): ConsequenceClassId {
  if (!isSideEffectingTool(toolName)) return "read-only";
  if (!isExternalTool(toolName)) return "internal-write";
  const risk: ToolRisk = toolRisk(toolName);
  return risk === "high" ? "repo-write" : "stakeholder";
}

/** PURE. The class metadata for a class id. */
export function consequenceClass(id: ConsequenceClassId): ConsequenceClass {
  return CLASSES[id];
}

/**
 * PURE. Partition an enabled-tool list into the consequence classes, in render
 * order. Every class is always present (empty `tools` when none match) so a
 * caller can show the full policy or filter to the non-empty ones. Input order is
 * preserved within each class; the original items are kept so the caller can
 * still render display names.
 */
export function groupToolsByConsequenceClass<T>(
  tools: readonly T[],
  getName: (tool: T) => string | null | undefined,
): ConsentClassGroup<T>[] {
  const buckets: Record<ConsequenceClassId, T[]> = {
    "read-only": [],
    "internal-write": [],
    stakeholder: [],
    "repo-write": [],
  };
  for (const tool of tools ?? []) {
    buckets[classifyConsequence(getName(tool))].push(tool);
  }
  return CONSEQUENCE_CLASS_ORDER.map((id) => ({ ...CLASSES[id], tools: buckets[id] }));
}
