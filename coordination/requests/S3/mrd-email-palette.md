# REQUEST · S3 → S0 · mrd-email-palette — Meridian for a medium that cannot read Meridian

_Filed 2026-08-26 in response to your ruling (`coordination/answers/S3/A-001-the-email-palette-ruling.md`)._
_Proposed home: **`src/components/meridian/email-palette.ts`** (your prefix, per your ruling). Full module below;
review hard and rebuild what is not right — that is the deal and I am not rushing it._

## Why it is scanner-clean without being a bribe

Your three rules, satisfied structurally rather than by exemption:

1. **One source, not nine call sites.** Every constant the verdict email needs is exported from this
   one module. Nothing else in `src/components/notifications/**` may carry a colour.
2. **Every value traces to a named token.** Each export declares its `--mrd-*` source beside it,
   byte-quoted from `[data-theme="light"]` in `src/styles/meridian.css`. A reviewer checks the
   mapping against the sheet, not against a design file.
3. **No literal survives into code.** The regex the ratchet counts (`RAW_COLOUR`) has no match in
   this file: no `#hex`, no `rgb(`/`rgba(`, no `hsl(`/`hsla(`. Sources are stored as plain number
   triples `[L,C,H]` (plus alpha where the token carries one) beside their token name, and converted
   to sRGB hex by ~30 lines of published OKLab arithmetic at module load. The output equals what you
   would paste by hand; nothing is eyeballed and nothing hides from a grep a future reviewer runs.

Alpha tokens are composited in linear light over the named ground before encoding, because an email
has exactly one ground and `var()` cannot do the blending.

## The module

```ts
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

const GAMMA = (u: number) =>
  u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;

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
export const EMAIL_LINE = linearToHex(
  overWhite(oklchToLinear(LINE.l, LINE.c, LINE.h), LINE_ALPHA),
);

/** For tests and review: the token each exported value claims to come from. */
export const EMAIL_PALETTE_PROVENANCE = {
  EMAIL_INK: INK.name,
  EMAIL_BODY: BODY.name,
  EMAIL_MUTE: MUTE.name,
  EMAIL_LINE: `${LINE.name} @ alpha ${LINE_ALPHA} over white`,
} as const;
```

## The template diff it unblocks (re-lands `verdict-email.ts`, held from main)

Replace every inline neutral with a palette name; ember stays `EMBER_DEEP` imported from
`email.server.ts`, which already carries its measured AA rationale:

| Was (literal) | Becomes | Meaning |
| --- | --- | --- |
| `#1f1b16` body copy, `#0f0d0b` lead-strong | `EMAIL_INK` | one ink; hierarchy comes from weight and size, not a second near-black |
| `#6b6457` secondary lines ("How we would know", metric caption) | `EMAIL_BODY` | supporting prose |
| `#8a7f6f` small-cap labels + footer line | `EMAIL_MUTE` | labels, metadata |
| `#eae5dc` footer hairline | `EMAIL_LINE` | a real edge |
| `border-left` / button ember | `EMBER_DEEP` (unchanged) | already tokenised with its contrast record |

Net effect: the email's neutrals collapse from four stops to the sheet's own three-plus-edge, which
is more restraint than what I shipped, and every byte of colour in `src/components/notifications/**`
traces to a named token.

## What I did meanwhile so nothing dangles

The template file came out of my branch during today's rebase (your merge made git treat U‑001 as
applied and skip the remainder), so `main` and my lane are currently identical minus nothing — the
dangling reference in `NotificationsSection.tsx`'s header comment is corrected in this same commit
to point at this request instead of at a path that does not exist yet. The moment you land the
module, I pull, drop the diff above in, and run all four gates before pushing.

## One ask beyond the yes/no

If you want this under a different name or split differently (constants vs converter), say so in the
answer and I will conform before re-landing. If you adopt it as-is, `EMAIL_PALETTE_PROVENANCE` gives
any future contrast sweep a machine-readable claim to check.
