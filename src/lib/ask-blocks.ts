// PC-36 workstream C - the typed answer-block vocabulary ("weather cards").
// The PURE half, shared by the server resolver (ask-blocks.server.ts), the
// SSE parser (ask-sse.ts), and the panel cards (ask-blocks.tsx). Spec:
// launch-sprint-specs.md §PC-36 C - internal answers render entity cards
// ABOVE prose, one block vocabulary reused across surfaces, never a wall of
// prose. Blocks are resolved deterministically from retrieval refs + intent
// regexes; no model call decides a block, so the vocabulary stays honest.

export type TimelineEvent = {
  /** ISO timestamp of the event. */
  at: string;
  label: string;
  detail: string | null;
  /** Audit ref (e.g. "DEC·A1B2C3") when the event maps to a ledger entity. */
  ref: string | null;
};

export type AnswerBlock =
  | {
      kind: "decision";
      id: string;
      title: string;
      status: string;
      rationale: string | null;
      decidedBy: string | null;
      sourceKind: string | null;
      createdAt: string;
    }
  | {
      kind: "opportunity";
      id: string;
      title: string;
      status: string | null;
      iceScore: number | null;
    }
  | {
      kind: "mission";
      id: string;
      title: string;
      status: string;
      goal: string | null;
      createdAt: string;
    }
  | {
      kind: "status";
      scopeLabel: string;
      counts: { running: number; waiting: number; done: number; failed: number };
      running: Array<{ id: string; title: string; status: string }>;
    }
  | {
      kind: "timeline";
      label: string;
      events: TimelineEvent[];
    };

export const ANSWER_BLOCK_KINDS = new Set([
  "decision",
  "opportunity",
  "mission",
  "status",
  "timeline",
]);

/** Minimal structural check for a block arriving over the wire. */
export function isAnswerBlock(v: unknown): v is AnswerBlock {
  if (!v || typeof v !== "object") return false;
  const kind = (v as { kind?: unknown }).kind;
  return typeof kind === "string" && ANSWER_BLOCK_KINDS.has(kind);
}

// Temporal recall is first-class (spec): "what happened", "last week",
// "since", "recently", "changed", "history", "timeline". Word-boundary
// matches so "positioned" never trips "since"-class tokens.
const TEMPORAL_RE =
  /\b(what happened|what changed|last (?:week|month|[0-9]+ (?:days?|weeks?|months?))|past (?:week|month|[0-9]+ (?:days?|weeks?|months?))|recently|history|timeline|this week|this month|since (?:yesterday|last|the))\b/i;

export function isTemporalQuestion(q: string): boolean {
  return TEMPORAL_RE.test(q);
}

/**
 * The recall window in days for a temporal question. Named ranges parse
 * ("last 3 weeks" -> 21); bare temporal phrasing defaults to 14 days.
 */
export function temporalWindowDays(q: string): number {
  const m = q.match(/\b(?:last|past)\s+([0-9]+)\s+(days?|weeks?|months?)\b/i);
  if (m) {
    const n = Math.max(1, Math.min(90, parseInt(m[1], 10)));
    const unit = m[2].toLowerCase();
    if (unit.startsWith("day")) return n;
    if (unit.startsWith("week")) return Math.min(90, n * 7);
    return Math.min(90, n * 30);
  }
  if (/\b(?:last|past|this)\s+month\b/i.test(q)) return 30;
  if (/\b(?:last|past|this)\s+week\b/i.test(q)) return 7;
  return 14;
}

// Status digest intent: "status", "where are we", "state of", "how is ...
// going". Deliberately narrow - a false positive costs a wasted card slot.
const STATUS_RE =
  /\b(status|where (?:are we|do we stand)|state of|how(?:'s| is) (?:the |it |everything )?(?:\w+ ){0,3}going|what(?:'s| is) (?:running|in flight))\b/i;

export function isStatusQuestion(q: string): boolean {
  return STATUS_RE.test(q);
}

/**
 * Cap and order blocks for a 420px panel: entity cards (max 3) first,
 * then at most one timeline, then at most one status digest.
 */
export function capBlocks(blocks: AnswerBlock[]): AnswerBlock[] {
  const cards = blocks
    .filter((b) => b.kind === "decision" || b.kind === "opportunity" || b.kind === "mission")
    .slice(0, 3);
  const timeline = blocks.find((b) => b.kind === "timeline");
  const status = blocks.find((b) => b.kind === "status");
  return [...cards, ...(timeline ? [timeline] : []), ...(status ? [status] : [])];
}
