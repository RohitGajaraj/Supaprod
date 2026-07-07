/**
 * Mission 3.8b (SW-3 remainder): the compounding pass, pure half.
 *
 * Memory gets smarter, not just bigger: when the same shape of learning keeps
 * repeating, the system proposes a standing playbook instead of letting the
 * pattern sit unread in the learnings table. This module is fully
 * deterministic and IO-free: it groups learnings by (verdict + the dominant
 * signal of their linked opportunity/spec) and shapes a proposal from each
 * group of MIN_GROUP_SIZE or more. The signal is a cheap existing key, never
 * fuzzy AI: the linked opportunity's theme_id when it has one, else an exact
 * normalized title-stem match on the opportunity (or, failing that, the spec)
 * title. Learnings with no usable signal simply never group; conservative by
 * construction.
 *
 * The sweep that reads the database and writes playbook_proposals rows lives
 * in learning-compound.server.ts. Proposals quote the learnings' own
 * summaries verbatim and never invent content; a human confirms or dismisses
 * each one (playbooks.functions.ts), nothing is auto-confirmed.
 */

/** Same closed vocabulary as learnings.verdict (CHECK constraint). */
export type CompoundVerdict = "validated" | "missed" | "mixed";

export function asCompoundVerdict(v: unknown): CompoundVerdict | null {
  return v === "validated" || v === "missed" || v === "mixed" ? v : null;
}

/** A learnings row plus the cheap signal fields the server pass joins in. */
export type CompoundLearning = {
  id: string;
  workspace_id: string;
  verdict: string;
  summary: string;
  /** theme_id of the linked opportunity, when there is one. */
  theme_id?: string | null;
  /** Title of the linked theme, for honest labeling only (never the key). */
  theme_title?: string | null;
  /** Title of the linked opportunity, the first stem fallback. */
  opportunity_title?: string | null;
  /** Title of the linked spec (prds.title), the last stem fallback. */
  prd_title?: string | null;
};

/** A group must repeat at least this many times before a proposal is shaped. */
export const MIN_GROUP_SIZE = 3;

/** Title stems compare the first STEM_WORDS normalized words... */
const STEM_WORDS = 4;
/** ...and a title shorter than this many words is too weak to trust as a key. */
const STEM_MIN_WORDS = 3;

/**
 * Conservative title stem: lowercase, strip punctuation, collapse whitespace,
 * keep the first STEM_WORDS words. Titles with fewer than STEM_MIN_WORDS
 * significant words return null (too generic to group on). Exact string
 * equality of stems is the only match; nothing fuzzy.
 */
export function titleStem(title: string | null | undefined): string | null {
  if (typeof title !== "string") return null;
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < STEM_MIN_WORDS) return null;
  return words.slice(0, STEM_WORDS).join(" ");
}

export type CompoundSignal = { key: string; label: string };

/**
 * The dominant signal of a learning's linked opportunity/spec, precedence:
 * the opportunity's theme link (the cheapest, strongest existing key), else
 * an exact opportunity-title stem, else an exact spec-title stem. Null when
 * none is usable; such a learning never groups.
 */
export function signalForLearning(l: CompoundLearning): CompoundSignal | null {
  const themeId = typeof l.theme_id === "string" && l.theme_id ? l.theme_id : null;
  if (themeId) {
    const themeTitle =
      typeof l.theme_title === "string" && l.theme_title.trim() ? l.theme_title.trim() : null;
    return { key: `theme:${themeId}`, label: themeTitle ?? `theme ${themeId}` };
  }
  const stem = titleStem(l.opportunity_title) ?? titleStem(l.prd_title);
  if (stem) return { key: `stem:${stem}`, label: `titles starting "${stem}"` };
  return null;
}

/**
 * The full group key: verdict + dominant signal. Null when the verdict is
 * outside the learnings vocabulary or no signal is derivable.
 */
export function groupKeyForLearning(l: CompoundLearning): string | null {
  const verdict = asCompoundVerdict(l.verdict);
  const signal = signalForLearning(l);
  if (!verdict || !signal) return null;
  return `${verdict}|${signal.key}`;
}

export type CompoundGroup = {
  workspaceId: string;
  groupKey: string;
  verdict: CompoundVerdict;
  signalLabel: string;
  learnings: CompoundLearning[];
};

/**
 * Group same-shaped learnings per workspace. Only groups with at least
 * minGroupSize members survive. Members keep input order; groups are sorted
 * deterministically (largest first, then by key) so the server's per-tick
 * proposal cap always drains the strongest pattern first.
 */
export function groupSameShapedLearnings(
  rows: readonly CompoundLearning[],
  minGroupSize: number = MIN_GROUP_SIZE,
): CompoundGroup[] {
  const buckets = new Map<string, CompoundGroup>();
  for (const l of rows) {
    if (!l || typeof l.id !== "string" || typeof l.workspace_id !== "string") continue;
    if (typeof l.summary !== "string" || !l.summary.trim()) continue;
    const verdict = asCompoundVerdict(l.verdict);
    const signal = signalForLearning(l);
    if (!verdict || !signal) continue;
    const groupKey = `${verdict}|${signal.key}`;
    const bucketKey = `${l.workspace_id}|${groupKey}`;
    const existing = buckets.get(bucketKey);
    if (existing) {
      if (!existing.learnings.some((e) => e.id === l.id)) existing.learnings.push(l);
    } else {
      buckets.set(bucketKey, {
        workspaceId: l.workspace_id,
        groupKey,
        verdict,
        signalLabel: signal.label,
        learnings: [l],
      });
    }
  }
  return [...buckets.values()]
    .filter((g) => g.learnings.length >= minGroupSize)
    .sort(
      (a, b) =>
        b.learnings.length - a.learnings.length ||
        a.workspaceId.localeCompare(b.workspaceId) ||
        a.groupKey.localeCompare(b.groupKey),
    );
}

export const PROPOSAL_TITLE_MAX = 200;
export const PROPOSAL_BODY_MAX = 4000;
/** Quote at most this many summaries in the body; the rest are counted. */
const MAX_QUOTED = 5;
/** Each quoted summary is capped at this length. */
const QUOTE_MAX = 300;

export type PlaybookProposalDraft = {
  workspaceId: string;
  groupKey: string;
  title: string;
  body: string;
  sourceLearningIds: string[];
};

const clip = (s: string, max: number): string =>
  s.length <= max ? s : `${s.slice(0, max - 3).trimEnd()}...`;

/**
 * Shape a proposal from a group. Title and body are derived from the
 * learnings' own summaries and titles, quoted, never invented. The learning
 * ids ride in sourceLearningIds (the provenance field the schema offers).
 */
export function shapeProposal(group: CompoundGroup): PlaybookProposalDraft {
  const n = group.learnings.length;
  const title = clip(
    `Proposed playbook: ${n} ${group.verdict} learnings on ${group.signalLabel}`,
    PROPOSAL_TITLE_MAX,
  );

  const quoted = group.learnings
    .slice(0, MAX_QUOTED)
    .map((l, i) => `${i + 1}. "${clip(l.summary.trim(), QUOTE_MAX)}"`);
  const remainder = n - Math.min(n, MAX_QUOTED);
  const lines = [
    `${n} learnings in this workspace share the same shape: verdict "${group.verdict}", signal ${group.signalLabel}.`,
    "",
    "The learnings, quoted:",
    ...quoted,
  ];
  if (remainder > 0) {
    lines.push(`(${remainder} more with the same shape; see this proposal's source learnings.)`);
  }

  return {
    workspaceId: group.workspaceId,
    groupKey: group.groupKey,
    title,
    body: clip(lines.join("\n"), PROPOSAL_BODY_MAX),
    sourceLearningIds: group.learnings.map((l) => l.id),
  };
}
