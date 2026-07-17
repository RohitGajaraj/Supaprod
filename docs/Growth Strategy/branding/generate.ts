// Supaprod brand-kit generator (founder-directed, 2026-07-14). Emits every form
// of the CadenceMark as standalone SVGs from the SAME parametric curve the app
// renders (src/components/cadence/CadenceMark.tsx), so the kit can never drift
// from the product. Run:  bun "docs/Growth Strategy/branding/generate.ts"
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOGO = join(HERE, "logo");
mkdirSync(LOGO, { recursive: true });

// --- Brand palette (canonical hex; mirrors the app design tokens) -----------
const C = {
  ember: "#FF6B2C",
  emberHi: "#FFD9C2",
  emberLo: "#C24E1E",
  blue: "#3E63DD",
  gold: "#E8B44C",
  silverHi: "#EDEDED",
  silverLo: "#8A8A93",
  graphiteHi: "#1A1A1A",
  graphiteLo: "#565660",
  white: "#FFFFFF",
  black: "#111111",
  bgDark: "#0A0A0A",
  bgLight: "#FFFFFF",
};

// --- The mark curve: seven-petal epitrochoid (R=7, r=1, d=3) -----------------
const R = 7,
  r = 1,
  d = 3,
  K = (R - r) / r,
  MAX = R - r + d;
function buildPath(steps = 240, pad = 10): string {
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
const PATH = buildPath();

// --- Builders ---------------------------------------------------------------
type Spiral = { kind: "grad"; a: string; b: string } | { kind: "solid"; color: string };

function markInner(o: {
  spiral: Spiral;
  mono?: string; // if set, core is a solid disc of this color (mono variants)
  glow?: string | null;
  animated?: boolean;
  sw?: number;
}): string {
  const sw = o.sw ?? 3.2;
  const stroke = o.spiral.kind === "grad" ? "url(#spiral)" : o.spiral.color;
  const defs: string[] = [];
  if (o.spiral.kind === "grad") {
    defs.push(
      `<linearGradient id="spiral" x1="15%" y1="0%" x2="85%" y2="100%"><stop offset="0%" stop-color="${o.spiral.a}"/><stop offset="52%" stop-color="${o.spiral.b}"/><stop offset="100%" stop-color="${o.spiral.a}"/></linearGradient>`,
    );
  }
  if (!o.mono) {
    defs.push(
      `<radialGradient id="core" cx="42%" cy="36%" r="72%"><stop offset="0%" stop-color="${C.emberHi}"/><stop offset="56%" stop-color="${C.ember}"/><stop offset="100%" stop-color="${C.emberLo}"/></radialGradient>`,
    );
  }
  if (o.glow) {
    defs.push(
      `<filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="${o.glow}" flood-opacity="0.55"/></filter>`,
      `<filter id="coreglow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="${C.ember}" flood-opacity="0.6"/></filter>`,
    );
  }
  const spinAnim = o.animated
    ? `<animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="18s" repeatCount="indefinite"/>`
    : "";
  const spiralGroup = `<g${o.glow ? ' filter="url(#glow)"' : ""}><path d="${PATH}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>${spinAnim}</g>`;

  const emberR = o.animated
    ? `<animate attributeName="r" values="6.2;6.9;6.2" dur="3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>`
    : "";
  const goldR = o.animated
    ? `<animate attributeName="r" values="2.15;2.5;2.15" dur="3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>`
    : "";
  const core = o.mono
    ? `<circle cx="50" cy="50" r="6.2" fill="${o.mono}"/>`
    : `<g${o.glow ? ' filter="url(#coreglow)"' : ""}><circle cx="50" cy="50" r="6.2" fill="url(#core)">${emberR}</circle><circle cx="50" cy="50" r="2.15" fill="${C.gold}">${goldR}</circle></g>`;

  return `<defs>${defs.join("")}</defs>${spiralGroup}${core}`;
}

function svg(inner: string, size = 512, extra = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" fill="none">${extra}${inner}</svg>\n`;
}

const SILVER: Spiral = { kind: "grad", a: C.silverHi, b: C.silverLo };
const GRAPHITE: Spiral = { kind: "grad", a: C.graphiteHi, b: C.graphiteLo };
const GRAD: Spiral = { kind: "grad", a: C.ember, b: C.blue };

// --- Emit the marks ---------------------------------------------------------
const files: Record<string, string> = {
  "supaprod-mark-dark.svg": svg(markInner({ spiral: SILVER, glow: C.white })),
  "supaprod-mark-light.svg": svg(markInner({ spiral: GRAPHITE, glow: null })),
  "supaprod-mark-gradient.svg": svg(markInner({ spiral: GRAD, glow: C.ember })),
  "supaprod-mark-mono-white.svg": svg(
    markInner({ spiral: { kind: "solid", color: C.white }, mono: C.white }),
  ),
  "supaprod-mark-mono-black.svg": svg(
    markInner({ spiral: { kind: "solid", color: C.black }, mono: C.black }),
  ),
  "supaprod-mark-animated.svg": svg(markInner({ spiral: SILVER, glow: C.white, animated: true })),
};

// Lockup: mark + wordmark (240x72 canvas).
function lockup(spiral: Spiral, glow: string | null, textColor: string): string {
  const inner = markInner({ spiral, glow });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 72" width="480" height="144" fill="none"><g transform="translate(2,4) scale(0.64)">${inner}</g><text x="78" y="45" font-family="Geist, Inter, system-ui, sans-serif" font-size="30" font-weight="600" letter-spacing="-0.5" fill="${textColor}">Supaprod</text></svg>\n`;
}
files["supaprod-lockup-dark.svg"] = lockup(SILVER, C.white, C.silverHi);
files["supaprod-lockup-light.svg"] = lockup(GRAPHITE, null, C.black);

// App icons: rounded square + centered mark (scaled to ~64% for clear space).
function appIcon(bg: string, spiral: Spiral, glow: string | null): string {
  const inner = markInner({ spiral, glow });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none"><rect width="512" height="512" rx="114" fill="${bg}"/><g transform="translate(92,92) scale(3.28)">${inner}</g></svg>\n`;
}
files["supaprod-appicon-dark.svg"] = appIcon(C.bgDark, GRAD, C.ember);
files["supaprod-appicon-light.svg"] = appIcon(C.bgLight, GRAPHITE, null);

// Favicon: compact gradient mark on transparent, bolder stroke for tiny sizes.
files["supaprod-favicon.svg"] = svg(markInner({ spiral: GRAD, glow: null, sw: 4 }), 32);

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(LOGO, name), content);
}
console.log(`Wrote ${Object.keys(files).length} brand files to ${LOGO}`);
