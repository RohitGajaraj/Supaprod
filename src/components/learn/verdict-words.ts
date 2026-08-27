/**
 * The product's three words for a verdict, in one place.
 *
 * These lived inside `SettlePanel` because it was the only thing that said
 * them: the Gate asks "Did it pay off?" and the buttons answer. The Learn route
 * then needed to name a verdict already ON the record ("the last verdict on the
 * record", read back from `listLearnings` so a settled outcome survives a
 * reload), and there were exactly two ways to do that. Copy the map, and let
 * the desk and the record drift into calling the same verdict two things. Or
 * lift it here, which is what a word the whole station speaks in should have
 * been all along.
 *
 * A `.ts` module and not an export from the panel, because a component file
 * that also exports constants breaks Fast Refresh for every component in it
 * (`react-refresh/only-export-components`), and the warning is right.
 *
 * The three words are load bearing and are not synonyms chosen for tone: the
 * run screen's stage 07 panel uses them, so `/learn` and `/runs` never call the
 * same thing two things. `learnings.verdict` is constrained on the database to
 * exactly these three keys and there is deliberately no fourth (see
 * `deferOutcomeCheck`: "too early" is a check date, not a verdict).
 */

export type Verdict = "validated" | "mixed" | "missed";

export const VERDICT_SAYS: Record<Verdict, string> = {
  validated: "it worked",
  missed: "it did not work",
  mixed: "the evidence was mixed",
};
