/**
 * Whether a bet's title reads as a sentence a person would type to start
 * work, or as a cluster name wearing a card.
 *
 * P-14 (A-QUEUE.md), A1 live on `supaprod.ai`, 2026-09-03: two of three
 * top-ICE cards on Start read "Redundant Data Entry" and "Competitors
 * Advancing Software & Ecosystems" -- the theme's own Title-Case name,
 * written straight into `opportunities.title` by the automatic cluster-to-
 * bet write. The good example on the same screen, "Skip the address
 * re-confirm when nothing changed", is what a sentence actually looks like:
 * lowercase after the first word, an imperative verb doing the work.
 *
 * PURE, so both sides of the fix can share one rule rather than drift into
 * two: the write side (`trigger-tick.ts`) uses it to decide whether a
 * model-authored title is worth keeping before it commits the row, and the
 * read side (`discovery.functions.ts`'s `listTopOpportunities`) uses it as
 * the safety net A1's own ruling names -- "a bet whose title is not a
 * sentence does not qualify for a card" -- so a title that slips past the
 * write-side check (a stale row from before this fix, a retry that still
 * came back wrong) never reaches Start either.
 *
 * THE HEURISTIC: Title Case capitalises nearly every significant word
 * ("Redundant Data Entry", "Competitors Advancing Software & Ecosystems");
 * a written sentence capitalises only its first word and any proper nouns,
 * which is a small minority of the words in it. Counted, not guessed: of
 * the words after the first, more than `TITLE_CASE_FLOOR` starting with a
 * capital reads as Title Case rather than prose.
 */
const TITLE_CASE_FLOOR = 0.3;

/** Words too short to carry the signal either way ("a", "of", "&"). */
function isSkippable(word: string): boolean {
  const letters = word.replace(/[^a-zA-Z]/g, "");
  return letters.length === 0;
}

export function looksLikeASentence(title: string): boolean {
  const words = title
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  // Too short to be the kind of sentence this product's bets read as
  // ("Skip the address re-confirm when nothing changed" is seven words).
  if (words.length < 3) return false;

  const rest = words.slice(1).filter((w) => !isSkippable(w));
  if (rest.length === 0) return true;

  const capitalised = rest.filter((w) => /^[A-Z]/.test(w)).length;
  return capitalised / rest.length <= TITLE_CASE_FLOOR;
}
