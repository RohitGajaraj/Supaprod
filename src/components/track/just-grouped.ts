/**
 * WHETHER A PIECE OF EVIDENCE JUST JOINED A PATTERN.
 *
 * SESSION-1 asks the Discover pane for evidence "visibly grouping into themes
 * as clustering runs", and calls it "the single most convincing thing in the
 * product, because it is the machine finding a pattern in front of you". The
 * pane animated a NEW theme arriving and nothing else, so the commoner half of
 * that event was silent: a pattern that already existed and then gained a
 * signal moved the card out of "not yet grouped" and under the theme with no
 * motion at all.
 *
 * -- IT IS A CHANGE, NOT A STATE, AND THAT IS THE WHOLE RULE ---------------
 * Animating "this signal has a theme" would fire on every poll for every
 * grouped signal forever, which is a clock wearing a data field. Animating a
 * CHANGE fires once, when a row actually changed, which is what SPEC-PRESENCE
 * requires: "Presence is read, never staged. No timers. No scripted
 * sequences." A state the data cannot prove is a state you do not draw.
 *
 * -- THE THREE THINGS IT REFUSES TO CALL AN ARRIVAL ------------------------
 * A signal seen for the FIRST time (`before === undefined`) does not animate,
 * because the first page of data is history rather than an event. This is the
 * transcript's own rule and the reason its `seen` set is primed on first paint.
 *
 * A signal LEAVING a theme does not animate. It is a real change and it is not
 * a grouping, and drawing the two the same way would make an ungrouping look
 * like the machine finding something.
 *
 * A signal that has always sat in the same theme does not animate, however
 * many times it is polled.
 */

/**
 * True only when this signal moved INTO a theme since it was last seen.
 *
 * `before` is the theme it was last drawn in, `""` for none and `undefined`
 * for never seen. `now` is where it sits this render, `""` for none.
 */
export function justGrouped(before: string | undefined, now: string): boolean {
  if (before === undefined) return false;
  if (now === "") return false;
  return before !== now;
}
