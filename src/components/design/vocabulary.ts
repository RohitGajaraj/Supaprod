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

import { artifactWord } from "@/lib/artifact-words";
import type { DesignFidelity, DesignGateWord } from "@/lib/design-scaffold.functions";
import type { DesignCriticFinding } from "@/lib/ai/design-critic";

/**
 * THIS MAP DRIFTED FROM THE CANONICAL ONE AND NOW CANNOT, SILENTLY.
 *
 * Operating model §12 bans "signals" outright ("a practitioner does not say
 * signals"). S0 renamed the display word to "finding" in
 * `src/lib/artifact-words.ts`, which cites §12 at the entry, and this file went
 * on saying "signal". The Discover feed hit the same split and left a note
 * calling it "one product, two words for" one kind. It was four: this file,
 * `artifact-words.ts` ("finding"), `LineageDrawer` ("Signal") and the knowledge
 * graph ("SIG").
 *
 * The obvious repair is to delete this map and call `artifactWord` for
 * everything, and it is wrong. Four kinds here carry a word this surface chose
 * on purpose and the canonical map does not: `mission` reads "run" and not
 * "mission", which is the word §12 is trying to remove; `prototype` reads
 * "shared link", which is what the docblock above promises a stranger sees.
 * Deleting those would fix one drift by causing four.
 *
 * So the two are RECONCILED rather than merged. Anything not listed below takes
 * the canonical word, so a rename there reaches this surface on its own. What
 * is listed is an override with a reason, and `vocabulary.test.ts` fails if an
 * override ever matches the canonical word, which is how a stale one gets
 * noticed instead of outliving its reason.
 */
export const DELIBERATE_SINGULAR: Record<string, string> = {
  // §12 is removing "mission" and "run" both, in favour of naming the work.
  // Until that lands this surface says the shorter of the two, and it is what
  // the docblock above promises.
  mission: "run",
  // A person setting these up is describing their brand, not the design system.
  design_memory: "brand rule",
  // What the reader receives is a link they can open, which is the promise this
  // file's own header makes.
  prototype: "shared link",
};

/** Plurals the canonical map has no opinion about, because it is singular only. */
const IRREGULAR_PLURAL: Record<string, string> = {
  opportunity: "opportunities",
};

export function kindWord(kind: string, count: number): string {
  const one = DELIBERATE_SINGULAR[kind] ?? artifactWord(kind);
  if (count === 1) return one;
  return IRREGULAR_PLURAL[kind] ?? `${one}s`;
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
