/**
 * The Design stage's words, split out from the components that use them for
 * the same reason design-memory-shared.tsx exists: a file that exports both
 * components and constants breaks Vite fast refresh.
 *
 * Everything here translates an internal token into a word a stranger reads
 * without a tooltip (SURFACE-JUSTIFICATION question 7). The database says
 * `prd`, `mission` and `prototype`; a person reads "spec", "run" and "shared
 * link", and none of those are guesses about the data, only about the reader.
 */

import type { DesignFidelity, DesignGateWord } from "@/lib/design-scaffold.functions";
import type { DesignCriticFinding } from "@/lib/ai/design-critic";

/** Every artifact kind the lineage can name. `artifact_lineage` stores the
 *  product's own tokens and two of them do not mean in English what they mean
 *  here, so none of them reach a screen unmapped. */
const KIND_WORD: Record<string, [one: string, many: string]> = {
  signal: ["thing we found", "things we found"],
  theme: ["theme", "themes"],
  opportunity: ["opportunity", "opportunities"],
  prd: ["spec", "specs"],
  prd_flow: ["flow", "flows"],
  prd_scaffold: ["drawing", "drawings"],
  roadmap_item: ["roadmap item", "roadmap items"],
  task: ["task", "tasks"],
  meeting: ["meeting", "meetings"],
  decision: ["decision", "decisions"],
  mission: ["run", "runs"],
  house_rule: ["house rule", "house rules"],
  design_memory: ["brand rule", "brand rules"],
  prototype: ["shared link", "shared links"],
  capability_change: ["capability change", "capability changes"],
};

function kindWord(kind: string, count: number): string {
  const pair = KIND_WORD[kind];
  if (pair) return count === 1 ? pair[0] : pair[1];
  const plain = kind.replace(/_/g, " ");
  return count === 1 ? plain : `${plain} entries`;
}

/** "2 tasks and 1 run". Never a bare list of internal tokens. */
export function tallyPhrase(items: { kind: string; count: number }[]): string {
  const parts = items.map((t) => `${t.count} ${kindWord(t.kind, t.count)}`);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export const FIDELITY_WORD: Record<DesignFidelity, string> = {
  sketch: "Sketch",
  wireframe: "Wireframe",
  mockup: "Mockup",
};

/** What each fidelity is FOR. Three fidelities named without saying what they
 *  answer is three synonyms for "picture", which is a picker nobody can use. */
export const FIDELITY_QUESTION: Record<DesignFidelity, string> = {
  sketch: "Is this the right shape at all?",
  wireframe: "Is everything here, and in the right order?",
  mockup: "Would we ship this?",
};

/** The fidelity of a stored drawing, or the honest gap. A drawing made before
 *  the fidelity was recorded is not a mockup by default. */
export function fidelityWord(f: DesignFidelity | null): string {
  return f ? FIDELITY_WORD[f] : "Fidelity not recorded";
}

/** The gate in plain words. "pending" is a machine's word for a decision that
 *  has not been made, and it reads as "in progress" to everyone else. */
export const GATE_WORD: Record<DesignGateWord, string> = {
  pending: "Not settled",
  approved: "Approved",
  rejected: "Sent back",
};

/** The shortest text `importDesignMemoryFromText` accepts. A finding below it
 *  cannot become a rule, so its button is not drawn rather than drawn dead. */
export const RULE_TEXT_FLOOR = 20;

/** A finding, phrased as the standing rule it would become. The extractor
 *  reads this, so it says what the workspace should do rather than what went
 *  wrong once. */
export function ruleTextFor(f: DesignCriticFinding): string {
  return `${f.issue} This is a ${f.principle} rule for this workspace.`;
}
