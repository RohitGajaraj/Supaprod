// Plan · OBS-07: pure formatting helpers, no server calls (OBS-07.md step 1).

/**
 * Strip the machine "[auto]" prefix from a title at render. Auto-triggered
 * missions/decisions carry this prefix for dedup; it must never reach the
 * user. Call this on ANY title that may have come from the trigger pipeline.
 * Idempotent and cheap (regex test + replace).
 */
export function stripAutoPrefix(title: string): string {
  return title.replace(/^\[auto\]\s*/i, "").trim();
}

export type SpecStateTone = "moss" | "marigold" | "glacier";

export interface SpecStateChip {
  label: string;
  tone: SpecStateTone;
}

/** prds.status ("draft" | "review" | "approved" | "shipped") -> the Plan spec-row chip. */
export function stateChip(status: string): SpecStateChip {
  if (status === "approved" || status === "shipped") {
    return { label: status === "shipped" ? "SHIPPED" : "APPROVED", tone: "moss" };
  }
  if (status === "review") return { label: "CRITIC REVIEW", tone: "marigold" };
  return { label: "DRAFTING", tone: "glacier" };
}

/** `citations` -> "N SOURCES" (singular "1 SOURCE"), null when zero/absent. */
export function citesLabel(citations: unknown): string | null {
  if (!Array.isArray(citations) || citations.length === 0) return null;
  return citations.length === 1 ? "1 SOURCE" : `${citations.length} SOURCES`;
}

/**
 * Dim 17 recommendation band: the system's plain-language read on what to do
 * next with a spec, keyed by its lifecycle (prds.status). Outcome-first voice,
 * never the mechanism. Any unrecognized status falls back to the draft guidance.
 */
export function specRecommendation(status: string): string {
  if (status === "shipped") return "Shipped. Watch the outcome and let Learn close the loop.";
  if (status === "approved") return "Hand it to Build to start a mission from this spec.";
  if (status === "review")
    return "Approve to log the decision and unblock Build, or send it back to draft.";
  return "Refine the spec, then send it to the Critic for review.";
}

/** Upcase a user-authored measure for the mono line; never rewrite the words, just the case. */
export function measureCaps(measure: string | null): string | null {
  if (!measure || measure.trim().length === 0) return null;
  return measure.toUpperCase();
}

/**
 * LOOM QA R2: display label for a decision in a picker. Stored titles can
 * carry the machine "[auto]" prefix and can already be long; strip the prefix
 * at render and, when trimming, cut on a word boundary (never mid-word) with
 * an ellipsis. Callers keep the untouched title in a `title=` attribute.
 */
export function decisionOptionLabel(title: string, max = 96): string {
  const t = stripAutoPrefix(title);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
}

export type BodySegment = { type: "text"; value: string } | { type: "citation"; index: number };

/**
 * Split prose on inline `[n]` citation markers into text/citation segments, so a
 * renderer can replace each marker with a real `Citation` chip without touching
 * anything else in the string (code fences, other bracket text) — this only runs
 * over already-parsed markdown text nodes, never raw markdown source.
 */
export function splitCitationMarkers(text: string): BodySegment[] {
  const segments: BodySegment[] = [];
  const pattern = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "citation", index: Number(match[1]) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: "text", value: text.slice(lastIndex) });
  return segments;
}
