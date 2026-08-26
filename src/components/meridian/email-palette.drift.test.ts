/**
 * THE EMAIL PALETTE CANNOT DRIFT FROM THE SHEET (S0, 2026-08-26).
 *
 * ── WHY THIS EXISTS, AND IT IS THE ONLY THING S0 ADDED TO S3'S MODULE ──────
 * `email-palette.ts` copies four `--mrd-*` values out of `meridian.css` as
 * `[L, C, H]` triples, because email clients strip CSS custom properties and a
 * token cannot travel into an email. That copy is correct today — every triple
 * was checked byte-for-byte before the module was promoted.
 *
 * It stays correct only if somebody remembers. S3's module says so in a comment:
 * *"IF YOU CHANGE ONE TOKEN THERE, CHANGE IT HERE IN THE SAME COMMIT."*
 *
 * **That is prose, and prose is what failed all day.** F-74 is this repo's own
 * record of a rule that held only half the time until it was made mechanical.
 * F-76 asked a schema nobody had re-read. F-80's "nobody imports run-rows" was
 * fixed and never updated. F-81's connector count went stale inside a day, and
 * S4 caught it. Every one of them was true when written.
 *
 * So the sync is a test rather than a sentence. **Change a token in
 * `meridian.css` and this fails, naming the export that went stale.**
 *
 * ── WHY IT READS THE LIGHT GROUND ──────────────────────────────────────────
 * `meridian.css` declares these tokens twice: the default block is the DARK
 * ground, and `[data-theme="light"]` re-declares them. **An email renders on
 * white**, so the light values are the correct source and the dark ones would be
 * invisible ink on paper. S3 got this right; the test pins it so the next reader
 * cannot "fix" it toward the wrong block.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { EMAIL_PALETTE_PROVENANCE } from "./email-palette";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const SHEET = read("../../styles/meridian.css");
const MODULE = read("./email-palette.ts");

/**
 * The LAST declaration of a token in the sheet, which is the light-ground one:
 * `[data-theme="light"]` re-declares after the dark default, so the final match
 * wins in both CSS and here.
 */
function lightGroundValue(token: string): { l: number; c: number; h: number; alpha: number | null } {
  const re = new RegExp(
    `${token}:\\s*oklch\\(\\s*([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)\\s*(?:/\\s*([0-9.]+)\\s*)?\\)`,
    "g",
  );
  const all = [...SHEET.matchAll(re)];
  expect(all.length, `${token} not found in meridian.css`).toBeGreaterThan(0);
  const m = all[all.length - 1]!;
  return {
    l: Number(m[1]),
    c: Number(m[2]),
    h: Number(m[3]),
    alpha: m[4] === undefined ? null : Number(m[4]),
  };
}

/** The triples the module actually holds, read from its own source. */
function moduleTriple(constName: string): { l: number; c: number; h: number } {
  const re = new RegExp(
    `const ${constName}: Token = \\{[^}]*l:\\s*([0-9.]+),\\s*c:\\s*([0-9.]+),\\s*h:\\s*([0-9.]+)`,
  );
  const m = MODULE.match(re);
  expect(m, `${constName} triple not found in email-palette.ts`).toBeTruthy();
  return { l: Number(m![1]), c: Number(m![2]), h: Number(m![3]) };
}

const PAIRS: Array<[string, string]> = [
  ["INK", "--mrd-ink"],
  ["BODY", "--mrd-body"],
  ["MUTE", "--mrd-mute"],
  ["LINE", "--mrd-line"],
];

describe("every triple still equals the token it names", () => {
  for (const [constName, token] of PAIRS) {
    it(`${constName} matches ${token} on the light ground`, () => {
      const sheet = lightGroundValue(token);
      const mod = moduleTriple(constName);
      // Named in the failure message so a drift says WHICH export went stale.
      expect(mod.l, `${constName}.l drifted from ${token}`).toBe(sheet.l);
      expect(mod.c, `${constName}.c drifted from ${token}`).toBe(sheet.c);
      expect(mod.h, `${constName}.h drifted from ${token}`).toBe(sheet.h);
    });
  }

  it("the line alpha still matches the token's own alpha", () => {
    const sheet = lightGroundValue("--mrd-line");
    expect(sheet.alpha).not.toBeNull();
    const m = MODULE.match(/const LINE_ALPHA = ([0-9.]+)/);
    expect(m).toBeTruthy();
    expect(Number(m![1]), "LINE_ALPHA drifted from --mrd-line's alpha").toBe(sheet.alpha!);
  });
});

describe("the module stays the kind of file it claims to be", () => {
  it("carries no colour literal, so the ratchet counts it at zero without an exemption", () => {
    /*
     * COMMENTS STRIPPED FIRST, and that is not a loophole — it is the third time
     * today a text guard matched its own explanation. This module's prose says
     * the email ground is "#fff by client default", which is a sentence about a
     * colour, not a colour in the code. The same blunt-grep mistake failed the
     * F-76 schema guard (which matched the comment naming the wrong column) and
     * the connector guard. **Read what the code DOES, not what it says about
     * itself.**
     */
    const code = MODULE.slice(MODULE.indexOf("function oklchToLinear"))
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(code).not.toMatch(/\brgba?\(/);
    expect(code).not.toMatch(/\bhsla?\(/);
  });

  it("every export declares the token it came from", () => {
    // Provenance is not decoration: it is how a reviewer checks the mapping
    // against the sheet instead of against a design file.
    for (const key of ["EMAIL_INK", "EMAIL_BODY", "EMAIL_MUTE", "EMAIL_LINE"]) {
      expect(EMAIL_PALETTE_PROVENANCE[key as keyof typeof EMAIL_PALETTE_PROVENANCE]).toContain(
        "--mrd-",
      );
    }
  });
});
