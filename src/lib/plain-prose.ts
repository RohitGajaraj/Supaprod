/**
 * AGENT PROSE WITH ITS MARKDOWN SYNTAX OFF THE SCREEN.
 *
 * ── WHAT IS ON SCREEN ─────────────────────────────────────────────────────
 * The run screen's Decide tab renders a real decision rationale that reads, in
 * part: "No evidence shows address re-entry remains a barrier *after* that
 * fix". The asterisks are literal. `Prose markdown={false}` is doing exactly
 * what it says, and the agent wrote emphasis into a column that is displayed as
 * plain text.
 *
 * Measured: 92 of 2,805 `agent_runs.output` rows carry `**bold**`, and 11 of
 * the 369 decision rationales carry emphasis. Both of those columns are
 * rendered on the run screen -- the transcript's agent line and the decision
 * card -- so roughly a hundred places show a person raw syntax.
 *
 * That is the same class of tell as the em dash the founder called out: not
 * wrong, just unmistakably machine-written, on the screen the product is judged
 * by.
 *
 * ── WHY NOT THE TWO STRIPPERS THAT ALREADY EXIST ──────────────────────────
 * `answerTitle` in `ask-thread.ts` removes every `*`, `_`, backtick and `>` in
 * the text, and `normalize` in `design-readiness.ts` lowercases and flattens
 * all punctuation. Both are correct for what they do -- titles and term
 * matching -- and both would damage prose: an arithmetic `5 * 3`, a literal
 * asterisk, a sentence's capitalisation.
 *
 * ── AND WHY UNDERSCORES ARE LEFT ENTIRELY ALONE ───────────────────────────
 * `_italic_` is real markdown, and stripping it would be defensible in general
 * and wrong here. The very rationale that prompted this names
 * `checkout_single_address`, and identifiers with underscores are everywhere in
 * what these agents write -- column names, feature flags, tool names. Removing
 * a marker is a cosmetic win; corrupting an identifier makes the sentence
 * false. So this touches asterisks only, where the pairing test is safe.
 *
 * ── PAIRED, AND AROUND REAL TEXT ──────────────────────────────────────────
 * Only markers that open and close around non-space content are removed, so a
 * bullet at the start of a line, a multiplication sign with spaces around it,
 * and an unmatched asterisk all survive untouched.
 *
 * -- WHY IT SITS IN `lib` AND NOT UNDER THE SCREEN THAT NEEDED IT FIRST -----
 * It was written for the run screen and lived in `components/track/`. Four
 * other trees now import it -- learn, spine, the learn route, and the discover
 * feed -- and none of them has anything to do with a track. It follows
 * `error-copy.ts` here for the reason S0 gave for that one: a pure function
 * with no JSX, deciding what the product MAY SAY, is policy rather than
 * presentation, and policy should not be reached for through a sibling
 * screen's folder.
 *
 * `stripSignalNoise` in the discover feed calls it for exactly this step. That
 * file previously carried its own `/\*\*|__|~~/` strip, which was blunter in
 * one direction and blind in the other, and two spellings of one rule is how
 * the next person gets two answers from one string.
 */

/** The text with paired asterisk emphasis unwrapped, everything else intact. */
export function plainProse(text: string | null | undefined): string | null {
  if (typeof text !== "string") return null;
  const t = text;
  if (!t.includes("*")) return t;

  return (
    t
      // **bold** and ***both***, longest marker first so the inner pass has
      // nothing left to half-match.
      .replace(/\*\*\*(\S(?:[^*]*\S)?)\*\*\*/g, "$1")
      .replace(/\*\*(\S(?:[^*]*\S)?)\*\*/g, "$1")
      // *italic*, requiring non-space immediately inside both markers so that
      // "2 * 3" and a line-leading bullet are not treated as emphasis.
      .replace(/(^|[^*\w])\*(\S(?:[^*]*\S)?)\*(?![*\w])/g, "$1$2")
  );
}
