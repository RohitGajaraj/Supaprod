// CORE-UX-FELT (v11) — the chief-of-staff brief leads with STAKES, not counts.
//
// The felt-experience fix: a brief that opens with "3 approvals pending" is a
// task-counter; a chief of staff opens with "an irreversible production deploy is
// waiting on you." This PURE helper turns the pending gates into a deterministic
// stakes summary (reversibility + blast radius, via the static `tool-consequences`
// catalogue — never model output, so the claim never outruns the wiring) that the
// brief prompt leads with. The AI then grounds its lead in real stakes, not a tally.
import {
  gateHeadline,
  toolConsequence,
  toolRisk,
  type Reversibility,
  type ToolRisk,
} from "@/lib/tool-consequences";

export type PendingGate = { tool_name: string | null; agent_slug?: string | null };

export type GateStakes = {
  total: number;
  irreversible: number;
  partial: number;
  reversible: number;
  highRisk: number;
  /** The single most consequential pending call (the brief's lead), or null when the queue is clear. */
  top: { toolName: string; effect: string; reversibility: Reversibility; risk: ToolRisk } | null;
};

// Consequence ranking: irreversibility dominates, then blast radius. The scariest
// call surfaces first so the brief leads with what actually matters.
const REV_WEIGHT: Record<Reversibility, number> = { irreversible: 2, partial: 1, reversible: 0 };
const RISK_WEIGHT: Record<ToolRisk, number> = { high: 2, medium: 1, low: 0 };

/** PURE. Fold the pending gates into a stakes summary + the single most consequential call. */
export function summarizeGateStakes(gates: PendingGate[] | null | undefined): GateStakes {
  let irreversible = 0,
    partial = 0,
    reversible = 0,
    highRisk = 0;
  let top: GateStakes["top"] = null;
  let topScore = -1;
  for (const g of Array.isArray(gates) ? gates : []) {
    const tool = (g?.tool_name ?? "").trim();
    if (!tool) continue;
    const c = toolConsequence(tool);
    const risk = toolRisk(tool);
    if (c.reversible === "irreversible") irreversible++;
    else if (c.reversible === "partial") partial++;
    else reversible++;
    if (risk === "high") highRisk++;
    const score = REV_WEIGHT[c.reversible] * 3 + RISK_WEIGHT[risk];
    if (score > topScore) {
      topScore = score;
      /*
       * `gateHeadline` for the sentence, `c` for the two axes. The brief LEADS
       * with `top.effect`, so an uncatalogued name made the chief-of-staff open
       * on "Runs the tool with the agent's arguments." -- the least useful
       * sentence available, in the position this helper exists to make the most
       * useful. Identical output for all 59 registered tools; it differs only on
       * the six names the seed migrations write and no tool defines.
       */
      top = { toolName: tool, effect: gateHeadline(tool), reversibility: c.reversible, risk };
    }
  }
  return {
    total: irreversible + partial + reversible,
    irreversible,
    partial,
    reversible,
    highRisk,
    top,
  };
}

/**
 * PURE. A deterministic, plain-language stakes line for the brief prompt, so the
 * model leads with the truth of what is at risk rather than inventing or counting.
 * Honest when the queue is clear (no fabricated urgency).
 */
export function describeStakes(s: GateStakes): string {
  if (!s || s.total === 0) return "No pending approvals. The queue is clear.";
  const parts: string[] = [];
  if (s.top) {
    const riskTag = s.top.risk === "high" ? ", high blast radius" : "";
    parts.push(
      `Most consequential: ${s.top.toolName} · ${s.top.effect} (${s.top.reversibility}${riskTag}).`,
    );
  }
  const breakdown: string[] = [];
  if (s.irreversible) breakdown.push(`${s.irreversible} irreversible`);
  if (s.partial) breakdown.push(`${s.partial} partially reversible`);
  if (s.reversible) breakdown.push(`${s.reversible} reversible`);
  parts.push(`${s.total} call${s.total === 1 ? "" : "s"} await you: ${breakdown.join(", ")}.`);
  return parts.join(" ");
}

// FS-04 — Risk in the brief (v12 sec 4). Today is not a dashboard: foresight
// (FS-01's `deriveRisk` + its calibration hit rate) lands directly in the
// brief's existing stakes lead, not a new panel. `describeRisk` mirrors
// `describeStakes`'s shape (pure, honest-when-empty) so the brief prompt
// composes both the same way.
export type OpenRisk = { headline: string; detail: string } | null;
export type RiskCalibration = { resolved: number; recentLabel: string } | null;

/**
 * PURE. A deterministic risk-lead line for the brief prompt: the single
 * highest-scored open `risk` insight, credibility-checked against FS-01's
 * calibration hit rate. Never invents a hit rate — the calibration clause is
 * omitted entirely until there is at least one resolved call to cite.
 */
export function describeRisk(risk: OpenRisk, calibration: RiskCalibration): string {
  if (!risk) return "No open risk flagged.";
  const headline = risk.headline.trim().replace(/[.!?]?$/, ".");
  const detail = risk.detail.trim();
  const track = calibration && calibration.resolved > 0 ? ` (${calibration.recentLabel}.)` : "";
  return `Watch: ${headline}${detail ? ` ${detail}` : ""}${track}`;
}
