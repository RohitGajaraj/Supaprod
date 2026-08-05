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

/**
 * The same strip, for a value that may be null or undefined.
 *
 * WHY THIS EXISTS. An audit on 2026-08-05 found roughly thirty surfaces
 * rendering a raw title, against twenty-three that stripped correctly, and the
 * telling part was WHERE they sat: `today.tsx` strips on lines 347 and 351 and
 * leaks on 460. `DecisionDetail.tsx` strips on 286 and leaks on 409.
 * `RunBoard.tsx` strips the visible lead on 523 and leaks into the tooltip and
 * the accessible name on 528. The strip and the leak are neighbours, written by
 * the same hand in the same pass.
 *
 * So the problem was never carelessness, it was that the call was optional and
 * the nullable case made it awkward: `t ? stripAutoPrefix(t) : t` at every site
 * is exactly the kind of noise people drop. This overload removes the excuse.
 *
 * The real fix is that the marker is leaving the data entirely (migration
 * 20260805120000 moves provenance to `decisions.auto_origin` and
 * `missions.auto_trigger_source`). This helper stays afterwards as the belt to
 * that migration's braces: rows written before it, and any future writer that
 * reintroduces a prefix, still cannot reach a human.
 */
export function cleanTitle<T extends string | null | undefined>(title: T): T {
  return (typeof title === "string" ? stripAutoPrefix(title) : title) as T;
}

/**
 * Whether a stored title carries the machine "[auto]" origin prefix. Pairs with
 * `stripAutoPrefix`: strip the prefix for the visible text, then use this to
 * decide whether to show a small "Auto" provenance chip, so a user or an agent
 * can tell the item was raised by the loop itself, without the raw prefix ever
 * leaking into the copy.
 */
export function isAutoTitle(title: string | null | undefined): boolean {
  return /^\[auto\]\s*/i.test(title ?? "");
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
