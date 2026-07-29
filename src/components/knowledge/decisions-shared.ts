// Shared decision vocabulary — single source for DecisionsPanel (list) and
// DecisionDetail (screen-6 drill-down). Non-component exports live here so
// both component files keep Vite fast-refresh (react-refresh rule: a file
// must export only components). SourceLink stays in DecisionsPanel.
import type { DecisionRow, DecisionSource } from "@/lib/decisions.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";

export const SOURCE_LABEL: Record<DecisionSource, string> = {
  mission: "Mission",
  prd: "Spec",
  meeting: "Meeting",
  manual: "Manual",
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
