// SW-3 mission 3.2 (the decision card proves its judgment loop): the pure
// assembly + citation-planning logic behind getDecisionJudgment, DB-free so
// `bun test` covers it. The server glue lives in decision-judgment.functions.ts.

export type JudgmentVerdict = "validated" | "missed" | "mixed";

export type JudgmentPrecedent = {
  /** agent_memory id of the recalled outcome row. */
  memoryId: string;
  title: string | null;
  verdict: JudgmentVerdict;
  summary: string;
  score: number;
  prdId: string | null;
  opportunityId: string | null;
};

/** Max precedents rendered on the decision card. */
export const JUDGMENT_PRECEDENT_MAX = 3;
/** Per-precedent summary cap so one verbose outcome cannot dominate the card. */
const SUMMARY_MAX = 240;

/** Structural twin of decision-precedent.server's PrecedentMatch, kept local so
 * this module never imports server-only code. */
export type PrecedentMatchLike = {
  id: string;
  title?: string | null;
  verdict: JudgmentVerdict;
  summary: string;
  prdId: string | null;
  opportunityId: string | null;
  score: number;
};

/** PURE: map raw precedent matches into the card's render rows. Drops matches
 * that point back at the decision's own spec (a call never cites its own
 * outcome as "last time"), keeps the score order, caps at max. */
export function assemblePrecedentBlock(
  matches: PrecedentMatchLike[],
  opts: { ownPrdId?: string | null; max?: number } = {},
): JudgmentPrecedent[] {
  const max = opts.max ?? JUDGMENT_PRECEDENT_MAX;
  return matches
    .filter((m) => !opts.ownPrdId || m.prdId !== opts.ownPrdId)
    .slice(0, max)
    .map((m) => ({
      memoryId: m.id,
      title: m.title?.trim() || null,
      verdict: m.verdict,
      summary: (m.summary ?? "").trim().slice(0, SUMMARY_MAX),
      score: m.score,
      prdId: m.prdId ?? null,
      opportunityId: m.opportunityId ?? null,
    }));
}

export type DecisionAlternativeRow = { title: string; reason_rejected: string };

/** PURE: validate the decisions.alternatives_considered jsonb into render rows.
 * Anything that is not an array of {title, reason_rejected} objects reads as
 * empty. Real rows only, never a fabricated field. */
export function parseAlternativesConsidered(value: unknown): DecisionAlternativeRow[] {
  if (!Array.isArray(value)) return [];
  const out: DecisionAlternativeRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const reason = typeof o.reason_rejected === "string" ? o.reason_rejected.trim() : "";
    if (!title) continue;
    out.push({ title: title.slice(0, 280), reason_rejected: reason.slice(0, 500) });
    if (out.length >= 8) break;
  }
  return out;
}

export type CitationPlan = {
  /** learnings to receipt in learning_citations (first recall by this decision). */
  citeLearningIds: string[];
  /** Past decisions to bump via bump_decision_cited_by (the precedent is itself a decision). */
  bumpDecisionIds: string[];
};

/** PURE: decide which citation receipts to write when the precedent recall
 * serves learnings into a decision context.
 * - Each precedent resolves to at most one learning: prd match first, then
 *   opportunity match (array order is recency; the caller sorts newest first).
 * - A learning already cited under this decision's trace is not re-cited (and
 *   its precedent bumps nothing), so re-opening the card never inflates counts.
 * - Where the precedent's spec has decision rows of its own, those decisions
 *   are the recalled precedent: bump each once, never the viewing decision. */
export function planPrecedentCitations(args: {
  precedents: Array<{ prdId: string | null; opportunityId: string | null }>;
  learnings: Array<{ id: string; prd_id: string | null; opportunity_id: string | null }>;
  alreadyCitedLearningIds: ReadonlySet<string>;
  decisions: Array<{ id: string; prd_id: string | null }>;
  viewingDecisionId: string;
}): CitationPlan {
  const citeLearningIds: string[] = [];
  const bumpDecisionIds: string[] = [];
  const seenLearnings = new Set<string>();
  const seenBumps = new Set<string>();
  for (const p of args.precedents) {
    const learning =
      (p.prdId ? args.learnings.find((l) => l.prd_id === p.prdId) : undefined) ??
      (p.opportunityId
        ? args.learnings.find((l) => l.opportunity_id === p.opportunityId)
        : undefined) ??
      null;
    if (!learning) continue; // no learning served: no receipt, no bump
    if (seenLearnings.has(learning.id)) continue;
    seenLearnings.add(learning.id);
    if (args.alreadyCitedLearningIds.has(learning.id)) continue;
    citeLearningIds.push(learning.id);
    if (p.prdId) {
      for (const d of args.decisions) {
        if (d.prd_id === p.prdId && d.id !== args.viewingDecisionId && !seenBumps.has(d.id)) {
          seenBumps.add(d.id);
          bumpDecisionIds.push(d.id);
        }
      }
    }
  }
  return { citeLearningIds, bumpDecisionIds };
}

/** PC-16: at decision time, Cadence cites the user's own record directly on a
 * ranked bet - not just inside the opened detail sheet. PURE: collapses a
 * bet's precedent matches (same Ambient Precedent recall the decision card
 * and OpportunityJudgment use) into one honest sentence, or null when there
 * is nothing recorded to cite yet. Never fabricates a count or a verdict -
 * only ever describes the real matches it was given. */
export function summarizePrecedentCitation(precedents: JudgmentPrecedent[]): string | null {
  if (precedents.length === 0) return null;
  const counts: Record<JudgmentVerdict, number> = { validated: 0, missed: 0, mixed: 0 };
  for (const p of precedents) counts[p.verdict] += 1;
  // Majority verdict decides the phrase; a tie prefers the more cautionary
  // read (missed over mixed over validated) so the citation never oversells.
  const dominant: JudgmentVerdict =
    counts.missed >= counts.mixed && counts.missed >= counts.validated
      ? "missed"
      : counts.mixed >= counts.validated
        ? "mixed"
        : "validated";
  const n = precedents.length;
  const be = n === 1 ? "was" : "were";
  const phrase =
    dominant === "missed"
      ? "underperformed"
      : dominant === "mixed"
        ? `${be} mixed`
        : `${be} validated`;
  const mirror = precedents[0].title;
  const mirrorPart = mirror ? ` — this most closely mirrors "${mirror}"` : "";
  return `Your last ${n} similar bet${n === 1 ? "" : "s"} ${phrase}${mirrorPart}.`;
}
