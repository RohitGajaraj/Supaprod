/**
 * WHICH PATTERN A SIGNAL WAS CLUSTERED INTO.
 *
 * ── WHAT THE CARD SAID ────────────────────────────────────────────────────
 * A signal in the run's Discover pane ended its meta line with the bare word
 * "clustered". True, and it withholds the only interesting part. SESSION-1 asks
 * this pane for "signals arriving as cards with their real text and source,
 * then visibly grouping into themes as clustering runs", and calls that "the
 * single most convincing thing in the product, because it is the machine
 * finding a pattern in front of you". A state word is not a pattern. The
 * pattern has a name, and the name is one row away.
 *
 * ── WHY NAMING IT RATHER THAN GROUPING THE LIST ───────────────────────────
 * Grouping was the first idea and the data refused it. Measured across every
 * signal filed to a track: 1,133 of 1,133 carry a `theme_id`, and only 315 of
 * those themes are members of the SAME track. Grouping the pane by theme would
 * put 818 signals under a heading the pane cannot name, which trades a word
 * that withholds for a heading that lies.
 *
 * Naming degrades honestly instead. Where the theme was filed to this track the
 * card says which pattern took it; where it was not, the card says it was
 * clustered and stops, exactly as it does today. Nothing is claimed that a row
 * on this track does not carry.
 *
 * ── AND IT IS NOT A SECOND SOURCE OF TRUTH ────────────────────────────────
 * The title comes from the theme member the chain already returns, the same
 * object the pane renders as a `ThemeCard` further down the list. A card and
 * its neighbour cannot disagree about a theme's name because they are reading
 * the same row.
 */

/** The little the lookup needs from a chain member. */
export type ThemeLike = {
  kind: string;
  artifactId: string;
  title?: string | null;
  missing?: boolean;
};

export type StopLike<T> = { items: readonly T[] };

/**
 * Every theme this track filed, by id.
 *
 * `missing` rows are excluded for the reason the chain draws the distinction at
 * all: it means the lookup ran and the row was not there, so there is no title
 * to show and claiming one would be an invention.
 */
export function themesOnTrack<T extends ThemeLike>(
  stops: readonly StopLike<T>[] | undefined,
): Map<string, string> {
  const byId = new Map<string, string>();
  if (!stops) return byId;
  for (const stop of stops) {
    for (const it of stop.items) {
      if (it.kind !== "theme" || it.missing) continue;
      const title = typeof it.title === "string" ? it.title.trim() : "";
      if (title) byId.set(it.artifactId, title);
    }
  }
  return byId;
}

/**
 * The meta-line fragment for a signal: the pattern it joined, or the plain fact
 * that it joined one, or nothing at all when it never did.
 */
export function clusteredInto(
  themeId: string | null | undefined,
  themes: ReadonlyMap<string, string> | undefined,
): string {
  if (!themeId) return "";
  const title = themes?.get(themeId);
  return title ? `clustered into ${title}` : "clustered";
}
