/**
 * F-140: AA IS ARITHMETIC, SO IT SHOULD BE A TEST.
 *
 * S4 reported `--mrd-mute` at 4.43:1 on the station strip, missing AA by 0.07
 * across 12 elements on 6 surfaces, and proposed a one-hundredth nudge to its
 * lightness. Meridian is S0's, so that change was mine to make.
 *
 * **I could not reproduce the number and did not make the change.** From the
 * tokens themselves it is 7.10:1 on the strip's actual ground, and it clears AA
 * against every plausible ground in both themes. There is no opacity on the
 * strip's elements and the token is declared in exactly three places.
 *
 * That leaves a real open question — their tool measured the RENDERED product
 * and I measured the SOURCE — and the useful response to a disagreement like
 * that is an instrument both sides can point at, rather than one side editing a
 * product-wide token on the other's number.
 *
 * ── WHAT THIS GUARDS ───────────────────────────────────────────────────────
 * Every Meridian token used as text, against every ground it is drawn on, in
 * BOTH themes. It reads the real declarations out of `meridian.css`, so it
 * cannot drift from what ships, and it fails the build on any future nudge that
 * drops one below AA.
 *
 * S4's own caveat is the reason the light theme is in here: their sweep was
 * dark-theme only, one browser, and they noted S3 shipped a fix reading 4.10 in
 * dark that would have been about 3.8 for a light-theme viewer. **A contrast
 * check that only sees one theme is half a check**, and this half costs nothing.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { AA_NORMAL_TEXT, contrastRatio, oklchToSrgb, type Oklch } from "@/lib/contrast";

const CSS = readFileSync(fileURLToPath(new URL("../styles/meridian.css", import.meta.url)), "utf8");

/**
 * Every `--mrd-x: oklch(...)` declaration, per selector block.
 *
 * Read from the file rather than copied, because a table of token values in a
 * test is a second source of truth that goes stale silently — which is the
 * class of defect this session has spent the night removing.
 */
function tokensIn(selector: string): Map<string, Oklch> {
  const start = CSS.indexOf(`${selector} {`);
  expect(start, `selector ${selector} not found in meridian.css`).toBeGreaterThan(-1);
  const block = CSS.slice(start, CSS.indexOf("\n}", start));
  const out = new Map<string, Oklch>();
  for (const m of block.matchAll(
    /--(mrd-[a-z0-9-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g,
  )) {
    out.set(`--${m[1]}`, { l: Number(m[2]), c: Number(m[3]), h: Number(m[4]) });
  }
  return out;
}

const DARK = tokensIn(":root");
const LIGHT = tokensIn('[data-theme="light"]');

/** Text tokens, and the grounds a surface actually draws them on. */
const TEXT = ["--mrd-ink", "--mrd-mute", "--mrd-faint"] as const;
const GROUNDS = ["--mrd-bg", "--mrd-sink", "--mrd-sheet", "--mrd-lift"] as const;

const themes: Array<[string, Map<string, Oklch>]> = [
  ["dark", DARK],
  // The light block overrides only what it redefines, so anything it does not
  // restate keeps the dark value. Merged the same way the cascade does it.
  ["light", new Map([...DARK, ...LIGHT])],
];

describe("the instrument agrees with a known answer", () => {
  it("black on white is 21:1", () => {
    expect(contrastRatio({ l: 0, c: 0, h: 0 }, { l: 1, c: 0, h: 0 })).toBeCloseTo(21, 0);
  });

  it("a colour against itself is 1:1", () => {
    const c = { l: 0.5, c: 0.1, h: 70 };
    expect(contrastRatio(c, c)).toBeCloseTo(1, 5);
  });

  it("it is order-independent, because a ratio is a property of the pair", () => {
    const a = { l: 0.2, c: 0.01, h: 70 };
    const b = { l: 0.9, c: 0.01, h: 70 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });

  it("oklch survives the round trip into sRGB", () => {
    const [r, g, b] = oklchToSrgb({ l: 0.7, c: 0.006, h: 70 });
    for (const ch of [r, g, b]) {
      expect(ch).toBeGreaterThanOrEqual(0);
      expect(ch).toBeLessThanOrEqual(1);
    }
  });
});

describe("the scan covers something", () => {
  it("both theme blocks were found and parsed", () => {
    expect(DARK.size).toBeGreaterThan(10);
    expect(LIGHT.size).toBeGreaterThan(5);
  });

  it("and every token this test names actually exists", () => {
    for (const [name, tokens] of themes) {
      for (const t of [...TEXT, ...GROUNDS]) {
        expect(tokens.has(t), `${t} missing in ${name}`).toBe(true);
      }
    }
  });
});

describe("THE PROPERTY: every text token clears AA on every ground it is drawn on", () => {
  for (const [themeName, tokens] of themes) {
    for (const text of TEXT) {
      for (const ground of GROUNDS) {
        it(`${themeName}: ${text} on ${ground}`, () => {
          const ratio = contrastRatio(tokens.get(text)!, tokens.get(ground)!);
          expect(
            ratio,
            `${text} on ${ground} in ${themeName} is ${ratio.toFixed(2)}:1, under the ${AA_NORMAL_TEXT} AA bar for normal text`,
          ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        });
      }
    }
  }
});

describe("the specific claim that prompted this", () => {
  it("--mrd-mute on the station strip's ground clears AA comfortably", () => {
    // `.sp-strip { background: var(--mrd-sheet) }`, and `.sp-stage-n` and
    // `.sp-stage-state` both draw `color: var(--mrd-mute)` with no opacity.
    const r = contrastRatio(DARK.get("--mrd-mute")!, DARK.get("--mrd-sheet")!);
    expect(r).toBeGreaterThan(6.5);
  });
});
