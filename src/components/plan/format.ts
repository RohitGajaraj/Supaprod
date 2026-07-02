// Plan · OBS-07: pure formatting helpers, no server calls (OBS-07.md step 1).

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

/** Upcase a user-authored measure for the mono line; never rewrite the words, just the case. */
export function measureCaps(measure: string | null): string | null {
  if (!measure || measure.trim().length === 0) return null;
  return measure.toUpperCase();
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
