// RPT-28: the memory write review gate — pure, side-effect-free helpers behind
// the MemoryReviewQueue surface. Kept out of memory-candidates.functions.ts
// (which carries server-only auth middleware) so they stay client-safe AND
// unit-testable in isolation. Mirrors memory-view.ts / design-memory-shared.ts.
//
// Voice: nothing lands in the brain without your call. A candidate is a
// PROPOSAL; the human approves or rejects it. Labels stay plain and honest.

/** Where a candidate came from. 'user' = the "save this to the brain"
 *  affordance; 'agent' = a reflection an agent proposed; 'outcome' = a
 *  distilled run outcome. */
export type MemoryCandidateSource = "user" | "agent" | "outcome";
export type MemoryCandidateStatus = "pending" | "approved" | "rejected";

/** VerdictChip tones (obsidian/verdict) a status maps to. Declared as the
 *  literal union so the component can pass it straight to VerdictChip without
 *  this file importing a component. */
export type MemoryCandidateStatusTone = "PENDING" | "KEPT" | "KILL";

const SOURCE_LABELS: Record<MemoryCandidateSource, string> = {
  user: "You saved this",
  agent: "Agent proposed",
  outcome: "Distilled outcome",
};

/** A short, honest label for where a candidate came from. Unknown sources
 *  fall back to a plain word rather than an empty string. */
export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source as MemoryCandidateSource] ?? "Proposed";
}

const SOURCE_BLURBS: Record<MemoryCandidateSource, string> = {
  user: "You typed this in to save it to the brain.",
  agent: "An agent drew this from one of its runs and proposed saving it.",
  outcome: "The loop distilled this from a shipped outcome and proposed saving it.",
};

/** One line on what a source means. Empty string for unknown sources so the UI
 *  omits the line rather than inventing a description. */
export function sourceBlurb(source: string): string {
  return SOURCE_BLURBS[source as MemoryCandidateSource] ?? "";
}

/** VerdictChip tone for a candidate's review status. Pending is the hairline
 *  (no hue) chip; approved reads KEPT (moss), rejected reads KILL (madder). */
export function statusTone(status: MemoryCandidateStatus): MemoryCandidateStatusTone {
  if (status === "approved") return "KEPT";
  if (status === "rejected") return "KILL";
  return "PENDING";
}

const STATUS_LABELS: Record<MemoryCandidateStatus, string> = {
  pending: "Awaiting your review",
  approved: "Approved",
  rejected: "Rejected",
};

/** A human label for a candidate's status. */
export function statusLabel(status: MemoryCandidateStatus): string {
  return STATUS_LABELS[status] ?? "Pending";
}

/** Collapse an existing memory's content to a single-line preview for the
 *  "supersedes: ..." indicator: whitespace normalized, trimmed, and capped
 *  with an ellipsis so a long memory never blows out the row. Returns "" for
 *  empty/blank input so the caller can omit the indicator. */
export function supersedesPreview(content: string | null | undefined, max = 90): string {
  if (!content) return "";
  const flat = content.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

/** Whether an approve on this candidate would retire an existing memory. Pure
 *  read over the prefilled conflict link, used to decide if the row shows the
 *  supersede indicator. */
export function willSupersede(supersedesMemoryId: string | null | undefined): boolean {
  return typeof supersedesMemoryId === "string" && supersedesMemoryId.length > 0;
}
