/**
 * PROMOTED INTO MERIDIAN 2026-08-26 by S0, authored by S3.
 *
 * REVIEWED HARD, because a primitive is used by every future surface and a
 * mediocre one is a debt charged forever. All four triples were checked
 * byte-for-byte against `src/styles/meridian.css` before this entered:
 * `--mrd-ink` :1343 · `--mrd-body` :1349 · `--mrd-mute` :1350 ·
 * `--mrd-line` :1361 (alpha 0.14). S3 took the LIGHT-ground values, which is
 * correct and is the easy thing to get wrong here — the file's default block
 * (:290-350) is the DARK ground, and an email renders on white.
 *
 * WHAT I ADDED, AND IT IS THE ONLY CHANGE: the drift guard. S3's module keeps
 * itself in sync with the sheet by a comment saying "change both in the same
 * commit". That is prose, and F-74 is this repo's record of prose holding only
 * half the time — the same failure that produced F-76, F-80 and F-81 today, each
 * a number true when written that nobody re-ran.
 * `email-palette.drift.test.ts` now reads `meridian.css` and fails if any triple
 * here stops matching the token it names. **The rule is mechanical now.**
 */
/**
 * THE EMAIL PALETTE. Meridian for the one medium that cannot read Meridian.
 *
 * Email clients strip CSS custom properties (Outlook drops them, Gmail ignores
 * them), so `var(--mrd-*)` does not survive the trip. This module is the bridge
 * the ratchet ruling of 2026-08-26 requires: every value here is DERIVED from
 * one named --mrd-* token, quoted byte-for-byte from [data-theme="light"] in
 * src/styles/meridian.css, and converted to sRGB by published OKLab arithmetic.
 * No hex, rgb or hsl literal exists in this file, so the Meridian ratchet counts
 * it at zero without any exemption: the guard is satisfied, not bypassed.
 *
 * THE PAPER GROUND IS THE SOURCE OF TRUTH because an email renders on white.
 * Dark-ground values are deliberately not offered: there is no dark email.
 *
 * TO RE-MAP OR RE-MEASURE, change the triple AND its token name together, and
 * re-read the note beside the token in meridian.css first. IF YOU CHANGE ONE
 * TOKEN THERE, CHANGE IT HERE IN THE SAME COMMIT - a palette that drifts from
 * the sheet is two palettes, which is the defect this module exists to prevent.
 */

/** oklch(L C H [/ alpha]) -> linear-light sRGB triplet, standard OKLab maths. */
function oklchToLinear(l: number, c: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

const GAMMA = (u: number) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);

function linearToHex(rgb: [number, number, number]): string {
  const byte = (u: number) =>
    Math.round(Math.min(1, Math.max(0, GAMMA(u))) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${byte(rgb[0])}${byte(rgb[1])}${byte(rgb[2])}`;
}

/** Alpha over a ground, composited in linear light, then encoded once. */
function overWhite(rgb: [number, number, number], alpha: number): [number, number, number] {
  return rgb.map((c) => c * alpha + 1 * (1 - alpha)) as [number, number, number];
}

type Token = { readonly name: string; readonly l: number; readonly c: number; readonly h: number };

/* ── THE TOKEN SOURCES. Each triple is the light-ground value of the token
   named beside it, copied from src/styles/meridian.css. ─────────────────── */

// --mrd-ink   oklch(0.22 0.012 70)   "the thing itself"
const INK: Token = { name: "--mrd-ink", l: 0.22, c: 0.012, h: 70 };
// --mrd-body  oklch(0.4 0.01 70)     "supporting prose"
const BODY: Token = { name: "--mrd-body", l: 0.4, c: 0.01, h: 70 };
// --mrd-mute  oklch(0.48 0.009 70)   "labels, metadata"
const MUTE: Token = { name: "--mrd-mute", l: 0.48, c: 0.009, h: 70 };
// --mrd-line  oklch(0.28 0.012 70 / 0.14)   "a real edge"
const LINE: Token = { name: "--mrd-line", l: 0.28, c: 0.012, h: 70 };
const LINE_ALPHA = 0.14;

const hexOf = (t: Token) => linearToHex(oklchToLinear(t.l, t.c, t.h));

export const EMAIL_INK = hexOf(INK);
export const EMAIL_BODY = hexOf(BODY);
export const EMAIL_MUTE = hexOf(MUTE);
/** --mrd-line composited over the email ground, which is always white (#fff
 *  by client default; the shell's body copy sits directly on it). */
export const EMAIL_LINE = linearToHex(overWhite(oklchToLinear(LINE.l, LINE.c, LINE.h), LINE_ALPHA));

/** For tests and review: the token each exported value claims to come from. */
export const EMAIL_PALETTE_PROVENANCE = {
  EMAIL_INK: INK.name,
  EMAIL_BODY: BODY.name,
  EMAIL_MUTE: MUTE.name,
  EMAIL_LINE: `${LINE.name} @ alpha ${LINE_ALPHA} over white`,
} as const;
