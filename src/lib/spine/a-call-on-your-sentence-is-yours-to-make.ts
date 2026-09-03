/**
 * ── R-39: A CALL ON THE PERSON'S SENTENCE ALONE IS THE PERSON'S ──────────
 *
 * Walked live in an empty probe workspace, 2026-09-04. A person typed one
 * sentence. Sense searched, found nothing, and carried on the sentence, which
 * is R-36 working exactly as designed. Then Decide's strategist DECLINED on the
 * same absence -- "not currently a meaningful friction point" -- with a forecast
 * written against 1,000 sessions that no connected source could ever see. The
 * decline arm waived four stations, and Learn now reads "Waiting on time, Learn
 * returns Oct 3".
 *
 * So a person who typed one sentence into an empty workspace was told NO, on
 * NOTHING, with a date that returns to nothing.
 *
 * ── WHY THIS IS NOT A PROMPT FIX ─────────────────────────────────────────
 *
 * The brief can ask the strategist not to do this, and a rule written as a
 * request is the defect this repo has spent a month closing. The refusal lives
 * in the writer, so the sentence cannot be recorded whatever any model decides.
 *
 * ── AND WHY A REFUSAL RATHER THAN A REWRITE ──────────────────────────────
 *
 * Turning the decline into a `build` in code would put words in the
 * strategist's mouth and record a call nobody made. The tool refuses and says
 * why, and the crew's own next move -- build on the person's word, or ask them
 * -- is the one the brief describes. A refusal the caller can read is how every
 * other floor in this registry works.
 */

/** The one footing this rule keys on: Sense carried the person's sentence. */
export const CARRIED_FOOTING = "carried-on-your-sentence";

/**
 * Phrases that make a decline a call about ABSENCE rather than about the idea.
 *
 * Matched on the rationale, not on the verdict: a strategist may honestly
 * decline a bad idea in an empty workspace, and this must not stop it. What it
 * stops is declining because there is nothing to look at -- which on a carried
 * track is always true, and is never the person's answer.
 *
 * Deliberately about EVIDENCE and not about confidence. "I am not sure" is a
 * strategist being honest; "there is no data" on a track whose footing is the
 * person's own sentence is the machine mistaking its own emptiness for a no.
 */
const ABSENCE_PHRASES = [
  "no evidence",
  "no data",
  "no signal",
  "no signals",
  "insufficient evidence",
  "insufficient data",
  "not enough evidence",
  "not enough data",
  "lack of evidence",
  "lack of data",
  "nothing in the record",
  "no supporting",
  "unsupported by",
  "cannot be validated",
  "no source",
  "no sources",
  "not currently a meaningful friction point",
  "no indication",
  "no observed",
  "without evidence",
  "without data",
];

/** Does this rationale rest on there being nothing to look at? */
export function restsOnAbsence(rationale: string | null | undefined): boolean {
  const r = (rationale ?? "").toLowerCase();
  if (!r.trim()) {
    /*
     * A decline with NO rationale on a carried track is the same refusal with
     * the argument left out. Treated as absence rather than waved through: the
     * one thing a no on somebody's own sentence must carry is a reason.
     */
    return true;
  }
  return ABSENCE_PHRASES.some((p) => r.includes(p));
}

/**
 * May this decline be recorded?
 *
 * `carried` is whether Sense carried the person's sentence for this track. On
 * any other footing the strategist read something real and its no is its own.
 */
export function declineIsRefused(input: {
  call: string;
  carried: boolean;
  rationale: string | null | undefined;
}): boolean {
  if (input.call !== "do-not-build") return false;
  if (!input.carried) return false;
  return restsOnAbsence(input.rationale);
}

/**
 * What the crew is told, and it names both ways forward.
 *
 * The sentence is the refusal's whole value: a floor that says "not allowed"
 * teaches nothing, and this one has to leave the strategist able to act.
 */
export const R39_REFUSAL =
  "This track is carried on the person's own sentence: Sense searched and the workspace holds " +
  "nothing bearing on it. A no that rests on that absence is a call about our emptiness, not " +
  "about their idea, and it is theirs to make rather than ours. Either record `build` with their " +
  "own claim as the forecast and a how-we-will-know that names a source this workspace actually " +
  "has, or ask them: raise one choice between building it on their word and pointing a source " +
  "first, and let the track wait for their answer.";

/** The two options of that Choice, in the person's words. Exported so the run
 *  screen and the brief cannot describe the same question differently. */
export const CARRIED_CHOICE = {
  question: "Build this on your word, or point a source at it first",
  options: [
    {
      id: "build-on-your-word",
      label: "Build it on your word",
      fact: "Nothing here can grade it yet, so your claim is the forecast.",
    },
    {
      id: "point-a-source",
      label: "Point a source first",
      fact: "Connect something that can tell us whether it worked.",
    },
  ],
} as const;

/**
 * A stable marker inside `R39_REFUSAL`, so the driver can recognise its own
 * refusal in `tool_calls.error` without matching the whole paragraph.
 *
 * The driver could instead infer the situation from its own state -- carried
 * footing, Decide, nothing attached -- and that was the first design. It is
 * wrong: a strategist that simply produced nothing lands in the same state, and
 * a run that FAILED lands there too. Only the refusal means "a no was attempted
 * on the person's own sentence", which is the one thing worth asking them
 * about, so the driver keys on the refusal actually having happened.
 *
 * Matched on a phrase this repo's humanizer will not rewrite and no other
 * message contains, rather than on the whole sentence, which would break the
 * moment somebody improves a word of it.
 */
export const R39_MARKER = "carried on the person's own sentence";

/** Did this run attempt a no on the person's own sentence and get refused? */
export function refusalHappened(errors: readonly (string | null | undefined)[]): boolean {
  return errors.some((e) => (e ?? "").includes(R39_MARKER));
}
