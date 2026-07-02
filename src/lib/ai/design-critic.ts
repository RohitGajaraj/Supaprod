/**
 * DSN-02: the Critic's design lens — PURE core (no server, no DB, no AI call).
 *
 * The Critic (critic.server.ts) gains a design dimension: heuristic evaluation
 * (hierarchy, accessibility floors, IA laws) plus consistency-vs-design-memory
 * ("this introduces a fourth button style; the standing pattern is two").
 * Runs on PRDs (folded into the existing CriticReview.design) and on DEF-04
 * scaffolds (design-scaffold.functions.ts's runScaffoldDesignCritic). This
 * module only validates the model's JSON into a typed shape, mirroring
 * design-memory.functions.ts's parseExtractedItems idiom, so the orchestration
 * in critic.server.ts stays a thin, fail-safe wrapper around it.
 */

export type DesignCriticVerdict = "ship" | "revise" | "kill";

export type DesignCriticFinding = {
  issue: string;
  /** The violated principle: hierarchy | accessibility | ia | consistency (free text, not enumerated - the model names it). */
  principle: string;
  /** The design-memory entry title this finding cites, when it is a consistency violation; null for a generic heuristic finding. */
  standing_decision: string | null;
};

export type DesignCriticReview = {
  verdict: DesignCriticVerdict;
  findings: DesignCriticFinding[];
};

const MAX_FINDINGS = 8;

/** PURE. Validate + bound the model's parsed JSON into a typed design-critic review. */
export function parseDesignCriticReview(json: unknown): DesignCriticReview {
  const obj = (json ?? {}) as Record<string, unknown>;
  const verdict: DesignCriticVerdict =
    obj.verdict === "ship" || obj.verdict === "kill" || obj.verdict === "revise"
      ? obj.verdict
      : "revise";

  const raw = Array.isArray(obj.findings) ? obj.findings : [];
  const findings: DesignCriticFinding[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const issue = typeof e.issue === "string" ? e.issue.trim() : "";
    const principle = typeof e.principle === "string" ? e.principle.trim() : "";
    if (!issue || !principle) continue;
    const standing_decision =
      typeof e.standing_decision === "string" && e.standing_decision.trim()
        ? e.standing_decision.trim().slice(0, 200)
        : null;
    findings.push({
      issue: issue.slice(0, 400),
      principle: principle.slice(0, 200),
      standing_decision,
    });
    if (findings.length >= MAX_FINDINGS) break;
  }
  return { verdict, findings };
}
