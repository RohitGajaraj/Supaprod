// Supaprod brand-kit generator (founder-directed, 2026-07-14). Emits every form
// of the SupaprodMark as standalone SVGs from the SAME parametric curve the app
// renders (src/components/supaprod/SupaprodMark.tsx), so the kit can never drift
// from the product. Run:  bun "docs/growth/branding/generate.ts"
//
// The geometry, palette and builders live in ./mark.ts (extracted 2026-08-05) so
// the raster stage in ./generate-social.ts draws the mark from this same source
// rather than from a hand-made export that silently goes stale.
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { C, markInner, svg, lockup, appIcon, faviconMark, SILVER, GRAPHITE } from "./mark.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOGO = join(HERE, "logo");
mkdirSync(LOGO, { recursive: true });

// --- Emit the marks ---------------------------------------------------------
const files: Record<string, string> = {
  "supaprod-mark-dark.svg": svg(markInner({ spiral: SILVER, glow: C.white })),
  "supaprod-mark-light.svg": svg(markInner({ spiral: GRAPHITE, glow: null })),
  "supaprod-mark-mono-white.svg": svg(
    markInner({ spiral: { kind: "solid", color: C.white }, mono: C.white }),
  ),
  "supaprod-mark-mono-black.svg": svg(
    markInner({ spiral: { kind: "solid", color: C.black }, mono: C.black }),
  ),
  "supaprod-mark-animated.svg": svg(markInner({ spiral: SILVER, glow: C.white, animated: true })),
};

files["supaprod-lockup-dark.svg"] = lockup(SILVER, C.white, C.silverHi);
files["supaprod-lockup-light.svg"] = lockup(GRAPHITE, null, C.black);

// The app icon is the mark on its ground: WHITE spiral, ember core, gold bead.
// It used to be the ember-to-blue gradient, which read violet and matched
// nothing the product actually renders. Founder ruling 2026-08-05.
files["supaprod-appicon-dark.svg"] = appIcon(C.bgDark, SILVER, null);
files["supaprod-appicon-light.svg"] = appIcon(C.bgLight, GRAPHITE, null);

// Favicons: the hand-tuned small-size treatment (see faviconMark in ./mark.ts).
// The adaptive one flips its stroke with the browser theme; the explicit dark
// and light variants exist for contexts that cannot run a media query.
files["supaprod-favicon.svg"] = faviconMark("adaptive");
files["supaprod-favicon-dark.svg"] = faviconMark(C.silverHi);
files["supaprod-favicon-light.svg"] = faviconMark(C.black);

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(LOGO, name), content);
}
console.log(`Wrote ${Object.keys(files).length} brand files to ${LOGO}`);
