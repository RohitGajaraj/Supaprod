// Plan · pure formatting helpers, no server calls.
//
// 2026-08-10, THE DOCUMENT PASS. This file held EIGHT exported functions and
// FOUR of them had no consumer anywhere in `src/`: `stateChip`, `citesLabel`,
// `specRecommendation` and `measureCaps`. A fifth, `splitCitationMarkers`, had
// none either, and it was the one that mattered most: the spec body printed
// `[n]` as literal characters on screen while the splitter that would have
// turned them into real chips sat here, written, tested and never called.
//
// The rule applied to all five was WIRE OR DELETE, and it went four to one:
//   WIRED   `splitCitationMarkers`, by SpecProse (src/components/prds).
//   DELETED `stateChip` and its two types, `citesLabel`, `specRecommendation`,
//           `measureCaps`. All four spoke the RETIRED vocabulary this surface
//           was redesigned out of: mono all-caps labels ("CRITIC REVIEW",
//           "3 SOURCES", an upcased measure) and the moss/marigold/glacier tone
//           names, which are not `--sp-*` tokens and cannot be rendered by any
//           primitive in the shell. Keeping them would have meant keeping a
//           second, unreachable spelling of every word the board and the spec
//           row already print.
//
// What replaced the deleted set is `specStateWords`, which was living as a
// private function inside plan.index.tsx while the spec editor one file away
// printed the raw database enum. A word that has to read the same on two
// surfaces belongs to neither of them.

/**
 * Strip the machine "[auto]" prefix from a title at render. Auto-triggered
 * missions/decisions carry this prefix for dedup; it must never reach the
 * user. Call this on ANY title that may have come from the trigger pipeline.
 * Idempotent and cheap (regex test + replace).
 */
export function stripAutoPrefix(title: string): string {
  return title.replace(/^\[auto\]\s*/i, "").trim();
}

/**
 * THE SAME MARKER, WHEREVER IT SITS, WHICH IS NOT ONLY AT THE FRONT.
 *
 * `stripAutoPrefix` above is anchored with `^`, and that was right for the case
 * it was written for: a title the trigger pipeline stamped. **It is wrong for
 * text the loop composed.** Evidence lines carry the marker mid-sentence -
 * "From [auto] Investigate the ..." - and an anchored strip leaves it there.
 *
 * S1 found this on `/inbox` and fixed it in a function private to that
 * route. THAT ROUTE FOLDS (SURFACE-MAP, R-04), so the fix would have died with
 * the door, which is the thing this lane exists to stop. It lives here now,
 * beside the family it belongs to, and outlives any surface.
 *
 * ── IT IS NOT ONLY A DISPLAY CONCERN ───────────────────────────────────────
 * The board's duplicate detection keys on a normalised title. With the anchored
 * strip, "Investigate the flake" and "From [auto] Investigate the flake" are
 * two different subjects, so the same request raised twice is counted twice and
 * the note that exists to say "this is the same work" stays silent on the exact
 * case it was built for. A marker that is never content must never be key
 * material.
 *
 * ── WHY THIS IS SAFE TO DO GLOBALLY ────────────────────────────────────────
 * `[auto]` is not English and it is not a subject. It marks a call the loop
 * raised itself, it is never copy for a person, and no title legitimately
 * contains the literal token. There is no string this can merge that a reader
 * would call distinct.
 */
export function stripAutoMarkers(text: string): string {
  return text.replace(/\[auto\]\s*/gi, "").trim();
}

/**
 * The same strip, for a value that may be null or undefined.
 *
 * WHY THIS EXISTS. An audit on 2026-08-05 found roughly thirty surfaces
 * rendering a raw title, against twenty-three that stripped correctly, and the
 * telling part was WHERE they sat: `today.tsx` strips on lines 347 and 351 and
 * leaks on 460. `DecisionDetail.tsx` strips on 286 and leaks on 409.
 * `RunBoard.tsx` strips the visible lead on 523 and leaks into the tooltip and
 * the accessible name on 528. The strip and the leak are neighbours, written by
 * the same hand in the same pass.
 *
 * So the problem was never carelessness, it was that the call was optional and
 * the nullable case made it awkward: `t ? stripAutoPrefix(t) : t` at every site
 * is exactly the kind of noise people drop. This overload removes the excuse.
 *
 * The real fix is that the marker is leaving the data entirely (migration
 * 20260805120000 moves provenance to `decisions.auto_origin` and
 * `missions.auto_trigger_source`). This helper stays afterwards as the belt to
 * that migration's braces: rows written before it, and any future writer that
 * reintroduces a prefix, still cannot reach a human.
 */
export function cleanTitle<T extends string | null | undefined>(title: T): T {
  return (typeof title === "string" ? stripAutoPrefix(title) : title) as T;
}

/**
 * Whether a stored title carries the machine "[auto]" origin prefix. Pairs with
 * `stripAutoPrefix`: strip the prefix for the visible text, then use this to
 * decide whether to show a small "Auto" provenance chip, so a user or an agent
 * can tell the item was raised by the loop itself, without the raw prefix ever
 * leaking into the copy.
 */
export function isAutoTitle(title: string | null | undefined): boolean {
  return /^\[auto\]\s*/i.test(title ?? "");
}

/**
 * `prds.status` in plain words, for every surface that shows a spec.
 *
 * THE DEFECT IT CLOSES, and it is a one-word one that survived three passes.
 * This function lived as a private helper inside plan.index.tsx, where the spec
 * ROW read "In review · serves the bank-link bet". One file away, the spec
 * EDITOR'S own subtitle printed `{prd.status}` raw, so the same document read
 * "In review" on the list you clicked and "review" on the page you landed on:
 * the raw database enum, lowercase, as the second-highest line on the largest
 * surface in the product.
 *
 * A word that must read the same on two surfaces cannot be private to one of
 * them. Unrecognised values fall to "Drafting" rather than echoing the column,
 * because the check constraint is ('draft','review','approved','shipped') and
 * anything outside it is a row nobody wrote through the product.
 */
export function specStateWords(status: string): string {
  if (status === "shipped") return "Shipped";
  if (status === "approved") return "Approved";
  if (status === "review") return "In review";
  return "Drafting";
}

/**
 * LOOM QA R2: display label for a decision in a picker. Stored titles can
 * carry the machine "[auto]" prefix and can already be long; strip the prefix
 * at render and, when trimming, cut on a word boundary (never mid-word) with
 * an ellipsis. Callers keep the untouched title in a `title=` attribute.
 */
export function decisionOptionLabel(title: string, max = 96): string {
  const t = stripAutoPrefix(title);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
}

export type BodySegment = { type: "text"; value: string } | { type: "citation"; index: number };

/**
 * Split prose on inline `[n]` citation markers into text/citation segments, so a
 * renderer can replace each marker with a real citation chip without touching
 * anything else in the string (code fences, other bracket text). It only runs
 * over already-parsed markdown text nodes, never raw markdown source.
 *
 * WIRED 2026-08-10, having shipped unused since it was written. See SpecProse.
 */
export function splitCitationMarkers(text: string): BodySegment[] {
  const segments: BodySegment[] = [];
  const pattern = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "citation", index: Number(match[1]) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: "text", value: text.slice(lastIndex) });
  return segments;
}

/**
 * THE READING BUDGET, AND WHY A DOCUMENT SURFACE OWES ONE.
 *
 * WHAT THE RESEARCH SAYS, measured across a corpus of product-operator
 * conversation rather than asserted. Two findings, and they point the same way.
 *
 *   1. ASYNC DISTRIBUTION OF A LONG DOCUMENT SIMPLY DOES NOT WORK. A Stripe PM,
 *      on the practice adopted from Amazon: "When you are all so busy and
 *      someone's like, 'I wrote a doc,' you send it into the Slack ecosystem and
 *      everyone goes, 'Please give feedback.' You have so much going on... You'll
 *      be lucky to maybe get a response." Blunter, from the same corpus: anything
 *      longer than a short crisp format "simply won't get read, so all the effort
 *      writing it is wasted."
 *   2. WHAT REPLACED IT IS THE FORCED SILENT READ, in the room, on the clock.
 *      The executive preference, verbatim: "I prefer a doc. I want no upfront
 *      explanation. I want 10 minutes of quiet reading time, and then we can come
 *      back together."
 *
 * So the job of this document is not to be browsable or searchable. It is to be
 * READ STRAIGHT THROUGH IN ONE SITTING WITH NO NARRATOR, and the constraint that
 * follows is a LENGTH BUDGET rather than better navigation. Ten minutes is the
 * number an operator actually said out loud, so ten minutes is the budget.
 *
 * WHY 220 WORDS PER MINUTE. Silent reading of ordinary prose sits in the
 * 200-250 band for adults; 220 is the middle of it and it is stated here rather
 * than buried so the next reader can argue with the number instead of guessing
 * at it. It is deliberately NOT tuned per spec: a budget that moves is not a
 * budget. The consequence is a 2,200-word ceiling, which is roughly the length
 * of the product-review documents the same corpus defends as legitimately long.
 *
 * `over` is the only judgment this returns, and everything else is arithmetic.
 * The caller decides what to do about it; this decides nothing.
 */
export const READ_WORDS_PER_MINUTE = 220;
export const READ_BUDGET_MINUTES = 10;

export type ReadingLoad = {
  words: number;
  /** Whole minutes, floored to 1 for any document that has words in it at all. */
  minutes: number;
  /** True once the document can no longer be read inside the budget. */
  over: boolean;
  /** How many words would have to go. Zero when inside the budget. */
  overBy: number;
};

export function readingLoad(body: string): ReadingLoad {
  // Markdown syntax is not read aloud, so it is not counted: a heading's `##`
  // and a list's `-` would otherwise inflate a structured spec against a prose
  // one that says the same amount.
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~|-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const budget = READ_BUDGET_MINUTES * READ_WORDS_PER_MINUTE;
  return {
    words,
    minutes: words === 0 ? 0 : Math.max(1, Math.round(words / READ_WORDS_PER_MINUTE)),
    over: words > budget,
    overBy: Math.max(0, words - budget),
  };
}

/**
 * THE FIRST LINE, PULLED OUT SO A SURFACE CAN GIVE IT ITS WEIGHT.
 *
 * From the same corpus, a famed operator on written argument: "the hardest part
 * of writing a brief... was the first paragraph. If I could write that first
 * paragraph really well, the chance I would win the case... would go through the
 * roof." He spent one week of three on it.
 *
 * On a spec read silently under time pressure with nobody to explain it, the
 * opening sentence is the highest-leverage text on the surface: it is the only
 * part guaranteed to be read. So the surface can show a writer exactly what a
 * reader will meet first, and it needs the sentence isolated to do that.
 *
 * A LEADING HEADING IS SKIPPED, because a title is not an argument. What comes
 * back is the first sentence of the first real paragraph, or null when the
 * document has not started yet.
 */
export function openingLine(body: string): string | null {
  return firstProse(body)?.text ?? null;
}

/**
 * Where that same line STARTS, as a character offset into `body`.
 *
 * The renderer needs this rather than the text. Marking the lede by walking the
 * rendered output and flipping a flag on the first paragraph it draws is wrong
 * in a way that only shows up sometimes: React may render a subtree more than
 * once for one commit, and a flag set on the first pass leaves the second pass
 * with no lede at all. Markdown nodes carry their source position, so the first
 * paragraph can be identified by WHERE IT IS rather than by when it was drawn,
 * which is the same answer every time.
 *
 * Matching on the text instead would have been the other tempting fix and it is
 * also wrong: `openingLine` returns the source sentence, markup and all, while
 * the renderer has already turned `**We**` into an element, so a paragraph
 * opening with emphasis would never match itself.
 */
export function firstProseOffset(body: string): number | null {
  return firstProse(body)?.offset ?? null;
}

/**
 * The first line of real prose: its first sentence, and where the line begins.
 * A heading, a rule, a list bullet, a quote marker or a numbered item is
 * STRUCTURE rather than the opening argument, so the walk steps over all of
 * them. Shared by the two exports above so they can never disagree about which
 * line is the first one.
 */
function firstProse(body: string): { text: string; offset: number } | null {
  let offset = 0;
  for (const rawLine of body.split("\n")) {
    const lineStart = offset;
    offset += rawLine.length + 1;
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(#{1,6}\s|---|\*\*\*|___|[-*+]\s|>\s|\d+\.\s)/.test(line)) continue;
    // First sentence, or the whole line when it carries no terminator.
    const stop = line.search(/[.!?](\s|$)/);
    const sentence = stop === -1 ? line : line.slice(0, stop + 1);
    const clean = sentence.replace(/^[*_`]+|[*_`]+$/g, "").trim();
    if (clean.length === 0) return null;
    return { text: clean, offset: lineStart + rawLine.indexOf(line) };
  }
  return null;
}
