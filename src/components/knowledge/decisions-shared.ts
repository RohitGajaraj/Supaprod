// Shared decision vocabulary — single source for DecisionsPanel (list) and
// DecisionDetail (screen-6 drill-down). Non-component exports live here so
// both component files keep Vite fast-refresh (react-refresh rule: a file
// must export only components). SourceLink stays in DecisionsPanel.
import type { DecisionRow, DecisionSource } from "@/lib/decisions.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";

/**
 * Where the call came from, in the words a practitioner would use.
 *
 * EXHAUSTIVE BY CONSTRUCTION. `DecisionSource` is derived from
 * `DECISION_SOURCES`, so this Record fails to compile the moment an origin is
 * added without a label — which is exactly what did not happen the last three
 * times. This map held four keys while the database permitted nine, and the
 * cast at DecisionDetail.tsx:278 hid it from tsc, so 50 of 296 rows rendered
 * `undefined` here: a Line with no label and a filter option that did not exist.
 *
 * The six added on 2026-08-11 are the six that were already in the data.
 */
export const SOURCE_LABEL: Record<DecisionSource, string> = {
  mission: "Mission",
  prd: "Spec",
  meeting: "Meeting",
  manual: "Manual",
  roadmap: "Roadmap",
  retrospective: "Retro",
  critic: "Critic",
  opportunity: "Opportunity",
  /* Two different agent origins, and the labels have to carry the difference
   * themselves. These read "Agent API" and "Agent" until Lane 2 pointed out
   * the obvious: a reader seeing both assumes it is one thing written twice,
   * because neither word says WHOSE agent. The load-bearing fact is that one
   * of them belongs to somebody else — it arrived over the network under a
   * scoped token — and the other is this product's own Decide hand running
   * inside a mission. Those carry different trust and different blast radius,
   * so the distinction stays and the wording changed to state it.
   *
   * "Peer agent" is the product's own existing word for an outside caller
   * (a2a-card.ts, mcp.functions.ts), not a new coinage. */
  mcp: "Peer agent",
  agent: "Agent",
};

/** The outcome in plain words, and the one class that carries it.
 *
 *  Replaces the retired VerdictTone map. Green and red carry outcomes and own
 *  those two; a call nobody has settled yet is not an outcome, so it stays
 *  monochrome rather than wearing ember. Ember marks the human, and deciding
 *  happens on Today, so the ember budget belongs there. */
export const OUTCOME_WORD: Record<DecisionRow["status"], { word: string; tone: string }> = {
  approved: { word: "Kept", tone: "sp-pass" },
  rejected: { word: "Dropped", tone: "sp-fail" },
  pending: { word: "Not settled", tone: "" },
};

export function ageOf(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return ""; // Guard against malformed timestamps
  const ms = Date.now() - then;
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function hasSource(d: DecisionRow): boolean {
  return !!(d.mission_id || d.prd_id || d.meeting_id);
}

/** Who decided, user-facing. A human call reads as "You"; an agent call
 * resolves through the agent-vocabulary catalog so a raw DB slug (e.g.
 * "prd-writer") never leaks to the panel - it reads as the agent's real
 * name (e.g. "Draft"). */
export function displayWho(slug: string | null): string {
  if (!slug) return "You";
  return agentDisplayName(slug);
}
