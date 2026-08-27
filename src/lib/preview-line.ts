/**
 * A MULTI-LINE MARKDOWN BLOB, AS THE ONE LINE A ROW CAN ACTUALLY SHOW.
 *
 * ── WHY THIS LIVES IN `lib` AND NOT BESIDE ITS FIRST CALLER ────────────────
 * It started in `components/observe/` next to the surface that needed it, and
 * moved the moment the board's review card became its second caller: an import
 * reaching from `today/` into `observe/` is a component tree borrowing another
 * screen's folder, which is what S0 gave as the reason for `error-copy.ts` and
 * S1 for `plain-prose.ts`. **A pure function with no JSX deciding what the
 * product MAY SAY is policy, not presentation.** Two surfaces already agree
 * through it and a third will; none of them should have to know which screen
 * happened to need it first.
 *
 * ── WHAT A PERSON SEES TODAY ───────────────────────────────────────────────
 * `AnalyticsPanel` renders `ai_events.input_preview` straight into a `Row`
 * lead. The column holds whatever the model was sent or said, and that is
 * markdown. Measured against the live database 2026-08-27, over the 1,000
 * `ai_events` rows this account can see:
 *
 *     input_preview    939 non-empty,  24 carry **bold**
 *     output_preview   926 non-empty,  25 carry **bold**
 *     system_preview   939 non-empty,   0
 *
 * and the markers are not the half that hurts most. A real row reads:
 *
 *     ### Growth and Friction
 *     * **Conversion focus:** Simplifying the checkout...
 *
 * A row lead is ONE line. It gets the hash, the bullet, the asterisks and the
 * newlines, rendered as literal characters, and the sentence a person came for
 * starts forty characters in.
 *
 * This is the same family as the em dashes the founder has raised twice: a
 * machine's formatting reaching a screen that was never going to render it.
 *
 * ── WHY THIS IS NOT `plainProse`, AND MUST NOT BECOME A SECOND COPY OF IT ──
 * S1 built `plainProse` (src/components/track/plain-prose.ts) for a different
 * job on a different surface: unwrapping paired emphasis inside PROSE that
 * stays prose, in a pane that shows the whole text. It deliberately does not
 * touch structure, because there is none to remove there.
 *
 * A row lead is the opposite problem — the structure is the noise, and only
 * the first sentence survives the width. So this flattens, and where the two
 * overlap (paired `**`) they must agree.
 *
 * **WHEN `@/lib/plain-prose` REACHES THIS TREE, THE EMPHASIS STEP BELOW MUST
 * CALL IT** rather than keep its own copy — two spellings of one rule is how
 * the next person gets two answers from one string. It is not here yet: S1
 * landed it as RUN-91 (`c13c83dc3`) on their own lane, and it is not on main.
 * It moved OUT of `components/track/` deliberately, on S0's reasoning for
 * `error-copy.ts`: a pure function with no JSX deciding what the product MAY
 * SAY is policy, not presentation. So the import will not cross component
 * trees, and there is no reason left not to compose.
 *
 * ── WHERE TEXT MAY BE CLEANED AT ALL, WHICH IS THE RULE BEHIND ALL OF THIS ─
 * S1 and I made the same call independently on two surfaces and it generalises:
 * **clean where a person is READING; never where a person is VERIFYING, and
 * never where the string is on its way back into the record.** The `Pre`
 * blocks on this surface show what a model was actually SENT, so they stay
 * verbatim; a form's `value=` binding is round-tripping to storage, so it stays
 * raw. Both of those are lossy places to be helpful. A row lead and a card's
 * evidence are neither, which is why they are cleaned.
 *
 * ── UNDERSCORES ARE LEFT ENTIRELY ALONE, and that is S1's rule ─────────────
 * `_italic_` is real markdown and stripping it is defensible in general and
 * wrong in this codebase. These agents write column names, feature flags and
 * tool names constantly — `checkout_single_address` is on the board right now.
 * Removing a marker is cosmetic; corrupting an identifier makes the sentence
 * false. The same reasoning keeps backticks: a name in code font is a name.
 */

/** Paired emphasis around non-space content. Unpaired markers survive. */
const BOLD = /\*\*(?=\S)([^*]+?)(?<=\S)\*\*/g;
const ITALIC = /(?<![\w*])\*(?=\S)([^*\n]+?)(?<=\S)\*(?![\w*])/g;
/** Structure that opens a line: headings, bullets, quotes, list numbers. */
const LEADER = /^\s{0,3}(?:#{1,6}\s+|[-*+]\s+|>\s+|\d{1,3}[.)]\s+)/;

/**
 * THE SAME MARKERS REMOVED, WITH THE LINES LEFT WHERE THEY ARE.
 *
 * The board's review card pushes a decision's whole rationale into one
 * evidence fact, and evidence may never be truncated — a person is about to
 * approve on it. So this is the structure-preserving half: emphasis unwrapped,
 * line-leading markers dropped, every line kept.
 *
 * Measured 2026-08-27: 2 of the 39 decisions this account can see carry
 * markdown in `rationale`, and they carry DIFFERENT kinds — one
 * `**Product Objectives:**`, one `## Problem`. Unwrapping emphasis alone would
 * have fixed one of the two, which is why this drops leaders as well.
 *
 * `previewLine` is this plus "take the first line", so the two can never
 * disagree about what a marker is.
 */
export function plainMarkers(text: string | null | undefined): string {
  if (typeof text !== "string") return "";
  return text
    .split("\n")
    .map((raw) => raw.replace(LEADER, "").replace(BOLD, "$1").replace(ITALIC, "$1"))
    .join("\n")
    .trim();
}

/**
 * The first line worth showing, with its markers removed.
 *
 * EMPTY IN, EMPTY OUT. A caller that has nothing must keep saying so in its
 * own words — this never invents a placeholder, because "no preview was
 * recorded" is a claim about our data and belongs to the surface, not here.
 */
export function previewLine(text: string | null | undefined): string {
  if (typeof text !== "string") return "";
  for (const raw of text.split("\n")) {
    // A heading alone is a label for what follows, not the thing itself, so it
    // is skipped rather than shown: "### Growth and Friction" tells a reader
    // nothing the next line does not tell them better.
    const stripped = raw.replace(LEADER, "").trim();
    if (!stripped) continue;
    if (/^#{1,6}\s/.test(raw.trim())) continue;
    return stripped.replace(BOLD, "$1").replace(ITALIC, "$1");
  }
  return "";
}
