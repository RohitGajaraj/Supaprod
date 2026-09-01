/**
 * The mark on a transparent ground, for surfaces that supply their own colour.
 *
 * WHY THIS IS A SEPARATE ASSET. Every mark in public/ carries its OWN ground:
 * apple-touch-icon and icon-192 are a dark rounded tile, the favicon is a dark
 * disc. That is correct for an app icon, whose ground is unknown, and wrong for
 * an email band whose ground we chose. Dropping the dark tile onto the ember
 * band puts a near-black square on orange, which is what the founder flagged on
 * 2026-08-07: the logo has to answer to the background behind it.
 *
 * Two files, because there are two grounds and one asset cannot serve both:
 *
 *   mark-white.png     white mark, transparent. For the ember band and any dark
 *                      ground. Ember is dark enough (#C24E1E) that white reads.
 *   mark-graphite.png  dark mark, transparent. For a white or near-white ground,
 *                      where a white mark would disappear entirely.
 *
 * RENDERED AT 3x the display size. The email draws these at 34 CSS pixels and a
 * modern phone is a 3x display, so 102px is the smallest size that is not soft.
 * They are small files; there is no reason to be tight about it.
 *
 * COMMITTED WITH `git add -f`. .gitignore carries a blanket `*.png`, which is
 * exactly how icon-192 and icon-512 came to 404 in production while sitting
 * happily on one laptop, and how the first branded email shipped a broken image.
 * If you add an asset here, force-add it AND curl it after the deploy.
 *
 * Run:  bun docs/growth/branding/generate-email-marks.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { markInner, SILVER, GRAPHITE } from "./mark.ts";

const PUBLIC = join(import.meta.dir, "..", "..", "..", "public");
const SIZE = 102; // 34 CSS px at 3x

/** The bare mark in a 100-unit box with NO ground behind it. sw 7 matches the
 *  favicon's re-pitched weight, which is the value mark.ts calls crisp. */
function bare(spiral: Parameters<typeof markInner>[0]["spiral"], id: string): string {
  const inner = markInner({ spiral, glow: null, sw: 7, coreGlow: true, idSuffix: id });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${SIZE}" height="${SIZE}" fill="none">` +
    `${inner}</svg>\n`
  );
}

for (const [name, spiral, id] of [
  ["mark-white", SILVER, "w"],
  ["mark-graphite", GRAPHITE, "g"],
] as const) {
  const svg = bare(spiral, id);
  writeFileSync(join(PUBLIC, `${name}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 600 })
    .resize(SIZE, SIZE)
    .png()
    .toFile(join(PUBLIC, `${name}.png`));
  console.log(`${name}.png + .svg  ${SIZE}x${SIZE}`);
}

console.log("\nNow: git add -f public/mark-white.* public/mark-graphite.*");
console.log("Then after deploy: curl -I https://supaprod.ai/mark-white.png");

/* --- The band texture ------------------------------------------------------
 * Sparse white pixel-squares, tileable, very low opacity. The founder asked for
 * "random pattern, disappearing white lines" after Cloudflare's pixel-map hero.
 *
 * WHY THIS IS SAFE TO ADD, which is the only reason it is here. A tiled
 * `background` on a <td> is honoured by a good share of clients and ignored by
 * the rest, and Outlook needs VML it will not get. But `bgcolor` stays underneath
 * as the fallback, so the WORST case is the flat ember band we already shipped
 * and the best case is a texture. A change that cannot look worse than its own
 * absence needs no further justification.
 *
 * DELIBERATELY BARELY THERE, 5 to 9 percent white. It has to survive being tiled
 * behind 23px headline text without competing with it, and a pattern that a
 * reader NOTICES behind body copy is a pattern that has failed. Deterministic
 * placement (a fixed hash, no Math.random) so the file is byte-identical on every
 * run and does not churn the repo.
 */
const TILE = 160;
const cells: string[] = [];
let seed = 20260807;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let y = 0; y < TILE; y += 8) {
  for (let x = 0; x < TILE; x += 8) {
    const r = rnd();
    // Denser toward the top-right, so the band has a direction rather than
    // reading as uniform noise. Same instinct as the reference image.
    const bias = (x / TILE) * 0.5 + (1 - y / TILE) * 0.5;
    if (r < 0.1 + bias * 0.22) {
      const o = (0.05 + rnd() * 0.04).toFixed(3);
      cells.push(`<rect x="${x}" y="${y}" width="4" height="4" fill="#fff" opacity="${o}"/>`);
    }
  }
}
const tile =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">` +
  cells.join("") +
  `</svg>\n`;
writeFileSync(join(PUBLIC, "email-band-texture.svg"), tile);
await sharp(Buffer.from(tile), { density: 144 })
  .resize(TILE, TILE)
  .png()
  .toFile(join(PUBLIC, "email-band-texture.png"));
console.log(`email-band-texture.png  ${TILE}x${TILE}, ${cells.length} squares`);
