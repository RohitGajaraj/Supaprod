/**
 * A SEAT'S OUTPUT IS SOMETIMES PROSE AND SOMETIMES A JSON STEP, AND EVERY
 * SURFACE THAT QUOTES IT HAS TO KNOW WHICH.
 *
 * ── READ ON THE ONE RUN THAT EVER FINISHED, AND IT WAS MY OWN BUG ─────────
 * `d1168015` is the single track in this product's history that walked all
 * seven stations: 15 members across signal, theme, decision, spec, task,
 * prototype, changeset and learning. It is the screen that proves the whole
 * claim, and the hold card I shipped this morning drew this on it, eleven lines
 * deep in a 250px column:
 *
 *   Engineer and Review could not start Build, 2 times.
 *   "Reached the step limit before finishing. Where it got to:
 *    {"thought":"The studio.commit call failed because it requires a message
 *    parameter. I need to provide a commit message that describes the
 *    changes.", "action":
 *    {"type":"tool_call","name":"studio.commit","a...
 *    {"message":"feat(checkout): implement tablet-optimized address summary
 *    screen"},"reason":"The studio.commit call requires a message parameter..."
 *
 * `theBlockerItAlreadyNamed` quotes the seat verbatim ON PURPOSE -- the agent
 * writes better than the machinery, and that argument is right. It is only
 * right when the agent wrote a sentence. Here the loop wrote a preamble and
 * pasted the model's raw step after it, and quoting it verbatim put punctuation
 * on the most important screen in the product.
 *
 * ── AND IT IS WORSE THAN A RENDERING PROBLEM ─────────────────────────────
 * `claimOf` takes the FIRST SENTENCE of the said, and on this string the first
 * sentence ends inside the JSON. So the claim two seats were grouped on was
 * `Reached the step limit before finishing` plus a brace -- the matching, the
 * folding and the section refrain were all reading punctuation. The quote was
 * the visible half of a defect that reached every measure downstream of it.
 *
 * ── SO IT IS NORMALISED ONCE, AT THE FRONT ───────────────────────────────
 * `what-the-model-said.ts` already reads this exact shape, field by field,
 * because `*_preview` columns are truncated JSON and `JSON.parse` throws on
 * nearly every row of a busy trace. It was built for the trace page and the
 * answer it gives -- the model's own `thought` -- is the sentence a person
 * wanted in the first place.
 *
 * This runs before anything measures or quotes, so one rule serves the blocker,
 * the fold and the section refrain, and none of them can disagree about what a
 * seat said.
 *
 * ── IT RETURNS THE ORIGINAL WHEN IT IS NOT THAT SHAPE ────────────────────
 * Most output IS prose -- "No repository is connected for this workspace" is a
 * sentence a model wrote -- and rewriting it would be this file inventing a
 * voice. It only speaks when the string is a step it can read, and hands back
 * exactly what it was given otherwise.
 */
import { readModelStep } from "@/components/traces/what-the-model-said";

/**
 * The prose inside a seat's output, or the output unchanged.
 *
 * The THOUGHT rather than the action's reason: the thought is what the seat
 * believed about the work, and the reason is why it picked the next tool. On a
 * run that got stuck, what a person needs is the first.
 */
export function whatASeatActuallySaid(said: string | null | undefined): string | null {
  /* Empty and absent are the same answer to every caller here -- a seat that
     said nothing -- so they collapse rather than one of them travelling as a
     string that every downstream check then has to handle. */
  const trimmed = said?.trim();
  if (!trimmed) return null;

  /*
   * The step can be anywhere in the string, not only at the start. This run's
   * output opens with a sentence the LOOP wrote -- "Reached the step limit
   * before finishing. Where it got to:" -- and pastes the model's step after
   * it, so a check that only looked at the first character would find prose and
   * quote the whole thing.
   */
  const brace = trimmed.indexOf("{");
  if (brace < 0) return trimmed;

  const step = readModelStep(trimmed.slice(brace));
  const thought = step?.thought?.trim();
  if (!thought) {
    /*
     * A brace it cannot read. Returning the raw string would put JSON back on
     * the screen, and returning null would delete a seat's only account of
     * itself, so the prose BEFORE the brace is the honest middle -- it is what
     * a person wrote or the loop wrote, and it is a sentence either way.
     */
    const lead = trimmed.slice(0, brace).trim();
    return lead.length > 0 ? lead : trimmed;
  }
  return thought;
}
