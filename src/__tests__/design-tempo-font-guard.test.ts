import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// Regression guard for DESIGN-TEMPO.md SS3's "known footgun" (2026-07-11): a
// literal retired-font string quietly won the CSS cascade in a legacy
// [data-obsidian] block for months before anyone noticed. This test scans
// every source file for the retired faces so that class of bug fails CI
// instead of shipping silently. Extend BANNED_FACES if a new face retires.

const SRC_ROOT = join(import.meta.dir, "..");
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
const SKIP_DIRS = new Set(["__tests__", "node_modules", "fonts"]);

// Word pieces joined by \s or + so both CSS ("Schibsted Grotesk") and
// Google-Fonts URL ("Schibsted+Grotesk") spellings are caught.
const BANNED_FACES: Array<{ name: string; pattern: RegExp }> = [
  { name: "Newsreader", pattern: /Newsreader/ },
  { name: "Schibsted Grotesk", pattern: /Schibsted[\s+]Grotesk/ },
  // IBM Plex Mono is NOT banned. It was retired by Tempo v5, then re-adopted
  // by the 2026-07-29 rebuild as the one mono face for every number,
  // duration, count, diff, identifier and timestamp. It is declared,
  // self-hosted and documented in src/styles/ink.css ("--sp-font-mono"),
  // with the woff2 files in public/fonts/plex/. Re-banning it would fail the
  // build on the live design system.
  //
  // JetBrains Mono is NOT banned either, as of 2026-08-15, and it is worth
  // saying why rather than just deleting the row. It was on this list because
  // TEMPO V5 retired it. Tempo v5 has itself been retired — every prior design
  // system was, on 2026-08-14 — so the ban was a rule with no live system
  // behind it, and it outlived the thing it was protecting.
  //
  // It is now the ADOPTED mono face of Meridian, on a founder ruling of
  // 2026-08-15 to take beautifului.dev's typography across the whole app. It is
  // declared and self-hosted exactly like Plex: see the @font-face block in
  // src/styles/meridian.css ("--mrd-mono"), the woff2 in
  // public/fonts/jetbrains/, and the OFL note beside it.
  //
  // THE GUARD ITSELF IS STILL RIGHT. The footgun it was written for — a
  // literal font string quietly winning the cascade in a legacy block for
  // months — is real and unchanged. Only the membership of the list moved.
  // Add a face here when a face genuinely retires; do not add one back on the
  // authority of a ruling from a system that no longer exists.
  { name: "Codystar", pattern: /Codystar/ },
  { name: "Caveat", pattern: /Caveat/ },
  { name: "Silkscreen", pattern: /Silkscreen/ },
];

// Strip comments before scanning: styles.css and this file's own docs
// legitimately name the retired faces to document that they're banned.
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "") // /* block comments */ (CSS + TS)
    .replace(/^\s*\/\/.*$/gm, ""); // // line comments (TS)
}

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, out);
    } else if (
      SCAN_EXTENSIONS.has(extname(entry)) &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".test.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

describe("Tempo v5 font guardrail (DESIGN-TEMPO.md SS3)", () => {
  const files = collectFiles(SRC_ROOT);

  it("scans at least the known font-bearing files (sanity check the walker works)", () => {
    expect(files.some((f) => f.endsWith("styles.css"))).toBe(true);
  });

  // Positive control: verify the scanner actually catches banned fonts, not just
  // that the codebase happens to be clean. Tests the scanner logic itself.
  describe("positive control — fixture injection", () => {
    it("detects Newsreader when present in test fixture", () => {
      const testCode = `
        /* This comment mentions Newsreader but should be stripped */
        const fontName = "Newsreader";
        font-family: Newsreader, serif;
      `;
      const stripped = stripComments(testCode);
      expect(/Newsreader/.test(stripped)).toBe(true);
    });

    it("strips block comments and then detects injected Schibsted Grotesk", () => {
      const testCode = `
        /* font-family: Schibsted Grotesk */ comment mentions it
        /* font-family: Schibsted+Grotesk */ comment mentions it with plus
        const realUse = "Schibsted Grotesk"; // This line mentions it
      `;
      const stripped = stripComments(testCode);
      // After stripping comments, the const line should remain and match the pattern
      expect(/Schibsted[\s+]Grotesk/.test(stripped)).toBe(true);
    });

    it("verifies stripComments removes //-style line comments", () => {
      const testCode = `
        // line comment with Newsreader banned
        const x = "Newsreader"; // another comment with it
        const y = "safe";
      `;
      const stripped = stripComments(testCode);
      // The "safe" line should be intact, comments should be gone
      expect(stripped).toContain('const y = "safe"');
      // Line comments should be gone
      expect(stripped).not.toContain("line comment with Newsreader banned");
    });

    it("verifies stripComments removes /* */ block comments", () => {
      const testCode = `/* start */ const x = "real"; /* Newsreader here */`;
      const stripped = stripComments(testCode);
      expect(stripped).toContain('const x = "real"');
      expect(stripped).not.toContain("Newsreader");
    });
  });

  for (const face of BANNED_FACES) {
    it(`never reintroduces the retired "${face.name}" face outside comments`, () => {
      const offenders: string[] = [];
      for (const file of files) {
        const raw = readFileSync(file, "utf-8");
        const code = stripComments(raw);
        if (face.pattern.test(code)) {
          offenders.push(file.replace(SRC_ROOT, "src"));
        }
      }
      expect(offenders).toEqual([]);
    });
  }
});
