/**
 * THE PUNCTUATION RULE EVERY AGENT WRITES UNDER.
 *
 * ── WHY THIS EXISTS, MEASURED ──────────────────────────────────────────────
 * THE COLUMN THAT CARRIES IT, measured 2026-08-26T19:07Z and corrected once:
 *
 *   agent_runs.output        1375 of 2773  (49.6%)  newest 2026-08-26T18:50Z
 *   decisions.forecast_claim    6 of  366
 *   decisions.rationale         0 of  366
 *   learnings.summary           0 of  135
 *
 * `agent_runs.output` is the agent's own last line in a run, and the run view
 * renders it, so roughly every second turn in the product prints one. A sample
 * from today: *"...originate from internal documents — the workspace brief,
 * PRDs, and Decisions — which are explicitly excluded..."*
 *
 * **This header first named `decisions.rationale` and that was wrong.** S1
 * measured the real distribution, S3 and S4 re-ran it, and I verified it before
 * correcting. The number is recorded here rather than the anecdote so the next
 * reader does not re-derive it, which is exactly what I did.
 *
 * That text is not decoration in a comment. It is persisted and rendered, so it
 * is the product's voice in front of a customer, and it reads as machine-written
 * to anyone who has seen a model write before. The founder's instruction is
 * blunt and it is a product requirement, not a preference: no em dashes and no
 * en dashes anywhere a user can see.
 *
 * ── WHY A RULE AND NOT ONLY A CLEANUP ──────────────────────────────────────
 * The offending prose does not come from one prompt that could be edited. It is
 * whatever the model says last in a run, so there is no single sentence to fix.
 * Every agent has to be TOLD, once, in the rules block it already reads.
 *
 * AND A RULE ALONE IS NOT ENOUGH, which is worth knowing before anyone treats
 * this file as the whole fix. `humanizeText` already exists and is applied at
 * `runtime.server.ts:2074` and `:2814`, but `loop.server.ts:1411-1413` and
 * `:1485-1487` write `output: msg` directly and bypass it (found by S1). A rule
 * asks; that pass enforces. Neither one can touch the 1375 rows already
 * written.
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

/**
 * NAME THE THING, NOT THE COLUMN (S2 -> S0, 2026-08-27).
 *
 * S2 screenshotted `/today` and read this back out of a review card, in prose a
 * person reads:
 *
 *     "...the current focus: (1) ramping checkout_single_address to 100%..."
 *
 * A raw identifier is the same family of tell as the em dash: machine writing
 * surfacing in the product's voice. And the fleet already treats it as
 * disqualifying in one place and passes it through in another — S1's
 * `messageForPerson` REJECTS `snake_case` outright as evidence that text was not
 * written to be read, which is the same split we just closed between
 * `serverMessage` and `messageForPerson`.
 *
 * ── WHY THIS IS A RULE AND NOT A SANITISER ─────────────────────────────────
 * A sanitiser cannot fix it. An em dash has a known replacement; a column name
 * does not. `checkout_single_address` might be *"the single-address checkout"*,
 * or *"the experiment that removed the second address screen"*, and only the
 * writer knows which. Rewriting it mechanically would produce a sentence that is
 * WRONG rather than one that is merely machine-flavoured, and a wrong sentence
 * about a customer's own experiment is worse than an ugly one.
 *
 * So this goes where the writer is, and the sanitiser stays out of it.
 */
export const PLAIN_NAMES_RULE =
  "Names: never put a database column, table, flag or code identifier into prose a person reads. " +
  "checkout_single_address, prd_id and forecast_horizon_date are machine names. Say what the thing " +
  "IS in your own words, the way you would to a colleague who does not have the schema open. If you " +
  "genuinely do not know the human name for it, describe what it does rather than pasting what it " +
  "is called.";
