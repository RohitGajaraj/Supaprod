/**
 * WCAG CONTRAST, COMPUTED RATHER THAN ASSERTED.
 *
 * The landing palettes are module-local hex constants chosen by eye. Raised by
 * S4 on 2026-08-27, measured in a real browser against the shop window: twelve
 * text shapes on `/` sit below AA, and the worst are all SEVEN STATION NAMES at
 * 2.94:1 against a 4.5:1 floor. The product is told as three layers and seven
 * stations, and the home page renders that one idea as the least readable text
 * on the page. R-19 says accessibility is not deferred.
 *
 * WCAG HAS NO OBJECTION TO HIERARCHY, which is the part worth keeping straight.
 * A station nobody has reached yet SHOULD recede; that recession is the strip's
 * whole argument. What WCAG objects to is the floor. So the fix is the smallest
 * lift that clears 4.5:1 and keeps the three steps apart, not a flattening.
 *
 * This exists so the choice is CHECKED rather than eyeballed a second time.
 * Every number in the guard beside it is produced by this function from the
 * palette's own constants, so moving a colour moves the assertion with it and a
 * colour that drops below the floor fails before it ships.
 *
 * PURE, and deliberately a local implementation of the published formula rather
 * than a dependency: it is fifteen lines, it is frozen by a standard, and a
 * package would put a supply-chain surface under a colour check.
 */

/** sRGB 8-bit channel to linear light, WCAG 2.x definition. */
function linear(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** `#rgb` or `#rrggbb`, with or without the hash. Throws on anything else,
 *  because a silently-zero colour would make every ratio look like a pass. */
export function relativeLuminance(hex: string): number {
  const h = hex.trim().replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex colour: ${hex}`);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** The WCAG ratio, always >= 1, order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** AA for body text. Large text has a lower floor; nothing in these palettes is
 *  large, and assuming it were would be the reassuring direction. */
export const AA_TEXT = 4.5;
