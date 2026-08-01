/**
 * The vocabulary and rotation behind the working indicator.
 *
 * Split from AgentPulse.tsx so the words and the maths are testable without a
 * DOM, which is the same pure-module split route.ts, driver.ts, attach.ts,
 * chain.ts and activity.ts already use in this codebase.
 */
/**
 * What an agent might be doing, in the product's own register.
 *
 * Deliberately NOT Claude Code's list. These are ours: they lean on the verbs
 * this product actually uses about work (reading evidence, weighing a call,
 * drafting, shipping, remembering) with enough oddity to be worth glancing at.
 * Every one of them is a real thing a station does, so the word is never a lie
 * dressed as personality.
 */
export const WORKING_WORDS: readonly string[] = [
  "Reading",
  "Weighing",
  "Drafting",
  "Sketching",
  "Wiring",
  "Reasoning",
  "Rummaging",
  "Untangling",
  "Cross-checking",
  "Distilling",
  "Whirring",
  "Assembling",
  "Second-guessing",
  "Nudging",
  "Stitching",
  "Considering",
  "Tightening",
  "Rethinking",
  "Filing",
  "Remembering",
  "Joining dots",
  "Sanity-checking",
  "Deliberating",
  "Winnowing",
];

/** How long one word holds. Long enough to read, short enough to prove life. */
export const WORD_HOLD_MS = 2600;

/**
 * Pick the word for a given tick, deterministically.
 *
 * Exported and pure so the rotation is testable without a timer, and seeded by
 * the caller so two indicators on one screen do not chant in unison, which
 * reads as a single animation rather than as two agents working.
 */
export function wordAt(tick: number, seed = 0): string {
  const i = Math.abs(Math.trunc(tick) + Math.trunc(seed)) % WORKING_WORDS.length;
  return WORKING_WORDS[i];
}

/** A stable small integer from a string, so the same agent always starts alike. */
export function seedFrom(s: string | undefined): number {
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
