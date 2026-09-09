/**
 * THE DEEPEST SURFACE IN A PRODUCT WHOSE CLAIM IS THAT YOU CAN WATCH AN AGENT
 * WORK LED EVERY ROW WITH THE TWO FACTS THAT NEVER CHANGED.
 *
 * ── WHAT `/traces/4df54b89` DREW, READ LIVE 2026-09-10 ────────────────────
 * Twelve rows. The word "Critique" on all twelve, and "called qwen/qwen-plus"
 * on all six model rows:
 *
 *   Critique called qwen/qwen-plus                                    2.42s
 *     I need to verify the existence of a standing design system before …
 *   Critique ran themes.list                                           44ms
 *     0 results
 *   Critique called qwen/qwen-plus                                    2.04s
 *     No themes exist, confirming no standing design system is recorded …
 *
 * The page header already says **"Critique's turn at Design"**. The rail beside
 * it says **"WHO RAN IT · Critique · 7 calls"**. The detail pane says
 * **"Model · qwen/qwen-plus"**. So the lead -- the widest, brightest, first-read
 * position on the row -- spent itself on two facts the page had already stated
 * twice, while the agent's actual reasoning sat truncated in the grey sub.
 *
 * **The machinery led and the meaning followed.** That is the founder's
 * sentence about this product, at its deepest layer: *"the agent does real work
 * and the user sees almost none of it."*
 *
 * ── AND THE WORK ON THAT TRACE IS GENUINELY GOOD ──────────────────────────
 * Critique refused to assert conformance without checking. It queried themes,
 * then decisions, then specs, found nothing in all three, and only then said
 * the negative was justified. That is careful work, and the page rendered it as
 * a column reading `0 results`, `0 results`, `0 results` under a name repeated
 * twelve times.
 *
 * ── MEASURED BEFORE CHANGING ANYTHING ─────────────────────────────────────
 *   3,076 traces hold model calls.
 *   2,886 of them -- **93.8%** -- use exactly ONE model.
 *
 * So on fourteen traces in fifteen the model in the lead is a constant, and the
 * actor is a constant by construction on every tool row (they all ride under
 * the trace's own agent slug). This is not a quirk of the trace I happened to
 * open.
 *
 * ── THE RULE ──────────────────────────────────────────────────────────────
 * **A fact identical on every row, which the page has already stated
 * elsewhere, is not news, and must not hold the lead.** It is the
 * discriminator rule the run screen was repaired with all day -- two elements
 * saying one thing -- applied one layer down and to a column instead of a pair.
 *
 * When it holds, the lead goes to what the row alone can say: the model's
 * thought, or the tool it reached for. The constant does not move to the sub;
 * it LEAVES, because it is still on the page twice.
 *
 * ── WHAT THIS DELIBERATELY DOES NOT DO ────────────────────────────────────
 * It does not fire on a trace with a handoff. Two agents inside one trace is
 * real -- the rail draws them as two rows for exactly that reason -- and there
 * the actor is the most important word on the line, because the question a
 * reader has is which of them did this. Same for a trace that fell back to a
 * second model: the model becomes the news the moment it varies, which is
 * precisely when a reader needs it.
 *
 * A single row is never a constant either. One row cannot repeat anything, and
 * a trace of one call is a page where the lead is the only place the fact
 * appears at all.
 *
 * ── AND THE FOLD I MEASURED FOR, AND THEN DID NOT BUILD ───────────────────
 * The same trace shows three searches in a row returning nothing:
 *
 *   Ran themes.list                0 results
 *   Ran brain.search_decisions     "design language" - 0 results
 *   Ran prd.search                 "design system" - 0 results
 *
 * which reads as an agent flailing and is the opposite: a deliberate
 * three-store check before refusing to assert conformance. It looked like a
 * case for folding the run into one sentence naming the stores, and it is
 * common enough to be worth it -- **91 of 903 traces hold a run of two or more
 * consecutive empty reads, 37 of them three or more.**
 *
 * It is not built, because the agent already writes that sentence. The very
 * next row's thought on this trace is *"No evidence of a standing design system
 * exists in themes, decisions, or PRDs"* -- better than anything the machinery
 * could assemble, and guaranteed to be there, because the loop alternates
 * thought and action so a model step always follows a run of calls.
 *
 * What was actually wrong is that this sentence sat truncated in the grey sub
 * under a lead reading "Critique called qwen/qwen-plus". Promoting it is the
 * whole fix. A generated summary on top of it would be a third saying of one
 * thing and the machinery talking over the only voice on the page that did the
 * work -- which is the rule `the-blocker-it-already-named.ts` states and this
 * would have broken one layer down.
 */

/** What one row would have led with. Null where the row has no such fact. */
export type RowFacts = {
  /** The display name of whoever acted. */
  actor: string | null;
  /** The model, on rows that called one. Tool rows pass null. */
  model: string | null;
};

/**
 * The facts this trace repeats on every row, and therefore must not lead with.
 *
 * A field is returned only when EVERY row that has one has the SAME one, and
 * there are at least two such rows. Null means "this varies, or there is not
 * enough of it to be a repetition" -- and in both cases the caller keeps the
 * fact in the lead, which is the safe direction: the cost of leaving a constant
 * in is a dull row, and the cost of dropping a varying one is a reader who
 * cannot tell two agents apart.
 */
export function whatEveryRowRepeats(rows: readonly RowFacts[]): RowFacts {
  return {
    actor: theOneValue(rows.map((r) => r.actor)),
    model: theOneValue(rows.map((r) => r.model)),
  };
}

/**
 * The single value shared by every row that has one, or null.
 *
 * ROWS WITHOUT THE FACT ARE SKIPPED, NOT COUNTED AS DISAGREEMENT. Half the
 * rows in a trace are tool calls and carry no model; treating their null as a
 * second value would mean no trace ever had a constant model, and the rule
 * would never fire on the one page it was written for.
 */
function theOneValue(values: readonly (string | null)[]): string | null {
  const present = values.filter((v): v is string => typeof v === "string" && v.length > 0);
  /* TWO, because one row cannot repeat itself -- and on a one-row trace the
     lead is the only place the fact appears at all. */
  if (present.length < 2) return null;
  const first = present[0]!;
  return present.every((v) => v === first) ? first : null;
}
