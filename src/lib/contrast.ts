/**
 * OKLCH TO A CONTRAST RATIO, SO AA IS A TEST RATHER THAN A MEASUREMENT.
 *
 * ── WHY THIS EXISTS (F-140) ────────────────────────────────────────────────
 * S4 reported `--mrd-mute` at **4.43:1** on the station strip, missing AA by
 * 0.07 across 12 elements on 6 surfaces, and proposed nudging its lightness by
 * one hundredth. Meridian is S0's, so the change was mine to make.
 *
 * **I could not reproduce the number, so I did not make it.** Computed from the
 * tokens themselves, `--mrd-mute` (L 0.70) on the strip\'s actual ground
 * `--mrd-sheet` (L 0.175) is **7.10:1**, and it clears AA against every other
 * plausible ground in both themes:
 *
 *   ground          dark    light
 *   --mrd-bg        7.40    5.91
 *   --mrd-sink      7.56       -
 *   --mrd-sheet     7.10    6.27
 *   --mrd-lift      6.56       -
 *
 * There is no opacity on `.sp-stage`, `.sp-stage-n` or `.sp-stage-state`, and
 * `--mrd-mute` is declared in exactly three places, all in `meridian.css`. So
 * either their tool resolved a different ground, or something outside the token
 * layer is in play. **Nudging a product-wide token on a number I cannot
 * reproduce is the mistake this session has spent the night avoiding.**
 *
 * ── SO THE ANSWER IS AN INSTRUMENT, NOT AN EDIT ────────────────────────────
 * A one-off manual measurement settles one question once and must be redone by
 * hand every time a token moves. This makes the question answerable from the
 * repo: any future nudge that drops a text token below AA fails the build, in
 * both themes, without anyone opening a browser.
 *
 * It also gives S4 something to check their tool against. If the rendered value
 * and the token arithmetic disagree, **that disagreement is itself the finding**
 * and it is a more interesting one than the token.
 *
 * The conversions are the published formulae: OKLab to linear sRGB (Bjorn
 * Ottosson), sRGB companding, then WCAG 2.1 relative luminance and ratio.
 */

export type Oklch = { l: number; c: number; h: number };

/** OKLCH to gamma-encoded sRGB, each channel clamped to 0..1. */
export function oklchToSrgb({ l: L, c: C, h: H }: Oklch): [number, number, number] {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((v) => {
    const x = Math.min(1, Math.max(0, v));
    return x > 0.0031308 ? 1.055 * x ** (1 / 2.4) - 0.055 : 12.92 * x;
  }) as [number, number, number];
}

/** WCAG 2.1 relative luminance of a gamma-encoded sRGB triple. */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const f = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/**
 * The WCAG contrast ratio between two colours, 1 to 21.
 *
 * Order-independent by construction, because a ratio is a property of the pair
 * and a caller that has to remember which one is the text is a caller that will
 * eventually get it backwards.
 */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(oklchToSrgb(a));
  const lb = relativeLuminance(oklchToSrgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * WCAG AA for normal text.
 *
 * Large text is 3.0 and is deliberately NOT offered here: a helper that lets a
 * caller pick the easier bar is one where the easier bar gets picked.
 */
export const AA_NORMAL_TEXT = 4.5;
