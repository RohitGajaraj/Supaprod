/**
 * ── R-40: A DESIGN VERDICT AGAINST THE PREMISE HOLDS THE TRACK (P-72) ────
 *
 * On the tablet track the Design critic said the spec's premise -- a layout fix
 * -- contradicts the brief, which is about removing a re-confirmation step.
 * The track passed Design with that recorded as a note, walked to Build, and
 * the change that reached a customer's repository was 90 lines of CSS for a
 * component that does not exist.
 *
 * A critic that says the work is aimed at the wrong thing has not found a
 * detail to improve. It has found that the next station should not run.
 *
 * ── TWO SHAPES, AND ONLY ONE IS A JUDGEMENT CALL ─────────────────────────
 *
 * `kill` is unambiguous and needs no interpretation: the critic was given three
 * words and chose the one that means stop. It holds, always.
 *
 * The second shape is a `revise` whose finding is not about the drawing but
 * about what the drawing is FOR -- the premise, the brief, the wrong screen,
 * the wrong feature. That is a text judgement and it is made conservatively:
 * the phrases below all name a mismatch between the work and its purpose, and
 * an ordinary "this control is too small" does not match any of them. A wrong
 * hold costs one person one press. A wrong pass cost a customer a merged pull
 * request of styling for a component that was never there.
 */
import type { DesignCriticReview } from "@/lib/ai/design-critic";

/**
 * A finding about the AIM of the work rather than its execution.
 *
 * Matched on the finding's own words. Deliberately narrow: every phrase here
 * describes the work and its purpose disagreeing, not the work being weak.
 */
const AGAINST_THE_PREMISE = [
  "contradicts the brief",
  "contradicts the spec",
  "contradicts the premise",
  "premise",
  "wrong problem",
  "different problem",
  "does not address",
  "doesn't address",
  "not what the brief",
  "not what the spec",
  "belongs elsewhere",
  "wrong screen",
  "wrong feature",
  "wrong component",
  "does not exist",
  "doesn't exist",
  "no such component",
];

/** Does this finding say the work is aimed at the wrong thing? */
export function findingIsAgainstThePremise(text: string | null | undefined): boolean {
  const t = (text ?? "").toLowerCase();
  if (!t.trim()) return false;
  return AGAINST_THE_PREMISE.some((p) => t.includes(p));
}

/**
 * Should this verdict stop the track at Design?
 *
 * Null review means the critic did not run or could not be read, and that is
 * NOT a hold: a missing verdict is not a verdict against, and holding on one
 * would stop every track whose critic failed for its own reasons.
 */
export function designVerdictHolds(review: DesignCriticReview | null | undefined): boolean {
  if (!review) return false;
  if (review.verdict === "kill") return true;
  return (review.findings ?? []).some(
    (f) => findingIsAgainstThePremise(f.issue) || findingIsAgainstThePremise(f.principle),
  );
}

/**
 * The sentence the person reads, which is the CRITIC'S OWN.
 *
 * The critic has already said the thing better than a template can: it names
 * the premise, the brief and what the drawing is actually about. A generic
 * "Design raised a concern" would throw that away and send a person to the
 * transcript to find out what this line was supposed to say.
 */
export function designHoldLine(review: DesignCriticReview | null | undefined): string {
  const against = (review?.findings ?? []).find(
    (f) => findingIsAgainstThePremise(f.issue) || findingIsAgainstThePremise(f.principle),
  );
  const said = (against?.issue ?? "").trim().replace(/\s+/g, " ");
  if (said) {
    return `Design stopped this: ${said} Answer it, or amend the spec, before anything is built.`;
  }
  if (review?.verdict === "kill") {
    return (
      "Design's verdict on this drawing was to kill it, and nothing should be built from it. " +
      "Answer that, or amend the spec, before Build runs."
    );
  }
  return "Design stopped this and gave no reason for it.";
}
