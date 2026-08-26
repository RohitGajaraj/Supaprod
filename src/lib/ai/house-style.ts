/**
 * THE PUNCTUATION RULE EVERY AGENT WRITES UNDER.
 *
 * ── WHY THIS EXISTS, MEASURED ──────────────────────────────────────────────
 * Queried live 2026-08-26: `decisions.rationale` rows written by agents carry
 * em dashes in the unmistakable register of a language model:
 *
 *   "This is not a hypothesis — it is a confirmed systemic failure"
 *   "The only stated justification — 'someone asked' — is explicitly insufficient"
 *
 * That text is not decoration in a comment. It is persisted and rendered, so it
 * is the product's voice in front of a customer, and it reads as machine-written
 * to anyone who has seen a model write before. The founder's instruction is
 * blunt and it is a product requirement, not a preference: no em dashes and no
 * en dashes anywhere a user can see.
 *
 * ── WHY A RULE AND NOT ONLY A CLEANUP ──────────────────────────────────────
 * The offending prose does not come from one prompt that could be edited. It
 * comes from agents writing free text into tool arguments (`decision.record`'s
 * `rationale` is "Why you made this call", filled by the model), so there is no
 * single sentence to fix. Every agent has to be TOLD, once, in the rules block
 * it already reads.
 *
 * ── AND WHY THE PROMPTS THEMSELVES WERE CHANGED ────────────────────────────
 * A rule that says "no em dashes" inside a prompt that is itself full of them
 * is a weak instruction, because a model copies the register it is shown far
 * more reliably than it follows a line it is told. The dashes were removed from
 * the surrounding prompt text in the same change for that reason. The example
 * has to agree with the instruction.
 *
 * This is a STYLE rule and deliberately nothing more. It says nothing about
 * what an agent may claim, only about how the claim is punctuated.
 */

/**
 * Appended to the rules block every agent loop assembles.
 *
 * Kept to one short paragraph on purpose: it sits alongside the tool list and
 * the injection warning, and a long style lecture there would compete with
 * rules that matter more than punctuation does.
 */
export const PLAIN_PUNCTUATION_RULE =
  "Punctuation: write with ordinary keyboard characters only. Never use an em dash or an en " +
  "dash in anything you write, including titles, summaries, rationales, specs and final " +
  "messages. Use a comma, a full stop, or a plain hyphen instead, and write a range as 1-6.";
