// The Supaprod mark, as one module.
//
// Extracted from generate.ts on 2026-08-05 so that BOTH the vector stage
// (generate.ts, emits SVG) and the raster stage (generate-social.ts, emits PNG
// via headless Chromium) draw from the same geometry. The raster stage used to
// be a one-time manual export, which is exactly why it froze in July with the
// old wordmark baked into its pixels while the SVGs stayed current.
//
// The curve itself mirrors src/components/supaprod/SupaprodMark.tsx.

// --- Brand palette (canonical hex; mirrors the app design tokens) -----------
export const C = {
  ember: "#FF6B2C",
  emberHi: "#FFD9C2",
  emberLo: "#C24E1E",
  gold: "#E8B44C",
  // Aligned to the PRODUCT on 2026-08-05, not chosen for the kit. These are the
  // resolved values of --text-primary and --text-subtle in src/styles.css, which
  // are what SupaprodMark.tsx actually strokes with. The kit previously used a
  // cooler #EDEDED / #8A8A93, so the mark on a social avatar was a slightly
  // different grey from the mark on the landing page.
  silverHi: "#f2f0ed",
  silverLo: "#7d786f",
  graphiteHi: "#1A1A1A",
  graphiteLo: "#565660",
  white: "#FFFFFF",
  black: "#111111",
  bgDark: "#0A0A0A",
  bgLight: "#FFFFFF",
} as const;

// --- The mark curve: seven-petal epitrochoid (R=7, r=1, d=3) -----------------
// Seven petals for the seven loop stations, drawn as one unbroken curve so the
// lifecycle reads as a single connected journey rather than seven marks.
const R = 7,
  r = 1,
  d = 3,
  K = (R - r) / r,
  MAX = R - r + d;

export function buildPath(steps = 240, pad = 10): string {
  const scale = (50 - pad) / MAX;
  let out = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const bx = (R - r) * Math.cos(t) + d * Math.cos(K * t);
    const by = (R - r) * Math.sin(t) - d * Math.sin(K * t);
    out += `${i === 0 ? "M" : "L"}${(50 + bx * scale).toFixed(2)} ${(50 + by * scale).toFixed(2)} `;
  }
  return out.trim() + " Z";
}

export const PATH = buildPath();

// --- The optical size ladder -------------------------------------------------
// A seven-petal thin-stroke curve mushes below roughly 64px: the petal gaps
// close up and it reads as a blob. Stroke weight therefore scales NON-linearly
// with render size, so the small mark is a deliberate drawing and not a shrunk
// one. Numbers set by rendering the ladder and looking at it, not derived.
export function strokeFor(px: number): number {
  if (px <= 16) return 6.4;
  if (px <= 24) return 5.6;
  if (px <= 32) return 5.0;
  if (px <= 48) return 4.4;
  if (px <= 64) return 4.0;
  if (px <= 128) return 3.6;
  return 3.2;
}

// Below this size the glow is dropped: at small render sizes a soft shadow
// fills the petal gaps and destroys the very legibility the ladder buys back.
export function glowAllowed(px: number): boolean {
  return px > 64;
}

// --- Builders ---------------------------------------------------------------
export type Spiral = { kind: "grad"; a: string; b: string } | { kind: "solid"; color: string };

// SOLID, not a gradient, and that is the product talking rather than taste.
// SupaprodMark.tsx line 130 strokes the mark with a single flat
// `var(--text-primary, #f2f0ed)`. The kit used to run a gradient that dipped to
// silver-lo at the 52% stop, so half of every curve sat at #7d786f, a dull warm
// grey. Beside the landing page the kit's mark read grey where the product's
// reads white. The founder described the product mark as "white white white
// lines" and he was reading it correctly.
export const SILVER: Spiral = { kind: "solid", color: C.silverHi };
export const GRAPHITE: Spiral = { kind: "solid", color: C.graphiteHi };

// THE EMBER-TO-BLUE GRADIENT IS GONE (founder ruling, 2026-08-05).
//
// The kit used to define GRAD as ember #FF6B2C to blue #3E63DD and used it for
// the app icon, the favicon and the "hero" mark. Blending those two passes
// through violet, and the founder rejected it on sight: the product does not
// look like that.
//
// He was right, and the evidence is in the product. SupaprodMark.tsx strokes
// with --text-primary through --text-subtle, which is white to warm grey. The
// string #3E63DD does not appear in the component at all. The blue lived only in
// this file, so every asset generated from it disagreed with the landing page a
// visitor had just been looking at.
//
// The mark is: a WHITE spiral, an ember core, a gold bead. One point of colour,
// which is also what the monochrome colour ruling in docs/design/DESIGN-SYSTEM.md
// asks for. There is no second brand colour to reach for.

export function markInner(o: {
  spiral: Spiral;
  mono?: string; // if set, core is a solid disc of this color (mono variants)
  glow?: string | null;
  /** Keep the ember core's bloom even when the spiral itself has no glow.
   *  The two were welded together, so switching the body glow off also killed
   *  the one lit thing in the mark. On an app icon that is exactly backwards:
   *  a white halo around white lines reads as fog, while the core's bloom is
   *  the whole point. Defaults to following `glow`. */
  coreGlow?: boolean;
  animated?: boolean;
  sw?: number;
  idSuffix?: string; // unique gradient ids when several marks share one document
}): string {
  const wantCoreGlow = o.coreGlow ?? Boolean(o.glow);
  const sw = o.sw ?? 3.2;
  const s = o.idSuffix ?? "";
  const stroke = o.spiral.kind === "grad" ? `url(#spiral${s})` : o.spiral.color;
  const defs: string[] = [];
  if (o.spiral.kind === "grad") {
    defs.push(
      `<linearGradient id="spiral${s}" x1="15%" y1="0%" x2="85%" y2="100%"><stop offset="0%" stop-color="${o.spiral.a}"/><stop offset="52%" stop-color="${o.spiral.b}"/><stop offset="100%" stop-color="${o.spiral.a}"/></linearGradient>`,
    );
  }
  if (!o.mono) {
    defs.push(
      `<radialGradient id="core${s}" cx="42%" cy="36%" r="72%"><stop offset="0%" stop-color="${C.emberHi}"/><stop offset="56%" stop-color="${C.ember}"/><stop offset="100%" stop-color="${C.emberLo}"/></radialGradient>`,
    );
  }
  if (o.glow || wantCoreGlow) {
    defs.push(
      `<filter id="glow${s}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="${o.glow}" flood-opacity="0.24"/></filter>`,
      `<filter id="coreglow${s}" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="${C.ember}" flood-opacity="0.6"/></filter>`,
    );
  }
  const spinAnim = o.animated
    ? `<animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="18s" repeatCount="indefinite"/>`
    : "";
  const spiralGroup = `<g${o.glow ? ` filter="url(#glow${s})"` : ""}><path d="${PATH}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>${spinAnim}</g>`;

  const emberR = o.animated
    ? `<animate attributeName="r" values="6.2;6.9;6.2" dur="3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>`
    : "";
  const goldR = o.animated
    ? `<animate attributeName="r" values="2.15;2.5;2.15" dur="3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>`
    : "";
  const core = o.mono
    ? `<circle cx="50" cy="50" r="6.2" fill="${o.mono}"/>`
    : `<g${wantCoreGlow ? ` filter="url(#coreglow${s})"` : ""}><circle cx="50" cy="50" r="6.2" fill="url(#core${s})">${emberR}</circle><circle cx="50" cy="50" r="2.15" fill="${C.gold}">${goldR}</circle></g>`;

  return `<defs>${defs.join("")}</defs>${spiralGroup}${core}`;
}

export function svg(inner: string, size = 512, extra = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" fill="none">${extra}${inner}</svg>\n`;
}

// Lockup: mark + wordmark (240x72 canvas).
export function lockup(spiral: Spiral, glow: string | null, textColor: string): string {
  const inner = markInner({ spiral, glow });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 72" width="480" height="144" fill="none"><g transform="translate(2,4) scale(0.64)">${inner}</g><text x="78" y="45" font-family="Geist, Inter, system-ui, sans-serif" font-size="30" font-weight="600" letter-spacing="-0.5" fill="${textColor}">Supaprod</text></svg>\n`;
}

// --- The favicon family: the optical ladder, discovered by hand --------------
// These three were authored by hand AFTER generate.ts, and generate.ts used to
// overwrite one of them with a thinner, worse version every time it ran. The
// hand-tuned treatment is reproduced here exactly so the generator emits it
// rather than destroying it.
//
// What the hand tuning actually does, and why each part earns its place at 32px:
//   pad 9 not 10   the mark fills more of the box, so it survives the browser's
//                  own downscale to 16px
//   stroke 4.6     a flat solid, not a gradient: at this size a gradient reads
//                  as uneven weight rather than as depth
//   core r 7       up from 6.2, so the ember centre stays a disc and not a dot
//   gold r 2.4     up from 2.15, same reason
//   no glow        a soft shadow fills the petal gaps and closes the drawing up
export function faviconMark(stroke: string | "adaptive"): string {
  const path = buildPath(240, 9);
  const adaptive = stroke === "adaptive";
  const style = adaptive
    ? `<style>.sp{stroke:${C.black}}@media (prefers-color-scheme:dark){.sp{stroke:${C.white}}}</style>`
    : "";
  const attrs = adaptive ? `class="sp" ` : "";
  const strokeAttr = adaptive ? "" : ` stroke="${stroke}"`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32" fill="none">` +
    `${style}<defs><radialGradient id="cr" cx="42%" cy="36%" r="72%">` +
    `<stop offset="0%" stop-color="${C.emberHi}"/><stop offset="56%" stop-color="${C.ember}"/>` +
    `<stop offset="100%" stop-color="${C.emberLo}"/></radialGradient></defs>` +
    `<path ${attrs}d="${path}" fill="none"${strokeAttr} stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="50" cy="50" r="7" fill="url(#cr)"/>` +
    `<circle cx="50" cy="50" r="2.4" fill="${C.gold}"/></svg>\n`
  );
}

// App icons: rounded square + centered mark (scaled to ~64% for clear space).
// This is the social avatar source: it carries its own ground, so it reads
// identically against a light platform UI and a dark one.
export function appIcon(bg: string, spiral: Spiral, glow: string | null, sw?: number): string {
  // coreGlow stays on regardless: the ember centre is the one lit thing.
  const inner = markInner({ spiral, glow, sw, coreGlow: true });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none"><rect width="512" height="512" rx="114" fill="${bg}"/><g transform="translate(92,92) scale(3.28)">${inner}</g></svg>\n`;
}
