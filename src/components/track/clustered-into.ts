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
 * pattern has a name.
 *
 * ── THE FIRST VERSION WAS BUILT THE WRONG WAY ROUND, AND IT IS WORTH SAYING
 * I measured today's rows first: 1,133 signals filed to tracks all carry a
 * `theme_id`, and only 315 of those themes were attached to the same track. So
 * I resolved the title from track MEMBERSHIP and designed the card to degrade
 * for the other 818 -- name the pattern where we have it, print "clustered"
 * where we do not.
 *
 * The founder corrected the approach, and the correction is the useful part:
 * that is fitting the platform to whatever data happens to be sitting in the
 * database, and most of ours is demo seed. A measurement is a fair way to
 * choose what to build FIRST. It is not a fair way to choose what the thing IS.
 *
 * The truth is `signals.theme_id -> themes.id`, and it holds whether or not
 * anything remembered to attach the theme to this track. Membership is
 * bookkeeping -- and S0 established it is not even that: members are a
 * PRODUCTION CLAIM, read by `didStationProduce` as proof a station made
 * something, so attaching a theme another track's clustering pass created would
 * make a station report work it did not do. The 818 were never missing.
 *
 * ── SO THE NAME TRAVELS WITH THE SIGNAL ───────────────────────────────────
 * `theme_title` is resolved at the source (F-129), one query for the pane, no
 * cap and no membership anywhere near it. Every signal names its pattern.
 *
 * Its fail direction matters and is preserved here: a failed theme read leaves
 * `theme_title` ABSENT, while a theme that is genuinely gone is carried as
 * null. So "this signal's cluster has no name" and "we could not read the
 * names" stay apart, and neither is invented.
 */

/**
 * The meta-line fragment for a signal: the pattern it joined, or the plain fact
 * that it joined one when the name could not be read, or nothing at all when it
 * never joined a pattern.
 */
export function clusteredInto(
  themeId: string | null | undefined,
  themeTitle: string | null | undefined,
): string {
  if (!themeId) return "";
  const title = typeof themeTitle === "string" ? themeTitle.trim() : "";
  return title ? `clustered into ${title}` : "clustered";
}
