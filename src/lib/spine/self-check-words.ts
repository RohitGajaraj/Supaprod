/**
 * A SENTENCE FOR THE PERSON AND A SENTENCE FOR THE SEAT ARE TWO SENTENCES.
 *
 * The driver's self-check wrote "The checks were never run on this change.
 * Call studio.checks.run and read its verdict before handing this on." into
 * one field, and the transcript printed it verbatim under "Checked its own
 * work". The first half is a fact a person can read. The second is an
 * instruction to an agent, in the agent's own vocabulary, and on a screen it
 * reads as the product telling the person to go and call a tool.
 *
 * Every self-check now carries `why` (the person's sentence) and `instruction`
 * (the seat's), written separately. Rows written before the split hold the
 * joined form, so the reader applies the same rule the writer would have: the
 * instruction begins at the first sentence that opens with one of the verbs a
 * driver uses when it tells a seat what to do. The rule is deterministic and
 * tested, and it never invents a sentence: a text with no such verb is all
 * `why`, and a text that is nothing but an instruction stays a `why` rather
 * than leaving the person with an empty line.
 */

/**
 * The verbs a driver uses when it tells a SEAT what to do next. Keyed by the
 * word, so a new instruction that opens differently is read as prose until it
 * is added here, which is the safe direction: a fact shown as a fact.
 */
export const AGENT_IMPERATIVES: readonly string[] = [
  "Call",
  "Re-run",
  "Rerun",
  "Read",
  "Re-read",
  "Fix",
  "File",
  "Hand",
  "Use",
  "Stage",
  "Commit",
  "Open",
  "Merge",
  "Record",
  "Draft",
  "Run",
  "Judge",
  "Do not",
];

/** Sentence boundaries: a terminal mark, whitespace, then a capital or a backtick. */
const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-Z`])/;

function opensWithImperative(sentence: string): boolean {
  const s = sentence.trimStart();
  return AGENT_IMPERATIVES.some(
    (verb) => s.startsWith(`${verb} `) || s.startsWith(`${verb},`) || s === verb,
  );
}

/**
 * Split one stored sentence into the person's half and the seat's half.
 *
 * `why` is never null for a non-empty input: when the whole text is an
 * instruction there is nothing else to show the person, so they see it as it
 * was rather than nothing. `instruction` is null when no sentence opens with
 * an imperative.
 */
export function splitInstruction(text: string | null | undefined): {
  why: string | null;
  instruction: string | null;
} {
  const t = (text ?? "").trim();
  if (!t) return { why: null, instruction: null };
  const sentences = t.split(SENTENCE_BREAK);
  const at = sentences.findIndex(opensWithImperative);
  if (at <= 0) return { why: t, instruction: null };
  return {
    why: sentences.slice(0, at).join(" ").trim(),
    instruction: sentences.slice(at).join(" ").trim(),
  };
}

/**
 * The two halves back in one sentence, for the seat. The seat needs both: what
 * its check refused and what to do about it.
 */
export function forTheSeat(why: string | null | undefined, instruction: string | null | undefined) {
  return [why?.trim(), instruction?.trim()].filter((s): s is string => !!s).join(" ") || null;
}
