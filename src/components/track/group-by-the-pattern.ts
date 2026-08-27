/**
 * GROUP EVIDENCE BY THE PATTERN IT NAMES, NOT BY WHAT THE TRACK HAPPENS TO HOLD.
 *
 * -- WHAT WAS ON SCREEN ----------------------------------------------------
 * The Discover pane grouped a signal under a theme only when that theme was
 * itself a member of the same track, and put every other signal in a section
 * headed "N pieces of evidence do not sit with a pattern yet."
 *
 * Measured over the 1,133 signals attached to tracks:
 *
 *     1,133  carry a theme_id
 *       315  that theme is also a member of the same track
 *       818  it is not
 *         0  no theme at all
 *
 * So that sentence was false for 818 of the 818 signals it described, and true
 * for none of them. Every one of them sits with a pattern; the track simply did
 * not have the theme row attached, which is a fact about our wiring and not
 * about the evidence.
 *
 * -- THE NAME WAS ALREADY HERE ---------------------------------------------
 * F-129 resolves `theme_title` on the signal row itself, for every signal,
 * membership or not. The pane has been holding the pattern's name for all 1,133
 * and drawing it for 315.
 *
 * -- THREE OUTCOMES, BECAUSE THE MIDDLE ONE IS NOT THE OTHER TWO -----------
 * `member`   the theme is on this track, so its own card can be drawn, with
 *            everything the record knows about it.
 * `named`    the theme is not on this track but the signal names it and we have
 *            its title. It is grouped under that name, and no theme card is
 *            drawn because there is no theme artifact here to draw.
 * `unnamed`  no theme at all, or a theme whose title we could not read. Only
 *            these are honestly "not yet grouped".
 *
 * `clustered-into.ts` keeps the fail directions apart at the card level and the
 * same distinction is preserved here: an ABSENT `theme_title` is a read that
 * failed, a null one is a theme that is genuinely gone. Neither is invented
 * into a group, because a group named "we could not read this" is worse than an
 * ungrouped card.
 */

/** The subset of an artifact view this grouping reads. */
export type GroupableSignal = {
  artifactId: string;
  fields: Record<string, unknown>;
};

export type PatternGroup<T> = {
  /** The theme id every signal in this group names. */
  themeId: string;
  /** The pattern's name, when the record gave us one. */
  title: string | null;
  /** Whether the theme artifact is on this track and can be drawn in full. */
  hasCard: boolean;
  signals: T[];
};

export type Grouping<T> = {
  groups: PatternGroup<T>[];
  /** Signals naming no readable pattern. Only these are "not yet grouped". */
  ungrouped: T[];
};

const text = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);

/**
 * Group signals by the pattern they name.
 *
 * `themeIdsOnTrack` is the set whose theme artifact this pane can draw. Order
 * is stable and deliberate: groups whose card we hold come first, because they
 * are the ones a person can open, then the named groups, each in the order its
 * first signal appeared.
 */
export function groupByThePattern<T extends GroupableSignal>(
  signals: readonly T[],
  themeIdsOnTrack: ReadonlySet<string>,
): Grouping<T> {
  const byId = new Map<string, PatternGroup<T>>();
  const ungrouped: T[] = [];

  for (const s of signals) {
    const themeId = text(s.fields.theme_id);
    if (!themeId) {
      ungrouped.push(s);
      continue;
    }
    const hasCard = themeIdsOnTrack.has(themeId);
    const title = text(s.fields.theme_title);

    // A pattern we can neither draw nor name is not a pattern a person can
    // read. Left ungrouped rather than gathered under a blank heading.
    if (!hasCard && !title) {
      ungrouped.push(s);
      continue;
    }

    const existing = byId.get(themeId);
    if (existing) {
      existing.signals.push(s);
      if (!existing.title && title) existing.title = title;
    } else {
      byId.set(themeId, { themeId, title, hasCard, signals: [s] });
    }
  }

  const groups = [...byId.values()];
  groups.sort((a, b) => Number(b.hasCard) - Number(a.hasCard));
  return { groups, ungrouped };
}
