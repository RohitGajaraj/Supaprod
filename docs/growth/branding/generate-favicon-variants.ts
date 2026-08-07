/**
 * Favicon weight ladder — the mark at avatar size, which is where it broke.
 *
 * WHY THIS EXISTS. `public/favicon.svg` shipped as `faviconIcon(0.96, 10)` and
 * was hand-copied: `faviconIcon` had zero callers anywhere in the repo, so the
 * generator and the artifact had drifted apart with nothing to pull them back.
 * That is the same failure that shipped the wrong OG card and the wrong icon
 * set on 2026-08-07, and it is now the fifth instance. This file re-attaches
 * the artifact to a generator AND makes the weight choice visible instead of
 * assumed.
 *
 * WHY THE SHIPPED VALUES ARE WRONG. mark.ts documents its own safe range in
 * the doc comment on `faviconIcon`:
 *
 *     fill  0.88 keeps the rounded corner readable; past ~0.92 the petals
 *           fatten and the gaps close
 *     sw    7 is crisp at 32px; 8.5 is bolder and wins at 16px
 *
 * The shipped call is fill 0.96 / sw 10. BOTH sit outside the bounds that same
 * file declares safe. The founder called the result "thickened" from a Resend
 * preview at ~48px, and he is reading it correctly: at that size the petal gaps
 * have closed into a solid rosette.
 *
 * THE REAL CONSTRAINT, which is the LinkedIn banner lesson in another medium.
 * One stroke width cannot serve a 32x size range. The distinction that matters
 * is WHICH FILE IS ASKED FOR AT WHICH SIZE:
 *
 *   - favicon-16.png / favicon-32.png / favicon.ico  -> the small end. A thin
 *     stroke literally disappears here, so these WANT the heavy treatment and
 *     are deliberately left alone by this script.
 *   - favicon.svg -> everything else. Browsers prefer the SVG when it is
 *     offered and scale it to whatever they need: bookmark bars, tab hover,
 *     PWA install prompts, and the sender avatar a mail client derives from
 *     the domain. That is a 48-256px job, not a 16px job, and it is the only
 *     file in the set currently tuned for the wrong end.
 *
 * So the ladder below only re-tunes the SVG. Nothing here touches the PNGs.
 *
 * OUTPUT is a variant set plus a side-by-side contact sheet at the two sizes
 * that actually matter. Nothing is overwritten (founder ruling 2026-08-07:
 * "create a fresh copy whatever you're doing... so that if I have to revert to
 * the whole one, I can just take a look at it"). Promotion to public/ is a
 * separate, explicit step.
 *
 * Run:  bun docs/growth/branding/generate-favicon-variants.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { faviconIcon } from "./mark.ts";

const OUT = join(import.meta.dir, "icons", "weight-ladder");
mkdirSync(OUT, { recursive: true });

/** The ladder. `id` is what appears under each cell on the contact sheet. */
const VARIANTS: { id: string; fill: number; sw: number; note: string }[] = [
  { id: "A-shipped", fill: 0.96, sw: 10, note: "what is live now; both values out of range" },
  { id: "B", fill: 0.92, sw: 8.5, note: "mark.ts's stated bold end" },
  { id: "C", fill: 0.9, sw: 7.5, note: "" },
  { id: "D", fill: 0.88, sw: 7, note: "mark.ts's stated crisp-at-32 value" },
  { id: "E", fill: 0.88, sw: 6, note: "" },
  { id: "F", fill: 0.86, sw: 5.2, note: "closest to the in-product mark (sw 3.2)" },
];

// The two renders that decide this. 48 is the sender-avatar size the founder
// was looking at in Resend; 96 is a retina bookmark/PWA tile and shows whether
// the petal gaps actually open up or just get thinner.
const SIZES = [48, 96] as const;

const svgFor = (v: (typeof VARIANTS)[number]) => faviconIcon(v.fill, v.sw);

for (const v of VARIANTS) {
  const svg = svgFor(v);
  writeFileSync(join(OUT, `favicon-${v.id}.svg`), svg);
  for (const size of SIZES) {
    await sharp(Buffer.from(svg), { density: 384 })
      .resize(size, size)
      .png()
      .toFile(join(OUT, `favicon-${v.id}-${size}.png`));
  }
  console.log(`${v.id.padEnd(10)} fill ${v.fill}  sw ${String(v.sw).padEnd(4)} ${v.note}`);
}

/* --- Contact sheet ----------------------------------------------------------
 * One row per size, one column per variant, on the same near-black the mail
 * client uses, so the comparison is made under the condition that produced the
 * complaint rather than on a white page where fat strokes flatter.            */
const CELL = 128;
const PAD = 24;
const ROW_H = CELL + PAD * 2;
const sheetW = PAD + VARIANTS.length * (CELL + PAD);
const sheetH = SIZES.length * ROW_H;

const composites: sharp.OverlayOptions[] = [];
for (const [r, size] of SIZES.entries()) {
  for (const [c, v] of VARIANTS.entries()) {
    // Render at the real size, then scale up with NEAREST so the sheet shows
    // the actual 48px pixel grid magnified. A smooth upscale would hide the
    // exact blobbing we are trying to judge.
    const png = await sharp(Buffer.from(svgFor(v)), { density: 384 })
      .resize(size, size)
      .png()
      .toBuffer();
    const shown = await sharp(png)
      .resize(CELL, CELL, { kernel: "nearest" })
      .png()
      .toBuffer();
    composites.push({
      input: shown,
      left: PAD + c * (CELL + PAD),
      top: r * ROW_H + PAD,
    });
  }
}

await sharp({
  create: {
    width: sheetW,
    height: sheetH,
    channels: 4,
    background: { r: 10, g: 10, b: 10, alpha: 1 },
  },
})
  .composite(composites)
  .png()
  .toFile(join(OUT, "_contact-sheet.png"));

console.log(`\ncontact sheet -> ${join(OUT, "_contact-sheet.png")}`);
console.log(`rows: ${SIZES.join("px, ")}px   cols: ${VARIANTS.map((v) => v.id).join(", ")}`);

/* --- Promotion --------------------------------------------------------------
 * `public/favicon.svg` was HAND-COPIED: faviconIcon had zero callers repo-wide,
 * so the generator and the shipped file had no link between them and the file
 * silently kept its stale geometry. This is the call that closes that loop, and
 * it is why the emit lives here rather than in a comment telling someone to
 * copy a file.
 *
 * The previous file is preserved next to the ladder before the write, never
 * discarded (founder ruling 2026-08-07: keep a copy so a revert is possible).
 *
 * ONLY the SVG is promoted. favicon-16.png, favicon-32.png and favicon.ico own
 * the small end and want the bolder treatment; icon-192/512 and
 * apple-touch-icon come from appIcon() at sw 3.2 and were never part of this
 * problem. Regenerating those here would be scope this change has not earned. */
const PUBLIC_SVG = join(import.meta.dir, "..", "..", "..", "public", "favicon.svg");
const CHOSEN = VARIANTS.find((v) => v.id === "D")!;

if (process.env.PROMOTE === "1") {
  const { copyFileSync, existsSync } = await import("node:fs");
  if (existsSync(PUBLIC_SVG)) {
    copyFileSync(PUBLIC_SVG, join(OUT, "_previous-public-favicon.svg"));
  }
  writeFileSync(PUBLIC_SVG, svgFor(CHOSEN));
  console.log(`\nPROMOTED variant ${CHOSEN.id} (fill ${CHOSEN.fill}, sw ${CHOSEN.sw}) -> public/favicon.svg`);
  console.log(`previous kept at ${join(OUT, "_previous-public-favicon.svg")}`);
} else {
  console.log(`\nnothing promoted. re-run with PROMOTE=1 to write variant ${CHOSEN.id} to public/favicon.svg`);
}
